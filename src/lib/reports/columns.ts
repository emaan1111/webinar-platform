/**
 * Column registry for the Reports "Key Metrics" grid.
 *
 * One entry per column: how to read it from a daily row, how to total it,
 * how to format it, and whether the number can be clicked through to the
 * people behind it. The table, the column picker and the CSV export all read
 * from this list, so adding a metric is one entry here and nothing else.
 */

export type ReportRow = {
  date: string
  fbResults: {
    spend: number
    impressions: number
    clicks: number
    ctr: number
    cpm: number
    cpc: number
  }
  visitors: number
  registrations: number

  // Attendance (signup clock)
  totalAttendees: number
  liveAttendees: number
  replayAttendees: number
  pastRegistrationCount: number
  pastAttendees: number

  // Webinar half - counted on the SESSION clock (the day the webinar ran),
  // and divided by sessions that have actually finished.
  sessionRegistered: number
  sessionSettled: number
  sessionLive: number
  sessionMissed: number
  sessionUpcoming: number
  sessionEngaged: number
  sessionSales: number
  sessionReplay: number
  sessionAttendanceRate: number
  sessionEngagedPerRegistered: number
  sessionEngagementRateLive: number
  sessionSalesPerRegistered: number
  sessionReplayRate: number

  // Engagement
  engagedTotal: number
  engagedLive: number
  engagedReplay: number

  // Sales
  salesTotal: number
  salesLive: number
  salesReplay: number

  // Rates
  registrationRate: number
  attendanceRate: number
  realAttendanceRate: number
  liveAttendanceRate: number
  replayAttendanceRate: number

  // Engagement rates
  engagedPerVisitor: number
  engagedLivePerVisitor: number
  engagedReplayPerVisitor: number
  engagedPerRegistered: number
  engagedLivePerRegistered: number
  engagedReplayPerRegistered: number
  engagementRateLive: number
  engagementRateReplay: number
  engagementRateTotal: number

  // Costs
  costPerRegistration: number
  costPerAttendee: number
  costPerSale: number

  // Revenue
  revenue: number
  liveRevenue?: number
  replayRevenue?: number
  averageOrderValue?: number
  profit: number
  roi: number
}

export type ColumnKind = 'date' | 'count' | 'currency' | 'percent'

export type ColumnGroupId =
  | 'basic'
  | 'facebook'
  | 'attendance'
  | 'engagement'
  | 'sales'
  | 'costs'
  | 'revenue'

export interface ColumnGroupMeta {
  id: ColumnGroupId
  label: string
  /** Tailwind classes for the little swatch that identifies the group. */
  swatch: string
}

export const COLUMN_GROUPS: ColumnGroupMeta[] = [
  { id: 'basic', label: 'Traffic', swatch: 'bg-slate-400' },
  { id: 'facebook', label: 'Facebook Ads', swatch: 'bg-sky-500' },
  { id: 'attendance', label: 'Attendance', swatch: 'bg-emerald-500' },
  { id: 'engagement', label: 'Engagement', swatch: 'bg-violet-500' },
  { id: 'sales', label: 'Sales', swatch: 'bg-amber-500' },
  { id: 'costs', label: 'Costs', swatch: 'bg-rose-400' },
  { id: 'revenue', label: 'Revenue', swatch: 'bg-teal-500' },
]

export const groupMeta = (id: ColumnGroupId): ColumnGroupMeta =>
  COLUMN_GROUPS.find(g => g.id === id) ?? COLUMN_GROUPS[0]

/** Which day a metric is filed under. Shown as a caption under the header. */
export type ClockKind = 'session' | 'signup'

export interface PercentTone {
  /** At or above this the value reads as healthy. */
  good: number
  /** At or above this (but below good) it reads as middling; below is weak. */
  warn: number
}

export interface CaptionContext {
  engagementMinutes: number
}

