import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isWebinarJamConfigured } from '@/lib/webinarjam'
import { syncWebinarJamRegistrations } from '@/lib/webinarjamSync'

/**
 * WebinarJam sync — manual trigger.
 *
 * POST /api/cron/sync-webinarjam
 *
 * Runs the same sync as the scheduled path (process-reminders →
 * lib/webinarjamSync) on demand: the dashboard's "Sync" button calls this.
 *
 * This file used to carry its own copy of the whole sync. The two copies
 * drifted: this one pushed attendance on to Emaan, the library one did not —
 * and since only the library one was actually scheduled, Emaan never received
 * attendance for anyone. One implementation now, in the library.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify auth: accept either cron secret OR authenticated dashboard session
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    let authorized = false
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      authorized = true
    }
    if (!authorized) {
      const session = await getServerSession(authOptions)
      if (session?.user) {
        authorized = true
      }
    }
    if (!authorized && cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isWebinarJamConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'WebinarJam API not configured',
        hint: 'Add WEBINARJAM_API_KEY to your .env file'
      }, { status: 400 })
    }

    const stats = await syncWebinarJamRegistrations()
    const processingTime = Date.now() - startTime

    if (stats.skipped) {
      return NextResponse.json({
        success: true,
        message: stats.skipped,
        stats,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      })
    }

    console.log(`✅ WebinarJam sync complete: ${stats.newRegistrations} new, ${stats.attendanceUpdated} attendance updates (${processingTime}ms)`)

    return NextResponse.json({
      success: true,
      stats,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ WebinarJam sync error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint for health check
export async function GET() {
  const configured = isWebinarJamConfigured()
  const hasFacebook = !!(process.env.FB_PIXEL_ID && process.env.FB_ACCESS_TOKEN)

  // Count active external webinars
  const activeCount = await prisma.externalWebinar.count({ where: { isActive: true } }).catch(() => 0)

  return NextResponse.json({
    service: 'WebinarJam/EverWebinar Sync',
    status: configured ? 'ready' : 'not_configured',
    configuration: {
      webinarjam_api_configured: configured,
      active_external_webinars: activeCount,
      facebook_capi_configured: hasFacebook,
    },
    description: 'Syncs registrations and attendance data from WebinarJam/EverWebinar',
    cron_recommendation: 'Run every 10-15 minutes',
    features: [
      'New registration sync',
      'Attendance data sync (watch time)',
      'Facebook CAPI events',
      'ClickFunnels attendance tags',
      'Post-session SMS',
    ]
  })
}
