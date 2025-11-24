import { NextRequest, NextResponse } from 'next/server'
import { schedulePostWebinarRemindersForSession } from '@/lib/reminders'
import { prisma } from '@/lib/prisma'

// POST /api/tracking/schedule-post-reminders
// Called when a user's viewing session ends to schedule post-webinar reminders
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationId, watchedSeconds, videoPosition } = body

    if (!registrationId) {
      return NextResponse.json(
        { error: 'registrationId is required' },
        { status: 400 }
      )
    }

    console.log('📬 Scheduling post-webinar reminders:', {
      registrationId,
      watchedSeconds,
      videoPosition
    })

    // Get webinar duration to calculate percentage
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        webinar: {
          select: {
            videoDuration: true
          }
        }
      }
    })

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    // Use the maximum of live watch time and replay watch time
    // This ensures replay viewers qualify for SMS if they watched enough
    const liveWatchTime = watchedSeconds || 0
    const replayWatchTime = registration.replayWatchTime || 0
    const maxWatchedSeconds = Math.max(liveWatchTime, replayWatchTime)
    
    const watchedMinutes = maxWatchedSeconds / 60
    const videoDuration = registration.webinar.videoDuration || 0
    const watchedPercentage = videoDuration > 0 
      ? (maxWatchedSeconds / videoDuration) * 100 
      : 0

    console.log('📊 Watch stats:', {
      liveWatchTime: Math.round(liveWatchTime / 60),
      replayWatchTime: Math.round(replayWatchTime / 60),
      watchedMinutes: Math.round(watchedMinutes),
      watchedPercentage: Math.round(watchedPercentage),
      videoDuration
    })

    // Schedule post-webinar reminders based on watch time
    await schedulePostWebinarRemindersForSession(
      registrationId,
      watchedMinutes,
      watchedPercentage
    )

    return NextResponse.json({
      success: true,
      watchedMinutes: Math.round(watchedMinutes),
      watchedPercentage: Math.round(watchedPercentage)
    })
  } catch (error: any) {
    console.error('❌ Failed to schedule post-webinar reminders:', error)
    return NextResponse.json(
      { 
        error: 'Failed to schedule post-webinar reminders',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
