/**
 * Per-webinar aggregation for the Compare tab.
 *
 * The Key Metrics report answers "how did each DAY go" across every selected
 * webinar pooled together; Compare answers "how did each WEBINAR do" across
 * the whole range. Both must classify a registrant identically — live vs
 * replay, settled vs upcoming, engaged or not — so the classification rules
 * here are copied from /api/reports and lean on the same shared helpers in
 * lib/attendance. If a number disagrees between the two tabs, one of them is
 * wrong.
 *
 * Ad spend is deliberately absent: Facebook insights are account-level and
 * cannot be attributed to a single webinar, so cost/ROI columns would be
 * fiction here.
 */

import { attendedLiveBroadcast, isSessionSettled } from '../attendance'

/** Same test-user rule as /api/reports, so both tabs count the same people. */
export function isTestRegistrant(
  name: string | null | undefined,
  email: string | null | undefined
): boolean {
  const nameLower = (name || '').toLowerCase()
  const emailLower = (email || '').toLowerCase()
  return (
    emailLower.includes('test') ||
    emailLower.includes('demo') ||
    emailLower.includes('fake') ||
    emailLower.includes('scripted') ||
    emailLower.includes('example') ||
    emailLower.includes('sample') ||
    nameLower.includes('test') ||
    nameLower.includes('demo') ||
    nameLower.includes('fake') ||
    nameLower.includes('scripted') ||
    nameLower.includes('sample')
  )
}

export interface InternalRegLike {
  attended?: boolean | null
  watchedReplay?: boolean | null
  scheduledStartTime?: Date | string | null
  lastWatchedPosition?: number | null
  webinar?: { duration?: number | null } | null
  sessions?: { videoPosition?: number | null; joinedAt?: Date | string | null }[] | null
  sales?: { amount?: number | null }[] | null
}

export interface ExternalRegLike {
  attended?: boolean | null
  attendedLive?: boolean | null
  attendedReplay?: boolean | null
  watchTimeMinutes?: number | null
  scheduledStartTime?: Date | string | null
  externalWebinar?: { webinarDurationMinutes?: number | null } | null
}

/** Raw counters for one webinar, filled by the add* functions below. */
export interface CompareAccumulator {
  id: string
  name: string
  isExternal: boolean
  // Signup clock: people who registered inside the range.
  registrations: number
  liveAttendees: number
  replayAttendees: number
  engaged: number
  sales: number
  revenue: number
  // Session clock: people whose session RAN inside the range.
  sessionRegistered: number
  sessionSettled: number
  sessionLive: number
  sessionMissed: number
  sessionUpcoming: number
  sessionEngaged: number
  sessionReplay: number
}

/** One finished column of the comparison table. */
export interface CompareRow extends CompareAccumulator {
  totalAttendees: number
  attendanceRate: number
  engagedRate: number
  engagedPerRegistered: number
  sessionAttendanceRate: number
  sessionEngagedRate: number
  sessionEngagedPerRegistered: number
  sessionReplayRate: number
  // null for external webinars: their platforms carry no sales relation, and
  // an unknowable number must not render as a zero.
  salesCount: number | null
  revenueTotal: number | null
  averageOrderValue: number | null
}

export function newCompareAccumulator(
  id: string,
  name: string,
  isExternal: boolean
): CompareAccumulator {
  return {
    id,
    name,
    isExternal,
    registrations: 0,
    liveAttendees: 0,
    replayAttendees: 0,
    engaged: 0,
    sales: 0,
    revenue: 0,
    sessionRegistered: 0,
    sessionSettled: 0,
    sessionLive: 0,
    sessionMissed: 0,
    sessionUpcoming: 0,
    sessionEngaged: 0,
    sessionReplay: 0,
  }
}

/** Furthest point watched, in minutes — same fallback chain as /api/reports. */
function internalWatchMinutes(reg: InternalRegLike): number {
  const maxPos = (reg.sessions ?? []).reduce(
    (max, s) => Math.max(max, s.videoPosition || 0),
    0
  )
  const seconds = maxPos > 0 ? maxPos : reg.lastWatchedPosition || 0
  return seconds / 60
}

/**
 * External live/replay split: `attended` is the platform's MERGED flag
 * (live OR replay); rows synced since the split carry attendedLive /
 * attendedReplay, older rows fall back to the merged flag (counted as live,
 * replay unknowable).
 */
