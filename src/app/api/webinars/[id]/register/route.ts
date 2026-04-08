import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getVisitorTestGroup } from '@/lib/abTesting'
import { syncWebinarRegistrationToClickFunnels } from '@/lib/clickfunnels'
import { syncContactToMautic, tagMauticContact } from '@/lib/mautic'
import { scheduleDelayedClickFunnelsTag, scheduleDelayedMauticTag } from '@/lib/clickfunnelsReminderTags'
import { generateReferralCode } from '@/lib/referral'
import { sendFacebookRegistration, extractFacebookCookies } from '@/lib/facebook'
import { sendEmail } from '@/lib/email'
import { scheduleRemindersForRegistration } from '@/lib/reminders'

const runInBackground = (label: string, task: () => Promise<unknown> | unknown) => {
  Promise.resolve()
    .then(task)
    .catch(error => {
      console.error(`⚠️ ${label} failed (non-blocking):`, error)
    })
}

// CORS headers for cross-origin embed requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildRegistrationConfirmationEmail({
  attendeeName,
  webinarTitle,
  webinarTime,
  accessLink,
  countdownLink,
  calendarLink,
  referralLink,
}: {
  attendeeName: string
  webinarTitle: string
  webinarTime: string | null
  accessLink: string | null
  countdownLink: string | null
  calendarLink: string | null
  referralLink: string | null
}) {
  const safeName = escapeHtml(attendeeName)
  const safeTitle = escapeHtml(webinarTitle)
  const safeTime = webinarTime ? escapeHtml(webinarTime) : null
  const safeAccessLink = accessLink ? escapeHtml(accessLink) : null
  const safeCountdownLink = countdownLink ? escapeHtml(countdownLink) : null
  const safeCalendarLink = calendarLink ? escapeHtml(calendarLink) : null
  const safeReferralLink = referralLink ? escapeHtml(referralLink) : null

  const subject = `Registration confirmed: ${webinarTitle}`

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 640px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 28px; margin: 0 0 16px;">You're registered</h1>
      <p style="margin: 0 0 16px;">Hi ${safeName},</p>
      <p style="margin: 0 0 16px;">Your registration for <strong>${safeTitle}</strong> is confirmed.</p>
      ${safeTime ? `<p style="margin: 0 0 24px;"><strong>Your session time:</strong> ${safeTime}</p>` : ''}
      ${safeAccessLink ? `<p style="margin: 0 0 16px;"><a href="${safeAccessLink}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600;">Access your webinar</a></p>` : ''}
      ${safeCountdownLink ? `<p style="margin: 0 0 12px;">Countdown page: <a href="${safeCountdownLink}">${safeCountdownLink}</a></p>` : ''}
      ${safeCalendarLink ? `<p style="margin: 0 0 12px;">Add to calendar: <a href="${safeCalendarLink}">${safeCalendarLink}</a></p>` : ''}
      ${safeReferralLink ? `<p style="margin: 0 0 12px;">Referral link: <a href="${safeReferralLink}">${safeReferralLink}</a></p>` : ''}
      <p style="margin: 24px 0 0; color: #4b5563;">Keep this email for quick access before the webinar starts.</p>
    </div>
  `

  const textBody = [
    `Hi ${attendeeName},`,
    '',
    `Your registration for ${webinarTitle} is confirmed.`,
    webinarTime ? `Your session time: ${webinarTime}` : null,
    accessLink ? `Access your webinar: ${accessLink}` : null,
    countdownLink ? `Countdown page: ${countdownLink}` : null,
    calendarLink ? `Add to calendar: ${calendarLink}` : null,
    referralLink ? `Referral link: ${referralLink}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  return { subject, htmlBody, textBody }
}

// OPTIONS /api/webinars/[id]/register - Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

