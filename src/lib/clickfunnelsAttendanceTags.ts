/**
 * ClickFunnels Attendance Tagging System
 * 
 * This module applies attendance tags to ClickFunnels contacts after their 
 * personal webinar session ends (for evergreen webinars).
 * 
 * Tags Applied:
 * - ATTENDED: Attended at all (even 1%)
 * - MOSTLY_ATTENDED: Watched past the configured threshold timestamp
 * - PARTLY_ATTENDED: Attended but didn't reach MOSTLY_ATTENDED threshold
 * - MISSED: Registered but never attended
 * 
 * Timing: Tags are applied AFTER the user's session ends (scheduledStartTime + webinar.duration)
 */

import { prisma } from './prisma'
import { tagClickFunnelsContact } from './clickfunnels'
import { tagMauticContact } from './mautic'

interface AttendanceTagOptions {
  registrationId: string
}

function getTagIdFromEnv(envKey: string): number | null {
  const value = process.env[envKey]
  if (!value) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

function normalizeAttendanceTagAlias(tagName: string): string {
  if (tagName === 'UM-Webinar-MostlyAttended') {
    return 'UM-WebinarMostlyAttended'
  }
  return tagName
}

/**
 * Determine which attendance tag to apply based on watch position and threshold
 */
async function getAttendanceTag(
  registrationId: string
): Promise<{ tagName: string; tagId?: number | null; tagKey: string; reason: string; crmIntegration?: string }> {
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: {
      attended: true,
      lastWatchedPosition: true,
      replayWatchTime: true,
      webinar: {
        select: {
          mostlyAttendedThreshold: true,
          videoDuration: true,
          crmIntegration: true,
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
          replayAttendedTag: true,
          replayAttendedTagId: true,
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
    return { tagName: '', tagKey: 'NONE', reason: 'Registration not found' }
  }

  const w = registration.webinar
  const crmIntegration = w.crmIntegration || 'CLICKFUNNELS'
  
  console.log(`🔍 getAttendanceTag - Webinar tag config for registration:`, {
    attended: registration.attended,
    crmIntegration,
    watchTime: {
      lastWatchedPosition: registration.lastWatchedPosition,
      replayWatchTime: registration.replayWatchTime,
    },
    webinarTags: {
      attendedTag: w.attendedTag,
      attendedTagId: w.attendedTagId,
      mostlyAttendedTag: w.mostlyAttendedTag,
      mostlyAttendedTagId: w.mostlyAttendedTagId,
      partlyAttendedTag: w.partlyAttendedTag,
      partlyAttendedTagId: w.partlyAttendedTagId,
      missedTag: w.missedTag,
      missedTagId: w.missedTagId,
    },
    threshold: w.mostlyAttendedThreshold
  })

  // Helper to get tagId - only use env fallback if NO custom tag name is set
  // This prevents applying wrong global tag when per-webinar tag name is configured
  const getTagId = (customTagName: string | null | undefined, customTagId: number | null | undefined, envKey: string): number | null => {
    // If webinar has a custom tag ID, use it
    if (customTagId) return customTagId
    // Resolve attendance tags by name to avoid stale global env IDs applying the wrong tag.
    return null
  }

  // If never attended, tag as MISSED
  if (!registration.attended) {
    return {
      tagName: normalizeAttendanceTagAlias(w.missedTag || 'UM-Webinar-Missed'),
      tagId: getTagId(w.missedTag, w.missedTagId, 'CLICKFUNNELS_TAG_MISSED'),
      tagKey: 'MISSED',
      reason: 'Never attended',
      crmIntegration
    }
  }

  // Calculate total watch time from sessions
  const sessionWatchTime = registration.sessions.reduce((sum: number, session: any) => {
    return sum + (session.watchDuration || session.totalWatchTime || 0)
  }, 0)

  // Also consider replay watch time (tracked separately on the registration)
  const replayWatchTime = registration.replayWatchTime || 0

  // Use the best available watch time: max of session tracking, replay tracking, or lastWatchedPosition
  const effectiveWatchTime = Math.max(
    sessionWatchTime,
    replayWatchTime,
    registration.lastWatchedPosition || 0
  )

  // Check if webinar has a MOSTLY_ATTENDED threshold configured
  const threshold = w.mostlyAttendedThreshold

  if (threshold && effectiveWatchTime >= threshold) {
    // Watched past the threshold - MOSTLY_ATTENDED
    return {
      tagName: normalizeAttendanceTagAlias(w.mostlyAttendedTag || 'UM-WebinarMostlyAttended'),
      tagId: getTagId(w.mostlyAttendedTag, w.mostlyAttendedTagId, 'CLICKFUNNELS_TAG_MOSTLY_ATTENDED'),
      tagKey: 'MOSTLY_ATTENDED',
      reason: `Watched ${effectiveWatchTime}s, past threshold ${threshold}s`,
      crmIntegration
    }
  } else if (threshold && effectiveWatchTime > 0) {
    // Attended but didn't reach threshold - PARTLY_ATTENDED
    return {
      tagName: normalizeAttendanceTagAlias(w.partlyAttendedTag || 'UM-Webinar-PartlyAttended'),
      tagId: getTagId(w.partlyAttendedTag, w.partlyAttendedTagId, 'CLICKFUNNELS_TAG_PARTLY_ATTENDED'),
      tagKey: 'PARTLY_ATTENDED',
      reason: `Watched ${effectiveWatchTime}s, before threshold ${threshold}s`,
      crmIntegration
    }
  } else {
    // No threshold configured, just mark as ATTENDED
    return {
      tagName: normalizeAttendanceTagAlias(w.attendedTag || 'UM-Webinar-Attended'),
      tagId: getTagId(w.attendedTag, w.attendedTagId, 'CLICKFUNNELS_TAG_ATTENDED'),
      tagKey: 'ATTENDED',
      reason: `Watched ${effectiveWatchTime}s, no threshold configured`,
      crmIntegration
    }
  }
}

/**
 * Apply attendance tag for a single registration after their session ends
 * Only applies if not already applied
 */
export async function applyAttendanceTagOnSessionEnd(
  options: AttendanceTagOptions
): Promise<{ success: boolean; tag?: string; reason?: string; error?: string }> {
  try {
    const { registrationId } = options

    // Get registration with email and check if already tagged
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      select: {
        id: true,
        email: true,
        name: true,
        webinarId: true,
        attendanceTagsApplied: true
      }
    })

    if (!registration) {
      return { success: false, error: 'Registration not found' }
    }

    // Skip if already tagged
    if (registration.attendanceTagsApplied) {
      return { 
        success: false, 
        error: 'Attendance tags already applied',
        reason: 'Already tagged'
      }
    }

    if (!registration.email) {
      return { success: false, error: 'No email address' }
    }

    console.log('🎟️ Attendance tagging candidate', {
      registrationId: registration.id,
      webinarId: registration.webinarId,
      email: registration.email,
      alreadyTagged: registration.attendanceTagsApplied,
    })

    // Get the appropriate tag
    const tagInfo = await getAttendanceTag(registrationId)
    
    console.log(`🔎 Tag info for ${registration.email}:`, JSON.stringify(tagInfo, null, 2))

    if (!tagInfo.tagName) {
      console.log(`⚠️ No tag name found for ${registration.email}, tagKey: ${tagInfo.tagKey}`)
      return { 
        success: false, 
        error: `No tag configured for ${tagInfo.tagKey}`,
        reason: tagInfo.reason
      }
    }

    // Check CRM integration setting
    const crmIntegration = tagInfo.crmIntegration || 'CLICKFUNNELS'
    
    if (crmIntegration === 'NONE') {
      console.log(`ℹ️ CRM integration disabled for webinar; skipping attendance tag for ${registration.email}`)
      return {
        success: true,
        tag: tagInfo.tagKey,
        reason: 'CRM integration disabled'
      }
    }

    // Apply tag based on CRM integration
    let success = false
    
    if (crmIntegration === 'MAUTIC') {
      console.log(`📋 Applying ${tagInfo.tagKey} tag to ${registration.email} in Mautic`, {
        registrationId,
        reason: tagInfo.reason,
        tagName: tagInfo.tagName,
      })
      
      success = await tagMauticContact(registration.email, [tagInfo.tagName])
      console.log(`📬 tagMauticContact result for ${registration.email}:`, success)
      
      if (!success) {
        return {
          success: false,
          error: 'Failed to apply tag in Mautic'
        }
      }
    } else {
      // ClickFunnels
      // If tagId is a number, use it; otherwise use the tag name for lookup
      const tagToApply = tagInfo.tagId || tagInfo.tagName
      
      console.log(`📋 Applying ${tagInfo.tagKey} tag to ${registration.email} in ClickFunnels`, {
        registrationId,
        reason: tagInfo.reason,
        tagName: tagInfo.tagName,
        tagId: tagInfo.tagId,
        tagToApply,
        tagToApplyType: typeof tagToApply,
        willLookupByName: !tagInfo.tagId
      })

      console.log(`🚀 Calling tagClickFunnelsContact for ${registration.email} with tag:`, tagToApply)
      
      success = await tagClickFunnelsContact(
        registration.email,
        [tagToApply]
      )
      
      console.log(`📬 tagClickFunnelsContact result for ${registration.email}:`, success)

      if (!success) {
        return {
          success: false,
          error: 'Failed to apply tag in ClickFunnels'
        }
      }
    }

    // Mark as tagged
    const taggedAt = new Date()

    await prisma.registration.update({
      where: { id: registrationId },
      data: {
        attendanceTagsApplied: true,
        attendanceTagsAppliedAt: taggedAt
      }
    })

    console.log('✅ Attendance tag pipeline complete', {
      registrationId,
      webinarId: registration.webinarId,
      email: registration.email,
      crmIntegration,
      tagKey: tagInfo.tagKey,
      tagName: tagInfo.tagName,
      tagId: tagInfo.tagId ?? null,
      reason: tagInfo.reason,
      attendanceTagsAppliedAt: taggedAt.toISOString(),
    })

    return {
      success: true,
      tag: tagInfo.tagKey,
      reason: tagInfo.reason
    }
  } catch (error) {
    console.error('❌ Failed to apply attendance tag:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Process attendance tagging for registrations whose sessions have ended
 * This should be called by a cron job every few minutes
 */
export async function processEndedSessionsForAttendanceTagging(): Promise<{
  success: boolean
  processed: number
  tagged: number
  errors: number
  results: Array<{
    registrationId: string
    email: string
    success: boolean
    tag?: string
    reason?: string
    error?: string
  }>
}> {
  try {
    console.log('📊 Processing ended sessions for attendance tagging')

    // Find registrations where:
    // 1. Session has ended (scheduledStartTime + webinar.duration < now)
    // 2. Attendance tags haven't been applied yet
    // 3. User registered (has scheduledStartTime)
    
    const now = new Date()
    
    const registrations = await prisma.registration.findMany({
      where: {
        attendanceTagsApplied: false,
        scheduledStartTime: {
          not: null
        }
      },
      select: {
        id: true,
        email: true,
        scheduledStartTime: true,
        webinar: {
          select: {
            duration: true // in minutes
          }
        }
      },
      take: 500 // Process 500 at a time
    })

    console.log(`📋 Found ${registrations.length} registrations to check`)

    const results = []
    let processed = 0
    let tagged = 0
    let errors = 0

    // Filter to only those whose session has ended
    for (const registration of registrations) {
      if (!registration.scheduledStartTime || !registration.webinar.duration) {
        continue
      }

      // Calculate session end time
      const sessionEndTime = new Date(
        registration.scheduledStartTime.getTime() + 
        (registration.webinar.duration * 60 * 1000) // Convert minutes to milliseconds
      )

      // Skip if session hasn't ended yet
      if (sessionEndTime > now) {
        continue
      }

      processed++

      // Apply attendance tags
      const result = await applyAttendanceTagOnSessionEnd({
        registrationId: registration.id
      })

      results.push({
        registrationId: registration.id,
        email: registration.email,
        ...result
      })

      if (result.success) {
        tagged++
      } else {
        errors++
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`✅ Completed attendance tagging for ended sessions`, {
      checked: registrations.length,
      processed,
      tagged,
      errors
    })

    return {
      success: true,
      processed,
      tagged,
      errors,
      results
    }
  } catch (error) {
    console.error('❌ Failed to process ended sessions:', error)
    throw error
  }
}

/**
 * Apply attendance tags to all registrations for a webinar (manual trigger)
 */
export async function applyAttendanceTagsForWebinar(
  webinarId: string
): Promise<{
  success: boolean
  tagged: number
  errors: number
  results: Array<{
    registrationId: string
    email: string
    success: boolean
    tag?: string
    reason?: string
    error?: string
  }>
}> {
  try {
    console.log(`📊 Starting attendance tagging for webinar ${webinarId}`)

    // Get all registrations
    const registrations = await prisma.registration.findMany({
      where: { webinarId },
      select: {
        id: true,
        email: true
      }
    })

    console.log(`📋 Found ${registrations.length} registrations to process`)

    const results = []
    let tagged = 0
    let errors = 0

    // Process each registration
    for (const registration of registrations) {
      const result = await applyAttendanceTagOnSessionEnd({
        registrationId: registration.id
      })

      results.push({
        registrationId: registration.id,
        email: registration.email,
        ...result
      })

      if (result.success) {
        tagged++
      } else {
        errors++
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`✅ Completed attendance tagging for webinar ${webinarId}`, {
      total: registrations.length,
      tagged,
      errors
    })

    return {
      success: true,
      tagged,
      errors,
      results
    }
  } catch (error) {
    console.error('❌ Failed to apply attendance tags for webinar:', error)
    throw error
  }
}

/**
 * Apply attendance tags to all completed webinars (manual bulk trigger)
 */
export async function applyAttendanceTagsForAllCompletedWebinars(): Promise<{
  success: boolean
  webinarsProcessed: number
  totalTagged: number
  totalErrors: number
}> {
  try {
    console.log('📊 Starting bulk attendance tagging for all completed webinars')

    // Get all completed or live webinars
    const webinars = await prisma.webinar.findMany({
      where: {
        status: {
          in: ['LIVE', 'ENDED']
        }
      },
      select: {
        id: true,
        title: true,
        status: true
      }
    })

    console.log(`📋 Found ${webinars.length} webinars to process`)

    let totalTagged = 0
    let totalErrors = 0

    for (const webinar of webinars) {
      console.log(`\n🎯 Processing webinar: ${webinar.title} (${webinar.status})`)
      
      const result = await applyAttendanceTagsForWebinar(webinar.id)
      
      totalTagged += result.tagged
      totalErrors += result.errors

      // Add delay between webinars
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log('\n✅ Completed bulk attendance tagging', {
      webinarsProcessed: webinars.length,
      totalTagged,
      totalErrors
    })

    return {
      success: true,
      webinarsProcessed: webinars.length,
      totalTagged,
      totalErrors
    }
  } catch (error) {
    console.error('❌ Failed bulk attendance tagging:', error)
    throw error
  }
}

/**
 * Process ended webinars that haven't had attendance tags applied yet
 * This is called automatically by the cron job
 */
export async function processEndedWebinarsForAttendanceTags(): Promise<{
  success: boolean
  webinarsProcessed: number
  totalTagged: number
  totalErrors: number
}> {
  try {
    console.log('📊 Checking for ended sessions that need attendance tagging...')

    // Find registrations that:
    // 1. Have a scheduled start time (evergreen model)
    // 2. Haven't had attendance tags applied yet
    // 3. Session has ended (scheduledStartTime + duration has passed)
    const registrations = await prisma.registration.findMany({
      where: {
        attendanceTagsApplied: false,
        scheduledStartTime: {
          not: null
        },
        webinar: {
          duration: {
            gt: 0
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        attended: true,
        lastWatchedPosition: true,
        scheduledStartTime: true,
        webinar: {
          select: {
            id: true,
            title: true,
            duration: true,
            mostlyAttendedThreshold: true
          }
        }
      },
      take: 500 // Process in batches
    })

    if (registrations.length === 0) {
      console.log('✅ No sessions need attendance tagging at this time')
      return {
        success: true,
        webinarsProcessed: 0,
        totalTagged: 0,
        totalErrors: 0
      }
    }

    // Filter to only registrations where session has ended
    const now = new Date()
    const endedSessions = registrations.filter((reg: any) => {
      if (!reg.scheduledStartTime || !reg.webinar.duration) return false
      const sessionEnd = new Date(reg.scheduledStartTime.getTime() + (reg.webinar.duration * 60 * 1000))
      return sessionEnd <= now
    })

    if (endedSessions.length === 0) {
      console.log('✅ No sessions have ended yet (all still in progress)')
      return {
        success: true,
        webinarsProcessed: 0,
        totalTagged: 0,
        totalErrors: 0
      }
    }

    console.log(`📋 Found ${endedSessions.length} ended sessions that need attendance tagging`)
    console.log('📦 Attendance tagging batch', endedSessions.map((registration: any) => ({
      registrationId: registration.id,
      webinarId: registration.webinar.id,
      webinarTitle: registration.webinar.title,
      email: registration.email,
      attended: registration.attended,
      scheduledStartTime: registration.scheduledStartTime?.toISOString?.() ?? registration.scheduledStartTime,
    })))

    let totalTagged = 0
    let totalErrors = 0
    const webinarsProcessed = new Set<string>()

    for (const registration of endedSessions) {
      console.log(`\n🎯 Processing: ${registration.name} (${registration.email}) - ${registration.webinar.title}`)
      
      try {
        const result = await applyAttendanceTagOnSessionEnd({
          registrationId: registration.id
        })

        if (result.success) {
          console.log(`   ✅ Applied ${result.tag || 'attendance tag'}: ${result.reason || 'No reason provided'}`)
          totalTagged++
          webinarsProcessed.add(registration.webinar.id)
        } else {
          console.log(`   ⚠️ Skipped ${registration.email}: ${result.error || result.reason || 'Unknown reason'}`)
          totalErrors++
        }
      } catch (error) {
        console.error(`   ❌ Failed to process registration ${registration.id}:`, error)
        totalErrors++
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log('\n✅ Completed automatic attendance tagging', {
      webinarsProcessed: webinarsProcessed.size,
      totalTagged,
      totalErrors
    })

    return {
      success: true,
      webinarsProcessed: webinarsProcessed.size,
      totalTagged,
      totalErrors
    }
  } catch (error) {
    console.error('❌ Failed automatic attendance tagging:', error)
    throw error
  }
}

/**
 * Re-apply attendance tags when user watches replay after being marked MISSED
 * This handles the case where someone misses the live webinar but watches the replay
 */
export async function reapplyAttendanceTagsAfterReplay(
  registrationId: string
): Promise<{ success: boolean; tags: (string | number)[]; error?: string }> {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        webinar: {
          select: {
            mostlyAttendedThreshold: true,
            videoDuration: true,
            title: true,
            attendedTag: true,
            attendedTagId: true,
            mostlyAttendedTag: true,
            mostlyAttendedTagId: true,
            partlyAttendedTag: true,
            partlyAttendedTagId: true,
            replayAttendedTag: true,
            replayAttendedTagId: true,
          }
        }
      }
    })

    if (!registration || !registration.email) {
      return { success: false, tags: [], error: 'Registration not found or no email' }
    }

    // Only process if they watched replay
    if (!registration.watchedReplay) {
      return { success: false, tags: [], error: 'No replay watched' }
    }

    console.log(`🎬 Re-tagging ${registration.email} after watching replay`)

    // Use replayWatchTime from registration
    const replayWatchTime = registration.replayWatchTime || 0
    const threshold = registration.webinar.mostlyAttendedThreshold

    const tagsToApply: (string|number)[] = []

    // Helper to get tagId - only use env fallback if NO custom tag name is set
    const getReplayTagId = (customTagName: string | null | undefined, customTagId: number | null | undefined, envKey: string): number | null => {
      if (customTagId) return customTagId
      return null
    }

    // If they were previously tagged as MISSED, we should remove that tag
    // Note: ClickFunnels doesn't have a remove tag API, but we can skip re-applying it
    
    // ATTENDED - Always tag replay viewers as attended
    const attendedTag = normalizeAttendanceTagAlias(registration.webinar.attendedTag || 'UM-Webinar-Attended')
    const attendedTagId = getReplayTagId(registration.webinar.attendedTag, registration.webinar.attendedTagId, 'CLICKFUNNELS_TAG_ATTENDED')
    
    await tagClickFunnelsContact(registration.email, [attendedTagId || attendedTag])
    tagsToApply.push(attendedTagId || attendedTag)
    console.log(`✅ Applied ATTENDED tag (${attendedTag}, ID: ${attendedTagId || 'N/A'}) to ${registration.email}`)

    // REPLAY_ATTENDED - Special tag for replay viewers
    const replayTag = normalizeAttendanceTagAlias(registration.webinar.replayAttendedTag || 'UM-Webinar-ReplayAttended')
    const replayTagId = getReplayTagId(registration.webinar.replayAttendedTag, registration.webinar.replayAttendedTagId, 'CLICKFUNNELS_TAG_REPLAY_ATTENDED')
    
    await tagClickFunnelsContact(registration.email, [replayTagId || replayTag])
    tagsToApply.push(replayTagId || replayTag)
    console.log(`✅ Applied REPLAY_ATTENDED tag (${replayTag}, ID: ${replayTagId || 'N/A'}) to ${registration.email}`)

    // MOSTLY_ATTENDED or PARTLY_ATTENDED based on watch time
    if (threshold && replayWatchTime >= threshold) {
      // Watched past the threshold
      const mostlyTag = normalizeAttendanceTagAlias(registration.webinar.mostlyAttendedTag || 'UM-WebinarMostlyAttended')
      const mostlyTagId = getReplayTagId(registration.webinar.mostlyAttendedTag, registration.webinar.mostlyAttendedTagId, 'CLICKFUNNELS_TAG_MOSTLY_ATTENDED')

      await tagClickFunnelsContact(registration.email, [mostlyTagId || mostlyTag])
      tagsToApply.push(mostlyTagId || mostlyTag)
      console.log(`✅ Applied MOSTLY_ATTENDED tag (${mostlyTag}, ID: ${mostlyTagId || 'N/A'}) to ${registration.email} (watched ${replayWatchTime}s, threshold ${threshold}s)`)
    } else if (replayWatchTime >= 2400) {
      // Watched at least 40 minutes but didn't reach threshold
      const partlyTag = normalizeAttendanceTagAlias(registration.webinar.partlyAttendedTag || 'UM-Webinar-PartlyAttended')
      const partlyTagId = getReplayTagId(registration.webinar.partlyAttendedTag, registration.webinar.partlyAttendedTagId, 'CLICKFUNNELS_TAG_PARTLY_ATTENDED')
      
      await tagClickFunnelsContact(registration.email, [partlyTagId || partlyTag])
      tagsToApply.push(partlyTagId || partlyTag)
      console.log(`✅ Applied PARTLY_ATTENDED tag (${partlyTag}, ID: ${partlyTagId || 'N/A'}) to ${registration.email} (watched ${replayWatchTime}s)`)
    }

    // Update database to mark tags as applied and set attended = true
    await prisma.registration.update({
      where: { id: registrationId },
      data: {
        attended: true, // Important: Mark as attended even though they missed live
        attendanceTagsApplied: true,
        attendanceTagsAppliedAt: new Date()
      }
    })

    console.log(`✅ Successfully re-tagged ${registration.email} with:`, tagsToApply)

    return { success: true, tags: tagsToApply }
  } catch (error) {
    console.error('❌ Error re-tagging after replay:', error)
    return { 
      success: false, 
      tags: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