export interface ReportColumn {
  id: string
  /** Short header label. */
  label: string
  /** Longer name for the column picker and tooltips. */
  fullLabel: string
  group: ColumnGroupId
  kind: ColumnKind
  /** One-line explanation of what the number means. */
  description: string
  /** Extra line under the header label, e.g. which clock the day is cut on. */
  caption?: string | ((ctx: CaptionContext) => string)
  clock?: ClockKind
  /** Metric key understood by /dashboard/reports/details - makes the cell a link. */
  metric?: string
  /** Colour percentages against these thresholds; undefined = neutral. */
  tone?: PercentTone
  /** Colour by sign (profit, ROI). */
  signed?: boolean
  /** Decimal places for percentages (default 1). */
  decimals?: number
  /** Signup-clock columns kept so old saved views still work. */
  legacy?: boolean
  value: (row: ReportRow) => number | string | null | undefined
  /** Value for the totals row. Omit for "no sensible total". */
  total?: (totals: ReportTotals) => number | string | null | undefined
}

export const DATE_COLUMN_ID = 'date'

const ATTENDANCE_TONE: PercentTone = { good: 50, warn: 25 }
const REPLAY_TONE: PercentTone = { good: 30, warn: 15 }
const REGISTRATION_TONE: PercentTone = { good: 20, warn: 10 }
const ENGAGEMENT_TONE: PercentTone = { good: 50, warn: 25 }

const engagedCaption = (ctx: CaptionContext) => `${ctx.engagementMinutes}m+ · signup day`

