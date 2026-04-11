import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateICS } from '@/lib/calendarUtils'

/**
 * GET /api/calendar/[slug]?r=registrationId&type=google|ics
 *
 * Returns an .ics file download or redirects to Google Calendar.
 * Linked from emails via {{calendar_link}} merge tag.
 */
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const url = new URL(request.url)
  const regId = url.searchParams.get('r')
  const type = url.searchParams.get('type') || 'ics'

  const webinar = await prisma.webinar.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      title: true,
      description: true,
      duration: true,
      schedules: {
        where: { isActive: true },
        orderBy: { scheduledAt: 'asc' },
        take: 1,
        select: { scheduledAt: true, timezone: true },
      },
    },
  })

  if (!webinar) {
    return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
  }

  // Determine start time from schedule or registration
  let startTime: Date | null = null
  let timezone = 'America/New_York'

  if (regId) {
    const registration = await prisma.registration.findUnique({
      where: { id: regId },
      select: { scheduledStartTime: true, timezone: true },
    })
    if (registration?.scheduledStartTime) {
      startTime = registration.scheduledStartTime
      timezone = registration.timezone || timezone
    }
  }

  if (!startTime && webinar.schedules.length > 0) {
    startTime = webinar.schedules[0].scheduledAt
    timezone = webinar.schedules[0].timezone || timezone
  }

  if (!startTime) {
    // Fallback: next hour
    startTime = new Date()
    startTime.setHours(startTime.getHours() + 1, 0, 0, 0)
  }

  const endTime = new Date(startTime.getTime() + webinar.duration * 60 * 1000)
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://emaanpowerclasses.com').replace(/\/+$/, '')

  const title = webinar.title
  const description = `${webinar.description || ''}\n\nJoin here: ${appUrl}/webinar/live/${webinar.id}`

  if (type === 'google') {
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmt(startTime)}/${fmt(endTime)}&details=${encodeURIComponent(description)}&sf=true&output=xml`
    return NextResponse.redirect(googleUrl)
  }

  // Generate .ics file using shared utility
  const uid = `${webinar.id}-${regId || 'general'}@${new URL(appUrl).hostname}`
  const ics = generateICS({
    title,
    description,
    startTime,
    durationMinutes: webinar.duration,
    url: `${appUrl}/webinar/live/${webinar.id}`,
    uid,
  })

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${sanitizeFilename(title)}.ics"`,
    },
  })
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '-').substring(0, 50)
}
