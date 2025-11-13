import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get total webinars count
    const totalWebinars = await prisma.webinar.count()

    // Get total registrations (attendees)
    const totalAttendees = await prisma.registration.count()

    // Get webinars with their registration counts for upcoming webinars
    const now = new Date()
    const upcomingWebinars = await prisma.webinar.count({
      where: {
        schedules: {
          some: {
            scheduledAt: {
              gte: now
            },
            isActive: true
          }
        }
      }
    })

    // Calculate average attendance rate
    // Count registrations that have attended
    const attendedCount = await prisma.registration.count({
      where: {
        attended: true
      }
    })

    const avgAttendance = totalAttendees > 0
      ? Math.round((attendedCount / totalAttendees) * 100)
      : 0

    // Get recent webinars with their stats
    const recentWebinars = await prisma.webinar.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            registrations: true
          }
        },
        schedules: {
          where: {
            isActive: true
          },
          orderBy: {
            scheduledAt: 'asc'
          },
          take: 1
        }
      }
    })

    // Format recent webinars
    const formattedWebinars = await Promise.all(
      recentWebinars.map(async (webinar) => {
        const schedule = webinar.schedules[0]
        
        // Count attended registrations for this webinar
        const attended = await prisma.registration.count({
          where: {
            webinarId: webinar.id,
            attended: true
          }
        })
        
        // Determine status based on webinar status field
        let status: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED' = webinar.status as any
        
        // Override with more specific status if we have schedule info
        if (schedule?.scheduledAt) {
          const scheduledTime = new Date(schedule.scheduledAt)
          if (webinar.status === 'SCHEDULED') {
            status = scheduledTime > now ? 'SCHEDULED' : 'ENDED'
          }
        }

        return {
          id: webinar.id,
          title: webinar.title,
          status,
          scheduledAt: schedule?.scheduledAt?.toISOString() || webinar.createdAt.toISOString(),
          registrations: webinar._count.registrations,
          attended
        }
      })
    )

    return NextResponse.json({
      stats: {
        totalWebinars,
        totalAttendees,
        avgAttendance,
        upcomingWebinars
      },
      recentWebinars: formattedWebinars
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
