import { describe, expect, it } from 'vitest'
import type { ReportTotals } from '../columns'
import {
  baselineFromTotals,
  conversionScale,
  DAYS_PER_YEAR,
  deriveRates,
  engagedConversionFromAttendees,
  engagedConversionFromRegistrations,
  FALLBACK_INPUTS,
  inputsEqual,
  ProfitInputs,
  profitOverDays,
  projectScenario,
  sliderScale,
} from '../profitModel'

/**
 * The slice of a range's totals the planner reads, with the same rate
 * definitions computeTotals() uses (counts summed first, then divided).
 */
function makeTotals(counts: {
  days: number
  spend: number
  registrations: number
  totalAttendees: number
  engagedTotal: number
  salesTotal: number
  revenue: number
}): ReportTotals {
  const ratio = (num: number, den: number, scale = 1) => (den > 0 ? (num / den) * scale : 0)
  return {
    ...counts,
    profit: counts.revenue - counts.spend,
    costPerRegistration: ratio(counts.spend, counts.registrations),
    attendanceRate: ratio(counts.totalAttendees, counts.registrations, 100),
    engagementRateTotal: ratio(counts.engagedTotal, counts.totalAttendees, 100),
    averageOrderValue: ratio(counts.revenue, counts.salesTotal),
  } as unknown as ReportTotals
}

const REAL = makeTotals({
  days: 7,
  spend: 2800,
  registrations: 700,
  totalAttendees: 280,
  engagedTotal: 140,
  salesTotal: 14,
  revenue: 4158,
})

const inputs = (over: Partial<ProfitInputs> = {}): ProfitInputs => ({
  ...FALLBACK_INPUTS,
  upsellRate: 0,
  ...over,
})

describe('deriveRates', () => {
  it('walks registrations down the funnel to sales', () => {
    const r = deriveRates(
      inputs({ registrationsPerDay: 200, showUpRate: 40, engagedRate: 50, conversionOfEngaged: 10 })
    )
    expect(r.attendeesPerDay).toBe(80)
    expect(r.engagedPerDay).toBe(40)
    expect(r.salesPerDay).toBe(4)
  })

  it('reports one conversion rate against all three denominators', () => {
    const r = deriveRates(
      inputs({ showUpRate: 40, engagedRate: 50, conversionOfEngaged: 10 })
    )
    expect(r.conversionOfEngaged).toBe(10)
    expect(r.conversionOfAttendees).toBeCloseTo(5, 10)
    expect(r.conversionOfRegistrations).toBeCloseTo(2, 10)
  })

  it('charges for every registration, sold to or not', () => {
    const r = deriveRates(inputs({ registrationsPerDay: 120, costPerRegistration: 7.5 }))
    expect(r.adSpendPerDay).toBe(900)
  })
})

describe('profitOverDays', () => {
  const flat = inputs({
    registrationsPerDay: 100,
    costPerRegistration: 5,
    showUpRate: 50,
    engagedRate: 50,
    conversionOfEngaged: 8,
    price: 300,
  })

  it('is the daily margin repeated when there is no upsell', () => {
    const rates = deriveRates(flat)
    // 2 sales a day at $300 against $500 of spend.
    expect(rates.coreRevenuePerDay - rates.adSpendPerDay).toBe(100)
    expect(profitOverDays(flat, rates, 0, 10)).toBe(1000)
  })

  it('counts a loss when the traffic costs more than it returns', () => {
    const bad = { ...flat, costPerRegistration: 20 }
    expect(profitOverDays(bad, deriveRates(bad), 0, 30)).toBeLessThan(0)
  })

  it('grows year two as renewals stack up behind year one', () => {
    const subs = { ...flat, upsellRate: 50, upsellPrice: 200, renewMonths: 6, churnRate: 10 }
    const rates = deriveRates(subs)
    const y1 = profitOverDays(subs, rates, 0, DAYS_PER_YEAR)
    const y2 = profitOverDays(subs, rates, DAYS_PER_YEAR, 2 * DAYS_PER_YEAR)
    expect(y2).toBeGreaterThan(y1)
  })

  it('keeps every subscriber at 0% churn, and loses them all at 100%', () => {
    const base = { ...flat, upsellRate: 100, upsellPrice: 100, renewMonths: 1 }
    const kept = { ...base, churnRate: 0 }
    const lost = { ...base, churnRate: 100 }
    const year = (i: ProfitInputs) => profitOverDays(i, deriveRates(i), 0, DAYS_PER_YEAR)
    expect(year(kept)).toBeGreaterThan(year(lost))
    // At 100% churn nobody ever renews, so only first-time upsells are earned:
    // 2 sales/day x $100, on top of the $100/day the core funnel makes.
    expect(year(lost)).toBeCloseTo(300 * DAYS_PER_YEAR, 6)
  })
})

