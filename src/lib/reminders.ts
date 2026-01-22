// Webinar Reminder System
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { sendClickSendSMS } from '@/lib/clicksend'

interface ReminderTemplateData {
  type?: 'pre_webinar' | 'post_webinar'
  minutesBefore?: number
  minutesAfter?: number
  minWatchedMinutes?: number | null
  minWatchedPercentage?: number | null
  channel: 'EMAIL' | 'SMS' | 'BOTH'
  emailSubject?: string | null
  emailBody?: string | null
  smsBody?: string | null
  isActive?: boolean
  applyClickFunnelsTag?: boolean
  clickFunnelsTag?: string | null
}

/**
 * Create reminder template for a webinar
 */
export async function createReminderTemplate(
  webinarId: string,
  data: ReminderTemplateData
): Promise<any> {
  return await prisma.webinarReminderTemplate.create({
    data: {
      webinarId,
      type: data.type || 'pre_webinar',
      minutesBefore: data.minutesBefore || null,
      minutesAfter: data.minutesAfter || null,
      minWatchedMinutes: data.minWatchedMinutes || null,
      minWatchedPercentage: data.minWatchedPercentage || null,
      channel: data.channel,
      emailSubject: data.emailSubject || null,
      emailBody: data.emailBody || null,
      smsBody: data.smsBody || null,
      isActive: data.isActive ?? true,
      applyClickFunnelsTag: data.applyClickFunnelsTag ?? false,
      clickFunnelsTag:
        data.applyClickFunnelsTag ? (data.clickFunnelsTag || null) : null
    }
  })
}

/**
 * Get all reminder templates for a webinar
 */
export async function getWebinarReminderTemplates(webinarId: string) {
  return await prisma.webinarReminderTemplate.findMany({
    where: { webinarId },
    orderBy: { minutesBefore: 'desc' }
  })
}

/**
 * Update reminder template
 */
export async function updateReminderTemplate(
  templateId: string,
  data: Partial<ReminderTemplateData> & Record<string, unknown>
) {
  // Only include fields that are valid for the Prisma schema
  // This prevents errors from frontend sending extra fields like 'useWatchMinutes'
  const updateData: Record<string, unknown> = {}
  
  // Copy only valid fields
  if (data.type !== undefined) updateData.type = data.type
  if (data.minutesBefore !== undefined) updateData.minutesBefore = data.minutesBefore
  if (data.minutesAfter !== undefined) updateData.minutesAfter = data.minutesAfter
  if (data.minWatchedMinutes !== undefined) updateData.minWatchedMinutes = data.minWatchedMinutes
  if (data.minWatchedPercentage !== undefined) updateData.minWatchedPercentage = data.minWatchedPercentage
  if (data.channel !== undefined) updateData.channel = data.channel
  if (data.emailSubject !== undefined) updateData.emailSubject = data.emailSubject
  if (data.emailBody !== undefined) updateData.emailBody = data.emailBody
  if (data.smsBody !== undefined) updateData.smsBody = data.smsBody
  if (data.isActive !== undefined) updateData.isActive = data.isActive
  if (data.applyClickFunnelsTag !== undefined) updateData.applyClickFunnelsTag = data.applyClickFunnelsTag

  // Handle clickFunnelsTag specially
  if (data.applyClickFunnelsTag === false) {
    updateData.clickFunnelsTag = null
  } else if (data.clickFunnelsTag !== undefined) {
    updateData.clickFunnelsTag = data.clickFunnelsTag || null
  }

  return await prisma.webinarReminderTemplate.update({
    where: { id: templateId },
    data: updateData
  })
}

/**
 * Delete reminder template
 */
export async function deleteReminderTemplate(templateId: string) {
  return await prisma.webinarReminderTemplate.delete({
    where: { id: templateId }
  })
}

/**
 * Apply ClickFunnels registration tag based on when user registered
 * SCHEDULES tags to be applied at the appropriate time by the cron job
 */
