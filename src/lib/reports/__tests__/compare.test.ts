import { describe, expect, it } from 'vitest'
import {
  addExternalSession,
  addExternalSignup,
  addInternalSession,
  addInternalSignup,
  finalizeCompareRow,
  isTestRegistrant,
  newCompareAccumulator,
} from '../compare'

const HOUR = 60 * 60 * 1000

// A moment well after every session used below has settled (start + duration
// + the 3h buffer), and one squarely before.
const START = new Date('2026-09-01T18:00:00Z')
const AFTER_SETTLED = START.getTime() + 24 * HOUR
const BEFORE_SETTLED = START.getTime() + 1 * HOUR

describe('isTestRegistrant', () => {
  it('drops the same people the daily report drops', () => {
    expect(isTestRegistrant('Jo', 'jo.test@x.com')).toBe(true)
    expect(isTestRegistrant('Demo User', 'jo@x.com')).toBe(true)
    expect(isTestRegistrant('Jo', 'jo@x.com')).toBe(false)
    expect(isTestRegistrant(null, null)).toBe(false)
  })
})

describe('internal signup clock', () => {
  it('splits live vs replay and counts engagement by furthest position', () => {
    const acc = newCompareAccumulator('w1', 'Webinar 1', false)
    // Live, watched 40 min, one sale.
    addInternalSignup(acc, {
      attended: true,
      sessions: [{ videoPosition: 40 * 60 }],
      sales: [{ amount: 100 }],
    }, 30)
    // Replay-only: not attended but has a session; 10 min — not engaged.
    addInternalSignup(acc, { attended: false, sessions: [{ videoPosition: 10 * 60 }], sales: [] }, 30)
    // No-show, no sessions; falls back to lastWatchedPosition (0).
    addInternalSignup(acc, { attended: false, sessions: [], sales: [] }, 30)

    const row = finalizeCompareRow(acc)
    expect(row.registrations).toBe(3)
    expect(row.liveAttendees).toBe(1)
    expect(row.replayAttendees).toBe(1)
    expect(row.totalAttendees).toBe(2)
    expect(row.engaged).toBe(1)
    expect(row.salesCount).toBe(1)
    expect(row.revenueTotal).toBe(100)
    expect(row.averageOrderValue).toBe(100)
    expect(row.attendanceRate).toBeCloseTo((2 / 3) * 100)
    // Both engagement denominators: per attendee (2) and per registered (3).
    expect(row.engagedRate).toBeCloseTo(50)
    expect(row.engagedPerRegistered).toBeCloseTo((1 / 3) * 100)
  })
})

describe('internal session clock', () => {
  it('separates settled from upcoming and live from missed', () => {
    const acc = newCompareAccumulator('w1', 'Webinar 1', false)
    const base = { scheduledStartTime: START, webinar: { duration: 60 } }
    // Settled + live (attended, no replay footprint).
    addInternalSession(acc, { ...base, attended: true, sessions: [{ videoPosition: 45 * 60 }] }, 30, AFTER_SETTLED)
    // Settled + missed, then caught the replay.
    addInternalSession(acc, { ...base, attended: false, watchedReplay: true, sessions: [] }, 30, AFTER_SETTLED)
    // Session not finished yet: nothing is knowable.
    addInternalSession(acc, { ...base, attended: false, sessions: [] }, 30, BEFORE_SETTLED)

    const row = finalizeCompareRow(acc)
    expect(row.sessionRegistered).toBe(3)
    expect(row.sessionSettled).toBe(2)
    expect(row.sessionLive).toBe(1)
    expect(row.sessionMissed).toBe(1)
    expect(row.sessionUpcoming).toBe(1)
    expect(row.sessionReplay).toBe(1)
    expect(row.sessionEngaged).toBe(1)
    expect(row.sessionAttendanceRate).toBeCloseTo(50)
    expect(row.sessionReplayRate).toBeCloseTo(50)
    // Session engagement per live attendee (1) and per settled registrant (2).
    expect(row.sessionEngagedRate).toBeCloseTo(100)
    expect(row.sessionEngagedPerRegistered).toBeCloseTo(50)
  })
})

describe('external registrations', () => {
  it('uses the live/replay split when synced and falls back to the merged flag', () => {
    const acc = newCompareAccumulator('ext_1', 'Ext', true)
    // New row with the split stored: replay only.
    addExternalSignup(acc, { attended: true, attendedLive: false, attendedReplay: true, watchTimeMinutes: 50 }, 30)
    // Legacy row: merged flag only — counted as live.
    addExternalSignup(acc, { attended: true, attendedLive: null, attendedReplay: null, watchTimeMinutes: 20 }, 30)
    // Never attended but has watch time: replay by inference.
    addExternalSignup(acc, { attended: false, watchTimeMinutes: 5 }, 30)
    // Plain no-show.
    addExternalSignup(acc, { attended: false, watchTimeMinutes: 0 }, 30)

    const row = finalizeCompareRow(acc)
    expect(row.registrations).toBe(4)
    expect(row.liveAttendees).toBe(1)
    expect(row.replayAttendees).toBe(2)
    expect(row.engaged).toBe(1)
    // Sales are unknowable for external platforms — null, not zero.
    expect(row.salesCount).toBeNull()
    expect(row.revenueTotal).toBeNull()
    expect(row.averageOrderValue).toBeNull()
  })

  it('respects the session clock with the external duration', () => {
    const acc = newCompareAccumulator('ext_1', 'Ext', true)
    const base = { scheduledStartTime: START, externalWebinar: { webinarDurationMinutes: 60 } }
    addExternalSession(acc, { ...base, attended: true, attendedLive: true, watchTimeMinutes: 45 }, 30, AFTER_SETTLED)
    addExternalSession(acc, { ...base, attended: false, watchTimeMinutes: 0 }, 30, AFTER_SETTLED)
    addExternalSession(acc, { ...base, attended: false, watchTimeMinutes: 0 }, 30, BEFORE_SETTLED)

    const row = finalizeCompareRow(acc)
    expect(row.sessionRegistered).toBe(3)
    expect(row.sessionSettled).toBe(2)
    expect(row.sessionLive).toBe(1)
    expect(row.sessionMissed).toBe(1)
    expect(row.sessionUpcoming).toBe(1)
    expect(row.sessionEngaged).toBe(1)
    expect(row.sessionAttendanceRate).toBeCloseTo(50)
  })
})

describe('finalizeCompareRow', () => {
  it('never divides by zero', () => {
    const row = finalizeCompareRow(newCompareAccumulator('w1', 'Empty', false))
    expect(row.attendanceRate).toBe(0)
    expect(row.engagedRate).toBe(0)
    expect(row.sessionAttendanceRate).toBe(0)
    expect(row.sessionEngagedRate).toBe(0)
    expect(row.sessionReplayRate).toBe(0)
    expect(row.averageOrderValue).toBe(0)
  })
})
