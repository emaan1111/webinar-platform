/**
 * Shared .ics calendar event generation utility.
 * Used by the /api/calendar/[slug] route and confirmation email attachment.
 */

export interface CalendarEventOptions {
  title: string
  description: string
  startTime: Date
  durationMinutes: number
  url?: string
  uid?: string
}

export function generateICS(opts: CalendarEventOptions): string {
  const endTime = new Date(opts.startTime.getTime() + opts.durationMinutes * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WebinarPlay//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${opts.uid || `${Date.now()}@webinarplay`}`,
    `DTSTART:${fmt(opts.startTime)}`,
    `DTEND:${fmt(endTime)}`,
    `SUMMARY:${escapeICS(opts.title)}`,
    `DESCRIPTION:${escapeICS(opts.description)}`,
    ...(opts.url ? [`URL:${opts.url}`] : []),
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(opts.title)} starts in 15 minutes`,
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT60M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(opts.title)} starts in 1 hour`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}
