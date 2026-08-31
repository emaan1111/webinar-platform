import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { requestFacebookInsights } from '@/lib/facebookAds';
import { isSessionSettled, attendedLiveBroadcast } from '@/lib/attendance';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/reports
 * Generate comprehensive webinar reports combining Facebook Ads and webinar metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const engagementMinutes = parseInt(searchParams.get('engagementMinutes') || '30');
    const webinarIds = searchParams.get('webinarIds')?.split(',').filter(Boolean) || [];
    const internalWebinarIds = webinarIds.filter(id => !id.startsWith('ext_'));
    const extWebinarFilterIds = webinarIds.filter(id => id.startsWith('ext_')).map(id => id.replace('ext_', ''));
    const timezone = searchParams.get('timezone') || 'UTC';

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Date range required (from and to parameters)' },
        { status: 400 }
      );
    }

    // Parse dates in user's timezone
    // We convert the "local" date string (e.g. 2026-01-27 00:00:00) 
    // combined with the user's timezone into a UTC Date object
    const fromDate = fromZonedTime(from + 'T00:00:00', timezone);
    const toDate = fromZonedTime(to + 'T23:59:59.999', timezone);

    console.log('📊 Generating reports from', from, 'to', to);
    console.log('🌍 Timezone:', timezone);
    console.log('📅 Date range (UTC):', fromDate.toISOString(), 'to', toDate.toISOString());
    console.log('⏱️  Engagement threshold:', engagementMinutes, 'minutes');
    if (webinarIds.length > 0) {
      console.log('🎯 Filtering by webinar IDs:', webinarIds);
    }

    // Fetch Facebook Ads data
    const accessToken = process.env.FB_ACCESS_TOKEN;
    const adAccountId = process.env.FB_AD_ACCOUNT_ID || 'act_280500016006811';

    let fbDataByDate: Record<string, any> = {};
    let fbWarning: string | null = null;

    if (accessToken) {
      const buildFbUrl = (sinceDate: string, untilDate: string) => {
        const timeRange = encodeURIComponent(JSON.stringify({ since: sinceDate, until: untilDate }));
        return `https://graph.facebook.com/v22.0/${adAccountId}/insights?fields=spend,impressions,clicks,ctr&time_range=${timeRange}&time_increment=1&access_token=${accessToken.trim()}`;
      };

      try {
        // Calculate if we need to split the request
        const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 7) {
          // For date ranges > 7 days, make two requests to get complete data
          // Request 1: Historical data (from start to 8 days ago)
          const eightDaysAgo = new Date(toDate);
          eightDaysAgo.setDate(toDate.getDate() - 7);
          const historicalTo = eightDaysAgo.toISOString().split('T')[0];
          
          console.log('📊 Facebook API Request (Historical):', { from, to: historicalTo, adAccountId });
          
          const historicalResponse = await requestFacebookInsights(buildFbUrl(from, historicalTo));
          const historicalData = historicalResponse.data;

          if (historicalResponse.ok && historicalData.data) {
            console.log(`✅ Facebook returned ${historicalData.data.length} historical days`);
            historicalData.data.forEach((day: any) => {
              fbDataByDate[day.date_start] = {
                spend: parseFloat(day.spend || 0),
                impressions: parseInt(day.impressions || 0),
                clicks: parseInt(day.clicks || 0),
                ctr: parseFloat(day.ctr || 0)
              };
            });
          } else {
            console.error('❌ Facebook API Error (Historical):', historicalData.error || historicalData);
            if (historicalData.error?.code === 200 || historicalData.error?.message?.includes('ads_management')) {
              console.error('⚠️  Facebook access token needs to be refreshed or lacks required permissions');
              console.error('   Visit: https://developers.facebook.com/tools/explorer/ to get a new token');
              fbWarning = 'Facebook access token expired or lacks permissions. See FACEBOOK_TOKEN_REFRESH_GUIDE.md';
            }
          }

          // Request 2: Recent data (last 7 days)
          const sevenDaysAgo = new Date(toDate);
          sevenDaysAgo.setDate(toDate.getDate() - 7);
          const recentFrom = sevenDaysAgo.toISOString().split('T')[0];
          
          console.log('📊 Facebook API Request (Recent 7 days):', { from: recentFrom, to, adAccountId });
          
          const recentResponse = await requestFacebookInsights(buildFbUrl(recentFrom, to));
          const recentData = recentResponse.data;

          if (recentResponse.ok && recentData.data) {
            console.log(`✅ Facebook returned ${recentData.data.length} recent days`);
            recentData.data.forEach((day: any) => {
              console.log(`  - ${day.date_start}: $${day.spend || 0}`);
              fbDataByDate[day.date_start] = {
                spend: parseFloat(day.spend || 0),
                impressions: parseInt(day.impressions || 0),
                clicks: parseInt(day.clicks || 0),
                ctr: parseFloat(day.ctr || 0)
              };
            });
          } else {
            console.error('❌ Facebook API Error (Recent):', recentData.error || recentData);
            if (recentData.error?.code === 200 || recentData.error?.message?.includes('ads_management')) {
              fbWarning = 'Facebook access token expired or lacks permissions. See FACEBOOK_TOKEN_REFRESH_GUIDE.md';
            }
          }
        } else {
          // For date ranges <= 7 days, single request works fine
          console.log('📊 Facebook API Request:', { from, to, adAccountId });
          
          const response = await requestFacebookInsights(buildFbUrl(from, to));
          const data = response.data;

          if (response.ok && data.data) {
            console.log(`✅ Facebook returned ${data.data.length} days of data`);
            data.data.forEach((day: any) => {
              console.log(`  - ${day.date_start}: $${day.spend || 0}`);
              fbDataByDate[day.date_start] = {
                spend: parseFloat(day.spend || 0),
                impressions: parseInt(day.impressions || 0),
                clicks: parseInt(day.clicks || 0),
                ctr: parseFloat(day.ctr || 0)
              };
            });
          } else {
            console.error('❌ Facebook API Error:', data.error || data);
            if (data.error?.code === 200 || data.error?.message?.includes('ads_management')) {
              fbWarning = 'Facebook access token expired or lacks permissions. See FACEBOOK_TOKEN_REFRESH_GUIDE.md';
            }
          }
        }
      } catch (error) {
        console.error('❌ Error fetching FB data:', error);
      }
    } else {
      console.warn('⚠️  No Facebook access token found');
    }

    // Generate reports for each day
    const reports = [];
    const currentDate = new Date(fromDate);

    while (currentDate <= toDate) {
      // Get date string in user's timezone
      // This ensures that the report label matches the user's date, 
      // even if the UTC timestamp falls on the previous/next day.
      const dateStr = formatInTimeZone(currentDate, timezone, 'yyyy-MM-dd');
      
      // Create next day boundary
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);

      console.log(`📅 Processing ${dateStr}: ${currentDate.toISOString()} to ${nextDate.toISOString()}`);

      // Get registrations for this date
      const allRegistrations = await prisma.registration.findMany({
        where: {
          registeredAt: {
            gte: currentDate,
            lt: nextDate
          },
          ...(internalWebinarIds.length > 0 ? { webinarId: { in: internalWebinarIds } } : (webinarIds.length > 0 && internalWebinarIds.length === 0 ? { webinarId: '__none__' } : {}))
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
              duration: true
            }
          },
          sessions: true,
          sales: true
        }
      });

      // Filter out test users to match Attendees page logic
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

      const registrations = allRegistrations.filter((reg: any) => {
        const name = reg.name || reg.user?.name || ''
        const email = reg.email || reg.user?.email || ''
        return !isTestUser(name, email)
      })

      // ---------------------------------------------------------------------
      // The webinar half of the row, on the SESSION clock.
      //
      // The query above selects people by the day they SIGNED UP, which is the
      // only basis on which cost-per-registration is true: that is the day the
      // ad spend bought them. It is the wrong basis for attendance, because
      // someone who signs up today for next week's webinar cannot have
      // attended it yet — they sit in the denominator with no possible
      // outcome and drag the rate down.
      //
      // So attendance, engagement and sales are counted over the sessions that
      // actually RAN on this day, selected independently by scheduledStartTime.
      // Registrations with no scheduled start are absent from this query
      // entirely; they are counted below as a disclosed gap rather than being
      // given a substitute date.
      // ---------------------------------------------------------------------
      const allSessionRegistrations = await prisma.registration.findMany({
        where: {
          scheduledStartTime: {
            gte: currentDate,
            lt: nextDate
          },
          ...(internalWebinarIds.length > 0 ? { webinarId: { in: internalWebinarIds } } : (webinarIds.length > 0 && internalWebinarIds.length === 0 ? { webinarId: '__none__' } : {}))
        },
        include: {
          user: { select: { name: true, email: true } },
          webinar: { select: { duration: true } },
          sessions: true,
          sales: true
        }
      });

      const sessionRegistrations = allSessionRegistrations.filter((reg: any) => {
        const name = reg.name || reg.user?.name || ''
        const email = reg.email || reg.user?.email || ''
        return !isTestUser(name, email)
      })

      // Get page visits (for visitor count)
      const pageVisits = await prisma.pageVisit.findMany({
        where: {
          enteredAt: {
            gte: currentDate,
            lt: nextDate
          },
          pageType: 'registration',
          ...(internalWebinarIds.length > 0 ? { webinarId: { in: internalWebinarIds } } : (webinarIds.length > 0 && internalWebinarIds.length === 0 ? { webinarId: '__none__' } : {}))
        },
        distinct: ['visitorId'] // Count unique visitors
      });

      // Calculate metrics
      const visitors = pageVisits.length;
      let registrationCount = registrations.length;
      let liveAttendees = 0;
      let replayAttendees = 0;
      let engagedTotal = 0;
      let engagedLive = 0;
      let engagedReplay = 0;
      let salesTotal = 0;
      let salesLive = 0;
      let salesReplay = 0;
      let missedTotal = 0;

      // --- Session-clock counters: the webinars that RAN on this day --------
      // sessionRegistered = sessionLive + sessionMissed + sessionUpcoming,
      // an identity that holds exactly so a row can be checked by eye.
      const nowMs = Date.now();
      let sessionRegistered = 0;      // registered for a session that ran today
      let sessionSettled = 0;         // ...whose session has actually finished
      let sessionLive = 0;            // ...and who attended the live broadcast
      let sessionMissed = 0;          // ...and who did not
      let sessionUpcoming = 0;        // session today but not finished yet
      let sessionEngaged = 0;
      let sessionSales = 0;
      let sessionReplay = 0;

      for (const reg of sessionRegistrations) {
        sessionRegistered++;

        const settled = isSessionSettled(
          reg.scheduledStartTime,
          reg.webinar?.duration,
          nowMs
        );
        if (!settled) {
          // The session hasn't finished. Attendance is not yet knowable, so
          // this person is reported separately rather than counted as a
          // no-show against a webinar that hasn't happened.
          sessionUpcoming++;
          continue;
        }

        sessionSettled++;

        const wasLive = attendedLiveBroadcast(reg);
        if (wasLive) sessionLive++;
        else sessionMissed++;

        if (!wasLive && (reg.watchedReplay || reg.sessions.length > 0)) {
          sessionReplay++;
        }

        const maxPos = reg.sessions.reduce(
          (max: number, s: any) => Math.max(max, s.videoPosition || 0),
          0
        );
        const watched = maxPos > 0 ? maxPos : (reg.lastWatchedPosition || 0);
        if (watched / 60 >= engagementMinutes) sessionEngaged++;

        sessionSales += reg.sales.length;
      }

      for (const reg of registrations) {
        // Check if attended live
        const attendedLive = reg.attended;
        const hasReplaySessions = !reg.attended && reg.sessions.length > 0;

        if (attendedLive) {
          liveAttendees++;
        }

        // Check if watched replay (has sessions but didn't attend live)
        if (hasReplaySessions) {
          replayAttendees++;
        }

        // Calculate total watch time from sessions
        // Use videoPosition (furthest point watched) for accurate watch time
        const maxVideoPosition = reg.sessions.reduce((max: number, session: any) => {
          return Math.max(max, session.videoPosition || 0);
        }, 0);
        
        const totalWatchTime = maxVideoPosition > 0 ? maxVideoPosition : (reg.lastWatchedPosition || 0);
        const watchTimeMinutes = totalWatchTime / 60;

        // Check engagement (watched for X minutes)
        const isEngaged = watchTimeMinutes >= engagementMinutes;
        if (isEngaged) {
          engagedTotal++;
          
          // Separate engagement by type
          if (attendedLive) {
            engagedLive++;
          } else if (hasReplaySessions) {
            engagedReplay++;
          }
        }

        // Count sales
        if (reg.sales.length > 0) {
          const saleCount = reg.sales.length;
          salesTotal += saleCount;
          
          // Separate sales by type
          if (attendedLive) {
            salesLive += saleCount;
          } else if (hasReplaySessions) {
            salesReplay += saleCount;
          }
        }
      }

      // --- Include External Webinar Registrations in reports ---
      // If filtering by only internal webinar IDs, skip external regs
      // If filtering by ext_ IDs, filter to those
      // If no filter, include all
      if (webinarIds.length > 0 && extWebinarFilterIds.length === 0) {
        // Only internal IDs selected, skip external
      } else {
        const extWhere: any = {
          registeredAt: {
            gte: currentDate,
            lt: nextDate,
          },
        };
        if (extWebinarFilterIds.length > 0) {
          extWhere.externalWebinarId = { in: extWebinarFilterIds };
        }
        const extRegs = await prisma.externalWebinarRegistration.findMany({
          where: extWhere,
          include: {
            externalWebinar: {
              select: {
                webinarDurationMinutes: true,
              }
            }
          }
        });

      const filteredExtRegs = extRegs.filter((reg: any) => {
        return !isTestUser(reg.name || '', reg.email || '')
      });

      registrationCount += filteredExtRegs.length;

      for (const extReg of filteredExtRegs) {
        const watchTimeMinutes = extReg.watchTimeMinutes || 0;
        // `attended` is the platform's MERGED flag (live OR replay), so on
        // its own it cannot say who only watched the replay - which kept the
        // replay columns at zero. Rows synced since the split was stored
        // carry attendedLive/attendedReplay; older rows fall back to the
        // merged flag (counted as live, replay unknowable).
        const wasLive = extReg.attendedLive ?? extReg.attended;
        const watchedReplay =
          (extReg.attendedReplay ?? false) || (!extReg.attended && watchTimeMinutes > 0);

        if (wasLive) {
          liveAttendees++;
        } else if (watchedReplay) {
          replayAttendees++;
        } else {
          missedTotal++;
        }

        // Check engagement
        if (watchTimeMinutes >= engagementMinutes) {
          engagedTotal++;
          if (wasLive) {
            engagedLive++;
          } else if (watchedReplay) {
            engagedReplay++;
          }
        }
      }

      // --- External registrations on the SESSION clock -------------------
      // The session-clock counters above are filled from prisma.registration
      // alone, so a day whose webinar actually ran on EverWebinar/Zoom
      // reported only the stray internal rows and hid the real audience.
      // External registrations carry their own scheduledStartTime and their
      // own attended flag synced back from the platform, so they belong on
      // the same clock as the internal ones. Selected independently by
      // scheduledStartTime, exactly as allSessionRegistrations is.
      const extSessionWhere: any = {
        scheduledStartTime: {
          gte: currentDate,
          lt: nextDate,
        },
      };
      if (extWebinarFilterIds.length > 0) {
        extSessionWhere.externalWebinarId = { in: extWebinarFilterIds };
      }
      const extSessionRegs = await prisma.externalWebinarRegistration.findMany({
        where: extSessionWhere,
        include: {
          externalWebinar: {
            select: {
              webinarDurationMinutes: true,
            }
          }
        }
      });

      const filteredExtSessionRegs = extSessionRegs.filter((reg: any) => {
        return !isTestUser(reg.name || '', reg.email || '')
      });

      for (const extReg of filteredExtSessionRegs) {
        sessionRegistered++;

        const settled = isSessionSettled(
          extReg.scheduledStartTime,
          extReg.externalWebinar?.webinarDurationMinutes,
          nowMs
        );
        if (!settled) {
          // Same rule as the internal pass: the session hasn't finished, so
          // attendance isn't knowable and this person is not yet a no-show.
          sessionUpcoming++;
          continue;
        }

        sessionSettled++;

        // `attended` is the platform's MERGED flag (live OR replay). Use the
        // stored split when the sync has written it; older rows fall back to
        // the merged flag (counted as live, replay unknowable).
        const watchTimeMinutes = extReg.watchTimeMinutes || 0;
        const wasLive = extReg.attendedLive ?? extReg.attended;
        const watchedReplay =
          (extReg.attendedReplay ?? false) || (!extReg.attended && watchTimeMinutes > 0);
        if (wasLive) sessionLive++;
        else sessionMissed++;

        if (!wasLive && watchedReplay) sessionReplay++;

        if (watchTimeMinutes >= engagementMinutes) sessionEngaged++;

        // External registrations carry no sales relation, so sessionSales is
        // left to the internal pass.
      }
      } // end of else (external webinar filter)

      // Calculate total attendees (live + replay)
      const totalAttendees = liveAttendees + replayAttendees;

      // Get FB data for this date
      const fbData = fbDataByDate[dateStr] || {
        spend: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0
      };

      // Calculate FB metrics
      const spend = fbData.spend;
      const impressions = fbData.impressions;
      const clicks = fbData.clicks;
      const ctr = fbData.ctr;
      const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
      const cpc = clicks > 0 ? spend / clicks : 0;

      // Calculate cost metrics
      const costPerRegistration = registrationCount > 0 ? spend / registrationCount : 0;
      const costPerAttendee = totalAttendees > 0 ? spend / totalAttendees : 0;
      const costPerSale = salesTotal > 0 ? spend / salesTotal : 0;

      // Calculate revenue metrics from actual sale amounts
      const revenue = registrations
        .flatMap((reg: any) => reg.sales)
        .reduce((sum: number, sale: any) => sum + (sale.amount || 0), 0);
      
      const liveRevenue = registrations
        .filter((reg: any) => reg.attended)
        .flatMap((reg: any) => reg.sales)
        .reduce((sum: number, sale: any) => sum + (sale.amount || 0), 0);
      
      const replayRevenue = registrations
        .filter((reg: any) => !reg.attended && reg.sessions.length > 0)
        .flatMap((reg: any) => reg.sales)
        .reduce((sum: number, sale: any) => sum + (sale.amount || 0), 0);
      
      const profit = revenue - spend;
      const roi = spend > 0 ? (profit / spend) * 100 : 0;
      const averageOrderValue = salesTotal > 0 ? revenue / salesTotal : 0;

      // Calculate percentage metrics
      const registrationRate = visitors > 0 ? (registrationCount / visitors) * 100 : 0;
      const attendanceRate = registrationCount > 0 ? (totalAttendees / registrationCount) * 100 : 0;
      
      // Calculate real attendance rate (only past webinars or those who attended)
      const now = new Date();
      const pastRegistrations = registrations.filter((reg: any) => {
        // Always include if they attended (even if session isn't technically over)
        if (reg.attended) return true;

        if (!reg.scheduledStartTime || !reg.webinar?.duration) return false;
        const scheduledStart = new Date(reg.scheduledStartTime);
        const scheduledEnd = new Date(scheduledStart.getTime() + reg.webinar.duration * 60 * 1000);
        return now > scheduledEnd;
      });
      const pastRegistrationCount = pastRegistrations.length;
      const pastAttendees = pastRegistrations.filter((reg: any) => reg.attended).length;
      const realAttendanceRate = pastRegistrationCount > 0 ? (pastAttendees / pastRegistrationCount) * 100 : 0;
      
      const liveAttendanceRate = registrationCount > 0 ? (liveAttendees / registrationCount) * 100 : 0;
      const replayAttendanceRate = registrationCount > 0 ? (replayAttendees / registrationCount) * 100 : 0;
      
      const engagedPerVisitor = visitors > 0 ? (engagedTotal / visitors) * 100 : 0;
      const engagedLivePerVisitor = visitors > 0 ? (engagedLive / visitors) * 100 : 0;
      const engagedReplayPerVisitor = visitors > 0 ? (engagedReplay / visitors) * 100 : 0;
      
      const engagedPerRegistered = registrationCount > 0 ? (engagedTotal / registrationCount) * 100 : 0;
      const engagedLivePerRegistered = registrationCount > 0 ? (engagedLive / registrationCount) * 100 : 0;
      const engagedReplayPerRegistered = registrationCount > 0 ? (engagedReplay / registrationCount) * 100 : 0;
      
      const engagementRateLive = liveAttendees > 0 ? (engagedLive / liveAttendees) * 100 : 0;
      const engagementRateReplay = replayAttendees > 0 ? (engagedReplay / replayAttendees) * 100 : 0;
      const engagementRateTotal = totalAttendees > 0 ? (engagedTotal / totalAttendees) * 100 : 0;

      // --- Session-clock rates ---------------------------------------------
      // Every one of these divides by sessions that have FINISHED, so a
      // webinar still to run can't drag the number down, and each is filed
      // under the day the webinar ran rather than the day people signed up.
      const sessionAttendanceRate =
        sessionSettled > 0 ? (sessionLive / sessionSettled) * 100 : 0;
      const sessionEngagedPerRegistered =
        sessionSettled > 0 ? (sessionEngaged / sessionSettled) * 100 : 0;
      const sessionEngagementRateLive =
        sessionLive > 0 ? (sessionEngaged / sessionLive) * 100 : 0;
      const sessionSalesPerRegistered =
        sessionSettled > 0 ? (sessionSales / sessionSettled) * 100 : 0;
      const sessionReplayRate =
        sessionSettled > 0 ? (sessionReplay / sessionSettled) * 100 : 0;

      reports.push({
        // The bucket label must be the date in the viewer's timezone, not the
        // UTC date of its midnight boundary - for zones ahead of UTC those are
        // different days, which mislabelled every row and sent the drill-down
        // link to the wrong 24h window.
        date: dateStr,
        fbResults: {
          spend,
          impressions,
          clicks,
          ctr,
          cpm,
          cpc
        },
        visitors,
        registrations: registrationCount,
        
        // Attendance
        totalAttendees,
        liveAttendees,
        replayAttendees,
        pastRegistrationCount,
        pastAttendees,

        // --- The webinar half: sessions that RAN on this day ---------------
        // Counted on the session clock and divided by finished sessions only.
        // sessionRegistered = sessionLive + sessionMissed + sessionUpcoming.
        sessionRegistered,
        sessionSettled,
        sessionLive,
        sessionMissed,
        sessionUpcoming,
        sessionEngaged,
        sessionSales,
        sessionReplay,
        sessionAttendanceRate,
        sessionEngagedPerRegistered,
        sessionEngagementRateLive,
        sessionSalesPerRegistered,
        sessionReplayRate,

        // Engagement
        engagedTotal,
        engagedLive,
        engagedReplay,
        
        // Sales
        salesTotal,
        salesLive,
        salesReplay,
        
        // Rates
        registrationRate,
        attendanceRate,
        realAttendanceRate,
        liveAttendanceRate,
        replayAttendanceRate,
        
        // Engagement rates
        engagedPerVisitor,
        engagedLivePerVisitor,
        engagedReplayPerVisitor,
        engagedPerRegistered,
        engagedLivePerRegistered,
        engagedReplayPerRegistered,
        engagementRateLive,
        engagementRateReplay,
        engagementRateTotal,
        
        // Costs
        costPerRegistration,
        costPerAttendee,
        costPerSale,
        
        // Revenue
        revenue,
        liveRevenue,
        replayRevenue,
        averageOrderValue,
        profit,
        roi
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`✅ Generated ${reports.length} daily reports`);

    // How many registrations in this range carry no scheduled session time.
    // They are invisible to every session-clock column, so the report says so
    // rather than quietly understating the webinar half.
    const [rangeRegistrationCount, missingSessionDateCount] = await Promise.all([
      prisma.registration.count({
        where: {
          registeredAt: { gte: fromDate, lte: toDate },
          ...(internalWebinarIds.length > 0 ? { webinarId: { in: internalWebinarIds } } : {})
        }
      }),
      prisma.registration.count({
        where: {
          registeredAt: { gte: fromDate, lte: toDate },
          scheduledStartTime: null,
          ...(internalWebinarIds.length > 0 ? { webinarId: { in: internalWebinarIds } } : {})
        }
      })
    ]);

    const coverageWarning = missingSessionDateCount > 0
      ? `${missingSessionDateCount} of ${rangeRegistrationCount} registrations in this range have no scheduled session time, so they are left out of the webinar columns (Registered, Live, Missed, Engaged, % Attendance).`
      : null;

    return NextResponse.json({
      success: true,
      reports,
      dateRange: { from, to },
      engagementMinutes,
      timestamp: new Date().toISOString(),
      warning: fbWarning,
      coverageWarning,
      missingSessionDateCount,
      rangeRegistrationCount
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });

  } catch (error) {
    console.error('❌ Error generating reports:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
