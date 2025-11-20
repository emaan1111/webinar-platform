import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/webinars/[id]/analytics - Get comprehensive analytics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const webinarId = params.id;

    // Get all registrations for this webinar
    const registrations = await prisma.registration.findMany({
      where: { webinarId },
      include: {
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

    // Calculate various metrics
    const totalRegistrations = registrations.length;
    const totalAttended = registrations.filter((r) => r.attended).length;
    const attendanceRate = totalRegistrations > 0 
      ? (totalAttended / totalRegistrations) * 100 
      : 0;

    // No-show calculation
    const noShows = registrations.filter((r) => !r.attended).length;
    const noShowRate = totalRegistrations > 0
      ? (noShows / totalRegistrations) * 100
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

    // Count completion (watched to end)
    const completed = registrations.filter((r) => 
      r.sessions.some((s) => s.completed)
    ).length;
    const completionRate = totalAttended > 0
      ? (completed / totalAttended) * 100
      : 0;

    // Offer analytics
    const offerAnalytics = await prisma.offerAnalytics.findMany({
      where: { webinarId },
    });

    const sawOffer = offerAnalytics.filter((o) => o.sawOffer).length;
    const clickedOffer = offerAnalytics.filter((o) => o.clickedOffer).length;
    const converted = offerAnalytics.filter((o) => o.converted).length;

    const offerViewRate = totalAttended > 0 ? (sawOffer / totalAttended) * 100 : 0;
    const offerClickRate = sawOffer > 0 ? (clickedOffer / sawOffer) * 100 : 0;
    const conversionRate = clickedOffer > 0 ? (converted / clickedOffer) * 100 : 0;

    // Join time analysis
    const joinTimes = registrations
      .filter((r) => r.joinedAt)
      .map((r) => {
        const session = r.sessions[0];
        return session ? session.videoPosition : 0;
      });

    const onTime = joinTimes.filter((t) => t <= 60).length; // Joined within 1 min
    const earlyLate = joinTimes.filter((t) => t > 60 && t <= 300).length; // 1-5 min late
    const late = joinTimes.filter((t) => t > 300).length; // More than 5 min late

    // Drop-off analysis (video events)
    const videoEvents = await prisma.videoWatchEvent.findMany({
      where: { webinarId },
      orderBy: { timestamp: 'asc' },
    });

    // Group by timestamp ranges (every 2 minutes)
    const dropOffByMinute: Record<number, number> = {};
    videoEvents
      .filter((e) => e.eventType === 'left' || e.eventType === 'pause')
      .forEach((event) => {
        const minute = Math.floor(event.timestamp / 120) * 2; // Group by 2-minute intervals
        dropOffByMinute[minute] = (dropOffByMinute[minute] || 0) + 1;
      });

    // Engagement analysis
    const engagementEvents = await prisma.engagementEvent.findMany({
      where: { webinarId },
      orderBy: { timestamp: 'asc' },
    });

    // Count engagement by type
    const chatMessages = engagementEvents.filter((e) => e.eventType === 'chat').length;
    const reactions = engagementEvents.filter((e) => e.eventType === 'reaction').length;
    const questions = engagementEvents.filter((e) => e.eventType === 'question').length;
    const offerClicks = engagementEvents.filter((e) => e.eventType === 'offer_click').length;

    // Engagement over time (by minute)
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

    // Page visit funnel
    const pageVisits = await prisma.pageVisit.findMany({
      where: { webinarId },
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

    // Average time on each page
    const avgTimeOnPages = {
      registration: calculateAvgTime(pageVisits.filter((p: any) => p.pageType === 'registration')),
      countdown: calculateAvgTime(pageVisits.filter((p: any) => p.pageType === 'countdown')),
      webinar: calculateAvgTime(pageVisits.filter((p: any) => p.pageType === 'webinar')),
      thankYou: calculateAvgTime(pageVisits.filter((p: any) => p.pageType === 'thank_you')),
      embedInline: calculateAvgTime(embedInlineVisits),
      embedPopup: calculateAvgTime(embedPopupVisits),
    };

    // Registration page breakdown (per page)
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

    // Fetch page names for better display
    const pageIds = Object.values(registrationPageBreakdown)
      .map((b) => b.pageId)
      .filter((id): id is string => id !== null);

    const pages = pageIds.length > 0
      ? await prisma.template.findMany({
          where: { id: { in: pageIds } },
          select: { id: true, name: true },
        })
      : [];

    const pageMap = new Map(pages.map((t: any) => [t.id, t.name]));

    // Format registration page stats
    const registrationPages = Object.entries(registrationPageBreakdown).map(([key, data]) => ({
      pageId: data.pageId,
      pageName: data.pageId ? (pageMap.get(data.pageId) || 'Unknown Page') : 'Default',
      variantGroup: data.variantGroup,
      views: data.views,
      uniqueViews: data.uniqueVisitors,
      avgTimeOnPage: calculateAvgTime(
        registrationVisits.filter((v: any) => (v.pageId || 'default') === key)
      ),
    }));

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalRegistrations,
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
        dropOff: {
          byMinute: Object.entries(dropOffByMinute).map(([minute, count]) => ({
            minute: parseInt(minute),
            count,
          })),
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
          avgTimeOnPages,
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
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

function calculateAvgTime(visits: any[]): number {
  const validVisits = visits.filter((v) => v.timeSpent !== null);
  if (validVisits.length === 0) return 0;
  
  const total = validVisits.reduce((sum, v) => sum + (v.timeSpent || 0), 0);
  return Math.round(total / validVisits.length);
}
