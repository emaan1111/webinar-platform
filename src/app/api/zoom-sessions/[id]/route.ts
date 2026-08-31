import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { fromZonedTime } from 'date-fns-tz'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { loadRoster, linkedIds } from '@/lib/zoomSessions'
import { pushRegistrationUpdatesToEmaan } from '@/lib/emaan'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const webinarLinkInclude = {
  webinars: {
    include: {
      externalWebinar: { select: { id: true, name: true, externalWebinarName: true } },
      webinar: { select: { id: true, title: true } },
    },
  },
} as const

type IncomingLink = { type: 'external' | 'internal'; id: string }

function buildLinkRows(webinars: IncomingLink[]) {
  return webinars
    .filter((w) => w && w.id && (w.type === 'external' || w.type === 'internal'))
    .map((w) =>
      w.type === 'external'
        ? { webinarType: 'external', externalWebinarId: w.id }
        : { webinarType: 'internal', webinarId: w.id }
    )
}

function shapeSession(s: any) {
  return {
    id: s.id,
    name: s.name,
    zoomLink: s.zoomLink,
    replayUrl: s.replayUrl,
    scheduledAt: s.scheduledAt,
    timezone: s.timezone,
    notes: s.notes,
    isActive: s.isActive,
    webinars: s.webinars.map((w: any) => ({
      type: w.webinarType,
      id: w.externalWebinarId || w.webinarId,
      title:
        w.externalWebinar?.name ||
        w.externalWebinar?.externalWebinarName ||
        w.webinar?.title ||
        'Unknown webinar',
    })),
  }
}

// GET /api/zoom-sessions/[id] — session detail + combined roster.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const zoomSession = await prisma.zoomSession.findUnique({
      where: { id: params.id },
      include: webinarLinkInclude,
    })
    if (!zoomSession) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const roster = await loadRoster(zoomSession.scheduledAt, zoomSession.webinars)
    return NextResponse.json({ session: shapeSession(zoomSession), roster })
  } catch (error) {
    console.error('Error fetching zoom session:', error)
    return NextResponse.json({ error: 'Failed to fetch zoom session' }, { status: 500 })
  }
}

