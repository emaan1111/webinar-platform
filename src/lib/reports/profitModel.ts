/**
 * The funnel maths behind the Reports "Profit Planner" tab.
 *
 * The planner takes the numbers the report already measured - registrations a
 * day, what a registration costs, who shows up, who stays, who buys, for how
 * much - and runs them forward a year or two. Every dial can then be dragged
 * away from reality to ask "what if", which is the whole point: the seeded
 * scenario is what the funnel IS doing, the edited one is what it WOULD do.
 *
 * No React and no fetching in here, so the arithmetic can be unit-tested on
 * its own. The page in app/dashboard/reports/profit wires it to sliders.
 */

import type { ReportTotals } from './columns'

/** The average Gregorian month, so a "month" is the same length everywhere. */
export const DAYS_PER_MONTH = 30.4375
export const DAYS_PER_YEAR = 365

/**
 * One scenario's dials.
 *
 * Rates are whole percentages (35 means 35%), money is USD - the same
 * currency the rest of the report is formatted in, so a price here and a
 * revenue column there mean the same thing.
 */
export interface ProfitInputs {
  /** New registrations bought per day. */
  registrationsPerDay: number
  /** Ad spend divided by registrations. */
  costPerRegistration: number
  /** % of registrations that attend at all (live or replay). */
  showUpRate: number
  /** % of attendees who stay past the report's engagement threshold. */
  engagedRate: number
  /**
   * % of engaged attendees who buy. This is the only conversion figure the
   * model stores; the "of registrations" and "of attendees" dials on the page
   * are the same number viewed through the funnel above it.
   */
  conversionOfEngaged: number
  /** What one sale is worth. */
  price: number
  /** % of buyers who also take the upsell. */
  upsellRate: number
  upsellPrice: number
  /** Months between upsell renewals. */
  renewMonths: number
  /** % of upsell subscribers lost at each renewal. */
  churnRate: number
}

export type ProfitInputKey = keyof ProfitInputs

/** What one scenario's dials work out to per day, before time is involved. */
export interface ProfitRates {
  attendeesPerDay: number
  engagedPerDay: number
  salesPerDay: number
  /** The same conversion, expressed against each step of the funnel. */
  conversionOfRegistrations: number
  conversionOfAttendees: number
  conversionOfEngaged: number
  adSpendPerDay: number
  /** Revenue from the sale itself. */
  coreRevenuePerDay: number
  /** Revenue from first-time upsells only - renewals are added over time. */
  firstUpsellRevenuePerDay: number
}

export interface ProfitProjection {
  rates: ProfitRates
  firstYear: number
  secondYear: number
  /** Profit in the first month, and in the twelfth. */
  firstMonth: number
  twelfthMonth: number
  customersPerMonth: number
  customersPerYear: number
  adSpendPerMonth: number
  /** How long an upsell subscriber pays, on average. Infinity at 0% churn. */
  subscriberLifetimeMonths: number
}

const pct = (n: number) => n / 100
const ratio = (num: number, den: number, scale = 1) => (den > 0 ? (num / den) * scale : 0)

export function deriveRates(inputs: ProfitInputs): ProfitRates {
  const attendeesPerDay = inputs.registrationsPerDay * pct(inputs.showUpRate)
  const engagedPerDay = attendeesPerDay * pct(inputs.engagedRate)
  const salesPerDay = engagedPerDay * pct(inputs.conversionOfEngaged)
  const conversionOfAttendees = inputs.conversionOfEngaged * pct(inputs.engagedRate)
  return {
    attendeesPerDay,
    engagedPerDay,
    salesPerDay,
    conversionOfEngaged: inputs.conversionOfEngaged,
    conversionOfAttendees,
    conversionOfRegistrations: conversionOfAttendees * pct(inputs.showUpRate),
    adSpendPerDay: inputs.registrationsPerDay * inputs.costPerRegistration,
    coreRevenuePerDay: salesPerDay * inputs.price,
    firstUpsellRevenuePerDay: salesPerDay * pct(inputs.upsellRate) * inputs.upsellPrice,
  }
}

/**
 * Profit over days [from, to), counting from the day the funnel starts.
 *
 * Each day buys its own cohort, and every cohort renews on the same clock, so
 * on day d the upsell is collected from the cohort bought today plus every
 * cohort whose renewal falls due today: one renewal per `renewMonths`, each
 * one `1 - churn` of the last. That sum is the multiplier on the first-time
 * upsell revenue, and it is what makes year two differ from year one.
 */
