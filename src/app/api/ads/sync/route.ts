import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/ads/sync
 * Manually trigger a sync of Facebook Ads data
 */
export async function POST(request: NextRequest) {
  try {
    const accessToken = process.env.FB_ACCESS_TOKEN;
    const adAccountId = process.env.FB_AD_ACCOUNT_ID || 'act_280500016006811';

    if (!accessToken) {
      return NextResponse.json(
        { error: 'FB_ACCESS_TOKEN not configured' },
        { status: 500 }
      );
    }

    console.log('🔄 Manual sync triggered for ad account:', adAccountId);

    // Fetch latest data from Facebook
    const url = `https://graph.facebook.com/v22.0/${adAccountId}/insights?fields=spend,impressions,clicks,cpm,cpc,ctr,reach&date_preset=today&access_token=${accessToken}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Sync failed:', data.error);
      return NextResponse.json(
        {
          success: false,
          error: data.error?.message || 'Failed to sync ad data'
        },
        { status: response.status }
      );
    }

    const metrics = data.data?.[0];

    if (!metrics) {
      return NextResponse.json(
        {
          success: false,
          error: 'No data available to sync'
        },
        { status: 404 }
      );
    }

    // TODO: Store in database for historical tracking
    // await prisma.adSpendRecord.create({
    //   data: {
    //     date: new Date(),
    //     spend: parseFloat(metrics.spend),
    //     impressions: parseInt(metrics.impressions),
    //     clicks: parseInt(metrics.clicks),
    //     cpm: parseFloat(metrics.cpm),
    //     cpc: parseFloat(metrics.cpc),
    //     ctr: parseFloat(metrics.ctr),
    //     reach: parseInt(metrics.reach),
    //   }
    // });

    console.log('✅ Sync completed successfully');
    console.log('📊 Today\'s metrics:', {
      spend: `$${metrics.spend}`,
      impressions: metrics.impressions,
      clicks: metrics.clicks
    });

    return NextResponse.json({
      success: true,
      message: 'Ad data synced successfully',
      data: metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
