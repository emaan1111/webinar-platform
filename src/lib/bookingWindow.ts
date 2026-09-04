/**
 * Booking window — how far ahead a registrant is allowed to book a session.
 *
 * A host can forbid times that are too close ("nothing starting in the next 2 hours")
 * and/or too far out ("nothing more than 12 hours away"). Both bounds are stored in
 * MINUTES from the moment the picker is rendered / the registration is submitted;
 * null means that side is unbounded.
 *
 * The same rules run in two places, deliberately:
 *   1. when the picker is built, so a forbidden time is never offered; and
 *   2. when the registration is submitted, so a page left open past the window (or a
 *      hand-crafted POST) can't book a time the host has ruled out.
 *
 * Because both places read the setting live from the database, changing the window
 * takes effect on the next page load — no embed snippet has to be re-pasted.
 */

export interface BookingWindow {
  /** Refuse sessions starting sooner than this many minutes from now. Null = no floor. */
  minBookingLeadMinutes?: number | null
  /** Refuse sessions starting later than this many minutes from now. Null = no ceiling. */
  maxBookingLeadMinutes?: number | null
}

/** What the registrant is told when their chosen time falls outside the window. */
export const BOOKING_WINDOW_ERROR =
  'That time is no longer available — please refresh the page to see the current times.'

/**
 * A bound is only active when it is a finite, positive number. `0`, negative values and
 * anything unparseable are treated as "no bound", so a cleared input behaves like the
 * unconfigured default instead of forbidding every session.
 */
function normalizeBound(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

export function normalizeBookingWindow(window: BookingWindow | null | undefined): {
  min: number | null
  max: number | null
} {
  return {
    min: normalizeBound(window?.minBookingLeadMinutes),
    max: normalizeBound(window?.maxBookingLeadMinutes),
  }
}

/**
 * Is `startsAt` inside the window measured from `now`?
 *
 * The floor is inclusive (a session exactly `min` minutes away is allowed) and so is the
 * ceiling, so a "12 hours" ceiling still offers the session exactly 12 hours out rather
 * than dropping it to a rounding accident.
 *
 * A window whose bounds cross over (min > max) can never be satisfied. That is a host
 * misconfiguration rather than something to silently reinterpret, so it legitimately
 * yields no times; the dashboard warns about it at the point of entry.
 */
export function isWithinBookingWindow(
  startsAt: Date | string | number,
  window: BookingWindow | null | undefined,
  now: Date = new Date()
): boolean {
  const { min, max } = normalizeBookingWindow(window)
  if (min === null && max === null) return true

  const startMs =
    startsAt instanceof Date ? startsAt.getTime() : new Date(startsAt).getTime()
  if (Number.isNaN(startMs)) return false

  const leadMinutes = (startMs - now.getTime()) / 60000
  if (min !== null && leadMinutes < min) return false
  if (max !== null && leadMinutes > max) return false
  return true
}

/**
 * Filter a list of pickable options down to those inside the window.
 * `getStart` pulls the session's true start instant out of whatever shape the caller uses.
 */
export function filterToBookingWindow<T>(
  options: T[],
  getStart: (option: T) => Date | string | number | null | undefined,
  window: BookingWindow | null | undefined,
  now: Date = new Date()
): T[] {
  const { min, max } = normalizeBookingWindow(window)
  if (min === null && max === null) return options

  return options.filter((option) => {
    const start = getStart(option)
    // An option with no resolvable start (e.g. an internal just-in-time row whose
    // offset can't be read) is left alone — the window can't judge what it can't time.
    if (start === null || start === undefined) return true
    return isWithinBookingWindow(start, window, now)
  })
}

/** Human-readable summary of the window, for dashboard hints and logs. */
export function describeBookingWindow(window: BookingWindow | null | undefined): string {
  const { min, max } = normalizeBookingWindow(window)
  if (min === null && max === null) return 'Any upcoming time'

  const asText = (minutes: number) => {
    if (minutes % 60 === 0) {
      const hours = minutes / 60
      return `${hours} hour${hours === 1 ? '' : 's'}`
    }
    if (minutes < 60) return `${minutes} minutes`
    return `${(minutes / 60).toFixed(1)} hours`
  }

  if (min !== null && max !== null) {
    return `Between ${asText(min)} and ${asText(max)} from now`
  }
  if (min !== null) return `At least ${asText(min)} from now`
  return `Within ${asText(max!)} from now`
}