export function profitOverDays(
  inputs: ProfitInputs,
  rates: ProfitRates,
  from: number,
  to: number
): number {
  const renewalDays = Math.max(inputs.renewMonths, 0.01) * DAYS_PER_MONTH
  const retained = 1 - pct(inputs.churnRate)
  const dailyBase = rates.coreRevenuePerDay - rates.adSpendPerDay
  let total = 0
  for (let day = Math.floor(from); day < to; day++) {
    const renewalsDue = Math.floor(day / renewalDays)
    // Σ retained^k for k = 0..renewalsDue, in closed form unless churn is 0%
    // (where the geometric formula divides by zero and every renewal is kept).
    const multiplier =
      retained >= 1
        ? renewalsDue + 1
        : (1 - Math.pow(retained, renewalsDue + 1)) / (1 - retained)
    total += dailyBase + rates.firstUpsellRevenuePerDay * multiplier
  }
  return total
}

const monthDay = (months: number) => Math.round(months * DAYS_PER_MONTH)

export function projectScenario(inputs: ProfitInputs): ProfitProjection {
  const rates = deriveRates(inputs)
  return {
    rates,
    firstYear: profitOverDays(inputs, rates, 0, DAYS_PER_YEAR),
    secondYear: profitOverDays(inputs, rates, DAYS_PER_YEAR, 2 * DAYS_PER_YEAR),
    firstMonth: profitOverDays(inputs, rates, 0, monthDay(1)),
    twelfthMonth: profitOverDays(inputs, rates, monthDay(11), monthDay(12)),
    customersPerMonth: rates.salesPerDay * DAYS_PER_MONTH,
    customersPerYear: rates.salesPerDay * DAYS_PER_YEAR,
    adSpendPerMonth: rates.adSpendPerDay * DAYS_PER_MONTH,
    subscriberLifetimeMonths:
      inputs.churnRate > 0 ? inputs.renewMonths / pct(inputs.churnRate) : Infinity,
  }
}

// ---------------------------------------------------------------------------
// The three conversion dials
// ---------------------------------------------------------------------------

/**
 * Setting conversion against registrations or attendees means solving for the
 * engaged rate that would produce it, which is what the model stores. With
 * nobody getting that far the sum has no answer, so the dial is left alone.
 */
export function engagedConversionFromRegistrations(
  value: number,
  inputs: ProfitInputs
): number {
  const share = pct(inputs.showUpRate) * pct(inputs.engagedRate)
  return share > 0 ? value / share : inputs.conversionOfEngaged
}

export function engagedConversionFromAttendees(value: number, inputs: ProfitInputs): number {
  const share = pct(inputs.engagedRate)
  return share > 0 ? value / share : inputs.conversionOfEngaged
}

// ---------------------------------------------------------------------------
// Seeding from a real report
// ---------------------------------------------------------------------------

/** Stand-ins for dials the report cannot measure, or measured as nothing. */
export const ASSUMED: Pick<
  ProfitInputs,
  'price' | 'upsellRate' | 'upsellPrice' | 'renewMonths' | 'churnRate'
> = {
  price: 297,
  upsellRate: 0,
  upsellPrice: 497,
  renewMonths: 6,
  churnRate: 10,
}

export const FALLBACK_INPUTS: ProfitInputs = {
  registrationsPerDay: 100,
  costPerRegistration: 8,
  showUpRate: 35,
  engagedRate: 50,
  conversionOfEngaged: 8,
  ...ASSUMED,
}

export interface ProfitBaseline {
  inputs: ProfitInputs
  /** Dials read straight off the report. The rest are assumptions. */
  fromReport: ProfitInputKey[]
  /** Plain-language reasons a dial had to be assumed. */
  notes: string[]
}

/**
 * Turn the totals of the selected range into a starting scenario.
 *
 * A dial counts as measured only when the number underneath it is real: a
 * price needs a sale, a show-up rate needs a registration. Anything else is an
 * assumption and says so on the page, because a planner that quietly passes
 * off a guess as a measurement is worse than no planner.
 */
