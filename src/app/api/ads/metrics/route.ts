import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/ads/metrics
 * Fetch Facebook Ads metrics for a given date range
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'today';
    
    const accessToken = process.env.FB_ACCESS_TOKEN;
    const adAccountId = process.env.FB_AD_ACCOUNT_ID || 'act_280500016006811';

    if (!accessToken) {
      return NextResponse.json(
        { error: 'FB_ACCESS_TOKEN not configured' },
        { status: 500 }
      );
    }

    // Map range to Facebook date preset
    const datePresetMap: Record<string, string> = {
      'today': 'today',
      'yesterday': 'yesterday',
      'last_7d': 'last_7d',
      'last_30d': 'last_30d',
      'this_month': 'this_month',
      'last_month': 'last_month'
    };

    const datePreset = datePresetMap[range] || 'today';

    // Fetch insights from Facebook Ads API
    const url = `https://graph.facebook.com/v22.0/${adAccountId}/insights?fields=spend,impressions,clicks,cpm,cpc,ctr,reach&date_preset=${datePreset}&access_token=${accessToken}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error('Facebook API Error:', data);
      return NextResponse.json(
        {
          error: data.error?.message || 'Failed to fetch ad metrics',
          errorCode: data.error?.code,
          errorType: data.error?.type
        },
        { status: response.status }
      );
    }

    // Return the first data point (aggregated metrics for the date range)
    const metrics = data.data?.[0] || null;

    if (!metrics) {
      return NextResponse.json(
        {
          error: 'No data available for this date range',
          data: null
        },
        { status: 404 }
      );
    }

    // Get registration count for the same date range
    let registrations = 0;
    let costPerReg = 0;

    try {
      // Calculate date range for registrations query
      const dateRangeMap: Record<string, { days: number }> = {
        'today': { days: 0 },
        'yesterday': { days: 1 },
        'last_7d': { days: 7 },
        'last_30d': { days: 30 },
        'this_month': { days: new Date().getDate() },
        'last_month': { days: 30 }
      };

      const rangeConfig = dateRangeMap[datePreset];
      const endDate = datePreset === 'yesterday' 
        ? new Date(new Date().setDate(new Date().getDate() - 1))
        : new Date();
      
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - (rangeConfig?.days || 0));
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      // Query registrations from database
      const regs = await prisma.registration.count({
        where: {
          registeredAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      registrations = regs;
      costPerReg = registrations > 0 ? parseFloat(metrics.spend) / registrations : 0;
    } catch (dbError) {
      console.error('Error fetching registrations:', dbError);
      // Continue without registration data if DB query fails
    }

    return NextResponse.json({
      success: true,
      range: datePreset,
      data: {
        ...metrics,
        registrations,
        costPerReg: costPerReg.toFixed(2)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching ad metrics:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
