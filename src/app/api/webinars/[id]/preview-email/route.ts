import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { appendUnsubscribeFooter, replaceMergeTags, MergeTagContext } from '@/lib/emailTracking'

/**
 * POST /api/webinars/[id]/preview-email
 *
 * Returns the rendered HTML with sample merge-tag values.
 * Body: { htmlBody: string, type: 'reminder' | 'followup' | 'confirmation' }
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { htmlBody } = body

  if (!htmlBody) {
    return NextResponse.json({ error: 'htmlBody is required' }, { status: 400 })
  }

  const sampleCtx: MergeTagContext = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    webinarTitle: 'How to 10x Your Business in 90 Days',
    webinarTime: 'Saturday, June 15, 2025 at 10:00 AM EST',
    accessLink: 'https://example.com/webinar/live/abc123',
    countdownLink: 'https://example.com/webinar/countdown/abc123',
    calendarLink: 'https://example.com/api/calendar/sample-webinar?r=reg123',
    referralLink: 'https://example.com/register/sample-webinar?ref=jane',
    replayLink: 'https://example.com/webinar/replay/abc123',
    attendanceStatus: 'Attended',
    watchTime: '45 minutes',
    unsubscribeLink: 'https://example.com/unsubscribe?r=sample-registration',
  }

  const renderedHtml = appendUnsubscribeFooter(
    replaceMergeTags(htmlBody, sampleCtx),
    sampleCtx.unsubscribeLink
  )

  return NextResponse.json({ html: renderedHtml })
}
