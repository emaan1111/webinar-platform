import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClickFunnelsContactTags } from '@/lib/clickfunnels'
import { prisma } from '@/lib/prisma'

function normalizeAttendanceTagAlias(tagName: string): string {
  if (tagName === 'UM-Webinar-MostlyAttended') {
    return 'UM-WebinarMostlyAttended'
  }

  if (tagName === 'UM-Webinar-ReplayAttended') {
    return 'UM-WebinarReplayAttended'
  }

  return tagName
}

function getExpectedAttendanceTag(registration: any): { key: string; name: string } {
  if (!registration.attended) {
    return {
      key: 'MISSED',
      name: normalizeAttendanceTagAlias(registration.webinar.missedTag || 'UM-Webinar-Missed')
    }
  }

  const threshold = registration.webinar.mostlyAttendedThreshold
  const watchTime = registration.lastWatchedPosition || 0

  if (threshold && watchTime >= threshold) {
    return {
      key: 'MOSTLY_ATTENDED',
      name: normalizeAttendanceTagAlias(registration.webinar.mostlyAttendedTag || 'UM-WebinarMostlyAttended')
    }
  }

  if (threshold && watchTime > 0) {
    return {
      key: 'PARTLY_ATTENDED',
      name: normalizeAttendanceTagAlias(registration.webinar.partlyAttendedTag || 'UM-Webinar-PartlyAttended')
    }
  }

  return {
    key: 'ATTENDED',
    name: normalizeAttendanceTagAlias(registration.webinar.attendedTag || 'UM-Webinar-Attended')
  }
}

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
            mostlyAttendedThreshold: true,
            attendedTag: true,
            mostlyAttendedTag: true,
            partlyAttendedTag: true,
            missedTag: true
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

    const clickFunnelsContactCache = new Map<string, Awaited<ReturnType<typeof getClickFunnelsContactTags>>>()

    const registrationsWithClickFunnelsStatus = await Promise.all(
      registrations.map(async (registration) => {
        const sessionEnd = new Date(registration.scheduledStartTime!.getTime() + registration.webinar.duration * 60 * 1000)
        const sessionEnded = sessionEnd < now
        const expectedTag = getExpectedAttendanceTag(registration)

        if (!sessionEnded) {
          return {
            ...registration,
            expectedTagKey: expectedTag.key,
            expectedTagName: expectedTag.name,
            clickFunnelsApplyStatus: 'NOT_READY',
            clickFunnelsApplyMessage: 'Session has not ended yet'
          }
        }

        if (!clickFunnelsContactCache.has(registration.email)) {
          clickFunnelsContactCache.set(registration.email, await getClickFunnelsContactTags(registration.email))
        }

        const clickFunnelsContact = clickFunnelsContactCache.get(registration.email)!

        if (!clickFunnelsContact.success) {
          return {
            ...registration,
            expectedTagKey: expectedTag.key,
            expectedTagName: expectedTag.name,
            clickFunnelsApplyStatus: registration.attendanceTagsApplied ? 'FAILED' : 'PENDING',
            clickFunnelsApplyMessage: clickFunnelsContact.error || 'Unable to verify ClickFunnels contact'
          }
        }

        const hasExpectedTag = (clickFunnelsContact.tags || []).some((tag) => tag.name === expectedTag.name)

        return {
          ...registration,
          expectedTagKey: expectedTag.key,
          expectedTagName: expectedTag.name,
          clickFunnelsApplyStatus: hasExpectedTag
            ? 'SUCCESS'
            : registration.attendanceTagsApplied
              ? 'FAILED'
              : 'PENDING',
          clickFunnelsApplyMessage: hasExpectedTag
            ? `Verified on ClickFunnels contact`
            : registration.attendanceTagsApplied
              ? `Expected tag not found on ClickFunnels contact`
              : `Attendance tag not applied yet`
        }
      })
    )

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
      registrations: registrationsWithClickFunnelsStatus,
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
