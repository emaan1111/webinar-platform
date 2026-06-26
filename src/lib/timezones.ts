// A short, curated set of common timezones for registrant-facing pickers (not the full
// ~400-entry IANA list). Each maps to its country so the label reads "Country/City".
// The visitor's auto-detected zone is always added on top if it isn't in this list.
const TZ_COUNTRY: Record<string, string> = {
  // Americas
  'America/Los_Angeles': 'United States',
  'America/Denver': 'United States',
  'America/Chicago': 'United States',
  'America/New_York': 'United States',
  'America/Toronto': 'Canada',
  // Europe
  'Europe/London': 'United Kingdom',
  'Europe/Paris': 'France',
  'Europe/Berlin': 'Germany',
  'Europe/Madrid': 'Spain',
  'Europe/Rome': 'Italy',
  'Europe/Amsterdam': 'Netherlands',
  'Europe/Oslo': 'Norway',
  'Europe/Stockholm': 'Sweden',
  // Middle East / South & East Asia
  'Asia/Dubai': 'United Arab Emirates',
  'Asia/Qatar': 'Qatar',
  'Asia/Riyadh': 'Saudi Arabia',
  'Asia/Karachi': 'Pakistan',
  'Asia/Kolkata': 'India',
  'Asia/Kuala_Lumpur': 'Malaysia',
  'Asia/Singapore': 'Singapore',
  'Asia/Hong_Kong': 'Hong Kong',
  // Oceania
  'Australia/Perth': 'Australia',
  'Australia/Brisbane': 'Australia',
  'Australia/Sydney': 'Australia',
  'Australia/Melbourne': 'Australia',
  'Pacific/Auckland': 'New Zealand',
}

// Common aliases some browsers still report, mapped so the detected zone shows a country too.
const TZ_ALIAS_COUNTRY: Record<string, string> = {
  'Asia/Calcutta': 'India',
  'Asia/Katmandu': 'Nepal',
  'America/Buenos_Aires': 'Argentina',
}

function countryFor(tz: string): string {
  return TZ_COUNTRY[tz] || TZ_ALIAS_COUNTRY[tz] || tz.split('/')[0]
}

// Sorted alphabetically by country (then city) so the dropdown reads in a calm, predictable order.
export const COMMON_TIMEZONES: string[] = Object.keys(TZ_COUNTRY).sort((a, b) => {
  const c = countryFor(a).localeCompare(countryFor(b))
  return c !== 0 ? c : a.localeCompare(b)
})

/** Label like "Pakistan/Karachi (GMT+5)". */
export function timezoneLabel(tz: string): string {
  const city = tz.split('/').pop()?.replace(/_/g, ' ') || tz
  let label = `${countryFor(tz)}/${city}`
  try {
    const off = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName')?.value
    if (off) label += ` (${off})`
  } catch {
    // keep label without offset
  }
  return label
}
