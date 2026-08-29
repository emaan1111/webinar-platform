import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fromZonedTime } from 'date-fns-tz';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const metric = searchParams.get('metric');
    const engagementMinutes = parseInt(searchParams.get('engagementMinutes') || '30');
    // Must match the timezone /api/reports bucketed the row with, otherwise the
    // drill-down reads a different 24h slice than the number it was opened from.
    const timezone = searchParams.get('timezone') || 'UTC';
    const webinarIds = searchParams.get('webinarIds')?.split(',').filter(Boolean) || [];
    const internalWebinarIds = webinarIds.filter(id => !id.startsWith('ext_'));
    const extWebinarIds = webinarIds.filter(id => id.startsWith('ext_')).map(id => id.replace('ext_', ''));
    const hasInternalFilter = internalWebinarIds.length > 0;
    const hasExternalFilter = extWebinarIds.length > 0;

    if ((!date && (!startDateParam || !endDateParam)) || !metric) {
      return NextResponse.json(
        { error: 'Either (date) or (startDate & endDate) and (metric) are required' },
        { status: 400 }
      );
    }

    let start: Date;
    let end: Date;

    // Day after the given yyyy-MM-dd, as a calendar date - so the window ends at
    // local midnight rather than a bare +24h from the start instant.
    const nextDay = (d: string) => {
        const [y, m, day] = d.split('-').map(Number);
        return new Date(Date.UTC(y, m - 1, day + 1)).toISOString().split('T')[0];
    };

    if (date) {
        start = fromZonedTime(`${date}T00:00:00`, timezone);
        end = fromZonedTime(`${nextDay(date)}T00:00:00`, timezone);
        console.log(`🔍 Fetching details for ${metric} on ${date} (${timezone})`);
    } else {
        // Range query
        start = fromZonedTime(`${startDateParam}T00:00:00`, timezone);
        end = fromZonedTime(`${nextDay(endDateParam!)}T00:00:00`, timezone); // Include the end date fully
        console.log(`🔍 Fetching details for ${metric} between ${startDateParam} and ${endDateParam} (${timezone})`);
    }

    // Base query for registrations on this date/range
    // Note: Metrics in main report are based on registrations created on that date
    // except specific cases. But generally all people-metrics are subsets of registrations.
    // 'pastRegistrationCount' is also based on registrations on that date.
    
    // We fetch all registrations for that day, then filter in memory to match the logic of the main report 
    // to ensure consistency.
    // Same exclusion /api/reports applies, so the row total and this list count
    // the same people.
    const isTestUser = (name: string, email: string) => {
      const nameLower = (name || '').toLowerCase()
      const emailLower = (email || '').toLowerCase()
      return (
        emailLower.includes('test') ||
        emailLower.includes('demo') ||
        emailLower.includes('fake') ||
        emailLower.includes('scripted') ||
        emailLower.includes('example') ||
        emailLower.includes('sample') ||
        nameLower.includes('test') ||
        nameLower.includes('demo') ||
        nameLower.includes('fake') ||
        nameLower.includes('scripted') ||
        nameLower.includes('sample')
      )
    }

    const allRegistrations = await prisma.registration.findMany({
      where: {
        registeredAt: {
          gte: start,
          lt: end
        },
        ...(internalWebinarIds.length > 0 ? { webinarId: { in: internalWebinarIds } } : {})
      },
      include: {
        user: {
            select: {
                name: true,
                email: true
            }
        },
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

    const registrations = allRegistrations.filter((reg: any) =>
      !isTestUser(reg.name || reg.user?.name || '', reg.email || reg.user?.email || '')
    );

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

    // --- Also include External Webinar Registrations ---
    // Skip if only internal IDs are selected
    const includeExternal = webinarIds.length === 0 || hasExternalFilter;
    let externalDetails: any[] = [];
    if (includeExternal) {
    const extWhere: any = {
      registeredAt: {
        gte: start,
        lt: end,
      },
    };
    if (extWebinarIds.length > 0) {
      extWhere.externalWebinarId = { in: extWebinarIds };
    }
    const allExternalRegs = await prisma.externalWebinarRegistration.findMany({
      where: extWhere,
      include: {
        externalWebinar: {
          select: {
            name: true,
            externalWebinarName: true,
            webinarDurationMinutes: true,
          }
        }
      },
      orderBy: { registeredAt: 'desc' }
    });

    const externalRegs = allExternalRegs.filter((reg: any) =>
      !isTestUser(reg.name || '', reg.email || '')
    );

    // Filter external registrations by metric
    const filteredExternalRegs = externalRegs.filter((reg: any) => {
      const watchTimeMinutes = reg.watchTimeMinutes || 0;
      const attendedLive = reg.attended;
      const hasReplay = !reg.attended && watchTimeMinutes > 0;
      const isEngaged = watchTimeMinutes >= engagementMinutes;

      switch (metric) {
        case 'registrations':
          return true;
        case 'totalAttendees':
          return attendedLive || hasReplay;
        case 'liveAttendees':
          return attendedLive;
        case 'replayAttendees':
          return hasReplay;
        case 'engagedTotal':
          return isEngaged;
        case 'engagedLive':
          return isEngaged && attendedLive;
        case 'engagedReplay':
          return isEngaged && hasReplay;
        default:
          return false;
      }
    });

    // Format external registrations
    externalDetails = filteredExternalRegs.map((reg: any) => {
      const watchTimeMinutes = reg.watchTimeMinutes || 0;
      const watchTimeSeconds = watchTimeMinutes * 60;
      const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h}h ${m}m ${s}s`;
      };

      const attendedStatus = reg.attended ? 'Attended Live' :
        (watchTimeMinutes > 0 ? 'Watched Replay' : 'Missed');

      return {
        id: `ext_${reg.id}`,
        name: reg.name,
        email: reg.email,
        phone: reg.phone || '-',
        timezone: reg.timezone || '-',
        webinarTitle: reg.externalWebinar?.externalWebinarName || reg.externalWebinar?.name || 'External Webinar',
        registeredAt: reg.registeredAt,
        attendedAt: reg.joinedAt,
        totalTimeStayed: formatDuration(watchTimeSeconds),
        totalTimeSeconds: watchTimeSeconds,
        sawOffer: 'N/A',
        replayWatched: (!reg.attended && watchTimeMinutes > 0) ? 'Yes' : 'No',
        status: attendedStatus,
        leftAt: reg.leftAt,
        engagement: 0,
        chatCount: 0,
        reactionCount: 0,
        lastWatchedPosition: formatDuration(watchTimeSeconds),
        source: 'external',
      };
    });
    } // end if (includeExternal)

    // Merge and sort
    const allDetails = [...details, ...externalDetails].sort((a: any, b: any) =>
      new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
    );

    return NextResponse.json({
        success: true,
        data: allDetails,
        meta: {
            date,
            metric,
            count: allDetails.length
        }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
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
