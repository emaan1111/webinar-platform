import { prisma } from '@/lib/prisma'

/**
 * Email opt-out shared by the human-facing /unsubscribe page and the RFC 8058
 * one-click endpoint (POST /api/unsubscribe/[id]).
 *
 * Reminder/follow-up emails carry a registration id that may belong to either
 * an internal `Registration` or an `ExternalWebinarRegistration` — the two
 * tables have disjoint cuid ids, so we simply try both.
 */
export interface UnsubscribeResult {
  kind: 'internal' | 'external'
  name: string | null
  email: string
  webinarTitle: string
  /** Internal webinars have a public page to link back to; external ones don't. */
  webinarSlug: string | null
  unsubscribedAt: Date | null
  /** True when this call flipped the flag (false if they were already opted out). */
  changed: boolean
}

export async function unsubscribeRegistration(id: string): Promise<UnsubscribeResult | null> {
  if (!id || id.length > 64) return null

  const internal = await prisma.registration.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      emailUnsubscribed: true,
      emailUnsubscribedAt: true,
      webinar: { select: { title: true, slug: true } },
    },
  })
  if (internal) {
    let unsubscribedAt = internal.emailUnsubscribedAt
    if (!internal.emailUnsubscribed) {
      unsubscribedAt = new Date()
      await prisma.registration.update({
        where: { id: internal.id },
        data: { emailUnsubscribed: true, emailUnsubscribedAt: unsubscribedAt },
      })
    }
    return {
      kind: 'internal',
      name: internal.name,
      email: internal.email,
      webinarTitle: internal.webinar.title,
      webinarSlug: internal.webinar.slug,
      unsubscribedAt,
      changed: !internal.emailUnsubscribed,
    }
  }

  const external = await prisma.externalWebinarRegistration.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      emailUnsubscribed: true,
      emailUnsubscribedAt: true,
      externalWebinar: { select: { name: true, externalWebinarName: true } },
    },
  })
  if (external) {
    let unsubscribedAt = external.emailUnsubscribedAt
    if (!external.emailUnsubscribed) {
      unsubscribedAt = new Date()
      await prisma.externalWebinarRegistration.update({
        where: { id: external.id },
        data: { emailUnsubscribed: true, emailUnsubscribedAt: unsubscribedAt },
      })
    }
    return {
      kind: 'external',
      name: external.name,
      email: external.email,
      webinarTitle: external.externalWebinar.externalWebinarName || external.externalWebinar.name,
      webinarSlug: null,
      unsubscribedAt,
      changed: !external.emailUnsubscribed,
    }
  }

  return null
}
