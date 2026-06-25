// A short, curated list of common timezones for registrant-facing pickers (not the full
// ~400-entry IANA list). The visitor's auto-detected zone is always added on top if missing.
export const COMMON_TIMEZONES: string[] = [
  // Americas
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Toronto',
  'America/Mexico_City',
  'America/Bogota',
  'America/Sao_Paulo',
  // Europe / Africa
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Istanbul',
  'Europe/Moscow',
  'Africa/Lagos',
  'Africa/Cairo',
  'Africa/Johannesburg',
  // Middle East / South & East Asia
  'Asia/Dubai',
  'Asia/Riyadh',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Jakarta',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  // Oceania
  'Australia/Perth',
  'Australia/Sydney',
  'Pacific/Auckland',
]

/** Friendly label like "Karachi (GMT+5)" — falls back to the city name if offset lookup fails. */
export function timezoneLabel(tz: string): string {
  const city = tz.split('/').pop()?.replace(/_/g, ' ') || tz
  try {
    const off = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName')?.value
    return off ? `${city} (${off})` : city
  } catch {
    return city
  }
}
