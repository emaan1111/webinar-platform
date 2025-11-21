import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const errors = await prisma.$queryRaw`
      SELECT * FROM video_error_logs
      ORDER BY created_at DESC
      LIMIT 500
    `;

    return NextResponse.json({ errors });
  } catch (error) {
    console.error('Error fetching video error logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video error logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      webinarId,
      registrationId,
      errorType,
      errorMessage,
      errorStack,
      userAgent,
      deviceInfo,
      videoUrl,
      timestamp,
      viewerName, // NEW
      viewerEmail, // NEW
    } = body;

    // Parse device info to check if desktop/mobile
    let parsedDeviceInfo = null;
    try {
      parsedDeviceInfo = JSON.parse(deviceInfo);
    } catch (e) {
      // Ignore parse error
    }

    // Log to console for immediate visibility with enhanced info
    console.error('🚨 VIDEO ERROR REPORTED:', {
      webinarId,
      registrationId,
      errorType,
      errorMessage,
      device: parsedDeviceInfo?.isMobile ? '📱 Mobile' : '🖥️  Desktop',
      viewer: viewerName || 'Unknown',
      email: viewerEmail || 'N/A',
      timestamp,
    });

    // Save to database for analysis
    await prisma.$executeRaw`
      INSERT INTO video_error_logs (
        webinar_id,
        registration_id,
        error_type,
        error_message,
        error_stack,
        user_agent,
        device_info,
        video_url,
        viewer_name,
        viewer_email,
        created_at
      ) VALUES (
        ${webinarId},
        ${registrationId || null},
        ${errorType},
        ${errorMessage},
        ${errorStack || null},
        ${userAgent},
        ${deviceInfo},
        ${videoUrl || null},
        ${viewerName || null},
        ${viewerEmail || null},
        NOW()
      )
      ON CONFLICT DO NOTHING
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving video error log:', error);
    return NextResponse.json(
      { error: 'Failed to log video error' },
      { status: 500 }
    );
  }
}
