import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { TemplateRenderer } from '@/components/TemplateRenderer'

/**
 * Thank-you page for external (EverWebinar/WebinarJam/live-Zoom) registrations.
 *
 * The popup/embed redirects scheduled & Zoom picks here after a successful registration,
 * passing the chosen time, name and registration id as query params (?t=...&name=...&reg=...).
 * Just-in-time picks go to /countdown-external instead (auto-enter the room).
 *
 * If the external webinar has a Thank-You template assigned (or a system "Default" exists),
 * we render that template with the registrant's details filled in — mirroring the internal
 * /thank-you/[slug] page. Otherwise we fall back to a simple built-in card.
 */

interface PageProps {
  params: { id: string }
  searchParams: { reg?: string; t?: string; name?: string }
}

/**
 * Resolve a public registration URL for the share / "invite a friend" buttons.
 *
 * External webinars have no built-in registration page (the signup form is an embed),
 * so the share target is the LEAD PAGE that hosts that embed. We prefer a page linked
 * via the externalWebinarId FK; if none exists we fall back to a page that references
 * the webinar id directly in its raw HTML (CUSTOM pages embed it that way). The
 * highest-traffic match wins. Returns '' when no such page exists — callers then fall
 * back to window.location.href, the previous behaviour.
 */
async function resolveRegistrationUrl(externalWebinarId: string): Promise<string> {
  let leadPage = await prisma.leadPage.findFirst({
    where: { externalWebinarId },
    orderBy: { views: 'desc' },
    select: { slug: true },
  })
  if (!leadPage) {
    leadPage = await prisma.leadPage.findFirst({
      where: { htmlContent: { contains: externalWebinarId } },
      orderBy: { views: 'desc' },
      select: { slug: true },
    })
  }
  if (!leadPage) return ''

  const h = headers()
  const host = h.get('host') || ''
  if (!host) return ''
  const proto = h.get('x-forwarded-proto') || 'https'
  return `${proto}://${host}/p/${leadPage.slug}`
}

async function getThankYouData(id: string, registrationId?: string) {
  const externalWebinar = await prisma.externalWebinar.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      externalWebinarName: true,
      thankYouTemplateId: true,
      webinarDurationMinutes: true,
    },
  })

  if (!externalWebinar) {
    return null
  }

  let registration = null
  if (registrationId) {
    registration = await prisma.externalWebinarRegistration.findUnique({
      where: { id: registrationId },
      select: {
        id: true,
        name: true,
        email: true,
        scheduledStartTime: true,
        timezone: true,
        liveRoomUrl: true,
      },
    })
  }

  // Resolve the template: explicit assignment → system "Default" → none.
  let template = null
  if (externalWebinar.thankYouTemplateId) {
    template = await prisma.thankYouTemplate.findUnique({
      where: { id: externalWebinar.thankYouTemplateId },
    })
  }
  if (!template) {
    template = await prisma.thankYouTemplate.findFirst({
      where: { isSystem: true, name: 'Default' },
    })
  }

  const registrationUrl = await resolveRegistrationUrl(id)

  return { externalWebinar, registration, template, registrationUrl }
}

// Escape a string for safe insertion inside a JS string literal in a template
// (URLs are used inside quotes for share/calendar buttons). Mirrors the internal page.
function escapeForJsString(str: string) {
  return str
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
}

