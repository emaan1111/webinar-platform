import { prisma } from '@/lib/prisma'
import { applyReminderTagToContact } from '@/lib/clickfunnels'

const RETRY_DELAY_MINUTES = 5
const MAX_ATTEMPTS = 5

const isMissingReminderTableError = (error: any) => {
  const message = error?.message?.toString?.() || ''
  return error?.code === 'P2021' || message.includes('clickfunnels_reminder_tags')
}

export async function scheduleDelayedClickFunnelsTag(options: {
  registrationId: string
  tagName: string
  scheduledFor: Date
}) {
  const { registrationId, tagName, scheduledFor } = options

  if (Number.isNaN(scheduledFor.getTime())) {
    console.warn('⚠️ Invalid scheduled time for ClickFunnels tag', {
      registrationId,
      tagName,
      scheduledFor
    })
    return
  }

  if (scheduledFor <= new Date()) {
    console.log('⚠️ Scheduled ClickFunnels tag time already passed; applying immediately', {
      registrationId,
      tagName
    })
    await applyTagForRegistration(registrationId, tagName)
    return
  }

  try {
    await prisma.clickFunnelsReminderTag.upsert({
      where: {
        registrationId_tagName: {
          registrationId,
          tagName
        }
      },
      create: {
        registrationId,
        tagName,
        scheduledFor,
        status: 'PENDING'
      },
      update: {
        scheduledFor,
        status: 'PENDING',
        errorMessage: null
      }
    })

    console.log('⏳ Scheduled ClickFunnels tag application', {
      registrationId,
      tagName,
      scheduledFor: scheduledFor.toISOString()
    })
  } catch (error) {
    if (isMissingReminderTableError(error)) {
      console.warn('⚠️ ClickFunnels reminder tag table missing; skipping schedule (run prisma migrations)', {
        registrationId,
        tagName
      })
      return
    }
    console.error('❌ Failed to schedule ClickFunnels reminder tag:', error)
    throw error
  }
}

export async function processPendingClickFunnelsReminderTags(limit = 50) {
  const stats = { processed: 0, applied: 0, failed: 0 }

  let pendingTags
  const now = new Date()

  try {
    pendingTags = await prisma.clickFunnelsReminderTag.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: {
          lte: now
        }
      },
      include: {
        registration: {
          select: {
            id: true,
            email: true
          }
        }
      },
      orderBy: {
        scheduledFor: 'asc'
      },
      take: limit
    })
  } catch (error) {
    if (isMissingReminderTableError(error)) {
      console.warn('⚠️ ClickFunnels reminder tag table missing; skipping processing (run prisma migrations)')
      return stats
    }
    throw error
  }

  for (const tagJob of pendingTags) {
    stats.processed++
    const success = tagJob.registration?.email
      ? await applyReminderTagToContact(tagJob.registration.email, tagJob.tagName)
      : false

    if (success) {
      stats.applied++
      try {
        await prisma.clickFunnelsReminderTag.update({
          where: { id: tagJob.id },
          data: {
            status: 'SENT',
            appliedAt: new Date(),
            attempts: tagJob.attempts + 1,
            errorMessage: null
          }
        })
      } catch (error) {
        if (isMissingReminderTableError(error)) {
          console.warn('⚠️ Reminder tag table missing during update; stopping processing')
          return stats
        }
        throw error
      }
    } else {
      stats.failed++
      const attempts = tagJob.attempts + 1
      const shouldFail = attempts >= MAX_ATTEMPTS
      try {
        await prisma.clickFunnelsReminderTag.update({
          where: { id: tagJob.id },
          data: {
            attempts,
            status: shouldFail ? 'FAILED' : 'PENDING',
            errorMessage: 'Failed to apply ClickFunnels tag. See logs for details.',
            scheduledFor: shouldFail
              ? tagJob.scheduledFor
              : new Date(now.getTime() + RETRY_DELAY_MINUTES * 60 * 1000)
          }
        })
      } catch (error) {
        if (isMissingReminderTableError(error)) {
          console.warn('⚠️ Reminder tag table missing during update; stopping processing')
          return stats
        }
        throw error
      }
    }
  }

  return stats
}

async function applyTagForRegistration(registrationId: string, tagName: string) {
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: { id: true, email: true }
  })

  if (!registration?.email) {
    console.warn('⚠️ Cannot apply ClickFunnels tag; registration/email missing', {
      registrationId,
      tagName
    })
    return
  }

  const success = await applyReminderTagToContact(registration.email, tagName)

  if (success) {
    console.log('✅ ClickFunnels tag applied immediately for registration', {
      registrationId,
      tagName
    })
  } else {
    console.error('❌ Failed to apply ClickFunnels tag immediately', {
      registrationId,
      tagName
    })
  }
}
