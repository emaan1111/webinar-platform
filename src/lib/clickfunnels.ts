// ClickFunnels 2.0 API Integration
// Documentation: https://apidocs.myclickfunnels.com/

import { prisma } from '@/lib/prisma';

interface ClickFunnelsContact {
  email_address: string  // CF uses email_address not email
  first_name?: string
  last_name?: string
  phone_number?: string  // CF uses phone_number not phone
  time_zone?: string
  country?: string
  tag_ids?: number[]  // CF uses tag IDs not tag names
  um_webinar_link?: string  // Countdown page link
  personal_invite_link?: string  // Referral link
  um_webinar_time?: string  // Scheduled time in US/Eastern
  custom_attributes?: Record<string, any>  // CF uses custom_attributes not custom_fields
}

interface ClickFunnelsContactResponse {
  id: number
  email_address: string
  first_name?: string
  last_name?: string
  tags?: Array<{
    id: number
    name: string
  }>
}

const CLICKFUNNELS_API_BASE = 'https://api.myclickfunnels.com/api/v2'
const DEFAULT_WEBINAR_TAG_NAME = 'UM-Webinar-Registered'

/**
 * Fetch all tags from ClickFunnels workspace
 * Returns array of tags with their IDs and names
 */
export async function fetchAllClickFunnelsTags(): Promise<Array<{ id: number; name: string }>> {
  const apiKey = process.env.CLICKFUNNELS_API_KEY
  const workspaceId = process.env.CLICKFUNNELS_WORKSPACE_ID

  if (!apiKey || !workspaceId) {
    console.log('⚠️ ClickFunnels API not configured')
    return []
  }

  try {
    console.log('📋 Fetching all tags from ClickFunnels...')
    
    const url = `${CLICKFUNNELS_API_BASE}/workspaces/${workspaceId}/tags`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Failed to fetch tags:', response.status, errorText)
      return []
    }

    const data = await response.json()
    const tags = data.tags || data || []
    
    console.log(`✅ Found ${tags.length} tags in ClickFunnels`)
    tags.forEach((tag: any) => {
      console.log(`   - ${tag.name} (ID: ${tag.id})`)
    })
    
    return tags.map((tag: any) => ({
      id: Number(tag.id),
      name: tag.name
    }))
  } catch (error) {
    console.error('❌ Error fetching ClickFunnels tags:', error)
    return []
  }
}

/**
 * Get tag IDs for registration timing tags
 * Returns a map of tag names to their IDs
 */
export async function getRegistrationTimingTagIds(): Promise<Record<string, number | null>> {
  const allTags = await fetchAllClickFunnelsTags()
  
  const tagMap: Record<string, number | null> = {
    '24HRREMINDER': null,
    '2HRREMINDER': null,
    '1HRREMINDER': null,
    '15MINREMINDER': null,
    'WESTARTED': null,
  }

  for (const tag of allTags) {
    if (tag.name in tagMap) {
      tagMap[tag.name] = tag.id
    }
  }

  console.log('🏷️ Registration Timing Tag IDs:')
  Object.entries(tagMap).forEach(([name, id]) => {
    console.log(`   ${name}: ${id || '❌ NOT FOUND'}`)
  })

  return tagMap
}

