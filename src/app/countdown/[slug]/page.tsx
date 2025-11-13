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
  const webinar = await prisma.webinar.findUnique({
    where: { slug },
    include: {
      host: { select: { name: true, email: true } },
      schedules: {
        orderBy: {
          createdAt: 'asc'
        }
      },
    },
  })

  if (!webinar) {
    return null
  }
 
  const brandingSettings = await readBrandingSettings()

  console.log('🔍 [Countdown] Webinar loaded:', {
    slug,
    webinarId: webinar.id,
    title: webinar.title,
    totalSchedules: webinar.schedules.length,
    requestedRegistrationId: registrationId,
    requestedScheduleId: scheduleId,
  })

  // If registrationId is provided, get the registration to find the registered schedule
  let registration = null
  if (registrationId) {
    registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      select: { 
        id: true, 
        scheduleId: true, 
        registeredAt: true,
        scheduledStartTime: true, // NEW: Get the stored start time
        referralCode: true, // For building referral links
      },
    })
    
    // Debug logging
    console.log('🔍 [Countdown] Registration found:', {
      id: registration?.id,
      scheduleId: registration?.scheduleId,
      registeredAt: registration?.registeredAt,
      scheduledStartTime: registration?.scheduledStartTime, // NEW
      hasStoredStartTime: !!registration?.scheduledStartTime,
    })
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
  
  processed = processed.replace(/\{\{webinarTitle\}\}/g, safeTitle)
  processed = processed.replace(/\{\{webinarDescription\}\}/g, safeDescription)
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
                    'http://localhost:3001'
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
  
  processed = processed.replace(/\{\{joinLink\}\}/g, safeJoinLink)
  processed = processed.replace(/\{\{registrationLink\}\}/g, safeRegistrationLink)
  processed = processed.replace(/\{\{referralLink\}\}/g, safeReferralLink)
  
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

  const countdownScript = `
    (function() {
      // Safety check: only run in browser context
      if (typeof window === 'undefined') {
        console.error('[Countdown Timer] Not in browser context');
        return;
      }
      
      const targetTime = new Date('${scheduleDateTime.toISOString()}').getTime();
      const joinUrl = '${escapeJsString(joinLink)}';
      let hasRedirected = false;
      
      // Wait for DOM to be ready
      function initCountdown() {
        // Debug logging
        console.log('[Countdown Timer] Initialized:', {
          targetTimeString: '${scheduleDateTime.toISOString()}',
          targetTime: new Date(targetTime).toISOString(),
          targetTimeMs: targetTime,
          currentTime: new Date().toISOString(),
          currentTimeMs: Date.now(),
          initialDistance: targetTime - Date.now(),
          initialMinutesAway: ((targetTime - Date.now()) / 1000 / 60).toFixed(2),
        });
        
        // Check if elements exist
        console.log('[Countdown Timer] Element check:', {
          hasCountdownDiv: !!document.getElementById('countdown'),
          hasDaysSpan: !!document.getElementById('days'),
          hoursSpan: !!document.getElementById('hours'),
          minutesSpan: !!document.getElementById('minutes'),
          secondsSpan: !!document.getElementById('seconds'),
        });

        function updateCountdown() {
        const now = new Date().getTime();
        const distance = targetTime - now;
        
        console.log('[Countdown Timer] Update:', {
          now: now,
          targetTime: targetTime,
          distance: distance,
          minutesLeft: (distance / 1000 / 60).toFixed(2),
        });

        if (distance <= 0) {
          console.log('[Countdown Timer] Time is up! Redirecting to webinar...');
          const el = document.getElementById('countdown');
          if (el) {
            el.innerHTML = 'Webinar is Live! Redirecting...';
          }
          
          // Auto-redirect to webinar room after 2 seconds
          if (!hasRedirected) {
            hasRedirected = true;
            setTimeout(function() {
              console.log('[Countdown Timer] Redirecting to:', joinUrl);
              window.location.href = joinUrl;
            }, 2000);
          }
          return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        console.log('[Countdown Timer] Calculated values:', {
          days: days,
          hours: hours,
          minutes: minutes,
          seconds: seconds,
        });

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
        const intervalId = setInterval(updateCountdown, 1000);
        
        // Log first update
        console.log('[Countdown Timer] First update completed, interval started');
      }
      
      // Start countdown when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCountdown);
      } else {
        // DOM already loaded
        initCountdown();
      }
    })();
  `

  processed = processed.replace(/\{\{countdown\}\}/g, countdownScript)
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

  // IMMEDIATE REDIRECT: If webinar has already started, redirect to room immediately
  if (data.scheduleDateTime) {
    const now = new Date()
    const timeUntilStart = data.scheduleDateTime.getTime() - now.getTime()
    
    if (timeUntilStart <= 0) {
      console.log('🚀 [Countdown] Webinar already started, redirecting immediately:', {
        scheduledTime: data.scheduleDateTime.toISOString(),
        currentTime: now.toISOString(),
        minutesLate: Math.abs(timeUntilStart / 1000 / 60).toFixed(2),
      })
      
      // Build redirect URL with registration and schedule parameters
      const joinLinkParams = new URLSearchParams()
      if (data.registrationId) {
        joinLinkParams.set('r', data.registrationId)
      }
      if (data.schedule?.id) {
        joinLinkParams.set('s', data.schedule.id)
      }
      const joinLink = `/room/${data.webinar.slug}${joinLinkParams.toString() ? '?' + joinLinkParams.toString() : ''}`
      
      redirect(joinLink)
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

  return <TemplateRenderer html={processedHtml} />
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
