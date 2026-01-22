import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getVisitorTestGroup } from '@/lib/abTesting'
import { syncWebinarRegistrationToClickFunnels } from '@/lib/clickfunnels'
import { scheduleDelayedClickFunnelsTag } from '@/lib/clickfunnelsReminderTags'
import { generateReferralCode } from '@/lib/referral'
import { sendFacebookRegistration, extractFacebookCookies } from '@/lib/facebook'
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
        referralCode: uniqueReferralCode, // Their unique code to share
        referredBy: referredBy, // Who referred them
        registeredAt: new Date(),
        registrationDevice, // Track device used for registration
      }
    })

    console.log('✅ Registration created with scheduledStartTime:', registration.scheduledStartTime)

    // Capture visitor ID for analytics BEFORE sending response
    const visitorId = cookies().get('webinar_visitor_id')?.value;
    
    // Return success IMMEDIATELY - all non-critical work happens in background
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

    // ALL integration work happens in background - nothing blocks the user
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

      // Start: Fix for undefined 'schedule' error
      // Fetch schedule to get Zoom link if applicable
      let schedule = null;
      if (scheduleId) {
        try {
            schedule = await prisma.webinarSchedule.findUnique({
            where: { id: scheduleId },
            select: { zoomLink: true, isZoomSession: true }
            });
        } catch(e) { console.error('Error fetching schedule', e); }
      }
      // End: Fix
      
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

      // Build countdown page link
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                      process.env.NEXTAUTH_URL || 
                      'https://emaanpowerclasses.com';
      const countdownLink = webinar.slug 
        ? `${baseUrl}/countdown/${webinar.slug}?r=${registration.id}${scheduleId ? `&s=${scheduleId}` : ''}`
        : null;

      // Build referral link
      const referralLink = webinar.slug
        ? `${baseUrl}/w/${webinar.slug}?ref=${registration.referralCode}`
        : null;

      // Format scheduled time in US/Eastern timezone and attendee timezone
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

      // Fallback to EST time when attendee timezone formatting fails
      if (!formattedLocalWebinarTime && formattedWebinarTime) {
        formattedLocalWebinarTime = formattedWebinarTime;
      }

      // Sync to ClickFunnels
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
      }).catch(err => console.error('ClickFunnels sync error:', err));

      // Schedule email and SMS reminders
      await scheduleRemindersForRegistration(registration.id)
        .catch(err => console.error('Failed to schedule reminders:', err));

      // Schedule reminder tags
      if (registration.scheduledStartTime) {
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
          await scheduleDelayedClickFunnelsTag({
            registrationId: registration.id,
            tagName: selectedBucket.tagName,
            scheduledFor
          }).catch(err => console.error(`Failed to schedule ${selectedBucket.tagName}:`, err));
        } else {
          const { applyReminderTagToContact } = await import('@/lib/clickfunnels');
          await applyReminderTagToContact(registration.email, selectedBucket.tagName)
            .catch(err => console.error(`Failed to apply ${selectedBucket.tagName}:`, err));
        }
      }
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