export const REPORT_COLUMNS: ReportColumn[] = [
  // --- Traffic ------------------------------------------------------------
  {
    id: DATE_COLUMN_ID,
    label: 'Date',
    fullLabel: 'Date',
    group: 'basic',
    kind: 'date',
    description: 'Calendar day in the selected timezone.',
    caption: 'per day',
    value: r => r.date,
    total: () => 'Total',
  },
  {
    id: 'visitors',
    label: 'Visitors',
    fullLabel: 'Visitors',
    group: 'basic',
    kind: 'count',
    description: 'Unique visits to your registration pages.',
    value: r => r.visitors,
    total: t => t.visitors,
  },
  {
    id: 'registrations',
    label: 'Registrations',
    fullLabel: 'Registrations',
    group: 'basic',
    kind: 'count',
    description: 'People who registered that day.',
    metric: 'registrations',
    value: r => r.registrations,
    total: t => t.registrations,
  },
  {
    id: 'registrationRate',
    label: 'Reg. rate',
    fullLabel: '% Registration Rate',
    group: 'basic',
    kind: 'percent',
    description: 'Registrations ÷ visitors.',
    tone: REGISTRATION_TONE,
    value: r => r.registrationRate,
    total: t => t.registrationRate,
  },

  // --- Facebook -----------------------------------------------------------
  {
    id: 'fbSpend',
    label: 'Spend',
    fullLabel: 'FB Spend',
    group: 'facebook',
    kind: 'currency',
    description: 'Facebook ad spend for the day.',
    caption: 'Facebook',
    value: r => r.fbResults.spend,
    total: t => t.spend,
  },
  {
    id: 'fbImpressions',
    label: 'Impressions',
    fullLabel: 'FB Impressions',
    group: 'facebook',
    kind: 'count',
    description: 'Times your ads were shown.',
    caption: 'Facebook',
    value: r => r.fbResults.impressions,
    total: t => t.impressions,
  },
  {
    id: 'fbClicks',
    label: 'Clicks',
    fullLabel: 'FB Clicks',
    group: 'facebook',
    kind: 'count',
    description: 'Clicks on your ads.',
    caption: 'Facebook',
    value: r => r.fbResults.clicks,
    total: t => t.clicks,
  },
  {
    id: 'fbCtr',
    label: 'CTR',
    fullLabel: 'FB CTR',
    group: 'facebook',
    kind: 'percent',
    description: 'Clicks ÷ impressions.',
    caption: 'Facebook',
    decimals: 2,
    value: r => r.fbResults.ctr,
    total: t => t.ctr,
  },
  {
    id: 'fbCpm',
    label: 'CPM',
    fullLabel: 'FB CPM',
    group: 'facebook',
    kind: 'currency',
    description: 'Cost per 1,000 impressions.',
    caption: 'Facebook',
    value: r => r.fbResults.cpm,
    total: t => t.cpm,
  },
  {
    id: 'fbCpc',
    label: 'CPC',
    fullLabel: 'FB CPC',
    group: 'facebook',
    kind: 'currency',
    description: 'Cost per click.',
    caption: 'Facebook',
    value: r => r.fbResults.cpc,
    total: t => t.cpc,
  },

  // --- Attendance: session clock -----------------------------------------
  // The trustworthy ones: filed under the day the webinar ran, and every
  // rate divides by sessions that have actually finished.
  {
    id: 'sessionRegistered',
    label: 'Registered',
    fullLabel: 'Registered (ran today)',
    group: 'attendance',
    kind: 'count',
    description: 'Registrants whose webinar session was scheduled for this day.',
    caption: 'session day',
    clock: 'session',
    metric: 'sessionRegistered',
    value: r => r.sessionRegistered,
    total: t => t.sessionRegistered,
  },
  {
    id: 'sessionLive',
    label: 'Live',
    fullLabel: 'Live Attendees (ran today)',
    group: 'attendance',
    kind: 'count',
    description: 'Of those, how many showed up live.',
    caption: 'session day',
    clock: 'session',
    metric: 'sessionLive',
    value: r => r.sessionLive,
    total: t => t.sessionLive,
  },
  {
    id: 'sessionMissed',
    label: 'Missed',
    fullLabel: 'Missed (ran today)',
    group: 'attendance',
    kind: 'count',
    description: 'Session has finished and they never joined live.',
    caption: 'session day',
    clock: 'session',
    metric: 'sessionMissed',
    value: r => r.sessionMissed,
    total: t => t.sessionMissed,
  },
  {
    id: 'sessionUpcoming',
    label: 'Yet to run',
    fullLabel: 'Yet to run',
    group: 'attendance',
    kind: 'count',
    description: 'Registered for a session on this day that has not happened yet.',
    caption: 'session day',
    clock: 'session',
    metric: 'sessionUpcoming',
    value: r => r.sessionUpcoming,
    total: t => t.sessionUpcoming,
  },
  {
    id: 'sessionAttendanceRate',
    label: 'Attendance',
    fullLabel: '% Attendance',
    group: 'attendance',
    kind: 'percent',
    description: 'Live ÷ registrants whose session has finished.',
    caption: 'session day',
    clock: 'session',
    tone: ATTENDANCE_TONE,
    value: r => r.sessionAttendanceRate ?? 0,
    total: t => t.sessionAttendanceRate,
  },
  {
    id: 'sessionReplay',
    label: 'Replay',
    fullLabel: 'Replay Watchers (ran today)',
    group: 'attendance',
    kind: 'count',
    description: 'Watched the replay of a session that ran this day.',
    caption: 'session day',
    clock: 'session',
    metric: 'sessionReplay',
    value: r => r.sessionReplay,
    total: t => t.sessionReplay,
  },
  {
    id: 'sessionReplayRate',
    label: 'Replay rate',
    fullLabel: '% Replay',
    group: 'attendance',
    kind: 'percent',
    description: 'Replay watchers ÷ registrants whose session has finished.',
    caption: 'session day',
    clock: 'session',
    tone: REPLAY_TONE,
    value: r => r.sessionReplayRate ?? 0,
    total: t => t.sessionReplayRate,
  },

  // --- Attendance: signup clock (legacy) ---------------------------------
  // A "live attendee" here is someone who signed up that day and attended
  // whenever their session ran; the rates divide by everyone who signed up,
  // including people whose webinar has not happened yet.
  {
    id: 'totalAttendees',
    label: 'Attended',
    fullLabel: 'Total Attendees (by signup)',
    group: 'attendance',
    kind: 'count',
    description: 'Signed up this day and attended live or on replay, whenever their session ran.',
    caption: 'signup day',
    clock: 'signup',
    legacy: true,
    metric: 'totalAttendees',
    value: r => r.totalAttendees,
    total: t => t.totalAttendees,
  },
  {
    id: 'liveAttendees',
    label: 'Live',
    fullLabel: 'Live Attendees (by signup)',
    group: 'attendance',
    kind: 'count',
    description: 'Signed up this day and attended live.',
    caption: 'signup day',
    clock: 'signup',
    legacy: true,
    metric: 'liveAttendees',
    value: r => r.liveAttendees,
    total: t => t.liveAttendees,
  },
  {
    id: 'replayAttendees',
    label: 'Replay',
    fullLabel: 'Replay Attendees (by signup)',
    group: 'attendance',
    kind: 'count',
    description: 'Signed up this day and watched the replay.',
    caption: 'signup day',
    clock: 'signup',
    legacy: true,
    metric: 'replayAttendees',
    value: r => r.replayAttendees,
    total: t => t.replayAttendees,
  },
  {
    id: 'pastRegistrationCount',
    label: 'Eligible',
    fullLabel: 'Eligible Registrations (past sessions)',
    group: 'attendance',
    kind: 'count',
    description: 'Signed up this day for a session that has already run.',
    caption: 'signup day',
    clock: 'signup',
    legacy: true,
    metric: 'pastRegistrationCount',
    value: r => r.pastRegistrationCount,
    total: t => t.pastRegistrationCount,
  },
  {
    id: 'attendanceRate',
    label: 'Attendance',
    fullLabel: '% Attendance (by signup, incl. unrun)',
    group: 'attendance',
    kind: 'percent',
    description: 'Attended ÷ everyone who signed up, including sessions not yet run.',
    caption: 'signup day',
    clock: 'signup',
    legacy: true,
    tone: ATTENDANCE_TONE,
    value: r => r.attendanceRate,
    total: t => t.attendanceRate,
  },
  {
    id: 'realAttendanceRate',
    label: 'Real attendance',
    fullLabel: '% Real Attendance (by signup, past only)',
    group: 'attendance',
    kind: 'percent',
    description: 'Attended ÷ signups whose session has already run.',
    caption: 'signup day',
    clock: 'signup',
    legacy: true,
    tone: ATTENDANCE_TONE,
    value: r => r.realAttendanceRate,
    total: t => t.realAttendanceRate,
  },
  {
    id: 'liveAttendanceRate',
    label: 'Live rate',
    fullLabel: '% Live Attendance (by signup, incl. unrun)',
    group: 'attendance',
    kind: 'percent',
    description: 'Live attendees ÷ everyone who signed up.',
    caption: 'signup day',
    clock: 'signup',
    legacy: true,
    tone: ATTENDANCE_TONE,
    value: r => r.liveAttendanceRate,
    total: t => t.liveAttendanceRate,
  },
  {
    id: 'replayAttendanceRate',
    label: 'Replay rate',
    fullLabel: '% Replay Attendance (by signup, incl. unrun)',
    group: 'attendance',
    kind: 'percent',
    description: 'Replay attendees ÷ everyone who signed up.',
    caption: 'signup day',
    clock: 'signup',
    legacy: true,
    tone: REPLAY_TONE,
    value: r => r.replayAttendanceRate,
    total: t => t.replayAttendanceRate,
  },

  // --- Engagement ---------------------------------------------------------
  {
    id: 'sessionEngaged',
    label: 'Engaged',
    fullLabel: 'Engaged (ran today)',
    group: 'engagement',
    kind: 'count',
    description: 'Registrants, live or on replay, who watched past the engagement threshold.',
    caption: ctx => `${ctx.engagementMinutes}m+ · session day`,
    clock: 'session',
    metric: 'sessionEngaged',
    value: r => r.sessionEngaged,
    total: t => t.sessionEngaged,
  },
  {
    id: 'sessionEngagedPerRegistered',
    label: 'Engaged / reg.',
    fullLabel: '% Engaged / Registered',
    group: 'engagement',
    kind: 'percent',
    description: 'Engaged ÷ registrants whose session has finished.',
    caption: 'session day',
    clock: 'session',
    tone: ENGAGEMENT_TONE,
    value: r => r.sessionEngagedPerRegistered ?? 0,
    total: t => t.sessionEngagedPerRegistered,
  },
  {
    id: 'sessionEngagementRateLive',
    label: 'Engaged / live',
    fullLabel: '% Engaged / Live',
    group: 'engagement',
    kind: 'percent',
    description: 'Engaged ÷ live attendees. Engaged includes replay watchers, so this can exceed 100%.',
    caption: 'session day',
    clock: 'session',
    tone: ENGAGEMENT_TONE,
    value: r => r.sessionEngagementRateLive ?? 0,
    total: t => t.sessionEngagementRateLive,
  },
  {
    id: 'engagedTotal',
    label: 'Engaged',
    fullLabel: 'Engaged (Total, by signup)',
    group: 'engagement',
    kind: 'count',
    description: 'Signed up this day and watched past the threshold, live or replay.',
    caption: engagedCaption,
    clock: 'signup',
    legacy: true,
    metric: 'engagedTotal',
    value: r => r.engagedTotal,
    total: t => t.engagedTotal,
  },
  {
    id: 'engagedLive',
    label: 'Engaged live',
    fullLabel: 'Engaged (Live, by signup)',
    group: 'engagement',
    kind: 'count',
    description: 'Signed up this day and watched the live session past the threshold.',
    caption: engagedCaption,
    clock: 'signup',
    legacy: true,
    metric: 'engagedLive',
    value: r => r.engagedLive,
    total: t => t.engagedLive,
  },
  {
    id: 'engagedReplay',
    label: 'Engaged replay',
    fullLabel: 'Engaged (Replay, by signup)',
    group: 'engagement',
    kind: 'count',
    description: 'Signed up this day and watched the replay past the threshold.',
    caption: engagedCaption,
    clock: 'signup',
    legacy: true,
    metric: 'engagedReplay',
    value: r => r.engagedReplay,
    total: t => t.engagedReplay,
  },
  {
    id: 'engagedPerVisitor',
    label: 'Eng. / visitor',
    fullLabel: '% Engaged / Visitor (Total)',
    group: 'engagement',
    kind: 'percent',
    description: 'Engaged ÷ visitors.',
    caption: 'signup day',
    clock: 'signup',
    legacy: true,
    value: r => r.engagedPerVisitor,
    total: t => t.engagedPerVisitor,
  },
  {
    id: 'engagedLivePerVisitor',
    label: 'Eng. live / visitor',
    fullLabel: '% Engaged / Visitor (Live)',
    group: 'engagement',
    kind: 'percent',
    description: 'Engaged live ÷ visitors.',
    caption: 'signup day',
    clock: 'signup',
    legacy: true,
    value: r => r.engagedLivePerVisitor,
    total: t => t.engagedLivePerVisitor,
  },
  {
    id: 'engagedReplayPerVisitor',
    label: 'Eng. replay / visitor',
    fullLabel: '% Engaged / Visitor (Replay)',
    group: 'engagement',
    kind: 'percent',
    description: 'Engaged replay ÷ visitors.',
    caption: 'signup day',
    clock: 'signup',
    legacy: true,
    value: r => r.engagedReplayPerVisitor,
    total: t => t.engagedReplayPerVisitor,
  },
  {
    id: 'engagedPerRegistered',
    label: 'Eng. / reg.',
    fullLabel: '% Engaged / Registered (Total)',
    group: 'engagement',
    kind: 'percent',
    description: 'Engaged ÷ registrations.',
    caption: 'signup day',
    clock: 'signup',
    legacy: true,
    tone: ENGAGEMENT_TONE,
    value: r => r.engagedPerRegistered,
    total: t => t.engagedPerRegistered,
  },
  {
    id: 'engagedLivePerRegistered',
    label: 'Eng. live / reg.',
    fullLabel: '% Engaged / Registered (Live)',
    group: 'engagement',
    kind: 'percent',
    description: 'Engaged live ÷ registrations.',
    caption: 'signup day',
    clock: 'signup',
    legacy: true,
    tone: ENGAGEMENT_TONE,
    value: r => r.engagedLivePerRegistered,
    total: t => t.engagedLivePerRegistered,
  },
  {
    id: 'engagedReplayPerRegistered',
    label: 'Eng. replay / reg.',
    fullLabel: '% Engaged / Registered (Replay)',
    group: 'engagement',
    kind: 'percent',
    description: 'Engaged replay ÷ registrations.',
    caption: 'signup day',
    clock: 'signup',
    legacy: true,
    tone: ENGAGEMENT_TONE,
    value: r => r.engagedReplayPerRegistered,
    total: t => t.engagedReplayPerRegistered,
  },
  {
    id: 'engagementRateTotal',
    label: 'Eng. rate',
    fullLabel: '% Engagement Rate (Total)',
    group: 'engagement',
    kind: 'percent',
    description: 'Engaged ÷ attendees.',
    caption: 'signup day',
    clock: 'signup',
    legacy: true,
    tone: ENGAGEMENT_TONE,
    value: r => r.engagementRateTotal,
    total: t => t.engagementRateTotal,
  },
  {
    id: 'engagementRateLive',
    label: 'Eng. rate live',
    fullLabel: '% Engagement Rate (Live)',
    group: 'engagement',
    kind: 'percent',
    description: 'Engaged live ÷ live attendees.',
    caption: 'signup day',
    clock: 'signup',
    legacy: true,
    tone: ENGAGEMENT_TONE,
    value: r => r.engagementRateLive,
    total: t => t.engagementRateLive,
  },
  {
    id: 'engagementRateReplay',
    label: 'Eng. rate replay',
    fullLabel: '% Engagement Rate (Replay)',
    group: 'engagement',
    kind: 'percent',
    description: 'Engaged replay ÷ replay attendees.',
    caption: 'signup day',
    clock: 'signup',
    legacy: true,
    tone: ENGAGEMENT_TONE,
    value: r => r.engagementRateReplay,
    total: t => t.engagementRateReplay,
  },

  // --- Sales --------------------------------------------------------------
  {
    id: 'salesTotal',
    label: 'Sales',
    fullLabel: 'Sales (Total)',
    group: 'sales',
    kind: 'count',
    description: 'Purchases by people who registered this day.',
    caption: 'signup day',
    clock: 'signup',
    metric: 'salesTotal',
    value: r => r.salesTotal,
    total: t => t.salesTotal,
  },
  {
    id: 'salesLive',
    label: 'Sales live',
    fullLabel: 'Sales (Live)',
    group: 'sales',
    kind: 'count',
    description: 'Purchases attributed to the live session.',
    caption: 'signup day',
    clock: 'signup',
    metric: 'salesLive',
    value: r => r.salesLive,
    total: t => t.salesLive,
  },
  {
    id: 'salesReplay',
    label: 'Sales replay',
    fullLabel: 'Sales (Replay)',
    group: 'sales',
    kind: 'count',
    description: 'Purchases attributed to the replay.',
    caption: 'signup day',
    clock: 'signup',
    metric: 'salesReplay',
    value: r => r.salesReplay,
    total: t => t.salesReplay,
  },

  // --- Costs --------------------------------------------------------------
  {
    id: 'costPerRegistration',
    label: 'Cost / reg.',
    fullLabel: 'Cost per Registration',
    group: 'costs',
    kind: 'currency',
    description: 'Ad spend ÷ registrations.',
    value: r => r.costPerRegistration,
    total: t => t.costPerRegistration,
  },
  {
    id: 'costPerAttendee',
    label: 'Cost / attendee',
    fullLabel: 'Cost per Attendee',
    group: 'costs',
    kind: 'currency',
    description: 'Ad spend ÷ attendees (by signup).',
    value: r => r.costPerAttendee,
    total: t => t.costPerAttendee,
  },
  {
    id: 'costPerSale',
    label: 'Cost / sale',
    fullLabel: 'Cost per Sale',
    group: 'costs',
    kind: 'currency',
    description: 'Ad spend ÷ sales.',
    value: r => r.costPerSale,
    total: t => t.costPerSale,
  },

  // --- Revenue ------------------------------------------------------------
  {
    id: 'revenue',
    label: 'Revenue',
    fullLabel: 'Revenue (Total)',
    group: 'revenue',
    kind: 'currency',
    description: 'Revenue from people who registered this day.',
    value: r => r.revenue,
    total: t => t.revenue,
  },
  {
    id: 'liveRevenue',
    label: 'Revenue live',
    fullLabel: 'Revenue (Live)',
    group: 'revenue',
    kind: 'currency',
    description: 'Revenue attributed to the live session.',
    value: r => r.liveRevenue ?? 0,
    total: t => t.liveRevenue,
  },
  {
    id: 'replayRevenue',
    label: 'Revenue replay',
    fullLabel: 'Revenue (Replay)',
    group: 'revenue',
    kind: 'currency',
    description: 'Revenue attributed to the replay.',
    value: r => r.replayRevenue ?? 0,
    total: t => t.replayRevenue,
  },
  {
    id: 'averageOrderValue',
    label: 'Avg order',
    fullLabel: 'Average Order Value',
    group: 'revenue',
    kind: 'currency',
    description: 'Revenue ÷ sales.',
    value: r => r.averageOrderValue ?? 0,
    total: t => t.averageOrderValue,
  },
  {
    id: 'profit',
    label: 'Profit',
    fullLabel: 'Profit',
    group: 'revenue',
    kind: 'currency',
    description: 'Revenue − ad spend.',
    signed: true,
    value: r => r.profit,
    total: t => t.profit,
  },
  {
    id: 'roi',
    label: 'ROI',
    fullLabel: 'ROI %',
    group: 'revenue',
    kind: 'percent',
    description: '(Revenue − spend) ÷ spend.',
    signed: true,
    value: r => r.roi,
    total: t => t.roi,
  },
]

