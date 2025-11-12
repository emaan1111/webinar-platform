import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncAttendanceToClickFunnels } from '@/lib/clickfunnels';

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
      const updatedSession = await prisma.attendeeSession.update({
        where: { id: session.id },
        data: {
          leftAt: new Date(),
          isActive: false,
          videoPosition: videoPosition ?? session.videoPosition,
          totalWatchTime: watchTime ?? session.totalWatchTime,
        },
      });

      // Update registration left time
      const registration = await prisma.registration.update({
        where: { id: registrationId },
        data: {
          leftAt: new Date(),
        },
        include: {
          webinar: true,
        }
      });

      // Sync attendance to ClickFunnels asynchronously
      // Don't await - let it run in background
      const webinarDuration = registration.webinar.duration ? registration.webinar.duration * 60 : 3600; // Convert minutes to seconds
      const finalWatchTime = updatedSession.totalWatchTime;
      const finalVideoPosition = updatedSession.videoPosition;
      
      // Determine if user reached offer CTA (last 15 minutes of webinar)
      const offerCTAThreshold = Math.max(0, webinarDuration - 900); // 15 minutes before end
      const reachedOfferCTA = finalVideoPosition >= offerCTAThreshold;
      
      syncAttendanceToClickFunnels({
        email: registration.email,
        webinarDuration,
        watchTime: finalWatchTime,
        attended: true,
        isReplay: false, // Can be enhanced to detect replay vs live
        reachedOfferCTA,
        webinarTitle: registration.webinar.title,
        leftAt: updatedSession.leftAt || undefined,
      }).catch(err => {
        console.error('Failed to sync attendance to ClickFunnels:', err);
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
