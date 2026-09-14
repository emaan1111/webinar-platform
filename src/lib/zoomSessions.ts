import type { ZoomSessionSlot } from '@/lib/reports/zoomSessionFilter'
import { prisma } from '@/lib/prisma'

// A linked-webinar row from ZoomSessionWebinar (only the fields we need).
type WebinarLink = {
  webinarType: string
  externalWebinarId: string | null
  webinarId: string | null
}

export type ZoomRosterRow = {
  id: string
  source: 'external' | 'internal'
  name: string
  email: string
  phone: string | null
  country: string | null
  timezone: string | null
  registeredAt: Date
  attended: boolean
  webinarId: string | null
  webinarTitle: string
}

export type LinkedZoomSession = {
  id: string
  name: string
  zoomLink: string | null
  scheduledAt: Date
  timezone: string
}

// All active Zoom sessions linked to an external webinar, soonest first.
// A session is "linked" via a ZoomSessionWebinar join row (the checkboxes on the
// sessions page / the webinar's session list) or via the legacy single
// liveZoomSessionId pointer — the union covers rows where the two drifted.
// Linked sessions with a Zoom link are what the registration picker offers.
export async function getLinkedZoomSessions(externalWebinarId: string): Promise<LinkedZoomSession[]> {
  return prisma.zoomSession.findMany({
    where: {
      isActive: true,
      OR: [
        { webinars: { some: { externalWebinarId } } },
        { externalWebinarsLive: { some: { id: externalWebinarId } } },
      ],
    },
    select: { id: true, name: true, zoomLink: true, scheduledAt: true, timezone: true },
    orderBy: { scheduledAt: 'asc' },
  })
}

// Split linked webinars into external + internal id lists.
export function linkedIds(webinars: WebinarLink[]) {
  const external = webinars
    .filter((w) => w.webinarType === 'external' && w.externalWebinarId)
    .map((w) => w.externalWebinarId as string)
  const internal = webinars
    .filter((w) => w.webinarType === 'internal' && w.webinarId)
    .map((w) => w.webinarId as string)
  return { external, internal }
}

// Roster for a Zoom session = registrants of the associated webinars who
// registered for this session's time slot (scheduledStartTime === the session's
// instant). The session's time scopes a webinar's full list down to just the
// people coming to this session.
export async function loadRoster(scheduledAt: Date, webinars: WebinarLink[]): Promise<ZoomRosterRow[]> {
  const { external, internal } = linkedIds(webinars)
  const rows: ZoomRosterRow[] = []

  if (external.length) {
    const ext = await prisma.externalWebinarRegistration.findMany({
      where: { externalWebinarId: { in: external }, scheduledStartTime: scheduledAt },
      select: {
        id: true, name: true, email: true, phone: true, country: true, timezone: true,
        registeredAt: true, attended: true,
        externalWebinar: { select: { id: true, name: true, externalWebinarName: true } },
      },
      orderBy: { registeredAt: 'desc' },
    })
    for (const r of ext) {
      rows.push({
        id: r.id, source: 'external', name: r.name, email: r.email, phone: r.phone,
        country: r.country, timezone: r.timezone, registeredAt: r.registeredAt, attended: r.attended,
        webinarId: r.externalWebinar?.id ?? null,
        webinarTitle: r.externalWebinar?.name || r.externalWebinar?.externalWebinarName || 'Unknown webinar',
      })
    }
  }

  if (internal.length) {
    const int = await prisma.registration.findMany({
      where: { webinarId: { in: internal }, scheduledStartTime: scheduledAt },
      select: {
        id: true, name: true, email: true, phone: true, country: true, timezone: true,
        registeredAt: true, attended: true,
        webinar: { select: { id: true, title: true } },
      },
      orderBy: { registeredAt: 'desc' },
    })
    for (const r of int) {
      rows.push({
        id: r.id, source: 'internal', name: r.name, email: r.email, phone: r.phone,
        country: r.country, timezone: r.timezone, registeredAt: r.registeredAt, attended: r.attended,
        webinarId: r.webinar?.id ?? null,
        webinarTitle: r.webinar?.title || 'Unknown webinar',
      })
    }
  }

  return rows.sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime())
}

// Count of the roster (cheaper than loading rows — used for the list view).
export async function countRoster(scheduledAt: Date, webinars: WebinarLink[]): Promise<number> {
  const { external, internal } = linkedIds(webinars)
  let total = 0
  if (external.length) {
    total += await prisma.externalWebinarRegistration.count({
      where: { externalWebinarId: { in: external }, scheduledStartTime: scheduledAt },
    })
  }
  if (internal.length) {
    total += await prisma.registration.count({
      where: { webinarId: { in: internal }, scheduledStartTime: scheduledAt },
    })
  }
  return total
}

// Every (webinar, start instant) pair at which a live Zoom session is offered,
// for the reports Zoom filter. There are four ways a registrant's chosen time
// can be a Zoom time, and a filter that missed any of them would miscount:
//   1. a ZoomSession linked to the webinar by a ZoomSessionWebinar join row
//      (the checkboxes on the sessions page), external or internal;
//   2. a ZoomSession linked by the legacy single liveZoomSessionId pointer -
//      the same union getLinkedZoomSessions() takes, for rows where the two
//      representations drifted;
//   3. an external webinar's own live Zoom (liveZoomEnabled + liveZoomAt),
//      which has no ZoomSession row behind it at all;
//   4. an internal webinar's Zoom schedule row (WebinarSchedule.isZoomSession).
// Duplicates across these sources are harmless - the clause builder groups
// slots by instant and de-duplicates the webinar ids.
export async function loadZoomSessionSlots(): Promise<ZoomSessionSlot[]> {
  const [sessions, liveZoomWebinars, internalZoomSchedules] = await Promise.all([
    prisma.zoomSession.findMany({
      where: { isActive: true },
      select: {
        scheduledAt: true,
        webinars: { select: { webinarType: true, externalWebinarId: true, webinarId: true } },
        externalWebinarsLive: { select: { id: true } },
      },
    }),
    prisma.externalWebinar.findMany({
      where: { liveZoomEnabled: true, liveZoomAt: { not: null } },
      select: { id: true, liveZoomAt: true },
    }),
    prisma.webinarSchedule.findMany({
      where: { isZoomSession: true, isActive: true, scheduledAt: { not: null } },
      select: { webinarId: true, scheduledAt: true },
    }),
  ])

  const slots: ZoomSessionSlot[] = []

  for (const session of sessions) {
    for (const link of session.webinars) {
      if (link.webinarType === 'external' && link.externalWebinarId) {
        slots.push({
          webinarType: 'external',
          webinarId: link.externalWebinarId,
          scheduledAt: session.scheduledAt,
        })
      } else if (link.webinarType === 'internal' && link.webinarId) {
        slots.push({
          webinarType: 'internal',
          webinarId: link.webinarId,
          scheduledAt: session.scheduledAt,
        })
      }
    }
    for (const webinar of session.externalWebinarsLive) {
      slots.push({ webinarType: 'external', webinarId: webinar.id, scheduledAt: session.scheduledAt })
    }
  }

  for (const webinar of liveZoomWebinars) {
    if (webinar.liveZoomAt) {
      slots.push({ webinarType: 'external', webinarId: webinar.id, scheduledAt: webinar.liveZoomAt })
    }
  }

  for (const schedule of internalZoomSchedules) {
    if (schedule.scheduledAt) {
      slots.push({
        webinarType: 'internal',
        webinarId: schedule.webinarId,
        scheduledAt: schedule.scheduledAt,
      })
    }
  }

  return slots
}