export function baselineFromTotals(totals: ReportTotals | null): ProfitBaseline {
  if (!totals || totals.days <= 0) {
    return {
      inputs: { ...FALLBACK_INPUTS },
      fromReport: [],
      notes: ['No report data for this range yet, so every dial starts at a round guess.'],
    }
  }

  const fromReport: ProfitInputKey[] = []
  const notes: string[] = []
  const measured = (key: ProfitInputKey) => fromReport.push(key)

  const registrationsPerDay = totals.registrations / totals.days
  if (totals.registrations > 0) measured('registrationsPerDay')
  else notes.push('No registrations in this range, so traffic starts at a guess.')

  let costPerRegistration = totals.costPerRegistration
  if (totals.spend > 0 && totals.registrations > 0) measured('costPerRegistration')
  else {
    costPerRegistration = totals.registrations > 0 ? 0 : FALLBACK_INPUTS.costPerRegistration
    if (totals.spend <= 0) {
      notes.push('No ad spend recorded in this range, so registrations cost nothing here.')
    }
  }

  let showUpRate = totals.attendanceRate
  if (totals.registrations > 0) measured('showUpRate')
  else showUpRate = FALLBACK_INPUTS.showUpRate

  let engagedRate = totals.engagementRateTotal
  if (totals.totalAttendees > 0) measured('engagedRate')
  else engagedRate = FALLBACK_INPUTS.engagedRate

  let conversionOfEngaged = ratio(totals.salesTotal, totals.engagedTotal, 100)
  if (totals.engagedTotal > 0) measured('conversionOfEngaged')
  else {
    conversionOfEngaged = FALLBACK_INPUTS.conversionOfEngaged
    notes.push('Nobody reached the engagement threshold, so the conversion rate is a guess.')
  }

  let price = totals.averageOrderValue
  if (totals.salesTotal > 0) measured('price')
  else {
    price = ASSUMED.price
    notes.push('No sales in this range, so the price is an assumption - set it below.')
  }

  return {
    inputs: {
      registrationsPerDay,
      costPerRegistration,
      showUpRate,
      engagedRate,
      conversionOfEngaged,
      price,
      upsellRate: ASSUMED.upsellRate,
      upsellPrice: totals.salesTotal > 0 ? Math.round(price * 1.5) : ASSUMED.upsellPrice,
      renewMonths: ASSUMED.renewMonths,
      churnRate: ASSUMED.churnRate,
    },
    fromReport,
    notes,
  }
}

/** Have the dials been moved off the seeded scenario? */
export function inputsEqual(a: ProfitInputs, b: ProfitInputs): boolean {
  return (Object.keys(a) as ProfitInputKey[]).every(
    key => Math.abs(a[key] - b[key]) < 1e-9
  )
}

// ---------------------------------------------------------------------------
// Slider scales
// ---------------------------------------------------------------------------

export interface SliderScale {
  min: number
  max: number
  step: number
}

/**
 * Sensible travel for each dial, widened so the seeded value always lands
 * inside it - a funnel buying 4,000 registrations a day must not arrive with
 * its slider pinned to the right-hand end.
 */
const BASE_SCALES: Record<ProfitInputKey, SliderScale> = {
  registrationsPerDay: { min: 0, max: 1000, step: 5 },
  costPerRegistration: { min: 0, max: 60, step: 0.25 },
  showUpRate: { min: 0, max: 100, step: 1 },
  engagedRate: { min: 0, max: 100, step: 1 },
  conversionOfEngaged: { min: 0, max: 60, step: 0.1 },
  price: { min: 0, max: 10000, step: 10 },
  upsellRate: { min: 0, max: 100, step: 1 },
  upsellPrice: { min: 0, max: 10000, step: 10 },
  renewMonths: { min: 1, max: 24, step: 1 },
  churnRate: { min: 0, max: 100, step: 1 },
}

/** Percentages stay on their natural 0-100 scale; the rest grow to fit. */
const CAPPED_AT_100: ProfitInputKey[] = ['showUpRate', 'engagedRate', 'upsellRate', 'churnRate']

export function sliderScale(key: ProfitInputKey, seed: number): SliderScale {
  const base = BASE_SCALES[key]
  if (CAPPED_AT_100.includes(key) || !Number.isFinite(seed) || seed <= base.max) return base
  // Round the headroom up to something a person would pick as an axis end.
  const target = seed * 1.5
  const magnitude = Math.pow(10, Math.floor(Math.log10(target)))
  const max = Math.ceil(target / magnitude) * magnitude
  return { ...base, max }
}

/** The same treatment for the three conversion dials, which share a scale. */
export function conversionScale(seed: number, base: number): SliderScale {
  const max = Number.isFinite(seed) && seed > base ? Math.ceil((seed * 1.5) / 5) * 5 : base
  return { min: 0, max, step: max > 20 ? 0.1 : 0.05 }
}
