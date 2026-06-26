import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { readBrandingSettings } from '@/lib/brandingSettings'
import { TemplateRenderer } from '@/components/TemplateRenderer'
import ExternalCountdownFallback from './ExternalCountdownFallback'

/**
 * Countdown page for external (EverWebinar) registrations — used for "just in time" picks.
 * Counts down to the registrant's start time and automatically enters the live room
 * (the EverWebinar live page, or the Zoom link for a live-Zoom pick) when it starts.
 *
 * URL: /countdown-external/<webinarId>?reg=<registrationId>
 *
 * If the external webinar has a Countdown template assigned (or a system "Default" exists),
 * we render that template with the countdown wired to the registrant's start time and
 * live room. Otherwise we fall back to the simple built-in countdown card.
 */

interface PageProps {
  params: { id: string }
  searchParams: { reg?: string; tz?: string }
}

async function getCountdownData(id: string, registrationId?: string) {
  const externalWebinar = await prisma.externalWebinar.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      externalWebinarName: true,
      countdownTemplateId: true,
      webinarDurationMinutes: true,
      liveZoomLink: true,
    },
  })
  if (!externalWebinar) return null

  let registration = null
  if (registrationId) {
    registration = await prisma.externalWebinarRegistration.findFirst({
      where: { id: registrationId, externalWebinarId: id },
      select: {
        id: true,
        name: true,
        scheduledStartTime: true,
        timezone: true,
        liveRoomUrl: true,
      },
    })
  }

  let template = null
  if (externalWebinar.countdownTemplateId) {
    template = await prisma.countdownTemplate.findUnique({
      where: { id: externalWebinar.countdownTemplateId },
    })
  }
  if (!template) {
    template = await prisma.countdownTemplate.findFirst({
      where: { isSystem: true, name: 'Default' },
    })
  }

  const brandingSettings = await readBrandingSettings()

  return { externalWebinar, registration, template, brandingSettings }
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

function escapeJsInHtml(text: string) {
  return text
    .replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'")
    .replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
}

function processCountdownTemplate(
  html: string,
  data: NonNullable<Awaited<ReturnType<typeof getCountdownData>>>,
  startTime: Date,
  joinUrl: string,
  tzOverride?: string,
) {
  const { externalWebinar, registration, brandingSettings } = data
  let processed = html

  const title = externalWebinar.externalWebinarName || externalWebinar.name || 'your webinar'
  const duration = externalWebinar.webinarDurationMinutes || 60
  const timezone = tzOverride || registration?.timezone || 'UTC'

  const safeTitle = escapeJsInHtml(title)
  // Webinar / host
  processed = processed.replace(/\{\{webinarTitle\}\}/g, safeTitle)
  processed = processed.replace(/\{\{webinar\.title\}\}/g, safeTitle)
  processed = processed.replace(/\{\{title\}\}/g, safeTitle)
  processed = processed.replace(/\{\{webinarDescription\}\}/g, '')
  processed = processed.replace(/\{\{webinar\.description\}\}/g, '')
  processed = processed.replace(/\{\{description\}\}/g, '')
  processed = processed.replace(/\{\{webinarDuration\}\}/g, String(duration))
  processed = processed.replace(/\{\{webinar\.duration\}\}/g, String(duration))
  processed = processed.replace(/\{\{hostName\}\}/g, '')
  processed = processed.replace(/\{\{host\.name\}\}/g, '')
  processed = processed.replace(/\{\{hostEmail\}\}/g, '')
  processed = processed.replace(/\{\{host\.email\}\}/g, '')

  // Branding (parity with the internal countdown page)
  const b = brandingSettings || {}
  processed = processed.replace(/\{\{organizationName\}\}/g, escapeHtml(b.organizationName || ''))
  processed = processed.replace(/\{\{contactEmail\}\}/g, escapeHtml(b.contactEmail || ''))
  processed = processed.replace(/\{\{websiteUrl\}\}/g, escapeHtml(b.websiteUrl || ''))
  processed = processed.replace(/\{\{primaryColor\}\}/g, escapeHtml(b.primaryColor || ''))
  processed = processed.replace(/\{\{accentColor\}\}/g, escapeHtml(b.accentColor || ''))
  processed = processed.replace(/\{\{logoUrl\}\}/g, escapeHtml(b.logoUrl || ''))

  // Date / time formatted in the registrant's timezone
  let formattedDate = ''
  let formattedTime = ''
  let formattedDateTime = ''
  try {
    formattedDate = startTime.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: timezone,
    })
    formattedTime = startTime.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', timeZone: timezone, timeZoneName: 'short',
    })
    formattedDateTime = `${formattedDate} at ${formattedTime}`
  } catch {
    formattedDate = startTime.toISOString().split('T')[0]
    formattedTime = startTime.toISOString().split('T')[1].substring(0, 5) + ' UTC'
    formattedDateTime = `${formattedDate} at ${formattedTime}`
  }

  processed = processed.replace(/\{\{webinarDate\}\}/g, formattedDate)
  processed = processed.replace(/\{\{schedule\.date\}\}/g, formattedDate)
  processed = processed.replace(/\{\{date\}\}/g, formattedDate)
  processed = processed.replace(/\{\{webinarTime\}\}/g, formattedTime)
  processed = processed.replace(/\{\{schedule\.time\}\}/g, formattedTime)
  processed = processed.replace(/\{\{time\}\}/g, formattedTime)
  processed = processed.replace(/\{\{webinarDateTime\}\}/g, formattedDateTime)
  processed = processed.replace(/\{\{schedule\.dateTime\}\}/g, formattedDateTime)
  processed = processed.replace(/\{\{schedule\.dateISO\}\}/g, startTime.toISOString())
  processed = processed.replace(/\{\{timeZone\}\}/g, timezone.replace(/_/g, ' '))

  // Links — the "join" target IS the captured live room (EverWebinar live page / Zoom link).
  const safeJoinUrl = escapeJsInHtml(joinUrl)
  processed = processed.replace(/\{\{joinLink\}\}/g, safeJoinUrl)
  processed = processed.replace(/\{\{registrationLink\}\}/g, '')
  processed = processed.replace(/\{\{referralLink\}\}/g, '')
  const start = startTime.toISOString().replace(/-|:|\.\d\d\d/g, '')
  const end = new Date(startTime.getTime() + duration * 60000).toISOString().replace(/-|:|\.\d\d\d/g, '')
  const calendarLink =
    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}` +
    `&dates=${start}/${end}&location=${encodeURIComponent(joinUrl)}`
  processed = processed.replace(/\{\{calendarLink\}\}/g, calendarLink)

  // Misc date tokens
  processed = processed.replace(/\{\{targetDate\}\}/g, startTime.toISOString())
  processed = processed.replace(/\{\{webinarStartDateTime\}\}/g, startTime.toISOString())
  processed = processed.replace(/\{\{countdownIso\}\}/g, startTime.toISOString())
  processed = processed.replace(/\{\{currentYear\}\}/g, new Date().getFullYear().toString())

  // Countdown script: tick to start, then send them into the live room.
  const hasCountdownPlaceholder = html.includes('{{countdown}}')
  const tickAndRedirect = `
