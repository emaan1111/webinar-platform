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
    } = body;

    // Log to console for immediate visibility
    console.error('🚨 VIDEO ERROR REPORTED:', {
      webinarId,
      registrationId,
      errorType,
      errorMessage,
      deviceInfo,
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
