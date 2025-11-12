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
    const url = `https://api.myclickfunnels.com/api/v2/workspaces/${workspaceId}/contacts`
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
  const workspaceId = process.env.CLICKFUNNELS_WORKSPACE_ID

  if (!apiKey || !workspaceId) {
    return false
  }

  try {
    // Apply each tag individually
    for (const tagId of tagIds) {
      console.log(`   Applying tag ${tagId} to contact ${contactId}...`)
      
      // Correct endpoint and format from working implementation
      const url = `https://api.myclickfunnels.com/api/v2/workspaces/${workspaceId}/contacts/${contactId}/applied_tags`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          applied_tag: {
            tag_id: tagId.toString()  // Must be wrapped in applied_tag and as string!
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`   ✅ Tag ${tagId} applied successfully!`)
      } else {
        const errorText = await response.text()
        console.error(`   ❌ Failed to apply tag ${tagId}:`, response.status, errorText)
      }
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

    // First, find the contact by email
    const searchUrl = `https://api.myclickfunnels.com/api/v2/workspaces/${workspaceId}/contacts?filter[email_address]=${encodeURIComponent(contactData.email_address)}`

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
    // ClickFunnels returns array of contacts in 'data' field
    const existingContact = searchResult.data?.[0] || searchResult[0]

    if (!existingContact) {
      console.log('⚠️ Contact not found in ClickFunnels')
      return null
    }

    // Update the contact
    const updateUrl = `https://api.myclickfunnels.com/api/v2/workspaces/${workspaceId}/contacts/${existingContact.id}`

    // Merge tag IDs (don't overwrite existing tags)
    const existingTagIds = (existingContact.tags || []).map((t: any) => t.id)
    const newTagIds = contactData.tag_ids || []
    const updatedTagIds = Array.from(new Set([...existingTagIds, ...newTagIds]))

    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        ...contactData,
        tag_ids: updatedTagIds
      })
    })

    if (!updateResponse.ok) {
      console.error('❌ Failed to update contact:', updateResponse.status)
      return null
    }

    const result = await updateResponse.json()
    console.log('✅ Contact updated in ClickFunnels - ID:', result?.id || 'Unknown')

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

    // Find contact by email
    const searchUrl = `https://api.myclickfunnels.com/api/v2/workspaces/${workspaceId}/contacts?filter[email_address]=${encodeURIComponent(email)}`

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
    // ClickFunnels returns array of contacts in 'data' field
    const contact = searchResult.data?.[0] || searchResult[0]

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
      email_address: data.email.toLowerCase(),
      first_name: firstName,
      last_name: lastName,
      phone_number: data.phone || undefined,
      time_zone: data.timezone || undefined,
      country: data.country || undefined,
      // Use existing tag ID for "UM-Webinar-Registered" (ID: 368586)
      tag_ids: [368586],  // UM-Webinar-Registered tag
      custom_attributes: {
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
      email: result.email_address,
      tags: result.tags
    })

    return true
  } catch (error) {
    console.error('❌ Failed to sync registration to ClickFunnels:', error)
    return false
  }
}