// A Map, not an object: ids come from localStorage, and a plain object would
// happily return Object.prototype for '__proto__' or 'constructor'.
const COLUMN_INDEX = new Map<string, ReportColumn>(REPORT_COLUMNS.map(c => [c.id, c]))

export const getColumn = (id: string): ReportColumn | undefined => COLUMN_INDEX.get(id)

export const ALL_COLUMN_IDS = REPORT_COLUMNS.map(c => c.id)

export const columnsInGroup = (group: ColumnGroupId) =>
  REPORT_COLUMNS.filter(c => c.group === group)

export const resolveCaption = (col: ReportColumn, ctx: CaptionContext): string | undefined =>
  typeof col.caption === 'function' ? col.caption(ctx) : col.caption

// ---------------------------------------------------------------------------
// Totals
// ---------------------------------------------------------------------------

const ratio = (num: number, den: number, scale = 1) => (den > 0 ? (num / den) * scale : 0)

export function computeTotals(reports: ReportRow[]) {
  if (reports.length === 0) return null

  const sum = reports.reduce(
    (acc, r) => {
      acc.spend += r.fbResults.spend
      acc.impressions += r.fbResults.impressions
      acc.clicks += r.fbResults.clicks
      acc.revenue += r.revenue
      acc.liveRevenue += r.liveRevenue || 0
      acc.replayRevenue += r.replayRevenue || 0
      acc.visitors += r.visitors
      acc.registrations += r.registrations
      acc.totalAttendees += r.totalAttendees
      acc.liveAttendees += r.liveAttendees
      acc.replayAttendees += r.replayAttendees
      acc.pastRegistrationCount += r.pastRegistrationCount
      acc.pastAttendees += r.pastAttendees
      acc.engagedTotal += r.engagedTotal
      acc.engagedLive += r.engagedLive
      acc.engagedReplay += r.engagedReplay
      acc.salesTotal += r.salesTotal
      acc.salesLive += r.salesLive
      acc.salesReplay += r.salesReplay
      acc.sessionRegistered += r.sessionRegistered || 0
      acc.sessionSettled += r.sessionSettled || 0
      acc.sessionLive += r.sessionLive || 0
      acc.sessionMissed += r.sessionMissed || 0
      acc.sessionUpcoming += r.sessionUpcoming || 0
      acc.sessionEngaged += r.sessionEngaged || 0
      acc.sessionSales += r.sessionSales || 0
      acc.sessionReplay += r.sessionReplay || 0
      return acc
    },
    {
      spend: 0,
      impressions: 0,
      clicks: 0,
      revenue: 0,
      liveRevenue: 0,
      replayRevenue: 0,
      visitors: 0,
      registrations: 0,
      totalAttendees: 0,
      liveAttendees: 0,
      replayAttendees: 0,
      pastRegistrationCount: 0,
      pastAttendees: 0,
      engagedTotal: 0,
      engagedLive: 0,
      engagedReplay: 0,
      salesTotal: 0,
      salesLive: 0,
      salesReplay: 0,
      sessionRegistered: 0,
      sessionSettled: 0,
      sessionLive: 0,
      sessionMissed: 0,
      sessionUpcoming: 0,
      sessionEngaged: 0,
      sessionSales: 0,
      sessionReplay: 0,
    }
  )

  // Rates are recomputed from the summed counts. Averaging the daily
  // percentages instead would weight a 2-registrant day the same as a
  // 200-registrant one.
  return {
    ...sum,
    days: reports.length,
    ctr: ratio(sum.clicks, sum.impressions, 100),
    cpm: ratio(sum.spend, sum.impressions, 1000),
    cpc: ratio(sum.spend, sum.clicks),
    sessionAttendanceRate: ratio(sum.sessionLive, sum.sessionSettled, 100),
    sessionReplayRate: ratio(sum.sessionReplay, sum.sessionSettled, 100),
    sessionEngagedPerRegistered: ratio(sum.sessionEngaged, sum.sessionSettled, 100),
    sessionEngagementRateLive: ratio(sum.sessionEngaged, sum.sessionLive, 100),
    sessionSalesPerRegistered: ratio(sum.sessionSales, sum.sessionSettled, 100),
    profit: sum.revenue - sum.spend,
    roi: ratio(sum.revenue - sum.spend, sum.spend, 100),
    averageOrderValue: ratio(sum.revenue, sum.salesTotal),
    registrationRate: ratio(sum.registrations, sum.visitors, 100),
    attendanceRate: ratio(sum.totalAttendees, sum.registrations, 100),
    realAttendanceRate: ratio(sum.pastAttendees, sum.pastRegistrationCount, 100),
    liveAttendanceRate: ratio(sum.liveAttendees, sum.registrations, 100),
    replayAttendanceRate: ratio(sum.replayAttendees, sum.registrations, 100),
    engagedPerVisitor: ratio(sum.engagedTotal, sum.visitors, 100),
    engagedLivePerVisitor: ratio(sum.engagedLive, sum.visitors, 100),
    engagedReplayPerVisitor: ratio(sum.engagedReplay, sum.visitors, 100),
    engagedPerRegistered: ratio(sum.engagedTotal, sum.registrations, 100),
    engagedLivePerRegistered: ratio(sum.engagedLive, sum.registrations, 100),
    engagedReplayPerRegistered: ratio(sum.engagedReplay, sum.registrations, 100),
    engagementRateTotal: ratio(sum.engagedTotal, sum.totalAttendees, 100),
    engagementRateLive: ratio(sum.engagedLive, sum.liveAttendees, 100),
    engagementRateReplay: ratio(sum.engagedReplay, sum.replayAttendees, 100),
    costPerRegistration: ratio(sum.spend, sum.registrations),
    costPerAttendee: ratio(sum.spend, sum.totalAttendees),
    costPerSale: ratio(sum.spend, sum.salesTotal),
  }
}

export type ReportTotals = NonNullable<ReturnType<typeof computeTotals>>

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const formatCurrency = (n: number) => currencyFormatter.format(n)
export const formatCount = (n: number) => n.toLocaleString('en-US')
export const formatPercent = (n: number, decimals = 1) => `${n.toFixed(decimals)}%`

// report.date is a plain yyyy-MM-dd already expressed in the viewer's
// timezone, so parse it as a local date - new Date('2026-08-27') is UTC
// midnight and would render as the previous day west of Greenwich.
export const parseReportDate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const formatDateLabel = (value: string, withYear = false) =>
  parseReportDate(value).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' as const } : {}),
  })

export const formatDateLong = (value: string) =>
  parseReportDate(value).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

/** Plain-text rendering, used by the CSV export. */
export function formatCellText(col: ReportColumn, value: number | string | null | undefined): string {
  if (value == null || value === '') return ''
  if (typeof value === 'string') return value
  switch (col.kind) {
    case 'currency':
      return value.toFixed(2)
    case 'percent':
      return value.toFixed(2)
    case 'count':
      return String(value)
    default:
      return String(value)
  }
}
