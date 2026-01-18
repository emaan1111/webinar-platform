import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const metric = searchParams.get('metric');
    const engagementMinutes = parseInt(searchParams.get('engagementMinutes') || '30');
    const webinarIds = searchParams.get('webinarIds')?.split(',').filter(Boolean) || [];

    if ((!date && (!startDateParam || !endDateParam)) || !metric) {
      return NextResponse.json(
        { error: 'Either (date) or (startDate & endDate) and (metric) are required' },
        { status: 400 }
      );
    }

    let start: Date;
    let end: Date;

    if (date) {
        start = new Date(date + 'T00:00:00');
        end = new Date(start);
        end.setDate(end.getDate() + 1);
        console.log(`🔍 Fetching details for ${metric} on ${date}`);
    } else {
        // Range query
        start = new Date(startDateParam + 'T00:00:00');
        end = new Date(endDateParam + 'T00:00:00');
        end.setDate(end.getDate() + 1); // Include the end date fully
        console.log(`🔍 Fetching details for ${metric} between ${startDateParam} and ${endDateParam}`);
    }

    // Base query for registrations on this date/range
    // Note: Metrics in main report are based on registrations created on that date
    // except specific cases. But generally all people-metrics are subsets of registrations.
    // 'pastRegistrationCount' is also based on registrations on that date.
    
    // We fetch all registrations for that day, then filter in memory to match the logic of the main report 
    // to ensure consistency.
    const registrations = await prisma.registration.findMany({
      where: {
        registeredAt: {
          gte: start,
          lt: end
        },
        ...(webinarIds.length > 0 ? { webinarId: { in: webinarIds } } : {})
      },
      include: {
        webinar: {
            select: {
                title: true,
                duration: true
            }
        },
        sessions: {
            orderBy: { joinedAt: 'desc' }
        },
        sales: {
            orderBy: { purchasedAt: 'desc' }
        },
        offerAnalytics: true,
        reactions: true,
        chatMessages: true
      },
      orderBy: { registeredAt: 'desc' }
    });

    // Helper to calculate watch time
    const getWatchTime = (reg: any) => {
        const maxVideoPosition = reg.sessions.reduce((max: number, session: any) => {
          return Math.max(max, session.videoPosition || 0);
        }, 0);
        return maxVideoPosition > 0 ? maxVideoPosition : (reg.lastWatchedPosition || 0);
    };

    // Filter based on metric
    const filteredRegistrations = registrations.filter(reg => {
        const attendedLive = reg.attended;
        const hasReplaySessions = !reg.attended && reg.sessions.length > 0;
        const watchTimeSeconds = getWatchTime(reg);
        const watchTimeMinutes = watchTimeSeconds / 60;
        const isEngaged = watchTimeMinutes >= engagementMinutes;
        const hasSales = reg.sales.length > 0;
        const now = new Date(); // Ideally pass from client or use constant time if consistency matters
        
        switch (metric) {
            case 'registrations':
                return true;
            case 'totalAttendees':
                return attendedLive || hasReplaySessions;
            case 'liveAttendees':
                return attendedLive;
            case 'replayAttendees':
                return hasReplaySessions;
            case 'engagedTotal':
                return isEngaged;
            case 'engagedLive':
                return isEngaged && attendedLive;
            case 'engagedReplay':
                return isEngaged && hasReplaySessions;
            case 'salesTotal':
                return hasSales;
            case 'salesLive':
                return hasSales && attendedLive;
            case 'salesReplay':
                return hasSales && hasReplaySessions;
            case 'pastRegistrationCount': {
                 // Logic from main report
                 if (reg.attended) return true;
                 if (!reg.scheduledStartTime || !reg.webinar?.duration) return false;
                 const scheduledStart = new Date(reg.scheduledStartTime);
                 const scheduledEnd = new Date(scheduledStart.getTime() + reg.webinar.duration * 60 * 1000);
                 return now > scheduledEnd;
            }
            default:
                return false;
        }
    });

    // Format output
    const details = filteredRegistrations.map(reg => {
        const watchTimeSeconds = getWatchTime(reg);
        const formatDuration = (seconds: number) => {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            return `${h}h ${m}m ${s}s`;
        };

        const sessionDate = reg.sessions.length > 0 ? reg.sessions[0].joinedAt : null;
        const attendedStatus = reg.attended ? 'Attended Live' : 
                               (reg.sessions.length > 0 ? 'Watched Replay' : 
                                (new Date() > new Date(reg.scheduledStartTime || 0) ? 'Missed' : 'Upcoming'));

        // Check if offer seen
        const sawOffer = reg.offerAnalytics.some((oa: any) => oa.sawOffer) || reg.sessions.some((s: any) => s.engagements && s.engagements.some((e: any) => e.eventType === 'offer_view')); // Simplifying assumption if engagement events not loaded detailed
        // Note: engagement_events is not included in query above, relying on offerAnalytics if populated.
        // Actually, main code doesn't check 'sawOffer' for filtering, but user wants it in table.
        // Let's rely on 'offerAnalytics' table.

        const watchTimeMinutes = watchTimeSeconds / 60;
        const engagementScore = (reg.chatMessages.length * 2) + (reg.reactions.length * 1) + (watchTimeMinutes > 30 ? 5 : 0);

        return {
            id: reg.id,
            name: reg.name,
            email: reg.email,
            phone: reg.phone || '-',
            timezone: reg.timezone || '-',
            webinarTitle: reg.webinar.title,
            registeredAt: reg.registeredAt,
            attendedAt: sessionDate, // Date Webinar Attended
            totalTimeStayed: formatDuration(watchTimeSeconds),
            totalTimeSeconds: watchTimeSeconds,
            sawOffer: reg.offerAnalytics.some((oa: any) => oa.sawOffer) ? 'Yes' : 'No',
            replayWatched: reg.watchedReplay || (!reg.attended && reg.sessions.length > 0) ? 'Yes' : 'No',
            status: attendedStatus,
            leftAt: reg.leftAt, // Date Left
            engagement: engagementScore, // Simple score or count
            chatCount: reg.chatMessages.length,
            reactionCount: reg.reactions.length,
            lastWatchedPosition: formatDuration(reg.lastWatchedPosition || 0)
        };
    });

    return NextResponse.json({
        success: true,
        data: details,
        meta: {
            date,
            metric,
            count: details.length
        }
    });

  } catch (error) {
    console.error('❌ Error fetching details:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
