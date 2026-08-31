/**
 * Shared attendance rules.
 *
 * Every report that quotes a show-up rate must agree on two questions, or the
 * same webinar reads differently on two screens:
 *
 *   1. Has the session finished? Attendance is only knowable once it has.
 *   2. Was this person in the LIVE room, or did they watch the replay?
 *
 * Both answers live here so the reports table, the analytics page and anything
 * added later share one definition.
 */

/**
 * How long after a session's scheduled end we wait before calling it finished.
 *
 * "Over" cannot mean the exact scheduled second: broadcasts run long and
 * attendance lands a little after the fact. Without a buffer, a session that
 * ended twenty minutes ago reads as 0% until the stragglers are recorded.
 */
export const SESSION_OVER_BUFFER_MS = 3 * 60 * 60 * 1000;

/** Fallback when a webinar carries no duration, so the window is never NaN. */
export const DEFAULT_DURATION_MINUTES = 60;

export interface AttendanceRegistrationLike {
  attended?: boolean | null;
  watchedReplay?: boolean | null;
  scheduledStartTime?: Date | string | null;
  webinar?: { duration?: number | null } | null;
  sessions?: { joinedAt?: Date | string | null }[] | null;
}

/** Absolute instant a session is scheduled to end, or null when unknowable. */
export function sessionEndMs(
  scheduledStartTime: Date | string | null | undefined,
  durationMinutes: number | null | undefined
): number | null {
  if (!scheduledStartTime) return null;
  const start = new Date(scheduledStartTime).getTime();
  if (!Number.isFinite(start)) return null;
  return start + (durationMinutes || DEFAULT_DURATION_MINUTES) * 60 * 1000;
}

/**
 * Has this registrant's session actually finished?
 *
 * A registration with no scheduled start is UNKNOWABLE, not settled — it is
 * left out of every session-side number rather than given a substitute date,
 * and counted separately so the gap can be disclosed.
 */
export function isSessionSettled(
  scheduledStartTime: Date | string | null | undefined,
  durationMinutes: number | null | undefined,
  now: number = Date.now()
): boolean {
  const end = sessionEndMs(scheduledStartTime, durationMinutes);
  if (end === null) return false;
  return now >= end + SESSION_OVER_BUFFER_MS;
}

/**
 * Did this person attend the LIVE broadcast, as opposed to the replay?
 *
 * `Registration.attended` cannot answer that on its own. Every watch session
 * sets it — api/tracking/session sets `attended: true` when a session opens,
 * replay sessions included — and the replay re-tagging path in
 * lib/clickfunnelsAttendanceTags.ts sets it explicitly, with the comment
 * "Mark as attended even though they missed live". So a replay-only viewer
 * carries attended = true, and reading that flag as live attendance
 * overstates the live number and understates replay.
 *
 * The discriminator that survives all of it is WHEN they were in the room: a
 * watch session that began before the broadcast ended is live, one that began
 * afterwards is replay. We demand that evidence only of people who show a
 * replay footprint — someone marked attended with no replay activity is taken
 * at face value — so this cannot silently discard genuine live attendance
 * recorded before session tracking existed.
 */
export function attendedLiveBroadcast(reg: AttendanceRegistrationLike): boolean {
  if (!reg.attended) return false;
  if (!reg.watchedReplay) return true;

  const end = sessionEndMs(reg.scheduledStartTime, reg.webinar?.duration);
  if (end === null) return false;

  return (reg.sessions || []).some((s) => {
    if (!s?.joinedAt) return false;
    const joined = new Date(s.joinedAt).getTime();
    return Number.isFinite(joined) && joined <= end + SESSION_OVER_BUFFER_MS;
  });
}
