import { describe, it, expect } from 'vitest'
import { parseEmaanSalePayload } from '../emaanSale'

/** A payload shaped the way Emaan's worker actually sends one. */
function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    orderId: 'emaan-list123-contact456',
    email: 'Buyer@Example.com',
    name: 'Jane Buyer',
    amount: 297,
    currency: 'usd',
    productName: 'ShepherdsCoachingRoadmap',
    purchasedAt: '2026-09-15T04:30:00.000Z',
    externalWebinarId: 'extweb_1',
    source: 'emaan-sale-list',
    ...overrides,
  }
}

function expectOk(payload: unknown) {
  const res = parseEmaanSalePayload(payload)
  if (!res.ok) throw new Error(`expected parse to succeed, got: ${res.error}`)
  return res.value
}

function expectError(payload: unknown) {
  const res = parseEmaanSalePayload(payload)
  if (res.ok) throw new Error('expected parse to fail, but it succeeded')
  return res.error
}

describe('parseEmaanSalePayload', () => {
  it('accepts a well-formed push and normalizes it', () => {
    const sale = expectOk(validPayload())

    expect(sale.orderId).toBe('emaan-list123-contact456')
    expect(sale.amount).toBe(297)
    expect(sale.productName).toBe('ShepherdsCoachingRoadmap')
    expect(sale.externalWebinarId).toBe('extweb_1')
    expect(sale.purchasedAt.toISOString()).toBe('2026-09-15T04:30:00.000Z')
  })

  it('lowercases the email so registration matching is case-insensitive', () => {
    expect(expectOk(validPayload()).email).toBe('buyer@example.com')
  })

  it('uppercases the currency, since reports group on the code', () => {
    expect(expectOk(validPayload()).currency).toBe('USD')
  })

  describe('a sale with no webinar', () => {
    // Emaan sends null when it cannot tie the buyer to a session. That is a
    // legitimate answer — the sale is recorded unlinked, never dropped.
    it('is accepted when externalWebinarId is null', () => {
      expect(expectOk(validPayload({ externalWebinarId: null })).externalWebinarId).toBeNull()
    })

    it('is accepted when externalWebinarId is absent entirely', () => {
      const { externalWebinarId: _omit, ...rest } = validPayload()
      expect(expectOk(rest).externalWebinarId).toBeNull()
    })

    it('treats a blank webinar id as no webinar rather than a webinar named ""', () => {
      expect(expectOk(validPayload({ externalWebinarId: '   ' })).externalWebinarId).toBeNull()
    })
  })

  describe('identity', () => {
    it('rejects a push with no orderId — retries would duplicate the sale', () => {
      expect(expectError(validPayload({ orderId: '' }))).toMatch(/orderId/)
    })

    it('rejects a push with no email', () => {
      expect(expectError(validPayload({ email: '  ' }))).toMatch(/email/)
    })
  })

  describe('amount', () => {
    it('rejects a missing amount rather than booking a $0 sale', () => {
      const { amount: _omit, ...rest } = validPayload()
      expect(expectError(rest)).toMatch(/amount is required/)
    })

    it('rejects null and empty-string amounts for the same reason', () => {
      expect(expectError(validPayload({ amount: null }))).toMatch(/amount is required/)
      expect(expectError(validPayload({ amount: '' }))).toMatch(/amount is required/)
    })

    it('rejects a non-numeric amount instead of storing NaN', () => {
      expect(expectError(validPayload({ amount: 'free' }))).toMatch(/non-negative number/)
    })

    it('rejects a negative amount', () => {
      expect(expectError(validPayload({ amount: -1 }))).toMatch(/non-negative number/)
    })

    it('allows a genuine zero — a fully discounted order is still a sale', () => {
      expect(expectOk(validPayload({ amount: 0 })).amount).toBe(0)
    })

    it('accepts a numeric string, which is how JSON often carries money', () => {
      expect(expectOk(validPayload({ amount: '297.50' })).amount).toBe(297.5)
    })
  })

  describe('purchasedAt', () => {
    it('rejects an unparseable date rather than storing Invalid Date', () => {
      expect(expectError(validPayload({ purchasedAt: 'last Tuesday' }))).toMatch(/valid date/)
    })

    it('rejects a non-string, non-Date value', () => {
      expect(expectError(validPayload({ purchasedAt: 12345 }))).toMatch(/valid date/)
    })

    it('defaults to now when absent, so an omitted date is not an error', () => {
      const { purchasedAt: _omit, ...rest } = validPayload()
      const before = Date.now()
      const sale = expectOk(rest)
      expect(sale.purchasedAt.getTime()).toBeGreaterThanOrEqual(before)
    })

    it('preserves the exact instant Emaan sent, not the time we received it', () => {
      const sale = expectOk(validPayload({ purchasedAt: '2026-06-06T22:15:00.000Z' }))
      expect(sale.purchasedAt.toISOString()).toBe('2026-06-06T22:15:00.000Z')
    })
  })

  describe('defaults', () => {
    it('falls back to USD, a generic product name and no buyer name', () => {
      const sale = expectOk({
        orderId: 'o1',
        email: 'a@b.com',
        amount: 10,
      })
      expect(sale.currency).toBe('USD')
      expect(sale.productName).toBe('Emaan Sale')
      expect(sale.name).toBeNull()
      expect(sale.source).toBe('emaan')
    })
  })

  describe('malformed bodies', () => {
    it.each([null, undefined, 'a string', 42])('rejects %p', (body) => {
      expect(expectError(body)).toMatch(/JSON object/)
    })
  })
})
