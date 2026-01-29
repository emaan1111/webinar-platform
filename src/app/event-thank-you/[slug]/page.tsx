import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TemplateRenderer } from '@/components/TemplateRenderer'

interface PageProps {
  params: { slug: string }
  searchParams: { r?: string; s?: string }
}

async function getEventThankYouData(slug: string, registrationId?: string, scheduleId?: string) {
  // Get event by slug
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      host: { select: { name: true, email: true } },
      schedules: true,
      thankYouTemplate: true,
      bundledWebinar: {
        select: { id: true, title: true, slug: true, duration: true, description: true }
      }
    }
  })

  if (!event) {
    return null
  }

  // Get registration if ID provided
  let registration = null
  let webinarRegistration = null
  
  if (registrationId) {
    registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: {
        eventSchedule: true
      }
    })
    
    // If there's a webinar registration linked, get it with schedule info
    if (registration?.webinarRegistrationId) {
      webinarRegistration = await prisma.registration.findUnique({
        where: { id: registration.webinarRegistrationId },
        include: {
          webinar: { select: { id: true, title: true, slug: true, duration: true } }
        }
      })
      
      // If webinar registration has a scheduleId but no scheduledStartTime, get the schedule
      if (webinarRegistration && webinarRegistration.scheduleId && !webinarRegistration.scheduledStartTime) {
        const webinarSchedule = await prisma.webinarSchedule.findUnique({
          where: { id: webinarRegistration.scheduleId }
        })
        if (webinarSchedule?.scheduledAt) {
          // Add the scheduled time to the webinarRegistration object
          ;(webinarRegistration as any).scheduledStartTime = webinarSchedule.scheduledAt
        }
      }
    }
  }

  // Get the schedule
  let schedule = null
  const sid = registration?.eventScheduleId || scheduleId
  if (sid) {
    schedule = await prisma.eventSchedule.findUnique({
      where: { id: sid }
    })
  }

  // Get thank you template
  let template = event.thankYouTemplate
  
  // If no template assigned, try to get the event template
  if (!template) {
    template = await prisma.thankYouTemplate.findFirst({
      where: { name: 'Event Two-Part Registration' }
    })
  }
  
  // Fall back to default
  if (!template) {
    template = await prisma.thankYouTemplate.findFirst({
      where: { isSystem: true }
    })
  }

  return {
    event,
    registration,
    webinarRegistration,
    schedule,
    template
  }
}

