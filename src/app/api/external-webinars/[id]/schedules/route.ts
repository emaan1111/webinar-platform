import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getWebinarDetails, isWebinarJamConfigured } from '@/lib/webinarjam'
import { toZonedTime, fromZonedTime, format } from 'date-fns-tz'
import { addMinutes, addDays, isBefore } from 'date-fns'

/**
 * External Webinar Schedules API
 *
 * GET /api/external-webinars/[id]/schedules?timezone=America/New_York
 *
 * Returns available schedules for a webinar, converted to user's timezone.
 *
 * Two modes:
 *  - Legacy (combineScheduleSources = false): either JIT-generated times OR the
 *    webinar's scheduled sessions, exactly as before.
 *  - Combined (combineScheduleSources = true): one seamless, time-sorted list mixing
 *    a real live Zoom session + a "starting soon" just-in-time option + the recurring
 *    EverWebinar sessions (e.g. daily 11 AM). Every option is formatted identically in
 *    the visitor's local timezone so the live option is indistinguishable from the
 *    evergreen ones.
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

/**
 * Build a display option from a true UTC instant, rendered in the visitor's timezone.
 * ALL combined-picker sources go through this so the live Zoom time, the JIT time and
 * the recurring times share one identical format (no visual leak of which is live).
 */
function makeOption(
  id: string,
  utcDate: Date,
  isJIT: boolean,
  userTimezone: string
): ScheduleOption {
  const zoned = toZonedTime(utcDate, userTimezone)
  return {
    id,
    date: format(zoned, 'MMMM d, yyyy', { timeZone: userTimezone }),
    time: format(zoned, 'h:mm a', { timeZone: userTimezone }),
    dateTimeLocal: utcDate.toISOString(),
    dateTimeUTC: utcDate.toISOString(),
    isJIT,
    label: `${format(zoned, 'EEEE, MMMM d', { timeZone: userTimezone })} at ${format(zoned, 'h:mm a', { timeZone: userTimezone })}`,
  }
}

/** Round a date UP to the next `step`-minute boundary (e.g. 2:07 -> 2:10 for step=5). */
function roundUpMinutes(date: Date, step: number): Date {
  const d = new Date(date)
  d.setSeconds(0, 0)
  const remainder = d.getMinutes() % step
  if (remainder !== 0) d.setMinutes(d.getMinutes() + (step - remainder))
  return d
}

type RecurringSession = { externalScheduleId: string; scheduledAt: Date }

/**
 * Pull "HH:mm" time-of-day from an API schedule. The EverWebinar/WebinarJam API returns
 * `date` as a combined "YYYY-MM-DD HH:mm" string (no separate `time`/`timezone`), but we
 * also tolerate a separate `time` field or an ISO "YYYY-MM-DDTHH:mm".
 */
