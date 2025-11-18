import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const summary = await prisma.webinarReminderSent.groupBy({
      by: ['status'],
      where: {
        registration: {
          webinarId: id
        }
      },
      _count: true
    })

    const reminders = await prisma.webinarReminderSent.findMany({
      where: {
        registration: {
          webinarId: id
        }
      },
      include: {
        registration: {
          select: {
            name: true,
            email: true,
            phone: true,
            scheduledStartTime: true,
            timezone: true
          }
        },
        template: {
          select: {
            minutesBefore: true,
            channel: true
          }
        }
      },
      orderBy: {
        scheduledFor: 'desc'
      },
      take: 50
    })

    const stats = summary.reduce((acc, item) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({ stats, reminders })
  } catch (error: any) {
    console.error('Error fetching reminder logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reminder logs', details: error.message },
      { status: 500 }
    )
  }
}
