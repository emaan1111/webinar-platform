import { prisma } from '@/lib/prisma'
import { applyReminderTagToContact } from '@/lib/clickfunnels'
import { tagMauticContact } from '@/lib/mautic'

const RETRY_DELAY_MINUTES = 5
const MAX_ATTEMPTS = 5

// Global kill-switch: ClickFunnels is no longer used. Scheduling new ClickFunnels
// reminder tags no-ops unless CLICKFUNNELS_ENABLED=true is explicitly set.
// (processPendingClickFunnelsReminderTags is NOT gated — the same table also holds
// Mautic reminder tags, which must keep processing.)
const CLICKFUNNELS_ENABLED = process.env.CLICKFUNNELS_ENABLED === 'true'

const isMissingReminderTableError = (error: any) => {
  const message = error?.message?.toString?.() || ''
  return error?.code === 'P2021' || message.includes('clickfunnels_reminder_tags')
}

export async function scheduleDelayedClickFunnelsTag(options: {
  registrationId: string
  tagName: string
  scheduledFor: Date
}) {
  if (!CLICKFUNNELS_ENABLED) {
    console.log('ClickFunnels disabled — skipping scheduleDelayedClickFunnelsTag')
    return
  }

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
            email: true,
            webinar: {
              select: {
                crmIntegration: true
              }
            }
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
    
    const email = tagJob.registration?.email
    const crmIntegration = tagJob.registration?.webinar?.crmIntegration || 'CLICKFUNNELS'
    
    if (!email) {
      stats.failed++
      continue
    }
    
    let success = false
    
    if (crmIntegration === 'NONE') {
      // Skip CRM tagging but mark as processed
      success = true
      console.log(`ℹ️ CRM disabled for webinar; skipping tag ${tagJob.tagName}`)
    } else if (crmIntegration === 'MAUTIC') {
      success = await tagMauticContact(email, [tagJob.tagName])
    } else {
      success = await applyReminderTagToContact(email, tagJob.tagName)
    }

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

// ============ MAUTIC REMINDER TAGS ============

export async function scheduleDelayedMauticTag(options: {
  registrationId: string
  tagName: string
  scheduledFor: Date
}) {
  const { registrationId, tagName, scheduledFor } = options

  if (Number.isNaN(scheduledFor.getTime())) {
    console.warn('⚠️ Invalid scheduled time for Mautic tag', {
      registrationId,
      tagName,
      scheduledFor
    })
    return
  }

  if (scheduledFor <= new Date()) {
    console.log('⚠️ Scheduled Mautic tag time already passed; applying immediately', {
      registrationId,
      tagName
    })
    await applyMauticTagForRegistration(registrationId, tagName)
    return
  }

  // Use the same table but we can differentiate by querying webinar's crmIntegration
  // Or add a crmType column. For now, store in same table and check at processing time.
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

    console.log('⏳ Scheduled Mautic tag application', {
      registrationId,
      tagName,
      scheduledFor: scheduledFor.toISOString()
    })
  } catch (error) {
    if (isMissingReminderTableError(error)) {
      console.warn('⚠️ Reminder tag table missing; skipping schedule (run prisma migrations)', {
        registrationId,
        tagName
      })
      return
    }
    console.error('❌ Failed to schedule Mautic reminder tag:', error)
    throw error
  }
}

async function applyMauticTagForRegistration(registrationId: string, tagName: string) {
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: { id: true, email: true }
  })

  if (!registration?.email) {
    console.warn('⚠️ Cannot apply Mautic tag; registration/email missing', {
      registrationId,
      tagName
    })
    return
  }

  const success = await tagMauticContact(registration.email, [tagName])

  if (success) {
    console.log('✅ Mautic tag applied immediately for registration', {
      registrationId,
      tagName
    })
  } else {
    console.error('❌ Failed to apply Mautic tag immediately', {
      registrationId,
      tagName
    })
  }
}
