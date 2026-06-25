import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/sessions
//
// Groups EXTERNAL webinar registrations by their exact scheduled start time so
// that a single session time (e.g. "Sat 11:00 AM") that registrants pick across
// several different external webinars shows up as ONE combined roster.
//
// (This intentionally targets ExternalWebinarRegistration — that is where this
// app's live/Zoom registrations actually land, not the internal Registration
// table.)
//
// A session is treated as a Zoom session when its start time matches the
// external webinar's configured live Zoom time (liveZoomAt), or when the
// registrant captured a Zoom room URL (liveRoomUrl).
//
// Query params:
//   range    'upcoming' (default) | 'past' | 'all'
//   zoomOnly 'true' | 'false' (default) — restrict to Zoom sessions
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
    const zoomOnly = searchParams.get('zoomOnly') === 'true'
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

    // Is this registration's session the webinar's configured live Zoom session?
    const isZoomReg = (reg: {
      scheduledStartTime: Date | null
      liveRoomUrl: string | null
      externalWebinar?: { liveZoomAt: Date | null; liveZoomLink: string | null } | null
    }) => {
      const liveAt = reg.externalWebinar?.liveZoomAt
      const matchesLiveZoom =
        !!liveAt && !!reg.scheduledStartTime && liveAt.getTime() === reg.scheduledStartTime.getTime()
      const hasZoomUrl = !!reg.liveRoomUrl && reg.liveRoomUrl.toLowerCase().includes('zoom')
      return matchesLiveZoom || hasZoomUrl
    }

    const zoomLinkFor = (reg: {
      liveRoomUrl: string | null
      externalWebinar?: { liveZoomLink: string | null } | null
    }, isZoom: boolean) => {
      if (reg.liveRoomUrl && reg.liveRoomUrl.toLowerCase().includes('zoom')) return reg.liveRoomUrl
      if (isZoom && reg.externalWebinar?.liveZoomLink) return reg.externalWebinar.liveZoomLink
      return null
    }

    const webinarName = (ew?: { name: string | null; externalWebinarName: string | null } | null) =>
      ew?.name || ew?.externalWebinarName || 'Unknown webinar'

    // ----- Roster mode: full registrant list for one exact session time -----
    if (time) {
      const target = new Date(time)
      if (isNaN(target.getTime())) {
        return NextResponse.json({ error: 'Invalid time parameter' }, { status: 400 })
      }

      const registrants = await prisma.externalWebinarRegistration.findMany({
        where: { ...whereClause, scheduledStartTime: target },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          country: true,
          timezone: true,
          registeredAt: true,
          attended: true,
          watchTimeMinutes: true,
          liveRoomUrl: true,
          scheduledStartTime: true,
          externalWebinar: {
            select: { id: true, name: true, externalWebinarName: true, liveZoomAt: true, liveZoomLink: true },
          },
        },
        orderBy: { registeredAt: 'desc' },
      })

      const rows = registrants
        .map((r) => {
          const isZoom = isZoomReg(r)
          return {
            id: r.id,
            name: r.name,
            email: r.email,
            phone: r.phone,
            country: r.country,
            timezone: r.timezone,
            registeredAt: r.registeredAt,
            attended: r.attended,
            watchTimeMinutes: r.watchTimeMinutes,
            webinarId: r.externalWebinar?.id || null,
            webinarTitle: webinarName(r.externalWebinar),
            zoomLink: zoomLinkFor(r, isZoom),
            isZoom,
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
    const registrations = await prisma.externalWebinarRegistration.findMany({
      where: whereClause,
      select: {
        scheduledStartTime: true,
        liveRoomUrl: true,
        externalWebinar: {
          select: { id: true, name: true, externalWebinarName: true, liveZoomAt: true, liveZoomLink: true },
        },
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
      const isZoom = isZoomReg(reg)
      if (zoomOnly && !isZoom) continue

      const key = reg.scheduledStartTime.toISOString()
      let group = groups.get(key)
      if (!group) {
        group = { time: key, total: 0, isZoom: false, webinars: new Map(), zoomLinks: new Set() }
        groups.set(key, group)
      }
      group.total += 1
      if (isZoom) group.isZoom = true
      const link = zoomLinkFor(reg, isZoom)
      if (link) group.zoomLinks.add(link)

      const wid = reg.externalWebinar?.id
      if (wid) {
        const existing = group.webinars.get(wid)
        if (existing) {
          existing.count += 1
        } else {
          group.webinars.set(wid, { id: wid, title: webinarName(reg.externalWebinar), count: 1 })
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
