import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { calculateScheduleDateTime } from '@/lib/webinarSchedule'
import { buildReferralLink } from '@/lib/referral'
import { TemplateRenderer } from '@/components/TemplateRenderer'

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
        referralCode: true, // NEW: Get referral code for sharing
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
  
  // Webinar information - Support both old and new format
  processed = processed.replace(/\{\{webinarTitle\}\}/g, webinar.title || '')
  processed = processed.replace(/\{\{webinar\.title\}\}/g, webinar.title || '')
  processed = processed.replace(/\{\{webinarDescription\}\}/g, webinar.description || '')
  processed = processed.replace(/\{\{webinar\.description\}\}/g, webinar.description || '')
  processed = processed.replace(/\{\{webinarDuration\}\}/g, String(webinar.duration || 60))
  processed = processed.replace(/\{\{webinar\.duration\}\}/g, String(webinar.duration || 60))
  processed = processed.replace(/\{\{webinar\.slug\}\}/g, webinar.slug || '')
  
  // Host information - Support both old and new format
  processed = processed.replace(/\{\{hostName\}\}/g, webinar.host.name || 'Host')
  processed = processed.replace(/\{\{host\.name\}\}/g, webinar.host.name || 'Host')
  processed = processed.replace(/\{\{hostEmail\}\}/g, webinar.host.email || '')
  processed = processed.replace(/\{\{host\.email\}\}/g, webinar.host.email || '')
  
  // Registration information - Support both old and new format
  processed = processed.replace(/\{\{attendeeName\}\}/g, registration?.name || 'Attendee')
  processed = processed.replace(/\{\{attendee\.name\}\}/g, registration?.name || 'Attendee')
  processed = processed.replace(/\{\{attendeeEmail\}\}/g, registration?.email || '')
  processed = processed.replace(/\{\{attendee\.email\}\}/g, registration?.email || '')
  processed = processed.replace(/\{\{registrationId\}\}/g, registration?.id || '')
  processed = processed.replace(/\{\{registration\.id\}\}/g, registration?.id || '')
  
  // Referral System - NEW
  const referralCode = registration?.referralCode || ''
  const referralLink = referralCode ? buildReferralLink(webinar.slug || '', referralCode) : ''
  
  // Helper function to escape strings for safe insertion into JavaScript string literals
  // This is used when the URL will be INSIDE quotes in the template
  const escapeForJsString = (str: string) => {
    // For URLs, we don't want to escape slashes or colons
    // Only escape quotes and special control characters
    return str
      .replace(/"/g, '\\"')      // Escape double quotes
      .replace(/'/g, "\\'")      // Escape single quotes  
      .replace(/\n/g, '\\n')     // Escape newlines
      .replace(/\r/g, '\\r')     // Escape carriage returns
  }
  
  // For referral links in templates, they're used in string concatenations like:
  // const url = "text" + "{{referralLink}}"
  // So we only need to escape quotes and special chars, not HTML entities
  const safeReferralLink = escapeForJsString(referralLink)
  
  console.log('🔗 [Thank You] Referral link replacement:', {
    referralCode,
    referralLink,
    safeReferralLink,
    hasReferralLinkPlaceholder: html.includes('{{referralLink}}'),
  })
  
  processed = processed.replace(/\{\{referralCode\}\}/g, referralCode)
  processed = processed.replace(/\{\{referralLink\}\}/g, safeReferralLink)
  
  // WhatsApp referral share link
  const whatsappReferralMessage = referralLink 
    ? `I just registered for '${webinar.title}'! Join me: ${referralLink}`
    : ''
  const whatsappLink = whatsappReferralMessage 
    ? `https://wa.me/?text=${encodeURIComponent(whatsappReferralMessage)}` 
    : ''
  const safeWhatsappLink = escapeForJsString(whatsappLink)
  
  processed = processed.replace(/\{\{whatsappReferralLink\}\}/g, safeWhatsappLink)
  
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
  const scheduleISO = scheduleDateTime.toISOString()
  
  // Replace webinar title
  processed = processed.replace(/\{\{webinarTitle\}\}/g, webinar.title)
  processed = processed.replace(/\{\{webinar\.title\}\}/g, webinar.title)
  
  // Support both old and new format
  processed = processed.replace(/\{\{webinarDate\}\}/g, formattedDate)
  processed = processed.replace(/\{\{schedule\.date\}\}/g, formattedDate)
  processed = processed.replace(/\{\{webinarTime\}\}/g, formattedTime)
  processed = processed.replace(/\{\{schedule\.time\}\}/g, formattedTime)
  processed = processed.replace(/\{\{webinarDateTime\}\}/g, formattedDateTime)
  processed = processed.replace(/\{\{schedule\.dateTime\}\}/g, formattedDateTime)
  processed = processed.replace(/\{\{schedule\.dateISO\}\}/g, scheduleISO)
  processed = processed.replace(/\{\{timeZone\}\}/g, timezone.replace(/_/g, ' '))
  
  // Generate calendar links
  const calendarTitle = encodeURIComponent(webinar.title)
  const calendarDetails = encodeURIComponent(webinar.description || '')
  const calendarLocation = encodeURIComponent('Online Webinar')
  const startDate = scheduleDateTime.toISOString().replace(/-|:|\.\d\d\d/g, '')
  const endDateTime = new Date(scheduleDateTime.getTime() + webinar.duration * 60000)
  const endDate = endDateTime.toISOString().replace(/-|:|\.\d\d\d/g, '')
  
  // Google Calendar link
  const googleCalendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calendarTitle}&details=${calendarDetails}&location=${calendarLocation}&dates=${startDate}/${endDate}`
  const safeGoogleCalendarLink = escapeForJsString(googleCalendarLink)
  processed = processed.replace(/\{\{calendarLink\}\}/g, safeGoogleCalendarLink)
  processed = processed.replace(/\{\{googleCalendarLink\}\}/g, safeGoogleCalendarLink)
  
  // Apple Calendar (.ics) link
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Webinar Platform//EN',
    'BEGIN:VEVENT',
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${webinar.title}`,
    `DESCRIPTION:${webinar.description || ''}`,
    'LOCATION:Online Webinar',
    `UID:${registration?.id || 'webinar'}@webinar-platform.com`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')
  const icsDataUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`
  const safeIcsDataUrl = escapeForJsString(icsDataUrl)
  processed = processed.replace(/\{\{appleCalendarLink\}\}/g, safeIcsDataUrl)
  processed = processed.replace(/\{\{icsCalendarLink\}\}/g, safeIcsDataUrl)

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
  const safeCountdownLink = escapeForJsString(countdownLink)
  const safeRoomLink = escapeForJsString(roomLink)
  
  // Generate full registration URL for sharing
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const registrationUrl = `${baseUrl}/w/${webinar.slug}`
  const safeRegistrationUrl = escapeForJsString(registrationUrl)

  processed = processed.replace(/\{\{joinLink\}\}/g, safeCountdownLink)
  processed = processed.replace(/\{\{countdownLink\}\}/g, safeCountdownLink)
  processed = processed.replace(/\{\{roomLink\}\}/g, safeRoomLink)
  processed = processed.replace(/\{\{broadcast\.url\}\}/g, safeRoomLink)
  processed = processed.replace(/\{\{webinar\.registrationUrl\}\}/g, safeRegistrationUrl)
  
  // ICS download link
  const icsLink = `/api/calendar/${webinar.slug}?r=${registration?.id || ''}&s=${schedule?.id || ''}`
  const safeIcsLink = escapeForJsString(icsLink)
  processed = processed.replace(/\{\{icsDownload\}\}/g, safeIcsLink)
  
  // Social Share Messages
  // Use referral link if available, otherwise use countdown link
  const shareLink = referralLink || countdownLink
  const defaultWhatsAppMessage = `I just registered for '${webinar.title}' happening on ${formattedDate} at ${formattedTime} (${timezone.replace(/_/g, ' ')}). Join me: ${shareLink}`
  const whatsappMessage = webinar.whatsappShareMessage || defaultWhatsAppMessage
  const safeWhatsappMessage = escapeForJsString(whatsappMessage)
  processed = processed.replace(/\{\{whatsappShareMessage\}\}/g, safeWhatsappMessage)
  
  const defaultFacebookMessage = `Check out this webinar: ${webinar.title}`
  const facebookMessage = webinar.facebookShareMessage || defaultFacebookMessage
  const safeFacebookMessage = escapeForJsString(facebookMessage)
  processed = processed.replace(/\{\{facebookShareMessage\}\}/g, safeFacebookMessage)
  
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
  
  // Use TemplateRenderer to execute scripts (same as countdown page)
  return <TemplateRenderer html={processedHtml} />
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
