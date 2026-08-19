/**
 * WebinarJam API Integration
 * 
 * Fetches registrations and attendance data from WebinarJam.
 * API Documentation: https://support.webinarjam.com/support/solutions/153000174610
 * 
 * Setup:
 * 1. Get your WebinarJam API key from: https://app.webinarjam.com/settings/api
 * 2. Add WEBINARJAM_API_KEY to your .env file
 */

const WEBINARJAM_API_BASE = 'https://api.webinarjam.com/webinarjam'
const EVERWEBINAR_API_BASE = 'https://api.webinarjam.com/everwebinar'

import { fromZonedTime, getTimezoneOffset } from 'date-fns-tz'

const apiKey = process.env.WEBINARJAM_API_KEY

// WebinarJam API response types
export interface WebinarJamWebinar {
  webinar_id: string | number
  name: string
  description?: string
  type?: string
  timezone?: string // e.g., "America/New_York"
  schedules?: WebinarJamSchedule[]
}

export interface WebinarJamSchedule {
  schedule: string | number
  date: string
  time: string
  timezone: string
  comment?: string
}

// Response from registrants endpoint - detailed registrant with attendance data
export interface WebinarJamRegistrant {
  // Basic info
  first_name: string
  last_name?: string
  email: string
  phone?: string
  phone_number?: string // New API format uses phone_number
  phone_country_code?: string
  ip?: string
  
  // Webinar info
  webinar: string | number
  schedule: string | number
  event?: string // Actual scheduled session time (e.g., "Sun, 5 Apr 2026, 07:00 PM")
  signup_date: string
  
  // Live attendance - API may return number (0/1) or string ("Yes"/"No")
  attended_live: number | string
  date_live?: string
  entered_live?: string // Time entered
  time_live?: string // Time spent in live room (e.g., "00:45:30" or seconds)
  purchased_live?: number | string
  revenue_live?: string | number
  
  // Replay attendance - API may return number (0/1) or string ("Yes"/"No")
  attended_replay: number | string
  date_replay?: string
  time_replay?: string // Time spent in replay room
  purchased_replay?: number | string
  revenue_replay?: string | number
  
  // Status
  subscribed?: number | string
  gdpr_status?: number | string
  gdpr_communications?: number | string
  
  // UTM tracking
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_term?: string | null
  utm_content?: string | null
  
  // Links (new API nests these under a links object)
  live_room?: string
  replay_room?: string
  unsubscribe?: string
  links?: {
    live_room?: string
    replay_room?: string
    unsubscribe?: string
  }
  
  // Additional fields in new API
  country?: { id: number; name: string } | string
  state?: { id: number; name: string } | string
}

export interface WebinarJamRegistrantsResponse {
  status: string
  users?: WebinarJamRegistrant[]
  user?: WebinarJamRegistrant[]  // Legacy format
  // New API format: registrants is a paginated object
  registrants?: {
    current_page: number
    data: WebinarJamRegistrant[]
    last_page: number
    per_page: number
    total: number
  } | WebinarJamRegistrant[]
  webinar?: {
    webinar_id: string | number
    name: string
  }
}

export interface WebinarJamWebinarsResponse {
  status: string
  webinars?: WebinarJamWebinar[]
}

export interface WebinarJamWebinarDetailsResponse {
  status: string
  webinar?: WebinarJamWebinar
}

/**
 * Check if WebinarJam API is configured
 */
export function isWebinarJamConfigured(): boolean {
  return !!apiKey
}

/**
 * Get the API base URL for the platform
 */
function getApiBase(platform: 'webinarjam' | 'everwebinar' = 'webinarjam'): string {
  return platform === 'everwebinar' ? EVERWEBINAR_API_BASE : WEBINARJAM_API_BASE
}

// Abort hung WebinarJam/EverWebinar calls so a slow provider can't stall our request handlers.
const WEBINARJAM_TIMEOUT_MS = 10_000

async function wjFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(WEBINARJAM_TIMEOUT_MS) })
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      console.error(`⏱️ WebinarJam request timed out after ${WEBINARJAM_TIMEOUT_MS}ms: ${url}`)
    }
    throw error
  }
}

/**
 * List all webinars for the account
 */