// POST /api/webinars/[id]/register - Public registration endpoint
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    const {
      name,
      email,
      phone,
      scheduleId,
      scheduledStartTime,
      timezone,
      gdprConsent,
      privacyConsent,
      marketingConsent,
      country,
      referralCode: referredByCode, // The referral code of who referred them
      splitTestId,
      variantId,
      leadPageId
    } = body

    console.log('REGISTER API BODY PAYLOAD:', {
        splitTestId,
        variantId,
        leadPageId,
        email
    });

    // Validation
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { 
          status: 400,
          headers: corsHeaders
        }
      )
    }

    if (!privacyConsent) {
      return NextResponse.json(
        { error: 'You must agree to the privacy policy' },
        { 
          status: 400,
          headers: corsHeaders
        }
      )
    }

    console.log('📝 Registration API - Received scheduledStartTime:', scheduledStartTime)

    // Verify webinar exists and get A/B testing config
    const webinar = await prisma.webinar.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        enableABTesting: true,
        trafficSplitPercent: true,
        // ClickFunnels Custom Tags
        registrationTag: true,
        attendedTag: true,
        mostlyAttendedTag: true,
        partlyAttendedTag: true,
        missedTag: true,
        replayAttendedTag: true,
        // CRM Integration
        crmIntegration: true,
      }
    })
    
    if (!webinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { 
          status: 404,
          headers: corsHeaders
        }
      )
    }

    // Get test group if A/B testing is enabled
    let testGroup: string | null = null
    if (webinar.enableABTesting) {
      testGroup = await getVisitorTestGroup(webinar.id, webinar.trafficSplitPercent)
    }

    // Generate unique referral code for this registration
    // Use timestamp + random to minimize collision checks
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    let uniqueReferralCode = `${timestamp}${random}`.toUpperCase().substring(0, 10);

    // Quick collision check (single attempt, very unlikely to collide with timestamp approach)
    const existingCode = await prisma.registration.findUnique({
      where: { referralCode: uniqueReferralCode },
      select: { id: true }
    });
    
    if (existingCode) {
      // Regenerate once if collision occurs (extremely rare)
      uniqueReferralCode = generateReferralCode();
    }

    // Validate referral code if provided (who referred them) - do this in background
    let referredBy: string | null = null;
    if (referredByCode) {
      // We'll validate this in background to not block registration
      // For now just store the code they provided
      referredBy = referredByCode;
    }

    // Note: Allowing multiple registrations per email
    // Users can register multiple times for the same webinar with the same email
    
    // Detect device from user agent
    const userAgentHeader = request.headers.get('user-agent') || '';
    const registrationDevice = userAgentHeader.includes('Mobile') || userAgentHeader.includes('Android') || userAgentHeader.includes('iPhone') 
      ? 'mobile' 
      : 'desktop';

    // Create registration
    const registration = await prisma.registration.create({
      data: {
        webinarId: id,
        scheduleId,
        scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : null,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        timezone,
        country,
        gdprConsent: gdprConsent || false,
        privacyConsent: privacyConsent || false,
        marketingConsent: marketingConsent || false,
        testGroup: testGroup, // Store test group for A/B testing
        splitTestId: splitTestId || null,
        splitTestVariantId: variantId || null,
        referralCode: uniqueReferralCode, // Their unique code to share
        referredBy: referredBy, // Who referred them
        registeredAt: new Date(),
        registrationDevice, // Track device used for registration
      }
    })

    console.log('✅ Registration created with scheduledStartTime:', registration.scheduledStartTime)

    // Capture visitor ID for analytics BEFORE sending response
    const visitorId = cookies().get('webinar_visitor_id')?.value;

    // ====== CRITICAL: ClickFunnels sync happens BEFORE response ======
    // This ensures the registration tag is applied immediately and not killed
    // by serverless function termination
    let schedule = null;
    if (scheduleId) {
      try {
        schedule = await prisma.webinarSchedule.findUnique({
          where: { id: scheduleId },
          select: { zoomLink: true, isZoomSession: true }
        });
      } catch (e) {
        console.error('Error fetching schedule', e);
      }
    }

    // Format times for ClickFunnels
    const formatInTimezone = (date: Date, timeZone: string) => {
      return new Intl.DateTimeFormat('en-US', {
        timeZone,
        dateStyle: 'full',
        timeStyle: 'long'
      }).format(date);
    };

    let formattedWebinarTime: string | null = null;
    let formattedLocalWebinarTime: string | null = null;
    let attendeeTimezoneLabel: string | null = null;
    
    if (registration.scheduledStartTime) {
      try {
        formattedWebinarTime = formatInTimezone(new Date(registration.scheduledStartTime), 'America/New_York');
      } catch (error) {
        console.error('Failed to format time for EST:', error);
      }

      const attendeeTimezone = registration.timezone || timezone;
      if (attendeeTimezone) {
        try {
          const userTime = formatInTimezone(new Date(registration.scheduledStartTime), attendeeTimezone);
          const [region, city] = attendeeTimezone.split('/');
          const cityLabel = city?.replace(/_/g, ' ') || attendeeTimezone;
          const regionLabel = region?.replace(/_/g, ' ');
          attendeeTimezoneLabel = regionLabel ? `${cityLabel}, ${regionLabel}` : cityLabel;
          formattedLocalWebinarTime = `${userTime}${attendeeTimezoneLabel ? ` (${attendeeTimezoneLabel})` : ''}`;
        } catch (error) {
          console.error('Failed to format attendee timezone time:', error);
        }
      }
    }

    if (!formattedLocalWebinarTime && formattedWebinarTime) {
      formattedLocalWebinarTime = formattedWebinarTime;
    }

    // Build links for ClickFunnels
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 
                    process.env.NEXTAUTH_URL || 
                    'https://emaanpowerclasses.com').replace(/\/+$/, ''); // Remove trailing slashes
    const countdownLink = webinar.slug 
      ? `${baseUrl}/countdown/${webinar.slug}?r=${registration.id}${scheduleId ? `&s=${scheduleId}` : ''}`
      : null;
    const referralLink = webinar.slug
      ? `${baseUrl}/w/${webinar.slug}?ref=${registration.referralCode}`
      : null;
    const calendarLink = webinar.slug
      ? `${baseUrl}/api/calendar/${webinar.slug}?r=${registration.id}${scheduleId ? `&s=${scheduleId}` : ''}`
      : null;
    const accessLink = schedule?.isZoomSession && schedule?.zoomLink
      ? schedule.zoomLink
      : countdownLink;

    // --- Confirmation Email (DB-template with tracking) ---
    try {
      const activeTemplate = await prisma.confirmationEmailTemplate.findFirst({
        where: { webinarId: id, isActive: true },
        orderBy: { createdAt: 'desc' },
      })

      // Build subject / html from DB template or use built-in fallback
      let emailSubject: string
      let emailHtml: string
      let emailText: string

      if (activeTemplate) {
        // Substitute placeholders in template
        const replacePlaceholders = (text: string) =>
          text
            .replace(/\{\{name\}\}/gi, escapeHtml(registration.name))
            .replace(/\{\{webinar_title\}\}/gi, escapeHtml(webinar.title))
            .replace(/\{\{webinar_time\}\}/gi, formattedLocalWebinarTime ? escapeHtml(formattedLocalWebinarTime) : '')
            .replace(/\{\{access_link\}\}/gi, accessLink || '')
            .replace(/\{\{countdown_link\}\}/gi, countdownLink || '')
            .replace(/\{\{calendar_link\}\}/gi, calendarLink || '')
            .replace(/\{\{referral_link\}\}/gi, referralLink || '')

        emailSubject = replacePlaceholders(activeTemplate.subject)
        emailHtml = replacePlaceholders(activeTemplate.htmlBody)
        emailText = emailHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

        // Create the send record BEFORE sending so we have an ID for tracking URLs
        const emailSendRecord = await prisma.confirmationEmailSend.create({
          data: {
            templateId: activeTemplate.id,
            registrationId: registration.id,
            to: registration.email,
            subject: emailSubject,
            status: 'SENT',
          },
        })

        const trackingBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://emaanpowerclasses.com').replace(/\/+$/, '')

        // Inject open-tracking pixel before closing </div> or </body> or at end
        const trackingPixel = `<img src="${trackingBaseUrl}/api/email-tracking/open/${emailSendRecord.id}?t=${Date.now()}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`
        if (emailHtml.includes('</div>')) {
          emailHtml = emailHtml.replace(/<\/div>\s*$/, `${trackingPixel}</div>`)
        } else {
          emailHtml += trackingPixel
        }

        // Wrap links with click tracker
        emailHtml = emailHtml.replace(
          /href="(https?:\/\/[^"]+)"/gi,
          (_match, url) => {
            const tracked = `${trackingBaseUrl}/api/email-tracking/click/${emailSendRecord.id}?url=${encodeURIComponent(url)}`
            return `href="${tracked}"`
          }
        )

        const emailSent = await sendEmail({
          to: registration.email,
          subject: emailSubject,
          htmlBody: emailHtml,
          textBody: emailText,
        })

        if (emailSent) {
          console.log(`✅ Confirmation email sent to ${registration.email} (send id: ${emailSendRecord.id})`)
        } else {
          await prisma.confirmationEmailSend.update({
            where: { id: emailSendRecord.id },
            data: { status: 'FAILED', errorMessage: 'sendEmail returned false' },
          })
          console.error(`⚠️ Confirmation email failed for ${registration.email}`)
        }
      } else {
        // Fallback to built-in template (no tracking)
        const fallback = buildRegistrationConfirmationEmail({
          attendeeName: registration.name,
          webinarTitle: webinar.title,
          webinarTime: formattedLocalWebinarTime,
          accessLink,
          countdownLink,
          calendarLink,
          referralLink,
        })
        emailSubject = fallback.subject
        emailHtml = fallback.htmlBody
        emailText = fallback.textBody

        const emailSent = await sendEmail({
          to: registration.email,
          subject: emailSubject,
          htmlBody: emailHtml,
          textBody: emailText,
        })

        if (emailSent) {
          console.log(`✅ Fallback confirmation email sent to ${registration.email}`)
        } else {
          console.error(`⚠️ Fallback confirmation email failed for ${registration.email}`)
        }
      }
    } catch (error: any) {
      console.error('⚠️ Failed to send confirmation email:', error)
    }

    // SYNC TO CRM IMMEDIATELY (registration tag applied here)
    const crmIntegration = webinar.crmIntegration || 'CLICKFUNNELS';
    
    if (crmIntegration === 'CLICKFUNNELS') {
      console.log('🚀 Syncing registration to ClickFunnels BEFORE response...');
      try {
        await syncWebinarRegistrationToClickFunnels({
          name: registration.name,
          email: registration.email,
          phone: registration.phone,
          timezone: registration.timezone,
          country: registration.country,
          webinarId: webinar.id,
          webinarTitle: webinar.title,
          scheduledStartTime: registration.scheduledStartTime,
          countdownLink: countdownLink,
          referralLink: referralLink,
          formattedWebinarTime: formattedWebinarTime,
          formattedWebinarTimeLocal: formattedLocalWebinarTime,
          attendeeTimezoneLabel,
          zoomLink: schedule?.zoomLink || undefined,
          isZoomSession: schedule?.isZoomSession || false,
          customTags: {
            registrationTag: webinar.registrationTag,
            attendedTag: webinar.attendedTag,
            mostlyAttendedTag: webinar.mostlyAttendedTag,
            partlyAttendedTag: webinar.partlyAttendedTag,
            missedTag: webinar.missedTag,
            replayAttendedTag: webinar.replayAttendedTag,
          }
        });
        console.log('✅ ClickFunnels sync completed - registration tag applied!');
      } catch (err) {
        console.error('❌ ClickFunnels sync error:', err);
        // Don't fail registration if CF sync fails - log and continue
      }
    } else if (crmIntegration === 'MAUTIC') {
      console.log('🚀 Syncing registration to Mautic BEFORE response...');
      try {
        // Format scheduled time in user-friendly way with their timezone
        let friendlyScheduledTime: string | undefined;
        if (registration.scheduledStartTime) {
          const userTimezone = registration.timezone || timezone || 'America/New_York';
          try {
            // Format: "8:00 PM, April 8, 2026"
            const dateFormatter = new Intl.DateTimeFormat('en-US', {
              timeZone: userTimezone,
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });
            const formattedDate = dateFormatter.format(new Date(registration.scheduledStartTime));
            
            // Get friendly timezone name (e.g., "Eastern Time", "India Time")
            const tzParts = userTimezone.split('/');
            const cityName = tzParts[tzParts.length - 1]?.replace(/_/g, ' ') || userTimezone;
            const regionName = tzParts.length > 1 ? tzParts[0].replace(/_/g, ' ') : '';
            
            // Map common regions to friendly names
            const friendlyTzNames: Record<string, string> = {
              'America/New_York': 'Eastern Time',
              'America/Chicago': 'Central Time',
              'America/Denver': 'Mountain Time',
              'America/Los_Angeles': 'Pacific Time',
              'America/Toronto': 'Eastern Time (Canada)',
              'America/Vancouver': 'Pacific Time (Canada)',
              'Europe/London': 'UK Time',
              'Europe/Paris': 'Central European Time',
              'Asia/Calcutta': 'India Time',
              'Asia/Kolkata': 'India Time',
              'Asia/Dubai': 'Gulf Time',
              'Asia/Singapore': 'Singapore Time',
              'Australia/Sydney': 'Sydney Time',
              'Australia/Melbourne': 'Melbourne Time',
              'Pacific/Auckland': 'New Zealand Time',
            };
            
            const friendlyTzName = friendlyTzNames[userTimezone] || `${cityName} Time`;
            friendlyScheduledTime = `${formattedDate} (${friendlyTzName})`;
          } catch (e) {
            console.error('Error formatting scheduled time:', e);
            friendlyScheduledTime = registration.scheduledStartTime.toISOString();
          }
        }
        
        // Build custom fields for Mautic
        const mauticCustomFields = {
          webinar_name: webinar.title,
          webinar_link: countdownLink || undefined,
          webinar_scheduled_time: friendlyScheduledTime,
          webinar_registration_date: registration.registeredAt.toISOString(),
          webinar_attendance_status: 'registered',
          webinar_referral_code: registration.referralCode || undefined,
        };
        
        // Debug log to see what values we have
        console.log('📋 Mautic customFields being sent:', JSON.stringify({
          webinar_title: webinar.title,
          countdownLink,
          scheduledStartTime: registration.scheduledStartTime,
          registeredAt: registration.registeredAt,
          referralCode: registration.referralCode,
          customFields: mauticCustomFields,
        }, null, 2));
        
        // Sync contact to Mautic with webinar custom fields
        await syncContactToMautic({
          email: registration.email,
          firstName: registration.name?.split(' ')[0] || null,
          lastName: registration.name?.split(' ').slice(1).join(' ') || null,
          phone: registration.phone,
          country: registration.country,
          timezone: registration.timezone,
          customFields: mauticCustomFields,
        });
        
        // Apply registration tag
        const registrationTag = webinar.registrationTag || 'UM-Webinar-Registered';
        await tagMauticContact(registration.email, [registrationTag]);
        console.log('✅ Mautic sync completed - registration tag applied!');
      } catch (err) {
        console.error('❌ Mautic sync error:', err);
        // Don't fail registration if Mautic sync fails - log and continue
      }
    } else {
      console.log('ℹ️ CRM integration disabled for this webinar');
    }

    // Apply timing reminder tag immediately as well (if needed)
    if (registration.scheduledStartTime && crmIntegration !== 'NONE') {
      const webinarStart = new Date(registration.scheduledStartTime);
      const now = new Date();
      const hoursUntilWebinar = (webinarStart.getTime() - now.getTime()) / (1000 * 60 * 60);

      const timingBuckets = [
        { tagName: '24HRREMINDER', offsetHours: 24 },
        { tagName: '2HRREMINDER', offsetHours: 2 },
        { tagName: '1HRREMINDER', offsetHours: 1 },
        { tagName: '15MINREMINDER', offsetHours: 0.25 },
        { tagName: 'WESTARTED', offsetHours: 0 }
      ] as const;

      const selectedBucket = timingBuckets.find(bucket => hoursUntilWebinar >= bucket.offsetHours) ?? timingBuckets[timingBuckets.length - 1];
      const scheduledFor = selectedBucket.offsetHours > 0
        ? new Date(webinarStart.getTime() - selectedBucket.offsetHours * 60 * 60 * 1000)
        : now;

      if (selectedBucket.offsetHours > 0 && scheduledFor > now) {
        try {
          if (crmIntegration === 'MAUTIC') {
            await scheduleDelayedMauticTag({
              registrationId: registration.id,
              tagName: selectedBucket.tagName,
              scheduledFor
            });
          } else {
            await scheduleDelayedClickFunnelsTag({
              registrationId: registration.id,
              tagName: selectedBucket.tagName,
              scheduledFor
            });
          }
          console.log(`⏰ Scheduled ${selectedBucket.tagName} for later`);
        } catch (err) {
          console.error(`Failed to schedule ${selectedBucket.tagName}:`, err);
        }
      } else {
        try {
          if (crmIntegration === 'MAUTIC') {
            await tagMauticContact(registration.email, [selectedBucket.tagName]);
          } else {
            const { applyReminderTagToContact } = await import('@/lib/clickfunnels');
            await applyReminderTagToContact(registration.email, selectedBucket.tagName);
          }
          console.log(`✅ Applied ${selectedBucket.tagName} immediately`);
        } catch (err) {
          console.error(`Failed to apply ${selectedBucket.tagName}:`, err);
        }
      }
    }
    // ====== END CRITICAL SECTION ======
    
    // Return success - ClickFunnels sync is complete
    const response = NextResponse.json(
      { 
        registrationId: registration.id,
        registration: {
          id: registration.id,
          name: registration.name,
          email: registration.email,
          referralCode: registration.referralCode
        },
        message: 'Registration successful! Check your email for confirmation.' 
      },
      { 
        status: 201,
        headers: corsHeaders
      }
    );

    // NON-CRITICAL integration work happens in background
    runInBackground('Post-registration integrations', async () => {
      // 1. Server-Side Split Test & Lead Page Tracking
      // More reliable than client-side beacons
      if (splitTestId && variantId) {
         try {
           await prisma.$transaction(async (tx) => {
              // 1. Update Variant
              const variant = await tx.splitTestVariant.update({
                  where: { id: variantId },
                  data: { conversions: { increment: 1 } },
                  select: { splitTestId: true, leadPageId: true }
              });
      
              // 2. Update Parent Split Test
              if (splitTestId) {
                   await tx.splitTest.update({
                      where: { id: splitTestId },
                      data: { conversions: { increment: 1 } }
                  });
              }
      
              // 3. Log Event
              await tx.splitTestEvent.create({
                  data: {
                      splitTestId: splitTestId || variant.splitTestId,
                      variantId: variantId,
                      type: 'CONVERSION',
                      visitorId: visitorId || null
                  }
              });
      
              // 4. Update Underlying Lead Page (if exists)
              if (variant.leadPageId) {
                  await tx.leadPage.update({
                      where: { id: variant.leadPageId },
                      data: { conversions: { increment: 1 } }
                  });
              }
          });
          console.log(`✅ Server-Tracking: Split Test conversion recorded for ${splitTestId}/${variantId}`);
         } catch(e) {
           console.error('Failed to track split test conversion on server', e);
         }
      } else if (leadPageId) {
         try {
            await prisma.leadPage.update({
                where: { id: leadPageId },
                data: { conversions: { increment: 1 } }
            });
            console.log(`✅ Server-Tracking: Lead page conversion recorded for ${leadPageId}`);
         } catch(e) {
            console.error('Failed to track lead page conversion on server', e);
         }
      }

      // Link page visit to registration for analytics
      try {
        const recentPageVisit = await prisma.pageVisit.findFirst({
          where: {
            webinarId: id,
            pageType: 'registration',
            registrationId: null,
            enteredAt: {
              gte: new Date(Date.now() - 30 * 60 * 1000)
            }
          },
          orderBy: {
            enteredAt: 'desc'
          }
        });

        if (recentPageVisit) {
          await prisma.pageVisit.update({
            where: { id: recentPageVisit.id },
            data: { registrationId: registration.id }
          });
        }
      } catch (error) {
        console.error('Failed to link registration to page visit:', error);
      }
      
      // Validate referral code in background
      if (referredByCode && referredBy) {
        const referrer = await prisma.registration.findUnique({
          where: { referralCode: referredByCode },
          select: { referralCode: true }
        });
        
        if (referrer) {
          // Update the registration with validated referral
          await prisma.registration.update({
            where: { id: registration.id },
            data: { referredBy: referrer.referralCode }
          });
          console.log(`🎁 Referral validated: New user referred by ${referredByCode}`);
        } else {
          // Invalid referral code, clear it
          await prisma.registration.update({
            where: { id: registration.id },
            data: { referredBy: null }
          });
        }
      }

      // Get IP address and user agent from request headers
      const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      const userAgent = request.headers.get('user-agent') || undefined;
      const cookieHeader = request.headers.get('cookie');
      const { fbc, fbp } = extractFacebookCookies(cookieHeader);
      const referer = request.headers.get('referer') || undefined;

      // Send event to Facebook Conversions API
      await sendFacebookRegistration({
        email: registration.email,
        name: registration.name,
        phone: registration.phone || undefined,
        ipAddress,
        userAgent,
        fbc,
        fbp,
        eventSourceUrl: referer,
        webinarId: webinar.id,
        webinarTitle: webinar.title,
        registrationId: registration.id,
        value: 0,
        currency: 'USD'
      }).catch(err => console.error('Facebook API error:', err));

      // Schedule email and SMS reminders (non-critical, can run in background)
      await scheduleRemindersForRegistration(registration.id)
        .catch(err => console.error('Failed to schedule reminders:', err));
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { 
        error: 'Registration failed',
        details: error.message 
      },
      { 
        status: 500,
        headers: corsHeaders
      }
    )
  }
}
