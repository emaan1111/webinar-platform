import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getInternalLinkedZoomSessions, fullZoomSessionIds } from '@/lib/zoomSessions';

// GET /api/webinars/[id]/schedules — the rows the internal registration page builds
// its time picker from.
//
// A Zoom session that has reached its capacity (set on the Sessions page) is still
// listed, flagged `isFull`, so the picker can show it as FULL without letting it be
// chosen. The capacity lives on the session, which sits at the same instant as the
// webinar's Zoom schedule row — the two are matched by time. `isZoomSession` itself is
// read for that match only and is NOT returned: the picker has never told the visitor
// which time is a Zoom session and must not start now.
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
            isZoomSession: true,
          },
        },
      },
    });

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 });
    }

    const fullInstants = new Set<number>();
    if (webinar.schedules.some((s) => s.isZoomSession)) {
      const linked = await getInternalLinkedZoomSessions(webinarId);
      const fullIds = await fullZoomSessionIds(linked);
      for (const s of linked) {
        if (fullIds.has(s.id)) fullInstants.add(s.scheduledAt.getTime());
      }
    }

    const schedules = webinar.schedules.map(({ isZoomSession, ...schedule }) => ({
      ...schedule,
      isFull:
        isZoomSession &&
        !!schedule.scheduledAt &&
        fullInstants.has(new Date(schedule.scheduledAt).getTime()),
    }));

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
