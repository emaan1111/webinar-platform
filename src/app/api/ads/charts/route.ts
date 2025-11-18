import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/ads/charts
 * Fetch daily Facebook Ads metrics for charts
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Date range required (from and to parameters)' },
        { status: 400 }
      );
    }

    const accessToken = process.env.FB_ACCESS_TOKEN;
    const adAccountId = process.env.FB_AD_ACCOUNT_ID || 'act_280500016006811';

    if (!accessToken) {
      return NextResponse.json(
        { error: 'FB_ACCESS_TOKEN not configured' },
        { status: 500 }
      );
    }

    console.log('📊 Fetching chart data from', from, 'to', to);

    // Calculate number of days
    const daysDiff = Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24));
    console.log(`📅 Date range: ${daysDiff + 1} days`);

    // Fetch daily breakdown from Facebook Ads API with timeout
    const url = `https://graph.facebook.com/v22.0/${adAccountId}/insights?fields=spend,impressions,clicks,cpm,cpc,ctr,reach,actions,cost_per_action_type&time_range={"since":"${from}","until":"${to}"}&time_increment=1&access_token=${accessToken}`;
    
    console.log('🔗 Calling Facebook API...');
    
    // Add 10 second timeout for Facebook API (reduced from 25)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error('⏰ Facebook API timeout after 10 seconds');
      controller.abort();
    }, 10000);
    
    let response;
    let data;
    
    try {
      const fbStart = Date.now();
      response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeoutId);
      
      const fbTime = Date.now() - fbStart;
      console.log(`⚡ Facebook API responded in ${fbTime}ms`);
      
      data = await response.json();
      console.log('📦 Facebook API response status:', response.status);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // If timeout or network error, return empty data instead of failing
      if (fetchError.name === 'AbortError' || fetchError.code === 'ETIMEDOUT') {
        console.warn('⚠️  Facebook API timed out, returning empty metrics');
        return NextResponse.json({
          success: true,
          metrics: [],
          dateRange: { from, to },
          timestamp: new Date().toISOString(),
          warning: 'Facebook API timed out. Please check your network connection or try again later.',
          processingTime: Date.now() - startTime
        });
      }
      throw fetchError; // Re-throw other errors
    }

    if (!response.ok) {
      console.error('Facebook API Error:', data.error);
      return NextResponse.json(
        {
          error: data.error?.message || 'Failed to fetch ad metrics',
          errorCode: data.error?.code,
          errorType: data.error?.type
        },
        { status: response.status }
      );
    }

    if (!data.data || data.data.length === 0) {
      return NextResponse.json({
        success: true,
        metrics: [],
        dateRange: { from, to },
        timestamp: new Date().toISOString()
      });
    }

    // Get registrations data for each day
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    // Fetch all registrations in date range
    const registrations = await prisma.registration.findMany({
      where: {
        registeredAt: {
          gte: fromDate,
          lte: toDate
        }
      },
      select: {
        registeredAt: true
      }
    });

    // Group registrations by date
    const regsByDate: Record<string, number> = {};
    registrations.forEach(reg => {
      const dateKey = reg.registeredAt.toISOString().split('T')[0];
      regsByDate[dateKey] = (regsByDate[dateKey] || 0) + 1;
    });

    // Combine FB data with registrations
    const metrics = data.data.map((day: any) => {
      const dateKey = day.date_start;
      const registrationCount = regsByDate[dateKey] || 0;
      const spend = parseFloat(day.spend || 0);
      const costPerReg = registrationCount > 0 ? spend / registrationCount : 0;

      // Extract results from actions array (link_click, lead, etc.)
      const results = day.actions?.find((action: any) => 
        action.action_type === 'link_click' || action.action_type === 'offsite_conversion.fb_pixel_lead'
      )?.value || day.actions?.[0]?.value || 0;
      
      const costPerResult = results > 0 ? spend / parseInt(results) : 0;

      return {
        date: day.date_start,
        spend,
        impressions: parseInt(day.impressions || 0),
        clicks: parseInt(day.clicks || 0),
        cpm: parseFloat(day.cpm || 0),
        cpc: parseFloat(day.cpc || 0),
        ctr: parseFloat(day.ctr || 0),
        reach: parseInt(day.reach || 0),
        results: parseInt(results),
        costPerResult: parseFloat(costPerResult.toFixed(2)),
        registrations: registrationCount,
        costPerReg: parseFloat(costPerReg.toFixed(2))
      };
    });

    console.log(`✅ Retrieved ${metrics.length} days of data`);
    
    const totalTime = Date.now() - startTime;
    console.log(`🏁 Total request time: ${totalTime}ms`);

    return NextResponse.json({
      success: true,
      metrics,
      dateRange: { from, to },
      timestamp: new Date().toISOString(),
      processingTime: totalTime
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ Error fetching chart data after ${totalTime}ms:`, error);
    
    // Check if it's an abort error (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        {
          error: 'Facebook API request timed out. Please try a shorter date range.',
          errorType: 'timeout',
          processingTime: totalTime
        },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.name : 'unknown',
        processingTime: totalTime
      },
      { status: 500 }
    );
  }
}
