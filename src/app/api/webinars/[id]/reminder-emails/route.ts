import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/webinars/[id]/reminder-emails — list templates + stats
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const templates = await prisma.reminderEmailTemplate.findMany({
    where: { webinarId: params.id },
    orderBy: { minutesBefore: 'desc' },
    include: {
      sends: {
        select: { openCount: true, clickCount: true },
      },
    },
  })

  const templatesWithStats = templates.map((t) => {
    const totalSent = t.sends.length
    const uniqueOpens = t.sends.filter((s) => s.openCount > 0).length
    const uniqueClicks = t.sends.filter((s) => s.clickCount > 0).length
    const totalOpens = t.sends.reduce((sum, s) => sum + s.openCount, 0)
    const totalClicks = t.sends.reduce((sum, s) => sum + s.clickCount, 0)
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

  // Also fetch the reminder email source setting
  const webinar = await prisma.webinar.findUnique({
    where: { id: params.id },
    select: { reminderEmailSource: true },
  })

  return NextResponse.json({
    templates: templatesWithStats,
    reminderEmailSource: webinar?.reminderEmailSource || 'internal',
  })
}

// POST /api/webinars/[id]/reminder-emails — create template
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
    subjectB, skipIfJoined, resendToNonOpeners, resendAfterHours, resendSubject } = body

  if (!subject || !htmlBody) {
    return NextResponse.json(
      { error: 'Subject and HTML body are required' },
      { status: 400 }
    )
  }

  if (typeof minutesBefore !== 'number' || minutesBefore < 1) {
    return NextResponse.json(
      { error: 'minutesBefore must be a positive number' },
      { status: 400 }
    )
  }

  const webinar = await prisma.webinar.findUnique({
    where: { id: params.id },
    select: { id: true },
  })
  if (!webinar) {
    return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
  }

  const template = await prisma.reminderEmailTemplate.create({
    data: {
      webinarId: params.id,
      name: name || 'Reminder',
      subject,
      subjectB: subjectB || null,
      htmlBody,
      fromName: fromName || null,
      minutesBefore,
      isActive: isActive !== false,
      skipIfJoined: skipIfJoined !== false,
      resendToNonOpeners: resendToNonOpeners || false,
      resendAfterHours: resendAfterHours || null,
      resendSubject: resendSubject || null,
    },
  })

  return NextResponse.json({ template }, { status: 201 })
}
