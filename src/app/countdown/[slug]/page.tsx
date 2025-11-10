import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { calculateScheduleDateTime } from '@/lib/webinarSchedule'

interface PageProps {
  params: { slug: string }
  searchParams: { r?: string; s?: string; tz?: string }
}

async function getCountdownData(slug: string, registrationId?: string | null, scheduleId?: string | null) {
  const webinar = await prisma.webinar.findUnique({
    where: { slug },
    include: {
      host: { select: { name: true, email: true } },
      schedules: true,
    },
  })

  if (!webinar) {
    return null
  }

  // If registrationId is provided, get the registration to find the registered schedule
  let registration = null
  if (registrationId) {
    registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      select: { id: true, scheduleId: true, registeredAt: true },
    })
    
    // Debug logging
    console.log('Registration found:', {
      id: registration?.id,
      scheduleId: registration?.scheduleId,
      registeredAt: registration?.registeredAt,
    })
  }

  // Priority: 1) Schedule from registration, 2) Explicit scheduleId from URL, 3) Next upcoming
  const targetScheduleId = registration?.scheduleId || scheduleId
  
  const explicitSchedule = targetScheduleId 
    ? webinar.schedules.find((item) => item.id === targetScheduleId)
    : null

  const now = new Date()
  
  // Debug logging
  console.log('Schedule lookup:', {
    targetScheduleId,
    explicitScheduleFound: !!explicitSchedule,
    explicitScheduleType: explicitSchedule?.scheduleType,
    explicitScheduleMinutes: explicitSchedule?.minutesFromReg,
    currentTime: now.toISOString(),
  })
  
  let selectedSchedule
  
  if (explicitSchedule) {
    // Use the registered or explicitly specified schedule
    const scheduledTime = calculateScheduleDateTime(explicitSchedule, registration, now)
    
    console.log('Calculated schedule time:', {
      scheduledTime: scheduledTime.toISOString(),
      timeDiff: (scheduledTime.getTime() - now.getTime()) / 1000 / 60,
      registrationTime: registration?.registeredAt,
    })
    
    selectedSchedule = {
      schedule: explicitSchedule,
      start: scheduledTime,
    }
  } else {
    // Find next upcoming schedule
    const scheduleCandidates = webinar.schedules.map((schedule) => ({
      schedule,
      start: calculateScheduleDateTime(schedule, null, now),
    }))

    scheduleCandidates.sort(
      (a, b) => a.start.getTime() - b.start.getTime()
    )

    const upcoming = scheduleCandidates.find((entry) => entry.start >= now)
    const fallback = scheduleCandidates[0] ?? null
    
    selectedSchedule = upcoming || fallback
  }

  // NEW: Load CountdownPage instead of CountdownTemplate
  let countdownPage = null
  if (webinar.countdownPageId) {
    countdownPage = await prisma.countdownPage.findUnique({
      where: { id: webinar.countdownPageId },
    })
  }

  // Fallback to default countdown page
  if (!countdownPage) {
    countdownPage = await prisma.countdownPage.findFirst({
      where: { isSystem: true, name: 'Default' },
    })
  }

  return {
    webinar,
    schedule: selectedSchedule?.schedule ?? null,
    scheduleDateTime: selectedSchedule?.start ?? now,
    countdownPage,
    registrationId,
  }
}

