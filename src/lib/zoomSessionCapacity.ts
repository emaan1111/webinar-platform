// Pure capacity rules for Zoom sessions — no database access, so the pickers,
// the register routes, the sessions API and the tests all share one definition.

// Shown to a registrant whose pick landed on a session that filled up between
// the picker rendering and the submit.
export const ZOOM_SESSION_FULL_ERROR =
  'That session is now full — please refresh the page to pick another time.'

export const CAPACITY_INPUT_ERROR =
  'Capacity must be a whole number of seats — leave it blank for no limit.'

// A session is full once its roster has reached the capacity the host set.
// No capacity (null) means unlimited; 0 closes the session to new registrants.
export function isZoomSessionFull(capacity: number | null | undefined, registered: number): boolean {
  if (capacity === null || capacity === undefined) return false
  return registered >= capacity
}

// Seats still open, or null when the session is unlimited.
export function zoomSeatsLeft(capacity: number | null | undefined, registered: number): number | null {
  if (capacity === null || capacity === undefined) return null
  return Math.max(0, capacity - registered)
}

export type ParsedCapacity = { ok: true; capacity: number | null } | { ok: false; error: string }

// Capacity as the sessions form sends it: blank / null → unlimited, otherwise a
// whole non-negative number of seats (0 included), as a number or a string.
export function parseZoomCapacity(value: unknown): ParsedCapacity {
  const raw = typeof value === 'string' ? value.trim() : value
  if (raw === undefined || raw === null || raw === '') return { ok: true, capacity: null }
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN
  if (!Number.isInteger(n) || n < 0) return { ok: false, error: CAPACITY_INPUT_ERROR }
  return { ok: true, capacity: n }
}
