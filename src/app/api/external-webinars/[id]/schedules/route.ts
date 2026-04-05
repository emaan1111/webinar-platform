import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getWebinarDetails, isWebinarJamConfigured } from '@/lib/webinarjam'
import { toZonedTime, format } from 'date-fns-tz'
import { addMinutes, isBefore } from 'date-fns'

/**
 * External Webinar Schedules API
 * 
 * GET /api/external-webinars/[id]/schedules?timezone=America/New_York
 * 
 * Returns available schedules for a webinar, converted to user's timezone
 * Supports both scheduled webinars and JIT (Just-In-Time) webinars
 */

// CORS headers for cross-origin embed requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

interface ScheduleOption {
  id: string
  date: string // e.g., "April 6, 2026"
  time: string // e.g., "11:00 AM"
  dateTimeLocal: string // Full ISO date in user's timezone
  dateTimeUTC: string // Full ISO date in UTC
  isJIT: boolean
  label: string // User-friendly label like "Sunday, April 6 at 11:00 AM"
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const userTimezone = searchParams.get('timezone') || 'America/New_York'

    // Get the external webinar from our database
    const externalWebinar = await prisma.externalWebinar.findUnique({
      where: { id },
      include: {
        schedules: true,
      }
    })

    if (!externalWebinar) {
      return NextResponse.json(
        { error: 'External webinar not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    if (!externalWebinar.isActive) {
      return NextResponse.json(
        { error: 'This webinar is not currently active' },
        { status: 400, headers: corsHeaders }
      )
    }

    const scheduleOptions: ScheduleOption[] = []
    const now = new Date()

    // Check if this is a JIT webinar (just-in-time)
    const isJITWebinar = externalWebinar.isJIT || externalWebinar.schedules.length === 0

    if (isJITWebinar) {
      // For JIT webinars, generate upcoming time slots
      // Typically JIT webinars have specific times like "11 AM", "3 PM", etc.
      const jitTimes = externalWebinar.jitTimes || ['11:00', '14:00', '18:00'] // Default times if not configured
      
      // Generate sessions for the next 7 days
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const baseDate = new Date(now)
        baseDate.setDate(baseDate.getDate() + dayOffset)
        
        for (const timeStr of jitTimes) {
          const [hours, minutes] = timeStr.split(':').map(Number)
          
          // Create the date/time in user's timezone
          const sessionDate = new Date(baseDate)
          sessionDate.setHours(hours, minutes, 0, 0)
          
          // Convert from user timezone to UTC
          // Note: This creates a date in the user's timezone
          const zonedDate = toZonedTime(sessionDate, userTimezone)
          
          // Skip sessions in the past (with 15 minute buffer)
          const bufferTime = addMinutes(now, 15)
          if (isBefore(sessionDate, bufferTime)) {
            continue
          }
          
          const dateLabel = format(sessionDate, 'EEEE, MMMM d', { timeZone: userTimezone })
          const timeLabel = format(sessionDate, 'h:mm a', { timeZone: userTimezone })
          
          scheduleOptions.push({
            id: '0', // JIT uses schedule=0
            date: format(sessionDate, 'MMMM d, yyyy', { timeZone: userTimezone }),
            time: timeLabel,
            dateTimeLocal: sessionDate.toISOString(),
            dateTimeUTC: sessionDate.toISOString(),
            isJIT: true,
            label: `${dateLabel} at ${timeLabel}`,
          })
        }
      }
    } else {
      // For scheduled webinars, try to fetch from WebinarJam API first
      let apiSchedules: Array<{ schedule: string | number; date: string; time: string; timezone: string }> = []
      
      if (isWebinarJamConfigured()) {
        const wjWebinar = await getWebinarDetails(
          externalWebinar.externalWebinarId,
          externalWebinar.platform as 'webinarjam' | 'everwebinar'
        )
        if (wjWebinar?.schedules) {
          apiSchedules = wjWebinar.schedules
        }
      }

      // Use API schedules if available, otherwise use stored schedules
      const schedulesToUse = apiSchedules.length > 0 
        ? apiSchedules.map(s => ({
            externalScheduleId: String(s.schedule),
            scheduledAt: new Date(`${s.date}T${s.time}`),
            timezone: s.timezone,
          }))
        : externalWebinar.schedules.map(s => ({
            externalScheduleId: s.externalScheduleId,
            scheduledAt: s.scheduledAt,
            timezone: s.timezone || 'UTC',
          }))

      for (const schedule of schedulesToUse) {
        if (!schedule.scheduledAt) continue
        
        // Parse the schedule from its original timezone
        const originalTimezone = schedule.timezone || 'UTC'
        const scheduledUTC = schedule.scheduledAt instanceof Date 
          ? schedule.scheduledAt 
          : new Date(schedule.scheduledAt)
        
        // Skip past sessions
        if (isBefore(scheduledUTC, now)) continue
        
        // Convert to user's timezone for display
        const userLocalDate = toZonedTime(scheduledUTC, userTimezone)
        
        const dateLabel = format(userLocalDate, 'EEEE, MMMM d', { timeZone: userTimezone })
        const timeLabel = format(userLocalDate, 'h:mm a', { timeZone: userTimezone })
        
        scheduleOptions.push({
          id: schedule.externalScheduleId || `schedule-${scheduledUTC.getTime()}`,
          date: format(userLocalDate, 'MMMM d, yyyy', { timeZone: userTimezone }),
          time: timeLabel,
          dateTimeLocal: userLocalDate.toISOString(),
          dateTimeUTC: scheduledUTC.toISOString(),
          isJIT: false,
          label: `${dateLabel} at ${timeLabel}`,
        })
      }
    }

    // Sort by date/time
    scheduleOptions.sort((a, b) => 
      new Date(a.dateTimeUTC).getTime() - new Date(b.dateTimeUTC).getTime()
    )

    return NextResponse.json({
      webinarId: id,
      webinarName: externalWebinar.externalWebinarName || externalWebinar.name,
      platform: externalWebinar.platform,
      isJIT: isJITWebinar,
      userTimezone,
      schedules: scheduleOptions,
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('External webinar schedules error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedules', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
