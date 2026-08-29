import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    const timezone = searchParams.get('timezone') || 'UTC';

    // External webinars (WebinarJam/EverWebinar/Zoom) live in their own tables.
    // Absent param = include every external webinar, so callers that predate this
    // still get complete numbers; present-but-empty = the caller deliberately
    // selected only internal webinars.
    const externalWebinarIdsParam = searchParams.get('externalWebinarIds');
    const externalWebinarIds = (externalWebinarIdsParam || '').split(',').filter(Boolean);
    const includeExternal = externalWebinarIdsParam === null || externalWebinarIds.length > 0;

    // Calculate date filter based on timeFrame
    let dateFilter: Date | undefined;
    let dateFilterEnd: Date | undefined;
    const now = new Date();
    
    switch (timeFrame) {
      case '1h':
        dateFilter = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'today': {
        const todayStr = formatInTimeZone(now, timezone, 'yyyy-MM-dd');
        dateFilter = fromZonedTime(todayStr + ' 00:00:00', timezone);
        break;
      }
      case 'yesterday': {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayStr = formatInTimeZone(yesterday, timezone, 'yyyy-MM-dd');
        dateFilter = fromZonedTime(yesterdayStr + ' 00:00:00', timezone);
        dateFilterEnd = fromZonedTime(yesterdayStr + ' 23:59:59', timezone);
        break;
      }
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
      case 'custom': {
        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');
        if (fromParam) dateFilter = fromZonedTime(fromParam + ' 00:00:00', timezone);
        if (toParam) dateFilterEnd = fromZonedTime(toParam + ' 23:59:59', timezone);
        break;
      }
      default:
        dateFilter = undefined;
    }

    // Build where clause for registrations - removed hostId filter
    const whereClause: any = {
      webinarId: webinarIds.length > 0 ? { in: webinarIds } : undefined,
    };

    if (dateFilter || dateFilterEnd) {
      whereClause.registeredAt = {
        ...(dateFilter && { gte: dateFilter }),
        ...(dateFilterEnd && { lte: dateFilterEnd }),
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

    // ─── External webinars ──────────────────────────────────────────────────
    // Registrations for EverWebinar/WebinarJam/live-Zoom sessions. Attendance is
    // synced back from the external platform, so there are no AttendeeSessions,
    // chat, reactions or offer events here - only registration + watch-time facts.
    const externalWhere: any = {};
    if (externalWebinarIds.length > 0) {
      externalWhere.externalWebinarId = { in: externalWebinarIds };
    }
    if (dateFilter || dateFilterEnd) {
      externalWhere.registeredAt = {
        ...(dateFilter && { gte: dateFilter }),
        ...(dateFilterEnd && { lte: dateFilterEnd }),
      };
    }

    const externalRegistrations = includeExternal
      ? await prisma.externalWebinarRegistration.findMany({
          where: externalWhere,
          select: {
            country: true,
            timezone: true,
            attended: true,
            joinedAt: true,
            watchTimeMinutes: true,
            watchTimePercentage: true,
            scheduledStartTime: true,
            externalWebinarId: true,
            externalWebinar: {
              select: {
                id: true,
                name: true,
                externalWebinarName: true,
                webinarDurationMinutes: true,
              },
            },
          },
        })
      : [];

    // A synced "attended" flag is authoritative, but some platforms only report
    // watch time - treat any watched minute as attendance, same as /api/analytics.
    const didAttendExternal = (r: any) => r.attended || (r.watchTimeMinutes || 0) > 0;

    const extTotalRegistrations = externalRegistrations.length;

    // Only registrations whose session has already finished can be scored for
    // attendance, mirroring the internal pastRegistrations rule.
    const extPastRegistrations = externalRegistrations.filter((r: any) => {
      if (!r.scheduledStartTime) return false;
      const durationMinutes = r.externalWebinar?.webinarDurationMinutes || 60;
      const scheduledEnd = new Date(r.scheduledStartTime).getTime() + durationMinutes * 60 * 1000;
      return Date.now() > scheduledEnd;
    });

    const extTotalPastRegistrations = extPastRegistrations.length;
    // Attendance is a synced fact, so every attendee counts toward the headline
    // even when the registration carries no scheduled time to age out. The rate,
    // though, is only meaningful over sessions that have actually finished.
    const extAttendedTotal = externalRegistrations.filter(didAttendExternal).length;
    const extPastAttended = extPastRegistrations.filter(didAttendExternal).length;
    const extNoShows = extTotalPastRegistrations - extPastAttended;
    const extAttendanceRate = extTotalPastRegistrations > 0
      ? (extPastAttended / extTotalPastRegistrations) * 100
      : 0;

    // watchTimePercentage is not populated by the attendance sync, so derive the
    // share watched from the minutes against the webinar's configured length.
    const watchedPercentage = (r: any) => {
      if ((r.watchTimePercentage || 0) > 0) return r.watchTimePercentage;
      const durationMinutes = r.externalWebinar?.webinarDurationMinutes || 60;
      if (!durationMinutes || !(r.watchTimeMinutes > 0)) return 0;
      return Math.min(100, (r.watchTimeMinutes / durationMinutes) * 100);
    };

    // watchTimeMinutes -> seconds, so it can be pooled with internal watch time.
    const extWatchTimeSeconds = externalRegistrations.reduce(
      (sum: number, r: any) => sum + (r.watchTimeMinutes || 0) * 60,
      0
    );
    // Averaged over attendees the platform actually reported watch time for -
    // a synced "attended" with no minutes would otherwise drag the average down.
    const extWatchedRegistrations = externalRegistrations.filter((r: any) => (r.watchTimeMinutes || 0) > 0);
    const extAvgWatchTimeMinutes = extWatchedRegistrations.length > 0
      ? extWatchedRegistrations.reduce((sum: number, r: any) => sum + (r.watchTimeMinutes || 0), 0) / extWatchedRegistrations.length
      : 0;
    const extAvgWatchPercentage = extWatchedRegistrations.length > 0
      ? extWatchedRegistrations.reduce((sum: number, r: any) => sum + watchedPercentage(r), 0) / extWatchedRegistrations.length
      : 0;
    // No session rows to mark "completed" - treat near-full watch time as completion.
    const extCompleted = externalRegistrations.filter((r: any) => watchedPercentage(r) >= 90).length;

    // Per-webinar breakdown so the dashboard can list external webinars by name.
    const extWebinarMap = new Map<string, {
      id: string
      name: string
      registrations: number
      pastRegistrations: number
      attended: number
      pastAttended: number
      watchTimeMinutes: number
      watchedCount: number
    }>();
    externalRegistrations.forEach((r: any) => {
      const id = r.externalWebinarId;
      if (!extWebinarMap.has(id)) {
        extWebinarMap.set(id, {
          id,
          name: r.externalWebinar?.externalWebinarName || r.externalWebinar?.name || 'External Webinar',
          registrations: 0,
          pastRegistrations: 0,
          attended: 0,
          pastAttended: 0,
          watchTimeMinutes: 0,
          watchedCount: 0,
        });
      }
      const entry = extWebinarMap.get(id)!;
      entry.registrations++;
      if (didAttendExternal(r)) entry.attended++;
      if ((r.watchTimeMinutes || 0) > 0) {
        entry.watchTimeMinutes += r.watchTimeMinutes || 0;
        entry.watchedCount++;
      }
    });
    extPastRegistrations.forEach((r: any) => {
      const entry = extWebinarMap.get(r.externalWebinarId);
      if (!entry) return;
      entry.pastRegistrations++;
      if (didAttendExternal(r)) entry.pastAttended++;
    });

    const externalWebinarBreakdown = Array.from(extWebinarMap.values())
      .map((w) => ({
        id: w.id,
        name: w.name,
        registrations: w.registrations,
        pastRegistrations: w.pastRegistrations,
        attended: w.attended,
        noShows: w.pastRegistrations - w.pastAttended,
        attendanceRate: w.pastRegistrations > 0
          ? Math.round((w.pastAttended / w.pastRegistrations) * 1000) / 10
          : 0,
        avgWatchTimeMinutes: w.watchedCount > 0
          ? Math.round(w.watchTimeMinutes / w.watchedCount)
          : 0,
      }))
      .sort((a, b) => b.registrations - a.registrations);

    // External lead pages only carry lifetime view/conversion counters (no
    // per-visit rows), so these are reported separately and always all-time.
    const externalLeadPageRows = includeExternal
      ? await prisma.leadPage.findMany({
          where: externalWebinarIds.length > 0
            ? { externalWebinarId: { in: externalWebinarIds } }
            : { externalWebinarId: { not: null } },
          select: { id: true, name: true, slug: true, views: true, conversions: true },
          orderBy: { views: 'desc' },
        })
      : [];

    const externalLeadPages = {
      allTime: true,
      totalViews: externalLeadPageRows.reduce((sum, p) => sum + (p.views || 0), 0),
      totalConversions: externalLeadPageRows.reduce((sum, p) => sum + (p.conversions || 0), 0),
      pages: externalLeadPageRows.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        views: p.views || 0,
        conversions: p.conversions || 0,
        conversionRate: p.views > 0 ? Math.round((p.conversions / p.views) * 1000) / 10 : 0,
      })),
    };

    // ─── Combined (internal + external) headline metrics ─────────────────────
    const combinedRegistrations = totalRegistrations + extTotalRegistrations;
    const combinedPastRegistrations = totalPastRegistrations + extTotalPastRegistrations;
    const combinedAttended = totalAttended + extAttendedTotal;
    const combinedNoShows = noShows + extNoShows;
    // Rate numerator is past-only on both sides, matching its denominator.
    const combinedAttendanceRate = combinedPastRegistrations > 0
      ? ((totalAttended + extPastAttended) / combinedPastRegistrations) * 100
      : 0;
    const combinedNoShowRate = combinedPastRegistrations > 0
      ? (combinedNoShows / combinedPastRegistrations) * 100
      : 0;
    const combinedAvgWatchTime = combinedAttended > 0
      ? (totalWatchTime + extWatchTimeSeconds) / combinedAttended
      : 0;
    const combinedCompletionRate = combinedAttended > 0
      ? ((completed + extCompleted) / combinedAttended) * 100
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

    let onTime = joinTimes.filter((t) => t <= 60).length;
    let earlyLate = joinTimes.filter((t) => t > 60 && t <= 300).length;
    let late = joinTimes.filter((t) => t > 300).length;

    // External joins have no video position - measure lateness against the
    // session's scheduled start instead. Early arrivals count as on time.
    externalRegistrations.forEach((r: any) => {
      if (!r.joinedAt || !r.scheduledStartTime) return;
      const delay = Math.max(
        0,
        (new Date(r.joinedAt).getTime() - new Date(r.scheduledStartTime).getTime()) / 1000
      );
      if (delay <= 60) onTime++;
      else if (delay <= 300) earlyLate++;
      else late++;
    });

    // Geographic Distribution (Country)
    const countryMap = new Map<string, number>();
    const withCountry = [...registrations, ...externalRegistrations];
    withCountry.forEach((r: any) => {
      if (r.country) {
        countryMap.set(r.country, (countryMap.get(r.country) || 0) + 1);
      }
    });

    // Convert map to array and sort by count descending
    const countries = Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    // Timezone Distribution
    const timezoneMap = new Map<string, number>();
    withCountry.forEach((r: any) => {
      if (r.timezone) {
        // Simplify timezone name for display (e.g., "America/New_York" -> "New York")
        const parts = r.timezone.split('/');
        const displayName = parts.length > 1 
          ? parts[parts.length - 1].replace(/_/g, ' ') 
          : r.timezone;
        timezoneMap.set(displayName, (timezoneMap.get(displayName) || 0) + 1);
      }
    });

    // Convert map to array and sort by count descending
    const timezones = Array.from(timezoneMap.entries())
      .map(([timezone, count]) => ({ timezone, count }))
      .sort((a, b) => b.count - a.count);

    // Engagement metrics
    const engagementWhere: any = {
      // Use webinar ID from already fetched registrations to ensure permission consistency
      // However reaction/chat models don't have hostId relationship check easily
      // So relying on webinarId being in the list of what user has access to
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
    const engagementByMinute: Record<number, { chat: number; reactions: number; viewers: number }> = {};
    
    // Determine max duration to initialize buckets
    let maxDuration = 3600; // Default 60 mins
    
    // Check max from registrations
    registrations.forEach((r: any) => {
      if (r.webinar?.duration && r.webinar.duration * 60 > maxDuration) {
        maxDuration = r.webinar.duration * 60;
      }
      if (r.sessions) {
        r.sessions.forEach((s: any) => {
           if(s.videoPosition > maxDuration) maxDuration = s.videoPosition;
        });
      }
    });
    
    const maxMinutes = Math.ceil(maxDuration / 60);

    // Initialize all buckets
    for(let i=0; i<=maxMinutes; i++) {
        engagementByMinute[i] = { chat: 0, reactions: 0, viewers: 0 };
    }

    // Populate Viewers (Retention)
    registrations.forEach((r: any) => {
      // Find max progress for this user
      let userMaxPos = 0;
      if (r.sessions && r.sessions.length > 0) {
        userMaxPos = r.sessions.reduce((max: number, s: any) => Math.max(max, s.videoPosition), 0);
      } else if (r.attended) {
        // Fallback if attended but no sessions (legacy data?)
        // Don't count them for retention as we don't know where they dropped off
        userMaxPos = 0; 
      }
      
      const userMaxMinute = Math.floor(userMaxPos / 60);
      
      // User counts as viewer for every minute up to their max position
      for(let i=0; i <= userMaxMinute; i++) {
         if (engagementByMinute[i]) {
            engagementByMinute[i].viewers++;
         }
      }
    });

    // Populate Chat/Reactions
    engagementEvents.forEach((event) => {
      const minute = Math.floor(event.timestamp / 60);
      if (!engagementByMinute[minute]) {
        engagementByMinute[minute] = { chat: 0, reactions: 0, viewers: 0 };
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
      registrations: number;
      pageId: string | null;
      variantGroup: string | null;
    }> = {};

    registrationVisits.forEach((visit: any) => {
      const key = visit.pageId || 'default';
      if (!registrationPageBreakdown[key]) {
        registrationPageBreakdown[key] = {
          views: 0,
          uniqueVisitors: 0,
          registrations: 0,
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

    // Count registrations per page
    // Use the registrationId in page_visits to link registrations to pages
    const registrationWhere: any = { webinarId: { in: webinarIds } };
    if (dateFilter) {
      registrationWhere.registeredAt = {
        gte: dateFilter,
      };
    }

    const allRegistrations = await prisma.registration.findMany({
      where: registrationWhere,
      select: {
        id: true,
      }
    });

    const registrationIds = allRegistrations.map((r: any) => r.id);

    // Find page visits that have a registrationId (these are visitors who completed registration)
    const registrationPageVisitsWithReg = await prisma.pageVisit.findMany({
      where: {
        pageType: 'registration',
        registrationId: { in: registrationIds },
      },
      select: {
        registrationId: true,
        pageId: true,
      }
    });

    // Count registrations per pageId
    registrationPageVisitsWithReg.forEach((visit: any) => {
      const key = visit.pageId || 'default';
      if (registrationPageBreakdown[key]) {
        registrationPageBreakdown[key].registrations++;
      }
    });

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
      registrations: data.registrations,
      conversionRate: data.uniqueVisitors > 0 
        ? Math.round((data.registrations / data.uniqueVisitors) * 1000) / 10 
        : 0,
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
          // Headline numbers cover internal + external webinars.
          totalRegistrations: combinedRegistrations,
          totalPastRegistrations: combinedPastRegistrations,
          totalAttended: combinedAttended,
          attendanceRate: Math.round(combinedAttendanceRate * 10) / 10,
          noShows: combinedNoShows,
          noShowRate: Math.round(combinedNoShowRate * 10) / 10,
          avgWatchTime: Math.round(combinedAvgWatchTime),
          completionRate: Math.round(combinedCompletionRate * 10) / 10,
          // Split out so rates that only apply to one side (offers, engagement)
          // can be measured against the right denominator.
          internalRegistrations: totalRegistrations,
          internalPastRegistrations: totalPastRegistrations,
          internalAttended: totalAttended,
          internalAttendanceRate: Math.round(attendanceRate * 10) / 10,
          internalNoShows: noShows,
          internalNoShowRate: Math.round(noShowRate * 10) / 10,
          internalAvgWatchTime: Math.round(avgWatchTime),
          internalCompletionRate: Math.round(completionRate * 10) / 10,
          externalRegistrations: extTotalRegistrations,
          externalAttended: extAttendedTotal,
        },
        external: {
          included: includeExternal,
          totalRegistrations: extTotalRegistrations,
          totalPastRegistrations: extTotalPastRegistrations,
          attended: extAttendedTotal,
          pastAttended: extPastAttended,
          watchTimeReportedFor: extWatchedRegistrations.length,
          noShows: extNoShows,
          attendanceRate: Math.round(extAttendanceRate * 10) / 10,
          avgWatchTimeMinutes: Math.round(extAvgWatchTimeMinutes),
          avgWatchTimePercentage: Math.round(extAvgWatchPercentage),
          webinars: externalWebinarBreakdown,
          leadPages: externalLeadPages,
        },
        offers: {
            sawOffer,
            clickedOffer,
            converted,
            offerViewRate,
            offerClickRate,
            conversionRate,
        },
        geographic: {
            countries,
            timezones
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
            // scheduleDistribution: formattedScheduleDistribution, // Temporarily commented out as unused
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
          // External lead pages track lifetime counters only - kept out of the
          // date-filtered visit numbers above so conversion rates stay honest.
          externalLeadPages,
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
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error) {
    console.error('Aggregate analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
