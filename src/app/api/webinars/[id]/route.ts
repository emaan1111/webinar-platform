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

    const webinar = await prisma.webinar.findFirst({
      where: {
        id: params.id,
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
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Received webinar update request for:', params.id, body)
    
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

    // Verify ownership
    const existingWebinar = await prisma.webinar.findFirst({
      where: {
        id: params.id,
        hostId: (session.user as any).id
      }
    })

    if (!existingWebinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    // Extract schedules and non-existent fields from body
    const { schedules, registrationPopupStyle, ...webinarData } = body

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    // Verify ownership
    const webinar = await prisma.webinar.findFirst({
      where: {
        id: params.id,
        hostId: (session.user as any).id
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
