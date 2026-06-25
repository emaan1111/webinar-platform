import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/sessions
//
// Groups webinar registrations by their exact scheduled start time so that a
// single Zoom session time (e.g. "Sat 11:00 AM") that is configured across
// several different webinars shows up as ONE combined roster.
//
// NOTE: Registration.scheduleId is a loose FK — there is no Prisma relation to
// WebinarSchedule — so schedule data (isZoomSession / zoomLink) is fetched
// separately and joined in memory.
//
// Query params:
//   range    'upcoming' (default) | 'past' | 'all'
//   zoomOnly 'true' (default) | 'false'  — only sessions backed by a Zoom schedule
//   time     ISO instant — when present, returns the full registrant roster for
//            that exact session time instead of the grouped summary list
//   search   filters the roster by name / email / phone (only with `time`)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'upcoming'
    const zoomOnly = searchParams.get('zoomOnly') !== 'false'
    const time = searchParams.get('time')
    const search = (searchParams.get('search') || '').trim().toLowerCase()

    const now = new Date()

    // Base filter: registrations tied to a concrete scheduled instant.
    const whereClause: any = { scheduledStartTime: { not: null } }
    if (range === 'upcoming') {
      whereClause.scheduledStartTime = { gte: now }
    } else if (range === 'past') {
      whereClause.scheduledStartTime = { lt: now }
    }

    // Build a lookup of schedule -> { isZoomSession, zoomLink }. Cheap enough to
    // load all schedules; there are typically only a handful per webinar.
    const schedules = await prisma.webinarSchedule.findMany({
      select: { id: true, isZoomSession: true, zoomLink: true },
    })
    const scheduleMap = new Map(schedules.map((s) => [s.id, s]))

    // ----- Roster mode: full registrant list for one exact session time -----
    if (time) {
      const target = new Date(time)
      if (isNaN(target.getTime())) {
        return NextResponse.json({ error: 'Invalid time parameter' }, { status: 400 })
      }

      const registrants = await prisma.registration.findMany({
        where: { ...whereClause, scheduledStartTime: target },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          country: true,
          timezone: true,
          scheduleId: true,
          registeredAt: true,
          attended: true,
          webinar: { select: { id: true, title: true } },
        },
        orderBy: { registeredAt: 'desc' },
      })

      const rows = registrants
        .map((r) => {
          const sched = r.scheduleId ? scheduleMap.get(r.scheduleId) : undefined
          return {
            id: r.id,
            name: r.name,
            email: r.email,
            phone: r.phone,
            country: r.country,
            timezone: r.timezone,
            registeredAt: r.registeredAt,
            attended: r.attended,
            webinarId: r.webinar?.id || null,
            webinarTitle: r.webinar?.title || 'Unknown webinar',
            zoomLink: sched?.zoomLink || null,
            isZoom: !!sched?.isZoomSession,
          }
        })
        .filter((r) => (zoomOnly ? r.isZoom : true))
        .filter((r) =>
          search
            ? [r.name, r.email, r.phone]
                .filter(Boolean)
                .some((v) => (v as string).toLowerCase().includes(search))
            : true
        )

      return NextResponse.json({ time, total: rows.length, registrants: rows })
    }

    // ----- Summary mode: grouped session list -----
    const registrations = await prisma.registration.findMany({
      where: whereClause,
      select: {
        scheduledStartTime: true,
        scheduleId: true,
        webinar: { select: { id: true, title: true } },
      },
    })

    type Group = {
      time: string
      total: number
      isZoom: boolean
      webinars: Map<string, { id: string; title: string; count: number }>
      zoomLinks: Set<string>
    }
    const groups = new Map<string, Group>()

    for (const reg of registrations) {
      if (!reg.scheduledStartTime) continue
      const sched = reg.scheduleId ? scheduleMap.get(reg.scheduleId) : undefined
      if (zoomOnly && !sched?.isZoomSession) continue

      const key = reg.scheduledStartTime.toISOString()
      let group = groups.get(key)
      if (!group) {
        group = { time: key, total: 0, isZoom: false, webinars: new Map(), zoomLinks: new Set() }
        groups.set(key, group)
      }
      group.total += 1
      if (sched?.isZoomSession) group.isZoom = true
      if (sched?.zoomLink) group.zoomLinks.add(sched.zoomLink)

      const wid = reg.webinar?.id
      if (wid) {
        const existing = group.webinars.get(wid)
        if (existing) {
          existing.count += 1
        } else {
          group.webinars.set(wid, { id: wid, title: reg.webinar?.title || 'Unknown webinar', count: 1 })
        }
      }
    }

    const sessions = Array.from(groups.values())
      .map((g) => ({
        time: g.time,
        total: g.total,
        isZoom: g.isZoom,
        webinarCount: g.webinars.size,
        webinars: Array.from(g.webinars.values()).sort((a, b) => b.count - a.count),
        zoomLinks: Array.from(g.zoomLinks),
      }))
      .sort((a, b) =>
        range === 'past'
          ? new Date(b.time).getTime() - new Date(a.time).getTime()
          : new Date(a.time).getTime() - new Date(b.time).getTime()
      )

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}