function processTemplate(
  html: string,
  data: NonNullable<Awaited<ReturnType<typeof getThankYouData>>>,
  id: string,
  tParam: string,
  nameParam: string,
) {
  let processed = html
  const { externalWebinar, registration } = data

  const title = externalWebinar.externalWebinarName || externalWebinar.name || 'the webinar'
  const duration = externalWebinar.webinarDurationMinutes || 60
  const attendeeName = registration?.name || nameParam || 'there'
  const attendeeEmail = registration?.email || ''
  const regId = registration?.id || ''
  const timezone = registration?.timezone || 'UTC'

  // Schedule date/time — prefer the stored start time, fall back to the human ?t= label.
  const scheduleDateTime = registration?.scheduledStartTime
    ? new Date(registration.scheduledStartTime)
    : null

  let formattedDate = ''
  let formattedTime = ''
  let formattedDateTime = tParam || ''
  let scheduleISO = ''
  if (scheduleDateTime && !isNaN(scheduleDateTime.getTime())) {
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: timezone,
    }
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric', minute: '2-digit', timeZone: timezone, timeZoneName: 'short',
    }
    formattedDate = scheduleDateTime.toLocaleDateString('en-US', dateOptions)
    formattedTime = scheduleDateTime.toLocaleTimeString('en-US', timeOptions)
    formattedDateTime = `${formattedDate} at ${formattedTime}`
    scheduleISO = scheduleDateTime.toISOString()
  }

  // Join / room links. For external webinars the registrant's live room IS the join link;
  // fall back to the countdown-external page when we don't have a stored room URL yet.
  const countdownLink = regId ? `/countdown-external/${id}?reg=${encodeURIComponent(regId)}` : ''
  // The "join" target is the captured live room: the EverWebinar live page for an
  // EverWebinar pick, or the Zoom link for a live-Zoom pick. Fall back to the countdown
  // page only when no room URL was captured at registration.
  const liveTarget = registration?.liveRoomUrl || countdownLink
  const safeLiveTarget = escapeForJsString(liveTarget)

  // Calendar links (only meaningful when we know the start time).
  let safeGoogleCalendarLink = ''
  let safeIcsDataUrl = ''
  if (scheduleDateTime && !isNaN(scheduleDateTime.getTime())) {
    const calStart = scheduleDateTime.toISOString().replace(/-|:|\.\d\d\d/g, '')
    const calEnd = new Date(scheduleDateTime.getTime() + duration * 60000)
      .toISOString().replace(/-|:|\.\d\d\d/g, '')
    const googleCalendarLink =
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}` +
      `&location=${encodeURIComponent('Online Webinar')}&dates=${calStart}/${calEnd}`
    safeGoogleCalendarLink = escapeForJsString(googleCalendarLink)
    const icsContent = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Webinar Platform//EN', 'BEGIN:VEVENT',
      `DTSTART:${calStart}`, `DTEND:${calEnd}`, `SUMMARY:${title}`, 'LOCATION:Online Webinar',
      `UID:${regId || 'webinar'}@webinar-platform.com`, 'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n')
    safeIcsDataUrl = escapeForJsString(`data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`)
  }

  // Share messages.
  const whatsappShareMessage = formattedDateTime
    ? `I just registered for '${title}' on ${formattedDateTime}. See you there!`
    : `I just registered for '${title}'. See you there!`
  const safeWhatsappShareMessage = escapeForJsString(whatsappShareMessage)
  const safeFacebookShareMessage = escapeForJsString(`Check out this webinar: ${title}`)

  // Countdown timer script (targets the start time) — matches the internal template contract.
  const countdownScript = scheduleDateTime && !isNaN(scheduleDateTime.getTime())
    ? `
    const targetTime = new Date('${scheduleDateTime.toISOString()}').getTime();
    function updateCountdown() {
      const now = new Date().getTime();
      const distance = targetTime - now;
      const el = document.getElementById('countdown');
      if (!el) return;
      if (distance < 0) { el.innerHTML = 'Webinar has started!'; return; }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      let out = '';
      if (days > 0) out += days + 'd ';
      out += hours + 'h ' + minutes + 'm ' + seconds + 's';
      el.innerHTML = out;
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);
  `
    : ''

  const replacements: Record<string, string> = {
    // Webinar
    'webinarTitle': title,
    'webinar.title': title,
    'webinarDescription': '',
    'webinar.description': '',
    'webinarDuration': String(duration),
    'webinar.duration': String(duration),
    // Public registration (lead) page — share/invite buttons point here so friends can sign up.
    'webinar.registrationUrl': escapeForJsString(data.registrationUrl || ''),
    // Host (external webinars have no host record)
    'hostName': '',
    'host.name': '',
    'hostEmail': '',
    'host.email': '',
    // Attendee
    'attendeeName': attendeeName,
    'attendee.name': attendeeName,
    'attendeeEmail': attendeeEmail,
    'attendee.email': attendeeEmail,
    'registrationId': regId,
    'registration.id': regId,
    // Schedule
    'webinarDate': formattedDate,
    'schedule.date': formattedDate,
    'webinarTime': formattedTime,
    'schedule.time': formattedTime,
    'webinarDateTime': formattedDateTime,
    'schedule.dateTime': formattedDateTime,
    'schedule.dateISO': scheduleISO,
    'timeZone': timezone.replace(/_/g, ' '),
    // Links
    'joinLink': safeLiveTarget,
    'countdownLink': safeLiveTarget,
    'roomLink': safeLiveTarget,
    'broadcast.url': safeLiveTarget,
    'calendarLink': safeGoogleCalendarLink,
    'googleCalendarLink': safeGoogleCalendarLink,
    'appleCalendarLink': safeIcsDataUrl,
    'icsCalendarLink': safeIcsDataUrl,
    // Referral (not supported for external webinars)
    'referralCode': '',
    'referralLink': '',
    'whatsappReferralLink': '',
    // Share
    'whatsappShareMessage': safeWhatsappShareMessage,
    'facebookShareMessage': safeFacebookShareMessage,
    // Countdown script
    'countdown': countdownScript,
  }

  for (const [key, value] of Object.entries(replacements)) {
    const pattern = new RegExp(`\\{\\{\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}\\}`, 'g')
    processed = processed.replace(pattern, value)
  }

  return processed
}

function FallbackCard({ name, time }: { name: string; time: string }) {
  const firstName = name ? name.split(' ')[0] : ''
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-9 h-9 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          You&apos;re registered{firstName ? `, ${firstName}` : ''}! 🎉
        </h1>
        {time ? (
          <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Your session</p>
            <p className="text-lg font-semibold text-gray-900 mt-0.5">{time}</p>
            <p className="text-xs text-slate-500 mt-1">(shown in your local timezone)</p>
          </div>
        ) : null}
        <p className="text-gray-600 mt-5">
          Check your email for the link to join the webinar — we&apos;ve sent the details and
          we&apos;ll remind you before it starts.
        </p>
        <p className="text-xs text-gray-400 mt-6">
          Don&apos;t see the email? Check your spam or promotions folder.
        </p>
      </div>
    </div>
  )
}

export default async function ExternalThankYouPage({ params, searchParams }: PageProps) {
  const tParam = (searchParams.t || '').trim()
  const nameParam = (searchParams.name || '').trim()
  const data = await getThankYouData(params.id, searchParams.reg)

  // No webinar, or no template configured anywhere → simple built-in card (current behaviour).
  if (!data || !data.template) {
    return <FallbackCard name={nameParam} time={tParam} />
  }

  const processedHtml = processTemplate(data.template.htmlCode, data, params.id, tParam, nameParam)
  return <TemplateRenderer html={processedHtml} />
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  const data = await getThankYouData(params.id, searchParams.reg)
  const title = data?.externalWebinar.externalWebinarName || data?.externalWebinar.name
  return {
    title: title ? `Thank You - ${title}` : 'Thank You',
  }
}
