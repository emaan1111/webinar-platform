import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { fromZonedTime } from 'date-fns-tz'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { loadRoster, linkedIds } from '@/lib/zoomSessions'

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
    const { name, zoomLink, date, time, timezone, notes, isActive, webinars } = body || {}

    const data: any = {}
    if (name !== undefined) data.name = name
    if (zoomLink !== undefined) data.zoomLink = zoomLink || null
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
      select: { scheduledAt: true },
    })

    const updated = await prisma.zoomSession.update({
      where: { id: params.id },
      data,
      include: webinarLinkInclude,
    })

    // Keep the snapshot on external webinars that use this session as their live
    // Zoom in sync (their picker/register/email read these copied fields).
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
