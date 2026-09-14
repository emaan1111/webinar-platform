/**
 * "Was this registrant coming to a live Zoom session?" as a reports filter.
 *
 * Nothing on a registration says "Zoom". A registrant is on a Zoom session's
 * roster when the time they picked is exactly that session's start time and
 * their webinar is one the session serves - the same rule the sessions page
 * uses to build a roster (see loadRoster in src/lib/zoomSessions.ts). So the
 * filter is built from (webinar, start instant) pairs: every instant at which
 * some webinar offers a Zoom session.
 *
 * Both registration tables carry a nullable `scheduledStartTime`, and the
 * webinar column differs only in name, so one clause builder serves both.
 *
 * Null handling, as everywhere else in the reports filters:
 * - only mode: no session time means no known Zoom slot, so the row drops.
 * - exclude mode: no session time is not evidence of a Zoom slot, so it stays.
 */

/** Which registrations count: everyone, Zoom-only, or everyone but Zoom. */
export type ZoomSessionFilterMode = 'all' | 'only' | 'exclude'

/** One (webinar, start instant) pair at which a live Zoom session is offered. */
export interface ZoomSessionSlot {
  webinarType: 'external' | 'internal'
  webinarId: string
  scheduledAt: Date
}

/** Which registration table the clause is for - they differ only in the id column. */
export type ZoomSessionTable = 'internal' | 'external'

const parseMode = (raw: string | null): ZoomSessionFilterMode =>
  raw === 'only' || raw === 'exclude' ? raw : 'all'

export const parseZoomSessionMode = (searchParams: URLSearchParams): ZoomSessionFilterMode =>
  parseMode(searchParams.get('zoomSessions'))

export const sanitizeZoomSessionMode = (raw: unknown): ZoomSessionFilterMode =>
  raw === 'only' || raw === 'exclude' ? raw : 'all'

/**
 * Collapse the slots for one table into one group per distinct instant: two
 * webinars sharing a session's start time become a single clause with both
 * ids, which keeps the OR short however many sessions accumulate.
 */
function groupByInstant(slots: readonly ZoomSessionSlot[], table: ZoomSessionTable) {
  const wanted = table === 'external' ? 'external' : 'internal'
  const byInstant = new Map<number, Set<string>>()
  for (const slot of slots) {
    if (!slot || slot.webinarType !== wanted || !slot.webinarId || !slot.scheduledAt) continue
    const ms = slot.scheduledAt.getTime()
    if (!Number.isFinite(ms)) continue
    const ids = byInstant.get(ms) ?? new Set<string>()
    ids.add(slot.webinarId)
    byInstant.set(ms, ids)
  }
  return [...byInstant.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ms, ids]) => ({ at: new Date(ms), ids: [...ids].sort() }))
}

/**
 * Prisma `where` fragment for the Zoom-session filter, in the same
 * `{ AND: [...] }` shape as registrantFilterWhere so the two compose.
 * `{}` when the mode is "all", so spreading it changes no query.
 */
export function zoomSessionWhere(
  slots: readonly ZoomSessionSlot[],
  mode: ZoomSessionFilterMode,
  table: ZoomSessionTable
): { AND?: object[] } {
  if (mode === 'all') return {}

  const field = table === 'external' ? 'externalWebinarId' : 'webinarId'
  const groups = groupByInstant(slots, table)

  if (groups.length === 0) {
    // No Zoom session touches this table. "Only Zoom" is therefore nobody -
    // said explicitly, because returning {} would quietly count everyone.
    // "Exclude Zoom" has nothing to take out and leaves the query alone.
    return mode === 'only' ? { AND: [{ [field]: { in: [] } }] } : {}
  }

  const inSlot = groups.map(g => ({ scheduledStartTime: g.at, [field]: { in: g.ids } }))
  if (mode === 'only') return { AND: [{ OR: inSlot }] }

  // The exact complement of the above, written as an OR rather than a NOT:
  // a NOT over `scheduledStartTime = instant` evaluates to NULL - not TRUE -
  // for a row with no session time, which would silently drop it (SQL
  // three-valued logic). Instants are distinct, so a row's time matches at
  // most one group and these branches cannot double-count.
  return {
    AND: [
      {
        OR: [
          { scheduledStartTime: null },
          { scheduledStartTime: { notIn: groups.map(g => g.at) } },
          ...groups.map(g => ({ scheduledStartTime: g.at, [field]: { notIn: g.ids } })),
        ],
      },
    ],
  }
}

/** Label for the "this report is filtered" notice. */
export function zoomSessionFilterLabel(mode: ZoomSessionFilterMode): string | null {
  if (mode === 'only') return 'Zoom sessions only'
  if (mode === 'exclude') return 'Zoom sessions excluded'
  return null
}
