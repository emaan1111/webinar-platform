import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function getDateRange(searchParams: URLSearchParams) {
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!from && !to) return null

  const range: { gte?: Date; lte?: Date } = {}

  if (from) {
    range.gte = new Date(`${from}T00:00:00.000Z`)
  }

  if (to) {
    range.lte = new Date(`${to}T23:59:59.999Z`)
  }

  return range
}

// GET /api/webinars/[id]/confirmation-email/stats
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const sentAtRange = getDateRange(searchParams)

  // Overall webinar-level stats
  const templates = await prisma.confirmationEmailTemplate.findMany({
    where: { webinarId: params.id },
    select: { id: true, name: true },
  })

  const templateIds = templates.map((t) => t.id)

  const totalUnsubscribed = await prisma.registration.count({
    where: {
      webinarId: params.id,
      emailUnsubscribed: true,
      ...(sentAtRange ? { emailUnsubscribedAt: sentAtRange } : {}),
    },
  })

  if (templateIds.length === 0) {
    return NextResponse.json({
      overview: {
        totalSent: 0,
        totalOpens: 0,
        totalClicks: 0,
        uniqueOpens: 0,
        uniqueClicks: 0,
        totalUnsubscribed,
        unsubscribeRate: 0,
        openRate: 0,
        clickRate: 0,
      },
      deviceBreakdown: [],
      linkBreakdown: [],
      recentSends: [],
    })
  }

  const distinctRecipients = await prisma.confirmationEmailSend.findMany({
    where: { templateId: { in: templateIds }, ...(sentAtRange ? { sentAt: sentAtRange } : {}) },
    select: { registrationId: true },
    distinct: ['registrationId'],
  })

  // Aggregate overview
  const agg = await prisma.confirmationEmailSend.aggregate({
    where: { templateId: { in: templateIds }, ...(sentAtRange ? { sentAt: sentAtRange } : {}) },
    _count: { id: true },
    _sum: { openCount: true, clickCount: true },
  })

  const uniqueOpens = await prisma.confirmationEmailSend.count({
    where: { templateId: { in: templateIds }, openCount: { gt: 0 }, ...(sentAtRange ? { sentAt: sentAtRange } : {}) },
  })
  const uniqueClicks = await prisma.confirmationEmailSend.count({
    where: { templateId: { in: templateIds }, clickCount: { gt: 0 }, ...(sentAtRange ? { sentAt: sentAtRange } : {}) },
  })

  const totalSent = agg._count.id

  // Device breakdown from tracking events
  const deviceEvents = await prisma.emailTrackingEvent.groupBy({
    by: ['deviceType'],
    where: {
      send: { templateId: { in: templateIds } },
      ...(sentAtRange ? { createdAt: sentAtRange } : {}),
    },
    _count: { id: true },
  })

  const deviceBreakdown = deviceEvents.map((d) => ({
    device: d.deviceType || 'unknown',
    count: d._count.id,
  }))

  // Per-link click breakdown
  const linkClicks = await prisma.emailTrackingEvent.groupBy({
    by: ['url'],
    where: { 
      send: { templateId: { in: templateIds } },
      type: 'CLICK',
      url: { not: null },
      ...(sentAtRange ? { createdAt: sentAtRange } : {}),
    },
    _count: { id: true },
  })

  // Get unique clicks per link (count distinct sendId per url)
  const linkBreakdown = await Promise.all(
    linkClicks.map(async (lc) => {
      const uniqueClickers = await prisma.emailTrackingEvent.findMany({
        where: {
          send: { templateId: { in: templateIds } },
          type: 'CLICK',
          url: lc.url,
          ...(sentAtRange ? { createdAt: sentAtRange } : {}),
        },
        distinct: ['sendId'],
        select: { sendId: true },
      })
      return {
        url: lc.url || 'unknown',
        totalClicks: lc._count.id,
        uniqueClicks: uniqueClickers.length,
      }
    })
  )

  // Sort by total clicks descending
  linkBreakdown.sort((a, b) => b.totalClicks - a.totalClicks)

  // Recent sends with open/click info
  const recentSends = await prisma.confirmationEmailSend.findMany({
    where: { templateId: { in: templateIds }, ...(sentAtRange ? { sentAt: sentAtRange } : {}) },
    orderBy: { sentAt: 'desc' },
    take: 50,
    select: {
      id: true,
      to: true,
      subject: true,
      status: true,
      sentAt: true,
      openedAt: true,
      clickedAt: true,
      openCount: true,
      clickCount: true,
      userAgent: true,
      template: { select: { name: true } },
    },
  })

  return NextResponse.json({
    overview: {
      totalSent,
      totalOpens: agg._sum.openCount || 0,
      totalClicks: agg._sum.clickCount || 0,
      uniqueOpens,
      uniqueClicks,
      totalUnsubscribed,
      unsubscribeRate: distinctRecipients.length > 0 ? Math.round((totalUnsubscribed / distinctRecipients.length) * 100) : 0,
      openRate: totalSent > 0 ? Math.round((uniqueOpens / totalSent) * 100) : 0,
      clickRate: totalSent > 0 ? Math.round((uniqueClicks / totalSent) * 100) : 0,
    },
    deviceBreakdown,
    linkBreakdown,
    recentSends,
  })
}
