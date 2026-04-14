import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const templates = await prisma.reminderEmailTemplate.findMany({
      where: { webinarId: params.id },
      select: { id: true },
    })

    const templateIds = templates.map((template) => template.id)

    if (templateIds.length === 0) {
      return NextResponse.json({ success: true, resetSends: 0, deletedEvents: 0 })
    }

    const sends = await prisma.reminderEmailSend.findMany({
      where: { templateId: { in: templateIds } },
      select: { id: true },
    })

    const sendIds = sends.map((send) => send.id)

    const result = await prisma.$transaction(async (tx) => {
      const deletedEvents = sendIds.length > 0
        ? await tx.emailTrackingEvent.deleteMany({
            where: { reminderEmailSendId: { in: sendIds } },
          })
        : { count: 0 }

      const resetSends = await tx.reminderEmailSend.updateMany({
        where: { templateId: { in: templateIds } },
        data: {
          openedAt: null,
          clickedAt: null,
          openCount: 0,
          clickCount: 0,
        },
      })

      return { deletedEvents, resetSends }
    })

    return NextResponse.json({
      success: true,
      resetSends: result.resetSends.count,
      deletedEvents: result.deletedEvents.count,
    })
  } catch (error) {
    console.error('Failed to reset reminder email stats:', error)
    return NextResponse.json({ error: 'Failed to reset stats' }, { status: 500 })
  }
}