export async function listWebinars(platform: 'webinarjam' | 'everwebinar' = 'webinarjam'): Promise<WebinarJamWebinar[]> {
  if (!apiKey) {
    console.warn('⚠️ WebinarJam API not configured')
    return []
  }

  try {
    const response = await wjFetch(`${getApiBase(platform)}/webinars`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        api_key: apiKey,
      }),
    })

    if (!response.ok) {
      throw new Error(`WebinarJam API error: ${response.status}`)
    }

    const data: WebinarJamWebinarsResponse = await response.json()
    
    if (data.status !== 'success') {
      console.error('WebinarJam API returned error status:', data)
      return []
    }

    return data.webinars || []
  } catch (error) {
    console.error('❌ Failed to fetch WebinarJam webinars:', error)
    return []
  }
}

// In-memory TTL cache for webinar details, keyed by platform+webinarId. The schedules
// API calls getWebinarDetails on every registration time-slot render (and re-fires per
// timezone change), so keep it off the WebinarJam API's critical path. Successful
// responses only; failures are never cached. Single-instance deployment — in-memory is fine.
const WEBINAR_DETAILS_CACHE_TTL_MS = 5 * 60 * 1000
const webinarDetailsCache = new Map<string, { webinar: WebinarJamWebinar; expiresAt: number }>()

/**
 * Get details for a specific webinar (including schedules)
 */
export async function getWebinarDetails(
  webinarId: string,
  platform: 'webinarjam' | 'everwebinar' = 'webinarjam',
  options: { bypassCache?: boolean } = {}
): Promise<WebinarJamWebinar | null> {
  if (!apiKey) {
    console.warn('⚠️ WebinarJam API not configured')
    return null
  }

  const cacheKey = `${platform}:${webinarId}`
  if (!options.bypassCache) {
    const cached = webinarDetailsCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.webinar
    }
  }

  try {
    const response = await wjFetch(`${getApiBase(platform)}/webinar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        api_key: apiKey,
        webinar_id: webinarId,
      }),
    })

    if (!response.ok) {
      throw new Error(`WebinarJam API error: ${response.status}`)
    }

    const data: WebinarJamWebinarDetailsResponse = await response.json()

    if (data.status !== 'success' || !data.webinar) {
      console.error('WebinarJam API returned error:', data)
      return null
    }

    webinarDetailsCache.set(cacheKey, {
      webinar: data.webinar,
      expiresAt: Date.now() + WEBINAR_DETAILS_CACHE_TTL_MS,
    })

    return data.webinar
  } catch (error) {
    console.error(`❌ Failed to fetch webinar ${webinarId}:`, error)
    return null
  }
}

/** Matches EverWebinar's dynamic "Just in time" schedule block by its comment/label. */
function isJustInTimeComment(comment?: string | null): boolean {
  return /just[\s-]?in[\s-]?time/i.test(comment || '')
}

/**
 * Resolve the webinar's real "Just in time" schedule id (EverWebinar's dynamic instant block).
 *
 * EverWebinar rejects a literal schedule "0" with HTTP 422, so a just-in-time registration must
 * target this real schedule id to be accepted and to return a per-attendee live room link.
 * Returns null when the webinar has no such block (caller should then skip the API call rather
 * than send an invalid "0").
 */
export async function resolveJustInTimeScheduleId(
  webinarId: string,
  platform: 'webinarjam' | 'everwebinar' = 'webinarjam',
): Promise<string | null> {
  const webinar = await getWebinarDetails(webinarId, platform)
  const jit = webinar?.schedules?.find((s) => isJustInTimeComment(s.comment))
  return jit ? String(jit.schedule) : null
}

/**
 * Get registrants and attendance data for a webinar
 * 
 * @param webinarId - The webinar ID
 * @param scheduleId - Optional schedule ID for specific session
 * @param options - Additional filter options
 */
export async function getWebinarRegistrants(
  webinarId: string,
  options: {
    platform?: 'webinarjam' | 'everwebinar'
    scheduleId?: string
    attendedLive?: 0 | 1 | 2 | 3 | 4 // 0=all, 1=attended, 2=not attended, 3/4=timestamp based
    attendedReplay?: 0 | 1 | 2 | 3 | 4
    purchased?: 0 | 1 | 2 // 0=all, 1=purchased, 2=not purchased
    dateRange?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 // 0=all time, 5=last 7 days, 8=last 30 days
    page?: number
  } = {}
): Promise<{
  webinar?: { webinar_id: string | number; name: string }
  registrants: WebinarJamRegistrant[]
}> {
  if (!apiKey) {
    console.warn('⚠️ WebinarJam API not configured')
    return { registrants: [] }
  }

  const platform = options.platform || 'webinarjam'

  try {
    const params: Record<string, string> = {
      api_key: apiKey,
      webinar_id: webinarId,
    }

    if (options.scheduleId) params.schedule_id = options.scheduleId
    if (options.attendedLive !== undefined) params.attended_live = String(options.attendedLive)
    if (options.attendedReplay !== undefined) params.attended_replay = String(options.attendedReplay)
    if (options.purchased !== undefined) params.purchased = String(options.purchased)
    if (options.dateRange !== undefined) params.date_range = String(options.dateRange)
    if (options.page) params.page = String(options.page)

    const response = await wjFetch(`${getApiBase(platform)}/registrants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params),
    })

    if (!response.ok) {
      throw new Error(`WebinarJam API error: ${response.status}`)
    }

    const data: WebinarJamRegistrantsResponse = await response.json()
    
    if (data.status !== 'success') {
      console.error('WebinarJam API returned error status:', data)
      return { registrants: [] }
    }

    // Handle multiple API response formats:
    // - New paginated format: data.registrants.data (array inside paginated object)
    // - Legacy array format: data.registrants (direct array)
    // - Old format: data.users or data.user
    let registrants: WebinarJamRegistrant[] = []
    
    if (data.registrants) {
      if (Array.isArray(data.registrants)) {
        registrants = data.registrants
      } else if (data.registrants.data && Array.isArray(data.registrants.data)) {
        registrants = data.registrants.data
      }
    } else {
      registrants = data.users || data.user || []
    }

    return {
      webinar: data.webinar,
      registrants
    }
  } catch (error) {
    console.error(`❌ Failed to fetch registrants for webinar ${webinarId}:`, error)
    return { registrants: [] }
  }
}

