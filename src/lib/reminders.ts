// Webinar Reminder System
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { sendClickSendSMS } from '@/lib/clicksend'

interface ReminderTemplateData {
  minutesBefore: number
  channel: 'EMAIL' | 'SMS' | 'BOTH'
  emailSubject: string
  emailBody: string
  smsBody?: string
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
      minutesBefore: data.minutesBefore,
      channel: data.channel,
      emailSubject: data.emailSubject,
      emailBody: data.emailBody,
      smsBody: data.smsBody,
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
  data: Partial<ReminderTemplateData>
) {
  const updateData: Partial<ReminderTemplateData> = { ...data }

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
 * Only ONE tag is applied based on the time before webinar
 */
export async function applyRegistrationTag(
  email: string,
  webinarStartTime: Date
): Promise<void> {
  try {
    const now = new Date()
    const minutesUntilStart = Math.floor((webinarStartTime.getTime() - now.getTime()) / (1000 * 60))

    // Determine which tag to apply based on registration time
    let tagToApply: string | null = null

    if (minutesUntilStart >= 1440) { // 24 hours or more
      tagToApply = '24HRREMINDER'
    } else if (minutesUntilStart >= 120) { // 2 hours or more
      tagToApply = '2HRREMINDER'
    } else if (minutesUntilStart >= 60) { // 1 hour or more
      tagToApply = '1HRREMINDER'
    } else if (minutesUntilStart >= 15) { // 15 minutes or more
      tagToApply = '15MINREMINDER'
    } else if (minutesUntilStart >= 0) { // Less than 15 minutes but not started
      tagToApply = 'WESTARTED'
    }

    if (tagToApply) {
      console.log(`🏷️  Applying registration tag "${tagToApply}" to ${email} (${minutesUntilStart} minutes until start)`)
      
      const { applyReminderTagToContact } = await import('./clickfunnels')
      const success = await applyReminderTagToContact(email, tagToApply)
      
      if (success) {
        console.log(`✅ Registration tag "${tagToApply}" applied successfully`)
      } else {
        console.log(`❌ Failed to apply registration tag "${tagToApply}"`)
      }
    }
  } catch (error) {
    console.error('❌ Failed to apply registration tag:', error)
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

    // Apply ClickFunnels registration tag immediately
    await applyRegistrationTag(registration.email, webinarStartTime)

    // Create reminder records for each template
    const remindersToCreate: any[] = []

    for (const template of registration.webinar.reminderTemplates) {
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
    'https://webinar-platform-production.up.railway.app'

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
      if (!reminder.registration.scheduledStartTime) {
        stats.skipped++
        continue
      }
      
      const webinarStart = new Date(reminder.registration.scheduledStartTime)
      if (webinarStart <= now) {
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

      let tagResult = { success: true }
      if (
        channelSuccess &&
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
        reminder.template.applyClickFunnelsTag &&
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
          tag: reminder.template.applyClickFunnelsTag
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

  return stats.reduce((acc, stat) => {
    acc[stat.status] = stat._count
    return acc
  }, {} as Record<string, number>)
}
