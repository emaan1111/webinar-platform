import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/analytics/aggregate - Get aggregated analytics for multiple webinars
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const webinarIds = searchParams.get('webinarIds')?.split(',') || [];
    const timeFrame = searchParams.get('timeFrame') || 'all';

    // Calculate date filter based on timeFrame
    let dateFilter: Date | undefined;
    const now = new Date();
    
    switch (timeFrame) {
      case 'today':
        dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '7d':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = undefined;
    }

    // Build where clause for registrations - removed hostId filter
    const whereClause: any = {
      webinarId: webinarIds.length > 0 ? { in: webinarIds } : undefined,
    };

    if (dateFilter) {
      whereClause.registeredAt = {
        gte: dateFilter,
      };
    }

    // Fetch all registrations with related data - removed hostId filter
    const registrations = await prisma.registration.findMany({
      where: whereClause,
      include: {
        webinar: {
          select: {
            duration: true
          }
        },
        sessions: {
          include: {
            engagements: true,
            videoEvents: true,
          },
        },
        pageVisits: true,
      },
      orderBy: { registeredAt: 'desc' },
    });

    // Get webinar IDs from results for filtering other queries
    const resultWebinarIds = [...new Set(registrations.map(r => r.webinarId))];

    // Calculate metrics
    const totalRegistrations = registrations.length;
    
    // For attendance metrics, only count registrations for past webinars
    const pastRegistrations = registrations.filter((r: any) => {
      if (!r.scheduledStartTime || !r.webinar?.duration) {
        return false; // Can't determine if past
      }
      
      const now = new Date();
      const scheduledStart = new Date(r.scheduledStartTime);
      const scheduledEnd = new Date(scheduledStart.getTime() + r.webinar.duration * 60 * 1000);
      
      return now > scheduledEnd; // Only include webinars that have ended
    });
    
    const totalPastRegistrations = pastRegistrations.length;
    const totalAttended = pastRegistrations.filter((r: any) => r.attended).length;
    const attendanceRate = totalPastRegistrations > 0 
      ? (totalAttended / totalPastRegistrations) * 100 
      : 0;

    const noShows = pastRegistrations.filter((r: any) => !r.attended).length;
    const noShowRate = totalPastRegistrations > 0
      ? (noShows / totalPastRegistrations) * 100
      : 0;

    // Calculate average watch time
    // Use videoPosition (furthest point watched) for accurate watch time
    const totalWatchTime = registrations.reduce((sum: number, reg: any) => {
      const maxVideoPosition = reg.sessions.reduce((max: number, session: any) => 
        Math.max(max, session.videoPosition || 0), 0
      );
      return sum + (maxVideoPosition > 0 ? maxVideoPosition : (reg.lastWatchedPosition || 0));
    }, 0);
    const avgWatchTime = totalAttended > 0 ? totalWatchTime / totalAttended : 0;

    // Count completion
    const completed = registrations.filter((r) => 
      r.sessions.some((s) => s.completed)
    ).length;
    const completionRate = totalAttended > 0
      ? (completed / totalAttended) * 100
      : 0;

    // Offer analytics
    const offerWhere: any = {
      webinarId: resultWebinarIds.length > 0 ? { in: resultWebinarIds } : undefined,
    };
    
    if (dateFilter) {
      offerWhere.createdAt = {
        gte: dateFilter,
      };
    }

    const offerAnalytics = await prisma.offerAnalytics.findMany({
      where: offerWhere,
    });

    const sawOffer = offerAnalytics.filter((o) => o.sawOffer).length;
    const clickedOffer = offerAnalytics.filter((o) => o.clickedOffer).length;
    const converted = offerAnalytics.filter((o) => o.converted).length;

    const offerViewRate = totalAttended > 0 ? (sawOffer / totalAttended) * 100 : 0;
    const offerClickRate = sawOffer > 0 ? (clickedOffer / sawOffer) * 100 : 0;
    const conversionRate = clickedOffer > 0 ? (converted / clickedOffer) * 100 : 0;

    // Sales analytics
    const salesWhere: any = {
      webinar: {
        hostId: user.id,
      },
    };

    if (webinarIds.length > 0) {
      salesWhere.webinarId = { in: webinarIds };
    } else if (resultWebinarIds.length > 0) {
      salesWhere.webinarId = { in: resultWebinarIds };
    }

    if (dateFilter) {
      salesWhere.purchasedAt = {
        gte: dateFilter,
      };
    }

    const webinarSales = await prisma.webinarSale.findMany({
      where: salesWhere,
      select: { amount: true },
    });

    const totalSales = webinarSales.length;
    const totalRevenue = webinarSales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
    const salesConversionRate = totalRegistrations > 0
      ? (totalSales / totalRegistrations) * 100
      : 0;

    // Join time analysis
    const joinTimes = registrations
      .filter((r) => r.joinedAt)
      .map((r) => {
        const session = r.sessions[0];
        return session ? session.videoPosition : 0;
      });

    const onTime = joinTimes.filter((t) => t <= 60).length;
    const earlyLate = joinTimes.filter((t) => t > 60 && t <= 300).length;
    const late = joinTimes.filter((t) => t > 300).length;

    // Engagement analysis
    const engagementWhere: any = {
      webinarId: resultWebinarIds.length > 0 ? { in: resultWebinarIds } : undefined,
    };
    
    if (dateFilter) {
      engagementWhere.createdAt = {
        gte: dateFilter,
      };
    }

    const engagementEvents = await prisma.engagementEvent.findMany({
      where: engagementWhere,
      orderBy: { timestamp: 'asc' },
    });

    const chatMessages = engagementEvents.filter((e) => e.eventType === 'chat').length;
    const reactions = engagementEvents.filter((e) => e.eventType === 'reaction').length;
    const questions = engagementEvents.filter((e) => e.eventType === 'question').length;
    const offerClicks = engagementEvents.filter((e) => e.eventType === 'offer_click').length;

    // Engagement by minute
    const engagementByMinute: Record<number, { chat: number; reactions: number }> = {};
    engagementEvents.forEach((event) => {
      const minute = Math.floor(event.timestamp / 60);
      if (!engagementByMinute[minute]) {
        engagementByMinute[minute] = { chat: 0, reactions: 0 };
      }
      if (event.eventType === 'chat') {
        engagementByMinute[minute].chat++;
      } else if (event.eventType === 'reaction') {
        engagementByMinute[minute].reactions++;
      }
    });

    // Page visits - use original webinarIds parameter, not resultWebinarIds
    // because we want to show page visits even for webinars without registrations yet
    const pageVisitWhere: any = {
      webinarId: webinarIds.length > 0 ? { in: webinarIds } : undefined,
    };
    
    if (dateFilter) {
      pageVisitWhere.enteredAt = {
        gte: dateFilter,
      };
    }

    const pageVisits = await prisma.pageVisit.findMany({
      where: pageVisitWhere,
    });

    const registrationPageVisits = pageVisits.filter((p: any) => p.pageType === 'registration').length;
    const countdownPageVisits = pageVisits.filter((p: any) => p.pageType === 'countdown').length;
    const webinarPageVisits = pageVisits.filter((p: any) => p.pageType === 'webinar').length;
    const thankYouPageVisits = pageVisits.filter((p: any) => p.pageType === 'thank_you').length;

    // Embed form views (inline and popup)
    const embedInlineVisits = pageVisits.filter((p: any) => p.pageType === 'embed-inline');
    const embedPopupVisits = pageVisits.filter((p: any) => p.pageType === 'embed-popup');
    const totalEmbedViews = embedInlineVisits.length + embedPopupVisits.length;
    const uniqueEmbedInlineVisitors = new Set(embedInlineVisits.map((v: any) => v.visitorId)).size;
    const uniqueEmbedPopupVisitors = new Set(embedPopupVisits.map((v: any) => v.visitorId)).size;
    const uniqueEmbedVisitors = new Set([...embedInlineVisits, ...embedPopupVisits].map((v: any) => v.visitorId)).size;

    // Registration page breakdown (per page) - for aggregate
    const registrationVisits = pageVisits.filter((p: any) => p.pageType === 'registration');
    const registrationPageBreakdown: Record<string, { 
      views: number; 
      uniqueVisitors: number; 
      pageId: string | null;
      variantGroup: string | null;
    }> = {};

    registrationVisits.forEach((visit: any) => {
      const key = visit.pageId || 'default';
      if (!registrationPageBreakdown[key]) {
        registrationPageBreakdown[key] = {
          views: 0,
          uniqueVisitors: 0,
          pageId: visit.pageId,
          variantGroup: visit.variantGroup,
        };
      }
      registrationPageBreakdown[key].views++;
    });

    // Count unique visitors per page
    for (const key in registrationPageBreakdown) {
      const pageVisitsFiltered = registrationVisits.filter(
        (v: any) => (v.pageId || 'default') === key
      );
      const uniqueVisitors = new Set(pageVisitsFiltered.map((v: any) => v.visitorId)).size;
      registrationPageBreakdown[key].uniqueVisitors = uniqueVisitors;
    }

    // Fetch page names from RegistrationPage table
    const pageIds = Object.values(registrationPageBreakdown)
      .map((b) => b.pageId)
      .filter((id): id is string => id !== null);

    const pages = pageIds.length > 0
      ? await prisma.registrationPage.findMany({
          where: { id: { in: pageIds } },
          select: { id: true, name: true },
        })
      : [];

    const pageMap = new Map(pages.map((p: { id: string; name: string }) => [p.id, p.name]));

    // Format registration page stats
    const registrationPages = Object.entries(registrationPageBreakdown).map(([key, data]) => ({
      pageId: data.pageId,
      pageName: data.pageId ? (pageMap.get(data.pageId) || 'Unknown Page') : 'Default',
      variantGroup: data.variantGroup,
      views: data.views,
      uniqueViews: data.uniqueVisitors,
      avgTimeOnPage: Math.round(
        registrationVisits
          .filter((v: any) => (v.pageId || 'default') === key && v.timeSpent)
          .reduce((sum: number, v: any) => sum + (v.timeSpent || 0), 0) /
          registrationVisits.filter((v: any) => (v.pageId || 'default') === key && v.timeSpent).length || 0
      ),
    }));

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalRegistrations,
          totalPastRegistrations,
          totalAttended,
          attendanceRate: Math.round(attendanceRate * 10) / 10,
          noShows,
          noShowRate: Math.round(noShowRate * 10) / 10,
          avgWatchTime: Math.round(avgWatchTime),
          completionRate: Math.round(completionRate * 10) / 10,
        },
        offers: {
          sawOffer,
          clickedOffer,
          converted,
          offerViewRate: Math.round(offerViewRate * 10) / 10,
          offerClickRate: Math.round(offerClickRate * 10) / 10,
          conversionRate: Math.round(conversionRate * 10) / 10,
        },
        joinTiming: {
          onTime,
          earlyLate,
          late,
          distribution: [
            { label: 'On Time (0-1 min)', count: onTime },
            { label: 'Slightly Late (1-5 min)', count: earlyLate },
            { label: 'Late (5+ min)', count: late },
          ],
        },
        engagement: {
          total: engagementEvents.length,
          chatMessages,
          reactions,
          questions,
          offerClicks,
          byMinute: Object.entries(engagementByMinute).map(([minute, data]) => ({
            minute: parseInt(minute),
            ...data,
          })),
        },
        funnel: {
          registrationPageVisits,
          countdownPageVisits,
          webinarPageVisits,
          thankYouPageVisits,
          registrationPages, // Breakdown by template/variant
          // Embed form tracking
          embedViews: {
            total: totalEmbedViews,
            inline: embedInlineVisits.length,
            popup: embedPopupVisits.length,
            uniqueVisitors: uniqueEmbedVisitors,
            uniqueInlineVisitors: uniqueEmbedInlineVisitors,
            uniquePopupVisitors: uniqueEmbedPopupVisitors,
          },
        },
      },
    });
  } catch (error) {
    console.error('Aggregate analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