function extractTimeOfDay(s: { date?: string; time?: string }): { h: number; m: number } | null {
  let timeStr = s.time
  if (!timeStr && s.date) {
    if (s.date.includes(' ')) timeStr = s.date.split(' ')[1]
    else if (s.date.includes('T')) timeStr = s.date.split('T')[1]
  }
  if (!timeStr) return null
  const [h, m] = timeStr.split(':').map((n) => parseInt(n, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return { h, m }
}

/** Next upcoming occurrence of a daily time-of-day, in the visitor's timezone. */
function nextOccurrenceInTz(t: { h: number; m: number }, tz: string, now: Date): Date {
  const pad = (n: number) => String(n).padStart(2, '0')
  const zonedNow = toZonedTime(now, tz)
  const build = (y: number, mo: number, d: number) =>
    fromZonedTime(`${y}-${pad(mo + 1)}-${pad(d)}T${pad(t.h)}:${pad(t.m)}:00`, tz)
  let occ = build(zonedNow.getFullYear(), zonedNow.getMonth(), zonedNow.getDate())
  if (occ.getTime() <= now.getTime() + 60_000) {
    const tomorrow = new Date(zonedNow)
    tomorrow.setDate(tomorrow.getDate() + 1)
    occ = build(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())
  }
  return occ
}

type ClassifiedSchedules = {
  // EverWebinar's "Just in time" block id, if the webinar has one (its time is dynamic,
  // so we don't show it as a fixed recurring slot — we register the "starting soon" option
  // into it instead).
  jitScheduleId: string | null
  // Real recurring daily blocks (e.g. "Every day, 11:00 AM"), as next occurrences in the
  // visitor's local timezone.
  recurring: RecurringSession[]
}

/** True when an API schedule's comment marks it as a dynamic just-in-time block. */
function isJustInTimeBlock(comment?: string | null): boolean {
  return /just[\s-]?in[\s-]?time/i.test(comment || '')
}

/**
 * Fetch the webinar's schedules and split them into the dynamic "just in time" block vs the
 * real recurring daily blocks. EverWebinar evergreen times are shown in each registrant's
 * LOCAL timezone (e.g. an "11:00" block shows as 11 AM their time), so each recurring block
 * becomes its next occurrence in the visitor's tz. Stored schedules (rare) are fixed instants.
 */
async function fetchClassifiedSchedules(
  externalWebinar: { externalWebinarId: string; platform: string; schedules: any[] },
  now: Date,
  userTimezone: string
): Promise<ClassifiedSchedules> {
  let apiSchedules: Array<{ schedule: string | number; date?: string; time?: string; comment?: string }> = []

  if (isWebinarJamConfigured()) {
    const wjWebinar = await getWebinarDetails(
      externalWebinar.externalWebinarId,
      externalWebinar.platform as 'webinarjam' | 'everwebinar'
    )
    if (wjWebinar?.schedules) apiSchedules = wjWebinar.schedules as any
  }

  let jitScheduleId: string | null = null
  const sessions: RecurringSession[] = []

  if (apiSchedules.length > 0) {
    for (const s of apiSchedules) {
      if (isJustInTimeBlock(s.comment)) {
        if (!jitScheduleId) jitScheduleId = String(s.schedule)
        continue
      }
      const tod = extractTimeOfDay(s)
      if (!tod) continue
      const occ = nextOccurrenceInTz(tod, userTimezone, now)
      if (!Number.isNaN(occ.getTime())) {
        sessions.push({ externalScheduleId: String(s.schedule), scheduledAt: occ })
      }
    }
  } else {
    for (const s of externalWebinar.schedules) {
      if (!s.scheduledAt) continue
      const at = new Date(s.scheduledAt)
      if (!Number.isNaN(at.getTime()) && !isBefore(at, now)) {
        sessions.push({ externalScheduleId: s.externalScheduleId || s.id, scheduledAt: at })
      }
    }
  }

  // De-dupe identical instants and sort ascending.
  const seen = new Set<number>()
  const recurring = sessions
    .filter((s) => {
      const key = s.scheduledAt.getTime()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())

  return { jitScheduleId, recurring }
}

/**
 * Ensure we have at least `cap` recurring occurrences. If the platform only returns the
 * next occurrence of a daily-recurring block (e.g. "11 AM everyday"), extrapolate forward
 * one day at a time from the latest known occurrence. (Same-clock-time daily; DST shifts
 * of an hour at the boundary are possible.)
 */
function expandRecurring(recurring: RecurringSession[], cap: number): RecurringSession[] {
  if (recurring.length >= cap || recurring.length === 0) return recurring
  const result = [...recurring]
  const base = recurring[recurring.length - 1]
  let next = base.scheduledAt
  while (result.length < cap) {
    next = addDays(next, 1)
    result.push({ externalScheduleId: base.externalScheduleId, scheduledAt: next })
  }
  return result
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
      },
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

    const now = new Date()
    let scheduleOptions: ScheduleOption[] = []
    let responseIsJIT = false

    if (externalWebinar.combineScheduleSources) {
      // ---------- Combined seamless picker ----------

      // 1. One real LIVE Zoom session (shown indistinguishably among the evergreen options).
      if (
        externalWebinar.liveZoomEnabled &&
        externalWebinar.liveZoomLink &&
        externalWebinar.liveZoomAt
      ) {
        const zoomAt = new Date(externalWebinar.liveZoomAt)
        if (!isBefore(zoomAt, now)) {
          scheduleOptions.push(makeOption(`x|z|${zoomAt.getTime()}`, zoomAt, false, userTimezone))
        }
      }

      // Fetch + classify the webinar's schedules once (dynamic JIT block vs daily blocks).
      const { jitScheduleId, recurring } = await fetchClassifiedSchedules(
        externalWebinar,
        now,
        userTimezone
      )

      // 2. A single "starting soon" just-in-time option. Register it into EverWebinar's real
      //    "Just in time" block when the webinar has one; otherwise fall back to schedule "0".
      if (externalWebinar.showJustInTime) {
        const lead = externalWebinar.jitLeadMinutes ?? 15
        const jitAt = roundUpMinutes(addMinutes(now, lead), 5)
        const jitId = jitScheduleId || 'j'
        scheduleOptions.push(makeOption(`x|${jitId}|${jitAt.getTime()}`, jitAt, true, userTimezone))
        responseIsJIT = true
      }

      // 3. Recurring EverWebinar daily blocks (e.g. 11 AM, 7 PM), in the visitor's local time.
      const cap = externalWebinar.recurringSlotsToShow ?? recurring.length
      const expanded = expandRecurring(recurring, cap).slice(0, cap)
      for (const session of expanded) {
        // Encode the EverWebinar schedule id + this occurrence's exact time so the register
        // route can recover both even when several days share one schedule id.
        scheduleOptions.push(
          makeOption(
            `x|${session.externalScheduleId}|${session.scheduledAt.getTime()}`,
            session.scheduledAt,
            false,
            userTimezone
          )
        )
      }
    } else {
      // ---------- Legacy behaviour (unchanged) ----------

      // Check if this is a JIT webinar (just-in-time)
      const isJITWebinar = externalWebinar.isJIT || externalWebinar.schedules.length === 0
      responseIsJIT = isJITWebinar

      if (isJITWebinar) {
        // For JIT webinars, generate upcoming time slots
        const jitTimes = externalWebinar.jitTimes || ['11:00', '14:00', '18:00']

        // Generate sessions for the next 7 days
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
          const baseDate = new Date(now)
          baseDate.setDate(baseDate.getDate() + dayOffset)

          for (const timeStr of jitTimes) {
            const [hours, minutes] = timeStr.split(':').map(Number)

            const sessionDate = new Date(baseDate)
            sessionDate.setHours(hours, minutes, 0, 0)

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

          const scheduledUTC = schedule.scheduledAt instanceof Date
            ? schedule.scheduledAt
            : new Date(schedule.scheduledAt)

          // Skip unparseable or past sessions (guards against the API's combined date format)
          if (Number.isNaN(scheduledUTC.getTime())) continue
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
    }

    // Sort by date/time so any live Zoom slot falls into its natural chronological place.
    scheduleOptions.sort((a, b) =>
      new Date(a.dateTimeUTC).getTime() - new Date(b.dateTimeUTC).getTime()
    )

    return NextResponse.json({
      webinarId: id,
      webinarName: externalWebinar.externalWebinarName || externalWebinar.name,
      platform: externalWebinar.platform,
      isJIT: responseIsJIT,
      userTimezone,
      thankYouUrl: externalWebinar.thankYouUrl || null,
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
