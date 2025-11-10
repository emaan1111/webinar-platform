import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/tracking/engagement - Track engagement events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      webinarId,
      eventType, // 'chat' | 'reaction' | 'question' | 'poll' | 'offer_view' | 'offer_click'
      eventData,
      timestamp,
    } = body;

    if (!sessionId || !webinarId || !eventType) {
      return NextResponse.json(
        { error: 'Session ID, Webinar ID, and event type required' },
        { status: 400 }
      );
    }

    // Create engagement event
    await prisma.engagementEvent.create({
      data: {
        sessionId,
        webinarId,
        eventType,
        eventData: eventData ? JSON.stringify(eventData) : null,
        timestamp: timestamp || 0,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Engagement tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track engagement event' },
      { status: 500 }
    );
  }
}