export async function applyRegistrationTag(
  email: string,
  webinarStartTime: Date,
  registrationId: string
): Promise<void> {
  try {
    const now = new Date()
    const minutesUntilStart = Math.floor((webinarStartTime.getTime() - now.getTime()) / (1000 * 60))

    console.log(`📋 Scheduling ClickFunnels registration tag for ${email} (${minutesUntilStart} minutes until start)`)

    const { scheduleDelayedClickFunnelsTag } = await import('./clickfunnelsReminderTags')

    // Schedule ONLY ONE tag based on when they registered
    // ClickFunnels will handle the rest of the reminder sequence from there
    
    if (minutesUntilStart > 1440) { 
      // More than 24 hours away → Schedule 24HR tag
      const apply24HrAt = new Date(webinarStartTime.getTime() - 24 * 60 * 60 * 1000)
      await scheduleDelayedClickFunnelsTag({
        registrationId,
        tagName: '24HRREMINDER',
        scheduledFor: apply24HrAt
      })
      console.log(`⏰ Scheduled 24HRREMINDER tag for ${apply24HrAt.toISOString()}`)
      
    } else if (minutesUntilStart > 120) { 
      // Between 2-24 hours away → Schedule 2HR tag
      const apply2HrAt = new Date(webinarStartTime.getTime() - 2 * 60 * 60 * 1000)
      await scheduleDelayedClickFunnelsTag({
        registrationId,
        tagName: '2HRREMINDER',
        scheduledFor: apply2HrAt
      })
      console.log(`⏰ Scheduled 2HRREMINDER tag for ${apply2HrAt.toISOString()}`)
      
    } else if (minutesUntilStart > 60) { 
      // Between 1-2 hours away → Schedule 1HR tag
      const apply1HrAt = new Date(webinarStartTime.getTime() - 1 * 60 * 60 * 1000)
      await scheduleDelayedClickFunnelsTag({
        registrationId,
        tagName: '1HRREMINDER',
        scheduledFor: apply1HrAt
      })
      console.log(`⏰ Scheduled 1HRREMINDER tag for ${apply1HrAt.toISOString()}`)
      
    } else if (minutesUntilStart > 15) { 
      // Between 15 min - 1 hour away → Schedule 15MIN tag
      const apply15MinAt = new Date(webinarStartTime.getTime() - 15 * 60 * 1000)
      await scheduleDelayedClickFunnelsTag({
        registrationId,
        tagName: '15MINREMINDER',
        scheduledFor: apply15MinAt
      })
      console.log(`⏰ Scheduled 15MINREMINDER tag for ${apply15MinAt.toISOString()}`)
      
    } else if (minutesUntilStart >= 0) {
      // Less than 15 minutes away → Apply WESTARTED immediately
      const { applyReminderTagToContact } = await import('./clickfunnels')
      await applyReminderTagToContact(email, 'WESTARTED')
      console.log(`✅ Applied WESTARTED tag immediately (webinar starting soon)`)
    }

    console.log(`✅ ClickFunnels tag scheduled successfully for ${email}`)
  } catch (error) {
    console.error('❌ Failed to schedule registration tag:', error)
  }
}

/**
 * Schedule reminders for a new registration
 * Creates reminder records for all applicable templates
 */
export async function scheduleRemindersForRegistration(
  registrationId: string
): Promise<void> {
  try {
    // Get registration details
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        webinar: {
          include: {
            reminderTemplates: {
              where: { isActive: true }
            }
          }
        }
      }
    })

    if (!registration || !registration.scheduledStartTime) {
      console.log('⚠️ Registration not found or no scheduled time')
      return
    }

    const webinarStartTime = new Date(registration.scheduledStartTime)
    const now = new Date()

    console.log('📅 Scheduling reminders for registration:', {
      registrationId,
      webinarStartTime: webinarStartTime.toISOString(),
      templateCount: registration.webinar.reminderTemplates.length
    })

    // Schedule ClickFunnels registration tags (queued for cron job to apply at appropriate times)
    await applyRegistrationTag(registration.email, webinarStartTime, registration.id)

    // Create reminder records for each template
    const remindersToCreate: any[] = []

    for (const template of registration.webinar.reminderTemplates) {
      // Skip if no minutesBefore set
      if (!template.minutesBefore) continue
      
      // Calculate when this reminder should be sent
      const scheduledFor = new Date(webinarStartTime.getTime() - template.minutesBefore * 60 * 1000)

      // Only schedule if the reminder time is in the future
      if (scheduledFor > now) {
        remindersToCreate.push({
          templateId: template.id,
          registrationId: registration.id,
          scheduledFor,
          status: 'PENDING',
          channel: template.channel
        })

        console.log(`  ⏰ Scheduled reminder: ${template.minutesBefore} minutes before (${scheduledFor.toISOString()})`)
      } else {
        console.log(`  ⏭️  Skipped reminder: ${template.minutesBefore} minutes before (time has passed)`)
      }
    }

    if (remindersToCreate.length > 0) {
      await prisma.webinarReminderSent.createMany({
        data: remindersToCreate
      })

      console.log(`✅ Scheduled ${remindersToCreate.length} reminders`)
    }
  } catch (error) {
    console.error('❌ Failed to schedule reminders:', error)
    throw error
  }
}

