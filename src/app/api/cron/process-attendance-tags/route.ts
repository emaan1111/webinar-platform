import { NextRequest, NextResponse } from 'next/server'
import { processEndedSessionsForAttendanceTagging } from '@/lib/clickfunnelsAttendanceTags'

/**
 * POST /api/cron/process-attendance-tags
 * 
 * Cron job that automatically applies attendance tags to ClickFunnels contacts
 * after each user's personal webinar session ends (for evergreen webinars).
 * 
 * Runs every 15 minutes to check for:
 * - Registrations whose session has ended (scheduledStartTime + duration < now)
 * - Haven't had attendance tags applied yet
 * - Applies tags based on actual watch time vs threshold
 * 
 * Protected by CRON_SECRET environment variable
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('❌ CRON_SECRET not configured')
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ Invalid cron secret')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('\n🔄 Starting attendance tagging cron job for ended sessions...')

    // Process registrations whose sessions have ended
    const result = await processEndedSessionsForAttendanceTagging()

    console.log('\n✅ Attendance tagging cron job completed')
    console.log(`   Sessions checked: ${result.processed}`)
    console.log(`   Tags applied: ${result.tagged}`)
    console.log(`   Errors: ${result.errors}`)

    return NextResponse.json({
      message: `Processed ${result.processed} ended session(s)`,
      ...result
    })

  } catch (error) {
    console.error('❌ Attendance tagging cron job failed:', error)
    return NextResponse.json(
      { 
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
