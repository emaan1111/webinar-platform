import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/external-webinars/[id]/followup-emails — list templates + stats
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const templates = await prisma.followUpEmailTemplate.findMany({
    where: { externalWebinarId: params.id },
    orderBy: [{ sortOrder: 'asc' }, { delayMinutes: 'asc' }],
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

  return NextResponse.json({ templates: templatesWithStats })
}

// POST /api/external-webinars/[id]/followup-emails — create template
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, subject, htmlBody, fromName, delayMinutes, audienceType, isActive, sortOrder,
    subjectB, skipIfPurchased, resendToNonOpeners, resendAfterHours, resendSubject } = body

  if (!subject || !htmlBody) {
    return NextResponse.json(
      { error: 'Subject and HTML body are required' },
      { status: 400 }
    )
  }

  if (typeof delayMinutes !== 'number' || delayMinutes < 0) {
    return NextResponse.json(
      { error: 'delayMinutes must be a non-negative number' },
      { status: 400 }
    )
  }

  const validAudiences = ['all', 'attended', 'mostly_attended', 'partly_attended', 'missed', 'replay']
  if (audienceType && !validAudiences.includes(audienceType)) {
    return NextResponse.json(
      { error: `audienceType must be one of: ${validAudiences.join(', ')}` },
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

  let order = sortOrder
  if (typeof order !== 'number') {
    const maxOrder = await prisma.followUpEmailTemplate.aggregate({
      where: { externalWebinarId: params.id },
      _max: { sortOrder: true },
    })
    order = (maxOrder._max.sortOrder || 0) + 1
  }

  const template = await prisma.followUpEmailTemplate.create({
    data: {
      externalWebinarId: params.id,
      name: name || 'Follow-Up',
      subject,
      subjectB: subjectB || null,
      htmlBody,
      fromName: fromName || null,
      delayMinutes,
      audienceType: audienceType || 'all',
      isActive: isActive !== false,
      sortOrder: order,
      skipIfPurchased: skipIfPurchased || false,
      resendToNonOpeners: resendToNonOpeners || false,
      resendAfterHours: resendAfterHours || null,
      resendSubject: resendSubject || null,
    },
  })

  return NextResponse.json({ template }, { status: 201 })
}
