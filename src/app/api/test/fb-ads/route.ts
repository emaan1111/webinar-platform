import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint to verify Facebook Ads API connection
 * GET /api/test/fb-ads
 */
export async function GET(request: NextRequest) {
  try {
    const accessToken = process.env.FB_ACCESS_TOKEN;
    const adAccountId = 'act_280500016006811';

    if (!accessToken) {
      return NextResponse.json(
        { error: 'FB_ACCESS_TOKEN not found in environment variables' },
        { status: 500 }
      );
    }

    // Test 1: Verify token is valid
    console.log('🔍 Testing Facebook Ads API connection...');
    console.log('📊 Ad Account ID:', adAccountId);

    // Test 2: Fetch today's ad spend (using latest API version v22.0)
    const url = `https://graph.facebook.com/v22.0/${adAccountId}/insights?fields=spend,impressions,clicks,cpm,cpc,ctr,reach&date_preset=today&access_token=${accessToken}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Facebook API Error:', data);
      return NextResponse.json(
        {
          success: false,
          error: data.error?.message || 'Failed to fetch ad data',
          errorCode: data.error?.code,
          errorType: data.error?.type,
          details: data.error
        },
        { status: response.status }
      );
    }

    // Success!
    console.log('✅ Successfully connected to Facebook Ads API!');
    console.log('📈 Data received:', data);

    return NextResponse.json({
      success: true,
      message: '✅ Facebook Ads API connection successful!',
      adAccountId,
      todayData: data.data?.[0] || null,
      rawResponse: data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
