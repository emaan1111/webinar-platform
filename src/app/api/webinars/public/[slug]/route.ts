import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const now = new Date()

    for (const schedule of webinar.schedules) {
      if (schedule.scheduleType === 'specific' && schedule.scheduledAt) {
        // Only show if in the future
        if (new Date(schedule.scheduledAt) > now) {
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
        // Generate next N occurrences
        const occurrences = generateRecurringOccurrences(schedule, maxToShow)
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

    // Sort by date (most recent first) and limit to maxSchedulesToShow
    const sortedInstances = scheduleInstances
      .filter(s => s.scheduledAt) // Only ones with dates
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()) // Changed to descending order
      .slice(0, maxToShow)

    // Add just-in-time schedules at the end
    const justInTimeSchedules = scheduleInstances.filter(s => s.scheduleType === 'justInTime')
    const finalSchedules = [...sortedInstances, ...justInTimeSchedules]

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
