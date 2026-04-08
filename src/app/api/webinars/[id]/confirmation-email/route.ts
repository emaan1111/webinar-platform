import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/webinars/[id]/confirmation-email — list templates + stats
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const templates = await prisma.confirmationEmailTemplate.findMany({
    where: { webinarId: params.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { sends: true } },
    },
  })

  // Aggregate stats per template
  const templatesWithStats = await Promise.all(
    templates.map(async (t) => {
      const stats = await prisma.confirmationEmailSend.aggregate({
        where: { templateId: t.id },
        _count: { id: true },
        _sum: { openCount: true, clickCount: true },
      })
      const uniqueOpens = await prisma.confirmationEmailSend.count({
        where: { templateId: t.id, openCount: { gt: 0 } },
      })
      const uniqueClicks = await prisma.confirmationEmailSend.count({
        where: { templateId: t.id, clickCount: { gt: 0 } },
      })
      const totalSent = stats._count.id
      return {
        ...t,
        stats: {
          totalSent,
          totalOpens: stats._sum.openCount || 0,
          totalClicks: stats._sum.clickCount || 0,
          uniqueOpens,
          uniqueClicks,
          openRate: totalSent > 0 ? Math.round((uniqueOpens / totalSent) * 100) : 0,
          clickRate: totalSent > 0 ? Math.round((uniqueClicks / totalSent) * 100) : 0,
        },
      }
    })
  )

  return NextResponse.json({ templates: templatesWithStats })
}

// POST /api/webinars/[id]/confirmation-email — create template
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, subject, htmlBody, fromName, isActive } = body

  if (!subject || !htmlBody) {
    return NextResponse.json(
      { error: 'Subject and HTML body are required' },
      { status: 400 }
    )
  }

  // Verify webinar exists
  const webinar = await prisma.webinar.findUnique({
    where: { id: params.id },
    select: { id: true },
  })
  if (!webinar) {
    return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
  }

  const template = await prisma.confirmationEmailTemplate.create({
    data: {
      webinarId: params.id,
      name: name || 'Registration Confirmation',
      subject,
      htmlBody,
      fromName: fromName || null,
      isActive: isActive !== false,
    },
  })

  return NextResponse.json({ template }, { status: 201 })
}
