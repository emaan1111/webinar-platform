import { describe, it, expect } from 'vitest'
import {
  isWithinBookingWindow,
  filterToBookingWindow,
  normalizeBookingWindow,
  describeBookingWindow,
} from '../bookingWindow'

const NOW = new Date('2026-09-05T12:00:00.000Z')
const inHours = (h: number) => new Date(NOW.getTime() + h * 60 * 60 * 1000)

describe('isWithinBookingWindow', () => {
  it('allows everything when neither bound is set', () => {
    expect(isWithinBookingWindow(inHours(0.1), {}, NOW)).toBe(true)
    expect(isWithinBookingWindow(inHours(500), {}, NOW)).toBe(true)
    expect(isWithinBookingWindow(inHours(0.1), null, NOW)).toBe(true)
  })

  it('hides sessions closer than the floor', () => {
    const w = { minBookingLeadMinutes: 120 } // "nothing only 2 hrs away"
    expect(isWithinBookingWindow(inHours(1), w, NOW)).toBe(false)
    expect(isWithinBookingWindow(inHours(1.99), w, NOW)).toBe(false)
    expect(isWithinBookingWindow(inHours(3), w, NOW)).toBe(true)
  })

  it('hides sessions further out than the ceiling', () => {
    const w = { maxBookingLeadMinutes: 720 } // "nothing more than 12 hrs away"
    expect(isWithinBookingWindow(inHours(11), w, NOW)).toBe(true)
    expect(isWithinBookingWindow(inHours(13), w, NOW)).toBe(false)
    expect(isWithinBookingWindow(inHours(48), w, NOW)).toBe(false)
  })

  it('treats both bounds as inclusive, so a boundary time is still offered', () => {
    const w = { minBookingLeadMinutes: 120, maxBookingLeadMinutes: 720 }
    expect(isWithinBookingWindow(inHours(2), w, NOW)).toBe(true)
    expect(isWithinBookingWindow(inHours(12), w, NOW)).toBe(true)
  })

  it('applies both bounds together', () => {
    const w = { minBookingLeadMinutes: 120, maxBookingLeadMinutes: 720 }
    expect(isWithinBookingWindow(inHours(1), w, NOW)).toBe(false)
    expect(isWithinBookingWindow(inHours(6), w, NOW)).toBe(true)
    expect(isWithinBookingWindow(inHours(20), w, NOW)).toBe(false)
  })

  it('rejects a session already in the past when a floor is set', () => {
    expect(isWithinBookingWindow(inHours(-1), { minBookingLeadMinutes: 120 }, NOW)).toBe(false)
  })

  it('a crossed-over window can never be satisfied', () => {
    const w = { minBookingLeadMinutes: 720, maxBookingLeadMinutes: 120 }
    expect(isWithinBookingWindow(inHours(2), w, NOW)).toBe(false)
    expect(isWithinBookingWindow(inHours(12), w, NOW)).toBe(false)
  })

  it('treats blank, zero and negative bounds as no bound', () => {
    // A cleared input must reopen that side, not forbid every session.
    expect(isWithinBookingWindow(inHours(0.1), { minBookingLeadMinutes: 0 }, NOW)).toBe(true)
    expect(isWithinBookingWindow(inHours(999), { maxBookingLeadMinutes: 0 }, NOW)).toBe(true)
    expect(isWithinBookingWindow(inHours(999), { maxBookingLeadMinutes: -5 }, NOW)).toBe(true)
    expect(isWithinBookingWindow(inHours(999), { maxBookingLeadMinutes: null }, NOW)).toBe(true)
  })

  it('accepts ISO strings and epoch millis, and rejects unparseable times', () => {
    const w = { maxBookingLeadMinutes: 720 }
    expect(isWithinBookingWindow(inHours(6).toISOString(), w, NOW)).toBe(true)
    expect(isWithinBookingWindow(inHours(6).getTime(), w, NOW)).toBe(true)
    expect(isWithinBookingWindow('not-a-date', w, NOW)).toBe(false)
  })
})

