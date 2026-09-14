import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/external-webinars/[id]/reminder-emails/[templateId]
export async function GET(
  _request: Request,
  { params }: { params: { id: string; templateId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const template = await prisma.reminderEmailTemplate.findFirst({
    where: { id: params.templateId, externalWebinarId: params.id },
  })

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  return NextResponse.json({ template })
}

// PUT /api/external-webinars/[id]/reminder-emails/[templateId]
export async function PUT(
  request: Request,
  { params }: { params: { id: string; templateId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, subject, htmlBody, fromName, minutesBefore, isActive,
    subjectB, skipIfJoined, resendToNonOpeners, resendAfterHours, resendSubject,
    channel, smsBody } = body

  const existing = await prisma.reminderEmailTemplate.findFirst({
    where: { id: params.templateId, externalWebinarId: params.id },
    select: { id: true, channel: true, smsBody: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const ch = channel || existing.channel
  if (!['EMAIL', 'SMS', 'BOTH'].includes(ch)) {
    return NextResponse.json(
      { error: 'channel must be EMAIL, SMS, or BOTH' },
      { status: 400 }
    )
  }

  if ((ch === 'EMAIL' || ch === 'BOTH') && (!subject || !htmlBody)) {
    return NextResponse.json(
      { error: 'Subject and HTML body are required for email reminders' },
      { status: 400 }
    )
  }

  const effectiveSmsBody = smsBody !== undefined ? smsBody : existing.smsBody
  if ((ch === 'SMS' || ch === 'BOTH') && !effectiveSmsBody?.trim()) {
    return NextResponse.json(
      { error: 'SMS message is required for SMS reminders' },
      { status: 400 }
    )
  }

  const template = await prisma.reminderEmailTemplate.update({
    where: { id: params.templateId },
    data: {
      name: name || undefined,
      channel: ch,
      smsBody: smsBody !== undefined ? (smsBody?.trim() || null) : undefined,
      subject: subject || undefined,
      subjectB: subjectB !== undefined ? (subjectB || null) : undefined,
      htmlBody: htmlBody || undefined,
      fromName: fromName !== undefined ? (fromName || null) : undefined,
      minutesBefore: typeof minutesBefore === 'number' ? minutesBefore : undefined,
      isActive: typeof isActive === 'boolean' ? isActive : undefined,
      skipIfJoined: typeof skipIfJoined === 'boolean' ? skipIfJoined : undefined,
      resendToNonOpeners: typeof resendToNonOpeners === 'boolean' ? resendToNonOpeners : undefined,
      resendAfterHours: resendAfterHours !== undefined ? (resendAfterHours || null) : undefined,
      resendSubject: resendSubject !== undefined ? (resendSubject || null) : undefined,
    },
  })

  // Backfill for future registrants — e.g. a template switched from EMAIL to
  // BOTH needs SMS sends scheduled for people who already registered.
  // scheduleReminderEmails dedupes, so re-running it is safe.
  ;(async () => {
    const { scheduleReminderEmails } = await import('@/lib/emailScheduler')
    const future = await prisma.externalWebinarRegistration.findMany({
      where: { externalWebinarId: params.id, scheduledStartTime: { gt: new Date() } },
      select: { id: true },
    })
    for (const r of future) {
      await scheduleReminderEmails(r.id, true)
    }
  })().catch((err) => console.error('Reminder backfill failed:', err))

  return NextResponse.json({ template })
}

// PATCH — toggle active
export async function PATCH(
  _request: Request,
  { params }: { params: { id: string; templateId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.reminderEmailTemplate.findFirst({
    where: { id: params.templateId, externalWebinarId: params.id },
    select: { id: true, isActive: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const template = await prisma.reminderEmailTemplate.update({
    where: { id: params.templateId },
    data: { isActive: !existing.isActive },
  })

  return NextResponse.json({ template })
}

// DELETE
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; templateId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.reminderEmailTemplate.findFirst({
    where: { id: params.templateId, externalWebinarId: params.id },
    select: { id: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  await prisma.reminderEmailTemplate.delete({
    where: { id: params.templateId },
  })

  return NextResponse.json({ success: true })
}
