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
    const { searchParams } = new URL(request.url)
    
    // Get filter and pagination params
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const typeFilter = searchParams.get('type') // 'pre_webinar' | 'post_webinar' | null
    const statusFilter = searchParams.get('status') // 'PENDING' | 'SENT' | etc. | null
    
    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = {
      registration: {
        webinarId: id
      }
    }
    
    // Add type filter
    if (typeFilter && (typeFilter === 'pre_webinar' || typeFilter === 'post_webinar')) {
      whereClause.template = {
        type: typeFilter
      }
    }
    
    // Add status filter
    if (statusFilter) {
      whereClause.status = statusFilter
    }

    // Get stats (unfiltered counts)
    const summary = await prisma.webinarReminderSent.groupBy({
      by: ['status'],
      where: {
        registration: {
          webinarId: id
        }
      },
      _count: true
    })

    // Get total count with filters applied
    const total = await prisma.webinarReminderSent.count({
      where: whereClause
    })

    // Get paginated reminders with filters
    const reminders = await prisma.webinarReminderSent.findMany({
      where: whereClause,
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
            minutesAfter: true,
            channel: true,
            type: true,
            emailSubject: true,
            emailBody: true,
            smsBody: true
          }
        }
      },
      orderBy: {
        scheduledFor: 'desc'
      },
      skip,
      take: limit
    })

    const stats = summary.reduce((acc: Record<string, number>, item: any) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({ 
      stats, 
      reminders, 
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error: any) {
    console.error('Error fetching reminder logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reminder logs', details: error.message },
      { status: 500 }
    )
  }
}
