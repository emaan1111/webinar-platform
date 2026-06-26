import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

/**
 * External Webinar API - Individual operations
 * 
 * GET    /api/external-webinars/[id] - Get a specific external webinar
 * PUT    /api/external-webinars/[id] - Update an external webinar
 * DELETE /api/external-webinars/[id] - Delete an external webinar
 */

// GET - Get a specific external webinar
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const externalWebinar = await prisma.externalWebinar.findUnique({
      where: { id },
      include: {
        leadPages: {
          select: {
            id: true,
            name: true,
            slug: true,
            views: true,
            conversions: true,
          }
        },
        schedules: true,
        _count: {
          select: {
            registrations: true,
            leadPages: true,
            schedules: true,
          }
        }
      }
    })

    if (!externalWebinar) {
      return NextResponse.json({ error: 'External webinar not found' }, { status: 404 })
    }

    // Get attendance stats
    const attendanceStats = await prisma.externalWebinarRegistration.groupBy({
      by: ['attended'],
      where: { externalWebinarId: id },
      _count: true,
    })

    const stats = {
      totalRegistrations: externalWebinar._count.registrations,
      attended: attendanceStats.find(s => s.attended)?._count || 0,
      notAttended: attendanceStats.find(s => !s.attended)?._count || 0,
    }

    return NextResponse.json({
      ...externalWebinar,
      stats,
    })
  } catch (error) {
    console.error('Error fetching external webinar:', error)
    return NextResponse.json(
      { error: 'Failed to fetch external webinar' },
      { status: 500 }
    )
  }
}