<script>
(function() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  var targetTime = new Date('${startTime.toISOString()}').getTime();
  var joinUrl = '${escapeJsInHtml(joinUrl)}';
  var hasRedirected = false;
  function updateCountdown() {
    var distance = targetTime - new Date().getTime();
    if (distance <= 0) {
      var el = document.getElementById('countdown');
      if (el) el.innerHTML = 'Webinar is Live! Redirecting...';
      if (!hasRedirected && joinUrl) {
        hasRedirected = true;
        setTimeout(function() { window.location.href = joinUrl; }, 1500);
      }
      return;
    }
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);
    var text = '';
    if (days > 0) text += days + 'd ';
    text += hours.toString().padStart(2, '0') + 'h ' + minutes.toString().padStart(2, '0') + 'm ' + seconds.toString().padStart(2, '0') + 's';
    var el = document.getElementById('countdown');
    if (el) el.innerHTML = text;
    var d = document.getElementById('days'); if (d) d.innerText = days < 10 ? '0' + days : days;
    var h = document.getElementById('hours'); if (h) h.innerText = hours < 10 ? '0' + hours : hours;
    var m = document.getElementById('minutes'); if (m) m.innerText = minutes < 10 ? '0' + minutes : minutes;
    var s = document.getElementById('seconds'); if (s) s.innerText = seconds < 10 ? '0' + seconds : seconds;
  }
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', function() { updateCountdown(); setInterval(updateCountdown, 1000); });
  } else { updateCountdown(); setInterval(updateCountdown, 1000); }
})();
</script>
`
  if (hasCountdownPlaceholder) {
    processed = processed.replace(/\{\{countdown\}\}/g, tickAndRedirect)
  } else if (/<\/body>/i.test(processed)) {
    processed = processed.replace(/<\/body>/i, `${tickAndRedirect}\n</body>`)
  } else {
    processed += tickAndRedirect
  }

  return processed
}

export default async function ExternalCountdownPage({ params, searchParams }: PageProps) {
  const data = await getCountdownData(params.id, searchParams.reg)
  if (!data) notFound()

  const { externalWebinar, registration } = data
  const startTime = registration?.scheduledStartTime ? new Date(registration.scheduledStartTime) : null
  // The live room is the per-registrant URL captured at registration (EverWebinar live page
  // for an EverWebinar pick, Zoom link for a Zoom pick). When that wasn't captured — e.g. an
  // EverWebinar scheduled pick where the API returned no per-attendee live link — fall back to
  // the webinar's configured live Zoom link so the countdown still has somewhere to send people
  // at T-0. Without this fallback the countdown ticks to zero and gets stuck with nowhere to go.
  const liveRoomUrl = registration?.liveRoomUrl || externalWebinar.liveZoomLink || null
  const name = registration?.name || ''
  const webinarName = externalWebinar.externalWebinarName || externalWebinar.name || 'your webinar'

  // Already started → go straight into the live room (EverWebinar live page / Zoom link).
  if (startTime && liveRoomUrl && startTime.getTime() <= Date.now()) {
    redirect(liveRoomUrl)
  }

  // Render the selected template whenever one is set and we know the start time.
  // The live room is wired in when available (auto-enter at T-0); if it isn't yet,
  // the template still shows and simply doesn't redirect.
  if (data.template && startTime) {
    const processedHtml = processCountdownTemplate(
      data.template.htmlCode, data, startTime, liveRoomUrl || '', searchParams.tz,
    )
    return <TemplateRenderer html={processedHtml} />
  }

  // Fallback: simple built-in countdown.
  return (
    <ExternalCountdownFallback
      startTime={startTime ? startTime.toISOString() : null}
      liveRoomUrl={liveRoomUrl}
      name={name}
      webinarName={webinarName}
    />
  )
}

export async function generateMetadata() {
  return { title: 'Countdown', description: 'Webinar countdown page' }
}
