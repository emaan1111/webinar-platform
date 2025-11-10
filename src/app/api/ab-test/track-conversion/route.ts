import { NextRequest, NextResponse } from 'next/server';
import { trackConversionFromRequest } from '@/lib/abTracking';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webinarId, registrationId } = body;

    if (!webinarId || !registrationId) {
      return NextResponse.json(
        { error: 'Missing webinarId or registrationId' },
        { status: 400 }
      );
    }

    // Track the conversion
    await trackConversionFromRequest(webinarId, registrationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking conversion:', error);
    return NextResponse.json(
      { error: 'Failed to track conversion' },
      { status: 500 }
    );
  }
}
