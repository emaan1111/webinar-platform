/**
 * Emaan sale pushes — payload parsing.
 *
 * Emaan treats joining one configured contact list as a sale and POSTs each new
 * member to /api/integrations/emaan/sale. The parsing lives here rather than in
 * the route so it can be tested without a database: everything that decides
 * whether a sale is recorded, and with what values, is a pure function of the
 * body.
 *
 * The rule throughout is that a validation failure must be a real one. Emaan
 * gives up permanently on a 4xx, so rejecting a payload we could have
 * understood loses the sale for good — but storing a field we did not check
 * (an Invalid Date, a negative amount) corrupts every report it appears in.
 * So: reject what is genuinely unusable, default what is merely absent.
 */

export interface EmaanSaleInput {
  /** Stable per (list, contact) on Emaan's side, so retries are idempotent. */
  orderId: string
  /** Lowercased — the matching against our registrations is case-insensitive. */
  email: string
  name: string | null
  amount: number
  currency: string
  productName: string
  purchasedAt: Date
  /**
   * The ExternalWebinar Emaan attributed the sale to, or null when it could not
   * tie the buyer to a session. Null is a legitimate answer, not an error: the
   * sale is recorded unlinked rather than dropped.
   */
  externalWebinarId: string | null
  source: string
}

export type ParseResult =
  | { ok: true; value: EmaanSaleInput }
  | { ok: false; error: string }

function trimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function parseEmaanSalePayload(payload: unknown): ParseResult {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Body must be a JSON object' }
  }
  const body = payload as Record<string, unknown>

  const orderId = trimmedString(body.orderId)
  if (!orderId) return { ok: false, error: 'orderId is required' }

  const email = trimmedString(body.email).toLowerCase()
  if (!email) return { ok: false, error: 'email is required' }

  // Number('') is 0 and Number(null) is 0, so check the raw value first —
  // otherwise a missing amount silently books a $0 sale.
  if (body.amount === undefined || body.amount === null || body.amount === '') {
    return { ok: false, error: 'amount is required' }
  }
  const amount = Number(body.amount)
  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: 'amount must be a non-negative number' }
  }

  // An unparseable date stored as Invalid Date blanks every sales chart the
  // row lands in, so it is worth rejecting. An absent one just means "now".
  let purchasedAt: Date
  if (body.purchasedAt === undefined || body.purchasedAt === null || body.purchasedAt === '') {
    purchasedAt = new Date()
  } else if (typeof body.purchasedAt === 'string' || body.purchasedAt instanceof Date) {
    purchasedAt = new Date(body.purchasedAt)
    if (Number.isNaN(purchasedAt.getTime())) {
      return { ok: false, error: 'purchasedAt is not a valid date' }
    }
  } else {
    return { ok: false, error: 'purchasedAt is not a valid date' }
  }

  const currency = trimmedString(body.currency).toUpperCase() || 'USD'
  const productName = trimmedString(body.productName) || 'Emaan Sale'
  const name = trimmedString(body.name) || null
  const externalWebinarId = trimmedString(body.externalWebinarId) || null
  const source = trimmedString(body.source) || 'emaan'

  return {
    ok: true,
    value: {
      orderId,
      email,
      name,
      amount,
      currency,
      productName,
      purchasedAt,
      externalWebinarId,
      source,
    },
  }
}