/**
 * Schedule post-webinar reminders for a registration after their viewing session ends
 * This is called when the user finishes watching, leaves the webinar, or session times out
 */
export async function schedulePostWebinarRemindersForSession(
  registrationId: string,
  watchedMinutes: number,
  watchedPercentage: number
): Promise<void> {
  try {
    console.log('📅 Scheduling post-webinar reminders for session:', {
      registrationId,
      watchedMinutes: Math.round(watchedMinutes),
      watchedPercentage: Math.round(watchedPercentage)
    })

    // Get registration details with post-webinar reminder templates
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        webinar: {
          include: {
            reminderTemplates: {
              where: { 
                isActive: true,
                type: 'post_webinar'
              }
            }
          }
        }
      }
    })

    if (!registration) {
      console.log('⚠️ Registration not found')
      return
    }

    if (registration.webinar.reminderTemplates.length === 0) {
      console.log('ℹ️ No active post-webinar reminder templates found')
      return
    }

    const now = new Date()
    const remindersToCreate: any[] = []

    for (const template of registration.webinar.reminderTemplates) {
      // Check if user watched enough to qualify for this reminder
      const meetsMinutesRequirement = !template.minWatchedMinutes || watchedMinutes >= template.minWatchedMinutes
      const meetsPercentageRequirement = !template.minWatchedPercentage || watchedPercentage >= template.minWatchedPercentage

      if (!meetsMinutesRequirement) {
        console.log(`  ⏭️ Skipped: User watched ${Math.round(watchedMinutes)} min, need ${template.minWatchedMinutes} min`)
        continue
      }

      if (!meetsPercentageRequirement) {
        console.log(`  ⏭️ Skipped: User watched ${Math.round(watchedPercentage)}%, need ${template.minWatchedPercentage}%`)
        continue
      }

      // Calculate when to send (X minutes after session end)
      const minutesAfter = template.minutesAfter || 0
      const scheduledFor = new Date(now.getTime() + minutesAfter * 60 * 1000)

      // Check if this reminder was already scheduled (avoid duplicates)
      const existingReminder = await prisma.webinarReminderSent.findFirst({
        where: {
          templateId: template.id,
          registrationId: registration.id
        }
      })

      if (existingReminder) {
        console.log(`  ⏭️ Skipped: Reminder already scheduled for template ${template.id}`)
        continue
      }

      remindersToCreate.push({
        templateId: template.id,
        registrationId: registration.id,
        scheduledFor,
        status: 'PENDING',
        channel: template.channel
      })

      console.log(`  ⏰ Scheduled post-webinar reminder: ${minutesAfter} minutes after session end (${scheduledFor.toISOString()})`)
    }

    if (remindersToCreate.length > 0) {
      await prisma.webinarReminderSent.createMany({
        data: remindersToCreate
      })

      console.log(`✅ Scheduled ${remindersToCreate.length} post-webinar reminders`)
    } else {
      console.log('ℹ️ No post-webinar reminders to schedule (already scheduled or requirements not met)')
    }
  } catch (error) {
    console.error('❌ Failed to schedule post-webinar reminders:', error)
    // Don't throw - we don't want to break the session end flow
  }
}

/**
 * Replace placeholders in email template
 */
function replacePlaceholders(
  template: string,
  data: {
    name: string
    email: string
    webinarTitle: string
    webinarTime: string
    countdownLink: string
    referralLink: string
    webinarTimezone: string
  }
): string {
  return template
    .replace(/\{\{name\}\}/g, data.name)
    .replace(/\{\{email\}\}/g, data.email)
    .replace(/\{\{webinarTitle\}\}/g, data.webinarTitle)
    .replace(/\{\{webinarTime\}\}/g, data.webinarTime)
    .replace(/\{\{countdownLink\}\}/g, data.countdownLink)
    .replace(/\{\{referralLink\}\}/g, data.referralLink)
    .replace(/\{\{webinarTimezone\}\}/g, data.webinarTimezone)
}

/**
 * Format webinar time in user's timezone
 */
function formatWebinarTime(
  startTime: Date,
  timezone?: string | null
): string {
  try {
    if (timezone) {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        dateStyle: 'full',
        timeStyle: 'long'
      }).format(startTime)
    }
  } catch (error) {
    console.error('Failed to format time in timezone:', timezone, error)
  }

  // Fallback to UTC
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone: 'UTC'
  }).format(startTime)
}

/**
 * Build placeholder data shared between email and SMS
 */
