/**
 * Shared email tracking utilities — merge-tag replacement, open-pixel injection, click-tracking.
 * Used by confirmation, reminder, and follow-up email flows.
 */

const TRACKING_BASE_URL = () =>
  (process.env.NEXT_PUBLIC_APP_URL || 'https://emaanpowerclasses.com').replace(/\/+$/, '')

// ─── HTML escaping ──────────────────────────────────────────────────────────

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ─── Merge-tag context types ────────────────────────────────────────────────

export interface MergeTagContext {
  name: string
  email: string
  webinarTitle: string
  webinarTime?: string | null
  accessLink?: string | null
  countdownLink?: string | null
  calendarLink?: string | null
  referralLink?: string | null
  // Follow-up specific
  replayLink?: string | null
  attendanceStatus?: string | null
  watchTime?: string | null
  unsubscribeLink?: string | null
}

export function getUnsubscribeLink(registrationId: string): string {
  return `${TRACKING_BASE_URL()}/unsubscribe?r=${encodeURIComponent(registrationId)}`
}

/**
 * Format a webinar start time for emails in the REGISTRANT's timezone, with a
 * timezone label (e.g. "8:00 PM GMT+5:30" / "10:30 AM EDT") — matching how the
 * countdown and thank-you pages render it. Without this, a plain toLocaleString()
 * renders in the server's timezone (UTC on Railway), showing the wrong wall-clock
 * time and no zone. Falls back to ET when no timezone is stored, and to a
 * zone-less render if the timezone string is invalid.
 */
export function formatWebinarTime(
  date: Date | null | undefined,
  timezone?: string | null,
): string | null {
  if (!date) return null
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }
  try {
    return date.toLocaleString('en-US', { ...opts, timeZone: timezone || 'America/New_York' })
  } catch {
    // Invalid IANA timezone string — render without forcing a zone rather than throw.
    return date.toLocaleString('en-US', opts)
  }
}

// ─── Replace merge tags ─────────────────────────────────────────────────────

export function replaceMergeTags(text: string, ctx: MergeTagContext): string {
  return text
    .replace(/\{\{name\}\}/gi, escapeHtml(ctx.name))
    .replace(/\{\{email\}\}/gi, escapeHtml(ctx.email))
    .replace(/\{\{webinar_title\}\}/gi, escapeHtml(ctx.webinarTitle))
    .replace(/\{\{webinar_time\}\}/gi, ctx.webinarTime ? escapeHtml(ctx.webinarTime) : '')
    .replace(/\{\{webinar_scheduled_time\}\}/gi, ctx.webinarTime ? escapeHtml(ctx.webinarTime) : '')
    .replace(/\{\{access_link\}\}/gi, ctx.accessLink || '')
    .replace(/\{\{countdown_link\}\}/gi, ctx.countdownLink || '')
    .replace(/\{\{calendar_link\}\}/gi, ctx.calendarLink || '')
    .replace(/\{\{referral_link\}\}/gi, ctx.referralLink || '')
    .replace(/\{\{replay_link\}\}/gi, ctx.replayLink || '')
    .replace(/\{\{attendance_status\}\}/gi, ctx.attendanceStatus ? escapeHtml(ctx.attendanceStatus) : '')
    .replace(/\{\{watch_time\}\}/gi, ctx.watchTime ? escapeHtml(ctx.watchTime) : '')
    .replace(/\{\{unsubscribe_link\}\}/gi, ctx.unsubscribeLink || '')
}

export function appendUnsubscribeFooter(html: string, unsubscribeLink?: string | null): string {
  if (!unsubscribeLink || html.includes('data-email-unsubscribe-footer')) {
    return html
  }

  const footer = `<div data-email-unsubscribe-footer="true" style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#6b7280;"><p style="margin:0;">If you no longer want webinar emails from us, <a href="${unsubscribeLink}" style="color:#2563eb;text-decoration:underline;">unsubscribe here</a>.</p></div>`

  if (html.includes('</body>')) {
    return html.replace('</body>', `${footer}</body>`)
  }

  if (html.includes('</div>')) {
    return html.replace(/<\/div>\s*$/, `${footer}</div>`)
  }

  return `${html}${footer}`
}

