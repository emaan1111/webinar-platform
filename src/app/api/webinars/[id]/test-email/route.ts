import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendTestEmail } from '@/lib/emailScheduler'

// POST /api/webinars/[id]/test-email
// Send a test email for a reminder or follow-up template
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { templateId, type, to } = body as {
    templateId: string
    type: 'reminder' | 'followup'
    to?: string
  }

  if (!templateId || !type) {
    return NextResponse.json(
      { error: 'templateId and type are required' },
      { status: 400 }
    )
  }

  if (!['reminder', 'followup'].includes(type)) {
    return NextResponse.json(
      { error: 'type must be "reminder" or "followup"' },
      { status: 400 }
    )
  }

  const webinar = await prisma.webinar.findUnique({
    where: { id: params.id },
    select: { title: true },
  })
  if (!webinar) {
    return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
  }

  const recipient = to || session.user.email

  let subject: string
  let htmlBody: string
  let fromName: string | undefined

  if (type === 'reminder') {
    const template = await prisma.reminderEmailTemplate.findFirst({
      where: { id: templateId, webinarId: params.id },
    })
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    subject = template.subject
    htmlBody = template.htmlBody
    fromName = template.fromName || undefined
  } else {
    const template = await prisma.followUpEmailTemplate.findFirst({
      where: { id: templateId, webinarId: params.id },
    })
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    subject = template.subject
    htmlBody = template.htmlBody
    fromName = template.fromName || undefined
  }

  try {
    const sent = await sendTestEmail({
      to: recipient,
      templateSubject: subject,
      templateHtml: htmlBody,
      fromName,
      type,
      webinarTitle: webinar.title,
    })

    if (sent) {
      return NextResponse.json({ ok: true, sentTo: recipient })
    } else {
      return NextResponse.json(
        { error: 'Failed to send test email' },
        { status: 500 }
      )
    }
  } catch (err: any) {
    console.error('Test email error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to send test email' },
      { status: 500 }
    )
  }
}
