import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { listWebinars, getWebinarDetails, isWebinarJamConfigured } from '@/lib/webinarjam'

/**
 * External Webinars API
 * 
 * GET  /api/external-webinars - List all external webinars
 * POST /api/external-webinars - Create a new external webinar connection
 */

// GET - List all external webinars
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const externalWebinars = await prisma.externalWebinar.findMany({
      include: {
        _count: {
          select: {
            registrations: true,
            leadPages: true,
            schedules: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(externalWebinars)
  } catch (error) {
    console.error('Error fetching external webinars:', error)
    return NextResponse.json(
      { error: 'Failed to fetch external webinars' },
      { status: 500 }
    )
  }
}

// POST - Create a new external webinar connection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      platform = 'webinarjam',
      externalWebinarId,
      // Tag settings
      registrationTag,
      registrationTagId,
      attendedTag,
      attendedTagId,
      mostlyAttendedTag,
      mostlyAttendedTagId,
      partlyAttendedTag,
      partlyAttendedTagId,
      missedTag,
      missedTagId,
      replayAttendedTag,
      replayAttendedTagId,
      mostlyAttendedThreshold = 70,
      // SMS settings
      autoSendPostSessionSMS = false,
      postSessionSMSMinutesAfter = 0,
      postSessionSMSMinWatchedMinutes,
      postSessionSMSBody,
      // Facebook CAPI
      sendToFacebookCAPI = true,
    } = body

    if (!name || !externalWebinarId) {
      return NextResponse.json(
        { error: 'Name and external webinar ID are required' },
        { status: 400 }
      )
    }

    // Check for duplicate
    const existing = await prisma.externalWebinar.findUnique({
      where: {
        platform_externalWebinarId: {
          platform,
          externalWebinarId: String(externalWebinarId)
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'This webinar is already connected' },
        { status: 400 }
      )
    }

    // Fetch webinar name from API if configured
    let externalWebinarName = name
    if (isWebinarJamConfigured()) {
      const webinarDetails = await getWebinarDetails(String(externalWebinarId), platform as any)
      if (webinarDetails?.name) {
        externalWebinarName = webinarDetails.name
      }
    }

    const externalWebinar = await prisma.externalWebinar.create({
      data: {
        name,
        platform,
        externalWebinarId: String(externalWebinarId),
        externalWebinarName,
        registrationTag,
        registrationTagId,
        attendedTag,
        attendedTagId,
        mostlyAttendedTag,
        mostlyAttendedTagId,
        partlyAttendedTag,
        partlyAttendedTagId,
        missedTag,
        missedTagId,
        replayAttendedTag,
        replayAttendedTagId,
        mostlyAttendedThreshold,
        autoSendPostSessionSMS,
        postSessionSMSMinutesAfter,
        postSessionSMSMinWatchedMinutes,
        postSessionSMSBody,
        sendToFacebookCAPI,
      }
    })

    return NextResponse.json(externalWebinar, { status: 201 })
  } catch (error) {
    console.error('Error creating external webinar:', error)
    return NextResponse.json(
      { error: 'Failed to create external webinar' },
      { status: 500 }
    )
  }
}
