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

interface AttendanceTagOptions {
  registrationId: string
}

/**
 * Determine which attendance tag to apply based on watch position and threshold
 */
async function getAttendanceTag(
  registrationId: string
): Promise<{ tagId: string | null; tagName: string; reason: string }> {
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: {
      webinar: {
        select: {
          mostlyAttendedThreshold: true,
          videoDuration: true
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
    return { tagId: null, tagName: 'NONE', reason: 'Registration not found' }
  }

  // If never attended, tag as MISSED
  if (!registration.attended) {
    return {
      tagId: process.env.CLICKFUNNELS_TAG_MISSED || null,
      tagName: 'MISSED',
      reason: 'Never attended'
    }
  }

  // Calculate total watch time
  const totalWatchTime = registration.sessions.reduce((sum: number, session: any) => {
    return sum + (session.watchDuration || session.totalWatchTime || 0)
  }, 0)

  const effectiveWatchTime = totalWatchTime > 0 
    ? totalWatchTime 
    : (registration.lastWatchedPosition || 0)

  // Check if webinar has a MOSTLY_ATTENDED threshold configured
  const threshold = registration.webinar.mostlyAttendedThreshold

  if (threshold && effectiveWatchTime >= threshold) {
    // Watched past the threshold - MOSTLY_ATTENDED
    return {
      tagId: process.env.CLICKFUNNELS_TAG_MOSTLY_ATTENDED || null,
      tagName: 'MOSTLY_ATTENDED',
      reason: `Watched ${effectiveWatchTime}s, past threshold ${threshold}s`
    }
  } else if (threshold && effectiveWatchTime > 0) {
    // Attended but didn't reach threshold - PARTLY_ATTENDED
    return {
      tagId: process.env.CLICKFUNNELS_TAG_PARTLY_ATTENDED || null,
      tagName: 'PARTLY_ATTENDED',
      reason: `Watched ${effectiveWatchTime}s, before threshold ${threshold}s`
    }
  } else {
    // No threshold configured, just mark as ATTENDED
    return {
      tagId: process.env.CLICKFUNNELS_TAG_ATTENDED || null,
      tagName: 'ATTENDED',
      reason: `Watched ${effectiveWatchTime}s, no threshold configured`
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

    // Get the appropriate tag
    const tagInfo = await getAttendanceTag(registrationId)

    if (!tagInfo.tagId) {
      return { 
        success: false, 
        error: `No tag configured for ${tagInfo.tagName}`,
        reason: tagInfo.reason
      }
    }

    // Apply tag in ClickFunnels
    console.log(`📋 Applying ${tagInfo.tagName} tag to ${registration.email}`, {
      registrationId,
      reason: tagInfo.reason,
      tagId: tagInfo.tagId
    })

    const success = await tagClickFunnelsContact(
      registration.email,
      [tagInfo.tagId]
    )

    if (!success) {
      return {
        success: false,
        error: 'Failed to apply tag in ClickFunnels'
      }
    }

    // Mark as tagged
    await prisma.registration.update({
      where: { id: registrationId },
      data: {
        attendanceTagsApplied: true,
        attendanceTagsAppliedAt: new Date()
      }
    })

    console.log(`✅ Successfully applied ${tagInfo.tagName} tag to ${registration.email}`)

    return {
      success: true,
      tag: tagInfo.tagName,
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
      take: 100 // Process 100 at a time
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
            not: null
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
        clickfunnelsContactId: true,
        webinar: {
          select: {
            id: true,
            title: true,
            duration: true,
            mostlyAttendedThreshold: true
          }
        }
      },
      take: 100 // Process in batches
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

    let totalTagged = 0
    let totalErrors = 0
    const webinarsProcessed = new Set<string>()

    for (const registration of endedSessions) {
      console.log(`\n🎯 Processing: ${registration.name} (${registration.email}) - ${registration.webinar.title}`)
      
      try {
        // Determine which tag to apply
        const tagResult = await getAttendanceTag(registration.id)
        
        console.log(`   📌 Tag: ${tagResult.tagName}, Reason: ${tagResult.reason}`)

        // Apply the tag if we have a contact ID and tag ID
        if (registration.clickfunnelsContactId && tagResult.tagId) {
          await tagClickFunnelsContact(registration.clickfunnelsContactId, [tagResult.tagId])
          console.log(`   ✅ Applied ${tagResult.tagName}`)
          totalTagged++
        } else if (!registration.clickfunnelsContactId) {
          console.log(`   ⚠️ No ClickFunnels contact ID`)
        }

        // Mark as processed
        await prisma.registration.update({
          where: { id: registration.id },
          data: {
            attendanceTagsApplied: true,
            attendanceTagsAppliedAt: new Date()
          }
        })

        webinarsProcessed.add(registration.webinar.id)
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
