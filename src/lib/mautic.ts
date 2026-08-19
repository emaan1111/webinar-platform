interface MauticContact {
  id: number
  fields?: {
    all?: Record<string, unknown>
  }
  tags?: Array<{
    tag?: string
  }>
}

interface SyncMauticContactInput {
  email: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  country?: string | null
  timezone?: string | null
  tags?: string[]
  customFields?: Record<string, string | null | undefined>
}

function getMauticBaseUrl(): string | null {
  const baseUrl = process.env.MAUTIC_BASE_URL?.trim()
  if (!baseUrl) {
    return null
  }

  return baseUrl.replace(/\/$/, '')
}

function getConfiguredMauticFieldAliases() {
  return {
    phone: process.env.MAUTIC_PHONE_FIELD_ALIAS?.trim() || 'phone',
    country: process.env.MAUTIC_COUNTRY_FIELD_ALIAS?.trim() || null,
    timezone: process.env.MAUTIC_TIMEZONE_FIELD_ALIAS?.trim() || null,
  }
}

function buildMauticAuthHeaders(): HeadersInit | null {
  const accessToken = process.env.MAUTIC_ACCESS_TOKEN?.trim()
  if (accessToken) {
    return {
      Authorization: `Bearer ${accessToken}`,
    }
  }

  const username = process.env.MAUTIC_USERNAME?.trim() || process.env.MAUTIC_API_USERNAME?.trim()
  const password = process.env.MAUTIC_PASSWORD ?? process.env.MAUTIC_API_PASSWORD

  if (username && password) {
    const encoded = Buffer.from(`${username}:${password}`).toString('base64')
    return {
      Authorization: `Basic ${encoded}`,
    }
  }

  return null
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Format a date/datetime value for Mautic API
 * Mautic expects: YYYY-MM-DD HH:MM:SS (MySQL format)
 */
function formatDateTimeForMautic(value: string | Date | undefined | null): string | undefined {
  if (!value) return undefined
  
  try {
    const date = typeof value === 'string' ? new Date(value) : value
    if (isNaN(date.getTime())) return undefined
    
    // Format as YYYY-MM-DD HH:MM:SS
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    const seconds = String(date.getUTCSeconds()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  } catch {
    return undefined
  }
}

/**
 * Truncate string to max length for Mautic text fields (64 char limit)
 */
function truncateForMautic(value: string, maxLength: number = 64): string {
  if (value.length <= maxLength) return value
  return value.substring(0, maxLength - 3) + '...'
}

/**
 * Map ISO country codes to full country names for Mautic
 */
const countryCodeToName: Record<string, string> = {
  'US': 'United States',
  'CA': 'Canada', 
  'GB': 'United Kingdom',
  'UK': 'United Kingdom',
  'AU': 'Australia',
  'IN': 'India',
  'PK': 'Pakistan',
  'AE': 'United Arab Emirates',
  'SA': 'Saudi Arabia',
  'MY': 'Malaysia',
  'SG': 'Singapore',
  'NZ': 'New Zealand',
  'DE': 'Germany',
  'FR': 'France',
  'IT': 'Italy',
  'ES': 'Spain',
  'NL': 'Netherlands',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'IE': 'Ireland',
  'PH': 'Philippines',
  'ID': 'Indonesia',
  'BD': 'Bangladesh',
  'NG': 'Nigeria',
  'ZA': 'South Africa',
  'KE': 'Kenya',
  'EG': 'Egypt',
  'TR': 'Turkey',
}

function normalizeCountryForMautic(country: string | null | undefined): string | undefined {
  if (!country) return undefined
  const trimmed = country.trim().toUpperCase()
  // If it's a 2-letter code, convert to full name
  if (trimmed.length === 2 && countryCodeToName[trimmed]) {
    return countryCodeToName[trimmed]
  }
  // Otherwise return as-is (might already be full name)
  return country.trim()
}

function normalizeTagNames(tags?: string[]): string[] {
  if (!tags) return []

  return Array.from(
    new Set(
      tags
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
    )
  )
}

function extractFirstContact(payload: any): MauticContact | null {
  if (!payload) return null

  if (payload.contact?.id) {
    return payload.contact as MauticContact
  }

  if (payload.contacts && typeof payload.contacts === 'object') {
    const firstContact = Object.values(payload.contacts)[0]
    if (firstContact && typeof firstContact === 'object' && 'id' in firstContact) {
      return firstContact as MauticContact
    }
  }

  return null
}

// Abort hung Mautic calls so a slow provider can't stall our request handlers.
const MAUTIC_TIMEOUT_MS = 10_000

async function mauticRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const baseUrl = getMauticBaseUrl()
  const authHeaders = buildMauticAuthHeaders()

  if (!baseUrl || !authHeaders) {
    throw new Error('Mautic API not configured')
  }

  const headers: HeadersInit = {
    Accept: 'application/json',
    ...authHeaders,
    ...(init.headers || {}),
  }

  try {
    return await fetch(`${baseUrl}/api${path}`, {
      ...init,
      headers,
      signal: AbortSignal.timeout(MAUTIC_TIMEOUT_MS),
    })
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      console.error(`⏱️ Mautic request timed out after ${MAUTIC_TIMEOUT_MS}ms: ${path}`)
    }
    throw error
  }
}

