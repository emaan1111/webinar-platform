import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendFacebookRegistration, extractFacebookCookies } from '@/lib/facebook'
import { registerUserToWebinar, isWebinarJamConfigured } from '@/lib/webinarjam'
import { applyReminderTagToContact } from '@/lib/clickfunnels'
import { syncContactToMautic } from '@/lib/mautic'

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
      scheduleId,
      scheduledStartTime,
      timezone,
      privacyConsent = true,
      marketingConsent = false,
      leadPageId,
      // If true, also register in WebinarJam via API
      registerInWebinarJam = true,
    } = body

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

    if (registerInWebinarJam && isWebinarJamConfigured()) {
      // Find the schedule to use
      const schedule = externalWebinar.schedules.find(s => s.id === scheduleId)
      const externalScheduleId = schedule?.externalScheduleId || scheduleId

      if (externalScheduleId) {
        const wjResult = await registerUserToWebinar(
          externalWebinar.externalWebinarId,
          externalScheduleId,
          {
            firstName,
            lastName,
            email: email.toLowerCase(),
            phone,
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
    }

    // Create local registration
    const registration = await prisma.externalWebinarRegistration.create({
      data: {
        externalWebinarId: id,
        scheduleId: scheduleId || null,
        name,
        email: email.toLowerCase(),
        phone,
        timezone,
        scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : null,
        registrationSource: leadPageId ? 'lead_page' : 'manual',
        leadPageId,
        externalUserId,
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

    // Send to Facebook CAPI if enabled
    if (externalWebinar.sendToFacebookCAPI) {
      const cookieHeader = request.headers.get('cookie')
      const { fbc, fbp } = extractFacebookCookies(cookieHeader)

      sendFacebookRegistration({
        email: email.toLowerCase(),
        name,
        phone,
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

    // Apply ClickFunnels registration tag if configured
    syncContactToMautic({
      email: email.toLowerCase(),
      firstName,
      lastName,
      phone,
      timezone,
    }).catch(err => {
      console.error('Mautic contact sync error:', err)
    })

    if (externalWebinar.registrationTag) {
      applyReminderTagToContact(email.toLowerCase(), externalWebinar.registrationTag)
        .catch(err => console.error('ClickFunnels tag error:', err))
    }

    console.log(`✅ External webinar registration: ${email} → ${externalWebinar.name}`)

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
