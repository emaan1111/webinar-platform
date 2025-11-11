import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { calculateScheduleDateTime } from '@/lib/webinarSchedule'

interface PageProps {
  params: { slug: string }
  searchParams: { r?: string; s?: string }
}

async function getThankYouData(slug: string, registrationId?: string, scheduleId?: string) {
  // Get webinar by slug
  const webinar = await prisma.webinar.findUnique({
    where: { slug },
    include: {
      host: { select: { name: true, email: true } },
      schedules: true
    }
  })

  if (!webinar) {
    return null
  }

  // Get registration if ID provided
  let registration = null
  if (registrationId) {
    registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      select: {
        id: true,
        name: true,
        email: true,
        scheduleId: true,
        registeredAt: true,
        timezone: true,
        scheduledStartTime: true, // NEW: Get the stored start time
      }
    })
  }

  // Get the schedule
  let schedule = null
  const sid = registration?.scheduleId || scheduleId
  if (sid) {
    schedule = await prisma.webinarSchedule.findUnique({
      where: { id: sid }
    })
  }

  // Get thank you template
  let template = null
  if (webinar.thankYouTemplateId) {
    template = await prisma.thankYouTemplate.findUnique({
      where: { id: webinar.thankYouTemplateId }
    })
  }

  // If no template assigned, use default
  if (!template) {
    template = await prisma.thankYouTemplate.findFirst({
      where: { isSystem: true, name: 'Default' }
    })
  }

  return {
    webinar,
    registration,
    schedule,
    template
  }
}

function processTemplate(html: string, data: any) {
  let processed = html
  const { webinar, registration, schedule } = data
  
  // Calculate schedule date/time
  // Use stored scheduledStartTime if available (for all schedule types)
  let scheduleDateTime: Date
  if (registration?.scheduledStartTime) {
    scheduleDateTime = new Date(registration.scheduledStartTime)
    console.log('✅ [Thank You] Using stored scheduledStartTime:', scheduleDateTime.toISOString())
  } else {
    // Fallback to calculation (for old registrations)
    scheduleDateTime = schedule ? calculateScheduleDateTime(schedule, registration) : new Date()
    console.log('⚠️ [Thank You] Fallback - calculating scheduledTime:', scheduleDateTime.toISOString())
  }
  const timezone = registration?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  
  // Webinar information
  processed = processed.replace(/\{\{webinarTitle\}\}/g, webinar.title || '')
  processed = processed.replace(/\{\{webinarDescription\}\}/g, webinar.description || '')
  processed = processed.replace(/\{\{webinarDuration\}\}/g, String(webinar.duration || 60))
  
  // Host information
  processed = processed.replace(/\{\{hostName\}\}/g, webinar.host.name || 'Host')
  processed = processed.replace(/\{\{hostEmail\}\}/g, webinar.host.email || '')
  
  // Registration information
  processed = processed.replace(/\{\{attendeeName\}\}/g, registration?.name || 'Attendee')
  processed = processed.replace(/\{\{attendeeEmail\}\}/g, registration?.email || '')
  processed = processed.replace(/\{\{registrationId\}\}/g, registration?.id || '')
  
  // Schedule information
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timezone
  }
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
    timeZoneName: 'short'
  }
  
  const formattedDate = scheduleDateTime.toLocaleDateString('en-US', dateOptions)
  const formattedTime = scheduleDateTime.toLocaleTimeString('en-US', timeOptions)
  const formattedDateTime = `${formattedDate} at ${formattedTime}`
  
  processed = processed.replace(/\{\{webinarDate\}\}/g, formattedDate)
  processed = processed.replace(/\{\{webinarTime\}\}/g, formattedTime)
  processed = processed.replace(/\{\{webinarDateTime\}\}/g, formattedDateTime)
  processed = processed.replace(/\{\{timeZone\}\}/g, timezone.replace(/_/g, ' '))
  
  // Generate calendar link (Google Calendar)
  const calendarTitle = encodeURIComponent(webinar.title)
  const calendarDetails = encodeURIComponent(webinar.description || '')
  const calendarLocation = encodeURIComponent('Online Webinar')
  const startDate = scheduleDateTime.toISOString().replace(/-|:|\.\d\d\d/g, '')
  const endDateTime = new Date(scheduleDateTime.getTime() + webinar.duration * 60000)
  const endDate = endDateTime.toISOString().replace(/-|:|\.\d\d\d/g, '')
  
  const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calendarTitle}&details=${calendarDetails}&location=${calendarLocation}&dates=${startDate}/${endDate}`
  processed = processed.replace(/\{\{calendarLink\}\}/g, calendarLink)

  // Use relative URLs so they work on any port during development
  const roomLink = `/room/${webinar.slug}${registration ? `?r=${registration.id}` : ''}`
  const countdownParams = new URLSearchParams()
  if (registration?.id) {
    countdownParams.set('r', registration.id)
  }
  if (schedule?.id) {
    countdownParams.set('s', schedule.id)
  }
  const countdownLink = `/countdown/${webinar.slug}${countdownParams.size > 0 ? `?${countdownParams.toString()}` : ''}`

  processed = processed.replace(/\{\{joinLink\}\}/g, countdownLink)
  processed = processed.replace(/\{\{countdownLink\}\}/g, countdownLink)
  processed = processed.replace(/\{\{roomLink\}\}/g, roomLink)
  
  // ICS download link
  const icsLink = `/api/calendar/${webinar.slug}?r=${registration?.id || ''}&s=${schedule?.id || ''}`
  processed = processed.replace(/\{\{icsDownload\}\}/g, icsLink)
  
  // Generate countdown timer script
  const countdownScript = `
    const targetTime = new Date('${scheduleDateTime.toISOString()}').getTime();
    
    function updateCountdown() {
      const now = new Date().getTime();
      const distance = targetTime - now;
      
      if (distance < 0) {
        document.getElementById('countdown').innerHTML = 'Webinar has started!';
        return;
      }
      
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      let countdown = '';
      if (days > 0) countdown += days + 'd ';
      countdown += hours + 'h ' + minutes + 'm ' + seconds + 's';
      
      document.getElementById('countdown').innerHTML = countdown;
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
  `
  processed = processed.replace(/\{\{countdown\}\}/g, countdownScript)
  
  return processed
}

export default async function ThankYouPage({ params, searchParams }: PageProps) {
  const data = await getThankYouData(params.slug, searchParams.r, searchParams.s)
  
  if (!data || !data.webinar) {
    notFound()
  }
  
  if (!data.template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You for Registering!</h1>
          <p className="text-gray-600">No template configured. Please contact the administrator.</p>
        </div>
      </div>
    )
  }
  
  // Process template with dynamic data
  const processedHtml = processTemplate(data.template.htmlCode, data)
  
  // Return the processed HTML
  return <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  const data = await getThankYouData(params.slug, searchParams.r, searchParams.s)
  
  if (!data || !data.webinar) {
    return {
      title: 'Thank You'
    }
  }
  
  return {
    title: `Thank You - ${data.webinar.title}`,
    description: `You're registered for ${data.webinar.title}`
  }
}
