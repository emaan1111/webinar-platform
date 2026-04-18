import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/external-webinars/[id]/copy-emails
 * Copy email templates from an internal webinar to this external webinar.
 * Body: { sourceWebinarId: string, types?: ('confirmation' | 'reminder' | 'followup')[] }
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sourceWebinarId, types } = await request.json()

  if (!sourceWebinarId) {
    return NextResponse.json({ error: 'sourceWebinarId is required' }, { status: 400 })
  }

  // Verify external webinar exists
  const externalWebinar = await prisma.externalWebinar.findUnique({
    where: { id: params.id },
  })
  if (!externalWebinar) {
    return NextResponse.json({ error: 'External webinar not found' }, { status: 404 })
  }

  // Verify source webinar exists
  const sourceWebinar = await prisma.webinar.findUnique({
    where: { id: sourceWebinarId },
    select: { id: true, title: true },
  })
  if (!sourceWebinar) {
    return NextResponse.json({ error: 'Source webinar not found' }, { status: 404 })
  }

  const copyTypes = types || ['confirmation', 'reminder', 'followup']
  const results = { confirmation: 0, reminder: 0, followup: 0 }

  // Copy confirmation email templates
  if (copyTypes.includes('confirmation')) {
    const templates = await prisma.confirmationEmailTemplate.findMany({
      where: { webinarId: sourceWebinarId },
    })
    for (const t of templates) {
      await prisma.confirmationEmailTemplate.create({
        data: {
          externalWebinarId: params.id,
          name: t.name,
          subject: t.subject,
          htmlBody: t.htmlBody,
          fromName: t.fromName,
          isActive: t.isActive,
        },
      })
      results.confirmation++
    }
  }

  // Copy reminder email templates
  if (copyTypes.includes('reminder')) {
    const templates = await prisma.reminderEmailTemplate.findMany({
      where: { webinarId: sourceWebinarId },
    })
    for (const t of templates) {
      await prisma.reminderEmailTemplate.create({
        data: {
          externalWebinarId: params.id,
          name: t.name,
          subject: t.subject,
          subjectB: t.subjectB,
          htmlBody: t.htmlBody,
          fromName: t.fromName,
          minutesBefore: t.minutesBefore,
          isActive: t.isActive,
          skipIfJoined: t.skipIfJoined,
          resendToNonOpeners: t.resendToNonOpeners,
          resendAfterHours: t.resendAfterHours,
          resendSubject: t.resendSubject,
        },
      })
      results.reminder++
    }
  }

  // Copy follow-up email templates
  if (copyTypes.includes('followup')) {
    const templates = await prisma.followUpEmailTemplate.findMany({
      where: { webinarId: sourceWebinarId },
    })
    for (const t of templates) {
      await prisma.followUpEmailTemplate.create({
        data: {
          externalWebinarId: params.id,
          name: t.name,
          subject: t.subject,
          subjectB: t.subjectB,
          htmlBody: t.htmlBody,
          fromName: t.fromName,
          delayMinutes: t.delayMinutes,
          audienceType: t.audienceType,
          isActive: t.isActive,
          skipIfPurchased: t.skipIfPurchased,
          resendToNonOpeners: t.resendToNonOpeners,
          resendAfterHours: t.resendAfterHours,
          resendSubject: t.resendSubject,
          sortOrder: t.sortOrder,
        },
      })
      results.followup++
    }
  }

  const total = results.confirmation + results.reminder + results.followup

  return NextResponse.json({
    success: true,
    message: `Copied ${total} template(s) from "${sourceWebinar.title}"`,
    results,
  })
}
