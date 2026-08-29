'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'dashboardTimezone'

/** The zone the browser reports, used as the default and as the "device" option. */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export function isValidTimezone(tz: string): boolean {
  if (!tz) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date())
    return true
  } catch {
    return false
  }
}

/** Every zone the runtime knows, so the picker isn't limited to a hand-written list. */
export function getAllTimezones(): string[] {
  const supported = (Intl as any).supportedValuesOf
  if (typeof supported === 'function') {
    try {
      return supported.call(Intl, 'timeZone') as string[]
    } catch {
      /* fall through */
    }
  }
  return FALLBACK_TIMEZONES
}

/** Current wall-clock time and UTC offset in a zone, for the picker's hint line. */
export function describeTimezone(tz: string, now: Date = new Date()): string {
  try {
    const time = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(now)
    const offset = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
      .formatToParts(now)
      .find(p => p.type === 'timeZoneName')?.value
    return offset ? `${time} (${offset})` : time
  } catch {
    return ''
  }
}

/**
 * The timezone reports and analytics are read in, remembered per browser.
 *
 * Starts empty and resolves on mount, so pages can hold their fetches until the
 * stored preference is known rather than querying once in the wrong zone.
 */
export function useTimezonePreference() {
  const [timezone, setTimezoneState] = useState('')

  useEffect(() => {
    let stored: string | null = null
    try {
      stored = window.localStorage.getItem(STORAGE_KEY)
    } catch {
      /* private mode / storage blocked - fall back to the device zone */
    }
    setTimezoneState(stored && isValidTimezone(stored) ? stored : getBrowserTimezone())
  }, [])

  const setTimezone = (tz: string) => {
    if (!isValidTimezone(tz)) return
    setTimezoneState(tz)
    try {
      window.localStorage.setItem(STORAGE_KEY, tz)
    } catch {
      /* preference just won't persist */
    }
  }

  return { timezone, setTimezone }
}

const FALLBACK_TIMEZONES = [
  'UTC',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'America/Anchorage',
  'America/Bogota',
  'America/Chicago',
  'America/Denver',
  'America/Halifax',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/New_York',
  'America/Phoenix',
  'America/Sao_Paulo',
  'America/Toronto',
  'Asia/Bangkok',
  'Asia/Dhaka',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Kuala_Lumpur',
  'Asia/Manila',
  'Asia/Riyadh',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Sydney',
  'Europe/Amsterdam',
  'Europe/Berlin',
  'Europe/Dublin',
  'Europe/Istanbul',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Moscow',
  'Europe/Paris',
  'Europe/Rome',
  'Europe/Warsaw',
  'Pacific/Auckland',
  'Pacific/Honolulu',
]

/** Shown at the top of the picker - the zones this dashboard is read in most. */
export const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Singapore',
  'Australia/Sydney',
]
