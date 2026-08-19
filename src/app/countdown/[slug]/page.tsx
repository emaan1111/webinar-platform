import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { calculateScheduleDateTime } from '@/lib/webinarSchedule'
import { readBrandingSettings } from '@/lib/brandingSettings'
import { TemplateRenderer } from '@/components/TemplateRenderer'
import { normalizeReferralPlaceholders } from '@/lib/normalizeReferralPlaceholders'

interface PageProps {
  params: { slug: string }
  searchParams: { r?: string; s?: string; tz?: string }
}

async function getCountdownData(slug: string, registrationId?: string | null, scheduleId?: string | null) {
  // Parallel fetch: Webinar, Branding, Registration
  const webinarPromise = prisma.webinar.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      duration: true,
      countdownPageId: true,
      host: { select: { name: true, email: true } },
      // Only fetch the specific schedule if we have an ID, otherwise fetch minimal data
      schedules: scheduleId ? {
        where: { id: scheduleId },
        select: {
          id: true,
          scheduleType: true,
          scheduledAt: true,
          timezone: true,
          useUserTimezone: true,
          minutesFromReg: true,
          recurringPattern: true,
          isActive: true,
          createdAt: true,
          isZoomSession: true,
          zoomLink: true,
        },
      } : {
        take: 1, // Only get first schedule for faster loading
        select: {
          id: true,
          scheduleType: true,
          scheduledAt: true,
          timezone: true,
          useUserTimezone: true,
          minutesFromReg: true,
          recurringPattern: true,
          isActive: true,
          createdAt: true,
          isZoomSession: true,
          zoomLink: true,
        },
        orderBy: {
          createdAt: 'asc'
        }
      },
    },
  });

  const brandingPromise = readBrandingSettings();

  const registrationPromise = registrationId
    ? prisma.registration.findUnique({
        where: { id: registrationId },
        select: {
          id: true,
          scheduleId: true,
          registeredAt: true,
          scheduledStartTime: true,
          referralCode: true,
        },
      })
    : Promise.resolve(null);

  const [webinar, brandingSettings, registration] = await Promise.all([
    webinarPromise,
    brandingPromise,
    registrationPromise
  ]);

  if (!webinar) {
    return null;
  }

  console.log('🔍 [Countdown] Webinar loaded:', {
    slug,
    webinarId: webinar.id,
    title: webinar.title,
    totalSchedules: webinar.schedules.length,
    requestedRegistrationId: registrationId,
    requestedScheduleId: scheduleId,
  })

  // Log registration if found
  if (registration) {
    console.log('🔍 [Countdown] Registration found:', {
      id: registration.id,
      scheduleId: registration.scheduleId,
      registeredAt: registration.registeredAt,
      scheduledStartTime: registration.scheduledStartTime,
      hasStoredStartTime: !!registration.scheduledStartTime,
    })
  } else if (registrationId) {
    console.log('⚠️ [Countdown] Registration ID provided but not found:', registrationId)
  } else {
    console.log('⚠️ [Countdown] No registration ID provided in URL')
  }

  const now = new Date()
  
  // Load CountdownTemplate first (needed for both early return and regular flow)
  // NOTE: Using countdownPageId temporarily until Prisma regenerates with countdownTemplateId
  let countdownTemplate = null
  const templateId = (webinar as any).countdownTemplateId || webinar.countdownPageId
  console.log('📄 [Countdown] Template ID:', { templateId })
  
  if (templateId) {
    countdownTemplate = await prisma.countdownTemplate.findUnique({
      where: { id: templateId },
    })
  }

  // Fallback to default countdown template
  if (!countdownTemplate) {
    countdownTemplate = await prisma.countdownTemplate.findFirst({
      where: { isSystem: true, name: 'Default' },
    })
  }
  
  console.log('📄 [Countdown] Template loaded:', { 
    name: countdownTemplate?.name,
    hasCountdownPlaceholder: countdownTemplate?.htmlCode?.includes('{{countdown}}'),
    hasDaysElement: countdownTemplate?.htmlCode?.includes('id="days"'),
  })
  
  // CRITICAL FIX: If we have a registration with scheduledStartTime, use it directly!
  // This is the most reliable source of truth for when THIS specific attendee's webinar starts
  if (registration?.scheduledStartTime) {
    const scheduledTime = new Date(registration.scheduledStartTime)
    const schedule = registration.scheduleId 
      ? webinar.schedules.find((s) => s.id === registration.scheduleId)
      : webinar.schedules[0] || null
    
    console.log('✅ [Countdown] Using stored scheduledStartTime from registration:', {
      registrationId: registration.id,
      scheduledStartTime: scheduledTime.toISOString(),
      minutesUntilStart: ((scheduledTime.getTime() - now.getTime()) / 1000 / 60).toFixed(2),
      scheduleId: schedule?.id,
      scheduleType: schedule?.scheduleType,
    })

    return {
      webinar,
      schedule: schedule,
      scheduleDateTime: scheduledTime,
      countdownTemplate,
      registrationId,
      registration,
      brandingSettings,
    }
  }
  
  // Priority: 1) Schedule from registration, 2) Explicit scheduleId from URL, 3) Next upcoming
  const targetScheduleId = registration?.scheduleId || scheduleId
  
  const explicitSchedule = targetScheduleId 
    ? webinar.schedules.find((item) => item.id === targetScheduleId)
    : null

  // Debug logging
  console.log('🔍 [Countdown] Schedule lookup:', {
    targetScheduleId,
    explicitScheduleFound: !!explicitSchedule,
    explicitScheduleType: explicitSchedule?.scheduleType,
    explicitScheduleMinutes: explicitSchedule?.minutesFromReg,
    currentTime: now.toISOString(),
    totalSchedules: webinar.schedules.length,
  })
  
  let selectedSchedule
  
  if (explicitSchedule) {
    // Use the registered or explicitly specified schedule
    let scheduledTime: Date
    
    // Calculate time for schedules without stored scheduledStartTime
    scheduledTime = calculateScheduleDateTime(explicitSchedule, registration, now)
    console.log('⚠️ [Countdown] Fallback - calculating scheduledTime:', {
      scheduledTime: scheduledTime.toISOString(),
      minutesUntilStart: ((scheduledTime.getTime() - now.getTime()) / 1000 / 60).toFixed(2),
    })
    
    selectedSchedule = {
      schedule: explicitSchedule,
      start: scheduledTime,
    }
  } else {
    // Find next upcoming schedule
    console.log('⚠️ [Countdown] No explicit schedule found, searching for next upcoming...')
    
    const scheduleCandidates = webinar.schedules.map((schedule) => {
      const calculatedStart = calculateScheduleDateTime(schedule, registration, now)
      console.log('   - Schedule candidate:', {
        scheduleId: schedule.id,
        scheduleType: schedule.scheduleType,
        calculatedStart: calculatedStart.toISOString(),
        isInFuture: calculatedStart >= now,
        minutesAway: ((calculatedStart.getTime() - now.getTime()) / 1000 / 60).toFixed(2),
      })
      return {
        schedule,
        start: calculatedStart,
      }
    })

    scheduleCandidates.sort(
      (a, b) => a.start.getTime() - b.start.getTime()
    )

    const upcoming = scheduleCandidates.find((entry) => entry.start >= now)
    const fallback = scheduleCandidates[0] ?? null
    
    selectedSchedule = upcoming || fallback
    
    console.log('📍 [Countdown] Selected schedule:', {
      found: !!selectedSchedule,
      isUpcoming: !!upcoming,
      isFallback: !upcoming && !!fallback,
      selectedStart: selectedSchedule?.start?.toISOString(),
      minutesUntilStart: selectedSchedule ? ((selectedSchedule.start.getTime() - now.getTime()) / 1000 / 60).toFixed(2) : 'N/A',
    })
  }

  // CRITICAL: If we still don't have a valid schedule, something is wrong
  if (!selectedSchedule) {
    console.error('❌ [Countdown] No valid schedule found!', {
      webinarId: webinar.id,
      webinarSlug: webinar.slug,
      totalSchedules: webinar.schedules.length,
      registrationId: registration?.id,
      scheduleId: scheduleId,
    })
    
    // Return with a far future date so countdown doesn't show 00
    // This is better than showing 00 which is confusing
    const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    
    return {
      webinar,
      schedule: null,
      scheduleDateTime: farFuture,
      countdownTemplate,
      registrationId,
      brandingSettings,
    }
  }

  console.log('✅ [Countdown] Final schedule selected:', {
    scheduleId: selectedSchedule.schedule.id,
    scheduleType: selectedSchedule.schedule.scheduleType,
    startTime: selectedSchedule.start.toISOString(),
    minutesUntilStart: ((selectedSchedule.start.getTime() - now.getTime()) / 1000 / 60).toFixed(2),
  })

  return {
    webinar,
    schedule: selectedSchedule.schedule,
    scheduleDateTime: selectedSchedule.start,
    countdownTemplate,
    registrationId,
    registration,
    brandingSettings,
  }
}

