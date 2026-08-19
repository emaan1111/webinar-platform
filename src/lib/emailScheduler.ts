/**
 * Reminder & Follow-Up Email Scheduling + Sending
 *
 * This module:
 * 1. Schedules reminder email sends when a registration is created
 * 2. Schedules follow-up email sends when a webinar ends
 * 3. Processes pending sends (called by cron)
 */

import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { getUnsubscribeLink, prepareEmailHtml, formatWebinarTime, type MergeTagContext } from '@/lib/emailTracking'

function isEmailUnsubscribed(registration: unknown): boolean {
  if (!registration || typeof registration !== 'object') return false
  return Boolean((registration as { emailUnsubscribed?: boolean }).emailUnsubscribed)
}

// ─── Schedule reminder emails for a new registration ────────────────────────

export async function scheduleReminderEmails(registrationId: string, isExternal = false) {
  let registration: any
  let webinar: any
  let webinarStart: Date | null = null

  if (isExternal) {
    registration = await prisma.externalWebinarRegistration.findUnique({
      where: { id: registrationId },
      include: {
        externalWebinar: {
          select: {
            id: true,
            externalWebinarName: true,
            // externalWebinar doesn't have reminderEmailSource, default to internal
          },
        },
        schedule: true,
      },
    })
    
    if (!registration || !registration.externalWebinar) return
    webinar = registration.externalWebinar
    webinarStart = registration.scheduledStartTime || registration.schedule?.scheduledTime
  } else {
    registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        webinar: {
          select: {
            id: true,
            title: true,
            slug: true,
            reminderEmailSource: true,
            schedules: {
              where: { isActive: true },
              take: 1,
              orderBy: { scheduledAt: 'asc' },
            },
          },
        },
      },
    })
    if (!registration || !registration.webinar) return
    if (registration.webinar.reminderEmailSource !== 'internal') return
    if (isEmailUnsubscribed(registration)) return
    
    webinar = registration.webinar
    const schedule = webinar.schedules[0]
    webinarStart = registration.scheduledStartTime || schedule?.scheduledAt
  }

  if (!webinarStart) return

  // Find all active reminder email templates
  const templates = await prisma.reminderEmailTemplate.findMany({
    where: isExternal ? { externalWebinarId: webinar.id, isActive: true } : { webinarId: webinar.id, isActive: true },
  })

  if (templates.length === 0) return

  const now = new Date()

  for (const template of templates) {
    const sendAt = new Date(webinarStart.getTime() - template.minutesBefore * 60 * 1000)

    // Don't schedule if the time has already passed
    if (sendAt <= now) continue

    // Check if already scheduled
    const existing = await prisma.reminderEmailSend.findFirst({
      where: Object.assign(
        { templateId: template.id },
        isExternal ? { externalRegistrationId: registration.id } : { registrationId: registration.id }
      ),
    })
    if (existing) continue

    await prisma.reminderEmailSend.create({
      data: {
        templateId: template.id,
        registrationId: isExternal ? null : registration.id,
        externalRegistrationId: isExternal ? registration.id : null,
        to: registration.email,
        subject: template.subject,
        abVariant: template.subjectB ? (Math.random() < 0.5 ? 'A' : 'B') : 'A',
        status: 'PENDING',
        scheduledFor: sendAt,
      },
    })
  }
}

// ─── Schedule follow-up emails after webinar session ends ───────────────────
// Mirrors the attendance tagging pattern: finds registrations whose
// scheduledStartTime + duration has passed, then creates follow-up sends
// based on audience type (missed, attended, mostly_attended, partly_attended).