function buildReminderPlaceholders(registration: any, webinar: any) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'https://emaanpowerclasses.com'

  const countdownLink = webinar.slug
    ? `${baseUrl}/countdown/${webinar.slug}?r=${registration.id}${
        registration.scheduleId ? `&s=${registration.scheduleId}` : ''
      }`
    : `${baseUrl}/countdown`

  const referralLink =
    webinar.slug && registration.referralCode
      ? `${baseUrl}/w/${webinar.slug}?ref=${registration.referralCode}`
      : `${baseUrl}/w/${webinar.slug}`

  const webinarTime = formatWebinarTime(
    new Date(registration.scheduledStartTime),
    registration.timezone
  )

  return {
    name: registration.name,
    email: registration.email,
    webinarTitle: webinar.title,
    webinarTime,
    countdownLink,
    referralLink,
    webinarTimezone: registration.timezone || 'UTC'
  }
}

/**
 * Send a reminder email without updating the reminder status
 */
async function sendReminderEmailMessage(
  reminderId: string,
  registration: any,
  template: any,
  placeholders: ReturnType<typeof buildReminderPlaceholders>
): Promise<{ success: boolean; error?: string }> {
  try {
    const subject = replacePlaceholders(template.emailSubject, placeholders)
    const body = replacePlaceholders(template.emailBody, placeholders)

    console.log('📧 Sending reminder email', {
      reminderId,
      to: registration.email,
      subject
    })

    const success = await sendEmail({
      to: registration.email,
      subject,
      htmlBody: body
    })

    if (success) {
      console.log('✅ Reminder email sent', {
        reminderId,
        to: registration.email,
        subject
      })
      return { success: true }
    }

    console.error('⚠️ Reminder email failed', { reminderId })
    return { success: false, error: 'Email sending failed' }
  } catch (error: any) {
    console.error('⚠️ Reminder email error', {
      reminderId,
      error: error?.message || error
    })
    return {
      success: false,
      error: error?.message || 'Email sending exception'
    }
  }
}

/**
 * Normalize phone numbers (digits + optional leading +)
 */
function normalizePhoneNumber(phone?: string | null): string | null {
  if (!phone) {
    return null
  }

  const normalized = phone.trim().replace(/[^\d+]/g, '')
  if (!normalized) {
    return null
  }

  return normalized
}

/**
 * Send a reminder SMS via ClickSend
 */
async function sendReminderSMSMessage(
  reminderId: string,
  registration: any,
  template: any,
  placeholders: ReturnType<typeof buildReminderPlaceholders>
): Promise<{ success: boolean; error?: string; to?: string }> {
  if (!template.smsBody?.trim()) {
    return { success: false, error: 'SMS body is missing' }
  }

  const normalizedPhone = normalizePhoneNumber(registration.phone)

  if (!normalizedPhone) {
    return { success: false, error: 'Registration is missing a valid phone number' }
  }

  const body = replacePlaceholders(template.smsBody, placeholders)

  const { success, error } = await sendClickSendSMS(normalizedPhone, body)

  if (success) {
    console.log('📱 Reminder SMS sent', {
      reminderId,
      to: normalizedPhone
    })
    return { success: true, to: normalizedPhone }
  }

  console.error('⚠️ Reminder SMS failed', {
    reminderId,
    to: normalizedPhone,
    error
  })
  return { success: false, error: error || 'ClickSend SMS failed' }
}

/**
 * Process pending reminders
 * This should be called by a cron job every few minutes
 */
