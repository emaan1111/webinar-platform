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
    const webinarIdsParam = searchParams.get('webinarIds');
    const webinarIds = webinarIdsParam
      ? webinarIdsParam.split(',').map(id => id.trim()).filter(Boolean)
      : [];

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Date range required (from and to parameters)' },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999); // End of day

    console.log('📊 Generating reports from', from, 'to', to);
    console.log('⏱️  Engagement threshold:', engagementMinutes, 'minutes');

    // Fetch Facebook Ads data
    const accessToken = process.env.FB_ACCESS_TOKEN;
    const adAccountId = process.env.FB_AD_ACCOUNT_ID || 'act_280500016006811';

    let fbDataByDate: Record<string, any> = {};

    if (accessToken) {
      try {
        // Fetch daily breakdown from Facebook
        const url = `https://graph.facebook.com/v22.0/${adAccountId}/insights?fields=spend,impressions,clicks,ctr&time_range={"since":"${from}","until":"${to}"}&time_increment=1&access_token=${accessToken}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok && data.data) {
          data.data.forEach((day: any) => {
            fbDataByDate[day.date_start] = {
              spend: parseFloat(day.spend || 0),
              impressions: parseInt(day.impressions || 0),
              clicks: parseInt(day.clicks || 0),
              ctr: parseFloat(day.ctr || 0)
            };
          });
        }
      } catch (error) {
        console.error('Error fetching FB data:', error);
      }
    }

    // Generate reports for each day
    const reports = [];
    const currentDate = new Date(fromDate);

    while (currentDate <= toDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);

      // Get registrations for this date
      const registrations = await prisma.registration.findMany({
        where: {
          registeredAt: {
            gte: currentDate,
            lt: nextDate
          },
          ...(webinarIds.length
            ? {
                webinarId: {
                  in: webinarIds
                }
              }
            : {})
        },
        include: {
          sessions: true,
          sales: true
        }
      });

      // Get page visits (for visitor count)
      const pageVisits = await prisma.pageVisit.findMany({
        where: {
          enteredAt: {
            gte: currentDate,
            lt: nextDate
          },
          pageType: 'registration'
        },
        distinct: ['visitorId'] // Count unique visitors
      });

      // Calculate metrics
      const visitors = pageVisits.length;
      const registrationCount = registrations.length;
      let attendees = 0;
      let replayAttendees = 0;
      let engaged = 0;
      let sales = 0;

      for (const reg of registrations) {
        // Check if attended live
        if (reg.attended) {
          attendees++;
        }
        if (reg.watchedReplay || (reg.replayWatchTime || 0) > 0) {
          replayAttendees++;
        }

        // Calculate total watch time from sessions
        const totalWatchTime = reg.sessions.reduce((sum, session) => {
          return sum + (session.totalWatchTime || 0);
        }, 0);

        const watchTimeMinutes = totalWatchTime / 60;

        // Check engagement (watched for X minutes during live)
        if (watchTimeMinutes >= engagementMinutes && reg.attended) {
          engaged++;
        }

        // Count sales
        if (reg.sales.length > 0) {
          sales += reg.sales.length;
        }
      }

      // Get FB data for this date
      const fbData = fbDataByDate[dateStr] || {
        spend: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0
      };

      // Calculate percentages
      const registrationRate = visitors > 0 ? (registrationCount / visitors) * 100 : 0;
      const attendanceRate = registrationCount > 0 ? (attendees / registrationCount) * 100 : 0;
      const engagedPerVisitor = visitors > 0 ? (engaged / visitors) * 100 : 0;
      const engagedPerRegistered = registrationCount > 0 ? (engaged / registrationCount) * 100 : 0;
      const engagementRate = attendees > 0 ? (engaged / attendees) * 100 : 0;
      const costPerReg = registrationCount > 0 ? fbData.spend / registrationCount : 0;

      reports.push({
        date: dateStr,
        fbResults: fbData,
        visitors,
        registrations: registrationCount,
        attendees,
        replayAttendees,
        engaged,
        sales,
        registrationRate,
        attendanceRate,
        engagedPerVisitor,
        engagedPerRegistered,
        engagementRate,
        costPerReg
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`✅ Generated ${reports.length} daily reports`);

    return NextResponse.json({
      success: true,
      reports,
      dateRange: { from, to },
      engagementMinutes,
      timestamp: new Date().toISOString()
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
