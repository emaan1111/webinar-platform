import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/events/[id] - Get single event
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        schedules: {
          orderBy: { startTime: 'asc' },
          include: {
            _count: { select: { registrations: true } }
          }
        },
        bundledWebinar: {
          select: { 
            id: true, 
            title: true, 
            slug: true,
            schedules: {
              where: { isActive: true },
              orderBy: { scheduledAt: 'asc' }
            }
          }
        },
        registrations: {
          orderBy: { registeredAt: 'desc' },
          take: 1000,
          include: {
            eventSchedule: true
          }
        },
        _count: {
          select: { registrations: true }
        }
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Enhance registrations with webinar data manually
    // (Since there is no direct relation in the schema to eager load)
    const webinarRegIds = event.registrations
      .map(r => r.webinarRegistrationId)
      .filter((id): id is string => !!id);

    let webinarRegsMap: Record<string, any> = {};

    if (webinarRegIds.length > 0) {
      const webinarRegs = await prisma.registration.findMany({
        where: { id: { in: webinarRegIds } },
        select: {
          id: true,
          attended: true,
          joinedAt: true,
          leftAt: true,
          country: true,
        }
      });
      
      webinarRegs.forEach(wr => {
        webinarRegsMap[wr.id] = wr;
      });
    }

    const enhancedRegistrations = event.registrations.map(reg => ({
      ...reg,
      webinarRegistration: reg.webinarRegistrationId ? webinarRegsMap[reg.webinarRegistrationId] : null
    }));

    return NextResponse.json({
      ...event,
      registrations: enhancedRegistrations
    });
  } catch (error) {
    console.error('Failed to fetch event:', error);
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}

// PUT /api/events/[id] - Update event
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      slug,
      description,
      thumbnail,
      status,
      zoomLink,
      zoomMeetingId,
      zoomPassword,
      bundledWebinarId,
      bundleDescription,
      webinarOptional,
      maxAttendees,
      requirePhone,
      confirmationEmailEnabled,
      reminderEmailEnabled,
      thankYouPageUrl,
      thankYouTemplateId,
      registrationPageUrl,
      registrationTag,
      smsReminderEnabled,
      smsReminderBody,
    } = body;

    // Check slug uniqueness if changed
    if (slug) {
      const existingEvent = await prisma.event.findFirst({
        where: {
          slug,
          NOT: { id: params.id }
        },
      });
      if (existingEvent) {
        return NextResponse.json(
          { error: 'An event with this slug already exists' },
          { status: 400 }
        );
      }
    }

    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        title,
        slug,
        description,
        thumbnail,
        status,
        zoomLink,
        zoomMeetingId,
        zoomPassword,
        bundledWebinarId: bundledWebinarId === '' ? null : bundledWebinarId,
        bundleDescription,
        webinarOptional,
        maxAttendees,
        requirePhone,
        confirmationEmailEnabled,
        reminderEmailEnabled,
        thankYouPageUrl: thankYouPageUrl === '' ? null : thankYouPageUrl,
        thankYouTemplateId: thankYouTemplateId === '' ? null : thankYouTemplateId,
        registrationPageUrl: registrationPageUrl === '' ? null : registrationPageUrl,
        registrationTag: registrationTag === '' ? null : registrationTag,
        smsReminderEnabled,
        smsReminderBody,
      },
      include: {
        schedules: true,
        bundledWebinar: {
          select: { id: true, title: true, slug: true }
        },
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('Failed to update event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

// DELETE /api/events/[id] - Delete event
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.event.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
