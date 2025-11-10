interface RegistrationLike {
  registeredAt?: Date | string | null
}

interface ScheduleLike {
  scheduleType: string
  scheduledAt?: Date | string | null
  minutesFromReg?: number | null
  recurringPattern?: string | null
}

const dayNameToNumber: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
}

/**
 * Returns the next Date when the given schedule occurs.
 */
export function calculateScheduleDateTime(
  schedule: ScheduleLike,
  registration?: RegistrationLike | null,
  referenceDate: Date = new Date()
): Date {
  if (schedule.scheduleType === 'justInTime' && schedule.minutesFromReg) {
    const regTime = registration?.registeredAt
      ? new Date(registration.registeredAt)
      : referenceDate
    return new Date(regTime.getTime() + schedule.minutesFromReg * 60000)
  }

  if (schedule.scheduleType === 'specific' && schedule.scheduledAt) {
    return new Date(schedule.scheduledAt)
  }

  if (schedule.scheduleType === 'recurring' && schedule.recurringPattern) {
    try {
      const pattern = JSON.parse(schedule.recurringPattern)
      if (pattern.interval === 'weekly' && pattern.daysOfWeek && pattern.time) {
        const [hours, minutes] = String(pattern.time)
          .split(':')
          .map((value: string) => Number(value))
        const targetDayRaw = Array.isArray(pattern.daysOfWeek)
          ? pattern.daysOfWeek[0]
          : pattern.daysOfWeek
        const targetDay =
          typeof targetDayRaw === 'number'
            ? targetDayRaw
            : dayNameToNumber[targetDayRaw] ?? 0

        const currentDay = referenceDate.getDay()
        let daysUntilTarget = (targetDay - currentDay + 7) % 7

        if (daysUntilTarget === 0) {
          const todayAtTime = new Date(referenceDate)
          todayAtTime.setHours(hours, minutes, 0, 0)
          if (todayAtTime <= referenceDate) {
            daysUntilTarget = 7
          }
        }

        const next = new Date(referenceDate)
        next.setDate(referenceDate.getDate() + daysUntilTarget)
        next.setHours(hours, minutes, 0, 0)
        return next
      }
    } catch (error) {
      console.error('Error parsing recurring pattern:', error)
    }
  }

  return referenceDate
}