function processEventTemplate(html: string, data: any) {
  let processed = html
  const { event, registration, schedule, webinarRegistration } = data
  
  // Get timezone
  const timezone = registration?.timezone || schedule?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  
  // Friendly timezone name
  const getTimezoneFriendlyName = (tz: string) => {
    const tzNames: Record<string, string> = {
      'America/New_York': 'Eastern Time',
      'America/Chicago': 'Central Time', 
      'America/Denver': 'Mountain Time',
      'America/Los_Angeles': 'Pacific Time',
      'Europe/London': 'UK Time',
      'Asia/Kolkata': 'India Time',
      'Asia/Dubai': 'Gulf Time',
      'Australia/Sydney': 'Sydney Time',
    }
    return tzNames[tz] || tz.replace(/_/g, ' ').split('/').pop() || tz
  }
  const friendlyTimezone = getTimezoneFriendlyName(timezone)
  
  // Calculate event schedule date/time
  const scheduleDateTime = schedule?.startTime ? new Date(schedule.startTime) : new Date()
  
  // Helper function to escape strings for safe insertion into JavaScript string literals
  const escapeForJsString = (str: string) => {
    return str
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
  }
  
  // Date/time formatting options - USER FRIENDLY
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
    timeZone: timezone
  }
  
  const formattedDate = scheduleDateTime.toLocaleDateString('en-US', dateOptions)
  const formattedTime = `${scheduleDateTime.toLocaleTimeString('en-US', timeOptions)} (${friendlyTimezone})`
  const formattedDateTime = `${formattedDate} at ${formattedTime}`
  const scheduleISO = scheduleDateTime.toISOString()
  
  // ===== HANDLE CONDITIONAL BLOCKS =====
  // User has webinar time if they registered for a webinar AND have a scheduled time
  const hasWebinarTime = !!webinarRegistration && !!webinarRegistration.scheduledStartTime
  
  // Process {{#if hasWebinarTime}} ... {{/if}} blocks
  if (hasWebinarTime) {
    processed = processed.replace(/\{\{#if hasWebinarTime\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1')
    processed = processed.replace(/\{\{#unless hasWebinarTime\}\}[\s\S]*?\{\{\/unless\}\}/g, '')
  } else {
    processed = processed.replace(/\{\{#if hasWebinarTime\}\}[\s\S]*?\{\{\/if\}\}/g, '')
    processed = processed.replace(/\{\{#unless hasWebinarTime\}\}([\s\S]*?)\{\{\/unless\}\}/g, '$1')
  }
  
  // ===== EVENT SPECIFIC PLACEHOLDERS =====
  processed = processed.replace(/\{\{eventTitle\}\}/g, event.title || '')
  processed = processed.replace(/\{\{event\.title\}\}/g, event.title || '')
  processed = processed.replace(/\{\{eventDescription\}\}/g, event.description || '')
  processed = processed.replace(/\{\{event\.description\}\}/g, event.description || '')
  processed = processed.replace(/\{\{event\.slug\}\}/g, event.slug || '')
  
  // Event time placeholders
  processed = processed.replace(/\{\{eventDate\}\}/g, formattedDate)
  processed = processed.replace(/\{\{event\.date\}\}/g, formattedDate)
  processed = processed.replace(/\{\{eventTime\}\}/g, formattedTime)
  processed = processed.replace(/\{\{event\.time\}\}/g, formattedTime)
  processed = processed.replace(/\{\{eventDateTime\}\}/g, formattedDateTime)
  processed = processed.replace(/\{\{event\.dateTime\}\}/g, formattedDateTime)
  processed = processed.replace(/\{\{event\.dateISO\}\}/g, scheduleISO)
  
  // Event Zoom link placeholders
  const eventZoomLink = schedule?.zoomLink || event.zoomLink || ''
  const safeEventZoomLink = escapeForJsString(eventZoomLink)
  processed = processed.replace(/\{\{eventZoomLink\}\}/g, safeEventZoomLink)
  processed = processed.replace(/\{\{event\.zoomLink\}\}/g, safeEventZoomLink)
  processed = processed.replace(/\{\{zoomLink\}\}/g, safeEventZoomLink)
  
  // Zoom meeting ID and password
  const zoomMeetingId = schedule?.zoomMeetingId || event.zoomMeetingId || ''
  const zoomPassword = schedule?.zoomPassword || event.zoomPassword || ''
  processed = processed.replace(/\{\{zoomMeetingId\}\}/g, zoomMeetingId)
  processed = processed.replace(/\{\{zoomPassword\}\}/g, zoomPassword)
  
  // Host information
  processed = processed.replace(/\{\{hostName\}\}/g, event.host?.name || 'Host')
  processed = processed.replace(/\{\{host\.name\}\}/g, event.host?.name || 'Host')
  processed = processed.replace(/\{\{hostEmail\}\}/g, event.host?.email || '')
  
  // Registration/Attendee information
  processed = processed.replace(/\{\{attendeeName\}\}/g, registration?.name || 'Attendee')
  processed = processed.replace(/\{\{attendee\.name\}\}/g, registration?.name || 'Attendee')
  processed = processed.replace(/\{\{attendeeEmail\}\}/g, registration?.email || '')
  processed = processed.replace(/\{\{registrationId\}\}/g, registration?.id || '')
  
  // Student information
  processed = processed.replace(/\{\{studentName\}\}/g, registration?.studentName || '')
  processed = processed.replace(/\{\{studentAge\}\}/g, registration?.studentAge?.toString() || '')
  
  // Timezone
  processed = processed.replace(/\{\{timeZone\}\}/g, friendlyTimezone)
  processed = processed.replace(/\{\{timezone\}\}/g, friendlyTimezone)
  
  // ===== EVENT CALENDAR LINKS =====
  const calendarTitle = encodeURIComponent(event.title || '')
  const calendarDetails = encodeURIComponent(event.description || '')
  const calendarLocation = encodeURIComponent(eventZoomLink || 'Online Event')
  const startDate = scheduleDateTime.toISOString().replace(/-|:|\.\d\d\d/g, '')
  
  const endDateTime = schedule?.endTime 
    ? new Date(schedule.endTime) 
    : new Date(scheduleDateTime.getTime() + 60 * 60000)
  const endDate = endDateTime.toISOString().replace(/-|:|\.\d\d\d/g, '')
  
  const googleCalendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calendarTitle}&details=${calendarDetails}&location=${calendarLocation}&dates=${startDate}/${endDate}`
  processed = processed.replace(/\{\{calendarLink\}\}/g, escapeForJsString(googleCalendarLink))
  processed = processed.replace(/\{\{googleCalendarLink\}\}/g, escapeForJsString(googleCalendarLink))
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Event Platform//EN',
    'BEGIN:VEVENT',
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description || ''}`,
    `LOCATION:${eventZoomLink || 'Online Event'}`,
    `UID:${registration?.id || 'event'}@event-platform.com`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\\r\\n')
  const icsDataUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`
  processed = processed.replace(/\{\{appleCalendarLink\}\}/g, escapeForJsString(icsDataUrl))
  processed = processed.replace(/\{\{icsCalendarLink\}\}/g, escapeForJsString(icsDataUrl))
  
  // ===== BUNDLED WEBINAR PLACEHOLDERS =====
  const bundledWebinar = event.bundledWebinar
  processed = processed.replace(/\{\{bundledWebinarTitle\}\}/g, bundledWebinar?.title || '')
  processed = processed.replace(/\{\{bundledWebinar\.title\}\}/g, bundledWebinar?.title || '')
  processed = processed.replace(/\{\{bundledWebinar\.description\}\}/g, bundledWebinar?.description || '')
  
  // Webinar registration link (for when user skipped webinar selection)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const webinarRegistrationLink = bundledWebinar?.slug ? `${baseUrl}/w/${bundledWebinar.slug}` : ''
  processed = processed.replace(/\{\{webinarRegistrationLink\}\}/g, escapeForJsString(webinarRegistrationLink))
  
  // If user selected webinar time
  if (hasWebinarTime && webinarRegistration) {
    const webinarDateTime = new Date(webinarRegistration.scheduledStartTime!)
    
    const webinarFormattedDate = webinarDateTime.toLocaleDateString('en-US', dateOptions)
    const webinarFormattedTime = `${webinarDateTime.toLocaleTimeString('en-US', timeOptions)} (${friendlyTimezone})`
    
    processed = processed.replace(/\{\{webinarDate\}\}/g, webinarFormattedDate)
    processed = processed.replace(/\{\{webinarTime\}\}/g, webinarFormattedTime)
    processed = processed.replace(/\{\{webinarDateTime\}\}/g, `${webinarFormattedDate} at ${webinarFormattedTime}`)
    
    // Webinar room link
    const webinarSlug = webinarRegistration.webinar?.slug || bundledWebinar?.slug || ''
    const webinarRoomLink = `${baseUrl}/countdown/${webinarSlug}?r=${webinarRegistration.id}`
    processed = processed.replace(/\{\{webinarRoomLink\}\}/g, escapeForJsString(webinarRoomLink))
    processed = processed.replace(/\{\{webinarLink\}\}/g, escapeForJsString(webinarRoomLink))
    
    // Webinar calendar links
    const webinarDuration = webinarRegistration.webinar?.duration || bundledWebinar?.duration || 60
    const webinarStartDate = webinarDateTime.toISOString().replace(/-|:|\.\d\d\d/g, '')
    const webinarEndDateTime = new Date(webinarDateTime.getTime() + webinarDuration * 60000)
    const webinarEndDate = webinarEndDateTime.toISOString().replace(/-|:|\.\d\d\d/g, '')
    
    const webinarTitle = webinarRegistration.webinar?.title || bundledWebinar?.title || 'Webinar'
    const webinarGoogleCal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(webinarTitle)}&details=${encodeURIComponent('Bonus Webinar')}&dates=${webinarStartDate}/${webinarEndDate}`
    processed = processed.replace(/\{\{webinarGoogleCalendarLink\}\}/g, escapeForJsString(webinarGoogleCal))
    processed = processed.replace(/\{\{webinarGoogleCal\}\}/g, escapeForJsString(webinarGoogleCal))
    
    const webinarIcsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${webinarStartDate}`,
      `DTEND:${webinarEndDate}`,
      `SUMMARY:${webinarTitle}`,
      `UID:${webinarRegistration.id}@webinar-platform.com`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\\r\\n')
    const webinarIcsUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(webinarIcsContent)}`
    processed = processed.replace(/\{\{webinarAppleCalendarLink\}\}/g, escapeForJsString(webinarIcsUrl))
    processed = processed.replace(/\{\{webinarICS\}\}/g, escapeForJsString(webinarIcsUrl))
  }
  
  // ===== SOCIAL SHARING =====
  const eventRegistrationLink = event.registrationPageUrl || `${baseUrl}/event/${event.slug}`
  processed = processed.replace(/\{\{eventRegistrationLink\}\}/g, escapeForJsString(eventRegistrationLink))
  
  const shareMessage = `I just registered for ${event.title}! Join me:`
  
  // Calculate referral link
  let referralLink = eventRegistrationLink
  const referralCode = webinarRegistration?.referralCode || registration?.referralCode;
  
  if (referralCode) {
    const separator = referralLink.includes('?') ? '&' : '?'
    referralLink = `${referralLink}${separator}ref=${referralCode}`
  }
  // Replace referral link placeholder
  processed = processed.replace(/\{\{referralLink\}\}/g, escapeForJsString(referralLink))

  const whatsappShareLink = `https://wa.me/?text=${encodeURIComponent(shareMessage + ' ' + referralLink)}`
  const facebookShareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`
  
  processed = processed.replace(/\{\{whatsappShareLink\}\}/g, escapeForJsString(whatsappShareLink))
  processed = processed.replace(/\{\{facebookShareLink\}\}/g, escapeForJsString(facebookShareLink))
  
  // Compatibility - map to webinar placeholders
  processed = processed.replace(/\{\{webinarTitle\}\}/g, event.title || '')
  
  return processed
}

export default async function EventThankYouPage({ params, searchParams }: PageProps) {
  const data = await getEventThankYouData(
    params.slug,
    searchParams.r,
    searchParams.s
  )

  if (!data) {
    notFound()
  }

  const { event, registration, webinarRegistration, schedule, template } = data

  // If no template, show default thank you
  if (!template) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're Registered!</h1>
          <p className="text-gray-600 mb-6">Thank you for registering for {event.title}</p>
          
          {schedule && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <div className="text-sm font-medium text-gray-500 mb-1">Event Date & Time</div>
              <div className="font-semibold text-gray-900">
                {new Date(schedule.startTime).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="text-gray-600">
                {new Date(schedule.startTime).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZoneName: 'short'
                })}
              </div>
            </div>
          )}
          
          {(schedule?.zoomLink || event.zoomLink) && (
            <a
              href={schedule?.zoomLink || event.zoomLink || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Join Zoom Meeting
            </a>
          )}
          
          <p className="text-sm text-gray-500 mt-6">
            Check your email for confirmation and details.
          </p>
        </div>
      </div>
    )
  }

  // Process the template with event data
  const processedHtml = processEventTemplate(template.htmlCode, {
    event,
    registration,
    webinarRegistration,
    schedule
  })

  return <TemplateRenderer html={processedHtml} />
}

export async function generateMetadata({ params }: PageProps) {
  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    select: { title: true }
  })

  if (!event) {
    return { title: 'Event Not Found' }
  }

  return {
    title: `Thank You - ${event.title}`,
    description: `Thank you for registering for ${event.title}`
  }
}
