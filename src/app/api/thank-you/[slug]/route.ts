import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET thank you page for a registration
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const registrationId = searchParams.get('r')
    const scheduleId = searchParams.get('s')

    // Get webinar by slug
    const webinar = await prisma.webinar.findUnique({
      where: { slug: params.slug },
      include: {
        host: { select: { name: true, email: true } },
        schedules: true
      }
    })

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    // Get registration if ID provided
    let registration = null
    if (registrationId) {
      registration = await prisma.registration.findUnique({
        where: { id: registrationId },
        select: {
          name: true,
          email: true,
          scheduleId: true,
          registeredAt: true,
          timezone: true
        }
      })
    }

    // Get the schedule
    let schedule = null
    const sid = registration?.scheduleId || scheduleId
    if (sid) {
      schedule = await prisma.webinarSchedule.findUnique({
        where: { id: sid }
      })
    }

    // Get thank you template
    let template = null
    if (webinar.thankYouTemplateId) {
      template = await prisma.thankYouTemplate.findUnique({
        where: { id: webinar.thankYouTemplateId }
      })
    }

    // If no template assigned, use default
    if (!template) {
      template = await prisma.thankYouTemplate.findFirst({
        where: { isSystem: true, name: 'Default' }
      })
    }

    return NextResponse.json({
      webinar: {
        id: webinar.id,
        slug: webinar.slug,
        title: webinar.title,
        description: webinar.description,
        duration: webinar.duration,
        hostName: webinar.host.name,
        hostEmail: webinar.host.email
      },
      registration,
      schedule,
      template
    })
  } catch (error) {
    console.error('Error fetching thank you page:', error)
    return NextResponse.json({ error: 'Failed to load thank you page' }, { status: 500 })
  }
}
