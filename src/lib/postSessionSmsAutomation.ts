/**
 * Automated Post-Session SMS System
 * 
 * Automatically sends SMS after each user's webinar session ends based on:
 * - Session end time (scheduledStartTime + duration + minutesAfter)
 * - Watch criteria (minimum minutes or percentage watched)
 * - Phone number availability
 * 
 * Similar to attendance tagging but sends SMS instead of applying tags.
 */

import { prisma } from './prisma'
import { sendClickSendSMS } from './clicksend'

/**
 * Process ended sessions and send post-session SMS
 * Called by cron job every 15 minutes
 */
export async function processEndedSessionsForPostSMS(): Promise<{
  checked: number
  sent: number
  failed: number
  errors: string[]
}> {
  const now = new Date()
  const errors: string[] = []
  let sentCount = 0
  let failedCount = 0

  try {
    console.log('[Post-Session SMS] Processing ended sessions...')

    // Find registrations whose session ended and haven't received SMS yet
    const registrations = await prisma.registration.findMany({
      where: {
        postSessionSmsSent: false, // Not yet sent
        scheduledStartTime: {
          not: null
        },
        phone: {
          not: null
        }
      },
      include: {
        webinar: {
          select: {
            id: true,
            title: true,
            duration: true,
            autoSendPostSessionSMS: true,
            postSessionSMSMinutesAfter: true,
            postSessionSMSMinWatchedMinutes: true,
            postSessionSMSMinWatchedPercentage: true,
            postSessionSMSBody: true
          }
        }
      },
      take: 100 // Process in batches
    })

    console.log(`[Post-Session SMS] Found ${registrations.length} registrations to check`)

    for (const registration of registrations) {
      try {
        // Skip if webinar doesn't have SMS automation enabled
        if (!registration.webinar.autoSendPostSessionSMS || !registration.webinar.postSessionSMSBody) {
          continue
        }

        // Calculate when SMS should be sent
        const sessionEndTime = new Date(
          registration.scheduledStartTime!.getTime() + 
          registration.webinar.duration * 60 * 1000 + // Session duration
          (registration.webinar.postSessionSMSMinutesAfter || 0) * 60 * 1000 // Delay after session
        )

        // Check if it's time to send
        if (sessionEndTime > now) {
          continue // Not time yet
        }

        // Check watch criteria
        const meetsWatchCriteria = checkWatchCriteria(
          registration.lastWatchedPosition || 0,
          registration.attended,
          registration.webinar.duration,
          registration.webinar.postSessionSMSMinWatchedMinutes,
          registration.webinar.postSessionSMSMinWatchedPercentage
        )

        if (!meetsWatchCriteria) {
          // Mark as processed so we don't check again
          await prisma.registration.update({
            where: { id: registration.id },
            data: {
              postSessionSmsSent: true,
              postSessionSmsSentAt: now
            }
          })
          console.log(`[Post-Session SMS] ${registration.email} - Skipped (doesn't meet watch criteria)`)
          continue
        }

        // Personalize message
        const personalizedMessage = registration.webinar.postSessionSMSBody
          .replace(/\{name\}/g, registration.name || 'there')
          .replace(/\{webinar_title\}/g, registration.webinar.title)

        // Send SMS
        await sendClickSendSMS(
          registration.phone!, 
          personalizedMessage,
          registration.timezone
        )

        // Mark as sent
        await prisma.registration.update({
          where: { id: registration.id },
          data: {
            postSessionSmsSent: true,
            postSessionSmsSentAt: now
          }
        })

        sentCount++
        console.log(`[Post-Session SMS] ✓ Sent to ${registration.email}`)

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        failedCount++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`${registration.email}: ${errorMessage}`)
        console.error(`[Post-Session SMS] ✗ Failed for ${registration.email}:`, errorMessage)

        // Mark as sent (with error) to avoid retry loops
        await prisma.registration.update({
          where: { id: registration.id },
          data: {
            postSessionSmsSent: true,
            postSessionSmsSentAt: now
          }
        })
      }
    }

    console.log(`[Post-Session SMS] Completed: ${sentCount} sent, ${failedCount} failed`)

    return {
      checked: registrations.length,
      sent: sentCount,
      failed: failedCount,
      errors
    }
  } catch (error) {
    console.error('[Post-Session SMS] Critical error:', error)
    throw error
  }
}

/**
 * Check if registration meets watch criteria
 */
function checkWatchCriteria(
  lastWatchedPosition: number,
  attended: boolean,
  webinarDuration: number,
  minWatchedMinutes?: number | null,
  minWatchedPercentage?: number | null
): boolean {
  // If never attended, doesn't meet criteria
  if (!attended) {
    return false
  }

  // If no criteria set, anyone who attended qualifies
  if (!minWatchedMinutes && !minWatchedPercentage) {
    return true
  }

  // Check minutes criteria
  if (minWatchedMinutes) {
    const watchedMinutes = lastWatchedPosition / 60
    if (watchedMinutes < minWatchedMinutes) {
      return false
    }
  }

  // Check percentage criteria
  if (minWatchedPercentage) {
    const watchedPercentage = (lastWatchedPosition / (webinarDuration * 60)) * 100
    if (watchedPercentage < minWatchedPercentage) {
      return false
    }
  }

  return true
}

/**
 * Manual trigger for specific webinar
 */
export async function sendPostSessionSMSForWebinar(webinarId: string): Promise<{
  sent: number
  failed: number
  errors: string[]
}> {
  const now = new Date()
  const errors: string[] = []
  let sentCount = 0
  let failedCount = 0

  const webinar = await prisma.webinar.findUnique({
    where: { id: webinarId },
    select: {
      id: true,
      title: true,
      duration: true,
      autoSendPostSessionSMS: true,
      postSessionSMSBody: true,
      postSessionSMSMinWatchedMinutes: true,
      postSessionSMSMinWatchedPercentage: true
    }
  })

  if (!webinar || !webinar.postSessionSMSBody) {
    throw new Error('Webinar not found or SMS not configured')
  }

  const registrations = await prisma.registration.findMany({
    where: {
      webinarId,
      postSessionSmsSent: false,
      phone: {
        not: null
      }
    }
  })

  for (const registration of registrations) {
    try {
      const meetsWatchCriteria = checkWatchCriteria(
        registration.lastWatchedPosition || 0,
        registration.attended,
        webinar.duration,
        webinar.postSessionSMSMinWatchedMinutes,
        webinar.postSessionSMSMinWatchedPercentage
      )

      if (!meetsWatchCriteria) {
        continue
      }

      const personalizedMessage = webinar.postSessionSMSBody
        .replace(/\{name\}/g, registration.name || 'there')
        .replace(/\{webinar_title\}/g, webinar.title)

      await sendClickSendSMS(
        registration.phone!, 
        personalizedMessage,
        registration.timezone
      )

      await prisma.registration.update({
        where: { id: registration.id },
        data: {
          postSessionSmsSent: true,
          postSessionSmsSentAt: now
        }
      })

      sentCount++
    } catch (error) {
      failedCount++
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`${registration.email}: ${errorMessage}`)
    }
  }

  return { sent: sentCount, failed: failedCount, errors }
}