describe('the conversion dials', () => {
  it('round-trips a rate set against registrations', () => {
    const start = inputs({ showUpRate: 40, engagedRate: 50 })
    const next = { ...start, conversionOfEngaged: engagedConversionFromRegistrations(3, start) }
    expect(deriveRates(next).conversionOfRegistrations).toBeCloseTo(3, 10)
  })

  it('round-trips a rate set against attendees', () => {
    const start = inputs({ showUpRate: 40, engagedRate: 25 })
    const next = { ...start, conversionOfEngaged: engagedConversionFromAttendees(6, start) }
    expect(deriveRates(next).conversionOfAttendees).toBeCloseTo(6, 10)
  })

  it('leaves the dial alone when nobody gets that far down the funnel', () => {
    const dead = inputs({ engagedRate: 0, conversionOfEngaged: 8 })
    expect(engagedConversionFromRegistrations(5, dead)).toBe(8)
    expect(engagedConversionFromAttendees(5, dead)).toBe(8)
  })
})

describe('baselineFromTotals', () => {
  it('reproduces the profit the report measured', () => {
    const { inputs: seeded } = baselineFromTotals(REAL)
    const rates = deriveRates(seeded)
    expect(rates.salesPerDay).toBeCloseTo(14 / 7, 10)
    expect(rates.coreRevenuePerDay - rates.adSpendPerDay).toBeCloseTo((4158 - 2800) / 7, 10)
    expect(projectScenario(seeded).firstYear).toBeCloseTo(((4158 - 2800) / 7) * DAYS_PER_YEAR, 6)
  })

  it('reads every measurable dial off the range', () => {
    const { inputs: seeded, fromReport } = baselineFromTotals(REAL)
    expect(seeded.registrationsPerDay).toBe(100)
    expect(seeded.costPerRegistration).toBe(4)
    expect(seeded.showUpRate).toBe(40)
    expect(seeded.engagedRate).toBe(50)
    expect(seeded.conversionOfEngaged).toBeCloseTo(10, 10)
    expect(seeded.price).toBe(297)
    expect(fromReport).toEqual([
      'registrationsPerDay',
      'costPerRegistration',
      'showUpRate',
      'engagedRate',
      'conversionOfEngaged',
      'price',
    ])
  })

  it('never passes the untracked upsell off as measured', () => {
    const { inputs: seeded, fromReport } = baselineFromTotals(REAL)
    expect(seeded.upsellRate).toBe(0)
    expect(fromReport).not.toContain('upsellRate')
    expect(fromReport).not.toContain('churnRate')
  })

  it('says so when a range has no sales to price', () => {
    const noSales = makeTotals({
      days: 7,
      spend: 700,
      registrations: 350,
      totalAttendees: 140,
      engagedTotal: 70,
      salesTotal: 0,
      revenue: 0,
    })
    const { inputs: seeded, fromReport, notes } = baselineFromTotals(noSales)
    expect(fromReport).not.toContain('price')
    expect(seeded.price).toBe(297)
    expect(seeded.conversionOfEngaged).toBe(0)
    expect(notes.join(' ')).toContain('No sales in this range')
  })

  it('leaves registrations free when no ad spend was recorded', () => {
    const organic = makeTotals({
      days: 2,
      spend: 0,
      registrations: 40,
      totalAttendees: 20,
      engagedTotal: 10,
      salesTotal: 1,
      revenue: 100,
    })
    const { inputs: seeded, fromReport, notes } = baselineFromTotals(organic)
    expect(seeded.costPerRegistration).toBe(0)
    expect(fromReport).not.toContain('costPerRegistration')
    expect(notes.join(' ')).toContain('No ad spend')
  })

  it('falls back to round guesses on an empty range', () => {
    const { inputs: seeded, fromReport, notes } = baselineFromTotals(null)
    expect(seeded).toEqual(FALLBACK_INPUTS)
    expect(fromReport).toEqual([])
    expect(notes).toHaveLength(1)
  })
})

describe('inputsEqual', () => {
  it('spots a moved dial and ignores floating-point dust', () => {
    const a = baselineFromTotals(REAL).inputs
    expect(inputsEqual(a, { ...a })).toBe(true)
    expect(inputsEqual(a, { ...a, price: a.price + 1e-12 })).toBe(true)
    expect(inputsEqual(a, { ...a, price: a.price + 1 })).toBe(false)
  })
})

describe('slider scales', () => {
  it('leaves a dial the seed already fits on alone', () => {
    expect(sliderScale('registrationsPerDay', 100)).toEqual({ min: 0, max: 1000, step: 5 })
  })

  it('grows past the seed so it lands inside the track', () => {
    const scale = sliderScale('registrationsPerDay', 4000)
    expect(scale.max).toBeGreaterThan(4000)
    expect(scale.max % 1000).toBe(0)
  })

  it('keeps percentages on their natural scale', () => {
    expect(sliderScale('showUpRate', 250).max).toBe(100)
    expect(sliderScale('churnRate', 120).max).toBe(100)
  })

  it('widens the shared conversion scale for an unusually good funnel', () => {
    expect(conversionScale(4, 10).max).toBe(10)
    expect(conversionScale(40, 10).max).toBe(60)
  })
})
