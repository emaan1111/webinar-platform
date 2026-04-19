import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendFacebookRegistration } from '@/lib/facebook'
import {
  isWebinarJamConfigured,
  getWebinarRegistrants,
  getWebinarDetails,
  getRegistrantFullName,
  getRegistrantPhone,
  parseWatchTime,
  parseRegistrationDate,
  parseDateInTimezone,
  getAttendanceCategory,
  WebinarJamRegistrant,
} from '@/lib/webinarjam'
import { applyReminderTagToContact } from '@/lib/clickfunnels'
import { syncContactToMautic } from '@/lib/mautic'
import { sendClickSendSMS } from '@/lib/clicksend'

/**
 * WebinarJam Sync Cron Job
 * 
 * POST /api/cron/sync-webinarjam
 * 
 * Syncs registrations AND attendance data from WebinarJam for all active external webinars.
 * Should be called every 10-15 minutes via cron.
 * 
 * What it does:
 * 1. For each active external webinar, fetches registrants from WebinarJam API
 * 2. Creates new registrations locally (if not exists)
 * 3. Updates attendance data (watch time, attended status)
 * 4. Sends to Facebook CAPI for new registrations
 * 5. Applies attendance tags (ClickFunnels)
 * 6. Sends post-session SMS (if configured)
 */

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verify auth: accept either cron secret OR authenticated dashboard session
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    let authorized = false
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      authorized = true
    }
    if (!authorized) {
      const session = await getServerSession(authOptions)
      if (session?.user) {
        authorized = true
      }
    }
    if (!authorized && cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check configuration
    if (!isWebinarJamConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'WebinarJam API not configured',
        hint: 'Add WEBINARJAM_API_KEY to your .env file'
      }, { status: 400 })
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
      return NextResponse.json({
        success: true,
        message: 'No active external webinars to sync',
        stats: { webinarsProcessed: 0 }
      })
    }

    console.log(`🔄 WebinarJam sync: Processing ${externalWebinars.length} external webinar(s)...`)

    const stats = {
      webinarsProcessed: 0,
      totalRegistrations: 0,
      newRegistrations: 0,
      attendanceUpdated: 0,
      facebookEventsSent: 0,
      tagsApplied: 0,
      smsSent: 0,
      errors: [] as string[]
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
        console.error(`❌ ${errorMsg}`)
      }
    }

    // Update last sync time for all processed webinars
    await prisma.externalWebinar.updateMany({
      where: { id: { in: externalWebinars.map(w => w.id) } },
      data: { lastSyncAt: new Date() }
    })

    const processingTime = Date.now() - startTime

    console.log(`✅ WebinarJam sync complete: ${stats.newRegistrations} new, ${stats.attendanceUpdated} attendance updates (${processingTime}ms)`)

    return NextResponse.json({
      success: true,
      stats,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ WebinarJam sync error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
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
  
  // Fetch webinar details to get the timezone (API dates have no timezone offset)
  const webinarDetails = await getWebinarDetails(extWebinar.externalWebinarId, platform)
  const webinarTimezone = webinarDetails?.timezone || null
  
  // EverWebinar API date_range values are non-overlapping windows (1=today, 2=yesterday, etc.)
  // Fetch ranges 1-5 to cover last ~7 days for manual catch-up sync
  let allRegistrants: WebinarJamRegistrant[] = [];
  
  for (const dateRange of [1, 2, 3, 4, 5] as const) {
    let page = 1;
    let fetchMore = true;
    while (fetchMore) {
      const { registrants } = await getWebinarRegistrants(
        extWebinar.externalWebinarId,
        { platform, dateRange, page }
      )
      if (registrants && registrants.length > 0) {
        allRegistrants = [...allRegistrants, ...registrants]
        page++
        if (page > 10) fetchMore = false;
      } else {
        fetchMore = false;
      }
    }
  }

  // Deduplicate by email (API may return same email across date ranges)
  const seen = new Set<string>();
  const registrants = allRegistrants.filter(r => {
    const key = r.email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  if (registrants.length === 0) {
    console.log(`📋 ${extWebinar.name}: No registrants found`)
    return { total: 0, new: 0, attendanceUpdated: 0, facebookSent: 0, tagsApplied: 0, smsSent: 0 }
  }

  console.log(`📋 ${extWebinar.name}: ${registrants.length} registrants from ${platform}`)

  let newCount = 0
  let attendanceUpdated = 0
  let fbSentCount = 0
  let tagsApplied = 0
  let smsSent = 0

  // Get existing registrations
  const existingRegs = await prisma.externalWebinarRegistration.findMany({
    where: { externalWebinarId: extWebinar.id },
    select: { email: true, attended: true, watchTimeMinutes: true, attendanceTagsApplied: true, postSessionSmsSent: true, registeredAt: true, scheduledStartTime: true }
  })
  const existingEmails = new Map(existingRegs.map(r => [r.email.toLowerCase(), r]))

  // Process each registrant
  for (const registrant of registrants) {
    const email = registrant.email.toLowerCase()
    const existing = existingEmails.get(email)
    
    // Parse attendance data
    const watchTimeMinutes = parseWatchTime(registrant.time_live) + parseWatchTime(registrant.time_replay)
    // API may return number (1) or string ("Yes") for attended fields
    const attendedLive = registrant.attended_live === 1 || registrant.attended_live === '1' || String(registrant.attended_live).toLowerCase() === 'yes'
    const attendedReplay = registrant.attended_replay === 1 || registrant.attended_replay === '1' || String(registrant.attended_replay).toLowerCase() === 'yes'
    const attended = attendedLive || attendedReplay

    // Derive scheduledStartTime: event (actual session time) > date_live (attended time) > signup_date (fallback)
    // All API dates are in the webinar's timezone, so parse them timezone-aware
    let scheduledStartTime: Date | null = null
    scheduledStartTime = parseDateInTimezone(registrant.event, webinarTimezone)
    if (!scheduledStartTime) {
      scheduledStartTime = parseDateInTimezone(registrant.date_live, webinarTimezone)
    }
    if (!scheduledStartTime) {
      scheduledStartTime = parseDateInTimezone(registrant.signup_date, webinarTimezone)
    }
    
    if (!existing) {
      // Get linked lead page and split test info (1 external webinar = 1 lead page)
      const linkedLeadPage = extWebinar.leadPages?.[0]
      const linkedLeadPageId = linkedLeadPage?.id || null
      const splitTestVariant = linkedLeadPage?.splitTestVariants?.[0]
      
      // New registration - create it
      const isNew = await createRegistration(extWebinar, registrant, watchTimeMinutes, attended, linkedLeadPageId, scheduledStartTime, webinarTimezone)
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

        const registrantFullName = getRegistrantFullName(registrant)
        const [derivedFirstName, ...derivedLastNameParts] = registrantFullName.split(' ')
        await syncContactToMautic({
          email,
          firstName: registrant.first_name || derivedFirstName || null,
          lastName: registrant.last_name || derivedLastNameParts.join(' ') || null,
          phone: getRegistrantPhone(registrant),
        })

        // Apply registration tag
        if (extWebinar.registrationTag) {
          await applyTag(email, extWebinar.registrationTag)
        }
      }
    } else {
      // Existing registration - update attendance if changed
      if (existing.watchTimeMinutes !== watchTimeMinutes || existing.attended !== attended) {
        await updateAttendance(extWebinar.id, email, watchTimeMinutes, attended, scheduledStartTime)
        attendanceUpdated++
        // Reset tag status so tags are re-evaluated based on new watch time
        existing.attendanceTagsApplied = false
      } else if (!existing.scheduledStartTime && scheduledStartTime) {
        // Backfill scheduledStartTime for existing registrations that are missing it
        await updateAttendance(extWebinar.id, email, watchTimeMinutes, attended, scheduledStartTime)
      }

      // Apply attendance tags if not already applied and enough time has passed
      const delayHours = extWebinar.attendanceTagDelayHours ?? 24
      
      let canTagNow = false
      if (existing.scheduledStartTime) {
        const webinarEndMs = new Date(existing.scheduledStartTime).getTime() + ((extWebinar.webinarDurationMinutes || 60) * 60 * 1000)
        const delayMs = delayHours * 60 * 60 * 1000
        canTagNow = Date.now() >= (webinarEndMs + delayMs)
      } else {
        const registeredAt = existing.registeredAt || new Date(0)
        const hoursSinceRegistration = (Date.now() - new Date(registeredAt).getTime()) / (1000 * 60 * 60)
        canTagNow = hoursSinceRegistration >= delayHours
      }
      
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
  leadPageId: string | null,
  scheduledStartTime: Date | null,
  webinarTimezone: string | null
): Promise<boolean> {
  try {
    await prisma.externalWebinarRegistration.create({
      data: {
        externalWebinarId: extWebinar.id,
        name: getRegistrantFullName(registrant),
        email: registrant.email.toLowerCase(),
        phone: getRegistrantPhone(registrant),
        externalUserId: String(registrant.webinar),
        registeredAt: parseDateInTimezone(registrant.signup_date, webinarTimezone) || new Date(),
        registrationSource: 'api_sync',
        leadPageId, // Link to the associated lead page
        attended,
        watchTimeMinutes,
        scheduledStartTime,
        privacyConsent: true,
      }
    })
    console.log(`  ➕ New: ${registrant.email}${leadPageId ? ' (linked to lead page)' : ''}`)
    return true
  } catch (error) {
    console.error(`  ❌ Failed to create registration for ${registrant.email}:`, error)
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
  attended: boolean,
  scheduledStartTime?: Date | null
): Promise<void> {
  await prisma.externalWebinarRegistration.update({
    where: {
      externalWebinarId_email: { externalWebinarId, email }
    },
    data: {
      watchTimeMinutes,
      attended,
      attendanceTagsApplied: false,
      joinedAt: attended ? new Date() : undefined,
      ...(scheduledStartTime ? { scheduledStartTime } : {}),
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
    // Use transaction to ensure atomicity
    await prisma.$transaction([
      // Increment variant conversions
      prisma.splitTestVariant.update({
        where: { id: variantId },
        data: { conversions: { increment: 1 } }
      }),
      // Increment parent split test conversions
      prisma.splitTest.update({
        where: { id: splitTestId },
        data: { conversions: { increment: 1 } }
      }),
      // Create conversion event for tracking/analytics
      prisma.splitTestEvent.create({
        data: {
          splitTestId,
          variantId,
          type: 'CONVERSION',
          visitorId: `ext_${email}`, // Use email as visitor ID for external registrations
        }
      })
    ])
    console.log(`  📊 Split test conversion tracked for variant ${variantId}`)
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
    const normalizedTagName = tagName.trim()

    if (!normalizedTagName) {
      console.error(`  ❌ Empty tag name for ${email}`)
      return false
    }

    return await applyReminderTagToContact(email, normalizedTagName)
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
  // Determine which tag to apply based on attendance category
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

  if (!tagToApply?.trim()) {
    console.log(`  ⚠️ No attendance tag configured for ${email} (${category})`)
    return false
  }

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

  // Check minimum watch time requirement
  const watchTime = parseWatchTime(registrant.time_live) + parseWatchTime(registrant.time_replay)
  if (extWebinar.postSessionSMSMinWatchedMinutes && watchTime < extWebinar.postSessionSMSMinWatchedMinutes) {
    return false
  }

  try {
    // Replace placeholders in SMS body
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

// GET endpoint for health check
export async function GET() {
  const configured = isWebinarJamConfigured()
  const hasFacebook = !!(process.env.FB_PIXEL_ID && process.env.FB_ACCESS_TOKEN)

  // Count active external webinars
  const activeCount = await prisma.externalWebinar.count({ where: { isActive: true } }).catch(() => 0)

  return NextResponse.json({
    service: 'WebinarJam/EverWebinar Sync',
    status: configured ? 'ready' : 'not_configured',
    configuration: {
      webinarjam_api_configured: configured,
      active_external_webinars: activeCount,
      facebook_capi_configured: hasFacebook,
    },
    description: 'Syncs registrations and attendance data from WebinarJam/EverWebinar',
    cron_recommendation: 'Run every 10-15 minutes',
    features: [
      'New registration sync',
      'Attendance data sync (watch time)',
      'Facebook CAPI events',
      'ClickFunnels attendance tags',
      'Post-session SMS',
    ]
  })
}
