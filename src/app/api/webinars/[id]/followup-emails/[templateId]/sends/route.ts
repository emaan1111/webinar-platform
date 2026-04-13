import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/webinars/[id]/followup-emails/[templateId]/sends
 * Returns individual send records for a follow-up email template.
 * Includes open/click data per recipient.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string; templateId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter') || 'all' // all | opened | clicked | pending | failed
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50))
  const skip = (page - 1) * limit

  // Verify template belongs to this webinar
  const template = await prisma.followUpEmailTemplate.findFirst({
    where: { id: params.templateId, webinarId: params.id },
    select: { id: true, name: true, subject: true, audienceType: true },
  })
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  // Build filter conditions
  const where: any = { templateId: params.templateId }
  switch (filter) {
    case 'opened':
      where.openCount = { gt: 0 }
      break
    case 'clicked':
      where.clickCount = { gt: 0 }
      break
    case 'pending':
      where.status = { in: ['PENDING', 'SENDING'] }
      break
    case 'sent':
      where.status = 'SENT'
      where.openCount = 0
      break
    case 'failed':
      where.status = 'FAILED'
      break
  }

  const [sends, total] = await Promise.all([
    prisma.followUpEmailSend.findMany({
      where,
      select: {
        id: true,
        to: true,
        subject: true,
        abVariant: true,
        isResend: true,
        status: true,
        scheduledFor: true,
        sentAt: true,
        openedAt: true,
        clickedAt: true,
        openCount: true,
        clickCount: true,
        errorMessage: true,
        registration: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { scheduledFor: 'desc' },
      skip,
      take: limit,
    }),
    prisma.followUpEmailSend.count({ where }),
  ])

  // Get click details (which URLs were clicked) for sends that have clicks
  const sendIdsWithClicks = sends.filter((s) => s.clickCount > 0).map((s) => s.id)
  let clickDetails: Record<string, Array<{ url: string; clickedAt: Date }>> = {}

  if (sendIdsWithClicks.length > 0) {
    const events = await prisma.emailTrackingEvent.findMany({
      where: {
        followUpEmailSendId: { in: sendIdsWithClicks },
        type: 'CLICK',
      },
      select: {
        followUpEmailSendId: true,
        url: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    for (const e of events) {
      if (!e.followUpEmailSendId) continue
      if (!clickDetails[e.followUpEmailSendId]) clickDetails[e.followUpEmailSendId] = []
      clickDetails[e.followUpEmailSendId].push({
        url: e.url || '',
        clickedAt: e.createdAt,
      })
    }
  }

  // Summary counts
  const [totalSent, totalOpened, totalClicked] = await Promise.all([
    prisma.followUpEmailSend.count({ where: { templateId: params.templateId, status: 'SENT' } }),
    prisma.followUpEmailSend.count({ where: { templateId: params.templateId, openCount: { gt: 0 } } }),
    prisma.followUpEmailSend.count({ where: { templateId: params.templateId, clickCount: { gt: 0 } } }),
  ])

  return NextResponse.json({
    template,
    sends: sends.map((s) => ({
      ...s,
      recipientName: s.registration?.name || '',
      clicks: clickDetails[s.id] || [],
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    summary: { totalSent, totalOpened, totalClicked },
  })
}