const parseTagId = (value?: string | null): number | null => {
  if (!value) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const configuredWebinarTagName = process.env.CLICKFUNNELS_WEBINAR_TAG?.trim() || DEFAULT_WEBINAR_TAG_NAME
const configuredWebinarTagId = parseTagId(process.env.CLICKFUNNELS_WEBINAR_TAG_ID ?? process.env.CLICKFUNNELS_TAG_REGISTERED)

type AttendanceTagKey = 'registered' | 'attended' | 'mostlyAttended' | 'partlyAttended' | 'missed' | 'replayAttended'

const REMINDER_TAG_NAMES = ['24HRREMINDER', '2HRREMINDER', '1HRREMINDER', '15MINREMINDER', 'WESTARTED'] as const
type ReminderTagName = typeof REMINDER_TAG_NAMES[number]

const parseReminderTagEnvId = (tagName: ReminderTagName): number | null => {
  const envValue = process.env[`CLICKFUNNELS_TAG_${tagName}`]
  return parseTagId(envValue)
}

const ATTENDANCE_TAG_DEFAULT_NAMES: Record<AttendanceTagKey, string> = {
  registered: configuredWebinarTagName,
  attended: 'UM-Webinar-Attended',
  mostlyAttended: 'UM-Webinar-MostlyAttended',
  partlyAttended: 'UM-Webinar-PartlyAttended',
  missed: 'UM-Webinar-Missed',
  replayAttended: 'UM-Webinar-ReplayAttended',
}

const clickFunnelsTagCache = new Map<string, number>()

if (configuredWebinarTagId && !Number.isNaN(configuredWebinarTagId)) {
  clickFunnelsTagCache.set(configuredWebinarTagName, configuredWebinarTagId)
}

for (const reminderTagName of REMINDER_TAG_NAMES) {
  const parsedId = parseReminderTagEnvId(reminderTagName)
  if (parsedId) {
    clickFunnelsTagCache.set(reminderTagName, parsedId)
  }
}

export interface WebinarCustomTags {
  registrationTag?: string | null
  attendedTag?: string | null
  mostlyAttendedTag?: string | null
  partlyAttendedTag?: string | null
  missedTag?: string | null
  replayAttendedTag?: string | null
}

function getAttendanceTagName(tagKey: AttendanceTagKey, customTags?: WebinarCustomTags): string | null {
  if (customTags) {
    if (tagKey === 'registered' && customTags.registrationTag) return customTags.registrationTag
    if (tagKey === 'attended' && customTags.attendedTag) return customTags.attendedTag
    if (tagKey === 'mostlyAttended' && customTags.mostlyAttendedTag) return customTags.mostlyAttendedTag
    if (tagKey === 'partlyAttended' && customTags.partlyAttendedTag) return customTags.partlyAttendedTag
    if (tagKey === 'missed' && customTags.missedTag) return customTags.missedTag
    if (tagKey === 'replayAttended' && customTags.replayAttendedTag) return customTags.replayAttendedTag
  }
  return ATTENDANCE_TAG_DEFAULT_NAMES[tagKey] || null
}

async function resolveAttendanceTagId(tagKey: AttendanceTagKey, customTags?: WebinarCustomTags): Promise<number | null> {
  const tagName = getAttendanceTagName(tagKey, customTags)
  if (!tagName) {
    return null
  }

  return await getOrCreateClickFunnelsTagId(tagName)
}

async function resolveAttendanceTagIds(tagKeys: AttendanceTagKey[], customTags?: WebinarCustomTags): Promise<number[]> {
  const uniqueKeys = Array.from(new Set(tagKeys))
  const resolvedIds: number[] = []

  for (const key of uniqueKeys) {
    const tagName = getAttendanceTagName(key, customTags)
    if (!tagName) {
      continue
    }

    const tagId = await getOrCreateClickFunnelsTagId(tagName)
    if (typeof tagId === 'number') {
      resolvedIds.push(tagId)
    }
  }

  return resolvedIds
}

async function findContactByEmailWithRetry(
  email: string,
  apiKey: string,
  workspaceId: string,
  attempts: number = 3,
  baseDelayMs: number = 750
): Promise<any | null> {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const searchUrl = `${CLICKFUNNELS_API_BASE}/workspaces/${workspaceId}/contacts?filter[email_address]=${encodeURIComponent(email)}`

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      console.error('❌ Failed to find contact:', response.status)
      return null
    }

    const result = await response.json()
    const contact = result.data?.[0] || result[0]

    if (contact) {
      return contact
    }

    if (attempt < attempts) {
      const delay = baseDelayMs * attempt
      console.log(`⌛ Contact not found yet for ${email} - retrying in ${delay}ms (attempt ${attempt + 1}/${attempts})`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  return null
}

export async function getOrCreateClickFunnelsTagId(tagName: string): Promise<number | null> {
  const cachedId = clickFunnelsTagCache.get(tagName)
  if (cachedId) {
    console.log(`⚡ Using cached ID for tag "${tagName}": ${cachedId}`)
    return cachedId
  }

  console.log(`🔍 Resolving tag ID from API for: "${tagName}"`)
  const apiKey = process.env.CLICKFUNNELS_API_KEY
  const workspaceId = process.env.CLICKFUNNELS_WORKSPACE_ID

  if (!apiKey || !workspaceId) {
    console.log('⚠️ ClickFunnels API not configured - cannot resolve tag ID')
    return null
  }

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }

  const searchUrl = `${CLICKFUNNELS_API_BASE}/workspaces/${workspaceId}/contacts/tags?filter[name]=${encodeURIComponent(tagName)}`
  console.log(`🔍 Searching for tag: ${searchUrl}`)

  const findExistingTag = async (): Promise<number | null> => {
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Failed to search ClickFunnels tags:', response.status, errorText)
      return null
    }

    const searchResult = await response.json()
    console.log(`📋 Tag search results for "${tagName}":`, JSON.stringify(searchResult, null, 2))
    
    const tags = Array.isArray(searchResult)
      ? searchResult
      : Array.isArray(searchResult?.data)
        ? searchResult.data
        : []

    const existingTag = tags[0]
    console.log(`🏷️ Found existing tag:`, existingTag)

    if (existingTag?.id) {
      const tagId = Number(existingTag.id)
      if (!Number.isNaN(tagId)) {
        console.log(`✅ Caching tag "${tagName}" with ID: ${tagId}`)
        clickFunnelsTagCache.set(tagName, tagId)
        return tagId
      }
    }

    return null
  }

  try {
    const existingTagId = await findExistingTag()
    if (existingTagId) {
      return existingTagId
    }

    console.log(`ℹ️ ClickFunnels tag "${tagName}" not found - attempting to create it`)

    const createResponse = await fetch(`${CLICKFUNNELS_API_BASE}/workspaces/${workspaceId}/contacts/tags`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contacts_tag: {
          name: tagName,
          color: '#EEEEEE'
        }
      })
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error('❌ Failed to create ClickFunnels tag:', createResponse.status, errorText)

      if (createResponse.status === 422) {
        const fallbackId = await findExistingTag()
        if (fallbackId) {
          return fallbackId
        }
      }

      return null
    }

    const createdTag = await createResponse.json()
    const newTagId = Number(createdTag?.id)

    if (Number.isNaN(newTagId)) {
      console.error('❌ Created ClickFunnels tag but response did not include a numeric ID', createdTag)
      return null
    }

    clickFunnelsTagCache.set(tagName, newTagId)
    return newTagId
  } catch (error) {
    console.error('❌ Failed to resolve ClickFunnels tag:', error)
    return null
  }
}

