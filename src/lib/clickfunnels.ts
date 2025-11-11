// ClickFunnels 2.0 API Integration
// Documentation: https://apidocs.myclickfunnels.com/

interface ClickFunnelsContact {
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  time_zone?: string
  country?: string
  tags?: string[]
  custom_fields?: Record<string, any>
}

interface ClickFunnelsContactResponse {
  id: string
  email: string
  first_name?: string
  last_name?: string
  tags?: string[]
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
    console.log('📤 Sending contact to ClickFunnels:', contactData.email)

    // ClickFunnels 2.0 API endpoint
    const url = `https://api.myclickfunnels.com/api/v2/workspaces/${workspaceId}/contacts`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        contact: contactData
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ ClickFunnels API error:', response.status, errorText)
      
      // If contact already exists (409), try to update it
      if (response.status === 409) {
        return await updateClickFunnelsContact(contactData)
      }
      
      return null
    }

    const result = await response.json()
    console.log('✅ Contact sent to ClickFunnels:', result.contact?.id)

    return result.contact
  } catch (error) {
    console.error('❌ Failed to send contact to ClickFunnels:', error)
    return null
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
    console.log('🔄 Updating existing contact in ClickFunnels:', contactData.email)

    // First, find the contact by email
    const searchUrl = `https://api.myclickfunnels.com/api/v2/workspaces/${workspaceId}/contacts?filter[email]=${encodeURIComponent(contactData.email)}`

    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      }
    })

    if (!searchResponse.ok) {
      console.error('❌ Failed to find contact:', searchResponse.status)
      return null
    }

    const searchResult = await searchResponse.json()
    const existingContact = searchResult.contacts?.[0]

    if (!existingContact) {
      console.log('⚠️ Contact not found in ClickFunnels')
      return null
    }

    // Update the contact
    const updateUrl = `https://api.myclickfunnels.com/api/v2/workspaces/${workspaceId}/contacts/${existingContact.id}`

    // Merge tags (don't overwrite existing tags)
    const updatedTags = Array.from(new Set([
      ...(existingContact.tags || []),
      ...(contactData.tags || [])
    ]))

    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        contact: {
          ...contactData,
          tags: updatedTags
        }
      })
    })

    if (!updateResponse.ok) {
      console.error('❌ Failed to update contact:', updateResponse.status)
      return null
    }

    const result = await updateResponse.json()
    console.log('✅ Contact updated in ClickFunnels:', result.contact?.id)

    return result.contact
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

    // Find contact by email
    const searchUrl = `https://api.myclickfunnels.com/api/v2/workspaces/${workspaceId}/contacts?filter[email]=${encodeURIComponent(email)}`

    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      }
    })

    if (!searchResponse.ok) {
      console.error('❌ Failed to find contact for tagging:', searchResponse.status)
      return false
    }

    const searchResult = await searchResponse.json()
    const contact = searchResult.contacts?.[0]

    if (!contact) {
      console.log('⚠️ Contact not found for tagging')
      return false
    }

    // Add tags to contact
    const updateUrl = `https://api.myclickfunnels.com/api/v2/workspaces/${workspaceId}/contacts/${contact.id}`

    // Merge with existing tags
    const updatedTags = Array.from(new Set([
      ...(contact.tags || []),
      ...tags
    ]))

    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        contact: {
          tags: updatedTags
        }
      })
    })

    if (!updateResponse.ok) {
      console.error('❌ Failed to tag contact:', updateResponse.status)
      return false
    }

    console.log('✅ Contact tagged successfully:', updatedTags)
    return true
  } catch (error) {
    console.error('❌ Failed to tag contact:', error)
    return false
  }
}

/**
 * Send webinar registration to ClickFunnels
 * Creates/updates contact and tags them with WEBINAR_REGISTERED
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
}): Promise<boolean> {
  try {
    // Split name into first and last
    const nameParts = data.name.trim().split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || ''

    // Prepare contact data
    const contactData: ClickFunnelsContact = {
      email: data.email.toLowerCase(),
      first_name: firstName,
      last_name: lastName,
      phone: data.phone || undefined,
      time_zone: data.timezone || undefined,
      country: data.country || undefined,
      tags: ['WEBINAR_REGISTERED'], // Primary tag
      custom_fields: {
        webinar_id: data.webinarId,
        webinar_title: data.webinarTitle,
        registered_at: new Date().toISOString(),
        scheduled_start_time: data.scheduledStartTime?.toISOString() || null,
      }
    }

    // Send to ClickFunnels
    const result = await sendContactToClickFunnels(contactData)

    if (!result) {
      console.log('⚠️ Contact not synced to ClickFunnels (API not configured or error)')
      return false
    }

    console.log('✅ Webinar registration synced to ClickFunnels:', {
      contactId: result.id,
      email: result.email,
      tags: result.tags
    })

    return true
  } catch (error) {
    console.error('❌ Failed to sync registration to ClickFunnels:', error)
    return false
  }
}
