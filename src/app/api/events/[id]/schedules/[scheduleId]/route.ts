import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PUT /api/events/[id]/schedules/[scheduleId] - Update schedule
export async function PUT(
  req: Request,
  { params }: { params: { id: string; scheduleId: string } }
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
      isActive,
    } = body;

    const schedule = await prisma.eventSchedule.update({
      where: { id: params.scheduleId },
      data: {
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        timezone,
        zoomLink,
        zoomMeetingId,
        zoomPassword,
        maxAttendees,
        isActive,
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Failed to update schedule:', error);
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
}

// DELETE /api/events/[id]/schedules/[scheduleId] - Delete schedule
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; scheduleId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if there are registrations
    const registrationCount = await prisma.eventRegistration.count({
      where: { eventScheduleId: params.scheduleId }
    });

    if (registrationCount > 0) {
      // Soft delete - just mark as inactive
      await prisma.eventSchedule.update({
        where: { id: params.scheduleId },
        data: { isActive: false }
      });
    } else {
      // Hard delete if no registrations
      await prisma.eventSchedule.delete({
        where: { id: params.scheduleId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete schedule:', error);
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}