export async function processPendingReminders(): Promise<{
  processed: number
  sent: number
  failed: number
  skipped: number
}> {
  const stats = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0
  }

  try {
    // Get all pending reminders that are due
    const now = new Date()
    const pendingReminders = await prisma.webinarReminderSent.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: {
          lte: now
        }
      },
      include: {
        template: true,
        registration: {
          include: {
            webinar: true
          }
        }
      },
      take: 50 // Process in batches to avoid overwhelming the system
    })

    console.log(`📬 Processing ${pendingReminders.length} pending reminders...`)

    for (const reminder of pendingReminders) {
      stats.processed++

      // Check if webinar has already started or passed
      // BUT: Only skip pre-webinar reminders if time has passed
      // Post-webinar reminders should be sent AFTER the webinar
      if (!reminder.registration.scheduledStartTime) {
        stats.skipped++
        continue
      }
      
      const webinarStart = new Date(reminder.registration.scheduledStartTime)
      
      // Only skip pre-webinar reminders if webinar has already started
      if (reminder.template?.type === 'pre_webinar' && webinarStart <= now) {
        // Mark as skipped
        await prisma.webinarReminderSent.update({
          where: { id: reminder.id },
          data: {
            status: 'SKIPPED',
            errorMessage: 'Webinar time has passed'
          }
        })
        stats.skipped++
        continue
      }

      const placeholders = buildReminderPlaceholders(
        reminder.registration,
        reminder.registration.webinar
      )

      const shouldSendEmail =
        reminder.channel === 'EMAIL' || reminder.channel === 'BOTH'
      const shouldSendSMS =
        reminder.channel === 'SMS' || reminder.channel === 'BOTH'

      let emailResult: { success: boolean; error?: string } = { success: true }
      if (shouldSendEmail) {
        emailResult = await sendReminderEmailMessage(
          reminder.id,
          reminder.registration,
          reminder.template,
          placeholders
        )
      }

      let smsResult: { success: boolean; error?: string; to?: string } = {
        success: true
      }
      if (shouldSendSMS) {
        smsResult = await sendReminderSMSMessage(
          reminder.id,
          reminder.registration,
          reminder.template,
          placeholders
        )
      }

      const channelSuccess =
        (shouldSendEmail ? emailResult.success : true) &&
        (shouldSendSMS ? smsResult.success : true)

      let tagResult: { success: boolean; error?: string } = { success: true }
      if (
        channelSuccess &&
        reminder.template &&
        reminder.template.applyClickFunnelsTag &&
        reminder.template.clickFunnelsTag
      ) {
        const { applyReminderTagToContact } = await import('./clickfunnels')
        const tagSuccess = await applyReminderTagToContact(
          reminder.registration.email,
          reminder.template.clickFunnelsTag
        )
        tagResult = {
          success: tagSuccess,
          error: tagSuccess
            ? undefined
            : `Failed to apply ClickFunnels tag "${reminder.template.clickFunnelsTag}"`
        }
      } else if (
        reminder.template?.applyClickFunnelsTag &&
        !channelSuccess
      ) {
        console.log(
          '⚠️ Skipping ClickFunnels tag because reminder channels failed',
          {
            reminderId: reminder.id
          }
        )
      }

      const overallSuccess = channelSuccess && tagResult.success
      const errors: string[] = []
      if (!emailResult.success) {
        errors.push(emailResult.error || 'Email sending failed')
      }
      if (!smsResult.success) {
        errors.push(smsResult.error || 'SMS sending failed')
      }
      if (!tagResult.success) {
        errors.push(tagResult.error || 'ClickFunnels tag failed')
      }

      const reminderUpdate: any = {
        status: overallSuccess ? 'SENT' : 'FAILED',
        ...(overallSuccess ? { sentAt: new Date(), errorMessage: null } : {})
      }

      if (shouldSendEmail) {
        reminderUpdate.emailSentTo = emailResult.success
          ? reminder.registration.email
          : null
      }

      if (shouldSendSMS) {
        reminderUpdate.smsSentTo = smsResult.success
          ? smsResult.to
          : null
      }

      if (!overallSuccess) {
        reminderUpdate.errorMessage =
          errors.length > 0 ? errors.join(' | ') : 'Reminder delivery failed'
        reminderUpdate.retryCount = { increment: 1 }
        reminderUpdate.lastRetryAt = new Date()
      }

      await prisma.webinarReminderSent.update({
        where: { id: reminder.id },
        data: reminderUpdate
      })

      if (overallSuccess) {
        stats.sent++
        console.log('✅ Reminder processed successfully', {
          reminderId: reminder.id,
          registrationId: reminder.registrationId,
          channels: reminder.channel,
          tag: reminder.template?.applyClickFunnelsTag
            ? reminder.template.clickFunnelsTag
            : 'N/A'
        })
      } else {
        stats.failed++
        console.error('⚠️ Reminder processing failed', {
          reminderId: reminder.id,
          errors
        })
      }
    }

    console.log('✅ Reminder processing complete:', stats)
    return stats
  } catch (error) {
    console.error('❌ Failed to process reminders:', error)
    throw error
  }
}

/**
 * Cancel all reminders for a registration
 * (e.g., if user unregisters)
 */
export async function cancelRemindersForRegistration(
  registrationId: string
): Promise<void> {
  await prisma.webinarReminderSent.updateMany({
    where: {
      registrationId,
      status: 'PENDING'
    },
    data: {
      status: 'CANCELLED'
    }
  })

  console.log('🚫 Cancelled reminders for registration:', registrationId)
}

/**
 * Get reminder statistics for a webinar
 */
export async function getWebinarReminderStats(webinarId: string) {
  const stats = await prisma.webinarReminderSent.groupBy({
    by: ['status'],
    where: {
      registration: {
        webinarId
      }
    },
    _count: true
  })

  return stats.reduce((acc: Record<string, number>, stat: any) => {
    acc[stat.status] = stat._count
    return acc
  }, {} as Record<string, number>)
}
