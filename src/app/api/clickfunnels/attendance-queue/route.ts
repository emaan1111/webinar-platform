import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'
    const webinarId = searchParams.get('webinarId') || ''

    const now = new Date()
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)

    // Base query conditions
    const whereConditions: any = {
      scheduledStartTime: {
        not: null
      }
    }

    if (webinarId) {
      whereConditions.webinarId = webinarId
    }

    // Apply filters
    if (filter === 'pending') {
      // Sessions that have ended but not yet tagged
      whereConditions.attendanceTagsApplied = false
    } else if (filter === 'tagged') {
      whereConditions.attendanceTagsApplied = true
    } else if (filter === 'upcoming') {
      // Will end within next 2 hours
      whereConditions.attendanceTagsApplied = false
    }

    // Fetch registrations
    let registrations = await prisma.registration.findMany({
      where: whereConditions,
      include: {
        webinar: {
          select: {
            id: true,
            title: true,
            duration: true,
            mostlyAttendedThreshold: true
          }
        }
      },
      orderBy: {
        scheduledStartTime: 'desc'
      },
      take: 200 // Limit to 200 most recent
    })

    // Filter by session end time for 'pending' and 'upcoming'
    if (filter === 'pending') {
      registrations = registrations.filter((reg) => {
        if (!reg.scheduledStartTime) return false
        const sessionEnd = new Date(reg.scheduledStartTime.getTime() + reg.webinar.duration * 60 * 1000)
        return sessionEnd < now
      })
    } else if (filter === 'upcoming') {
      registrations = registrations.filter((reg) => {
        if (!reg.scheduledStartTime) return false
        const sessionEnd = new Date(reg.scheduledStartTime.getTime() + reg.webinar.duration * 60 * 1000)
        return sessionEnd > now && sessionEnd < twoHoursFromNow
      })
    }

    // Calculate statistics
    const allRegistrations = await prisma.registration.findMany({
      where: {
        scheduledStartTime: {
          not: null
        },
        ...(webinarId ? { webinarId } : {})
      },
      include: {
        webinar: {
          select: {
            duration: true
          }
        }
      }
    })

    const stats = {
      totalEnded: allRegistrations.filter((reg) => {
        if (!reg.scheduledStartTime) return false
        const sessionEnd = new Date(reg.scheduledStartTime.getTime() + reg.webinar.duration * 60 * 1000)
        return sessionEnd < now
      }).length,
      tagged: allRegistrations.filter((reg) => reg.attendanceTagsApplied).length,
      pendingTagging: allRegistrations.filter((reg) => {
        if (!reg.scheduledStartTime || reg.attendanceTagsApplied) return false
        const sessionEnd = new Date(reg.scheduledStartTime.getTime() + reg.webinar.duration * 60 * 1000)
        return sessionEnd < now
      }).length,
      willEndSoon: allRegistrations.filter((reg) => {
        if (!reg.scheduledStartTime || reg.attendanceTagsApplied) return false
        const sessionEnd = new Date(reg.scheduledStartTime.getTime() + reg.webinar.duration * 60 * 1000)
        return sessionEnd > now && sessionEnd < twoHoursFromNow
      }).length
    }

    // Get list of webinars for filter dropdown
    const webinars = await prisma.webinar.findMany({
      where: {
        hostId: session.user.id
      },
      select: {
        id: true,
        title: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      registrations,
      stats,
      webinars
    })
  } catch (error) {
    console.error('Error fetching attendance queue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance queue' },
      { status: 500 }
    )
  }
}
