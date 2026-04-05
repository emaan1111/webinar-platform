/**
 * WebinarJam/EverWebinar Sync Library
 * 
 * Syncs registrations and attendance data from WebinarJam/EverWebinar
 * Called by the main cron job (process-reminders)
 */

import { prisma } from '@/lib/prisma'
import { sendFacebookRegistration } from '@/lib/facebook'
import {
  isWebinarJamConfigured,
  getWebinarRegistrants,
  getRegistrantFullName,
  getRegistrantPhone,
  parseWatchTime,
  parseRegistrationDate,
  getAttendanceCategory,
  WebinarJamRegistrant,
} from '@/lib/webinarjam'
import { applyReminderTagToContact } from '@/lib/clickfunnels'
import { sendClickSendSMS } from '@/lib/clicksend'

export interface WebinarJamSyncStats {
  webinarsProcessed: number
  totalRegistrations: number
  newRegistrations: number
  attendanceUpdated: number
  facebookEventsSent: number
  tagsApplied: number
  smsSent: number
  errors: string[]
  skipped?: string
}

/**
 * Main sync function - called by cron
 */
export async function syncWebinarJamRegistrations(): Promise<WebinarJamSyncStats> {
  // Check configuration
  if (!isWebinarJamConfigured()) {
    return {
      webinarsProcessed: 0,
      totalRegistrations: 0,
      newRegistrations: 0,
      attendanceUpdated: 0,
      facebookEventsSent: 0,
      tagsApplied: 0,
      smsSent: 0,
      errors: [],
      skipped: 'WebinarJam API not configured'
    }
  }

  // Get all active external webinars with their linked lead pages and split test variants
  const externalWebinars = await prisma.externalWebinar.findMany({
    where: { isActive: true },
    include: {
      leadPages: {
        select: {
          id: true,
          splitTestVariants: {
            select: {
              id: true,
              splitTestId: true,
            },
            take: 1, // Lead page should only be in one variant
          }
        },
        take: 1, // 1 external webinar = 1 lead page
      }
    }
  })

  if (externalWebinars.length === 0) {
    return {
      webinarsProcessed: 0,
      totalRegistrations: 0,
      newRegistrations: 0,
      attendanceUpdated: 0,
      facebookEventsSent: 0,
      tagsApplied: 0,
      smsSent: 0,
      errors: [],
      skipped: 'No active external webinars'
    }
  }

  console.log(`🔄 WebinarJam sync: Processing ${externalWebinars.length} external webinar(s)...`)

  const stats: WebinarJamSyncStats = {
    webinarsProcessed: 0,
    totalRegistrations: 0,
    newRegistrations: 0,
    attendanceUpdated: 0,
    facebookEventsSent: 0,
    tagsApplied: 0,
    smsSent: 0,
    errors: []
  }

  // Process each external webinar
  for (const extWebinar of externalWebinars) {
    try {
      const result = await syncExternalWebinar(extWebinar)
      stats.webinarsProcessed++
      stats.totalRegistrations += result.total
      stats.newRegistrations += result.new
      stats.attendanceUpdated += result.attendanceUpdated
      stats.facebookEventsSent += result.facebookSent
      stats.tagsApplied += result.tagsApplied
      stats.smsSent += result.smsSent
    } catch (error) {
      const errorMsg = `${extWebinar.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      stats.errors.push(errorMsg)
      console.error(`❌ WebinarJam sync error: ${errorMsg}`)
    }
  }

  // Update last sync time for all processed webinars
  await prisma.externalWebinar.updateMany({
    where: { id: { in: externalWebinars.map(w => w.id) } },
    data: { lastSyncAt: new Date() }
  })

  if (stats.newRegistrations > 0 || stats.attendanceUpdated > 0) {
    console.log(`✅ WebinarJam sync: ${stats.newRegistrations} new, ${stats.attendanceUpdated} attendance updates`)
  }

  return stats
}

/**
 * Sync a single external webinar
 */
async function syncExternalWebinar(extWebinar: any): Promise<{
  total: number
  new: number
  attendanceUpdated: number
  facebookSent: number
  tagsApplied: number
  smsSent: number
}> {
  const platform = extWebinar.platform as 'webinarjam' | 'everwebinar'
  
  // Fetch all registrants from WebinarJam
  const { registrants } = await getWebinarRegistrants(
    extWebinar.externalWebinarId,
    { platform, dateRange: 8 } // Last 30 days
  )

  if (registrants.length === 0) {
    return { total: 0, new: 0, attendanceUpdated: 0, facebookSent: 0, tagsApplied: 0, smsSent: 0 }
  }

  let newCount = 0
  let attendanceUpdated = 0
  let fbSentCount = 0
  let tagsApplied = 0
  let smsSent = 0

  // Get existing registrations
  const existingRegs = await prisma.externalWebinarRegistration.findMany({
    where: { externalWebinarId: extWebinar.id },
    select: { 
      email: true, 
      attended: true, 
      watchTimeMinutes: true, 
      attendanceTagsApplied: true, 
      postSessionSmsSent: true, 
      registeredAt: true 
    }
  })
  const existingEmails = new Map(existingRegs.map(r => [r.email.toLowerCase(), r]))

  // Process each registrant
  for (const registrant of registrants) {
    const email = registrant.email.toLowerCase()
    const existing = existingEmails.get(email)
    
    // Parse attendance data
    const watchTimeMinutes = parseWatchTime(registrant.time_live) + parseWatchTime(registrant.time_replay)
    const attended = registrant.attended_live === 1 || registrant.attended_replay === 1
    
    if (!existing) {
      // Get linked lead page and split test info (1 external webinar = 1 lead page)
      const linkedLeadPage = extWebinar.leadPages?.[0]
      const linkedLeadPageId = linkedLeadPage?.id || null
      const splitTestVariant = linkedLeadPage?.splitTestVariants?.[0]
      
      // New registration - create it
      const isNew = await createRegistration(extWebinar, registrant, watchTimeMinutes, attended, linkedLeadPageId)
      if (isNew) {
        newCount++
        
        // Increment lead page conversions if linked
        if (linkedLeadPageId) {
          await prisma.leadPage.update({
            where: { id: linkedLeadPageId },
            data: { conversions: { increment: 1 } }
          }).catch(() => {})
        }
        
        // If lead page is part of split test, increment variant and test conversions
        if (splitTestVariant) {
          await trackSplitTestConversion(splitTestVariant.splitTestId, splitTestVariant.id, email)
        }
        
        // Send to Facebook CAPI
        if (extWebinar.sendToFacebookCAPI) {
          const sent = await sendToFacebookCAPI(extWebinar, registrant)
          if (sent) fbSentCount++
        }

        // Apply registration tag
        if (extWebinar.registrationTag) {
          await applyTag(email, extWebinar.registrationTag)
        }
      }
    } else {
      // Existing registration - update attendance if changed
      if (existing.watchTimeMinutes !== watchTimeMinutes || existing.attended !== attended) {
        await updateAttendance(extWebinar.id, email, watchTimeMinutes, attended)
        attendanceUpdated++
      }

      // Apply attendance tags if not already applied and enough time has passed
      const delayHours = extWebinar.attendanceTagDelayHours ?? 24
      const registeredAt = existing.registeredAt || new Date(0)
      const hoursSinceRegistration = (Date.now() - new Date(registeredAt).getTime()) / (1000 * 60 * 60)
      const canTagNow = hoursSinceRegistration >= delayHours
      
      if (!existing.attendanceTagsApplied && canTagNow) {
        const tagResult = await applyAttendanceTags(extWebinar, email, watchTimeMinutes)
        if (tagResult) tagsApplied++
      }

      // Send post-session SMS if enabled and not sent
      if (extWebinar.autoSendPostSessionSMS && !existing.postSessionSmsSent && attended) {
        const smsResult = await sendPostSessionSMS(extWebinar, email, registrant)
        if (smsResult) smsSent++
      }
    }
  }

  return {
    total: registrants.length,
    new: newCount,
    attendanceUpdated,
    facebookSent: fbSentCount,
    tagsApplied,
    smsSent,
  }
}

/**
 * Create a new registration record
 */
async function createRegistration(
  extWebinar: any,
  registrant: WebinarJamRegistrant,
  watchTimeMinutes: number,
  attended: boolean,
  leadPageId: string | null
): Promise<boolean> {
  try {
    await prisma.externalWebinarRegistration.create({
      data: {
        externalWebinarId: extWebinar.id,
        name: getRegistrantFullName(registrant),
        email: registrant.email.toLowerCase(),
        phone: getRegistrantPhone(registrant),
        externalUserId: String(registrant.webinar),
        registeredAt: parseRegistrationDate(registrant.signup_date),
        registrationSource: 'api_sync',
        leadPageId,
        attended,
        watchTimeMinutes,
        privacyConsent: true,
      }
    })
    console.log(`  ➕ New: ${registrant.email}${leadPageId ? ' (linked to lead page)' : ''}`)
    return true
  } catch (error) {
    // Likely duplicate - ignore
    return false
  }
}

/**
 * Update attendance data for existing registration
 */
async function updateAttendance(
  externalWebinarId: string,
  email: string,
  watchTimeMinutes: number,
  attended: boolean
): Promise<void> {
  await prisma.externalWebinarRegistration.update({
    where: {
      externalWebinarId_email: { externalWebinarId, email }
    },
    data: {
      watchTimeMinutes,
      attended,
      joinedAt: attended ? new Date() : undefined,
      updatedAt: new Date(),
    }
  })
}

/**
 * Track split test conversion when registration comes through external webinar
 */
async function trackSplitTestConversion(
  splitTestId: string,
  variantId: string,
  email: string
): Promise<void> {
  try {
    await prisma.$transaction([
      prisma.splitTestVariant.update({
        where: { id: variantId },
        data: { conversions: { increment: 1 } }
      }),
      prisma.splitTest.update({
        where: { id: splitTestId },
        data: { conversions: { increment: 1 } }
      }),
      prisma.splitTestEvent.create({
        data: {
          splitTestId,
          variantId,
          type: 'CONVERSION',
          visitorId: `ext_${email}`,
        }
      })
    ])
  } catch (error) {
    console.error(`  ⚠️ Failed to track split test conversion:`, error)
  }
}

/**
 * Send registration to Facebook CAPI
 */
async function sendToFacebookCAPI(extWebinar: any, registrant: WebinarJamRegistrant): Promise<boolean> {
  try {
    const result = await sendFacebookRegistration({
      email: registrant.email,
      name: getRegistrantFullName(registrant),
      phone: getRegistrantPhone(registrant),
      ipAddress: registrant.ip,
      webinarId: extWebinar.externalWebinarId,
      webinarTitle: extWebinar.externalWebinarName || extWebinar.name,
      registrationId: `ext_${registrant.email}`,
      value: 0,
      currency: 'USD',
    })

    if (result) {
      await prisma.externalWebinarRegistration.update({
        where: {
          externalWebinarId_email: {
            externalWebinarId: extWebinar.id,
            email: registrant.email.toLowerCase()
          }
        },
        data: { facebookCapiSent: true, facebookCapiSentAt: new Date() }
      }).catch(() => {})
    }
    return result
  } catch (error) {
    console.error(`  ❌ FB CAPI error for ${registrant.email}:`, error)
    return false
  }
}

/**
 * Apply a ClickFunnels tag
 */
async function applyTag(email: string, tagName: string): Promise<boolean> {
  try {
    await applyReminderTagToContact(email, tagName)
    return true
  } catch (error) {
    console.error(`  ❌ Tag error for ${email}:`, error)
    return false
  }
}

/**
 * Apply attendance tags based on watch time
 */
async function applyAttendanceTags(
  extWebinar: any,
  email: string,
  watchTimeMinutes: number
): Promise<boolean> {
  const webinarDuration = extWebinar.webinarDurationMinutes || 60
  const category = getAttendanceCategory(
    watchTimeMinutes,
    webinarDuration,
    extWebinar.mostlyAttendedThreshold || 70
  )

  let tagToApply: string | null = null
  switch (category) {
    case 'mostly_attended':
      tagToApply = extWebinar.mostlyAttendedTag
      break
    case 'partly_attended':
      tagToApply = extWebinar.partlyAttendedTag
      break
    case 'attended':
      tagToApply = extWebinar.attendedTag
      break
    case 'missed':
      tagToApply = extWebinar.missedTag
      break
  }

  if (!tagToApply) return false

  const applied = await applyTag(email, tagToApply)
  
  if (applied) {
    await prisma.externalWebinarRegistration.update({
      where: {
        externalWebinarId_email: { externalWebinarId: extWebinar.id, email }
      },
      data: {
        attendanceTagsApplied: true,
        attendanceTagsAppliedAt: new Date(),
        appliedTag: tagToApply,
      }
    }).catch(() => {})
  }

  return applied
}

/**
 * Send post-session SMS
 */
async function sendPostSessionSMS(
  extWebinar: any,
  email: string,
  registrant: WebinarJamRegistrant
): Promise<boolean> {
  const phone = getRegistrantPhone(registrant)
  if (!phone || !extWebinar.postSessionSMSBody) return false

  const watchTime = parseWatchTime(registrant.time_live) + parseWatchTime(registrant.time_replay)
  if (extWebinar.postSessionSMSMinWatchedMinutes && watchTime < extWebinar.postSessionSMSMinWatchedMinutes) {
    return false
  }

  try {
    const smsBody = extWebinar.postSessionSMSBody
      .replace(/\{\{name\}\}/g, registrant.first_name || 'there')
      .replace(/\{\{email\}\}/g, registrant.email)

    const result = await sendClickSendSMS(phone, smsBody)
    if (!result.success) {
      console.error(`  ❌ SMS failed for ${phone}: ${result.error}`)
      return false
    }
    
    await prisma.externalWebinarRegistration.update({
      where: {
        externalWebinarId_email: { externalWebinarId: extWebinar.id, email }
      },
      data: {
        postSessionSmsSent: true,
        postSessionSmsSentAt: new Date(),
      }
    }).catch(() => {})

    console.log(`  📱 SMS sent to ${phone}`)
    return true
  } catch (error) {
    console.error(`  ❌ SMS error for ${phone}:`, error)
    return false
  }
}
