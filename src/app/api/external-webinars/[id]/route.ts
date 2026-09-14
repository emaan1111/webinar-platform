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
        zoomSessionLinks: { select: { zoomSessionId: true } },
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
/**
 * Coerce a booking-window bound coming off the settings form. Blank, zero, negative and
 * unparseable values all mean "no bound" — a cleared field must reopen that side of the
 * window, never collapse it to a rule that forbids every session.
 */
function toLeadMinutes(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n)
}

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
      zoomSessionIds,
      zoomOnlySchedule,
      showJustInTime,
      jitLeadMinutes,
      recurringSlotsToShow,
      minBookingLeadMinutes,
      maxBookingLeadMinutes,
      thankYouUrl,
      thankYouTemplateId,
      countdownTemplateId,
      // Emaan email-management integration
      emaanWebhookUrl,
      emaanSyncScope,
    } = body

    // Which Zoom sessions are linked to (i.e. offered as pickable times on) this
    // webinar. New clients send zoomSessionIds: string[]; older clients sent the
    // single liveZoomSessionId — treat that as a one-element (or empty) list. When
    // either key is present, the linked set is replaced with exactly that list; when
    // both are omitted the links are left untouched (partial updates of other
    // settings don't disturb them).
    let requestedSessionIds: string[] | undefined
    if (Array.isArray(zoomSessionIds)) {
      requestedSessionIds = zoomSessionIds.filter((v: any) => typeof v === 'string' && v)
    } else if (liveZoomSessionId !== undefined) {
      requestedSessionIds = liveZoomSessionId ? [liveZoomSessionId] : []
    }

    let liveZoomData: Record<string, any> = {}
    let validSessionIds: string[] | null = null
    if (requestedSessionIds !== undefined) {
      // Sessions deleted between page load and save are silently dropped.
      const found = await prisma.zoomSession.findMany({
        where: { id: { in: requestedSessionIds } },
        select: { id: true, zoomLink: true, scheduledAt: true, timezone: true },
        orderBy: { scheduledAt: 'asc' },
      })
      validSessionIds = found.map((s) => s.id)

      // Keep the legacy single-pick pointer + snapshot fields coherent: point them
      // at the soonest linked session (old data paths still read these as
      // fallbacks), or clear them when no sessions are linked. The picker itself
      // reads the linked sessions live, not these fields.
      const primary = found[0] || null
      liveZoomData = primary
        ? {
            liveZoomSessionId: primary.id,
            liveZoomLink: primary.zoomLink,
            liveZoomAt: primary.scheduledAt,
            liveZoomTimezone: primary.timezone || null,
          }
        : {
            liveZoomSessionId: null,
            liveZoomLink: null,
            liveZoomAt: null,
            liveZoomTimezone: null,
          }
    }

    // The field update and the join-row replacement commit atomically — a session
    // deleted mid-request (FK failure on createMany) must not leave the webinar
    // updated but its linked set half-replaced.
    const ops: any[] = []
    ops.push(prisma.externalWebinar.update({
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
        ...(zoomOnlySchedule !== undefined && { zoomOnlySchedule: !!zoomOnlySchedule }),
        ...liveZoomData,
        ...(showJustInTime !== undefined && { showJustInTime }),
        ...(jitLeadMinutes !== undefined && { jitLeadMinutes }),
        ...(recurringSlotsToShow !== undefined && {
          recurringSlotsToShow:
            recurringSlotsToShow === null || recurringSlotsToShow === ''
              ? null
              : Number(recurringSlotsToShow),
        }),
        // Booking window. A blank / zero / negative value clears the bound rather than
        // forbidding everything, matching how the picker treats an unset bound.
        ...(minBookingLeadMinutes !== undefined && {
          minBookingLeadMinutes: toLeadMinutes(minBookingLeadMinutes),
        }),
        ...(maxBookingLeadMinutes !== undefined && {
          maxBookingLeadMinutes: toLeadMinutes(maxBookingLeadMinutes),
        }),
        ...(thankYouUrl !== undefined && { thankYouUrl: thankYouUrl || null }),
        ...(thankYouTemplateId !== undefined && { thankYouTemplateId: thankYouTemplateId || null }),
        ...(countdownTemplateId !== undefined && { countdownTemplateId: countdownTemplateId || null }),
        ...(emaanWebhookUrl !== undefined && { emaanWebhookUrl: emaanWebhookUrl || null }),
        ...(emaanSyncScope !== undefined && {
          emaanSyncScope: emaanSyncScope === 'ZOOM_ONLY' ? 'ZOOM_ONLY' : 'ALL',
        }),
        updatedAt: new Date(),
      }
    }))

    // Replace the webinar<->session join rows with the requested set. These rows
    // drive the session roster AND which Zoom times the registration picker offers.
    if (validSessionIds) {
      ops.push(prisma.zoomSessionWebinar.deleteMany({
        where: { externalWebinarId: id, zoomSessionId: { notIn: validSessionIds } },
      }))
      if (validSessionIds.length > 0) {
        ops.push(prisma.zoomSessionWebinar.createMany({
          data: validSessionIds.map((sid) => ({
            zoomSessionId: sid,
            externalWebinarId: id,
            webinarType: 'external',
          })),
          skipDuplicates: true,
        }))
      }
    }

    const [externalWebinar] = await prisma.$transaction(ops)

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