export async function processEndedSessionsForFollowUpEmails(): Promise<{
  scheduled: number
  registrationsChecked: number
  webinarsProcessed: number
}> {
  const now = new Date()
  let scheduled = 0
  const webinarsProcessed = new Set<string>()

  // Only process sessions that ended within the last 7 days to avoid
  // sending stale follow-ups to old registrations
  const cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Find registrations where session has ended and we haven't processed follow-ups
  // Same pattern as processEndedWebinarsForAttendanceTags
  const registrations = await prisma.registration.findMany({
    where: {
      scheduledStartTime: { not: null, gte: cutoffDate },
      webinar: {
        duration: { gt: 0 },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      attended: true,
      firstJoinedAt: true,
      leftAt: true,
      watchedReplay: true,
      emailUnsubscribed: true,
      replayWatchTime: true,
      scheduledStartTime: true,
      hasPurchased: true,
      lastWatchedPosition: true,
      sessions: {
        select: { watchDuration: true, totalWatchTime: true },
      },
      webinar: {
        select: {
          id: true,
          title: true,
          slug: true,
          duration: true,
          mostlyAttendedThreshold: true,
        },
      },
    },
    take: 500,
  })

  if (registrations.length === 0) return { scheduled: 0, registrationsChecked: 0, webinarsProcessed: 0 }

  // Filter to sessions that have ended
  const endedRegs = registrations.filter((reg) => {
    if (!reg.scheduledStartTime || !reg.webinar.duration) return false
    const sessionEnd = new Date(reg.scheduledStartTime.getTime() + reg.webinar.duration * 60 * 1000)
    return sessionEnd <= now
  })

  if (endedRegs.length === 0) return { scheduled: 0, registrationsChecked: 0, webinarsProcessed: 0 }

  // Group by webinar to batch template lookup
  const byWebinar = new Map<string, typeof endedRegs>()
  for (const reg of endedRegs) {
    const list = byWebinar.get(reg.webinar.id) || []
    list.push(reg)
    byWebinar.set(reg.webinar.id, list)
  }

  for (const [webinarId, regs] of byWebinar) {
    const templates = await prisma.followUpEmailTemplate.findMany({
      where: { webinarId, isActive: true },
    })
    if (templates.length === 0) continue

    for (const template of templates) {
      // Get all existing sends for this template in one query
      const existingSends = await prisma.followUpEmailSend.findMany({
        where: {
          templateId: template.id,
          registrationId: { in: regs.map((r) => r.id) },
        },
        select: { registrationId: true },
      })
      const alreadyScheduled = new Set(existingSends.map((s) => s.registrationId))

      for (const reg of regs) {
        if (alreadyScheduled.has(reg.id)) continue
        if (reg.emailUnsubscribed) continue
        if (!matchesAudience(reg, template.audienceType)) continue

        // Calculate send time from when the session ended + delayMinutes
        const sessionEnd = new Date(reg.scheduledStartTime!.getTime() + reg.webinar.duration! * 60 * 1000)
        const sendAt = new Date(sessionEnd.getTime() + template.delayMinutes * 60 * 1000)

        await prisma.followUpEmailSend.create({
          data: {
            templateId: template.id,
            registrationId: reg.id,
            to: reg.email,
            subject: template.subject,
            abVariant: template.subjectB ? (Math.random() < 0.5 ? 'A' : 'B') : 'A',
            status: 'PENDING',
            scheduledFor: sendAt,
          },
        })
        scheduled++
      }
    }
    webinarsProcessed.add(webinarId)
  }

  if (scheduled > 0) {
    console.log(`📧 Scheduled ${scheduled} follow-up emails for ${webinarsProcessed.size} webinar(s)`)
  }

  return { scheduled, registrationsChecked: endedRegs.length, webinarsProcessed: webinarsProcessed.size }
}

// Legacy wrapper — kept for backward compatibility
export async function scheduleFollowUpEmails(webinarId: string) {
  return processEndedSessionsForFollowUpEmails()
}

// ─── Process pending reminder email sends ───────────────────────────────────

const MAX_RETRIES = 3

export async function processPendingReminderEmails() {
  const now = new Date()

  // Atomically claim a batch by moving PENDING → SENDING to prevent duplicate sends
  // from parallel cron runs. Also pick up retryable FAILED sends.
  const retryBefore = new Date(now.getTime() - 5 * 60 * 1000) // retry after 5 min backoff
  await prisma.reminderEmailSend.updateMany({
    where: {
      OR: [
        { status: 'PENDING', scheduledFor: { lte: now } },
        { status: 'FAILED', retryCount: { lt: MAX_RETRIES }, updatedAt: { lte: retryBefore } },
      ],
    },
    data: { status: 'SENDING' },
  })

  const pendingSends = await prisma.reminderEmailSend.findMany({
    where: { status: 'SENDING' },
    include: {
      template: true,
      registration: {
        include: {
          webinar: {
            select: { id: true, title: true, slug: true },
          },
        },
      },
      externalRegistration: {
        include: {
          externalWebinar: {
            select: {
              id: true,
              externalWebinarName: true,
              liveZoomLink: true,
              liveZoomAt: true,
              zoomSessionLinks: {
                select: {
                  zoomSession: {
                    select: { scheduledAt: true, zoomLink: true, isActive: true },
                  },
                },
              },
            },
          }
        }
      }
    },
    take: 50,
  })

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://emaanpowerclasses.com').replace(/\/+$/, '')

  for (const send of pendingSends) {
    try {
      const isExternal = !!send.externalRegistrationId
      const reg: any = isExternal ? send.externalRegistration : send.registration
      const webinar: any = isExternal ? reg?.externalWebinar : reg?.webinar

      if (!reg || !webinar) {
        await prisma.reminderEmailSend.update({
          where: { id: send.id },
          data: { status: 'FAILED', errorMessage: 'Missing registration or webinar relation' },
        })
        continue
      }

      // Smart skip: don't send if attendee has already joined the webinar
      if (send.template.skipIfJoined && reg.firstJoinedAt && !isExternal) {
        await prisma.reminderEmailSend.update({
          where: { id: send.id },
          data: { status: 'SKIPPED', errorMessage: 'Skipped: attendee already joined' },
        })
        console.log(`⏭️ Skipped reminder for ${send.to} (already joined)`)
        continue
      }

      if (isEmailUnsubscribed(reg)) {
        await prisma.reminderEmailSend.update({
          where: { id: send.id },
          data: { status: 'SKIPPED', errorMessage: 'Skipped: attendee unsubscribed' },
        })
        console.log(`⏭️ Skipped reminder for ${send.to} (unsubscribed)`)
        continue
      }

      // A/B subject selection
      const useSubjectB = send.abVariant === 'B' && send.template.subjectB
      const rawSubject = useSubjectB ? send.template.subjectB! : send.template.subject

      const webinarSlug = isExternal ? null : webinar.slug
      const webinarTitle = isExternal ? webinar.externalWebinarName || 'Webinar' : webinar.title

      // For external live-Zoom picks, always use the session's CURRENT Zoom link so
      // host link edits propagate to upcoming reminder emails. A registration is a
      // live-Zoom pick when its instant matches one of the webinar's linked Zoom
      // sessions (or the legacy single-pick snapshot fields).
      const regMs =
        isExternal && reg.scheduledStartTime ? new Date(reg.scheduledStartTime).getTime() : null
      const matchedZoomSession =
        regMs !== null
          ? (webinar.zoomSessionLinks || [])
              .map((l: any) => l.zoomSession)
              .find(
                (zs: any) =>
                  zs?.isActive && zs.scheduledAt && new Date(zs.scheduledAt).getTime() === regMs
              ) || null
          : null
      const isLiveZoomSlot = Boolean(
        matchedZoomSession ||
          (isExternal &&
            reg.scheduledStartTime &&
            webinar.liveZoomAt &&
            new Date(reg.scheduledStartTime).getTime() === new Date(webinar.liveZoomAt).getTime())
      )
      // Zoom slot: the matched session's CURRENT link first; then the link captured
      // at registration (it was THAT session's link); the legacy snapshot last — it
      // may describe a different session on a multi-session webinar.
      const externalRoomLink = isExternal
        ? (isLiveZoomSlot
            ? (matchedZoomSession?.zoomLink || reg.liveRoomUrl || webinar.liveZoomLink || null)
            : (reg.liveRoomUrl || webinar.liveZoomLink || null))
        : null

      // External webinars have no countdown-page slug, so fall back to the live room
      // link — otherwise templates using {{countdown_link}} render an empty href.
      const countdownLink = webinarSlug
        ? `${baseUrl}/countdown/${webinarSlug}?r=${reg.id}`
        : externalRoomLink
      // External registrants get their stored room link (the EverWebinar room, or the Zoom link
      // for a live-Zoom pick that's never registered in EverWebinar); internal use the countdown.
      const accessLink = isExternal ? externalRoomLink : countdownLink
      const calendarLink = webinarSlug ? `${baseUrl}/api/calendar/${webinarSlug}?r=${reg.id}` : null
      const referralLink = webinarSlug && reg.referralCode ? `${baseUrl}/w/${webinarSlug}?ref=${reg.referralCode}` : null

      const ctx: MergeTagContext = {
        name: reg.name,
        email: reg.email,
        webinarTitle: webinarTitle,
        webinarTime: formatWebinarTime(reg.scheduledStartTime, reg.timezone) || '',
        accessLink,
        countdownLink,
        calendarLink,
        referralLink,
        unsubscribeLink: getUnsubscribeLink(reg.id),
      }

      const { html, text } = prepareEmailHtml(send.template.htmlBody, ctx, send.id, 'reminder')
      const subject = rawSubject
        .replace(/\{\{name\}\}/gi, reg.name)
        .replace(/\{\{webinar_title\}\}/gi, webinarTitle)

      const sent = await sendEmail({
        to: send.to,
        subject,
        htmlBody: html,
        textBody: text,
        fromName: send.template.fromName || undefined,
      })

      await prisma.reminderEmailSend.update({
        where: { id: send.id },
        data: {
          status: sent ? 'SENT' : 'FAILED',
          sentAt: sent ? new Date() : undefined,
          errorMessage: sent ? undefined : 'sendEmail returned false',
          retryCount: sent ? undefined : { increment: 1 },
        },
      })

      if (sent) {
        console.log(`✅ Reminder email sent to ${send.to} (${send.template.name})`)
      } else {
        console.error(`⚠️ Reminder email failed for ${send.to}`)
      }
    } catch (err: any) {
      console.error(`❌ Error sending reminder email ${send.id}:`, err)
      await prisma.reminderEmailSend.update({
        where: { id: send.id },
        data: { status: 'FAILED', errorMessage: err.message, retryCount: { increment: 1 } },
      })
    }
  }

  return pendingSends.length
}

// ─── Process pending follow-up email sends ──────────────────────────────────

export async function processPendingFollowUpEmails() {
  const now = new Date()

  // Atomically claim a batch to prevent duplicate sends from parallel cron runs
  const retryBefore = new Date(now.getTime() - 5 * 60 * 1000)
  await prisma.followUpEmailSend.updateMany({
    where: {
      OR: [
        { status: 'PENDING', scheduledFor: { lte: now } },
        { status: 'FAILED', retryCount: { lt: MAX_RETRIES }, updatedAt: { lte: retryBefore } },
      ],
    },
    data: { status: 'SENDING' },
  })

  const pendingSends = await prisma.followUpEmailSend.findMany({
    where: { status: 'SENDING' },
    include: {
      template: true,
      registration: {
        include: {
          webinar: {
            select: { id: true, title: true, slug: true, hasReplay: true },
          },
        },
      },
      externalRegistration: {
        include: {
          externalWebinar: {
            select: { id: true, externalWebinarName: true },
          },
        },
      },
    },
    take: 50,
  })

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://emaanpowerclasses.com').replace(/\/+$/, '')

  for (const send of pendingSends) {
    try {
      const isExternal = !!send.externalRegistrationId
      const reg: any = isExternal ? send.externalRegistration : send.registration
      const webinar: any = isExternal ? reg?.externalWebinar : reg?.webinar

      if (!reg || !webinar) {
        await prisma.followUpEmailSend.update({
          where: { id: send.id },
          data: { status: 'FAILED', errorMessage: 'Missing registration or webinar relation' },
        })
        continue
      }

      // Smart skip: don't send follow-up if attendee already purchased
      if (!isExternal && send.template.skipIfPurchased && reg.hasPurchased) {
        await prisma.followUpEmailSend.update({
          where: { id: send.id },
          data: { status: 'SKIPPED', errorMessage: 'Skipped: attendee already purchased' },
        })
        console.log(`⏭️ Skipped follow-up for ${send.to} (already purchased)`)
        continue
      }

      if (isEmailUnsubscribed(reg)) {
        await prisma.followUpEmailSend.update({
          where: { id: send.id },
          data: { status: 'SKIPPED', errorMessage: 'Skipped: attendee unsubscribed' },
        })
        console.log(`⏭️ Skipped follow-up for ${send.to} (unsubscribed)`)
        continue
      }

      // A/B subject selection
      const useSubjectB = send.abVariant === 'B' && send.template.subjectB
      const rawSubject = useSubjectB ? send.template.subjectB! : send.template.subject

      const webinarSlug = isExternal ? null : webinar.slug
      const webinarTitle = isExternal ? webinar.externalWebinarName || 'Webinar' : webinar.title

      const countdownLink = webinarSlug ? `${baseUrl}/countdown/${webinarSlug}?r=${reg.id}` : null
      const accessLink = countdownLink
      const replayLink = webinarSlug && webinar.hasReplay ? `${baseUrl}/room/${webinarSlug}?r=${reg.id}` : null
      const referralLink = webinarSlug && reg.referralCode ? `${baseUrl}/w/${webinarSlug}?ref=${reg.referralCode}` : null

      // Determine attendance status label
      let attendanceStatus = 'Registered'
      if (!isExternal) {
        if (reg.attended) attendanceStatus = 'Attended'
        else if (reg.watchedReplay) attendanceStatus = 'Watched Replay'
        else if (reg.firstJoinedAt) attendanceStatus = 'Partly Attended'
        else attendanceStatus = 'Missed'
      }

      const watchTime = reg.replayWatchTime ? `${reg.replayWatchTime} minutes` : '0 minutes'

      const ctx: MergeTagContext = {
        name: reg.name,
        email: reg.email,
        webinarTitle: webinarTitle,
        webinarTime: formatWebinarTime(reg.scheduledStartTime, reg.timezone) || '',
        accessLink,
        countdownLink,
        replayLink,
        referralLink,
        attendanceStatus,
        watchTime,
        unsubscribeLink: getUnsubscribeLink(reg.id),
      }

      const { html, text } = prepareEmailHtml(send.template.htmlBody, ctx, send.id, 'followup')
      const subject = rawSubject
        .replace(/\{\{name\}\}/gi, reg.name)
        .replace(/\{\{webinar_title\}\}/gi, webinarTitle)

      const sent = await sendEmail({
        to: send.to,
        subject,
        htmlBody: html,
        textBody: text,
        fromName: send.template.fromName || undefined,
      })

      await prisma.followUpEmailSend.update({
        where: { id: send.id },
        data: {
          status: sent ? 'SENT' : 'FAILED',
          sentAt: sent ? new Date() : undefined,
          errorMessage: sent ? undefined : 'sendEmail returned false',
          retryCount: sent ? undefined : { increment: 1 },
        },
      })

      if (sent) {
        console.log(`✅ Follow-up email sent to ${send.to} (${send.template.name})`)
      } else {
        console.error(`⚠️ Follow-up email failed for ${send.to}`)
      }
    } catch (err: any) {
      console.error(`❌ Error sending follow-up email ${send.id}:`, err)
      await prisma.followUpEmailSend.update({
        where: { id: send.id },
        data: { status: 'FAILED', errorMessage: err.message, retryCount: { increment: 1 } },
      })
    }
  }

  return pendingSends.length
}

// ─── Audience matching ──────────────────────────────────────────────────────
// Uses watch time + threshold to categorize, matching the attendance tagging system.

function getEffectiveWatchTime(reg: {
  sessions?: Array<{ watchDuration: number | null; totalWatchTime: number | null }>
  replayWatchTime: number | null
  lastWatchedPosition: number | null
}): number {
  const sessionWatchTime = (reg.sessions || []).reduce(
    (sum, s) => sum + (s.watchDuration || s.totalWatchTime || 0),
    0
  )
  return Math.max(sessionWatchTime, reg.replayWatchTime || 0, reg.lastWatchedPosition || 0)
}

function matchesAudience(
  reg: {
    attended: boolean
    firstJoinedAt: Date | null
    leftAt: Date | null
    watchedReplay: boolean
    replayWatchTime: number | null
    lastWatchedPosition: number | null
    sessions?: Array<{ watchDuration: number | null; totalWatchTime: number | null }>
    webinar?: { mostlyAttendedThreshold: number | null }
  },
  audienceType: string
): boolean {
  const watchTime = getEffectiveWatchTime(reg)
  const threshold = reg.webinar?.mostlyAttendedThreshold

  switch (audienceType) {
    case 'all':
      return true
    case 'attended':
      return reg.attended === true
    case 'mostly_attended':
      // Watched past the configured threshold (same as tagging)
      if (threshold) return reg.attended && watchTime >= threshold
      // No threshold configured — anyone who attended
      return reg.attended === true
    case 'partly_attended':
      // Attended but didn't reach the threshold
      if (threshold) return reg.attended && watchTime < threshold
      return false // Can't determine without threshold
    case 'missed':
      return !reg.attended && !reg.watchedReplay
    case 'replay':
      return reg.watchedReplay === true
    default:
      return true
  }
}

// ─── Reschedule reminders when webinar time changes ─────────────────────────

export async function rescheduleReminderEmails(webinarId: string) {
  // Cancel all pending/sending reminder sends for this webinar
  const templates = await prisma.reminderEmailTemplate.findMany({
    where: { webinarId, isActive: true },
    select: { id: true, minutesBefore: true },
  })
  if (templates.length === 0) return

  const templateIds = templates.map((t) => t.id)

  // Cancel existing pending sends
  await prisma.reminderEmailSend.updateMany({
    where: {
      templateId: { in: templateIds },
      status: { in: ['PENDING', 'SENDING'] },
    },
    data: { status: 'CANCELLED' },
  })

  // Re-schedule for all registrations
  const registrations = await prisma.registration.findMany({
    where: { webinarId },
    select: { id: true },
  })

  for (const reg of registrations) {
    await scheduleReminderEmails(reg.id)
  }
}

// ─── Cancel pending sends for a specific template ───────────────────────────

export async function cancelPendingSendsForTemplate(
  templateId: string,
  type: 'reminder' | 'followup'
) {
  if (type === 'reminder') {
    return prisma.reminderEmailSend.updateMany({
      where: { templateId, status: { in: ['PENDING', 'SENDING'] } },
      data: { status: 'CANCELLED' },
    })
  } else {
    return prisma.followUpEmailSend.updateMany({
      where: { templateId, status: { in: ['PENDING', 'SENDING'] } },
      data: { status: 'CANCELLED' },
    })
  }
}

// ─── Send a test email for a template ───────────────────────────────────────

export async function sendTestEmail(opts: {
  to: string
  templateSubject: string
  templateHtml: string
  fromName?: string
  type: 'reminder' | 'followup'
  webinarTitle: string
}) {
  const ctx: MergeTagContext = {
    name: 'Test User',
    email: opts.to,
    webinarTitle: opts.webinarTitle,
    webinarTime: new Date().toLocaleString('en-US'),
    accessLink: 'https://example.com/access',
    countdownLink: 'https://example.com/countdown',
    calendarLink: 'https://example.com/calendar',
    referralLink: 'https://example.com/referral',
    replayLink: 'https://example.com/replay',
    attendanceStatus: 'Attended',
    watchTime: '45 minutes',
    unsubscribeLink: 'https://example.com/unsubscribe?r=test-registration',
  }

  // Use a dummy sendId for test emails (won't be tracked)
  const testSendId = `test-${Date.now()}`
  const { html, text } = prepareEmailHtml(opts.templateHtml, ctx, testSendId, opts.type)
  const subject = `[TEST] ${opts.templateSubject}`
    .replace(/\{\{name\}\}/gi, 'Test User')
    .replace(/\{\{webinar_title\}\}/gi, opts.webinarTitle)

  return sendEmail({
    to: opts.to,
    subject,
    htmlBody: html,
    textBody: text,
    fromName: opts.fromName || undefined,
  })
}

// ─── Auto-resend to non-openers ─────────────────────────────────────────────

export async function processNonOpenerResends() {
  const now = new Date()
  let resent = 0

  // Reminder non-opener resends
  const reminderTemplates = await prisma.reminderEmailTemplate.findMany({
    where: { resendToNonOpeners: true, resendAfterHours: { not: null } },
  })

  for (const tpl of reminderTemplates) {
    const cutoff = new Date(now.getTime() - (tpl.resendAfterHours! * 60 * 60 * 1000))
    const unopenedSends = await prisma.reminderEmailSend.findMany({
      where: {
        templateId: tpl.id,
        status: 'SENT',
        openCount: 0,
        isResend: false,
        sentAt: { lte: cutoff },
      },
      include: {
        registration: true,
      },
      take: 25,
    })

    for (const send of unopenedSends) {
      if (isEmailUnsubscribed(send.registration)) continue

      const alreadyResent = await prisma.reminderEmailSend.findFirst({
        where: { templateId: tpl.id, registrationId: send.registrationId, isResend: true },
      })
      if (alreadyResent) continue

      const resendSubject = tpl.resendSubject || tpl.subjectB || tpl.subject
      await prisma.reminderEmailSend.create({
        data: {
          templateId: tpl.id,
          registrationId: send.registrationId,
          to: send.to,
          subject: resendSubject,
          abVariant: 'A',
          isResend: true,
          status: 'PENDING',
          scheduledFor: now,
        },
      })
      resent++
    }
  }

  // Follow-up non-opener resends
  const followupTemplates = await prisma.followUpEmailTemplate.findMany({
    where: { resendToNonOpeners: true, resendAfterHours: { not: null } },
  })

  for (const tpl of followupTemplates) {
    const cutoff = new Date(now.getTime() - (tpl.resendAfterHours! * 60 * 60 * 1000))
    const unopenedSends = await prisma.followUpEmailSend.findMany({
      where: {
        templateId: tpl.id,
        status: 'SENT',
        openCount: 0,
        isResend: false,
        sentAt: { lte: cutoff },
      },
      include: {
        registration: true,
      },
      take: 25,
    })

    for (const send of unopenedSends) {
      if (isEmailUnsubscribed(send.registration)) continue

      const alreadyResent = await prisma.followUpEmailSend.findFirst({
        where: { templateId: tpl.id, registrationId: send.registrationId, isResend: true },
      })
      if (alreadyResent) continue

      const resendSubject = tpl.resendSubject || tpl.subjectB || tpl.subject
      await prisma.followUpEmailSend.create({
        data: {
          templateId: tpl.id,
          registrationId: send.registrationId,
          to: send.to,
          subject: resendSubject,
          abVariant: 'A',
          isResend: true,
          status: 'PENDING',
          scheduledFor: now,
        },
      })
      resent++
    }
  }

  return resent
}
