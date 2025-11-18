import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/ads/charts-mock
 * Mock data endpoint for testing charts when Facebook API is unavailable
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || '2025-11-11';
    const to = searchParams.get('to') || '2025-11-18';

    // Generate mock data based on date range
    const startDate = new Date(from);
    const endDate = new Date(to);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const metrics = [];
    
    for (let i = 0; i < daysDiff; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Generate realistic-looking random data
      const spend = 180 + Math.random() * 70; // $180-250 per day
      const impressions = Math.floor(18000 + Math.random() * 10000); // 18k-28k
      const clicks = Math.floor(1000 + Math.random() * 500); // 1000-1500
      const reach = Math.floor(impressions * 0.85); // ~85% of impressions
      const ctr = (clicks / impressions) * 100;
      const cpc = spend / clicks;
      const cpm = (spend / impressions) * 1000;
      const registrations = Math.floor(80 + Math.random() * 80); // 80-160 registrations
      const costPerReg = registrations > 0 ? spend / registrations : 0;
      const results = clicks; // For mock, results = clicks
      const costPerResult = results > 0 ? spend / results : 0;

      metrics.push({
        date: dateStr,
        spend: parseFloat(spend.toFixed(2)),
        impressions,
        clicks,
        cpm: parseFloat(cpm.toFixed(2)),
        cpc: parseFloat(cpc.toFixed(2)),
        ctr: parseFloat(ctr.toFixed(2)),
        reach,
        results,
        costPerResult: parseFloat(costPerResult.toFixed(2)),
        registrations,
        costPerReg: parseFloat(costPerReg.toFixed(2))
      });
    }

    console.log(`✅ [MOCK] Generated ${metrics.length} days of mock data`);

    return NextResponse.json({
      success: true,
      metrics,
      dateRange: { from, to },
      timestamp: new Date().toISOString(),
      isMockData: true,
      note: 'This is mock data for testing. Update Facebook token to see real data.'
    });

  } catch (error) {
    console.error('❌ Error generating mock data:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
