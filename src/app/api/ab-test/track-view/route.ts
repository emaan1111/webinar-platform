import { NextRequest, NextResponse } from 'next/server';
import { trackPageView, getDeviceType } from '@/lib/abTracking';
import { getVisitorId } from '@/lib/abTesting';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { webinarId, testGroup, elements, referrer: bodyReferrer } = body;

    if (!webinarId || !testGroup || !elements) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const visitorId = await getVisitorId();
    const headers = req.headers;
    const userAgent = headers.get('user-agent');
    const headerReferrer = headers.get('referer') || headers.get('referrer');
    
    // Use body referrer (client-side document.referrer) if provided, otherwise fall back to header
    const finalReferrer = bodyReferrer || headerReferrer;

    // Fire and forget tracking logic
    await trackPageView({
      webinarId,
      visitorId,
      testGroup,
      elements,
      device: getDeviceType(userAgent),
      referrer: finalReferrer || undefined,
      country: undefined, // Could use geo-header from edge middleware if available
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in track-view API:', error);
    // Don't leak error details, just return 500
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
