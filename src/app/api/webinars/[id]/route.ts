import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/webinars/[id] - Get single webinar
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow all hosts to view all webinars (removed hostId filter)
    const webinar = await prisma.webinar.findUnique({
      where: {
        id: params.id
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        schedules: true,
        registrations: true,
        offers: true,
        bonusResources: true,
      }
    })

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    return NextResponse.json({ webinar })
  } catch (error) {
    console.error('Get webinar error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/webinars/[id] - Update webinar
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔵 PATCH /api/webinars/[id] - Starting update for:', params.id)
    
    const session = await getServerSession(authOptions)
    console.log('🔵 Session check:', session?.user ? 'Authenticated' : 'Not authenticated')

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('🔵 Received webinar update request for:', params.id)
    console.log('🔵 Body keys:', Object.keys(body))
    
    // Map old field names to new ones for backwards compatibility
    if (body.registrationTemplateId !== undefined) {
      body.registrationPageId = body.registrationTemplateId
      delete body.registrationTemplateId
      console.log('🔄 Mapped registrationTemplateId to registrationPageId:', body.registrationPageId)
    }
    
    // Map A/B testing template fields to page fields
    if (body.regTemplateAId !== undefined) {
      body.regPageAId = body.regTemplateAId
      delete body.regTemplateAId
    }
    if (body.regTemplateBId !== undefined) {
      body.regPageBId = body.regTemplateBId
      delete body.regTemplateBId
    }

    // Allow all hosts to edit all webinars (removed hostId verification)
    const existingWebinar = await prisma.webinar.findUnique({
      where: {
        id: params.id
      }
    })

    if (!existingWebinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    // Extract schedules and non-existent fields from body
    const { schedules, registrationPopupStyle, ...bodyData } = body

    // Only include fields that exist in the Webinar model
    const allowedFields = [
      'title',
      'slug',
      'internalName',
      'description',
      'thumbnail',
      'duration',
      'vimeoVideoId',
      'videoUrl',
      'videoDuration',
      'status',
      'recordingUrl',
      'hasReplay',
      'hasOffers',
      'hasChat',
      'hasReactions',
      'maxSchedulesToShow',
      'registrationPageId',
      'thankYouTemplateId',
      'countdownPageId',
      'showElapsedTime',
      'replayEnabled',
      'replayDurationDays',
      'replayExpiresAt',
      'mostlyAttendedThreshold',
      'autoSendPostSessionSMS',
      'postSessionSMSMinutesAfter',
      'postSessionSMSMinWatchedMinutes',
      'postSessionSMSMinWatchedPercentage',
      'postSessionSMSBody',
      'enableABTesting',
      'trafficSplitPercent',
      'testRegistrationPage',
      'regPageAId',
      'regPageBId',
      'testSchedule',
      'scheduleAIds',
      'scheduleBIds',
      'testOffer',
      'offerAId',
      'offerBId',
      'testVideo',
      'videoAId',
      'videoBId'
    ]

    // Filter to only include allowed fields and convert types
    const webinarData: any = {}
    for (const field of allowedFields) {
      if (bodyData[field] !== undefined) {
        let value = bodyData[field]
        
        // Convert string numbers to integers for numeric fields
        if (field === 'duration' || field === 'videoDuration' || field === 'replayDurationDays' || field === 'trafficSplitPercent' || field === 'mostlyAttendedThreshold' || field === 'postSessionSMSMinutesAfter' || field === 'postSessionSMSMinWatchedMinutes' || field === 'postSessionSMSMinWatchedPercentage') {
          // For postSessionSMSMinutesAfter, default to 0 instead of null (schema doesn't allow null)
          if (field === 'postSessionSMSMinutesAfter') {
            value = value ? parseInt(value) : 0
          } else {
            value = value ? parseInt(value) : null
          }
        }
        
        // Convert string booleans to boolean
        if (field === 'autoSendPostSessionSMS') {
          value = value === 'true' || value === true
        }
        
        webinarData[field] = value
      }
    }

    // Update webinar basic info
    console.log('💾 Saving webinar data:', webinarData)
    const webinar = await prisma.webinar.update({
      where: { id: params.id },
      data: webinarData,
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        schedules: true
      }
    })
    console.log('✅ Webinar saved with registrationPageId:', webinar.registrationPageId)

    // Update schedules if provided
    if (schedules && Array.isArray(schedules)) {
      // Delete all existing schedules
      await prisma.webinarSchedule.deleteMany({
        where: { webinarId: params.id }
      })

      // Create new schedules
      if (schedules.length > 0) {
        const schedulesData = schedules.map((schedule: any) => ({
          webinarId: params.id,
          scheduleType: schedule.scheduleType,
          scheduledAt: schedule.scheduledAt ? new Date(schedule.scheduledAt) : null,
          timezone: schedule.timezone || null,
          useUserTimezone: schedule.useUserTimezone || false,
          minutesFromReg: schedule.minutesFromReg || null,
          recurringPattern: schedule.recurringPattern || null,
          isZoomSession: schedule.isZoomSession || false,
          zoomLink: schedule.zoomLink || null,
          isActive: true
        }))

        await prisma.webinarSchedule.createMany({
          data: schedulesData
        })

        console.log('Updated webinar schedules:', schedulesData.length)
      }
    }

    // Fetch updated webinar with schedules
    const updatedWebinar = await prisma.webinar.findUnique({
      where: { id: params.id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        schedules: true
      }
    })

    return NextResponse.json({ webinar: updatedWebinar, message: 'Webinar updated successfully' })
  } catch (error) {
    console.error('Update webinar error:', error)
    // Log full error details for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

// DELETE /api/webinars/[id] - Delete webinar
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow all hosts to delete all webinars (removed hostId verification)
    const webinar = await prisma.webinar.findUnique({
      where: {
        id: params.id
      }
    })

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    // Delete webinar (cascade will handle related records)
    await prisma.webinar.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Webinar deleted successfully' })
  } catch (error) {
    console.error('Delete webinar error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