function processCountdownPage(
  html: string,
  data: Awaited<ReturnType<typeof getCountdownData>>,
  timezoneOverride?: string
) {
  if (!data?.webinar || !data?.countdownPage) {
    return html
  }

  const { webinar, schedule, scheduleDateTime, countdownPage } = data

  // Handle timezone properly - never use invalid values
  let timezone = 'UTC'
  
  if (timezoneOverride && timezoneOverride !== 'USER_TIMEZONE') {
    timezone = timezoneOverride
  } else if (schedule?.useUserTimezone || schedule?.timezone === 'USER_TIMEZONE') {
    // Use browser's timezone when user timezone is requested
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } else if (schedule?.timezone && schedule.timezone !== 'USER_TIMEZONE') {
    timezone = schedule.timezone
  } else {
    // Fallback to browser's timezone or UTC
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  }

  let processed = html

  processed = processed.replace(/\{\{webinarTitle\}\}/g, webinar.title || '')
  processed = processed.replace(
    /\{\{webinarDescription\}\}/g,
    webinar.description || ''
  )
  processed = processed.replace(
    /\{\{webinarDuration\}\}/g,
    String(webinar.duration || 60)
  )
  processed = processed.replace(
    /\{\{hostName\}\}/g,
    webinar.host?.name || 'Host'
  )
  processed = processed.replace(
    /\{\{hostEmail\}\}/g,
    webinar.host?.email || ''
  )

  // Format dates with proper error handling
  let formattedDate = ''
  let formattedTime = ''
  let formattedDateTime = ''
  
  try {
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone,
    }

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone,
      timeZoneName: 'short',
    }

    formattedDate = scheduleDateTime.toLocaleDateString('en-US', dateOptions)
    formattedTime = scheduleDateTime.toLocaleTimeString('en-US', timeOptions)
    formattedDateTime = `${formattedDate} at ${formattedTime}`
  } catch (error) {
    console.error('Date formatting error:', error)
    // Fallback to ISO format
    formattedDate = scheduleDateTime.toISOString().split('T')[0]
    formattedTime = scheduleDateTime.toISOString().split('T')[1].substring(0, 5)
    formattedDateTime = `${formattedDate} at ${formattedTime} UTC`
  }

  processed = processed.replace(/\{\{webinarDate\}\}/g, formattedDate)
  processed = processed.replace(/\{\{webinarTime\}\}/g, formattedTime)
  processed = processed.replace(/\{\{webinarDateTime\}\}/g, formattedDateTime)
  processed = processed.replace(
    /\{\{timeZone\}\}/g,
    timezone.replace(/_/g, ' ')
  )

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004'

  // Build joinLink with registration and schedule parameters
  const joinLinkParams = new URLSearchParams()
  if (data.registrationId) {
    joinLinkParams.set('r', data.registrationId)
  }
  if (schedule?.id) {
    joinLinkParams.set('s', schedule.id)
  }
  const joinLink = `${baseUrl}/room/${webinar.slug}${joinLinkParams.toString() ? '?' + joinLinkParams.toString() : ''}`
  const registrationLink = `${baseUrl}/w/${webinar.slug}`

  processed = processed.replace(/\{\{joinLink\}\}/g, joinLink)
  processed = processed.replace(/\{\{registrationLink\}\}/g, registrationLink)
  
  // Process countdown page specific variables
  processed = processed.replace(/\{\{webinarStartDateTime\}\}/g, scheduleDateTime.toISOString())
  processed = processed.replace(/\{\{organizationName\}\}/g, countdownPage.organizationName || 'Your Organization')
  processed = processed.replace(/\{\{contactEmail\}\}/g, countdownPage.contactEmail || webinar.host?.email || 'contact@example.com')
  processed = processed.replace(/\{\{websiteUrl\}\}/g, countdownPage.websiteUrl || baseUrl)
  processed = processed.replace(/\{\{currentYear\}\}/g, new Date().getFullYear().toString())
  processed = processed.replace(/\{\{primaryColor\}\}/g, countdownPage.primaryColor || '#6366f1')
  processed = processed.replace(/\{\{accentColor\}\}/g, countdownPage.accentColor || '#8b5cf6')
  
  // Process video settings
  processed = processed.replace(/\{\{videoUrl\}\}/g, countdownPage.videoUrl || '')
  processed = processed.replace(/\{\{videoPlaceholder\}\}/g, countdownPage.videoPlaceholder || 'Watch this important message')
  
  // Process bonus settings
  processed = processed.replace(/\{\{bonusTitle\}\}/g, countdownPage.bonusTitle || '')
  processed = processed.replace(/\{\{bonusDescription\}\}/g, countdownPage.bonusDescription || '')
  processed = processed.replace(/\{\{bonusImage\}\}/g, countdownPage.bonusImage || '')
  processed = processed.replace(/\{\{bonusValue\}\}/g, countdownPage.bonusValue || '')
  processed = processed.replace(/\{\{bonusBadge\}\}/g, countdownPage.bonusBadge || 'FREE')
  
  // Handle conditional rendering with basic string replacement
  if (countdownPage.showVideo) {
    processed = processed.replace(/\{\{#if showVideo\}\}/g, '')
    processed = processed.replace(/\{\{\/if\}\}/g, '')
  } else {
    processed = processed.replace(/\{\{#if showVideo\}\}[\s\S]*?\{\{\/if\}\}/g, '')
  }
  
  if (countdownPage.showBonus) {
    processed = processed.replace(/\{\{#if showBonus\}\}/g, '')
  } else {
    processed = processed.replace(/\{\{#if showBonus\}\}[\s\S]*?\{\{\/if\}\}/g, '')
  }
  
  if (countdownPage.showReminder) {
    processed = processed.replace(/\{\{#if showReminder\}\}/g, '')
  } else {
    processed = processed.replace(/\{\{#if showReminder\}\}[\s\S]*?\{\{\/if\}\}/g, '')
  }
  
  if (countdownPage.showWhatsApp) {
    processed = processed.replace(/\{\{#if showWhatsApp\}\}/g, '')
  } else {
    processed = processed.replace(/\{\{#if showWhatsApp\}\}[\s\S]*?\{\{\/if\}\}/g, '')
  }
  
  if (countdownPage.showFacebook) {
    processed = processed.replace(/\{\{#if showFacebook\}\}/g, '')
  } else {
    processed = processed.replace(/\{\{#if showFacebook\}\}[\s\S]*?\{\{\/if\}\}/g, '')
  }
  
  // Clean up any remaining conditional markers
  processed = processed.replace(/\{\{\/if\}\}/g, '')

  const countdownScript = `
    const targetTime = new Date('${scheduleDateTime.toISOString()}').getTime();
    const joinUrl = '${joinLink}';
    let hasRedirected = false;

    function updateCountdown() {
      const now = new Date().getTime();
      const distance = targetTime - now;

      if (distance <= 0) {
        const el = document.getElementById('countdown');
        if (el) {
          el.innerHTML = 'Webinar is Live! Redirecting...';
        }
        
        // Auto-redirect to webinar room after 2 seconds
        if (!hasRedirected) {
          hasRedirected = true;
          setTimeout(function() {
            window.location.href = joinUrl;
          }, 2000);
        }
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      let text = '';
      if (days > 0) text += days + 'd ';
      text += hours.toString().padStart(2, '0') + 'h ';
      text += minutes.toString().padStart(2, '0') + 'm ';
      text += seconds.toString().padStart(2, '0') + 's';

      const el = document.getElementById('countdown');
      if (el) {
        el.innerHTML = text;
      }
      
      // Update countdown in individual elements if they exist (for custom templates)
      const daysEl = document.getElementById('days');
      const hoursEl = document.getElementById('hours');
      const minutesEl = document.getElementById('minutes');
      const secondsEl = document.getElementById('seconds');
      
      if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
      if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
      if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
      if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  `

  processed = processed.replace(/\{\{countdown\}\}/g, countdownScript)
  processed = processed.replace(/\{\{countdownIso\}\}/g, scheduleDateTime.toISOString())

  return processed
}

export default async function CountdownPage({ params, searchParams }: PageProps) {
  const data = await getCountdownData(params.slug, searchParams.r || null, searchParams.s || null)

  if (!data || !data.webinar) {
    notFound()
  }

  if (!data.countdownPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Countdown Page Missing</h1>
          <p className="text-gray-600">No countdown page configured. Please contact the administrator.</p>
        </div>
      </div>
    )
  }

  const processedHtml = processCountdownPage(
    data.countdownPage.htmlCode,
    data,
    searchParams.tz
  )

  return <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
}

export async function generateMetadata({ params }: PageProps) {
  const webinar = await prisma.webinar.findUnique({
    where: { slug: params.slug },
    select: { title: true },
  })

  if (!webinar) {
    return {
      title: 'Countdown',
    }
  }

  return {
    title: `Countdown - ${webinar.title}`,
    description: `The countdown page for ${webinar.title}`,
  }
}
