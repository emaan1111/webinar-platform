import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendFacebookRegistration, extractFacebookCookies } from '@/lib/facebook'
import { registerUserToWebinar, isWebinarJamConfigured } from '@/lib/webinarjam'
import { applyReminderTagToContact } from '@/lib/clickfunnels'
import { syncContactToMautic, tagMauticContact } from '@/lib/mautic'
import { sendEmail } from '@/lib/email'
import { replaceMergeTags, prepareEmailHtml, MergeTagContext } from '@/lib/emailTracking'

/**
 * External Webinar Registration API
 * 
 * POST /api/external-webinars/[id]/register
 * 
 * Registers a user to an external webinar (WebinarJam/EverWebinar)
 * - Creates local registration record
 * - Optionally registers user via WebinarJam API
 * - Sends to Facebook CAPI
 * - Applies ClickFunnels tags
 */

// CORS headers for cross-origin embed requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const {
      name,
      email,
      phone,
      phoneCountryCode,
      scheduleId,
      scheduledStartTime,
      timezone,
      privacyConsent = true,
      marketingConsent = false,
      leadPageId,
      splitTestId,
      splitTestVariantId,
      // If true, also register in WebinarJam via API
      registerInWebinarJam = true,
    } = body

    // Full phone (with dialing code) for local records + CRM; WebinarJam gets them separate.
    const fullPhone = phone
      ? `${phoneCountryCode ? phoneCountryCode + ' ' : ''}${phone}`.trim()
      : undefined

    // Validation
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Get the external webinar
    const externalWebinar = await prisma.externalWebinar.findUnique({
      where: { id },
      include: {
        schedules: true,
      }
    })

    if (!externalWebinar) {
      return NextResponse.json(
        { error: 'External webinar not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    if (!externalWebinar.isActive) {
      return NextResponse.json(
        { error: 'This webinar is not currently active' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Check for existing registration
    const existingReg = await prisma.externalWebinarRegistration.findUnique({
      where: {
        externalWebinarId_email: {
          externalWebinarId: id,
          email: email.toLowerCase(),
        }
      }
    })

    if (existingReg) {
      // Return existing registration (don't error)
      return NextResponse.json({
        success: true,
        message: 'Already registered',
        registration: {
          id: existingReg.id,
          name: existingReg.name,
          email: existingReg.email,
        }
      }, { headers: corsHeaders })
    }

    // Parse name into first/last
    const nameParts = name.trim().split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined

    // Register in WebinarJam if API is configured and enabled
    let externalUserId: string | undefined
    let liveRoomUrl: string | undefined
    let replayRoomUrl: string | undefined

    // The combined picker encodes each option's identity + exact start time in its id:
    //   x|z|<ms>      = the live Zoom session  (send to the Zoom link, skip EverWebinar)
    //   x|j|<ms>      = just-in-time session   (EverWebinar schedule 0)
    //   x|<sid>|<ms>  = a recurring EverWebinar session (schedule <sid>)
    // Decoding here records the exact chosen time and avoids ambiguity when several
    // recurring days share one EverWebinar schedule id.
    let isZoomPick = scheduleId === 'zoom'
    let wjScheduleId: string | undefined
    let decodedStartTime: Date | null = null

    if (typeof scheduleId === 'string' && scheduleId.startsWith('x|')) {
      const [, kind, millisStr] = scheduleId.split('|')
      const millis = Number(millisStr)
      if (!Number.isNaN(millis)) decodedStartTime = new Date(millis)
      if (kind === 'z') {
        isZoomPick = true
      } else if (kind === 'j') {
        wjScheduleId = '0'
      } else {
        wjScheduleId = kind
      }
    } else if (!isZoomPick) {
      // Legacy / non-combined option: id is the local schedule id or external id directly.
      const schedule = externalWebinar.schedules.find(s => s.id === scheduleId)
      wjScheduleId = schedule?.externalScheduleId || scheduleId
    }

    // The registration's scheduleId is a foreign key to a local ExternalWebinarSchedule row.
    // Picker options carry external/synthetic ids (WebinarJam schedule numbers, 'zoom', JIT '0'),
    // which are NOT local row ids — writing one straight into the FK violates the constraint and
    // fails the whole registration. Resolve to a real local row when one exists, else store null.
    // The exact chosen time and room link are preserved separately (scheduledStartTime, liveRoomUrl).
    let localScheduleId: string | null = null
    if (!isZoomPick) {
      const localMatch =
        externalWebinar.schedules.find(s => s.id === scheduleId) ||
        (wjScheduleId
          ? externalWebinar.schedules.find(s => s.externalScheduleId === wjScheduleId)
          : undefined)
      localScheduleId = localMatch?.id ?? null
    }

    if (isZoomPick) {
      liveRoomUrl = externalWebinar.liveZoomLink || undefined
      if (!liveRoomUrl) {
        console.warn(`⚠️ Live Zoom pick for ${externalWebinar.name} but no liveZoomLink configured`)
      }
      console.log(`✅ ${email} picked the live Zoom session for ${externalWebinar.name}`)
    } else if (registerInWebinarJam && isWebinarJamConfigured() && wjScheduleId) {
      const wjResult = await registerUserToWebinar(
        externalWebinar.externalWebinarId,
        wjScheduleId,
        {
          firstName,
          lastName,
          email: email.toLowerCase(),
          phone,
          phoneCountryCode,
        },
        externalWebinar.platform as 'webinarjam' | 'everwebinar'
      )

      if (wjResult.success) {
        liveRoomUrl = wjResult.liveRoomUrl
        replayRoomUrl = wjResult.replayRoomUrl
        console.log(`✅ Registered ${email} in ${externalWebinar.platform}`)
      } else {
        console.warn(`⚠️ WebinarJam registration failed: ${wjResult.error}`)
        // Don't fail the local registration if WJ fails
      }
    }

    // Resolve the start time: Zoom uses the fixed live time, combined options use the time
    // encoded in the id, otherwise parse the submitted value (guarding a non-date label).
    let resolvedStartTime: Date | null = null
    if (isZoomPick && externalWebinar.liveZoomAt) {
      resolvedStartTime = new Date(externalWebinar.liveZoomAt)
    } else if (decodedStartTime) {
      resolvedStartTime = decodedStartTime
    } else if (scheduledStartTime) {
      const parsed = new Date(scheduledStartTime)
      resolvedStartTime = Number.isNaN(parsed.getTime()) ? null : parsed
    }

    // Create local registration
    const registration = await prisma.externalWebinarRegistration.create({
      data: {
        externalWebinarId: id,
        scheduleId: localScheduleId,
        name,
        email: email.toLowerCase(),
        phone: fullPhone,
        timezone,
        scheduledStartTime: resolvedStartTime,
        registrationSource: leadPageId ? 'lead_page' : 'manual',
        leadPageId,
        externalUserId,
        liveRoomUrl: liveRoomUrl || null,
        replayRoomUrl: replayRoomUrl || null,
        privacyConsent,
        marketingConsent,
      }
    })

    // Update lead page conversion count if applicable
    if (leadPageId) {
      await prisma.leadPage.update({
        where: { id: leadPageId },
        data: { conversions: { increment: 1 } }
      }).catch(() => {}) // Non-blocking
    }

    // Track split test conversion for external webinar registrations.
    // Priority: explicit IDs from request payload, then fallback to lead page mapping.
    let resolvedSplitTestId: string | undefined = splitTestId
    let resolvedVariantId: string | undefined = splitTestVariantId

    if (!resolvedSplitTestId || !resolvedVariantId) {
      if (leadPageId) {
        const splitVariant = await prisma.splitTestVariant.findFirst({
          where: { leadPageId },
          select: { id: true, splitTestId: true }
        })

        if (splitVariant) {
          resolvedSplitTestId = splitVariant.splitTestId
          resolvedVariantId = splitVariant.id
        }
      }
    }

    if (resolvedSplitTestId && resolvedVariantId) {
      await prisma.$transaction([
        prisma.splitTestVariant.update({
          where: { id: resolvedVariantId },
          data: { conversions: { increment: 1 } }
        }),
        prisma.splitTest.update({
          where: { id: resolvedSplitTestId },
          data: { conversions: { increment: 1 } }
        }),
        prisma.splitTestEvent.create({
          data: {
            splitTestId: resolvedSplitTestId,
            variantId: resolvedVariantId,
            type: 'CONVERSION',
            visitorId: `ext_${email.toLowerCase()}`,
          }
        })
      ]).catch((err) => {
        console.error('Failed to track split test conversion for external webinar registration:', err)
      })
    }

    // Send to Facebook CAPI if enabled
    if (externalWebinar.sendToFacebookCAPI) {
      const cookieHeader = request.headers.get('cookie')
      const { fbc, fbp } = extractFacebookCookies(cookieHeader)

      sendFacebookRegistration({
        email: email.toLowerCase(),
        name,
        phone: fullPhone,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        fbc,
        fbp,
        eventSourceUrl: request.headers.get('referer') || undefined,
        webinarId: externalWebinar.externalWebinarId,
        webinarTitle: externalWebinar.externalWebinarName || externalWebinar.name,
        registrationId: registration.id,
        value: 0,
        currency: 'USD',
      }).then(sent => {
        if (sent) {
          prisma.externalWebinarRegistration.update({
            where: { id: registration.id },
            data: { facebookCapiSent: true, facebookCapiSentAt: new Date() }
          }).catch(() => {})
        }
      }).catch(err => {
        console.error('Facebook CAPI error:', err)
      })
    }

    // Apply CRM integration based on webinar setting
    const crmIntegration = externalWebinar.crmIntegration || 'CLICKFUNNELS'
    
    if (crmIntegration === 'MAUTIC') {
      // Build custom fields for Mautic
      const mauticCustomFields = {
        webinar_name: externalWebinar.externalWebinarName || externalWebinar.name,
        webinar_link: liveRoomUrl || undefined,
        webinar_scheduled_time: registration.scheduledStartTime?.toISOString() || undefined,
        webinar_registration_date: registration.registeredAt.toISOString(),
        webinar_attendance_status: 'registered',
      };
      
      console.log('📋 External Webinar Mautic customFields:', JSON.stringify(mauticCustomFields, null, 2));
      
      // Sync contact to Mautic with webinar custom fields
      syncContactToMautic({
        email: email.toLowerCase(),
        firstName,
        lastName,
        phone: fullPhone,
        timezone,
        customFields: mauticCustomFields,
      }).then(() => {
        // Apply registration tag in Mautic
        if (externalWebinar.registrationTag) {
          return tagMauticContact(email.toLowerCase(), [externalWebinar.registrationTag])
        }
      }).catch(err => {
        console.error('Mautic sync error:', err)
      })
    } else if (crmIntegration === 'CLICKFUNNELS') {
      // Apply ClickFunnels registration tag if configured
      if (externalWebinar.registrationTag) {
        applyReminderTagToContact(email.toLowerCase(), externalWebinar.registrationTag)
          .catch(err => console.error('ClickFunnels tag error:', err))
      }
    }
    // If crmIntegration is 'NONE', skip CRM sync

    console.log(`✅ External webinar registration: ${email} → ${externalWebinar.name}`)

    // --- Send Confirmation Email (DB template with tracking) ---
    try {
      const activeTemplate = await prisma.confirmationEmailTemplate.findFirst({
        where: { externalWebinarId: id, isActive: true },
        orderBy: { createdAt: 'desc' },
      })

      if (activeTemplate) {
        const webinarTitle = externalWebinar.externalWebinarName || externalWebinar.name
        const emailCtx: MergeTagContext = {
          name: registration.name,
          email: registration.email,
          webinarTitle,
          webinarTime: registration.scheduledStartTime?.toLocaleString() || null,
          // For a live-Zoom pick this is the Zoom link (EverWebinar won't email them);
          // for a normal pick it's the EverWebinar room link if the API returned one.
          accessLink: liveRoomUrl || null,
        }

        const emailSubject = replaceMergeTags(activeTemplate.subject, emailCtx)
        const emailSendRecord = await prisma.confirmationEmailSend.create({
          data: {
            templateId: activeTemplate.id,
            externalRegistrationId: registration.id,
            to: registration.email,
            subject: emailSubject,
            status: 'SENT',
          },
        })

        const { html: emailHtml } = prepareEmailHtml(activeTemplate.htmlBody, emailCtx, emailSendRecord.id, 'confirmation')
        await sendEmail({
          to: registration.email,
          subject: emailSubject,
          htmlBody: emailHtml,
          fromName: activeTemplate.fromName || undefined,
        })
        console.log(`📧 Confirmation email sent to ${email}`)
      }
    } catch (err) {
      console.error('⚠️ Failed to send confirmation email:', err)
    }

    // --- Schedule Reminder Emails (non-blocking) ---
    try {
      const { scheduleReminderEmails } = await import('@/lib/emailScheduler')
      scheduleReminderEmails(registration.id, true).catch((err: any) =>
        console.error('⚠️ Failed to schedule reminder emails:', err)
      )
    } catch (err) {
      console.error('⚠️ Failed to import emailScheduler:', err)
    }

    return NextResponse.json({
      success: true,
      registration: {
        id: registration.id,
        name: registration.name,
        email: registration.email,
        webinarName: externalWebinar.externalWebinarName || externalWebinar.name,
        liveRoomUrl,
        replayRoomUrl,
      }
    }, { status: 201, headers: corsHeaders })

  } catch (error) {
    console.error('External webinar registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
