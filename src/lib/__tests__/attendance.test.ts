import { describe, it, expect } from 'vitest';
import {
  isSessionSettled,
  attendedLiveBroadcast,
  SESSION_OVER_BUFFER_MS,
} from '../attendance';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

// A fixed "now" so these never depend on the wall clock.
const NOW = new Date('2026-08-31T12:00:00Z').getTime();
const at = (offsetMs: number) => new Date(NOW + offsetMs);

describe('isSessionSettled', () => {
  it('is false for a session still to run', () => {
    expect(isSessionSettled(at(2 * HOUR), 60, NOW)).toBe(false);
  });

  it('is false for a session that ended inside the settling buffer', () => {
    // Started 3h ago, 60m long -> ended 2h ago, still inside the 3h buffer.
    expect(isSessionSettled(at(-3 * HOUR), 60, NOW)).toBe(false);
  });

  it('is true the moment the buffer elapses, and not before', () => {
    // Ends exactly buffer-ago: settled. One ms later: not yet.
    const endsExactlyBufferAgo = at(-(SESSION_OVER_BUFFER_MS + 60 * MIN));
    expect(isSessionSettled(endsExactlyBufferAgo, 60, NOW)).toBe(true);
    expect(isSessionSettled(at(-(SESSION_OVER_BUFFER_MS + 60 * MIN) + 1), 60, NOW)).toBe(false);
  });

  it('is true once the buffer has elapsed', () => {
    expect(isSessionSettled(at(-(SESSION_OVER_BUFFER_MS + 61 * MIN)), 60, NOW)).toBe(true);
  });

  it('treats a missing scheduled time as unknowable, not settled', () => {
    expect(isSessionSettled(null, 60, NOW)).toBe(false);
    expect(isSessionSettled(undefined, 60, NOW)).toBe(false);
  });

  it('falls back to a default duration rather than producing NaN', () => {
    expect(isSessionSettled(at(-24 * HOUR), null, NOW)).toBe(true);
  });
});

describe('attendedLiveBroadcast', () => {
  const start = at(-24 * HOUR);
  const base = { scheduledStartTime: start, webinar: { duration: 60 } };

  it('is false when they never attended at all', () => {
    expect(attendedLiveBroadcast({ ...base, attended: false })).toBe(false);
  });

  it('trusts the attended flag when there is no replay footprint', () => {
    // Protects historical rows recorded before session tracking existed.
    expect(
      attendedLiveBroadcast({ ...base, attended: true, watchedReplay: false, sessions: [] })
    ).toBe(true);
  });

  it('counts a replay watcher who WAS in the live room as live', () => {
    expect(
      attendedLiveBroadcast({
        ...base,
        attended: true,
        watchedReplay: true,
        sessions: [{ joinedAt: new Date(start.getTime() + 5 * MIN) }],
      })
    ).toBe(true);
  });

  it('does NOT count a replay-only watcher as a live attendee', () => {
    // This is the case the app gets wrong today: tracking/session and the
    // replay re-tagging path both set attended = true for these people.
    expect(
      attendedLiveBroadcast({
        ...base,
        attended: true,
        watchedReplay: true,
        sessions: [{ joinedAt: new Date(start.getTime() + 3 * 24 * HOUR) }],
      })
    ).toBe(false);
  });

  it('does not count a replay watcher with no session rows at all', () => {
    expect(
      attendedLiveBroadcast({ ...base, attended: true, watchedReplay: true, sessions: [] })
    ).toBe(false);
  });

  it('cannot claim live attendance when the session date is unknown', () => {
    expect(
      attendedLiveBroadcast({
        attended: true,
        watchedReplay: true,
        scheduledStartTime: null,
        webinar: { duration: 60 },
        sessions: [{ joinedAt: new Date() }],
      })
    ).toBe(false);
  });
});

describe('the identity the report row promises', () => {
  it('registered = live + missed + yet-to-run, with replay excluded from live', () => {
    const ranLongAgo = at(-24 * HOUR);
    const runsTomorrow = at(24 * HOUR);
    const mk = (o: any) => ({ webinar: { duration: 60 }, sessions: [], ...o });

    const regs = [
      // finished session, genuinely live
      mk({ scheduledStartTime: ranLongAgo, attended: true, watchedReplay: false }),
      // finished session, replay only -> must count as MISSED, not live
      mk({
        scheduledStartTime: ranLongAgo,
        attended: true,
        watchedReplay: true,
        sessions: [{ joinedAt: new Date(ranLongAgo.getTime() + 10 * HOUR) }],
      }),
      // finished session, never showed
      mk({ scheduledStartTime: ranLongAgo, attended: false }),
      // session hasn't run yet
      mk({ scheduledStartTime: runsTomorrow, attended: false }),
    ];

    let live = 0;
    let missed = 0;
    let upcoming = 0;
    for (const r of regs) {
      if (!isSessionSettled(r.scheduledStartTime, r.webinar?.duration, NOW)) {
        upcoming++;
        continue;
      }
      if (attendedLiveBroadcast(r)) live++;
      else missed++;
    }

    expect(live).toBe(1);
    expect(missed).toBe(2);
    expect(upcoming).toBe(1);
    expect(live + missed + upcoming).toBe(regs.length);

    // The rate divides by SETTLED sessions only: 1 of 3, not 1 of 4.
    const settled = live + missed;
    expect((live / settled) * 100).toBeCloseTo(33.33, 1);
    // The old behaviour divided by everything, understating it as 25%.
    expect((live / regs.length) * 100).toBe(25);
  });
});