// PUT - Update an external webinar
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    const {
      name,
      isActive,
      syncAttendance,
      // CRM Integration
      crmIntegration,
      // Tag settings
      registrationTag,
      registrationTagId,
      attendedTag,
      attendedTagId,
      mostlyAttendedTag,
      mostlyAttendedTagId,
      partlyAttendedTag,
      partlyAttendedTagId,
      missedTag,
      missedTagId,
      replayAttendedTag,
      replayAttendedTagId,
      mostlyAttendedThreshold,
      attendanceTagDelayHours,
      webinarDurationMinutes,
      // SMS settings
      autoSendPostSessionSMS,
      postSessionSMSMinutesAfter,
      postSessionSMSMinWatchedMinutes,
      postSessionSMSBody,
      // Facebook CAPI
      sendToFacebookCAPI,
      // Combined seamless picker (live Zoom + JIT + recurring)
      combineScheduleSources,
      liveZoomEnabled,
      liveZoomLink,
      liveZoomAt,
      liveZoomTimezone,
      liveZoomSessionId,
      showJustInTime,
      jitLeadMinutes,
      recurringSlotsToShow,
      thankYouUrl,
      thankYouTemplateId,
      // Emaan email-management integration
      emaanWebhookUrl,
      emaanSyncScope,
    } = body

    // Resolve the live-Zoom config. When a shared ZoomSession is selected
    // (liveZoomSessionId provided), snapshot its link/time/timezone into the
    // existing fields so the picker/register/email flow stays unchanged, and
    // sync the webinar<->session association that feeds the session roster.
    let liveZoomData: Record<string, any> = {}
    let oldLiveZoomSessionId: string | null = null
    let newLiveZoomSessionId: string | null = null
    let syncSessionLink = false

    if (liveZoomSessionId !== undefined) {
      syncSessionLink = true
      const current = await prisma.externalWebinar.findUnique({
        where: { id },
        select: { liveZoomSessionId: true },
      })
      oldLiveZoomSessionId = current?.liveZoomSessionId ?? null
      newLiveZoomSessionId = liveZoomSessionId || null

      if (newLiveZoomSessionId) {
        const zs = await prisma.zoomSession.findUnique({
          where: { id: newLiveZoomSessionId },
          select: { zoomLink: true, scheduledAt: true, timezone: true },
        })
        if (!zs) {
          return NextResponse.json({ error: 'Selected Zoom session not found' }, { status: 400 })
        }
        // A session without a join link would silently disappear from the picker
        // (the picker requires liveZoomLink), so reject it with a clear message.
        if (!zs.zoomLink) {
          return NextResponse.json(
            { error: 'That Zoom session has no Zoom join link yet — add a link to the session first.' },
            { status: 400 }
          )
        }
        liveZoomData = {
          liveZoomSessionId: newLiveZoomSessionId,
          liveZoomLink: zs.zoomLink,
          liveZoomAt: zs.scheduledAt,
          liveZoomTimezone: zs.timezone || null,
        }
      } else {
        liveZoomData = {
          liveZoomSessionId: null,
          liveZoomLink: null,
          liveZoomAt: null,
          liveZoomTimezone: null,
        }
      }
    }
    // When liveZoomSessionId is omitted from the body, live-Zoom fields are left
    // untouched (partial updates of other settings don't disturb the link).

    const externalWebinar = await prisma.externalWebinar.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(isActive !== undefined && { isActive }),
        ...(syncAttendance !== undefined && { syncAttendance }),
        ...(crmIntegration !== undefined && { crmIntegration }),
        ...(registrationTag !== undefined && { registrationTag }),
        ...(registrationTagId !== undefined && { registrationTagId }),
        ...(attendedTag !== undefined && { attendedTag }),
        ...(attendedTagId !== undefined && { attendedTagId }),
        ...(mostlyAttendedTag !== undefined && { mostlyAttendedTag }),
        ...(mostlyAttendedTagId !== undefined && { mostlyAttendedTagId }),
        ...(partlyAttendedTag !== undefined && { partlyAttendedTag }),
        ...(partlyAttendedTagId !== undefined && { partlyAttendedTagId }),
        ...(missedTag !== undefined && { missedTag }),
        ...(missedTagId !== undefined && { missedTagId }),
        ...(replayAttendedTag !== undefined && { replayAttendedTag }),
        ...(replayAttendedTagId !== undefined && { replayAttendedTagId }),
        ...(mostlyAttendedThreshold !== undefined && { mostlyAttendedThreshold }),
        ...(attendanceTagDelayHours !== undefined && { attendanceTagDelayHours }),
        ...(webinarDurationMinutes !== undefined && { webinarDurationMinutes }),
        ...(autoSendPostSessionSMS !== undefined && { autoSendPostSessionSMS }),
        ...(postSessionSMSMinutesAfter !== undefined && { postSessionSMSMinutesAfter }),
        ...(postSessionSMSMinWatchedMinutes !== undefined && { postSessionSMSMinWatchedMinutes }),
        ...(postSessionSMSBody !== undefined && { postSessionSMSBody }),
        ...(sendToFacebookCAPI !== undefined && { sendToFacebookCAPI }),
        ...(combineScheduleSources !== undefined && { combineScheduleSources }),
        ...(liveZoomEnabled !== undefined && { liveZoomEnabled }),
        ...liveZoomData,
        ...(showJustInTime !== undefined && { showJustInTime }),
        ...(jitLeadMinutes !== undefined && { jitLeadMinutes }),
        ...(recurringSlotsToShow !== undefined && {
          recurringSlotsToShow:
            recurringSlotsToShow === null || recurringSlotsToShow === ''
              ? null
              : Number(recurringSlotsToShow),
        }),
        ...(thankYouUrl !== undefined && { thankYouUrl: thankYouUrl || null }),
        ...(thankYouTemplateId !== undefined && { thankYouTemplateId: thankYouTemplateId || null }),
        ...(emaanWebhookUrl !== undefined && { emaanWebhookUrl: emaanWebhookUrl || null }),
        ...(emaanSyncScope !== undefined && {
          emaanSyncScope: emaanSyncScope === 'ZOOM_ONLY' ? 'ZOOM_ONLY' : 'ALL',
        }),
        updatedAt: new Date(),
      }
    })

    // Sync the webinar<->session association (drives the session roster).
    if (syncSessionLink) {
      if (oldLiveZoomSessionId && oldLiveZoomSessionId !== newLiveZoomSessionId) {
        await prisma.zoomSessionWebinar.deleteMany({
          where: { zoomSessionId: oldLiveZoomSessionId, externalWebinarId: id },
        })
      }
      if (newLiveZoomSessionId) {
        const existing = await prisma.zoomSessionWebinar.findFirst({
          where: { zoomSessionId: newLiveZoomSessionId, externalWebinarId: id },
        })
        if (!existing) {
          await prisma.zoomSessionWebinar.create({
            data: {
              zoomSessionId: newLiveZoomSessionId,
              externalWebinarId: id,
              webinarType: 'external',
            },
          })
        }
      }
    }

    return NextResponse.json(externalWebinar)
  } catch (error) {
    console.error('Error updating external webinar:', error)
    return NextResponse.json(
      { error: 'Failed to update external webinar' },
      { status: 500 }
    )
  }
}

// DELETE - Delete an external webinar
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    await prisma.externalWebinar.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting external webinar:', error)
    return NextResponse.json(
      { error: 'Failed to delete external webinar' },
      { status: 500 }
    )
  }
}
