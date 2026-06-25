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

// Roster for a Zoom session = every registrant of the webinars associated with
// it. The association is the source of truth (no time matching).
export async function loadRoster(webinars: WebinarLink[]): Promise<ZoomRosterRow[]> {
  const { external, internal } = linkedIds(webinars)
  const rows: ZoomRosterRow[] = []

  if (external.length) {
    const ext = await prisma.externalWebinarRegistration.findMany({
      where: { externalWebinarId: { in: external } },
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
      where: { webinarId: { in: internal } },
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
export async function countRoster(webinars: WebinarLink[]): Promise<number> {
  const { external, internal } = linkedIds(webinars)
  let total = 0
  if (external.length) {
    total += await prisma.externalWebinarRegistration.count({
      where: { externalWebinarId: { in: external } },
    })
  }
  if (internal.length) {
    total += await prisma.registration.count({
      where: { webinarId: { in: internal } },
    })
  }
  return total
}
