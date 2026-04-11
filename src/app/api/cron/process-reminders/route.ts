import { NextRequest, NextResponse } from 'next/server'
import { processPendingReminders } from '@/lib/reminders'
import { processEventReminders } from '@/lib/event-reminders'
import { processPendingClickFunnelsReminderTags } from '@/lib/clickfunnelsReminderTags'
import { processEndedWebinarsForAttendanceTags } from '@/lib/clickfunnelsAttendanceTags'
import { processEndedSessionsForPostSMS } from '@/lib/postSessionSmsAutomation'
import { syncWebinarJamRegistrations } from '@/lib/webinarjamSync'
import { processPendingReminderEmails, processPendingFollowUpEmails, processNonOpenerResends } from '@/lib/emailScheduler'

// POST /api/cron/process-reminders - Process pending reminders
// This should be called by a cron job every 5-10 minutes
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔔 Cron job: Processing reminders + emails + ClickFunnels tags + attendance tagging + post-session SMS + WebinarJam sync...')

    const [
      reminderStats, 
      eventReminderStats, 
      clickFunnelsTagStats, 
      attendanceTagStats, 
      postSessionSmsStats,
      webinarJamSyncStats,
      reminderEmailCount,
      followUpEmailCount,
      resendCount
    ] = await Promise.all([
      processPendingReminders(),
      processEventReminders(),
      processPendingClickFunnelsReminderTags(),
      processEndedWebinarsForAttendanceTags(),
      processEndedSessionsForPostSMS(),
      syncWebinarJamRegistrations(),
      processPendingReminderEmails(),
      processPendingFollowUpEmails(),
      processNonOpenerResends()
    ])

    return NextResponse.json({
      success: true,
      reminderStats,
      eventReminderStats,
      clickFunnelsTagStats,
      attendanceTagStats,
      postSessionSmsStats,
      webinarJamSyncStats,
      emailProcessing: {
        reminderEmails: reminderEmailCount,
        followUpEmails: followUpEmailCount,
        nonOpenerResends: resendCount
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ Cron job error:', error)
    return NextResponse.json(
      { error: 'Failed to process reminders', details: error.message },
      { status: 500 }
    )
  }
}

// GET /api/cron/process-reminders - Health check
export async function GET() {
  return NextResponse.json({
    message: 'Reminder processing endpoint is healthy',
    timestamp: new Date().toISOString()
  })
}