// PUT /api/zoom-sessions/[id] — update fields and replace webinar links.
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, zoomLink, replayUrl, date, time, timezone, notes, isActive, webinars } =
      body || {}

    const data: any = {}
    if (name !== undefined) data.name = name
    if (zoomLink !== undefined) data.zoomLink = zoomLink || null
    if (replayUrl !== undefined) data.replayUrl = replayUrl || null
    if (notes !== undefined) data.notes = notes || null
    if (isActive !== undefined) data.isActive = !!isActive
    if (timezone !== undefined) data.timezone = timezone

    // Recompute scheduledAt only when a new date/time (and timezone) are provided.
    if (date && time && timezone) {
      const scheduledAt = fromZonedTime(`${date}T${time}:00`, timezone)
      if (isNaN(scheduledAt.getTime())) {
        return NextResponse.json({ error: 'Invalid date/time' }, { status: 400 })
      }
      data.scheduledAt = scheduledAt
    }
    data.updatedAt = new Date()

    if (Array.isArray(webinars)) {
      data.webinars = {
        deleteMany: {},
        create: buildLinkRows(webinars),
      }
    }

    const before = await prisma.zoomSession.findUnique({
      where: { id: params.id },
      select: { scheduledAt: true, zoomLink: true },
    })

    const updated = await prisma.zoomSession.update({
      where: { id: params.id },
      data,
      include: webinarLinkInclude,
    })

    // Webinars unticked from this session must stop offering it: clear the legacy
    // single-pick pointer (and its snapshot) on external webinars that still point
    // here but are no longer in the linked set — otherwise the pointer leg of
    // getLinkedZoomSessions would keep the removed time bookable.
    if (Array.isArray(webinars)) {
      const keptExternal = linkedIds(updated.webinars).external
      await prisma.externalWebinar.updateMany({
        where: {
          liveZoomSessionId: params.id,
          ...(keptExternal.length ? { id: { notIn: keptExternal } } : {}),
        },
        data: {
          liveZoomSessionId: null,
          liveZoomLink: null,
          liveZoomAt: null,
          liveZoomTimezone: null,
        },
      })
    }

    // Keep the snapshot on external webinars that still use this session as their
    // live Zoom in sync (legacy fallback paths read these copied fields).
    await prisma.externalWebinar.updateMany({
      where: { liveZoomSessionId: params.id },
      data: {
        liveZoomAt: updated.scheduledAt,
        liveZoomLink: updated.zoomLink,
        liveZoomTimezone: updated.timezone,
      },
    })

    // If the session time moved, move its existing registrations with it so they
    // stay in the roster (the roster matches scheduledStartTime == scheduledAt).
    if (before && before.scheduledAt.getTime() !== updated.scheduledAt.getTime()) {
      const { external, internal } = linkedIds(updated.webinars)
      if (external.length) {
        await prisma.externalWebinarRegistration.updateMany({
          where: { externalWebinarId: { in: external }, scheduledStartTime: before.scheduledAt },
          data: { scheduledStartTime: updated.scheduledAt },
        })
      }
      if (internal.length) {
        await prisma.registration.updateMany({
          where: { webinarId: { in: internal }, scheduledStartTime: before.scheduledAt },
          data: { scheduledStartTime: updated.scheduledAt },
        })
      }
    }

    // Keep stored per-attendee external room links in sync with this session's
    // link so upcoming reminder emails use the latest Zoom URL. Any roster row
    // still holding a Zoom URL (current or stale) or no link gets the new one;
    // EverWebinar room links are left alone.
    if (updated.zoomLink) {
      const { external } = linkedIds(updated.webinars)
      if (external.length) {
        await prisma.externalWebinarRegistration.updateMany({
          where: {
            externalWebinarId: { in: external },
            scheduledStartTime: updated.scheduledAt,
            OR: [
              { liveRoomUrl: null },
              { liveRoomUrl: { contains: 'zoom.us', mode: 'insensitive' } },
              ...(before?.zoomLink ? [{ liveRoomUrl: before.zoomLink }] : []),
            ],
          },
          data: { liveRoomUrl: updated.zoomLink },
        })
      }

      // Linked internal webinars keep the link on their Zoom-session schedule —
      // reminder emails link to the countdown page, which redirects to
      // schedule.zoomLink at go-time, so updating it here is what makes those
      // attendees land on the new link.
      const { internal } = linkedIds(updated.webinars)
      if (internal.length) {
        const sessionTimes = before
          ? [before.scheduledAt, updated.scheduledAt]
          : [updated.scheduledAt]
        await prisma.webinarSchedule.updateMany({
          where: {
            webinarId: { in: internal },
            isZoomSession: true,
            scheduledAt: { in: sessionTimes },
          },
          data: { zoomLink: updated.zoomLink },
        })
      }
    }

    // Tell Emaan the session moved or the link changed. Without this it holds
    // the old time and the old Zoom URL, and mails a dead link — Webinar Play's
    // own reminders dodge the problem by resolving the link at send time, and
    // Emaan needs the equivalent. Read AFTER the updateMany calls above so the
    // rows reflect the new time and link. Fire-and-forget and paced: Emaan rate
    // limits by IP and we have one egress IP.
    ;(async () => {
      try {
        const { external } = linkedIds(updated.webinars)
        if (!external.length) return
        const affected = await prisma.externalWebinarRegistration.findMany({
          where: {
            externalWebinarId: { in: external },
            scheduledStartTime: updated.scheduledAt,
          },
          select: {
            email: true,
            name: true,
            phone: true,
            timezone: true,
            liveRoomUrl: true,
            replayRoomUrl: true,
            registeredAt: true,
            scheduledStartTime: true,
            externalWebinarId: true,
            externalWebinar: { select: { name: true, externalWebinarName: true } },
          },
        })
        if (!affected.length) return
        const result = await pushRegistrationUpdatesToEmaan(
          affected.map((r) => ({
            email: r.email,
            name: r.name,
            phone: r.phone,
            webinar: {
              externalWebinarId: r.externalWebinarId,
              webinarName:
                r.externalWebinar.externalWebinarName || r.externalWebinar.name,
              scheduledStartTime: r.scheduledStartTime,
              timezone: r.timezone,
              liveRoomUrl: r.liveRoomUrl,
              replayRoomUrl: r.replayRoomUrl,
              // Saving a replay URL is what makes an already-queued replay
              // email find its link — the email waits, hourly, until one shows
              // up rather than mailing a broken one.
              sessionReplayUrl: updated.replayUrl,
              // A registration sitting on a Zoom session's time IS a Zoom pick.
              sessionType: 'zoom' as const,
              registeredAt: r.registeredAt,
            },
          })),
        )
        console.log(
          `Emaan zoom-session resync: ${result.pushed} pushed, ${result.failed} failed`,
        )
      } catch (err) {
        console.error('Emaan zoom-session resync error:', err)
      }
    })()

    return NextResponse.json({ session: shapeSession(updated) })
  } catch (error) {
    console.error('Error updating zoom session:', error)
    return NextResponse.json({ error: 'Failed to update zoom session' }, { status: 500 })
  }
}

// DELETE /api/zoom-sessions/[id]
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.zoomSession.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting zoom session:', error)
    return NextResponse.json({ error: 'Failed to delete zoom session' }, { status: 500 })
  }
}
