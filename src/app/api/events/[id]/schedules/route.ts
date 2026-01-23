import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/events/[id]/schedules - Add schedule to event
export async function POST(
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
      startTime,
      endTime,
      timezone,
      zoomLink,
      zoomMeetingId,
      zoomPassword,
      maxAttendees,
    } = body;

    if (!startTime) {
      return NextResponse.json(
        { error: 'Start time is required' },
        { status: 400 }
      );
    }

    const schedule = await prisma.eventSchedule.create({
      data: {
        eventId: params.id,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        timezone: timezone || 'America/New_York',
        zoomLink,
        zoomMeetingId,
        zoomPassword,
        maxAttendees,
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Failed to create schedule:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}

// GET /api/events/[id]/schedules - Get all schedules for event
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const schedules = await prisma.eventSchedule.findMany({
      where: { 
        eventId: params.id,
        isActive: true,
      },
      include: {
        _count: { select: { registrations: true } }
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Failed to fetch schedules:', error);
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }
}
