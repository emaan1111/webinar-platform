/**
 * WebinarJam/EverWebinar Sync Library
 * 
 * Syncs registrations and attendance data from WebinarJam/EverWebinar
 * Called by the main cron job (process-reminders) and, on demand, by
 * POST /api/cron/sync-webinarjam (the dashboard's Sync button). One
 * implementation on purpose: a second copy of this sync used to live in that
 * route and only IT pushed attendance to Emaan — and only THIS one ran.
 */

import { prisma } from '@/lib/prisma'
import { sendFacebookRegistration } from '@/lib/facebook'
import { shouldSendPostSessionSms } from '@/lib/postSessionSms'
import {
  isWebinarJamConfigured,
  getWebinarRegistrants,
  getWebinarDetails,
  getRegistrantFullName,
  getRegistrantPhone,
  getRegistrantCountry,
  parseWatchTime,
  parseRegistrationDate,
  parseApiDate,
  guessTimezoneFromLocation,
  getAttendanceCategory,
  WebinarJamRegistrant,
  WebinarJamSchedule,
} from '@/lib/webinarjam'
import { applyReminderTagToContact } from '@/lib/clickfunnels'
import { syncContactToMautic } from '@/lib/mautic'
import { sendClickSendSMS } from '@/lib/clicksend'
import { fromZonedTime } from 'date-fns-tz'
import { pushRegistrationUpdateToEmaan } from '@/lib/emaan'

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
  
  // Fetch webinar details to get schedules
  const webinarDetails = await getWebinarDetails(extWebinar.externalWebinarId, platform)
  const schedules = webinarDetails?.schedules || []
  
  // Build schedule ID → end time (UTC) map
  // This handles JIT schedules correctly - each has date + time + timezone
  const scheduleEndTimes = new Map<string, Date>()
  const webinarDuration = extWebinar.webinarDurationMinutes || 60
  
  for (const schedule of schedules) {
    const scheduleId = String(schedule.schedule)
    const scheduledStartUTC = parseScheduleToUTC(schedule)
    if (scheduledStartUTC) {
      // Calculate when this session ends: start + duration
      const endTime = new Date(scheduledStartUTC.getTime() + (webinarDuration * 60 * 1000))
      scheduleEndTimes.set(scheduleId, endTime)
    }
  }
  
  // EverWebinar API date_range values are non-overlapping windows (1=today, 2=yesterday, etc.)
  // Fetch both today and yesterday to catch all recent registrations
  let allRegistrants: WebinarJamRegistrant[] = [];
  
  for (const dateRange of [1, 2] as const) {
    let page = 1;
    let fetchMore = true;
    while (fetchMore) {
      const { registrants: pageRegistrants } = await getWebinarRegistrants(
        extWebinar.externalWebinarId,
        { platform, dateRange, page }
      )
      if (pageRegistrants && pageRegistrants.length > 0) {
        allRegistrants = [...allRegistrants, ...pageRegistrants]
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
      attendedLive: true,
      watchTimeMinutes: true, 
      attendanceTagsApplied: true, 
      postSessionSmsSent: true,
      appliedTag: true,
      scheduledStartTime: true
    }
  })
  const existingEmails = new Map(existingRegs.map(r => [r.email.toLowerCase(), r]))

  // Process each registrant
  for (const registrant of registrants) {
    const email = registrant.email.toLowerCase()
    const existing = existingEmails.get(email)
    
    // Parse attendance data
    const liveMinutes = parseWatchTime(registrant.time_live)
    const replayMinutes = parseWatchTime(registrant.time_replay)
    const watchTimeMinutes = liveMinutes + replayMinutes
    // API may return number (1) or string ("Yes") for attended fields
    const attendedLive = registrant.attended_live === 1 || registrant.attended_live === '1' || String(registrant.attended_live).toLowerCase() === 'yes'
    const attendedReplay = registrant.attended_replay === 1 || registrant.attended_replay === '1' || String(registrant.attended_replay).toLowerCase() === 'yes'
    const attended = attendedLive || attendedReplay

    // Derive registrant's timezone from their country/state for accurate UTC conversion
    const registrantTz = guessTimezoneFromLocation(registrant.country, registrant.state)
    
    // Derive scheduledStartTime: event (actual session time) > date_live (attended time) > signup_date (fallback)
    let scheduledStartTime: Date | null = null
    scheduledStartTime = parseApiDate(registrant.event, registrantTz)
    if (!scheduledStartTime) {
      scheduledStartTime = parseApiDate(registrant.date_live, registrantTz)
    }
    if (!scheduledStartTime) {
      scheduledStartTime = parseApiDate(registrant.signup_date, registrantTz)
    }
    
    if (!existing) {
      // Get linked lead page and split test info (1 external webinar = 1 lead page)
      const linkedLeadPage = extWebinar.leadPages?.[0]
      const linkedLeadPageId = linkedLeadPage?.id || null
      const splitTestVariant = linkedLeadPage?.splitTestVariants?.[0]
      
      // New registration - create it
      const isNew = await createRegistration(extWebinar, registrant, watchTimeMinutes, attended, linkedLeadPageId, scheduledStartTime, registrantTz, {
        attendedLive,
        attendedReplay,
        replayMinutes,
      })
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

        // Apply registration tag (only when this webinar's CRM integration is ClickFunnels)
        if (extWebinar.registrationTag && (extWebinar.crmIntegration || 'CLICKFUNNELS') === 'CLICKFUNNELS') {
          await applyTag(email, extWebinar.registrationTag)
        }
      }
    } else {
      // Existing registration - update attendance if changed, or if the row
      // predates the stored live/replay split (attendedLive == null).
      const dataChanged =
        existing.watchTimeMinutes !== watchTimeMinutes || existing.attended !== attended
      if (dataChanged || existing.attendedLive == null) {
        // Pure split backfill (dataChanged false): store the split, touch
        // nothing else - in particular never re-stamp joinedAt.
        //
        // Never replace a scheduledStartTime the row already has. A lead-page
        // registration stores the exact instant the picker booked; the value
        // derived here comes from the API's wall-clock string parsed in a
        // GUESSED zone, and when the guess fails (the API sends no country for
        // registrants we created) that wall clock is read as UTC - 11 AM Sydney
        // became 11:00Z, ten hours late, and the reports filed a finished
        // session under "yet to run". Only fill in a row that has none.
        await updateAttendance(extWebinar.id, email, watchTimeMinutes, attended, existing.scheduledStartTime ? null : scheduledStartTime, {
          attendedLive,
          liveMinutes,
          attendedReplay,
          replayMinutes,
        }, { dataChanged, previousAttended: existing.attended })
        if (dataChanged) attendanceUpdated++
      } else if (!existing.scheduledStartTime && scheduledStartTime) {
        // Backfill scheduledStartTime for existing records missing it
        await updateAttendance(extWebinar.id, email, watchTimeMinutes, attended, scheduledStartTime, {
          attendedLive,
          liveMinutes,
          attendedReplay,
          replayMinutes,
        }, { dataChanged: false, previousAttended: existing.attended })
      }

      // Determine when this registrant's session ended
      const registrantScheduleId = String(registrant.schedule)
      const scheduledEndTime = scheduleEndTimes.get(registrantScheduleId) || null
      
      let sessionEndTime: Date | null = null
      
      if (attendedLive || !registrant.date_replay) {
        // LIVE or MISSED: Use scheduled session end time, or date_live + duration as fallback
        sessionEndTime = scheduledEndTime
        if (!sessionEndTime && registrant.date_live) {
          const liveDateParsed = parseApiDate(registrant.date_live, registrantTz)
          if (liveDateParsed) {
            sessionEndTime = new Date(liveDateParsed.getTime() + (webinarDuration * 60 * 1000))
          }
        }
        // For JIT/non-attended: use event or signup_date + duration as last resort
        if (!sessionEndTime) {
          const eventOrSignup = parseApiDate(registrant.event, registrantTz) 
            || parseApiDate(registrant.signup_date, registrantTz)
          if (eventOrSignup) {
            sessionEndTime = new Date(eventOrSignup.getTime() + (webinarDuration * 60 * 1000))
          }
        }
      } else if (registrant.date_replay) {
        // REPLAY: Use when they started replay + duration
        const replayDate = parseApiDate(registrant.date_replay, registrantTz)
        if (replayDate) {
          sessionEndTime = new Date(replayDate.getTime() + (webinarDuration * 60 * 1000))
        }
      }
      
      const sessionHasEnded = sessionEndTime ? Date.now() > sessionEndTime.getTime() : false
      
      // Apply attendance tags if session has ended and not already tagged
      if (!existing.attendanceTagsApplied && sessionHasEnded) {
        const tagResult = await applyAttendanceTags(extWebinar, email, watchTimeMinutes)
        if (tagResult) tagsApplied++
      }

      // Send post-session SMS if enabled, session ended (+ configured delay),
      // attended (not for missed), and past the min-watched threshold
      const smsIsDue = shouldSendPostSessionSms({
        autoSend: extWebinar.autoSendPostSessionSMS,
        alreadySent: existing.postSessionSmsSent,
        attended,
        sessionEndTime,
        minutesAfter: extWebinar.postSessionSMSMinutesAfter,
        watchTimeMinutes,
        minWatchedMinutes: extWebinar.postSessionSMSMinWatchedMinutes,
      })
      if (smsIsDue) {
        const smsResult = await sendPostSessionSMS(extWebinar, email, registrant, registrantTz)
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
 * Parse a WebinarJam schedule (date + time + timezone) to UTC Date
 * 
 * WebinarJam schedule format:
 * - date: "2026-04-05" (YYYY-MM-DD)
 * - time: "21:00" (HH:MM in 24hr format)  
 * - timezone: "America/New_York" or "EST" etc.
 * 
 * Uses date-fns-tz for proper timezone handling
 */
function parseScheduleToUTC(schedule: WebinarJamSchedule): Date | null {
  try {
    if (!schedule.date || !schedule.time) return null
    
    // Parse date parts
    const [year, month, day] = schedule.date.split('-').map(Number)
    const [hour, minute] = schedule.time.split(':').map(Number)
    
    if (schedule.timezone) {
      // Use date-fns-tz to convert from the schedule's timezone to UTC
      // fromZonedTime: converts a date that is in a specific timezone to UTC
      const localDate = new Date(year, month - 1, day, hour, minute, 0, 0)
      return fromZonedTime(localDate, schedule.timezone)
    }
    
    // No timezone specified, treat as UTC
    return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0))
  } catch (error) {
    console.error('Failed to parse schedule to UTC:', schedule, error)
    return null
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
  registrantTz?: string | null,
  detail?: { attendedLive: boolean; attendedReplay: boolean; replayMinutes: number }
): Promise<boolean> {
  try {
    await prisma.externalWebinarRegistration.create({
      data: {
        externalWebinarId: extWebinar.id,
        name: getRegistrantFullName(registrant),
        email: registrant.email.toLowerCase(),
        phone: getRegistrantPhone(registrant),
        externalUserId: String(registrant.webinar),
        registeredAt: parseApiDate(registrant.signup_date, registrantTz) || new Date(),
        registrationSource: 'api_sync',
        leadPageId,
        timezone: registrantTz || undefined,
        country: getRegistrantCountry(registrant) || undefined,
        attended,
        watchTimeMinutes,
        attendedLive: detail?.attendedLive,
        attendedReplay: detail?.attendedReplay,
        replayWatchTimeMinutes: detail?.replayMinutes,
        scheduledStartTime,
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
  attended: boolean,
  scheduledStartTime?: Date | null,
  /**
   * The live/replay split. Stored on the row (the reports need it to tell
   * "missed it, watched the replay" from "attended live") and passed through
   * to Emaan, which needs the same distinction for its tagging.
   */
  detail?: {
    attendedLive: boolean
    liveMinutes: number
    attendedReplay: boolean
    replayMinutes: number
  },
  /** Absent = behave like a genuine attendance change (old callers). */
  sync?: { dataChanged: boolean; previousAttended: boolean }
): Promise<void> {
  const previousAttended = sync?.previousAttended ?? false
  const dataChanged = sync?.dataChanged ?? true
  const updated = await prisma.externalWebinarRegistration.update({
    where: {
      externalWebinarId_email: { externalWebinarId, email }
    },
    data: {
      watchTimeMinutes,
      attended,
      ...(detail
        ? {
            attendedLive: detail.attendedLive,
            attendedReplay: detail.attendedReplay,
            replayWatchTimeMinutes: detail.replayMinutes,
          }
        : {}),
      // A genuine change re-opens tagging so the category can be corrected on
      // the next pass; a pure backfill must not re-tag anyone.
      ...(dataChanged ? { attendanceTagsApplied: false } : {}),
      // Stamp only on a genuine flip to attended; a backfill must not
      // re-date when someone showed up.
      joinedAt: attended && !previousAttended ? new Date() : undefined,
      ...(scheduledStartTime ? { scheduledStartTime } : {}),
      updatedAt: new Date(),
    },
    select: {
      email: true,
      name: true,
      phone: true,
      timezone: true,
      liveRoomUrl: true,
      replayRoomUrl: true,
      registeredAt: true,
      attended: true,
      watchTimeMinutes: true,
      externalWebinar: { select: { name: true, externalWebinarName: true } },
    },
  })

  // Push attendance on to Emaan. This is the ONLY place attendance leaves this
  // app: Emaan learns about registrants from the registration push, but nothing
  // else ever marks them attended — so without this every EverWebinar
  // registrant reads there as "missed" once their session is three hours old,
  // and the attended/replay tags never fire. Fire-and-forget: a sync run must
  // not fail because Emaan is slow. (Live-Zoom picks never reach here —
  // WebinarJam knows nothing about them — so they stay unattended in Emaan,
  // which is honest: no attendance source for them exists anywhere in this app.)
  if (!dataChanged) return
  void pushRegistrationUpdateToEmaan({
    email: updated.email,
    name: updated.name,
    phone: updated.phone,
    webinar: {
      externalWebinarId,
      webinarName:
        updated.externalWebinar.externalWebinarName || updated.externalWebinar.name,
      // Attendance only — deliberately no session time. The scheduledStartTime
      // on this row is not trustworthy (parseApiDate has stored WebinarJam's
      // wall-clock time as UTC on some rows), and Emaan overwrites its session
      // time with whatever arrives — moving that person's reminders and their
      // stats day with it. With the field absent, Emaan keeps the instant the
      // registration push gave it.
      scheduledStartTime: null,
      timezone: updated.timezone,
      liveRoomUrl: updated.liveRoomUrl,
      replayRoomUrl: updated.replayRoomUrl,
      sessionType: 'everwebinar',
      registeredAt: updated.registeredAt,
      attended: detail ? detail.attendedLive : updated.attended,
      watchTimeMinutes: detail ? detail.liveMinutes : updated.watchTimeMinutes,
      attendedReplay: detail?.attendedReplay ?? false,
      replayMinutes: detail?.replayMinutes ?? 0,
    },
  }).catch((err) => console.error('Emaan attendance push error:', err))
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
  // Skip ClickFunnels tagging unless this webinar's CRM integration is ClickFunnels (not NONE/Mautic).
  if ((extWebinar.crmIntegration || 'CLICKFUNNELS') !== 'CLICKFUNNELS') {
    return false
  }

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
  registrant: WebinarJamRegistrant,
  registrantTz?: string | null
): Promise<boolean> {
  const phone = getRegistrantPhone(registrant)
  if (!phone || !extWebinar.postSessionSMSBody) return false

  try {
    const smsBody = extWebinar.postSessionSMSBody
      .replace(/\{\{name\}\}/g, registrant.first_name || 'there')
      .replace(/\{\{email\}\}/g, registrant.email)
      .replace(/\{\{phone\}\}/g, phone)

    const result = await sendClickSendSMS(phone, smsBody, registrantTz)
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
