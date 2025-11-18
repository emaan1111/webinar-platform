import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/ads/charts-debug
 * Debug endpoint to test Facebook API directly
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || '2025-11-17';
    const to = searchParams.get('to') || '2025-11-18';

    const accessToken = process.env.FB_ACCESS_TOKEN;
    const adAccountId = process.env.FB_AD_ACCOUNT_ID || 'act_280500016006811';

    if (!accessToken) {
      return NextResponse.json({ error: 'FB_ACCESS_TOKEN not configured' }, { status: 500 });
    }

    console.log('🐛 DEBUG: Fetching from', from, 'to', to);

    // Simple test without time_increment first
    const simpleUrl = `https://graph.facebook.com/v22.0/${adAccountId}/insights?fields=spend,impressions,clicks&time_range={"since":"${from}","until":"${to}"}&access_token=${accessToken}`;
    
    console.log('🔗 Testing simple aggregated query...');
    const simpleResponse = await fetch(simpleUrl, { 
      headers: { 'Accept': 'application/json' }
    });
    const simpleData = await simpleResponse.json();
    console.log('Simple response:', simpleResponse.status, JSON.stringify(simpleData).substring(0, 200));

    // Now test with time_increment=1
    const dailyUrl = `https://graph.facebook.com/v22.0/${adAccountId}/insights?fields=spend,impressions,clicks&time_range={"since":"${from}","until":"${to}"}&time_increment=1&access_token=${accessToken}`;
    
    console.log('🔗 Testing daily breakdown query...');
    const dailyStart = Date.now();
    const dailyResponse = await fetch(dailyUrl, { 
      headers: { 'Accept': 'application/json' }
    });
    const dailyTime = Date.now() - dailyStart;
    const dailyData = await dailyResponse.json();
    console.log(`Daily response (${dailyTime}ms):`, dailyResponse.status, JSON.stringify(dailyData).substring(0, 200));

    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      dateRange: { from, to },
      simple: {
        status: simpleResponse.status,
        data: simpleData
      },
      daily: {
        status: dailyResponse.status,
        data: dailyData,
        timeMs: dailyTime
      },
      totalTimeMs: totalTime
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ Debug error after ${totalTime}ms:`, error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.name : 'unknown',
      totalTimeMs: totalTime
    }, { status: 500 });
  }
}
