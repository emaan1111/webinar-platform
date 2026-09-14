/**
 * Confirmation email for external-webinar registrations.
 *
 * One implementation on purpose: the registration route sends it at signup, and
 * the room-link backfill re-sends it once a link that was missing at signup has
 * been captured — both must render the same template the same way.
 */

import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import {
  replaceMergeTags,
  prepareEmailHtml,
  MergeTagContext,
  formatWebinarTime,
  getOneClickUnsubscribeUrl,
} from '@/lib/emailTracking'

export async function sendExternalConfirmationEmail(input: {
  registration: {
    id: string
    name: string
    email: string
    scheduledStartTime: Date | null
    timezone: string | null
  }
  externalWebinarId: string
  webinarTitle: string
  /** Room link for the {{access_link}} / {{countdown_link}} tags; null renders them empty. */
  liveRoomUrl: string | null
}): Promise<boolean> {
  const { registration, externalWebinarId, webinarTitle, liveRoomUrl } = input

  const activeTemplate = await prisma.confirmationEmailTemplate.findFirst({
    where: { externalWebinarId, isActive: true },
    orderBy: { createdAt: 'desc' },
  })
  if (!activeTemplate) return false

  const emailCtx: MergeTagContext = {
    name: registration.name,
    email: registration.email,
    webinarTitle,
    webinarTime: formatWebinarTime(registration.scheduledStartTime, registration.timezone),
    // For a live-Zoom pick this is the Zoom link (EverWebinar won't email them);
    // for a normal pick it's the EverWebinar room link if the API returned one.
    accessLink: liveRoomUrl,
    // External webinars have no countdown-page slug, so the seeded templates'
    // {{countdown_link}} would render empty. Point it at the live room too.
    countdownLink: liveRoomUrl,
  }

  const emailSubject = replaceMergeTags(activeTemplate.subject, emailCtx)
  const emailSendRecord = await prisma.confirmationEmailSend.create({
    data: {
      templateId: activeTemplate.id,
      externalRegistrationId: registration.id,
      to: registration.email,
      subject: emailSubject,
      status: 'SENT',
    },
  })

  const { html: emailHtml } = prepareEmailHtml(activeTemplate.htmlBody, emailCtx, emailSendRecord.id, 'confirmation')
  await sendEmail({
    to: registration.email,
    subject: emailSubject,
    htmlBody: emailHtml,
    fromName: activeTemplate.fromName || undefined,
    unsubscribeUrl: getOneClickUnsubscribeUrl(registration.id),
  })
  return true
}
