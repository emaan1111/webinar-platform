import { describe, it, expect } from 'vitest'
import { computeTotals, formatCurrency, REPORT_COLUMNS } from '../columns'

const row = (over: Partial<any> = {}): any => ({
  date: '2026-09-11',
  fbResults: { spend: 0, impressions: 0, clicks: 0, ctr: 0 },
  revenue: 0, revenueAud: 0, liveRevenue: 0, replayRevenue: 0,
  visitors: 0, registrations: 0, totalAttendees: 0, liveAttendees: 0, replayAttendees: 0,
  pastRegistrationCount: 0, pastAttendees: 0,
  engagedTotal: 0, engagedLive: 0, engagedReplay: 0,
  salesTotal: 0, salesLive: 0, salesReplay: 0,
  sessionRegistered: 0, sessionSettled: 0, sessionLive: 0, sessionMissed: 0,
  sessionUpcoming: 0, sessionEngaged: 0, sessionSales: 0, sessionReplay: 0,
  ...over,
})

describe('currency labelling', () => {
  it('marks every money column with a currency', () => {
    const untagged = REPORT_COLUMNS.filter(c => c.kind === 'currency' && !c.currency)
    expect(untagged.map(c => c.id)).toEqual([])
  })

  it('distinguishes AUD from USD in the rendered symbol', () => {
    expect(formatCurrency(1188, 'USD')).toContain('US$')
    expect(formatCurrency(1188, 'AUD')).toContain('A$')
    expect(formatCurrency(1188, 'USD')).not.toBe(formatCurrency(1188, 'AUD'))
  })
})

describe('computeTotals profit', () => {
  // The bug this guards: profit was revenue(USD) - spend(AUD).
  it('subtracts AUD spend from AUD revenue, not USD revenue', () => {
    const totals = computeTotals([
      row({ fbResults: { spend: 100, impressions: 0, clicks: 0, ctr: 0 }, revenue: 297, revenueAud: 450 }),
    ])!
    expect(totals.profit).toBe(350) // 450 AUD - 100 AUD
    expect(totals.profit).not.toBe(197) // what the USD/AUD mix produced
  })

  it('computes ROI from the AUD figures', () => {
    const totals = computeTotals([
      row({ fbResults: { spend: 100, impressions: 0, clicks: 0, ctr: 0 }, revenue: 297, revenueAud: 450 }),
    ])!
    expect(totals.roi).toBeCloseTo(350, 5)
  })

  it('sums revenueAud across days', () => {
    const totals = computeTotals([
      row({ revenue: 297, revenueAud: 450 }),
      row({ revenue: 594, revenueAud: 900 }),
    ])!
    expect(totals.revenueAud).toBe(1350)
    expect(totals.revenue).toBe(891)
  })

  it('leaves average order value in USD, the currency charged', () => {
    const totals = computeTotals([
      row({ revenue: 594, revenueAud: 900, salesTotal: 2 }),
    ])!
    expect(totals.averageOrderValue).toBe(297)
  })
})
