/**
 * Field lists, labels and diffing for webinar settings version control.
 *
 * Kept free of any database import so the settings screens can render a
 * history (which needs the labels) without pulling Prisma into the browser
 * bundle. The database side lives in `webinarSettingsVersions.ts`.
 */

export type WebinarScope = 'internal' | 'external'

export type SettingsSnapshot = Record<string, unknown>

export interface VersionAuthor {
  id?: string | null
  email?: string | null
}

/**
 * Settings tracked for an internal webinar. Deliberately the fields a host
 * configures — not derived caches like the resolved ClickFunnels *TagId values,
 * which are re-resolved from the tag names and would otherwise show up as
 * phantom changes.
 */
export const INTERNAL_SETTINGS_FIELDS = [
  'title',
  'slug',
  'internalName',
  'description',
  'thumbnail',
  'duration',
  'vimeoVideoId',
  'videoUrl',
  'videoDuration',
  'status',
  'recordingUrl',
  'hasReplay',
  'hasOffers',
  'hasChat',
  'hasReactions',
  'showElapsedTime',
  'maxSchedulesToShow',
  'minBookingLeadMinutes',
  'maxBookingLeadMinutes',
  'registrationPageId',
  'thankYouTemplateId',
  'countdownTemplateId',
  'countdownPageId',
  'roundJITTo15Minutes',
  'replayEnabled',
  'replayDurationDays',
  'replayExpiresAt',
  'mostlyAttendedThreshold',
  'autoSendPostSessionSMS',
  'postSessionSMSMinutesAfter',
  'postSessionSMSMinWatchedMinutes',
  'postSessionSMSMinWatchedPercentage',
  'postSessionSMSBody',
  'registrationTag',
  'attendedTag',
  'mostlyAttendedTag',
  'partlyAttendedTag',
  'missedTag',
  'replayAttendedTag',
  'crmIntegration',
  'emaanWebhookUrl',
  'sendCalendarInvite',
  'reminderEmailSource',
  'whatsappShareMessage',
  'facebookShareMessage',
  'enableABTesting',
  'trafficSplitPercent',
  'testRegistrationPage',
  'regPageAId',
  'regPageBId',
  'testSchedule',
  'scheduleAIds',
  'scheduleBIds',
  'testOffer',
  'offerAId',
  'offerBId',
  'testVideo',
  'videoAId',
  'videoBId',
] as const

/**
 * Settings tracked for an external webinar. `platform` and `externalWebinarId`
 * are left out on purpose: they identify the WebinarJam/EverWebinar event rather
 * than configure it, they carry a unique constraint, and no settings screen
 * edits them — restoring them could only ever collide with another row.
 */
export const EXTERNAL_SETTINGS_FIELDS = [
  'name',
  'isActive',
  'syncAttendance',
  'registrationTag',
  'attendedTag',
  'mostlyAttendedTag',
  'partlyAttendedTag',
  'missedTag',
  'replayAttendedTag',
  'mostlyAttendedThreshold',
  'attendanceTagDelayHours',
  'webinarDurationMinutes',
  'autoSendPostSessionSMS',
  'postSessionSMSMinutesAfter',
  'postSessionSMSMinWatchedMinutes',
  'postSessionSMSBody',
  'isJIT',
  'jitTimes',
  'combineScheduleSources',
  'liveZoomEnabled',
  'liveZoomLink',
  'liveZoomAt',
  'liveZoomTimezone',
  'liveZoomSessionId',
  'zoomOnlySchedule',
  'showJustInTime',
  'jitLeadMinutes',
  'recurringSlotsToShow',
  'minBookingLeadMinutes',
  'maxBookingLeadMinutes',
  'thankYouUrl',
  'thankYouTemplateId',
  'countdownTemplateId',
  'replayUrl',
  'sendToFacebookCAPI',
  'crmIntegration',
  'emaanWebhookUrl',
  'emaanSyncScope',
] as const

/** Schedule columns captured per row for an internal webinar. */
export const SCHEDULE_FIELDS = [
  'scheduleType',
  'scheduledAt',
  'timezone',
  'useUserTimezone',
  'minutesFromReg',
  'recurringPattern',
  'isZoomSession',
  'zoomLink',
  'isActive',
] as const

/**
 * Snapshot values that are Dates in the database but ISO strings once the
 * snapshot has been through JSON. They have to be coerced back before a restore
 * writes them, or Prisma rejects the string.
 */
const DATE_FIELDS = new Set(['replayExpiresAt', 'liveZoomAt', 'scheduledAt'])

