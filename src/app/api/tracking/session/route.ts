import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/tracking/session - Create or update session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      registrationId,
      webinarId,
      scheduleId,
      action, // 'join' | 'update' | 'leave'
      videoPosition,
      watchTime,
      userAgent,
      device,
    } = body;

    if (!registrationId || !webinarId) {
      return NextResponse.json(
        { error: 'Registration ID and Webinar ID required' },
        { status: 400 }
      );
    }

    // Find active session or create new one
    let session = await prisma.attendeeSession.findFirst({
      where: {
        registrationId,
        isActive: true,
      },
    });

    if (action === 'join' && !session) {
      // Create new session
      session = await prisma.attendeeSession.create({
        data: {
          registrationId,
          webinarId,
          scheduleId,
          userAgent,
          device,
          browser: userAgent ? getBrowser(userAgent) : undefined,
        },
      });

      // Update registration joined time
      await prisma.registration.update({
        where: { id: registrationId },
        data: {
          attended: true,
          joinedAt: new Date(),
        },
      });

      return NextResponse.json({ 
        success: true, 
        sessionId: session.id,
        message: 'Session started'
      });
    }

    if (action === 'update' && session) {
      // Update session with watch progress
      await prisma.attendeeSession.update({
        where: { id: session.id },
        data: {
          lastSeenAt: new Date(),
          videoPosition: videoPosition ?? session.videoPosition,
          totalWatchTime: watchTime ?? session.totalWatchTime,
        },
      });

      return NextResponse.json({ 
        success: true,
        sessionId: session.id,
        message: 'Session updated'
      });
    }

    if (action === 'leave' && session) {
      // End session
      await prisma.attendeeSession.update({
        where: { id: session.id },
        data: {
          leftAt: new Date(),
          isActive: false,
          videoPosition: videoPosition ?? session.videoPosition,
          totalWatchTime: watchTime ?? session.totalWatchTime,
        },
      });

      // Update registration left time
      await prisma.registration.update({
        where: { id: registrationId },
        data: {
          leftAt: new Date(),
        },
      });

      return NextResponse.json({ 
        success: true,
        message: 'Session ended'
      });
    }

    return NextResponse.json({ 
      success: true,
      sessionId: session?.id
    });

  } catch (error) {
    console.error('Session tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track session' },
      { status: 500 }
    );
  }
}

function getBrowser(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Other';
}
