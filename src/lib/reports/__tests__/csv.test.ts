import { describe, expect, it } from 'vitest'
import { buildReportCsv, csvEscape, toCsv } from '../csv'
import { computeTotals, ReportRow } from '../columns'

describe('csvEscape', () => {
  it('quotes fields with commas, quotes or newlines and doubles inner quotes', () => {
    expect(csvEscape('plain')).toBe('plain')
    expect(csvEscape('a,b')).toBe('"a,b"')
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""')
    expect(csvEscape('line\nbreak')).toBe('"line\nbreak"')
    expect(csvEscape(null)).toBe('')
    expect(csvEscape(12.5)).toBe('12.5')
  })

  it('toCsv joins with CRLF', () => {
    expect(toCsv([['a', 'b'], [1, 'x,y']])).toBe('a,b\r\n1,"x,y"')
  })
})

const makeRow = (over: Partial<ReportRow> = {}): ReportRow => ({
  date: '2026-08-01',
  fbResults: { spend: 100, impressions: 1000, clicks: 50, ctr: 5, cpm: 100, cpc: 2 },
  visitors: 200,
  registrations: 40,
  totalAttendees: 10,
  liveAttendees: 6,
  replayAttendees: 4,
  pastRegistrationCount: 30,
  pastAttendees: 10,
  sessionRegistered: 40,
  sessionSettled: 30,
  sessionLive: 12,
  sessionMissed: 18,
  sessionUpcoming: 10,
  sessionEngaged: 6,
  sessionSales: 2,
  sessionReplay: 3,
  sessionAttendanceRate: 40,
  sessionEngagedPerRegistered: 20,
  sessionEngagementRateLive: 50,
  sessionSalesPerRegistered: 6.67,
  sessionReplayRate: 10,
  engagedTotal: 5,
  engagedLive: 3,
  engagedReplay: 2,
  salesTotal: 2,
  salesLive: 1,
  salesReplay: 1,
  registrationRate: 20,
  attendanceRate: 25,
  realAttendanceRate: 33.3,
  liveAttendanceRate: 15,
  replayAttendanceRate: 10,
  engagedPerVisitor: 2.5,
  engagedLivePerVisitor: 1.5,
  engagedReplayPerVisitor: 1,
  engagedPerRegistered: 12.5,
  engagedLivePerRegistered: 7.5,
  engagedReplayPerRegistered: 5,
  engagementRateLive: 50,
  engagementRateReplay: 50,
  engagementRateTotal: 50,
  costPerRegistration: 2.5,
  costPerAttendee: 10,
  costPerSale: 50,
  revenue: 500,
  liveRevenue: 300,
  replayRevenue: 200,
  averageOrderValue: 250,
  profit: 400,
  roi: 400,
  ...over,
})

describe('buildReportCsv', () => {
  it('exports only the visible columns, in order, with a totals row that lines up', () => {
    const reports = [makeRow(), makeRow({ date: '2026-08-02', visitors: 100, registrations: 10 })]
    const csv = buildReportCsv({
      columnIds: ['date', 'registrations', 'visitors', 'sessionEngaged', 'sessionAttendanceRate'],
      reports,
      totals: computeTotals(reports),
      engagementMinutes: 45,
    })
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe(
      'Date (per day),Registrations,Visitors,Engaged (ran today) (45m+ · session day),% Attendance (session day)'
    )
    expect(lines[1]).toBe('2026-08-01,40,200,6,40.00')
    expect(lines[2]).toBe('2026-08-02,10,100,6,40.00')
    // Totals: 50 registrations, 300 visitors, 12 engaged, 24/60 settled = 40%
    expect(lines[3]).toBe('Total,50,300,12,40.00')
    // Every line has the same number of cells.
    expect(new Set(lines.map(l => l.split(',').length)).size).toBe(1)
  })
})

describe('computeTotals', () => {
  it('recomputes rates from summed counts rather than averaging percentages', () => {
    const big = makeRow({ sessionSettled: 100, sessionLive: 50, sessionAttendanceRate: 50 })
    const small = makeRow({ sessionSettled: 2, sessionLive: 0, sessionAttendanceRate: 0 })
    const totals = computeTotals([big, small])!
    // (50 + 0) / (100 + 2) ≈ 49%, not the 25% you would get by averaging 50 and 0.
    expect(totals.sessionAttendanceRate).toBeCloseTo(49.02, 1)
    expect(totals.profit).toBe(1000 - 200)
    expect(totals.ctr).toBeCloseTo(5, 5)
    expect(totals.days).toBe(2)
  })

  it('returns null with no rows', () => {
    expect(computeTotals([])).toBeNull()
  })
})
