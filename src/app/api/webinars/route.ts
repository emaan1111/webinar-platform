import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Received webinar creation request:', JSON.stringify(body, null, 2))
    
    const { 
      title, 
      slug,
      description, 
      duration, 
      status,
      vimeoVideoId,
      videoUrl,
      videoDuration,
      hasReplay,
      hasOffers,
      hasChat,
      hasReactions,
      maxSchedulesToShow,
      registrationPageId,
      countdownPageId,
      schedules, // Array of schedule objects
      // A/B Testing fields
      enableABTesting,
      trafficSplitPercent,
      testRegistrationPage,
      regPageAId,
      regPageBId,
      testSchedule,
      scheduleAIds,
      scheduleBIds,
      testOffer,
      offerAId,
      offerBId,
      testVideo,
      videoAId,
      videoBId,
      showElapsedTime
    } = body

    // Validation
    if (!title || !description || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, duration' },
        { status: 400 }
      )
    }

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return NextResponse.json(
        { error: 'At least one schedule is required' },
        { status: 400 }
      )
    }

    // Create webinar WITHOUT scheduling fields
    const webinar = await prisma.webinar.create({
      data: {
        title,
        slug: slug || null,
        description,
        duration,
        vimeoVideoId: vimeoVideoId || null,
        videoUrl: videoUrl || null,
        videoDuration: videoDuration || null,
        status: status || 'DRAFT',
        hasReplay: hasReplay !== undefined ? hasReplay : true,
        hasOffers: hasOffers !== undefined ? hasOffers : true,
        hasChat: hasChat !== undefined ? hasChat : true,
        hasReactions: hasReactions !== undefined ? hasReactions : true,
        showElapsedTime: showElapsedTime !== undefined ? showElapsedTime : true,
        maxSchedulesToShow: maxSchedulesToShow || 3,
        registrationPageId: registrationPageId || null,
        countdownPageId: countdownPageId || null,
        hostId: (session.user as any).id,
        // A/B Testing
        enableABTesting: enableABTesting || false,
        trafficSplitPercent: trafficSplitPercent || 50,
        testRegistrationPage: testRegistrationPage || false,
        regPageAId: regPageAId || null,
        regPageBId: regPageBId || null,
        testSchedule: testSchedule || false,
        scheduleAIds: scheduleAIds || null,
        scheduleBIds: scheduleBIds || null,
        testOffer: testOffer || false,
        offerAId: offerAId || null,
        offerBId: offerBId || null,
        testVideo: testVideo || false,
        videoAId: videoAId || null,
        videoBId: videoBId || null,
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    console.log('Created webinar:', webinar.id)

    // Create all schedules
    const scheduleData = schedules.map((schedule: any) => {
      const data: any = {
        webinarId: webinar.id,
        scheduleType: schedule.scheduleType,
        isActive: true,
      }

      if (schedule.scheduleType === 'specific') {
        data.scheduledAt = new Date(schedule.scheduledAt)
        data.timezone = schedule.timezone || 'UTC'
        data.useUserTimezone = schedule.useUserTimezone || false
      } else if (schedule.scheduleType === 'justInTime') {
        data.minutesFromReg = schedule.minutesFromReg || 5
      } else if (schedule.scheduleType === 'recurring') {
        data.recurringPattern = schedule.recurringPattern
        data.timezone = schedule.timezone || 'UTC'
        data.useUserTimezone = schedule.useUserTimezone || false
      }

      return data
    })

    console.log('Creating schedules:', JSON.stringify(scheduleData, null, 2))

    await prisma.webinarSchedule.createMany({
      data: scheduleData
    })

    // Fetch webinar with schedules
    const webinarWithSchedules = await prisma.webinar.findUnique({
      where: { id: webinar.id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        schedules: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    console.log('Webinar created successfully with schedules:', webinarWithSchedules?.schedules?.length)

    return NextResponse.json(
      { webinar: webinarWithSchedules, message: 'Webinar created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create webinar error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const webinars = await prisma.webinar.findMany({
      where: {
        hostId: (session.user as any).id
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        registrations: {
          select: {
            id: true,
            attended: true,
          }
        },
        schedules: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ webinars })
  } catch (error) {
    console.error('Get webinars error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
