'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Globe } from 'lucide-react'
import {
  COMMON_TIMEZONES,
  describeTimezone,
  getAllTimezones,
  getBrowserTimezone,
} from '@/lib/useTimezonePreference'

interface TimezoneSelectorProps {
  value: string
  onChange: (timezone: string) => void
  /** Hide the "It's <time> there" hint, e.g. in tight header rows */
  showHint?: boolean
  disabled?: boolean
  className?: string
}

/**
 * Picks the timezone a dashboard's days are bucketed in. Days are cut at
 * midnight in the selected zone, so this changes which rows a registration or
 * an attendee lands in - not just how times are printed.
 */
export default function TimezoneSelector({
  value,
  onChange,
  showHint = true,
  disabled = false,
  className = '',
}: TimezoneSelectorProps) {
  const browser = useMemo(() => getBrowserTimezone(), [])
  const zones = useMemo(() => getAllTimezones(), [])
  const common = useMemo(
    () => COMMON_TIMEZONES.filter(tz => tz !== browser && zones.includes(tz)),
    [browser, zones]
  )

  // Rendered client-side only: the hint is clock-dependent and would otherwise
  // hydrate against a stale server render.
  const [hint, setHint] = useState('')
  useEffect(() => {
    if (!value) return
    const tick = () => setHint(describeTimezone(value))
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [value])

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="w-4 h-4 text-gray-400 shrink-0" />
      <div className="flex flex-col">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled || !value}
          title="Timezone used to group days"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm max-w-[240px]"
        >
          {!value && <option value="">Loading…</option>}
          <option value={browser}>{browser} (your device)</option>
          {common.length > 0 && (
            <optgroup label="Common">
              {common.map(tz => (
                <option key={`common-${tz}`} value={tz}>
                  {tz.replace(/_/g, ' ')}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label="All time zones">
            {zones.map(tz => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, ' ')}
              </option>
            ))}
          </optgroup>
        </select>
        {showHint && hint && (
          <span className="text-xs text-gray-500 mt-1">Days start at midnight · now {hint}</span>
        )}
      </div>
    </div>
  )
}
