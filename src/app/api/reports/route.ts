import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Date range required (from and to parameters)' },
        { status: 400 }
      );
    }

    // Parse dates in local timezone (not UTC)
    // Date strings like "2025-11-19" should be treated as local dates
    const fromDate = new Date(from + 'T00:00:00');
    const toDate = new Date(to + 'T23:59:59.999');

    console.log('📊 Generating reports from', from, 'to', to);
    console.log('📅 Date range:', fromDate.toISOString(), 'to', toDate.toISOString());
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
          
          const historicalUrl = `https://graph.facebook.com/v22.0/${adAccountId}/insights?fields=spend,impressions,clicks,ctr&time_range={"since":"${from}","until":"${historicalTo}"}&time_increment=1&access_token=${accessToken}`;
          const historicalResponse = await fetch(historicalUrl);
          const historicalData = await historicalResponse.json();

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
          
          const recentUrl = `https://graph.facebook.com/v22.0/${adAccountId}/insights?fields=spend,impressions,clicks,ctr&time_range={"since":"${recentFrom}","until":"${to}"}&time_increment=1&access_token=${accessToken}`;
          const recentResponse = await fetch(recentUrl);
          const recentData = await recentResponse.json();

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
          
          const url = `https://graph.facebook.com/v22.0/${adAccountId}/insights?fields=spend,impressions,clicks,ctr&time_range={"since":"${from}","until":"${to}"}&time_increment=1&access_token=${accessToken}`;
          const response = await fetch(url);
          const data = await response.json();

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
      // Get date string in local format
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
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
          ...(webinarIds.length > 0 ? { webinarId: { in: webinarIds } } : {})
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

      // Get page visits (for visitor count)
      const pageVisits = await prisma.pageVisit.findMany({
        where: {
          enteredAt: {
            gte: currentDate,
            lt: nextDate
          },
          pageType: 'registration',
          ...(webinarIds.length > 0 ? { webinarId: { in: webinarIds } } : {})
        },
        distinct: ['visitorId'] // Count unique visitors
      });

      // Calculate metrics
      const visitors = pageVisits.length;
      const registrationCount = registrations.length;
      let liveAttendees = 0;
      let replayAttendees = 0;
      let engagedTotal = 0;
      let engagedLive = 0;
      let engagedReplay = 0;
      let salesTotal = 0;
      let salesLive = 0;
      let salesReplay = 0;

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

      reports.push({
        date: currentDate.toISOString().split('T')[0],
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

    return NextResponse.json({
      success: true,
      reports,
      dateRange: { from, to },
      engagementMinutes,
      timestamp: new Date().toISOString(),
      warning: fbWarning
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