/**
 * Send contact to ClickFunnels and tag them
 */
export async function sendContactToClickFunnels(
  contactData: ClickFunnelsContact,
  existingContactId?: number
): Promise<ClickFunnelsContactResponse | null> {
  const apiKey = process.env.CLICKFUNNELS_API_KEY
  const workspaceId = process.env.CLICKFUNNELS_WORKSPACE_ID

  // If ClickFunnels is not configured, skip silently
  if (!apiKey || !workspaceId) {
    console.log('⚠️ ClickFunnels API not configured - skipping contact sync')
    return null
  }

  // Normalize email to lowercase
  const normalizedContactData = {
    ...contactData,
    email_address: contactData.email_address.trim().toLowerCase()
  }

  try {
    if (existingContactId) {
      console.log(`🔄 Known Contact ID ${existingContactId} provided - Direct Update Mode`)
      return await updateClickFunnelsContact(normalizedContactData, existingContactId)
    }

    console.log('📤 Sending contact to ClickFunnels:', normalizedContactData.email_address)
    console.log('   Workspace ID:', workspaceId)
    console.log('   API Key:', apiKey?.substring(0, 10) + '...')

    // ClickFunnels 2.0 API endpoint
    const url = `${CLICKFUNNELS_API_BASE}/workspaces/${workspaceId}/contacts`
    console.log('   API URL:', url)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        contact: normalizedContactData
      })
    })

    console.log('   Response Status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ ClickFunnels API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })

      const isDuplicate =
        response.status === 409 ||
        (response.status === 422 && /Duplicate entry/i.test(errorText || ''))

      if (isDuplicate) {
        return await updateClickFunnelsContact(normalizedContactData)
      }

      return null
    }

    const result = await response.json()
    console.log('✅ ClickFunnels API Response:', JSON.stringify(result, null, 2))
    
    // ClickFunnels 2.0 API returns contacts in the root of response (not wrapped)
    // The response IS the contact object itself
    const contact = result
    console.log('✅ Contact sent to ClickFunnels - ID:', contact?.id || 'ID not in response')

    // Apply tags with a separate API call if tag_ids were provided
    if (normalizedContactData.tag_ids && normalizedContactData.tag_ids.length > 0 && contact.id) {
      console.log('🏷️ Applying tags to contact...')
      await applyTagsToContact(contact.id, normalizedContactData.tag_ids)
    }

    return contact
  } catch (error) {
    console.error('❌ Failed to send contact to ClickFunnels:', error)
    if (error instanceof Error) {
      console.error('   Error Message:', error.message)
      console.error('   Error Stack:', error.stack)
    }
    return null
  }
}

