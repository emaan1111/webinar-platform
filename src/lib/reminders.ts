// Webinar Reminder System
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

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
 * Send a reminder email
 */
async function sendReminderEmail(
  reminderId: string,
  registration: any,
  template: any,
  webinar: any
): Promise<boolean> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yoursite.com'
    
    // Build countdown link
    const countdownLink = webinar.slug
      ? `${baseUrl}/countdown/${webinar.slug}?r=${registration.id}${registration.scheduleId ? `&s=${registration.scheduleId}` : ''}`
      : `${baseUrl}/countdown`

    // Build referral link
    const referralLink = webinar.slug && registration.referralCode
      ? `${baseUrl}/w/${webinar.slug}?ref=${registration.referralCode}`
      : `${baseUrl}/w/${webinar.slug}`

    // Format webinar time
    const webinarTime = formatWebinarTime(
      new Date(registration.scheduledStartTime),
      registration.timezone
    )

    // Replace placeholders
    const emailData = {
      name: registration.name,
      email: registration.email,
      webinarTitle: webinar.title,
      webinarTime,
      countdownLink,
      referralLink,
      webinarTimezone: registration.timezone || 'UTC'
    }

    const subject = replacePlaceholders(template.emailSubject, emailData)
    const body = replacePlaceholders(template.emailBody, emailData)

    // Send email (if channel includes EMAIL)
    let emailSuccess = true
    if (template.channel === 'EMAIL' || template.channel === 'BOTH') {
      emailSuccess = await sendEmail({
        to: registration.email,
        subject,
        htmlBody: body
      })
    }

    // Apply ClickFunnels tag (if configured)
    let tagSuccess = true
    if (template.applyClickFunnelsTag && template.clickFunnelsTag) {
      const { applyReminderTagToContact } = await import('./clickfunnels')
      tagSuccess = await applyReminderTagToContact(
        registration.email,
        template.clickFunnelsTag
      )
    }

    const overallSuccess = emailSuccess && tagSuccess

    if (overallSuccess) {
      // Update reminder status
      await prisma.webinarReminderSent.update({
        where: { id: reminderId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          emailSentTo: registration.email
        }
      })

      console.log('✅ Reminder sent successfully:', {
        reminderId,
        email: registration.email,
        subject,
        tagApplied: template.applyClickFunnelsTag ? template.clickFunnelsTag : 'N/A'
      })

      return true
    } else {
      // Mark as failed
      await prisma.webinarReminderSent.update({
        where: { id: reminderId },
        data: {
          status: 'FAILED',
          errorMessage: 'Email sending failed',
          retryCount: { increment: 1 },
          lastRetryAt: new Date()
        }
      })

      return false
    }
  } catch (error: any) {
    console.error('❌ Failed to send reminder:', error)

    // Update reminder with error
    await prisma.webinarReminderSent.update({
      where: { id: reminderId },
      data: {
        status: 'FAILED',
        errorMessage: error.message || 'Unknown error',
        retryCount: { increment: 1 },
        lastRetryAt: new Date()
      }
    })

    return false
  }
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

      // Send the reminder
      if (reminder.channel === 'EMAIL' || reminder.channel === 'BOTH') {
        const success = await sendReminderEmail(
          reminder.id,
          reminder.registration,
          reminder.template,
          reminder.registration.webinar
        )

        if (success) {
          stats.sent++
        } else {
          stats.failed++
        }
      }

      // TODO: Add SMS sending if channel is SMS or BOTH
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