const getGoogleCalendarLink = (webinarDate: Date, title: string, description: string, url: string) => {
  const start = webinarDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
  // Assume 1 hour duration
  const endDate = new Date(webinarDate.getTime() + 60 * 60 * 1000);
  const end = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    details: `${description}\n\nJoin here: ${url}`,
    location: url,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function processCountdownTemplate(
  html: string,
  data: Awaited<ReturnType<typeof getCountdownData>>,
  timezoneOverride?: string
) {
  if (!data?.webinar || !data?.countdownTemplate) {
    return html
  }

  const { webinar, schedule, scheduleDateTime, countdownTemplate } = data
  let processed = normalizeReferralPlaceholders(html)

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

  // Helper function to escape HTML special characters
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  // Helper function to escape strings for JavaScript string literals (inside <script> tags)
  // Used when the value will be inside quotes in the template
  const escapeJsInHtml = (text: string) => {
    return text
      .replace(/\\/g, '\\\\')   // Escape backslashes first
      .replace(/"/g, '\\"')      // Escape double quotes
      .replace(/'/g, "\\'")      // Escape single quotes
      .replace(/\n/g, '\\n')     // Escape newlines
      .replace(/\r/g, '\\r')     // Escape carriage returns
      .replace(/\t/g, '\\t')     // Escape tabs
      // Note: We don't escape < and > for URLs as they're rarely in URLs
      // and the escaping can break URL encoding
  }

  // For title and description, we need to escape for BOTH HTML and JavaScript contexts
  // because they appear in both places in the template
  const safeTitle = escapeJsInHtml(webinar.title || '')
  const safeDescription = escapeJsInHtml(webinar.description || '')
  
  // Support both old and new variable formats
  // Basic attributes
  processed = processed.replace(/\{\{webinarTitle\}\}/g, safeTitle)
  processed = processed.replace(/\{\{webinar\.title\}\}/g, safeTitle)
  processed = processed.replace(/\{\{title\}\}/g, safeTitle) // Support simple {{title}}
  processed = processed.replace(/\{\{webinarDescription\}\}/g, safeDescription)
  processed = processed.replace(/\{\{webinar\.description\}\}/g, safeDescription)
  processed = processed.replace(/\{\{description\}\}/g, safeDescription) // Support simple {{description}}
  processed = processed.replace(
    /\{\{webinarDuration\}\}/g,
    String(webinar.duration || 60)
  )
  processed = processed.replace(
    /\{\{webinar\.duration\}\}/g,
    String(webinar.duration || 60)
  )
  processed = processed.replace(
    /\{\{webinar\.slug\}\}/g,
    webinar.slug || ''
  )
  processed = processed.replace(
    /\{\{hostName\}\}/g,
    webinar.host?.name || 'Host'
  )
  processed = processed.replace(
    /\{\{host\.name\}\}/g,
    webinar.host?.name || 'Host'
  )
  processed = processed.replace(
    /\{\{hostEmail\}\}/g,
    webinar.host?.email || ''
  )
  processed = processed.replace(
    /\{\{host\.email\}\}/g,
    webinar.host?.email || ''
  )

  const brandingSettings = data.brandingSettings || {}
  const safeOrganizationName = escapeHtml(brandingSettings.organizationName || '')
  const safeContactEmail = escapeHtml(brandingSettings.contactEmail || '')
  const safeWebsiteUrl = escapeHtml(brandingSettings.websiteUrl || '')
  const safePrimaryColor = escapeHtml(brandingSettings.primaryColor || '')
  const safeAccentColor = escapeHtml(brandingSettings.accentColor || '')
  const safeLogoUrl = escapeHtml(brandingSettings.logoUrl || '')
  processed = processed.replace(/\{\{organizationName\}\}/g, safeOrganizationName)
  processed = processed.replace(/\{\{contactEmail\}\}/g, safeContactEmail)
  processed = processed.replace(/\{\{websiteUrl\}\}/g, safeWebsiteUrl)
  processed = processed.replace(/\{\{primaryColor\}\}/g, safePrimaryColor)
  processed = processed.replace(/\{\{accentColor\}\}/g, safeAccentColor)
  processed = processed.replace(/\{\{logoUrl\}\}/g, safeLogoUrl)

  // Helper function to convert IANA timezone to user-friendly format
  const getFriendlyTimezoneName = (tz: string, date: Date) => {
    try {
      // Get the short timezone abbreviation (EST, PST, etc.)
      const timeString = date.toLocaleTimeString('en-US', {
        timeZone: tz,
        timeZoneName: 'short'
      })
      const parts = timeString.split(' ')
      let shortName = parts[parts.length - 1] || ''

      // Map common timezones to friendly names and their abbreviations
      const timezoneMap: Record<string, { name: string; abbr?: string }> = {
        'America/New_York': { name: 'US/Canada Eastern Time', abbr: 'EST/EDT' },
        'America/Chicago': { name: 'US/Canada Central Time', abbr: 'CST/CDT' },
        'America/Denver': { name: 'US/Canada Mountain Time', abbr: 'MST/MDT' },
        'America/Los_Angeles': { name: 'US/Canada Pacific Time', abbr: 'PST/PDT' },
        'America/Anchorage': { name: 'Alaska Time', abbr: 'AKST/AKDT' },
        'Pacific/Honolulu': { name: 'Hawaii Time', abbr: 'HST' },
        'America/Phoenix': { name: 'Arizona Time', abbr: 'MST' },
        'America/Toronto': { name: 'US/Canada Eastern Time', abbr: 'EST/EDT' },
        'America/Vancouver': { name: 'US/Canada Pacific Time', abbr: 'PST/PDT' },
        'Europe/London': { name: 'UK Time', abbr: 'GMT/BST' },
        'Europe/Paris': { name: 'Central European Time', abbr: 'CET/CEST' },
        'Europe/Berlin': { name: 'Central European Time', abbr: 'CET/CEST' },
        'Europe/Madrid': { name: 'Central European Time', abbr: 'CET/CEST' },
        'Europe/Rome': { name: 'Central European Time', abbr: 'CET/CEST' },
        'Europe/Amsterdam': { name: 'Central European Time', abbr: 'CET/CEST' },
        'Asia/Dubai': { name: 'UAE Time', abbr: 'GST' },
        'Asia/Kolkata': { name: 'India Standard Time', abbr: 'IST' },
        'Asia/Calcutta': { name: 'India Standard Time', abbr: 'IST' },
        'Asia/Singapore': { name: 'Singapore Time', abbr: 'SGT' },
        'Asia/Tokyo': { name: 'Japan Standard Time', abbr: 'JST' },
        'Asia/Hong_Kong': { name: 'Hong Kong Time', abbr: 'HKT' },
        'Asia/Shanghai': { name: 'China Standard Time', abbr: 'CST' },
        'Asia/Bangkok': { name: 'Indochina Time', abbr: 'ICT' },
        'Australia/Sydney': { name: 'Australian Eastern Time', abbr: 'AEDT/AEST' },
        'Australia/Melbourne': { name: 'Australian Eastern Time', abbr: 'AEDT/AEST' },
        'Australia/Perth': { name: 'Australian Western Time', abbr: 'AWST' },
        'Pacific/Auckland': { name: 'New Zealand Time', abbr: 'NZDT/NZST' },
      }

      const tzInfo = timezoneMap[tz]
      if (tzInfo) {
        const displayAbbr = tzInfo.abbr || shortName
        return `${tzInfo.name} (${displayAbbr})`
      }

      // Fallback: use the IANA name with the detected abbreviation
      return `${tz.replace(/_/g, ' ')} (${shortName})`
    } catch (error) {
      return tz.replace(/_/g, ' ')
    }
  }

  // Format dates with proper error handling
  let formattedDate = ''
  let formattedTime = ''
  let formattedDateTime = ''
  let friendlyTimezone = ''
  
  try {
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone,
    }

    // First get time without timezone name
    const timeOnlyOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone,
    }

    // Then get timezone abbreviation separately
    const timeWithTZOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone,
      timeZoneName: 'short',
    }

    formattedDate = scheduleDateTime.toLocaleDateString('en-US', dateOptions)
    const timeOnly = scheduleDateTime.toLocaleTimeString('en-US', timeOnlyOptions)
    friendlyTimezone = getFriendlyTimezoneName(timezone, scheduleDateTime)
    
    // Combine time with friendly timezone
    formattedTime = `${timeOnly} ${friendlyTimezone}`
    formattedDateTime = `${formattedDate} at ${formattedTime}`
  } catch (error) {
    console.error('Date formatting error:', error)
    // Fallback to ISO format
    formattedDate = scheduleDateTime.toISOString().split('T')[0]
    formattedTime = scheduleDateTime.toISOString().split('T')[1].substring(0, 5)
    formattedDateTime = `${formattedDate} at ${formattedTime} UTC`
    friendlyTimezone = 'UTC'
  }

  // Support both old and new variable formats for dates
  processed = processed.replace(/\{\{webinarDate\}\}/g, formattedDate)
  processed = processed.replace(/\{\{schedule\.date\}\}/g, formattedDate)
  processed = processed.replace(/\{\{date\}\}/g, formattedDate) // Support simple {{date}}

  processed = processed.replace(/\{\{webinarTime\}\}/g, formattedTime)
  processed = processed.replace(/\{\{schedule\.time\}\}/g, formattedTime)
  processed = processed.replace(/\{\{time\}\}/g, formattedTime) // Support simple {{time}}

  processed = processed.replace(/\{\{webinarDateTime\}\}/g, formattedDateTime)
  processed = processed.replace(/\{\{schedule\.dateTime\}\}/g, formattedDateTime)
  processed = processed.replace(/\{\{schedule\.dateISO\}\}/g, scheduleDateTime.toISOString())
  processed = processed.replace(/\{\{targetDate\}\}/g, scheduleDateTime.toISOString())
  processed = processed.replace(
    /\{\{timeZone\}\}/g,
    friendlyTimezone
  )

  // Use relative URLs so they work on any port during development
  // Build joinLink with registration and schedule parameters
  const joinLinkParams = new URLSearchParams()
  if (data.registrationId) {
    joinLinkParams.set('r', data.registrationId)
  }
  if (schedule?.id) {
    joinLinkParams.set('s', schedule.id)
  }
  const joinLink = `/room/${webinar.slug}${joinLinkParams.toString() ? '?' + joinLinkParams.toString() : ''}`
  const registrationLink = `/w/${webinar.slug}`

  // Build referral link with the current registration's referral code
  let referralLink = registrationLink
  let fullReferralLink = registrationLink // For social sharing (includes domain)
  
  if (data.registration?.referralCode) {
    referralLink = `${registrationLink}?ref=${data.registration.referralCode}`
    
    // Build full URL for social sharing
    // In production, this would be your actual domain
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
                    process.env.NEXT_PUBLIC_APP_URL ||
                    process.env.NEXTAUTH_URL ||
                    'https://emaanpowerclasses.com'
    fullReferralLink = `${baseUrl}${referralLink}`
    
    console.log('🔗 [Countdown] Generated referral link:', {
      registrationId: data.registration.id,
      referralCode: data.registration.referralCode,
      referralLink,
      fullReferralLink,
    })
  }

  // Escape links for JavaScript context (they may be used in <script> tags)
  const safeJoinLink = escapeJsInHtml(joinLink)
  const safeRegistrationLink = escapeJsInHtml(registrationLink)
  const safeReferralLink = escapeJsInHtml(fullReferralLink)
  
  const calendarLink = getGoogleCalendarLink(
    scheduleDateTime,
    webinar.title,
    webinar.description || '',
    fullReferralLink || joinLink // Use full link if available
  );

  processed = processed.replace(/\{\{joinLink\}\}/g, safeJoinLink)
  processed = processed.replace(/\{\{registrationLink\}\}/g, safeRegistrationLink)
  processed = processed.replace(/\{\{referralLink\}\}/g, safeReferralLink)
  processed = processed.replace(/\{\{calendarLink\}\}/g, calendarLink)
  processed = processed.replace(/\{\{targetDate\}\}/g, scheduleDateTime.toISOString())

  // Countdown template specific variables (simpler than CountdownPage)
  processed = processed.replace(/\{\{webinarStartDateTime\}\}/g, scheduleDateTime.toISOString())
  processed = processed.replace(/\{\{currentYear\}\}/g, new Date().getFullYear().toString())

  console.log('📜 [Countdown] Generating countdown script:', {
    targetTime: scheduleDateTime.toISOString(),
    targetTimeMs: scheduleDateTime.getTime(),
    minutesFromNow: ((scheduleDateTime.getTime() - Date.now()) / 1000 / 60).toFixed(2),
    joinLink,
  })

  // Properly escape strings for JavaScript
  const escapeJsString = (str: string) => {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
  }

  const hasCountdownPlaceholder = html.includes('{{countdown}}')

  const countdownScript = `
<script>
(function() {
  // Safety check: only run in browser context
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  
  var targetTime = new Date('${scheduleDateTime.toISOString()}').getTime();
  // Server epoch injected at render time - used to correct skewed device clocks
  var serverNowAtRender = ${Date.now()};
  var clockOffset = serverNowAtRender - Date.now();
  var joinUrl = '${escapeJsString(joinLink)}';
  var hasRedirected = false;
  var webinarStarted = false;
  
  // Function to check if webinar has started
  function isWebinarStarted() {
    return (Date.now() + clockOffset) >= targetTime;
  }
  
  // Intercept clicks on room/join links before webinar starts
  function setupJoinLinkProtection() {
    // Find all links that point to /room/
    var allLinks = document.querySelectorAll('a[href*="/room/"]');
    
    allLinks.forEach(function(link) {
      link.addEventListener('click', function(e) {
        if (!isWebinarStarted()) {
          e.preventDefault();
          e.stopPropagation();
          
          // Calculate time remaining
          var now = (Date.now() + clockOffset);
          var distance = targetTime - now;
          var minutes = Math.ceil(distance / (1000 * 60));
          
          // Show alert message
          if (minutes > 60) {
            var hours = Math.floor(minutes / 60);
            var remainingMinutes = minutes % 60;
            alert('The webinar has not started yet. Please come back in ' + hours + ' hour(s) and ' + remainingMinutes + ' minute(s).');
          } else if (minutes > 1) {
            alert('The webinar has not started yet. Please come back in ' + minutes + ' minute(s).');
          } else {
            alert('The webinar will start very soon! Please wait for the countdown to complete.');
          }
          
          return false;
        }
      });
    });
    
    console.log('[Countdown] Protected ' + allLinks.length + ' join link(s) from early access');
  }
  
  function updateCountdown() {
    if (!document || !document.getElementById) {
      return;
    }
    
    var now = (Date.now() + clockOffset);
    var distance = targetTime - now;
    
    if (distance <= 0) {
      webinarStarted = true;
      var el = document.getElementById('countdown');
      if (el) {
        el.innerHTML = 'Webinar is Live! Redirecting...';
      }
      
      if (!hasRedirected) {
        hasRedirected = true;
        setTimeout(function() {
          window.location.href = joinUrl;
        }, 2000);
      }
      return;
    }

    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    var text = '';
    if (days > 0) text += days + 'd ';
    text += hours.toString().padStart(2, '0') + 'h ';
    text += minutes.toString().padStart(2, '0') + 'm ';
    text += seconds.toString().padStart(2, '0') + 's';

    var el = document.getElementById('countdown');
    if (el) {
      el.innerHTML = text;
    } else {
        // Fallback debug
        // console.log('Countdown ticking:', text);
    }
    
    // Force update the specific elements for the Royal template
    var daysEl = document.getElementById('days');
    var hoursEl = document.getElementById('hours');
    var minutesEl = document.getElementById('minutes');
    var secondsEl = document.getElementById('seconds');
    
    if (daysEl) daysEl.innerText = days < 10 ? "0" + days : days;
    if (hoursEl) hoursEl.innerText = hours < 10 ? "0" + hours : hours;
    if (minutesEl) minutesEl.innerText = minutes < 10 ? "0" + minutes : minutes;
    if (secondsEl) secondsEl.innerText = seconds < 10 ? "0" + seconds : seconds;
  }
  
  // Start countdown immediately and repeat every second
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', function() {
      setupJoinLinkProtection();
      updateCountdown();
      setInterval(updateCountdown, 1000);
    });
  } else {
    setupJoinLinkProtection();
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }
})();
</script>
  `

  const redirectOnlyScript = `
<script>
(function() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  var targetTime = new Date('${scheduleDateTime.toISOString()}').getTime();
  // Server epoch injected at render time - used to correct skewed device clocks
  var serverNowAtRender = ${Date.now()};
  var clockOffset = serverNowAtRender - Date.now();
  var joinUrl = '${escapeJsString(joinLink)}';
  var hasRedirected = false;

  // Function to check if webinar has started
  function isWebinarStarted() {
    return (Date.now() + clockOffset) >= targetTime;
  }
  
  // Intercept clicks on room/join links before webinar starts
  function setupJoinLinkProtection() {
    var allLinks = document.querySelectorAll('a[href*="/room/"]');
    
    allLinks.forEach(function(link) {
      link.addEventListener('click', function(e) {
        if (!isWebinarStarted()) {
          e.preventDefault();
          e.stopPropagation();
          
          var now = (Date.now() + clockOffset);
          var distance = targetTime - now;
          var minutes = Math.ceil(distance / (1000 * 60));
          
          if (minutes > 60) {
            var hours = Math.floor(minutes / 60);
            var remainingMinutes = minutes % 60;
            alert('The webinar has not started yet. Please come back in ' + hours + ' hour(s) and ' + remainingMinutes + ' minute(s).');
          } else if (minutes > 1) {
            alert('The webinar has not started yet. Please come back in ' + minutes + ' minute(s).');
          } else {
            alert('The webinar will start very soon! Please wait for the countdown to complete.');
          }
          
          return false;
        }
      });
    });
  }

  function checkRedirect() {
    var now = (Date.now() + clockOffset);
    if (now < targetTime) {
      return;
    }
    if (hasRedirected) {
      return;
    }
    hasRedirected = true;
    window.location.href = joinUrl;
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', function() {
      setupJoinLinkProtection();
      checkRedirect();
      setInterval(checkRedirect, 1000);
    });
  } else {
    setupJoinLinkProtection();
    checkRedirect();
    setInterval(checkRedirect, 1000);
  }
})();
</script>
  `

  if (hasCountdownPlaceholder) {
    processed = processed.replace(/\{\{countdown\}\}/g, countdownScript)
  } else {
    if (/<\/body>/i.test(processed)) {
      processed = processed.replace(/<\/body>/i, `${redirectOnlyScript}\n</body>`)
    } else if (/<\/html>/i.test(processed)) {
      processed = processed.replace(/<\/html>/i, `${redirectOnlyScript}\n</html>`)
    } else {
      processed += redirectOnlyScript
    }
  }
  processed = processed.replace(/\{\{countdownIso\}\}/g, scheduleDateTime.toISOString())

  // Debug: Log a sample of the processed HTML around the script area
  const scriptIndex = processed.indexOf('(function() {')
  if (scriptIndex > -1) {
    console.log('🔍 [Countdown] Script preview (first 500 chars):', processed.substring(scriptIndex, scriptIndex + 500))
  }

  return processed
}