export function isMauticConfigured(): boolean {
  return !!(getMauticBaseUrl() && buildMauticAuthHeaders())
}

export async function findMauticContactByEmail(email: string): Promise<MauticContact | null> {
  if (!isMauticConfigured()) {
    return null
  }

  const normalizedEmail = normalizeEmail(email)

  try {
    const response = await mauticRequest(`/contacts?search=${encodeURIComponent(`email:${normalizedEmail}`)}`, {
      method: 'GET',
    })

    if (!response.ok) {
      const details = await response.text()
      console.error('❌ Failed to search Mautic contact:', response.status, details)
      return null
    }

    const payload = await response.json()
    return extractFirstContact(payload)
  } catch (error) {
    console.error('❌ Mautic contact lookup failed:', error)
    return null
  }
}

export async function syncContactToMautic(input: SyncMauticContactInput): Promise<{ success: boolean; contactId?: number }> {
  if (!isMauticConfigured()) {
    console.log('⚠️ Mautic API not configured - skipping contact sync')
    return { success: false }
  }

  // Debug: log input customFields
  console.log('📝 Mautic sync input customFields:', JSON.stringify(input.customFields, null, 2))

  const normalizedEmail = normalizeEmail(input.email)
  const fieldAliases = getConfiguredMauticFieldAliases()
  const tags = normalizeTagNames(input.tags)

  try {
    const existingContact = await findMauticContactByEmail(normalizedEmail)

    const payload: Record<string, unknown> = {
      email: normalizedEmail,
      overwriteWithBlank: false,
    }

    if (input.firstName?.trim()) payload.firstname = input.firstName.trim()
    if (input.lastName?.trim()) payload.lastname = input.lastName.trim()
    if (input.phone?.trim()) payload[fieldAliases.phone] = input.phone.trim()
    if (fieldAliases.country && input.country?.trim()) {
      const normalizedCountry = normalizeCountryForMautic(input.country)
      if (normalizedCountry) payload[fieldAliases.country] = normalizedCountry
    }
    // Skip timezone - Mautic has strict validation that rejects many valid IANA timezone names

    // Known datetime fields that need special formatting (MySQL format: YYYY-MM-DD HH:MM:SS)
    // Note: webinar_scheduled_time is now pre-formatted as user-friendly text with timezone
    const datetimeFields = ['webinar_registration_date']
    // Fields that should be truncated to 64 characters (TEXT type default limit)
    const shortTextFields = ['webinar_name', 'webinar_attendance_status', 'webinar_referral_code']
    // webinar_link and webinar_scheduled_time are TEXTAREA type - can handle longer values
    
    for (const [alias, value] of Object.entries(input.customFields || {})) {
      if (!alias.trim() || value === null || value === undefined) continue
      
      const trimmedAlias = alias.trim()
      const trimmedValue = String(value).trim()
      if (!trimmedValue) continue
      
      // Format datetime fields for Mautic
      if (datetimeFields.includes(trimmedAlias)) {
        const formattedDate = formatDateTimeForMautic(trimmedValue)
        if (formattedDate) {
          payload[trimmedAlias] = formattedDate
        }
      } else if (shortTextFields.includes(trimmedAlias)) {
        // Truncate short text fields to 64 chars (Mautic default TEXT limit)
        payload[trimmedAlias] = truncateForMautic(trimmedValue, 64)
      } else {
        // webinar_link, webinar_scheduled_time and other fields - no truncation needed
        payload[trimmedAlias] = trimmedValue
      }
    }

    if (tags.length > 0) {
      payload.tags = tags
    }

    // Debug logging for troubleshooting custom fields
    console.log('📧 Mautic sync payload:', JSON.stringify(payload, null, 2))

    const response = existingContact
      ? await mauticRequest(`/contacts/${existingContact.id}/edit`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
      : await mauticRequest('/contacts/new', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

    if (!response.ok) {
      const details = await response.text()
      console.error('❌ Mautic contact sync failed:', response.status, details)
      return { success: false }
    }

    const result = await response.json()
    const syncedContact = extractFirstContact(result)

    console.log(`✅ Mautic contact ${existingContact ? 'updated' : 'created'}: ${normalizedEmail}`)
    return {
      success: true,
      contactId: syncedContact?.id,
    }
  } catch (error) {
    console.error('❌ Failed to sync contact to Mautic:', error)
    return { success: false }
  }
}

export async function tagMauticContact(email: string, tags: string[]): Promise<boolean> {
  const normalizedTags = normalizeTagNames(tags)

  if (normalizedTags.length === 0) {
    return false
  }

  const result = await syncContactToMautic({
    email,
    tags: normalizedTags,
  })

  if (result.success) {
    console.log(`✅ Mautic tags applied to ${normalizeEmail(email)}: ${normalizedTags.join(', ')}`)
  }

  return result.success
}

export async function applyMauticTagToContact(email: string, tagName: string): Promise<boolean> {
  return tagMauticContact(email, [tagName])
}