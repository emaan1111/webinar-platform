// ClickFunnels 2.0 API Integration
// Documentation: https://apidocs.myclickfunnels.com/

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
  webinar_time?: string  // Scheduled time in user's timezone
  webinar_time_est?: string  // Scheduled time in US/Eastern
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

const parseTagId = (value?: string | null): number | null => {
  if (!value) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const configuredWebinarTagName = process.env.CLICKFUNNELS_WEBINAR_TAG?.trim() || DEFAULT_WEBINAR_TAG_NAME
const configuredWebinarTagId = parseTagId(process.env.CLICKFUNNELS_WEBINAR_TAG_ID ?? process.env.CLICKFUNNELS_TAG_REGISTERED)

type AttendanceTagKey = 'registered' | 'attended' | 'mostlyAttended' | 'partlyAttended' | 'missed' | 'replayAttended'

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

function getAttendanceTagName(tagKey: AttendanceTagKey): string | null {
  return ATTENDANCE_TAG_DEFAULT_NAMES[tagKey] || null
}

async function resolveAttendanceTagId(tagKey: AttendanceTagKey): Promise<number | null> {
  const tagName = getAttendanceTagName(tagKey)
  if (!tagName) {
    return null
  }

  return await getOrCreateClickFunnelsTagId(tagName)
}

async function resolveAttendanceTagIds(tagKeys: AttendanceTagKey[]): Promise<number[]> {
  const uniqueKeys = Array.from(new Set(tagKeys))
  const resolvedIds: number[] = []

  for (const key of uniqueKeys) {
    const tagName = getAttendanceTagName(key)
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

async function getOrCreateClickFunnelsTagId(tagName: string): Promise<number | null> {
  const cachedId = clickFunnelsTagCache.get(tagName)
  if (cachedId) {
    return cachedId
  }

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
    const tags = Array.isArray(searchResult)
      ? searchResult
      : Array.isArray(searchResult?.data)
        ? searchResult.data
        : []

    const existingTag = tags[0]

    if (existingTag?.id) {
      const tagId = Number(existingTag.id)
      if (!Number.isNaN(tagId)) {
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
  contactData: ClickFunnelsContact
): Promise<ClickFunnelsContactResponse | null> {
  const apiKey = process.env.CLICKFUNNELS_API_KEY
  const workspaceId = process.env.CLICKFUNNELS_WORKSPACE_ID

  // If ClickFunnels is not configured, skip silently
  if (!apiKey || !workspaceId) {
    console.log('⚠️ ClickFunnels API not configured - skipping contact sync')
    return null
  }

  try {
    console.log('📤 Sending contact to ClickFunnels:', contactData.email_address)
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
        contact: contactData  // Wrap in contact object like the working implementation
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
      
      // If contact already exists (409), try to update it
      if (response.status === 409) {
        return await updateClickFunnelsContact(contactData)
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
    if (contactData.tag_ids && contactData.tag_ids.length > 0 && contact.id) {
      console.log('🏷️ Applying tags to contact...')
      await applyTagsToContact(contact.id, contactData.tag_ids)
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
  contactData: ClickFunnelsContact
): Promise<ClickFunnelsContactResponse | null> {
  const apiKey = process.env.CLICKFUNNELS_API_KEY
  const workspaceId = process.env.CLICKFUNNELS_WORKSPACE_ID

  if (!apiKey || !workspaceId) {
    return null
  }

  try {
    console.log('🔄 Updating existing contact in ClickFunnels:', contactData.email_address)

    // First, find the contact by email (with retry to allow CF sync)
    const existingContact = await findContactByEmailWithRetry(
      contactData.email_address,
      apiKey,
      workspaceId
    )

    if (!existingContact) {
      console.log('⚠️ Contact not found in ClickFunnels')
      return null
    }

    const { tag_ids, ...contactFields } = contactData

    const updateResponse = await fetch(`${CLICKFUNNELS_API_BASE}/contacts/${existingContact.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        contact: contactFields
      })
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error('❌ Failed to update contact:', updateResponse.status, errorText)
      return null
    }

    const result = await updateResponse.json()
    console.log('✅ Contact updated in ClickFunnels - ID:', result?.id || 'Unknown')

    if (tag_ids && tag_ids.length > 0) {
      const existingTagIds = (existingContact.tags || []).map((t: any) => t.id)
      const missingTagIds = tag_ids.filter(id => !existingTagIds.includes(id))

      if (missingTagIds.length > 0) {
        await applyTagsToContact(existingContact.id, missingTagIds)
      }
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
  tags: string[]
): Promise<boolean> {
  const apiKey = process.env.CLICKFUNNELS_API_KEY
  const workspaceId = process.env.CLICKFUNNELS_WORKSPACE_ID

  if (!apiKey || !workspaceId) {
    console.log('⚠️ ClickFunnels API not configured - skipping tagging')
    return false
  }

  try {
    console.log('🏷️ Tagging contact in ClickFunnels:', email, tags)

    const contact = await findContactByEmailWithRetry(email, apiKey, workspaceId)

    if (!contact) {
      console.log('⚠️ Contact not found for tagging')
      return false
    }

    const tagIds: number[] = []

    for (const tagName of tags) {
      const tagId = await getOrCreateClickFunnelsTagId(tagName)
      if (tagId) {
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
  webinarTimeUserTZ?: string | null
  webinarTimeEST?: string | null
}): Promise<boolean> {
  try {
    const registeredTagId = await resolveAttendanceTagId('registered')

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
      // Send new fields as regular fields (not nested in custom_attributes)
      ...(data.countdownLink && { um_webinar_link: data.countdownLink }),
      ...(data.referralLink && { personal_invite_link: data.referralLink }),
      ...(data.webinarTimeUserTZ && { webinar_time: data.webinarTimeUserTZ }),
      ...(data.webinarTimeEST && { webinar_time_est: data.webinarTimeEST }),
      custom_attributes: {
        webinar_id: data.webinarId,
        webinar_title: data.webinarTitle,
        registered_at: new Date().toISOString(),
        scheduled_start_time: data.scheduledStartTime?.toISOString() || null,
      }
    }

    console.log('📤 Sending to ClickFunnels:', {
      email: contactData.email_address,
      um_webinar_link: data.countdownLink,
      personal_invite_link: data.referralLink,
      webinar_time: data.webinarTimeUserTZ,
      webinar_time_est: data.webinarTimeEST,
    })

    // Log what we're sending to ClickFunnels
    console.log('📤 ClickFunnels Sync - Custom Fields:', {
      um_webinar_link: data.countdownLink,
      personal_invite_link: data.referralLink,
      webinar_time: data.webinarTimeUserTZ,
      webinar_time_est: data.webinarTimeEST
    })

    // Send to ClickFunnels
    const result = await sendContactToClickFunnels(contactData)

    if (!result) {
      console.log('⚠️ Contact not synced to ClickFunnels (API not configured or error)')
      return false
    }

    console.log('✅ Webinar registration synced to ClickFunnels:', {
      contactId: result.id,
      email: result.email_address,
      tags: result.tags
    })

    return true
  } catch (error) {
    console.error('❌ Failed to sync registration to ClickFunnels:', error)
    return false
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

    const tagIds = await resolveAttendanceTagIds(tagsToApply)

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
