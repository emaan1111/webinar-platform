import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/webinars/[id]/clone-templates
 *
 * Clone email templates from another webinar into this one.
 * Body: { sourceWebinarId: string, types: ('reminder' | 'followup')[] }
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { sourceWebinarId, types } = body

  if (!sourceWebinarId || !Array.isArray(types) || types.length === 0) {
    return NextResponse.json(
      { error: 'sourceWebinarId and types[] are required' },
      { status: 400 }
    )
  }

  const targetWebinar = await prisma.webinar.findUnique({
    where: { id: params.id },
    select: { id: true },
  })
  if (!targetWebinar) {
    return NextResponse.json({ error: 'Target webinar not found' }, { status: 404 })
  }

  const sourceWebinar = await prisma.webinar.findUnique({
    where: { id: sourceWebinarId },
    select: { id: true },
  })
  if (!sourceWebinar) {
    return NextResponse.json({ error: 'Source webinar not found' }, { status: 404 })
  }

  let clonedReminders = 0
  let clonedFollowUps = 0

  if (types.includes('reminder')) {
    const reminders = await prisma.reminderEmailTemplate.findMany({
      where: { webinarId: sourceWebinarId },
    })
    for (const t of reminders) {
      await prisma.reminderEmailTemplate.create({
        data: {
          webinarId: params.id,
          name: t.name,
          subject: t.subject,
          subjectB: t.subjectB,
          htmlBody: t.htmlBody,
          fromName: t.fromName,
          minutesBefore: t.minutesBefore,
          isActive: false, // cloned as disabled
          skipIfJoined: t.skipIfJoined,
          resendToNonOpeners: t.resendToNonOpeners,
          resendAfterHours: t.resendAfterHours,
          resendSubject: t.resendSubject,
        },
      })
      clonedReminders++
    }
  }

  if (types.includes('followup')) {
    const followups = await prisma.followUpEmailTemplate.findMany({
      where: { webinarId: sourceWebinarId },
    })
    for (const t of followups) {
      await prisma.followUpEmailTemplate.create({
        data: {
          webinarId: params.id,
          name: t.name,
          subject: t.subject,
          subjectB: t.subjectB,
          htmlBody: t.htmlBody,
          fromName: t.fromName,
          delayMinutes: t.delayMinutes,
          audienceType: t.audienceType,
          sortOrder: t.sortOrder,
          isActive: false,
          skipIfPurchased: t.skipIfPurchased,
          resendToNonOpeners: t.resendToNonOpeners,
          resendAfterHours: t.resendAfterHours,
          resendSubject: t.resendSubject,
        },
      })
      clonedFollowUps++
    }
  }

  return NextResponse.json({
    ok: true,
    clonedReminders,
    clonedFollowUps,
  })
}