export default async function CountdownPage({ params, searchParams }: PageProps) {
  const data = await getCountdownData(params.slug, searchParams.r || null, searchParams.s || null)

  if (!data || !data.webinar) {
    notFound()
  }

  // IMMEDIATE REDIRECT: Only redirect if webinar has ALREADY STARTED (no early access)
  // The countdown page will handle the countdown and redirect via JavaScript at time=0
  if (data.scheduleDateTime) {
    const now = new Date()
    const timeUntilStart = data.scheduleDateTime.getTime() - now.getTime()
    
    // Only redirect if webinar has already started (time is past schedule)
    if (timeUntilStart <= 0) {
      const minutesLate = Math.abs(timeUntilStart) / 1000 / 60
      
      console.log('🚀 [Countdown] Webinar has started, redirecting immediately:', {
        scheduledTime: data.scheduleDateTime.toISOString(),
        currentTime: now.toISOString(),
        minutesLate: minutesLate.toFixed(2),
        isZoomSession: data.schedule?.isZoomSession,
        hasZoomLink: !!data.schedule?.zoomLink,
      })
      
      // If this is a Zoom session, redirect to Zoom link
      if (data.schedule?.isZoomSession && data.schedule?.zoomLink) {
        console.log('🔗 [Countdown] Redirecting to Zoom:', data.schedule.zoomLink)
        redirect(data.schedule.zoomLink)
      }
      
      // Otherwise, build redirect URL to simulated webinar room
      const joinLinkParams = new URLSearchParams()
      if (data.registrationId) {
        joinLinkParams.set('r', data.registrationId)
      }
      if (data.schedule?.id) {
        joinLinkParams.set('s', data.schedule.id)
      }
      const joinLink = `/room/${data.webinar.slug}${joinLinkParams.toString() ? '?' + joinLinkParams.toString() : ''}`
      
      redirect(joinLink)
    } else {
      // Webinar hasn't started yet - show countdown page
      console.log('⏱️ [Countdown] Showing countdown page:', {
        scheduledTime: data.scheduleDateTime.toISOString(),
        currentTime: now.toISOString(),
        minutesUntilStart: (timeUntilStart / 1000 / 60).toFixed(2),
      })
    }
  }

  if (!data.countdownTemplate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Countdown Template Missing</h1>
          <p className="text-gray-600">No countdown template configured. Please contact the administrator.</p>
        </div>
      </div>
    )
  }

  const processedHtml = processCountdownTemplate(
    data.countdownTemplate.htmlCode,
    data,
    searchParams.tz
  )

  // Inject client-side timezone detection script if no timezone parameter provided
  const timezoneDetectionScript = !searchParams.tz ? `
    <script>
      (function() {
        // Only run in browser
        if (typeof window === 'undefined') return;
        
        // Check if we already have timezone in URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('tz')) return;
        
        // Detect user's timezone
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (!userTimezone) return;
        
        // Add timezone to URL and reload
        urlParams.set('tz', userTimezone);
        const newUrl = window.location.pathname + '?' + urlParams.toString();
        window.location.replace(newUrl);
      })();
    </script>
  ` : '';

  const finalHtml = processedHtml + timezoneDetectionScript;

  return <TemplateRenderer html={finalHtml} />
}

export async function generateMetadata({ params }: PageProps) {
  // Remove database call from metadata generation to avoid double loading
  // and prevent failures when database is unreachable
  return {
    title: 'Countdown',
    description: 'Webinar countdown page',
  }
}