describe('filterToBookingWindow', () => {
  const options = [
    { id: 'jit', at: inHours(0.25) }, // "starting soon", 15 min out
    { id: 'soon', at: inHours(3) },
    { id: 'tonight', at: inHours(9) },
    { id: 'tomorrow', at: inHours(26) },
  ]

  it('returns the list untouched when no bound is set', () => {
    expect(filterToBookingWindow(options, (o) => o.at, {}, NOW)).toHaveLength(4)
  })

  it('drops the just-in-time option when a floor is above its lead time', () => {
    const kept = filterToBookingWindow(options, (o) => o.at, { minBookingLeadMinutes: 120 }, NOW)
    expect(kept.map((o) => o.id)).toEqual(['soon', 'tonight', 'tomorrow'])
  })

  it('keeps only same-day times under a 12-hour ceiling', () => {
    const kept = filterToBookingWindow(options, (o) => o.at, { maxBookingLeadMinutes: 720 }, NOW)
    expect(kept.map((o) => o.id)).toEqual(['jit', 'soon', 'tonight'])
  })

  it('combines both bounds', () => {
    const kept = filterToBookingWindow(
      options,
      (o) => o.at,
      { minBookingLeadMinutes: 120, maxBookingLeadMinutes: 720 },
      NOW
    )
    expect(kept.map((o) => o.id)).toEqual(['soon', 'tonight'])
  })

  it('can legitimately return nothing', () => {
    const kept = filterToBookingWindow(options, (o) => o.at, { minBookingLeadMinutes: 6000 }, NOW)
    expect(kept).toEqual([])
  })

  it('exempts an option whose start is reported as null (how Zoom sessions opt out)', () => {
    // The external picker passes null for `x|z|` ids so a linked live Zoom session is
    // offered however near or far it is — both bounds are bypassed, not just the ceiling.
    const withZoom = [
      { id: 'zoom-far', at: inHours(200) },
      { id: 'zoom-near', at: inHours(0.1) },
      ...options,
    ]
    const kept = filterToBookingWindow(
      withZoom,
      (o) => (o.id.startsWith('zoom-') ? null : o.at),
      { minBookingLeadMinutes: 120, maxBookingLeadMinutes: 720 },
      NOW
    )
    expect(kept.map((o) => o.id)).toEqual(['zoom-far', 'zoom-near', 'soon', 'tonight'])
  })

  it('leaves an option with no resolvable start alone', () => {
    const withUnknown = [...options, { id: 'unknown', at: null as any }]
    const kept = filterToBookingWindow(
      withUnknown,
      (o) => o.at,
      { minBookingLeadMinutes: 120 },
      NOW
    )
    expect(kept.map((o) => o.id)).toContain('unknown')
  })
})

describe('normalizeBookingWindow', () => {
  it('nulls out inactive bounds', () => {
    expect(normalizeBookingWindow({ minBookingLeadMinutes: 0, maxBookingLeadMinutes: 720 })).toEqual({
      min: null,
      max: 720,
    })
    expect(normalizeBookingWindow(undefined)).toEqual({ min: null, max: null })
  })
})

describe('describeBookingWindow', () => {
  it('reads naturally for each shape', () => {
    expect(describeBookingWindow({})).toBe('Any upcoming time')
    expect(describeBookingWindow({ minBookingLeadMinutes: 120 })).toBe('At least 2 hours from now')
    expect(describeBookingWindow({ maxBookingLeadMinutes: 720 })).toBe('Within 12 hours from now')
    expect(describeBookingWindow({ minBookingLeadMinutes: 60 })).toBe('At least 1 hour from now')
    expect(describeBookingWindow({ minBookingLeadMinutes: 30 })).toBe('At least 30 minutes from now')
    expect(
      describeBookingWindow({ minBookingLeadMinutes: 120, maxBookingLeadMinutes: 720 })
    ).toBe('Between 2 hours and 12 hours from now')
  })
})
