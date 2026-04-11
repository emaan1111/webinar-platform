import { NextResponse } from 'next/server'
import { processPendingReminderEmails, processPendingFollowUpEmails, processNonOpenerResends } from '@/lib/emailScheduler'

/**
 * POST /api/cron/process-emails
 *
 * Called periodically (e.g. every minute by Railway cron or external cron service)
 * to process pending reminder & follow-up emails.
 *
 * Protected by CRON_SECRET header.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const reminderCount = await processPendingReminderEmails()
    const followUpCount = await processPendingFollowUpEmails()
    const resendCount = await processNonOpenerResends()

    return NextResponse.json({
      ok: true,
      processed: {
        reminders: reminderCount,
        followUps: followUpCount,
        nonOpenerResends: resendCount,
      },
    })
  } catch (err: any) {
    console.error('❌ Error processing emails:', err)
    return NextResponse.json(
      { error: 'Failed to process emails', details: err.message },
      { status: 500 }
    )
  }
}

// Also allow GET for simple cron services
export async function GET(request: Request) {
  return POST(request)
}
