import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { fromZonedTime } from 'date-fns-tz'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { countRoster } from '@/lib/zoomSessions'

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

// Convert a {date,time,timezone} into a stored UTC instant.
function toScheduledAt(date: string, time: string, timezone: string): Date {
  return fromZonedTime(`${date}T${time}:00`, timezone)
}

// Build the nested ZoomSessionWebinar create rows from the incoming link list.
function buildLinkRows(webinars: IncomingLink[]) {
  return webinars
    .filter((w) => w && w.id && (w.type === 'external' || w.type === 'internal'))
    .map((w) =>
      w.type === 'external'
        ? { webinarType: 'external', externalWebinarId: w.id }
        : { webinarType: 'internal', webinarId: w.id }
    )
}

// GET /api/zoom-sessions — list sessions with linked webinars + roster counts.
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessions = await prisma.zoomSession.findMany({
      include: webinarLinkInclude,
      orderBy: { scheduledAt: 'asc' },
    })

    const result = await Promise.all(
      sessions.map(async (s) => ({
        id: s.id,
        name: s.name,
        zoomLink: s.zoomLink,
        scheduledAt: s.scheduledAt,
        timezone: s.timezone,
        notes: s.notes,
        isActive: s.isActive,
        webinars: s.webinars.map((w) => ({
          type: w.webinarType,
          id: w.externalWebinarId || w.webinarId,
          title:
            w.externalWebinar?.name ||
            w.externalWebinar?.externalWebinarName ||
            w.webinar?.title ||
            'Unknown webinar',
        })),
        registrantCount: await countRoster(s.scheduledAt, s.webinars),
      }))
    )

    return NextResponse.json({ sessions: result })
  } catch (error) {
    console.error('Error listing zoom sessions:', error)
    return NextResponse.json({ error: 'Failed to list zoom sessions' }, { status: 500 })
  }
}

// POST /api/zoom-sessions — create a session.
// Body: { name, zoomLink?, date, time, timezone, notes?, webinars: [{type,id}] }
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, zoomLink, date, time, timezone, notes, webinars } = body || {}

    if (!name || !date || !time || !timezone) {
      return NextResponse.json(
        { error: 'name, date, time and timezone are required' },
        { status: 400 }
      )
    }

    const scheduledAt = toScheduledAt(date, time, timezone)
    if (isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ error: 'Invalid date/time' }, { status: 400 })
    }

    const created = await prisma.zoomSession.create({
      data: {
        name,
        zoomLink: zoomLink || null,
        scheduledAt,
        timezone,
        notes: notes || null,
        webinars: { create: buildLinkRows(Array.isArray(webinars) ? webinars : []) },
      },
      include: webinarLinkInclude,
    })

    return NextResponse.json({ session: created }, { status: 201 })
  } catch (error) {
    console.error('Error creating zoom session:', error)
    return NextResponse.json({ error: 'Failed to create zoom session' }, { status: 500 })
  }
}
