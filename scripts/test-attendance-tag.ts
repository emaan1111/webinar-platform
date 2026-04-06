/**
 * Test script to debug attendance tag application
 * Run with: npx tsx scripts/test-attendance-tag.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Copy the relevant functions here for testing
const CLICKFUNNELS_API_BASE = 'https://api.clickfunnels.com/api/v2'

function normalizeAttendanceTagAlias(tagName: string): string {
  if (tagName === 'UM-Webinar-MostlyAttended') {
    return 'UM-WebinarMostlyAttended'
  }
  return tagName
}

function getTagIdFromEnv(envKey: string): number | null {
  const value = process.env[envKey]
  if (!value) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
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

const clickFunnelsTagCache = new Map<string, number>()

async function getOrCreateClickFunnelsTagId(tagName: string): Promise<number | null> {
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
    console.log('   CLICKFUNNELS_API_KEY:', !!apiKey)
    console.log('   CLICKFUNNELS_WORKSPACE_ID:', !!workspaceId)
    return null
  }

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }

  const searchUrl = `${CLICKFUNNELS_API_BASE}/workspaces/${workspaceId}/contacts/tags?filter[name]=${encodeURIComponent(tagName)}`
  console.log(`🔍 Searching for tag: ${searchUrl}`)

  try {
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

    // Find exact match
    const exactMatch = tags.find((tag: any) => tag.name === tagName)
    const existingTag = exactMatch || tags[0]
    
    if (exactMatch) {
      console.log(`🏷️ Found exact match tag:`, existingTag)
    } else if (tags[0]) {
      console.log(`🏷️ No exact match, using first result:`, existingTag)
    }

    if (existingTag?.id) {
      const tagId = typeof existingTag.id === 'string' ? parseInt(existingTag.id, 10) : existingTag.id
      if (!Number.isNaN(tagId)) {
        console.log(`✅ Caching tag "${tagName}" with ID: ${tagId}`)
        clickFunnelsTagCache.set(tagName, tagId)
        return tagId
      }
    }

    console.log(`⚠️ Tag "${tagName}" not found in search results - attempting to create`)

    // Try to create the tag
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

    const createResponseText = await createResponse.text()
    console.log(`📝 Tag creation response (${createResponse.status}):`, createResponseText)

    if (!createResponse.ok) {
      console.error('❌ Failed to create ClickFunnels tag:', createResponse.status)
      return null
    }

    const createdTag = JSON.parse(createResponseText)
    const newTagId = typeof createdTag?.id === 'string' ? parseInt(createdTag.id, 10) : createdTag?.id

    if (!newTagId || Number.isNaN(newTagId)) {
      console.error('❌ Created tag but no valid ID returned', createdTag)
      return null
    }

    console.log(`✅ Created new tag "${tagName}" with ID: ${newTagId}`)
    clickFunnelsTagCache.set(tagName, newTagId)
    return newTagId

  } catch (error) {
    console.error('❌ Failed to resolve ClickFunnels tag:', error)
    return null
  }
}

async function applyTagsToContact(contactId: number, tagIds: number[]): Promise<boolean> {
  const apiKey = process.env.CLICKFUNNELS_API_KEY

  if (!apiKey) {
    console.error('❌ CLICKFUNNELS_API_KEY not set')
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

      console.error(`   ❌ Failed to apply tag ${tagId}:`, {
        status: response.status,
        error: errorText,
        contactId,
        url
      })
      return false
    }

    return true
  } catch (error) {
    console.error('❌ Failed to apply tags:', error)
    return false
  }
}

async function tagClickFunnelsContact(email: string, tags: (string | number)[]): Promise<boolean> {
  const apiKey = process.env.CLICKFUNNELS_API_KEY
  const workspaceId = process.env.CLICKFUNNELS_WORKSPACE_ID
  const normalizedEmail = email.trim().toLowerCase()

  if (!apiKey || !workspaceId) {
    console.log('⚠️ ClickFunnels API not configured')
    return false
  }

  try {
    console.log('🏷️ Tagging contact in ClickFunnels:', normalizedEmail, tags)

    let contact = await findContactByEmailWithRetry(normalizedEmail, apiKey, workspaceId)
    
    if (!contact) {
      console.log('⚠️ Contact not found for tagging')
      return false
    }

    const contactId = typeof contact.id === 'string' ? parseInt(contact.id, 10) : contact.id
    console.log('📇 Found contact ID:', contactId)

    const tagIds: number[] = []

    for (const tag of tags) {
      if (typeof tag === 'number') {
        console.log(`📌 Using direct tag ID: ${tag}`)
        tagIds.push(tag)
        continue
      }

      const tagName = String(tag)
      console.log(`🔍 Looking up tag by name: "${tagName}"`)
      const tagId = await getOrCreateClickFunnelsTagId(tagName)
      if (tagId) {
        console.log(`📌 Resolved tag "${tagName}" to ID: ${tagId}`)
        tagIds.push(tagId)
      } else {
        console.error(`❌ Failed to resolve tag "${tagName}"`)
      }
    }

    if (tagIds.length === 0) {
      console.log('⚠️ No valid tag IDs resolved')
      return false
    }

    console.log(`🏷️ Applying ${tagIds.length} tag(s) to contact ${contactId}:`, tagIds)
    const applied = await applyTagsToContact(contactId, tagIds)
    
    if (!applied) {
      console.error('❌ Failed to apply tags')
      return false
    }

    console.log('✅ Contact tagged successfully:', tagIds)
    return true
  } catch (error) {
    console.error('❌ Failed to tag contact:', error)
    return false
  }
}

async function testAttendanceTag(registrationId: string) {
  console.log('\n🧪 Testing attendance tag application\n')
  console.log('Registration ID:', registrationId)
  
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: {
      id: true,
      email: true,
      attended: true,
      lastWatchedPosition: true,
      replayWatchTime: true,
      attendanceTagsApplied: true,
      webinar: {
        select: {
          mostlyAttendedThreshold: true,
          videoDuration: true,
          registrationTag: true,
          registrationTagId: true,
          attendedTag: true,
          attendedTagId: true,
          mostlyAttendedTag: true,
          mostlyAttendedTagId: true,
          partlyAttendedTag: true,
          partlyAttendedTagId: true,
          missedTag: true,
          missedTagId: true,
        }
      },
      sessions: {
        select: {
          watchDuration: true,
          totalWatchTime: true
        }
      }
    }
  })

  if (!registration) {
    console.error('❌ Registration not found')
    return
  }

  console.log('\n📊 Registration data:')
  console.log('   Email:', registration.email)
  console.log('   Attended:', registration.attended)
  console.log('   Last watched position:', registration.lastWatchedPosition)
  console.log('   Replay watch time:', registration.replayWatchTime)
  console.log('   Tags already applied:', registration.attendanceTagsApplied)

  const w = registration.webinar
  console.log('\n📊 Webinar tag config:')
  console.log('   Threshold:', w.mostlyAttendedThreshold)
  console.log('   attendedTag:', w.attendedTag, '| ID:', w.attendedTagId)
  console.log('   mostlyAttendedTag:', w.mostlyAttendedTag, '| ID:', w.mostlyAttendedTagId)
  console.log('   partlyAttendedTag:', w.partlyAttendedTag, '| ID:', w.partlyAttendedTagId)
  console.log('   missedTag:', w.missedTag, '| ID:', w.missedTagId)

  // Calculate watch time
  const sessionWatchTime = registration.sessions.reduce((sum, s) => 
    sum + (s.watchDuration || s.totalWatchTime || 0), 0)
  const effectiveWatchTime = Math.max(
    sessionWatchTime,
    registration.replayWatchTime || 0,
    registration.lastWatchedPosition || 0
  )
  
  console.log('\n📊 Watch time calculation:')
  console.log('   Session watch time:', sessionWatchTime)
  console.log('   Replay watch time:', registration.replayWatchTime)
  console.log('   Last watched position:', registration.lastWatchedPosition)
  console.log('   Effective watch time:', effectiveWatchTime)

  // Determine which tag to apply
  let tagName: string
  let tagKey: string
  
  if (!registration.attended) {
    tagName = normalizeAttendanceTagAlias(w.missedTag || 'UM-Webinar-Missed')
    tagKey = 'MISSED'
  } else if (w.mostlyAttendedThreshold && effectiveWatchTime >= w.mostlyAttendedThreshold) {
    tagName = normalizeAttendanceTagAlias(w.mostlyAttendedTag || 'UM-WebinarMostlyAttended')
    tagKey = 'MOSTLY_ATTENDED'
  } else if (w.mostlyAttendedThreshold && effectiveWatchTime > 0) {
    tagName = normalizeAttendanceTagAlias(w.partlyAttendedTag || 'UM-Webinar-PartlyAttended')
    tagKey = 'PARTLY_ATTENDED'
  } else {
    tagName = normalizeAttendanceTagAlias(w.attendedTag || 'UM-Webinar-Attended')
    tagKey = 'ATTENDED'
  }

  console.log('\n📊 Tag decision:')
  console.log('   Tag key:', tagKey)
  console.log('   Tag name to apply:', tagName)
  
  console.log('\n🚀 Attempting to apply tag...\n')
  
  const success = await tagClickFunnelsContact(registration.email!, [tagName])
  
  console.log('\n' + (success ? '✅ SUCCESS' : '❌ FAILED'))
}

// Run test
const registrationId = process.argv[2] || 'cmnnhdmld076oqr0f5mpe4jdo'
testAttendanceTag(registrationId)
  .catch(console.error)
  .finally(() => prisma.$disconnect())
