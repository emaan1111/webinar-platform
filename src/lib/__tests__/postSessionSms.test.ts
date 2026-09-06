import { describe, it, expect } from 'vitest'
import { shouldSendPostSessionSms, type PostSessionSmsGate } from '../postSessionSms'

// A registrant whose session ended an hour ago and who watched 50 minutes —
// every test overrides just the condition it is about.
const base: PostSessionSmsGate = {
  autoSend: true,
  alreadySent: false,
  attended: true,
  sessionEndTime: new Date('2026-09-06T10:00:00Z'),
  minutesAfter: 0,
  watchTimeMinutes: 50,
  minWatchedMinutes: null,
  now: new Date('2026-09-06T11:00:00Z'),
}

describe('shouldSendPostSessionSms', () => {
  it('sends to an attendee once their session has ended', () => {
    expect(shouldSendPostSessionSms(base)).toBe(true)
  })

  it('never sends when the feature is off', () => {
    expect(shouldSendPostSessionSms({ ...base, autoSend: false })).toBe(false)
  })

  it('never sends twice', () => {
    expect(shouldSendPostSessionSms({ ...base, alreadySent: true })).toBe(false)
  })

  it('never texts a no-show', () => {
    expect(shouldSendPostSessionSms({ ...base, attended: false })).toBe(false)
  })

  it('holds off while the session end is unknown', () => {
    expect(shouldSendPostSessionSms({ ...base, sessionEndTime: null })).toBe(false)
  })

  it('holds off until the session has actually ended', () => {
    expect(
      shouldSendPostSessionSms({ ...base, now: new Date('2026-09-06T09:59:00Z') })
    ).toBe(false)
  })

  it('waits out the configured delay after session end', () => {
    expect(shouldSendPostSessionSms({ ...base, minutesAfter: 90 })).toBe(false)
    expect(
      shouldSendPostSessionSms({ ...base, minutesAfter: 90, now: new Date('2026-09-06T11:31:00Z') })
    ).toBe(true)
  })

  it('skips attendees below the watch threshold', () => {
    expect(shouldSendPostSessionSms({ ...base, minWatchedMinutes: 51 })).toBe(false)
  })

  it('sends once watch time is past the threshold', () => {
    expect(shouldSendPostSessionSms({ ...base, minWatchedMinutes: 42 })).toBe(true)
  })

  it('treats a blank/zero threshold as "any attendance counts"', () => {
    expect(shouldSendPostSessionSms({ ...base, watchTimeMinutes: 0, minWatchedMinutes: null })).toBe(true)
    expect(shouldSendPostSessionSms({ ...base, watchTimeMinutes: 0, minWatchedMinutes: 0 })).toBe(true)
  })

  it('counts live + replay minutes together toward the threshold (a later sync can still fire)', () => {
    // First sync: 20 live minutes, under a 40-minute threshold — skipped, not marked sent.
    expect(
      shouldSendPostSessionSms({ ...base, watchTimeMinutes: 20, minWatchedMinutes: 40 })
    ).toBe(false)
    // Next sync: replay pushed them past the threshold and the row is still unsent.
    expect(
      shouldSendPostSessionSms({ ...base, watchTimeMinutes: 45, minWatchedMinutes: 40 })
    ).toBe(true)
  })
})
