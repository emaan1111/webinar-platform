import crypto from 'crypto'

/**
 * Short HMAC-signed token bound to an Order id. Used to gate access to:
 *  - POST /api/checkout/upsell  (otherwise anyone with an orderId could
 *    charge the customer's saved payment method)
 *  - GET  /api/orders/[id]      (otherwise anyone with an orderId could
 *    read the customer's PII / order summary)
 *
 * The token is returned alongside `orderId` from POST /api/checkout/initial
 * and rides as a URL param across the funnel pages. Stateless: we don't
 * need a server-side session, just the secret.
 *
 * Falls back to NEXTAUTH_SECRET if ORDER_TOKEN_SECRET isn't set so the
 * system works out of the box without extra env config.
 */
function getSecret(): string {
  const s = process.env.ORDER_TOKEN_SECRET || process.env.NEXTAUTH_SECRET
  if (!s) {
    // Should never happen in prod — NEXTAUTH_SECRET is required for auth.
    throw new Error('ORDER_TOKEN_SECRET / NEXTAUTH_SECRET not set')
  }
  return s
}

export function signOrderToken(orderId: string): string {
  const hmac = crypto.createHmac('sha256', getSecret())
  hmac.update(orderId)
  // 16-byte (32 hex char) prefix is plenty: 2^128 search space.
  return hmac.digest('hex').slice(0, 32)
}

export function verifyOrderToken(orderId: string, token: string | null | undefined): boolean {
  if (!token) return false
  let expected: string
  try {
    expected = signOrderToken(orderId)
  } catch {
    return false
  }
  if (token.length !== expected.length) return false
  // Constant-time compare to avoid timing attacks.
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
}
