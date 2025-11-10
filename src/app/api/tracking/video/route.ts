import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/tracking/video - Track video events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      webinarId,
      eventType, // 'play' | 'pause' | 'seek' | 'ended' | 'left'
      timestamp,
      watchedFrom,
      watchedTo,
    } = body;

    if (!sessionId || !webinarId || !eventType) {
      return NextResponse.json(
        { error: 'Session ID, Webinar ID, and event type required' },
        { status: 400 }
      );
    }

    // Create video watch event
    await prisma.videoWatchEvent.create({
      data: {
        sessionId,
        webinarId,
        eventType,
        timestamp: timestamp || 0,
        watchedFrom,
        watchedTo,
      },
    });

    // If ended, mark session as completed
    if (eventType === 'ended') {
      await prisma.attendeeSession.update({
        where: { id: sessionId },
        data: { completed: true },
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Video tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track video event' },
      { status: 500 }
    );
  }
}
