/**
 * A sale hangs off either an internal webinar or an external one, never both.
 * Readers shouldn't care which: these helpers collapse the two shapes into one.
 */

/** Prisma `include` that pulls both sides of the link in one query. */
export const saleLinkInclude = {
  registration: {
    select: { id: true, name: true, email: true, attended: true },
  },
  webinar: {
    select: { id: true, title: true },
  },
  externalRegistration: {
    select: { id: true, name: true, email: true, attended: true },
  },
  externalWebinar: {
    select: { id: true, name: true },
  },
} as const

type LinkedSale = {
  registrationId: string | null
  externalRegistrationId?: string | null
  registration?: { id: string; name: string | null; attended: boolean } | null
  externalRegistration?: { id: string; name: string | null; attended: boolean } | null
  webinar?: { id: string; title: string } | null
  externalWebinar?: { id: string; name: string } | null
}

/** True when the sale is attached to a registration of either kind. */
export function isLinkedToRegistration(sale: LinkedSale): boolean {
  return Boolean(sale.registrationId || sale.externalRegistrationId)
}

/** The buyer's registration, whichever table it lives in. */
export function saleRegistration(sale: LinkedSale) {
  return sale.registration ?? sale.externalRegistration ?? null
}

/** The webinar the sale is attributed to, whichever table it lives in. */
export function saleWebinarName(sale: LinkedSale): string | null {
  return sale.webinar?.title ?? sale.externalWebinar?.name ?? null
}

/** Did the buyer show up? `null` when the sale isn't linked to a registration. */
export function saleAttended(sale: LinkedSale): boolean | null {
  const reg = saleRegistration(sale)
  return reg ? reg.attended : null
}
