import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/webinars/[id]/attendees-with-replay - Get all registrations with replay data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const webinarId = params.id;

    // Removed ownership check - all admins can view attendees
    const webinar = await prisma.webinar.findUnique({
      where: { id: webinarId },
    });

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 });
    }

    // Get all registrations with replay and session data
    const registrations = await prisma.registration.findMany({
      where: { webinarId },
      include: {
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get most recent session
        },
      },
      orderBy: { registeredAt: 'desc' },
    });

    // Transform data for easier consumption
    const attendeesData = registrations.map((reg) => {
      const mostRecentSession = reg.sessions[0];
      
      return {
        id: reg.id,
        name: reg.name,
        email: reg.email,
        phone: reg.phone,
        registeredAt: reg.registeredAt,
        
        // Registration data
        registrationDevice: reg.registrationDevice || 'Unknown',
        
        // Live attendance
        attended: reg.attended,
        joinedAt: reg.joinedAt,
        leftAt: reg.leftAt,
        
        // Replay data
        watchedReplay: reg.watchedReplay,
        replayWatchTime: reg.replayWatchTime,
        replayWatchTimeFormatted: formatSeconds(reg.replayWatchTime),
        replayClickedCTA: reg.replayClickedCTA,
        replayDevice: reg.replayDevice || 'Unknown',
        
        // Session data (live or replay)
        lastSessionDevice: mostRecentSession?.device || 'Unknown',
        lastSessionWatchTime: mostRecentSession?.totalWatchTime || 0,
        lastSessionWatchTimeFormatted: formatSeconds(mostRecentSession?.totalWatchTime || 0),
        lastSessionVideoPosition: mostRecentSession?.videoPosition || 0,
        lastSessionCompleted: mostRecentSession?.completed || false,
      };
    });

    // Calculate summary stats
    const stats = {
      totalRegistrations: registrations.length,
      totalAttended: registrations.filter((r) => r.attended).length,
      totalWatchedReplay: registrations.filter((r) => r.watchedReplay).length,
      totalClickedCTAInReplay: registrations.filter((r) => r.replayClickedCTA).length,
      
      // Device breakdown
      registrationDevices: {
        mobile: registrations.filter((r) => r.registrationDevice === 'mobile').length,
        desktop: registrations.filter((r) => r.registrationDevice === 'desktop').length,
        unknown: registrations.filter((r) => !r.registrationDevice).length,
      },
      
      replayDevices: {
        mobile: registrations.filter((r) => r.replayDevice === 'mobile').length,
        desktop: registrations.filter((r) => r.replayDevice === 'desktop').length,
        unknown: registrations.filter((r) => r.watchedReplay && !r.replayDevice).length,
      },
      
      // Average replay watch time
      avgReplayWatchTime: registrations.length > 0 
        ? Math.floor(
            registrations.reduce((sum, r) => sum + (r.replayWatchTime || 0), 0) / 
            registrations.filter((r) => r.watchedReplay).length
          ) || 0
        : 0,
    };

    return NextResponse.json({
      success: true,
      webinar: {
        id: webinar.id,
        title: webinar.title,
      },
      stats,
      attendees: attendeesData,
    });
  } catch (error) {
    console.error('[Attendees API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendees data' },
      { status: 500 }
    );
  }
}

// Helper function to format seconds as HH:MM:SS or MM:SS
function formatSeconds(seconds: number): string {
  if (seconds === 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
