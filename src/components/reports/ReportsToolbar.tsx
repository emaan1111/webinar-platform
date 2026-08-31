'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Calendar, Filter, Timer, X } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'
import MultiSelect from '@/components/ui/MultiSelect'
import TimezoneSelector from '@/components/dashboard/TimezoneSelector'

export interface DateRange {
  from: string
  to: string
}

export interface WebinarOption {
  id: string
  title: string
}

interface ReportsToolbarProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  timezone: string
  onTimezoneChange: (tz: string) => void
  engagementMinutes: number
  onEngagementMinutesChange: (minutes: number) => void
  webinars: WebinarOption[]
  selectedWebinars: string[]
  onSelectedWebinarsChange: (ids: string[]) => void
  loading: boolean
}

type PresetKey = 'today' | 'yesterday' | 'last7' | 'last30' | 'last90' | 'thisMonth' | 'lastMonth'

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: '7d' },
  { key: 'last30', label: '30d' },
  { key: 'last90', label: '90d' },
  { key: 'thisMonth', label: 'This month' },
  { key: 'lastMonth', label: 'Last month' },
]

const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/**
 * Calendar ranges counted in the selected timezone. "Today" is whatever day
 * it is there right now; the arithmetic after that is plain calendar maths.
 */
export function presetRange(key: PresetKey, timezone: string, now: Date = new Date()): DateRange {
  const [y, m, d] = formatInTimeZone(now, timezone || 'UTC', 'yyyy-MM-dd').split('-').map(Number)
  const today = new Date(y, m - 1, d)
  const shift = (days: number) => new Date(y, m - 1, d + days)
  switch (key) {
    case 'today':
      return { from: ymd(today), to: ymd(today) }
    case 'yesterday':
      return { from: ymd(shift(-1)), to: ymd(shift(-1)) }
    case 'last7':
      return { from: ymd(shift(-6)), to: ymd(today) }
    case 'last30':
      return { from: ymd(shift(-29)), to: ymd(today) }
    case 'last90':
      return { from: ymd(shift(-89)), to: ymd(today) }
    case 'thisMonth':
      return { from: ymd(new Date(y, m - 1, 1)), to: ymd(today) }
    case 'lastMonth':
      return { from: ymd(new Date(y, m - 2, 1)), to: ymd(new Date(y, m - 1, 0)) }
  }
}

const ENGAGEMENT_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90]

export default function ReportsToolbar({
  dateRange,
  onDateRangeChange,
  timezone,
  onTimezoneChange,
  engagementMinutes,
  onEngagementMinutesChange,
  webinars,
  selectedWebinars,
  onSelectedWebinarsChange,
  loading,
}: ReportsToolbarProps) {
  const activePreset = useMemo(() => {
    if (!timezone) return null
    return PRESETS.find(p => {
      const r = presetRange(p.key, timezone)
      return r.from === dateRange.from && r.to === dateRange.to
    })?.key
  }, [dateRange, timezone])

  // Threshold: a handful of presets, plus "Custom…" for any 1-180 minutes.
  // The custom value applies on blur / Enter rather than on every keystroke,
  // since each change refetches the whole report.
  const isPreset = ENGAGEMENT_OPTIONS.includes(engagementMinutes)
  const [customOpen, setCustomOpen] = useState(false)
  const [customValue, setCustomValue] = useState(String(engagementMinutes))
  useEffect(() => {
    setCustomValue(String(engagementMinutes))
  }, [engagementMinutes])
  const commitCustom = () => {
    const n = Math.round(Number(customValue))
    if (n >= 1 && n <= 180) {
      if (n !== engagementMinutes) onEngagementMinutesChange(n)
    } else {
      setCustomValue(String(engagementMinutes))
    }
  }
  const showCustom = customOpen || !isPreset

  const dayCount = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return 0
    const [fy, fm, fd] = dateRange.from.split('-').map(Number)
    const [ty, tm, td] = dateRange.to.split('-').map(Number)
    const diff = (new Date(ty, tm - 1, td).getTime() - new Date(fy, fm - 1, fd).getTime()) / 86_400_000
    return Math.round(diff) + 1
  }, [dateRange])

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
        {/* Range */}
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" aria-hidden />
          <div className="inline-flex rounded-lg bg-gray-100 p-0.5" role="group" aria-label="Quick date ranges">
            {PRESETS.map(p => (
              <button
                key={p.key}
                type="button"
                disabled={!timezone}
                onClick={() => onDateRangeChange(presetRange(p.key, timezone))}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  activePreset === p.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="inline-flex items-center gap-1.5">
            <input
              type="date"
              value={dateRange.from}
              max={dateRange.to || undefined}
              onChange={e => onDateRangeChange({ ...dateRange, from: e.target.value })}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              aria-label="From date"
            />
            <span className="text-xs text-gray-400">→</span>
            <input
              type="date"
              value={dateRange.to}
              min={dateRange.from || undefined}
              onChange={e => onDateRangeChange({ ...dateRange, to: e.target.value })}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              aria-label="To date"
            />
            {dayCount > 0 && (
              <span className="hidden text-xs tabular-nums text-gray-400 md:inline">
                {dayCount} {dayCount === 1 ? 'day' : 'days'}
              </span>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="inline-flex items-center gap-2 text-sm text-gray-600">
            <Timer className="h-4 w-4 text-gray-400" aria-hidden />
            <span className="hidden lg:inline">Engaged after</span>
            <select
              value={showCustom ? 'custom' : String(engagementMinutes)}
              onChange={e => {
                if (e.target.value === 'custom') {
                  setCustomOpen(true)
                  setCustomValue(String(engagementMinutes))
                } else {
                  setCustomOpen(false)
                  onEngagementMinutesChange(Number(e.target.value))
                }
              }}
              className="rounded-md border border-gray-300 bg-white py-1 pl-2 pr-7 text-sm text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              title="Minutes someone must watch to count as engaged"
            >
              {ENGAGEMENT_OPTIONS.map(m => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
              <option value="custom">Custom…</option>
            </select>
            {showCustom && (
              <span className="inline-flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={customValue}
                  onChange={e => setCustomValue(e.target.value)}
                  onBlur={commitCustom}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitCustom()
                  }}
                  className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  aria-label="Custom engagement threshold in minutes"
                />
                <span className="text-xs text-gray-500">min</span>
              </span>
            )}
          </label>

          <TimezoneSelector
            value={timezone}
            onChange={onTimezoneChange}
            disabled={loading}
            showHint={false}
            className="[&_select]:py-1 [&_select]:text-sm"
          />
        </div>
      </div>

      {webinars.length > 0 && (
        <div className="flex flex-wrap items-start gap-3 border-t border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2 pt-1.5 text-sm text-gray-600">
            <Filter className="h-4 w-4 text-gray-400" aria-hidden />
            <span>Webinars</span>
          </div>
          <div className="min-w-[260px] flex-1 [&_button]:py-1.5 [&_button]:text-sm">
            <MultiSelect
              options={webinars.map(w => w.title)}
              selected={selectedWebinars.map(id => webinars.find(w => w.id === id)?.title || id)}
              onChange={titles => {
                const ids = titles
                  .map(title => webinars.find(w => w.title === title)?.id)
                  .filter((id): id is string => Boolean(id))
                onSelectedWebinarsChange(ids)
              }}
              placeholder="All webinars"
            />
          </div>
          {selectedWebinars.length > 0 && (
            <button
              type="button"
              onClick={() => onSelectedWebinarsChange([])}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}
