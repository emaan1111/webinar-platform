import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/external-webinars/[id]/reminder-emails — list templates + stats
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const templates = await prisma.reminderEmailTemplate.findMany({
    where: { externalWebinarId: params.id },
    orderBy: { minutesBefore: 'desc' },
    include: {
      sends: {
        select: { status: true, openCount: true, clickCount: true },
      },
    },
  })

  const templatesWithStats = templates.map((t) => {
    const sentSends = t.sends.filter((s) => s.status === 'SENT')
    const totalSent = sentSends.length
    const uniqueOpens = sentSends.filter((s) => s.openCount > 0).length
    const uniqueClicks = sentSends.filter((s) => s.clickCount > 0).length
    const totalOpens = sentSends.reduce((sum, s) => sum + s.openCount, 0)
    const totalClicks = sentSends.reduce((sum, s) => sum + s.clickCount, 0)
    const { sends, ...rest } = t
    return {
      ...rest,
      stats: {
        totalSent,
        totalOpens,
        totalClicks,
        uniqueOpens,
        uniqueClicks,
        openRate: totalSent > 0 ? Math.round((uniqueOpens / totalSent) * 100) : 0,
        clickRate: totalSent > 0 ? Math.round((uniqueClicks / totalSent) * 100) : 0,
      },
    }
  })

  return NextResponse.json({ templates: templatesWithStats })
}

// POST /api/external-webinars/[id]/reminder-emails — create template
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, subject, htmlBody, fromName, minutesBefore, isActive,
    subjectB, skipIfJoined, resendToNonOpeners, resendAfterHours, resendSubject,
    channel, smsBody } = body

  const ch = channel || 'EMAIL'
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

  if ((ch === 'SMS' || ch === 'BOTH') && !smsBody?.trim()) {
    return NextResponse.json(
      { error: 'SMS message is required for SMS reminders' },
      { status: 400 }
    )
  }

  if (typeof minutesBefore !== 'number' || minutesBefore < 1) {
    return NextResponse.json(
      { error: 'minutesBefore must be a positive number' },
      { status: 400 }
    )
  }

  const ew = await prisma.externalWebinar.findUnique({
    where: { id: params.id },
    select: { id: true },
  })
  if (!ew) {
    return NextResponse.json({ error: 'External webinar not found' }, { status: 404 })
  }

  const template = await prisma.reminderEmailTemplate.create({
    data: {
      externalWebinarId: params.id,
      name: name || 'Reminder',
      channel: ch,
      smsBody: smsBody?.trim() || null,
      subject: subject || name || 'SMS Reminder',
      subjectB: subjectB || null,
      htmlBody: htmlBody || '',
      fromName: fromName || null,
      minutesBefore,
      isActive: isActive !== false,
      skipIfJoined: skipIfJoined !== false,
      resendToNonOpeners: resendToNonOpeners || false,
      resendAfterHours: resendAfterHours || null,
      resendSubject: resendSubject || null,
    },
  })

  // Backfill: sends are normally scheduled at registration time, so a template
  // created after people registered would never reach them. Schedule it for
  // everyone already signed up for a future session (runs in the background;
  // scheduleReminderEmails dedupes and skips past send times on its own).
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

  return NextResponse.json({ template }, { status: 201 })
}