function externalSplit(reg: ExternalRegLike) {
  const watch = reg.watchTimeMinutes || 0
  const wasLive = reg.attendedLive ?? reg.attended ?? false
  const watchedReplay = (reg.attendedReplay ?? false) || (!reg.attended && watch > 0)
  return { watch, wasLive, watchedReplay }
}

export function addInternalSignup(
  acc: CompareAccumulator,
  reg: InternalRegLike,
  engagementMinutes: number
): void {
  acc.registrations++
  const live = !!reg.attended
  if (live) acc.liveAttendees++
  else if ((reg.sessions?.length ?? 0) > 0) acc.replayAttendees++
  if (internalWatchMinutes(reg) >= engagementMinutes) acc.engaged++
  const sales = reg.sales ?? []
  acc.sales += sales.length
  acc.revenue += sales.reduce((sum, s) => sum + (s.amount || 0), 0)
}

export function addInternalSession(
  acc: CompareAccumulator,
  reg: InternalRegLike,
  engagementMinutes: number,
  nowMs: number = Date.now()
): void {
  acc.sessionRegistered++
  if (!isSessionSettled(reg.scheduledStartTime, reg.webinar?.duration, nowMs)) {
    // The session hasn't finished: attendance is not yet knowable, so this
    // person is reported separately rather than counted as a no-show.
    acc.sessionUpcoming++
    return
  }
  acc.sessionSettled++
  const wasLive = attendedLiveBroadcast(reg)
  if (wasLive) acc.sessionLive++
  else acc.sessionMissed++
  if (!wasLive && (reg.watchedReplay || (reg.sessions?.length ?? 0) > 0)) acc.sessionReplay++
  if (internalWatchMinutes(reg) >= engagementMinutes) acc.sessionEngaged++
}

export function addExternalSignup(
  acc: CompareAccumulator,
  reg: ExternalRegLike,
  engagementMinutes: number
): void {
  acc.registrations++
  const { watch, wasLive, watchedReplay } = externalSplit(reg)
  if (wasLive) acc.liveAttendees++
  else if (watchedReplay) acc.replayAttendees++
  if (watch >= engagementMinutes) acc.engaged++
}

export function addExternalSession(
  acc: CompareAccumulator,
  reg: ExternalRegLike,
  engagementMinutes: number,
  nowMs: number = Date.now()
): void {
  acc.sessionRegistered++
  const settled = isSessionSettled(
    reg.scheduledStartTime,
    reg.externalWebinar?.webinarDurationMinutes,
    nowMs
  )
  if (!settled) {
    acc.sessionUpcoming++
    return
  }
  acc.sessionSettled++
  const { watch, wasLive, watchedReplay } = externalSplit(reg)
  if (wasLive) acc.sessionLive++
  else acc.sessionMissed++
  if (!wasLive && watchedReplay) acc.sessionReplay++
  if (watch >= engagementMinutes) acc.sessionEngaged++
}

export function finalizeCompareRow(acc: CompareAccumulator): CompareRow {
  const totalAttendees = acc.liveAttendees + acc.replayAttendees
  const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0)
  return {
    ...acc,
    totalAttendees,
    attendanceRate: pct(totalAttendees, acc.registrations),
    // Engagement comes in both denominators: per attendee ("once they show
    // up, do they stay?") and per registered ("of everyone who signed up, how
    // many were held?"). Same pairs as the daily report's engagementRateTotal
    // + engagedPerRegistered and sessionEngagementRateLive +
    // sessionEngagedPerRegistered.
    engagedRate: pct(acc.engaged, totalAttendees),
    engagedPerRegistered: pct(acc.engaged, acc.registrations),
    sessionAttendanceRate: pct(acc.sessionLive, acc.sessionSettled),
    sessionEngagedRate: pct(acc.sessionEngaged, acc.sessionLive),
    sessionEngagedPerRegistered: pct(acc.sessionEngaged, acc.sessionSettled),
    sessionReplayRate: pct(acc.sessionReplay, acc.sessionSettled),
    salesCount: acc.isExternal ? null : acc.sales,
    revenueTotal: acc.isExternal ? null : acc.revenue,
    averageOrderValue: acc.isExternal ? null : acc.sales > 0 ? acc.revenue / acc.sales : 0,
  }
}
