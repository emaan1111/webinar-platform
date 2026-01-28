import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/events - List all events
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const events = await prisma.event.findMany({
      where: { hostId: session.user.id },
      include: {
        schedules: {
          orderBy: { startTime: 'asc' },
        },
        bundledWebinar: {
          select: { id: true, title: true, slug: true }
        },
        _count: {
          select: { registrations: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST /api/events - Create a new event
export async function POST(req: Request) {
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
      zoomLink,
      zoomMeetingId,
      zoomPassword,
      bundledWebinarId,
      bundleDescription,
      webinarOptional,
      maxAttendees,
      requirePhone,
      registrationTag,
      schedules, // Array of { startTime, endTime, timezone, zoomLink?, maxAttendees? }
    } = body;

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug is unique
    const existingEvent = await prisma.event.findUnique({
      where: { slug },
    });
    if (existingEvent) {
      return NextResponse.json(
        { error: 'An event with this slug already exists' },
        { status: 400 }
      );
    }

    // Create event with schedules
    const event = await prisma.event.create({
      data: {
        title,
        slug,
        description,
        thumbnail,
        hostId: session.user.id,
        zoomLink,
        zoomMeetingId,
        zoomPassword,
        bundledWebinarId: bundledWebinarId || null,
        bundleDescription,
        webinarOptional: webinarOptional ?? true,
        maxAttendees,
        requirePhone: requirePhone ?? false,
        registrationTag: registrationTag || null,
        schedules: schedules?.length > 0 ? {
          create: schedules.map((s: any) => ({
            startTime: new Date(s.startTime),
            endTime: s.endTime ? new Date(s.endTime) : null,
            timezone: s.timezone || 'America/New_York',
            zoomLink: s.zoomLink,
            zoomMeetingId: s.zoomMeetingId,
            zoomPassword: s.zoomPassword,
            maxAttendees: s.maxAttendees,
          })),
        } : undefined,
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
    console.error('Failed to create event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
