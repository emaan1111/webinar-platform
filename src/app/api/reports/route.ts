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
      const registrations = await prisma.registration.findMany({
        where: {
          registeredAt: {
            gte: currentDate,
            lt: nextDate
          }
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
      let liveAttendees = 0;
      let engaged = 0;
      let sales = 0;

      for (const reg of registrations) {
        // Check if attended live
        if (reg.attended) {
          liveAttendees++;
        }

        // Calculate total watch time from sessions
        const totalWatchTime = reg.sessions.reduce((sum: number, session: any) => {
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
      const attendanceRate = registrationCount > 0 ? (liveAttendees / registrationCount) * 100 : 0;
      const engagedPerVisitor = visitors > 0 ? (engaged / visitors) * 100 : 0;
      const engagedPerRegistered = registrationCount > 0 ? (engaged / registrationCount) * 100 : 0;
      const engagementRate = liveAttendees > 0 ? (engaged / liveAttendees) * 100 : 0;
      const costPerReg = registrationCount > 0 ? fbData.spend / registrationCount : 0;

      reports.push({
        date: dateStr,
        fbResults: fbData,
        visitors,
        registrations: registrationCount,
        liveAttendees,
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