/**
 * Apply tags to a contact using a separate API call
 * ClickFunnels requires tags to be applied after contact creation
 */
async function applyTagsToContact(
  contactId: number,
  tagIds: number[]
): Promise<boolean> {
  const apiKey = process.env.CLICKFUNNELS_API_KEY

  if (!apiKey) {
    return false
  }

  try {
    for (const tagId of tagIds) {
      console.log(`   Applying tag ${tagId} to contact ${contactId}...`)

      const url = `${CLICKFUNNELS_API_BASE}/contacts/${contactId}/applied_tags`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          contacts_applied_tag: {
            tag_id: tagId
          }
        })
      })

      if (response.ok) {
        console.log(`   ✅ Tag ${tagId} applied successfully!`)
        continue
      }

      const errorText = await response.text()

      if (response.status === 422 && errorText.includes('already been taken')) {
        console.log(`   ℹ️ Tag ${tagId} already applied to contact ${contactId}`)
        continue
      }

      console.error(`   ❌ Failed to apply tag ${tagId}:`, response.status, errorText)
      return false
    }

    return true
  } catch (error) {
    console.error('❌ Failed to apply tags:', error)
    return false
  }
}

/**
 * Update existing contact in ClickFunnels
 */
async function updateClickFunnelsContact(
  contactData: ClickFunnelsContact,
  knownContactId?: number
): Promise<ClickFunnelsContactResponse | null> {
  const apiKey = process.env.CLICKFUNNELS_API_KEY
  const workspaceId = process.env.CLICKFUNNELS_WORKSPACE_ID

  if (!apiKey || !workspaceId) {
    return null
  }

  const normalizedEmail = contactData.email_address.trim().toLowerCase()

  try {
    console.log('🔄 Updating existing contact in ClickFunnels:', normalizedEmail)
    let contactId = knownContactId

    if (!contactId) {
      // First, find the contact by email (with retry to allow CF sync)
      const existingContact = await findContactByEmailWithRetry(
        normalizedEmail,
        apiKey,
        workspaceId
      )

      if (!existingContact) {
        console.log('⚠️ Contact not found in ClickFunnels')
        return null
      }
      contactId = existingContact.id
    }

    const { tag_ids, ...contactFields } = contactData
    const contactPayload: Record<string, any> = { ...contactFields }

    // ClickFunnels sometimes requires *_attributes when updating nested objects
    if (contactFields.custom_attributes) {
      contactPayload.custom_attributes = contactFields.custom_attributes
      contactPayload.custom_attributes_attributes = contactFields.custom_attributes
    }

    const updateResponse = await fetch(`${CLICKFUNNELS_API_BASE}/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        contact: contactPayload
      })
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error('❌ Failed to update contact:', updateResponse.status, errorText)
      return null
    }

    const result = await updateResponse.json()
    console.log('✅ Contact updated in ClickFunnels - ID:', result?.id || 'Unknown')

    if (tag_ids && tag_ids.length > 0 && contactId) {
      await applyTagsToContact(contactId, tag_ids)
    }

    return result
  } catch (error) {
    console.error('❌ Failed to update contact in ClickFunnels:', error)
    return null
  }
}

/**
 * Tag a contact in ClickFunnels
 */
export async function tagClickFunnelsContact(
  email: string,
  tags: (string | number)[]
): Promise<boolean> {
  const apiKey = process.env.CLICKFUNNELS_API_KEY
  const workspaceId = process.env.CLICKFUNNELS_WORKSPACE_ID
  const normalizedEmail = email.trim().toLowerCase()

  if (!apiKey || !workspaceId) {
    console.log('⚠️ ClickFunnels API not configured - skipping tagging')
    return false
  }

  try {
    console.log('🏷️ Tagging contact in ClickFunnels:', normalizedEmail, tags)
    // console.log('🔍 Stack trace for debugging:', new Error().stack)

    let contact = await findContactByEmailWithRetry(normalizedEmail, apiKey, workspaceId)
    
    if (!contact) {
      console.log('⚠️ Contact not found for tagging - Creating new contact...')
      // Create the contact with just the email
      const newContactRes = await sendContactToClickFunnels({
        email_address: normalizedEmail
      });
      
      if (newContactRes && newContactRes.id) {
          contact = newContactRes;
          console.log('✅ Created new contact ID:', contact.id);
      } else {
          console.error('❌ Failed to create contact for tagging');
          return false;
      }
    }

    const tagIds: number[] = []

    for (const tag of tags) {
      if (typeof tag === 'number') {
        // Assume valid ID if number is passed directly
        console.log(`📌 Using direct tag ID: ${tag}`)
        tagIds.push(tag)
        continue
      }

      // Handle string tags (names)
      const tagName = String(tag)
      const tagId = await getOrCreateClickFunnelsTagId(tagName)
      if (tagId) {
        console.log(`📌 Resolved tag "${tagName}" to ID: ${tagId}`)
        tagIds.push(tagId)
      }
    }

    if (tagIds.length === 0) {
      console.log('⚠️ No valid ClickFunnels tag IDs resolved - skipping tagging')
      return false
    }

    await applyTagsToContact(contact.id, tagIds)

    console.log('✅ Contact tagged successfully:', tagIds)
    return true
  } catch (error) {
    console.error('❌ Failed to tag contact:', error)
    return false
  }
}

/**
 * Send webinar registration to ClickFunnels
 * Creates/updates contact and tags them with UM-Webinar-Registered
 */
export async function syncWebinarRegistrationToClickFunnels(data: {
  name: string
  email: string
  phone?: string | null
  timezone?: string | null
  country?: string | null
  webinarId: string
  webinarTitle: string
  scheduledStartTime?: Date | null
  countdownLink?: string | null
  referralLink?: string | null
  formattedWebinarTime?: string | null
  formattedWebinarTimeLocal?: string | null
  attendeeTimezoneLabel?: string | null
  zoomLink?: string | null // Zoom meeting link for live sessions
  isZoomSession?: boolean  // Whether this is a Zoom session
  customTags?: WebinarCustomTags
  existingContactId?: number // Optimization: pass contact ID if known to skip lookup
}): Promise<{ success: boolean; contactId?: number }> {
  try {
    const registeredTagId = await resolveAttendanceTagId('registered', data.customTags)

    // Split name into first and last
    const nameParts = data.name.trim().split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || ''

    // Prepare contact data
    const contactData: ClickFunnelsContact = {
      email_address: data.email.toLowerCase(),
      first_name: firstName,
      last_name: lastName,
      phone_number: data.phone || undefined,
      time_zone: data.timezone || undefined,
      country: data.country || undefined,
      tag_ids: registeredTagId ? [registeredTagId] : undefined,
      custom_attributes: {}
    }

    const customAttributes: Record<string, any> = {
      webinar_id: data.webinarId,
      webinar_title: data.webinarTitle,
      registered_at: new Date().toISOString(),
      scheduled_start_time: data.scheduledStartTime?.toISOString() || null,
      webinar_time_est: data.formattedWebinarTime || data.scheduledStartTime?.toISOString() || null,
    }

    // Use Zoom link if this is a Zoom session, otherwise use countdown link
    if (data.isZoomSession && data.zoomLink) {
      customAttributes['UM Webinar Link'] = data.zoomLink
      customAttributes.um_webinar_link = data.zoomLink
      customAttributes.is_zoom_session = true
      
      // Explicitly set Zoom Link as well
      customAttributes['Zoom Link'] = data.zoomLink
      customAttributes.zoom_link = data.zoomLink
    } else if (data.countdownLink) {
      customAttributes['UM Webinar Link'] = data.countdownLink
      customAttributes.um_webinar_link = data.countdownLink
      customAttributes.is_zoom_session = false
      
      // Still store Zoom link in its own field if provided (for events with bundled webinars)
      if (data.zoomLink) {
        customAttributes['Zoom Link'] = data.zoomLink
        customAttributes.zoom_link = data.zoomLink
      }
    }

    if (data.referralLink) {
      customAttributes['Personal Invite Link'] = data.referralLink
      customAttributes.personal_invite_link = data.referralLink
    }

    if (data.formattedWebinarTimeLocal) {
      customAttributes['Webinar Time'] = data.formattedWebinarTimeLocal
      customAttributes.webinar_time = data.formattedWebinarTimeLocal
    }

    if (data.attendeeTimezoneLabel) {
      customAttributes['Webinar Timezone'] = data.attendeeTimezoneLabel
      customAttributes.webinar_timezone = data.attendeeTimezoneLabel
    }

    contactData.custom_attributes = customAttributes

    console.log('📤 Sending to ClickFunnels with custom_attributes:', {
      email: contactData.email_address,
      custom_attributes: contactData.custom_attributes
    })

    // Send to ClickFunnels
    const result = await sendContactToClickFunnels(contactData, data.existingContactId)

    if (!result) {
      console.log('⚠️ Contact not synced to ClickFunnels (API not configured or error)')
      return { success: false }
    }

    console.log('✅ Webinar registration synced to ClickFunnels:', {
      contactId: result.id,
      email: result.email_address,
      tags: result.tags
    })

    return { success: true, contactId: result.id }
  } catch (error) {
    console.error('❌ Failed to sync registration to ClickFunnels:', error)
    return { success: false }
  }
}

/**
 * Determine which attendance tags to apply based on watch behavior
 * @param webinarDuration Total webinar duration in seconds
 * @param watchTime Total time watched in seconds
 * @param attended Whether user attended at all
 * @param isReplay Whether this was a replay view
 * @param reachedOfferCTA Whether user watched until offer/CTA (typically last 10-15 mins)
 * @returns Array of attendance tag keys to apply
 */
export function determineAttendanceTags(data: {
  webinarDuration: number
  watchTime: number
  attended: boolean
  isReplay?: boolean
  reachedOfferCTA?: boolean
}): AttendanceTagKey[] {
  const { webinarDuration, watchTime, attended, isReplay, reachedOfferCTA } = data
  const tags: AttendanceTagKey[] = []

  if (!attended || watchTime <= 0) {
    tags.push('missed')
    return tags
  }

  if (isReplay) {
    tags.push('replayAttended')
  }

  const watchMinutes = Math.floor(watchTime / 60)

  tags.push('attended')

  if (reachedOfferCTA) {
    tags.push('mostlyAttended')
  } else if (watchMinutes >= 40) {
    tags.push('partlyAttended')
  }

  return tags
}

/**
 * Apply reminder tag to a contact in ClickFunnels
 * Used for time-based reminder tags (24HRREMINDER, 2HRREMINDER, etc.)
 * Handles both tag names (strings) and tag IDs (numeric strings)
 */
export async function applyReminderTagToContact(
  email: string,
  tagNameOrId: string
): Promise<boolean> {
  try {
    console.log(`🏷️ Applying ClickFunnels reminder tag: ${tagNameOrId} to ${email}`)
    
    // Check if tagNameOrId is actually a numeric ID stored as a string
    const isNumericId = /^\d+$/.test(tagNameOrId)
    
    if (isNumericId) {
      console.log(`⚠️ Detected numeric tag ID "${tagNameOrId}" - this should be a tag name, not an ID`)
      console.log(`   Please update your reminder templates to use tag names instead of IDs`)
      // For now, we'll try to apply it directly as a tag ID
      const apiKey = process.env.CLICKFUNNELS_API_KEY
      const workspaceId = process.env.CLICKFUNNELS_WORKSPACE_ID
      
      if (!apiKey || !workspaceId) {
        console.log('⚠️ ClickFunnels API not configured')
        return false
      }
      
      const contact = await findContactByEmailWithRetry(email, apiKey, workspaceId)
      if (!contact) {
        console.log('⚠️ Contact not found for tagging')
        return false
      }
      
      // Apply the numeric tag ID directly
      const tagId = parseInt(tagNameOrId, 10)
      const success = await applyTagsToContact(contact.id, [tagId])
      
      if (success) {
        console.log(`✅ Reminder tag ID ${tagId} applied successfully`)
      } else {
        console.log(`⚠️ Failed to apply reminder tag ID ${tagId}`)
      }
      
      return success
    }
    
    // Normal flow: use tag name
    const success = await tagClickFunnelsContact(email, [tagNameOrId])
    
    if (success) {
      console.log(`✅ Reminder tag "${tagNameOrId}" applied successfully`)
    } else {
      console.log(`⚠️ Failed to apply reminder tag "${tagNameOrId}"`)
    }
    
    return success
  } catch (error) {
    console.error('❌ Error applying reminder tag:', error)
    return false
  }
}

/**
 * Apply registration timing tag based on when user registered
 * Tags are applied ONCE at registration time to trigger ClickFunnels automations
 * 
 * Logic:
 * - 24+ hours before → 24HRREMINDER
 * - 2-24 hours before → 2HRREMINDER
 * - 1-2 hours before → 1HRREMINDER
 * - 15min-1hr before → 15MINREMINDER
 * - <15 min before → WESTARTED
 */
export async function applyRegistrationTimingTag(
  email: string,
  webinarStartTime: Date
): Promise<{ success: boolean; tagApplied?: string }> {
  try {
    const now = new Date()
    const hoursUntilWebinar = (webinarStartTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    let tagToApply: string
    
    if (hoursUntilWebinar >= 24) {
      tagToApply = '24HRREMINDER'
    } else if (hoursUntilWebinar >= 2) {
      tagToApply = '2HRREMINDER'
    } else if (hoursUntilWebinar >= 1) {
      tagToApply = '1HRREMINDER'
    } else if (hoursUntilWebinar >= 0.25) { // 15 minutes
      tagToApply = '15MINREMINDER'
    } else {
      tagToApply = 'WESTARTED'
    }
    
    console.log(`⏰ User registered ${hoursUntilWebinar.toFixed(2)} hours before webinar`)
    console.log(`🏷️ Applying registration timing tag: ${tagToApply} to ${email}`)
    
    const success = await tagClickFunnelsContact(email, [tagToApply])
    
    if (success) {
      console.log(`✅ Registration timing tag "${tagToApply}" applied successfully`)
      return { success: true, tagApplied: tagToApply }
    } else {
      console.log(`⚠️ Failed to apply registration timing tag "${tagToApply}"`)
      return { success: false }
    }
  } catch (error) {
    console.error('❌ Error applying registration timing tag:', error)
    return { success: false }
  }
}

/**
 * Sync attendance data to ClickFunnels
 * Updates contact tags based on their attendance behavior
 */
export async function syncAttendanceToClickFunnels(data: {
  email: string
  webinarDuration: number
  watchTime: number
  attended: boolean
  isReplay?: boolean
  reachedOfferCTA?: boolean
  webinarTitle?: string
  leftAt?: Date
  customTags?: WebinarCustomTags
}): Promise<boolean> {
  const apiKey = process.env.CLICKFUNNELS_API_KEY
  const workspaceId = process.env.CLICKFUNNELS_WORKSPACE_ID

  if (!apiKey || !workspaceId) {
    console.log('⚠️ ClickFunnels API not configured - skipping attendance sync')
    return false
  }

  try {
    console.log('📊 Syncing attendance to ClickFunnels:', data.email)

    const contact = await findContactByEmailWithRetry(data.email, apiKey, workspaceId)

    if (!contact) {
      console.log('⚠️ Contact not found for attendance tagging:', data.email)
      return false
    }

    // Determine which tags to apply
    const tagsToApply = determineAttendanceTags({
      webinarDuration: data.webinarDuration,
      watchTime: data.watchTime,
      attended: data.attended,
      isReplay: data.isReplay,
      reachedOfferCTA: data.reachedOfferCTA,
    })

    if (tagsToApply.length === 0) {
      console.log('ℹ️ No attendance tags to apply')
      return true
    }

    const tagIds = await resolveAttendanceTagIds(tagsToApply, data.customTags)

    if (tagIds.length === 0) {
      console.log('⚠️ No valid tag IDs resolved for attendance tracking')
      return false
    }

    console.log('🏷️ Applying attendance tags:', tagIds)

    // Apply tags
    await applyTagsToContact(contact.id, tagIds)

    // Update custom attributes with attendance data
    const updateUrl = `${CLICKFUNNELS_API_BASE}/workspaces/${workspaceId}/contacts/${contact.id}`
    await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        contact: {
          custom_attributes: {
            last_attendance_date: new Date().toISOString(),
            watch_time_minutes: Math.floor(data.watchTime / 60),
            watch_percentage: Math.round((data.watchTime / data.webinarDuration) * 100),
            reached_offer: data.reachedOfferCTA || false,
            left_at: data.leftAt?.toISOString() || null,
          }
        }
      })
    })

    console.log('✅ Attendance synced to ClickFunnels')
    return true
  } catch (error) {
    console.error('❌ Failed to sync attendance to ClickFunnels:', error)
    return false
  }
}

/**
 * Schedule a delayed ClickFunnels tag application
 */
export async function scheduleDelayedClickFunnelsTag(data: {
  registrationId: string
  tagName: string
  scheduledFor: Date
}): Promise<boolean> {
  try {
    console.log(`⏰ Scheduling delayed tag "${data.tagName}" for ${data.scheduledFor.toISOString()}`)
    
    // Check if we already have this tag scheduled
    const existing = await prisma.clickFunnelsReminderTag.findUnique({
      where: {
        registrationId_tagName: {
          registrationId: data.registrationId,
          tagName: data.tagName
        }
      }
    });

    if (existing) {
       console.log(`ℹ️ Delayed tag "${data.tagName}" already scheduled (ID: ${existing.id})`);
       return true;
    }

    await prisma.clickFunnelsReminderTag.create({
      data: {
        registrationId: data.registrationId,
        tagName: data.tagName,
        scheduledFor: data.scheduledFor,
        status: 'PENDING'
      }
    })
    
    return true
  } catch (error) {
    // Handle unique constraint violation just in case race condition
    if ((error as any).code === 'P2002') {
      console.log(`ℹ️ Delayed tag "${data.tagName}" already scheduled for this registration`)
      return true
    }
    console.error('❌ Failed to schedule delayed tag:', error)
    return false
  }
}