// ─── Inject open-tracking pixel ─────────────────────────────────────────────

/**
 * @param html      Email HTML body
 * @param sendId    The send record ID (for any email type)
 * @param emailType "confirmation" | "reminder" | "followup"
 */
export function injectTrackingPixel(html: string, sendId: string, emailType: string): string {
  const pixel = `<img src="${TRACKING_BASE_URL()}/api/email-tracking/open/${sendId}?t=${Date.now()}&type=${emailType}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`
  if (html.includes('</div>')) {
    return html.replace(/<\/div>\s*$/, `${pixel}</div>`)
  }
  return html + pixel
}

// ─── Wrap links with click tracker ──────────────────────────────────────────

/**
 * @param html      Email HTML body (with pixel already injected)
 * @param sendId    The send record ID
 * @param emailType "confirmation" | "reminder" | "followup"
 */
export function wrapLinksWithTracking(html: string, sendId: string, emailType: string): string {
  const base = TRACKING_BASE_URL()

  // Wrap <a href="..."> links
  let result = html.replace(
    /<a\s+([^>]*?)href\s*=\s*["'](https?:\/\/[^"']+)["']([^>]*)>/gi,
    (_match, before, url, after) => {
      const tracked = `${base}/api/email-tracking/click/${sendId}?url=${encodeURIComponent(url)}&type=${emailType}`
      return `<a ${before}href="${tracked}"${after}>`
    }
  )

  // Also wrap standalone URLs in text content
  result = result.replace(
    />([^<]*)(https?:\/\/[^\s<>"']+)([^<]*)</gi,
    (match, before, url, after) => {
      if (url.includes('/api/email-tracking/')) return match
      if (after.trim() === '' && match.endsWith('</a')) return match
      const tracked = `${base}/api/email-tracking/click/${sendId}?url=${encodeURIComponent(url)}&type=${emailType}`
      return `>${before}<a href="${tracked}">${url}</a>${after}<`
    }
  )

  return result
}

// ─── Full pipeline: merge tags → pixel → link tracking ──────────────────────

export function prepareEmailHtml(
  templateHtml: string,
  ctx: MergeTagContext,
  sendId: string,
  emailType: 'confirmation' | 'reminder' | 'followup'
): { html: string; text: string } {
  let html = replaceMergeTags(templateHtml, ctx)
  html = appendUnsubscribeFooter(html, ctx.unsubscribeLink)
  html = injectTrackingPixel(html, sendId, emailType)
  html = wrapLinksWithTracking(html, sendId, emailType)
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return { html, text }
}

// ─── Merge tag definitions for UI ───────────────────────────────────────────

export const CONFIRMATION_PLACEHOLDERS = [
  { tag: '{{name}}', desc: 'Attendee name' },
  { tag: '{{email}}', desc: 'Attendee email' },
  { tag: '{{webinar_title}}', desc: 'Webinar title' },
  { tag: '{{webinar_time}}', desc: 'Scheduled time (local)' },
  { tag: '{{webinar_scheduled_time}}', desc: 'Scheduled time with timezone' },
  { tag: '{{access_link}}', desc: 'Webinar access / Zoom link' },
  { tag: '{{countdown_link}}', desc: 'Countdown page URL' },
  { tag: '{{calendar_link}}', desc: 'Add-to-calendar URL' },
  { tag: '{{referral_link}}', desc: 'Referral URL' },
  { tag: '{{unsubscribe_link}}', desc: 'Unsubscribe URL' },
]

export const REMINDER_PLACEHOLDERS = [
  { tag: '{{name}}', desc: 'Attendee name' },
  { tag: '{{email}}', desc: 'Attendee email' },
  { tag: '{{webinar_title}}', desc: 'Webinar title' },
  { tag: '{{webinar_time}}', desc: 'Scheduled time (local)' },
  { tag: '{{webinar_scheduled_time}}', desc: 'Scheduled time with timezone' },
  { tag: '{{access_link}}', desc: 'Webinar access / Zoom link' },
  { tag: '{{countdown_link}}', desc: 'Countdown page URL' },
  { tag: '{{calendar_link}}', desc: 'Add-to-calendar URL' },
  { tag: '{{referral_link}}', desc: 'Referral URL' },
  { tag: '{{unsubscribe_link}}', desc: 'Unsubscribe URL' },
]

export const FOLLOWUP_PLACEHOLDERS = [
  { tag: '{{name}}', desc: 'Attendee name' },
  { tag: '{{email}}', desc: 'Attendee email' },
  { tag: '{{webinar_title}}', desc: 'Webinar title' },
  { tag: '{{webinar_time}}', desc: 'Scheduled time (local)' },
  { tag: '{{access_link}}', desc: 'Webinar access / Zoom link' },
  { tag: '{{countdown_link}}', desc: 'Countdown page URL' },
  { tag: '{{replay_link}}', desc: 'Replay page URL' },
  { tag: '{{referral_link}}', desc: 'Referral URL' },
  { tag: '{{attendance_status}}', desc: 'Attendance status (attended, missed, etc.)' },
  { tag: '{{watch_time}}', desc: 'Total watch time' },
  { tag: '{{unsubscribe_link}}', desc: 'Unsubscribe URL' },
]

// ─── Human-friendly timing strings ─────────────────────────────────────────

export function minutesToLabel(minutes: number): string {
  if (minutes >= 1440) {
    const days = Math.round(minutes / 1440)
    return days === 1 ? '1 day' : `${days} days`
  }
  if (minutes >= 60) {
    const hours = Math.round(minutes / 60)
    return hours === 1 ? '1 hour' : `${hours} hours`
  }
  return minutes === 1 ? '1 minute' : `${minutes} minutes`
}

export function minutesToBeforeLabel(minutes: number): string {
  return `${minutesToLabel(minutes)} before`
}

export function minutesToAfterLabel(minutes: number): string {
  if (minutes === 0) return 'Immediately after'
  return `${minutesToLabel(minutes)} after`
}

// ─── Audience type labels ───────────────────────────────────────────────────

export const AUDIENCE_TYPES = [
  { value: 'all', label: 'All Registrants' },
  { value: 'attended', label: 'Attended (live)' },
  { value: 'mostly_attended', label: 'Mostly Attended' },
  { value: 'partly_attended', label: 'Partly Attended' },
  { value: 'missed', label: 'Missed' },
  { value: 'replay', label: 'Watched Replay' },
] as const

export function audienceLabel(type: string): string {
  return AUDIENCE_TYPES.find((a) => a.value === type)?.label || type
}

// ─── Preset reminder timings ────────────────────────────────────────────────

export const REMINDER_PRESETS = [
  { value: 1440, label: '24 hours before' },
  { value: 720, label: '12 hours before' },
  { value: 360, label: '6 hours before' },
  { value: 120, label: '2 hours before' },
  { value: 60, label: '1 hour before' },
  { value: 30, label: '30 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 10, label: '10 minutes before' },
  { value: 5, label: '5 minutes before' },
  { value: 1, label: '1 minute before' },
] as const

// ─── Preset follow-up delays ───────────────────────────────────────────────

export const FOLLOWUP_DELAY_PRESETS = [
  { value: 0, label: 'Immediately after webinar' },
  { value: 30, label: '30 minutes after' },
  { value: 60, label: '1 hour after' },
  { value: 120, label: '2 hours after' },
  { value: 360, label: '6 hours after' },
  { value: 720, label: '12 hours after' },
  { value: 1440, label: '1 day after' },
  { value: 2880, label: '2 days after' },
  { value: 4320, label: '3 days after' },
  { value: 7200, label: '5 days after' },
  { value: 10080, label: '7 days after' },
] as const
