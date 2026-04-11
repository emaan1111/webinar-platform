import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/webinars/[id]/reminder-emails/stats
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
    select: { id: true, name: true, minutesBefore: true },
  })

  const templateIds = templates.map((t) => t.id)

  if (templateIds.length === 0) {
    return NextResponse.json({
      overview: { totalSent: 0, totalOpens: 0, totalClicks: 0, uniqueOpens: 0, uniqueClicks: 0, openRate: 0, clickRate: 0 },
      deviceBreakdown: [],
      linkBreakdown: [],
      recentSends: [],
      perTemplate: [],
    })
  }

  const agg = await prisma.reminderEmailSend.aggregate({
    where: { templateId: { in: templateIds }, status: 'SENT' },
    _count: { id: true },
    _sum: { openCount: true, clickCount: true },
  })
  const totalScheduled = await prisma.reminderEmailSend.count({
    where: { templateId: { in: templateIds } },
  })
  const uniqueOpens = await prisma.reminderEmailSend.count({
    where: { templateId: { in: templateIds }, status: 'SENT', openCount: { gt: 0 } },
  })
  const uniqueClicks = await prisma.reminderEmailSend.count({
    where: { templateId: { in: templateIds }, status: 'SENT', clickCount: { gt: 0 } },
  })
  const totalSent = agg._count.id
  const totalPending = await prisma.reminderEmailSend.count({
    where: { templateId: { in: templateIds }, status: 'PENDING' },
  })

  // Device breakdown — scope to actual sends for this webinar's templates
  const sendIds = await prisma.reminderEmailSend.findMany({
    where: { templateId: { in: templateIds } },
    select: { id: true },
  })
  const sendIdList = sendIds.map((s) => s.id)
  const deviceEvents = await prisma.emailTrackingEvent.groupBy({
    by: ['deviceType'],
    where: { reminderEmailSendId: { in: sendIdList }, emailType: 'reminder' },
    _count: { id: true },
  })
  const deviceBreakdown = deviceEvents.map((d) => ({
    device: d.deviceType || 'unknown',
    count: d._count.id,
  }))

  // Link-level click breakdown
  const linkEvents = await prisma.emailTrackingEvent.groupBy({
    by: ['url'],
    where: { reminderEmailSendId: { in: sendIdList }, emailType: 'reminder', type: 'CLICK', url: { not: null } },
    _count: { id: true },
  })
  const linkBreakdown = linkEvents
    .filter((l) => l.url)
    .map((l) => ({ url: l.url!, clicks: l._count.id }))
    .sort((a, b) => b.clicks - a.clicks)

  // A/B variant breakdown
  const variantA = await prisma.reminderEmailSend.aggregate({
    where: { templateId: { in: templateIds }, abVariant: 'A', status: 'SENT' },
    _count: { id: true },
  })
  const variantAOpens = await prisma.reminderEmailSend.count({
    where: { templateId: { in: templateIds }, abVariant: 'A', status: 'SENT', openCount: { gt: 0 } },
  })
  const variantB = await prisma.reminderEmailSend.aggregate({
    where: { templateId: { in: templateIds }, abVariant: 'B', status: 'SENT' },
    _count: { id: true },
  })
  const variantBOpens = await prisma.reminderEmailSend.count({
    where: { templateId: { in: templateIds }, abVariant: 'B', status: 'SENT', openCount: { gt: 0 } },
  })
  const abBreakdown = {
    variantA: { sent: variantA._count.id, opens: variantAOpens, openRate: variantA._count.id > 0 ? Math.round((variantAOpens / variantA._count.id) * 100) : 0 },
    variantB: { sent: variantB._count.id, opens: variantBOpens, openRate: variantB._count.id > 0 ? Math.round((variantBOpens / variantB._count.id) * 100) : 0 },
  }

  // Per-template stats
  const perTemplate = await Promise.all(
    templates.map(async (t) => {
      const s = await prisma.reminderEmailSend.aggregate({
        where: { templateId: t.id, status: 'SENT' },
        _count: { id: true },
        _sum: { openCount: true, clickCount: true },
      })
      const uo = await prisma.reminderEmailSend.count({ where: { templateId: t.id, status: 'SENT', openCount: { gt: 0 } } })
      const uc = await prisma.reminderEmailSend.count({ where: { templateId: t.id, status: 'SENT', clickCount: { gt: 0 } } })
      const ts = s._count.id
      return {
        templateId: t.id,
        name: t.name,
        minutesBefore: t.minutesBefore,
        totalSent: ts,
        uniqueOpens: uo,
        uniqueClicks: uc,
        openRate: ts > 0 ? Math.round((uo / ts) * 100) : 0,
        clickRate: ts > 0 ? Math.round((uc / ts) * 100) : 0,
      }
    })
  )

  // Recent sends
  const recentSends = await prisma.reminderEmailSend.findMany({
    where: { templateId: { in: templateIds } },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      to: true,
      subject: true,
      status: true,
      scheduledFor: true,
      sentAt: true,
      openedAt: true,
      clickedAt: true,
      openCount: true,
      clickCount: true,
      template: { select: { name: true, minutesBefore: true } },
    },
  })

  return NextResponse.json({
    overview: {
      totalSent,
      totalScheduled,
      totalPending,
      totalOpens: agg._sum.openCount || 0,
      totalClicks: agg._sum.clickCount || 0,
      uniqueOpens,
      uniqueClicks,
      openRate: totalSent > 0 ? Math.round((uniqueOpens / totalSent) * 100) : 0,
      clickRate: totalSent > 0 ? Math.round((uniqueClicks / totalSent) * 100) : 0,
    },
    deviceBreakdown,
    linkBreakdown,
    abBreakdown,
    perTemplate,
    recentSends,
  })
}
