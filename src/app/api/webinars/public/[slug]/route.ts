import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  filterToBookingWindow,
  isWithinBookingWindow,
  normalizeBookingWindow,
  describeBookingWindow,
} from '@/lib/bookingWindow'

// Helper function to generate next N occurrences for recurring schedules
function generateRecurringOccurrences(schedule: any, maxCount: number): Date[] {
  const occurrences: Date[] = []
  
  if (!schedule.recurringPattern) return occurrences
  
  try {
    const pattern = JSON.parse(schedule.recurringPattern)
    const now = new Date()
    let currentDate = new Date(now)
    currentDate.setHours(0, 0, 0, 0) // Start from beginning of today
    
    const [hours, minutes] = pattern.time.split(':').map(Number)
    
    while (occurrences.length < maxCount) {
      let shouldAdd = false
      
      if (pattern.interval === 'daily') {
        shouldAdd = true
      } else if (pattern.interval === 'weekly' && pattern.daysOfWeek) {
        const dayOfWeek = currentDate.getDay()
        shouldAdd = pattern.daysOfWeek.includes(dayOfWeek)
      } else if (pattern.interval === 'monthly') {
        // Add on the same day of each month
        shouldAdd = true
      }
      
      if (shouldAdd) {
        const occurrence = new Date(currentDate)
        occurrence.setHours(hours, minutes, 0, 0)
        
        // Only add if it's in the future
        if (occurrence > now) {
          occurrences.push(occurrence)
        }
      }
      
      // Move to next day or month
      if (pattern.interval === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1)
      } else {
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      // Safety check to prevent infinite loop
      if (currentDate.getFullYear() > now.getFullYear() + 2) break
    }
  } catch (error) {
    console.error('Error parsing recurring pattern:', error)
  }
  
  return occurrences
}

// GET /api/webinars/public/[slug] - Public endpoint to get webinar details
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    const webinar = await prisma.webinar.findUnique({
      where: {
        slug,
        status: 'SCHEDULED' // Only show scheduled webinars publicly
      },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        thumbnail: true,
        maxSchedulesToShow: true,
        minBookingLeadMinutes: true,
        maxBookingLeadMinutes: true,
        schedules: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            scheduleType: true,
            scheduledAt: true,
            minutesFromReg: true,
            timezone: true,
            useUserTimezone: true,
            recurringPattern: true
          }
        }
      }
    })

    if (!webinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      )
    }

    // Generate schedule instances to show
    const scheduleInstances: any[] = []
    const maxToShow = webinar.maxSchedulesToShow || 3
    // Booking window — how close / how far ahead a registrant may book. Read live from
    // the webinar on every page load, so changing it needs no embed re-paste.
    const bookingWindow = normalizeBookingWindow(webinar)
    const hasBookingWindow = bookingWindow.min !== null || bookingWindow.max !== null
    const recurringHeadroom = hasBookingWindow ? 30 : 0
    const now = new Date()
    const webinarDurationMinutes = webinar.duration || 60 // Default to 60 minutes if not set

    console.log('⏰ Current UTC time:', now.toISOString())

    for (const schedule of webinar.schedules) {
      if (schedule.scheduleType === 'specific' && schedule.scheduledAt) {
        const scheduleDate = new Date(schedule.scheduledAt)
        // Calculate when the webinar ends (scheduled time + duration)
        const webinarEndTime = new Date(scheduleDate.getTime() + (webinarDurationMinutes * 60 * 1000))
        
        console.log('📅 Schedule check:', {
          id: schedule.id,
          scheduledAt: schedule.scheduledAt,
          timezone: schedule.timezone,
          startTime: scheduleDate.toISOString(),
          endTime: webinarEndTime.toISOString(),
          hasEnded: webinarEndTime.getTime() <= now.getTime(),
          willShow: webinarEndTime.getTime() > now.getTime()
        })
        
        // Only show if the webinar hasn't ended yet
        if (webinarEndTime.getTime() > now.getTime()) {
          scheduleInstances.push({
            id: schedule.id,
            scheduleType: 'specific',
            scheduledAt: schedule.scheduledAt,
            timezone: schedule.timezone,
            useUserTimezone: schedule.useUserTimezone
          })
        }
      } else if (schedule.scheduleType === 'justInTime') {
        // Just-in-time schedules - always available
        scheduleInstances.push({
          id: schedule.id,
          scheduleType: 'justInTime',
          minutesFromReg: schedule.minutesFromReg
        })
      } else if (schedule.scheduleType === 'recurring') {
        // Generate next N occurrences. With a booking window set, the soonest ones may be
        // filtered out below (a floor skips the ones starting too soon), so generate
        // headroom and let the window decide which survive — otherwise a 2-hour floor
        // would blank a daily schedule instead of offering tomorrow's slot.
        const occurrences = generateRecurringOccurrences(schedule, maxToShow + recurringHeadroom)
        occurrences.forEach((occurrence) => {
          scheduleInstances.push({
            id: `${schedule.id}-${occurrence.getTime()}`,
            baseScheduleId: schedule.id,
            scheduleType: 'recurring',
            scheduledAt: occurrence.toISOString(),
            timezone: schedule.timezone,
            useUserTimezone: schedule.useUserTimezone,
            recurringPattern: schedule.recurringPattern
          })
        })
      }
    }

    // Sort by date (soonest/closest first - ascending order for upcoming events)
    // The booking-window filter runs BEFORE the slice: trimming to maxToShow first would
    // spend all the visible slots on times the window then removes, leaving an empty
    // picker while perfectly valid later sessions existed.
    const sortedInstances = filterToBookingWindow(
      scheduleInstances
        .filter(s => s.scheduledAt) // Only ones with dates
        .filter(s => {
          // Double-check all are in future
          const scheduleDate = new Date(s.scheduledAt)
          const webinarEndTime = new Date(scheduleDate.getTime() + (webinarDurationMinutes * 60 * 1000))
          return webinarEndTime.getTime() > now.getTime()
        }),
      s => s.scheduledAt,
      webinar,
      now
    )
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()) // Ascending: soonest first
      .slice(0, maxToShow)

    // Add just-in-time schedules at the end. A just-in-time row has no fixed time — it
    // starts minutesFromReg after the visitor registers — so the window judges it on that
    // effective start. A floor above it (e.g. "nothing sooner than 2 hours" against a
    // 15-minute just-in-time) correctly removes the option altogether.
    const justInTimeSchedules = scheduleInstances
      .filter(s => s.scheduleType === 'justInTime')
      .filter(s =>
        isWithinBookingWindow(
          new Date(now.getTime() + (s.minutesFromReg ?? 0) * 60 * 1000),
          webinar,
          now
        )
      )
    const finalSchedules = [...sortedInstances, ...justInTimeSchedules]

    if (hasBookingWindow && finalSchedules.length === 0) {
      console.warn(
        `⏳ Booking window (${describeBookingWindow(webinar)}) left no bookable times for webinar ${slug}`
      )
    }

    return NextResponse.json({
      webinar: {
        ...webinar,
        schedules: finalSchedules
      }
    })
  } catch (error) {
    console.error('Get public webinar error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