/**
 * Convert an IANA timezone (e.g. "Europe/London") into the GMT-offset string EverWebinar's
 * API expects for its `timezone` parameter — e.g. "GMT+1", "GMT-5", "GMT+5:30".
 *
 * The offset is resolved AT a specific instant so daylight saving is correct: London is
 * "GMT+1" in summer (BST) but "GMT+0" in winter, so a wrong-season offset would book the
 * wrong hour. Pass the chosen session time as `at` when known; defaults to now otherwise.
 * Returns null if the zone can't be resolved (caller then omits the param).
 */
export function ianaToGmtOffset(timeZone: string, at: Date = new Date()): string | null {
  try {
    const offsetMs = getTimezoneOffset(timeZone, at)
    if (Number.isNaN(offsetMs)) return null
    const totalMin = Math.round(offsetMs / 60000)
    const sign = totalMin < 0 ? '-' : '+'
    const abs = Math.abs(totalMin)
    const h = Math.floor(abs / 60)
    const m = abs % 60
    return m === 0 ? `GMT${sign}${h}` : `GMT${sign}${h}:${String(m).padStart(2, '0')}`
  } catch {
    return null
  }
}

/**
 * Register a user to a WebinarJam webinar
 */
export async function registerUserToWebinar(
  webinarId: string,
  scheduleId: string,
  data: {
    firstName: string
    lastName?: string
    email: string
    phone?: string
    phoneCountryCode?: string
    // Registrant's IANA timezone (e.g. "Europe/London"). REQUIRED for webinars set to
    // "auto-detect the user's timezone": without it EverWebinar silently defaults to EST,
    // so a UK registrant for an "11 AM local" session gets booked at 11 AM US time.
    timezone?: string
    // The chosen session instant, used only to resolve the timezone's DST offset correctly.
    sessionAt?: Date
  },
  platform: 'webinarjam' | 'everwebinar' = 'webinarjam'
): Promise<{ success: boolean; liveRoomUrl?: string; replayRoomUrl?: string; error?: string }> {
  if (!apiKey) {
    return { success: false, error: 'WebinarJam API not configured' }
  }

  try {
    const params: Record<string, string> = {
      api_key: apiKey,
      webinar_id: webinarId,
      schedule: scheduleId,
      first_name: data.firstName,
      email: data.email,
    }

    if (data.lastName) params.last_name = data.lastName
    if (data.phone) params.phone = data.phone
    if (data.phoneCountryCode) params.phone_country_code = data.phoneCountryCode
    if (data.timezone) {
      const gmt = ianaToGmtOffset(data.timezone, data.sessionAt)
      if (gmt) params.timezone = gmt
    }

    const response = await wjFetch(`${getApiBase(platform)}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params),
    })

    if (!response.ok) {
      throw new Error(`WebinarJam API error: ${response.status}`)
    }

    const result = await response.json()

    if (result.status !== 'success') {
      return { success: false, error: result.message || 'Registration failed' }
    }

    // WebinarJam/EverWebinar's /register returns the per-attendee room link as
    // `live_room_url` (note the _url suffix), while the /registrants (attendance)
    // endpoint nests `live_room` under `links`. Accept every known variant so the
    // link is captured regardless of which the API version returns.
    const u = result.user || {}
    const liveRoomUrl =
      u.live_room_url || u.live_room || u.links?.live_room_url || u.links?.live_room ||
      result.live_room_url || result.live_room || undefined
    const replayRoomUrl =
      u.replay_room_url || u.replay_room || u.links?.replay_room_url || u.links?.replay_room ||
      result.replay_room_url || result.replay_room || undefined

    if (!liveRoomUrl) {
      // Help diagnose API shape changes without leaking PII: log only the keys we saw.
      console.warn('⚠️ WebinarJam /register succeeded but no live room URL found. Response keys:', {
        topLevel: Object.keys(result || {}),
        user: Object.keys(u || {}),
        links: u.links ? Object.keys(u.links) : null,
      })
    }

    return { success: true, liveRoomUrl, replayRoomUrl }
  } catch (error) {
    console.error('❌ WebinarJam registration error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Parse time string from WebinarJam (e.g., "00:45:30" or seconds) to minutes
 */
export function parseWatchTime(timeStr: string | undefined | null): number {
  if (!timeStr) return 0
  
  // If it's already a number (seconds)
  const asNumber = Number(timeStr)
  if (!isNaN(asNumber)) {
    return Math.floor(asNumber / 60)
  }
  
  // Parse HH:MM:SS format
  const parts = timeStr.split(':')
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10) || 0
    const minutes = parseInt(parts[1], 10) || 0
    const seconds = parseInt(parts[2], 10) || 0
    return hours * 60 + minutes + Math.floor(seconds / 60)
  }
  
  // Parse MM:SS format
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10) || 0
    const seconds = parseInt(parts[1], 10) || 0
    return minutes + Math.floor(seconds / 60)
  }
  
  return 0
}

/**
 * Map US state name → IANA timezone.
 * Covers the most common states; defaults to America/New_York for unknown.
 */
const US_STATE_TIMEZONES: Record<string, string> = {
  // Eastern
  'Connecticut': 'America/New_York', 'Delaware': 'America/New_York',
  'Florida': 'America/New_York', 'Georgia': 'America/New_York',
  'Maine': 'America/New_York', 'Maryland': 'America/New_York',
  'Massachusetts': 'America/New_York', 'Michigan': 'America/New_York',
  'New Hampshire': 'America/New_York', 'New Jersey': 'America/New_York',
  'New York': 'America/New_York', 'North Carolina': 'America/New_York',
  'Ohio': 'America/New_York', 'Pennsylvania': 'America/New_York',
  'Rhode Island': 'America/New_York', 'South Carolina': 'America/New_York',
  'Vermont': 'America/New_York', 'Virginia': 'America/New_York',
  'West Virginia': 'America/New_York', 'District of Columbia': 'America/New_York',
  // Central
  'Alabama': 'America/Chicago', 'Arkansas': 'America/Chicago',
  'Illinois': 'America/Chicago', 'Iowa': 'America/Chicago',
  'Kansas': 'America/Chicago', 'Kentucky': 'America/Chicago',
  'Louisiana': 'America/Chicago', 'Minnesota': 'America/Chicago',
  'Mississippi': 'America/Chicago', 'Missouri': 'America/Chicago',
  'Nebraska': 'America/Chicago', 'North Dakota': 'America/Chicago',
  'Oklahoma': 'America/Chicago', 'South Dakota': 'America/Chicago',
  'Tennessee': 'America/Chicago', 'Texas': 'America/Chicago',
  'Wisconsin': 'America/Chicago',
  // Mountain
  'Arizona': 'America/Phoenix', 'Colorado': 'America/Denver',
  'Idaho': 'America/Boise', 'Montana': 'America/Denver',
  'New Mexico': 'America/Denver', 'Utah': 'America/Denver',
  'Wyoming': 'America/Denver',
  // Pacific
  'California': 'America/Los_Angeles', 'Nevada': 'America/Los_Angeles',
  'Oregon': 'America/Los_Angeles', 'Washington': 'America/Los_Angeles',
  // Non-contiguous
  'Alaska': 'America/Anchorage', 'Hawaii': 'Pacific/Honolulu',
}

/**
 * Map Canadian province name → IANA timezone.
 */
const CA_PROVINCE_TIMEZONES: Record<string, string> = {
  'Ontario': 'America/Toronto', 'Quebec': 'America/Toronto',
  'British Columbia': 'America/Vancouver',
  'Alberta': 'America/Edmonton', 'Saskatchewan': 'America/Regina',
  'Manitoba': 'America/Winnipeg',
  'Nova Scotia': 'America/Halifax', 'New Brunswick': 'America/Halifax',
  'Prince Edward Island': 'America/Halifax',
  'Newfoundland and Labrador': 'America/St_Johns',
}

/**
 * Map country name → IANA timezone for single/primary-timezone countries.
 */
const COUNTRY_TIMEZONES: Record<string, string> = {
  'United Kingdom': 'Europe/London',
  'United Arab Emirates': 'Asia/Dubai',
  'Saudi Arabia': 'Asia/Riyadh',
  'India': 'Asia/Kolkata',
  'Pakistan': 'Asia/Karachi',
  'Bangladesh': 'Asia/Dhaka',
  'Egypt': 'Africa/Cairo',
  'South Africa': 'Africa/Johannesburg',
  'Nigeria': 'Africa/Lagos',
  'Kenya': 'Africa/Nairobi',
  'Germany': 'Europe/Berlin',
  'France': 'Europe/Paris',
  'Italy': 'Europe/Rome',
  'Spain': 'Europe/Madrid',
  'Netherlands': 'Europe/Amsterdam',
  'Belgium': 'Europe/Brussels',
  'Sweden': 'Europe/Stockholm',
  'Norway': 'Europe/Oslo',
  'Denmark': 'Europe/Copenhagen',
  'Ireland': 'Europe/Dublin',
  'Turkey': 'Europe/Istanbul',
  'Japan': 'Asia/Tokyo',
  'South Korea': 'Asia/Seoul',
  'Singapore': 'Asia/Singapore',
  'Malaysia': 'Asia/Kuala_Lumpur',
  'Philippines': 'Asia/Manila',
  'Thailand': 'Asia/Bangkok',
  'Indonesia': 'Asia/Jakarta',
  'New Zealand': 'Pacific/Auckland',
  'Qatar': 'Asia/Qatar',
  'Kuwait': 'Asia/Kuwait',
  'Bahrain': 'Asia/Bahrain',
  'Oman': 'Asia/Muscat',
  'Jordan': 'Asia/Amman',
  'Lebanon': 'Asia/Beirut',
  'Israel': 'Asia/Jerusalem',
  'Morocco': 'Africa/Casablanca',
  'Tunisia': 'Africa/Tunis',
  'Algeria': 'Africa/Algiers',
  'Iraq': 'Asia/Baghdad',
  'Sri Lanka': 'Asia/Colombo',
  'Nepal': 'Asia/Kathmandu',
}

/**
 * Guess IANA timezone from a registrant's country and state.
 * Returns null if we can't determine the timezone.
 */
export function guessTimezoneFromLocation(
  country: { id: number; name: string } | string | undefined | null,
  state: { id: number; name: string } | string | undefined | null
): string | null {
  const countryName = typeof country === 'object' && country ? country.name : (country || '')
  const stateName = typeof state === 'object' && state ? state.name : (state || '')
  
  if (!countryName) return null
  
  // US: use state for timezone
  if (countryName === 'United States') {
    return US_STATE_TIMEZONES[stateName] || 'America/New_York' // default to ET for unknown US states
  }
  
  // Canada: use province
  if (countryName === 'Canada') {
    return CA_PROVINCE_TIMEZONES[stateName] || 'America/Toronto' // default to ET for unknown provinces
  }
  
  // Australia: multi-timezone, use state if available
  if (countryName === 'Australia') {
    const AU_STATES: Record<string, string> = {
      'New South Wales': 'Australia/Sydney', 'Victoria': 'Australia/Melbourne',
      'Queensland': 'Australia/Brisbane', 'Western Australia': 'Australia/Perth',
      'South Australia': 'Australia/Adelaide', 'Tasmania': 'Australia/Hobart',
      'Australian Capital Territory': 'Australia/Sydney',
      'Northern Territory': 'Australia/Darwin',
    }
    return AU_STATES[stateName] || 'Australia/Sydney'
  }
  
  // Single-timezone countries
  return COUNTRY_TIMEZONES[countryName] || null
}

/**
 * Parse a date string from the EverWebinar/WebinarJam API.
 * 
 * API date strings like "Sun, 19 Apr 2026, 07:00 PM" have no timezone offset.
 * EverWebinar evergreen schedules show times in each registrant's local timezone.
 * If we can determine the registrant's timezone from their country/state, we convert
 * to UTC properly. Otherwise we parse as-is (interpreted as server local time).
 */
export function parseApiDate(dateStr: string | undefined | null, timezone?: string | null): Date | null {
  if (!dateStr) return null
  const naive = new Date(dateStr)
  if (isNaN(naive.getTime())) return null
  
  if (!timezone) return naive
  
  try {
    // fromZonedTime: interpret the wall-clock time (from naive's local components) as
    // being in the registrant's timezone and convert to UTC
    return fromZonedTime(naive, timezone)
  } catch {
    return naive
  }
}

/**
 * Get full name from registrant data
 */
export function getRegistrantFullName(registrant: WebinarJamRegistrant): string {
  const parts = [registrant.first_name, registrant.last_name].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : 'WebinarJam Registrant'
}

/**
 * Get country name from registrant's country field (can be object or string)
 */
export function getRegistrantCountry(registrant: WebinarJamRegistrant): string | undefined {
  if (!registrant.country) return undefined
  if (typeof registrant.country === 'object') return registrant.country.name || undefined
  return registrant.country || undefined
}

/**
 * Get full phone with country code
 */
export function getRegistrantPhone(registrant: WebinarJamRegistrant): string | undefined {
  const phone = registrant.phone || registrant.phone_number
  if (!phone) return undefined
  if (registrant.phone_country_code) {
    return `${registrant.phone_country_code}${phone}`
  }
  return phone
}

/**
 * Parse registration date string to Date object
 */
export function parseRegistrationDate(dateStr: string | undefined): Date {
  if (!dateStr) return new Date()
  
  const parsed = new Date(dateStr)
  return isNaN(parsed.getTime()) ? new Date() : parsed
}

/**
 * Determine attendance category based on watch time
 */
export function getAttendanceCategory(
  watchTimeMinutes: number,
  webinarDurationMinutes: number,
  mostlyAttendedThreshold: number = 70
): 'attended' | 'mostly_attended' | 'partly_attended' | 'missed' {
  if (watchTimeMinutes === 0) return 'missed'
  
  const percentage = webinarDurationMinutes > 0 
    ? (watchTimeMinutes / webinarDurationMinutes) * 100 
    : 0
  
  if (percentage >= mostlyAttendedThreshold) return 'mostly_attended'
  if (percentage >= 30) return 'partly_attended'
  if (watchTimeMinutes > 0) return 'attended'
  return 'missed'
}
