import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const webinarId = params.id;

    const webinar = await prisma.webinar.findUnique({
      where: { id: webinarId },
      select: {
        schedules: {
          select: {
            id: true,
            scheduleType: true,
            scheduledAt: true,
            minutesFromReg: true,
            timezone: true,
            useUserTimezone: true,
            recurringPattern: true,
          },
        },
      },
    });

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 });
    }

    return NextResponse.json({ schedules: webinar.schedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