/** Human labels for the history UI, so a row reads "Just-in-time lead time" not "jitLeadMinutes". */
export const SETTINGS_FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  slug: 'Slug',
  internalName: 'Internal name',
  description: 'Description',
  thumbnail: 'Thumbnail',
  duration: 'Duration (minutes)',
  vimeoVideoId: 'Vimeo video ID',
  videoUrl: 'Video URL',
  videoDuration: 'Video duration',
  status: 'Status',
  recordingUrl: 'Recording URL',
  hasReplay: 'Replay enabled',
  hasOffers: 'Offers enabled',
  hasChat: 'Chat enabled',
  hasReactions: 'Reactions enabled',
  showElapsedTime: 'Show elapsed time',
  maxSchedulesToShow: 'Max schedules shown',
  minBookingLeadMinutes: 'Earliest booking (minutes ahead)',
  maxBookingLeadMinutes: 'Latest booking (minutes ahead)',
  registrationPageId: 'Registration page',
  thankYouTemplateId: 'Thank-you template',
  countdownTemplateId: 'Countdown template',
  countdownPageId: 'Countdown page',
  roundJITTo15Minutes: 'Round just-in-time to 15 min',
  replayEnabled: 'Replay enabled',
  replayDurationDays: 'Replay duration (days)',
  replayExpiresAt: 'Replay expiry',
  replayUrl: 'Evergreen replay URL',
  mostlyAttendedThreshold: 'Mostly-attended threshold (%)',
  autoSendPostSessionSMS: 'Auto post-session SMS',
  postSessionSMSMinutesAfter: 'Post-session SMS delay (minutes)',
  postSessionSMSMinWatchedMinutes: 'Post-session SMS min watched (minutes)',
  postSessionSMSMinWatchedPercentage: 'Post-session SMS min watched (%)',
  postSessionSMSBody: 'Post-session SMS body',
  registrationTag: 'Registration tag',
  attendedTag: 'Attended tag',
  mostlyAttendedTag: 'Mostly-attended tag',
  partlyAttendedTag: 'Partly-attended tag',
  missedTag: 'Missed tag',
  replayAttendedTag: 'Replay-attended tag',
  crmIntegration: 'CRM integration',
  emaanWebhookUrl: 'Emaan webhook URL',
  emaanSyncScope: 'Emaan sync scope',
  sendCalendarInvite: 'Send calendar invite',
  reminderEmailSource: 'Reminder email source',
  whatsappShareMessage: 'WhatsApp share message',
  facebookShareMessage: 'Facebook share message',
  enableABTesting: 'A/B testing enabled',
  trafficSplitPercent: 'Traffic split (%)',
  testRegistrationPage: 'A/B test: registration page',
  regPageAId: 'A/B registration page A',
  regPageBId: 'A/B registration page B',
  testSchedule: 'A/B test: schedule',
  scheduleAIds: 'A/B schedule A',
  scheduleBIds: 'A/B schedule B',
  testOffer: 'A/B test: offer',
  offerAId: 'A/B offer A',
  offerBId: 'A/B offer B',
  testVideo: 'A/B test: video',
  videoAId: 'A/B video A',
  videoBId: 'A/B video B',
  schedules: 'Schedules',
  name: 'Name',
  isActive: 'Active',
  syncAttendance: 'Sync attendance',
  attendanceTagDelayHours: 'Attendance tag delay (hours)',
  webinarDurationMinutes: 'Expected duration (minutes)',
  isJIT: 'Just-in-time mode',
  jitTimes: 'Just-in-time times',
  combineScheduleSources: 'Combined schedule picker',
  liveZoomEnabled: 'Live Zoom session',
  liveZoomLink: 'Live Zoom link',
  liveZoomAt: 'Live Zoom time',
  liveZoomTimezone: 'Live Zoom timezone',
  liveZoomSessionId: 'Linked Zoom session',
  zoomOnlySchedule: 'Zoom-only schedule',
  showJustInTime: 'Show just-in-time option',
  jitLeadMinutes: 'Just-in-time lead time (minutes)',
  recurringSlotsToShow: 'Recurring slots shown',
  thankYouUrl: 'Thank-you URL',
  sendToFacebookCAPI: 'Send to Facebook CAPI',
  zoomSessionIds: 'Linked Zoom sessions',
}

export function labelForField(field: string): string {
  return SETTINGS_FIELD_LABELS[field] || field
}

/**
 * Normalise a value for comparison and storage. Dates become ISO strings (that
 * is what they are once a snapshot has been stored as JSON, so a live snapshot
 * has to look the same or every field would read as changed), and `undefined`
 * becomes `null` (a missing key and an explicitly-null one mean the same thing
 * here).
 */
function normalizeValue(value: unknown): unknown {
  if (value === undefined) return null
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(normalizeValue)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = normalizeValue((value as Record<string, unknown>)[key])
    }
    return out
  }
  return value
}

/** Read a fixed set of fields off a database row into a comparable snapshot. */
export function pickSettings(row: Record<string, any>, fields: readonly string[]): SettingsSnapshot {
  const out: SettingsSnapshot = {}
  for (const field of fields) {
    out[field] = normalizeValue(row?.[field])
  }
  return out
}

/**
 * Which top-level settings keys differ between two snapshots. Nested values
 * (the schedule list, the linked Zoom session ids) collapse to a single entry —
 * "Schedules changed" is what a host wants to read, not a per-row diff.
 */
export function diffSettings(before: SettingsSnapshot, after: SettingsSnapshot): string[] {
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})])
  const changed: string[] = []
  for (const key of keys) {
    const a = JSON.stringify(normalizeValue(before?.[key]) ?? null)
    const b = JSON.stringify(normalizeValue(after?.[key]) ?? null)
    if (a !== b) changed.push(key)
  }
  return changed.sort()
}

/**
 * Coerce a snapshot value back into something Prisma will write. Only the
 * date-valued fields need it: they leave the database as Dates and come back
 * out of JSON as ISO strings, which Prisma rejects.
 */
export function toWritableValue(field: string, value: unknown): unknown {
  if (!DATE_FIELDS.has(field)) return value
  if (value === null || value === undefined || value === '') return null
  const date = new Date(value as string)
  return Number.isNaN(date.getTime()) ? null : date
}
