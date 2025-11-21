import { NextRequest, NextResponse } from 'next/server'
import { processEndedSessionsForPostSMS } from '@/lib/postSessionSmsAutomation'

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Cron] Starting post-session SMS processing...')

    const result = await processEndedSessionsForPostSMS()

    console.log('[Cron] Post-session SMS processing completed:', result)

    return NextResponse.json({
      success: true,
      message: `Processed ${result.checked} sessions, sent ${result.sent} SMS, ${result.failed} failed`,
      ...result
    })
  } catch (error) {
    console.error('[Cron] Post-session SMS processing error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process post-session SMS',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
