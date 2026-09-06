'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Columns3, Download, RefreshCw } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { useTimezonePreference } from '@/lib/useTimezonePreference'
import { formatCount, formatCurrency, formatPercent } from '@/lib/reports/columns'
import { CompareRow } from '@/lib/reports/compare'
import { downloadCsv } from '@/lib/reports/csv'
import ReportsSubNav from '@/components/reports/ReportsSubNav'
import ReportsToolbar, {
  DateRange,
  isPresetKey,
  presetRange,
  WebinarOption,
} from '@/components/reports/ReportsToolbar'
import {
  applyRegistrantFilterParams,
  EMPTY_REGISTRANT_FILTERS,
  RegistrantFilters,
  sanitizeRegistrantFilters,
} from '@/lib/reports/registrantFilters'

// Shared with the Key Metrics tab, so the range/filters follow you between tabs.
const DATE_RANGE_KEY = 'reportDateRange.v1'
const REGISTRANT_FILTERS_KEY = 'reportRegistrantFilters.v1'
const ENGAGEMENT_KEY = 'reportEngagementMinutes'
// Compare keeps its own webinar selection: on Key Metrics "no selection" means
// "everything pooled", here it means "nothing to compare yet".
const COMPARE_WEBINARS_KEY = 'reportCompareWebinars.v1'

/** Same restore rule as the Key Metrics tab: presets stay relative. */
function loadStoredRange(timezone: string): DateRange | null {
  try {
    const raw = localStorage.getItem(DATE_RANGE_KEY)
    if (!raw) return null
    const stored = JSON.parse(raw)
    if (typeof stored?.preset === 'string' && isPresetKey(stored.preset)) {
      return presetRange(stored.preset, timezone)
    }
    if (typeof stored?.from === 'string' && typeof stored?.to === 'string' && stored.from && stored.to) {
      return { from: stored.from, to: stored.to }
    }
  } catch {
    /* ignore */
  }
  return null
}

type MetricKind = 'count' | 'percent' | 'currency'

interface MetricDef {
  key: keyof CompareRow
  label: string
  kind: MetricKind
  /**
   * Whether a winner is highlighted, and which direction wins. Only rates and
   * per-order value get one: raw counts just mirror audience size, and calling
   * the biggest webinar the "winner" on every row would be noise.
   */
  best: 'high' | null
}

function metricGroups(engagementMinutes: number): { title: string; metrics: MetricDef[] }[] {
  return [
    {
      title: 'Sign-ups in range',
      metrics: [
        { key: 'registrations', label: 'Registrations', kind: 'count', best: null },
        { key: 'liveAttendees', label: 'Live attendees', kind: 'count', best: null },
        { key: 'replayAttendees', label: 'Replay attendees', kind: 'count', best: null },
        { key: 'totalAttendees', label: 'Total attendees', kind: 'count', best: null },
        { key: 'attendanceRate', label: '% Attended (live + replay)', kind: 'percent', best: 'high' },
        { key: 'engaged', label: `Engaged ≥ ${engagementMinutes} min`, kind: 'count', best: null },
        { key: 'engagedRate', label: '% Engaged of attendees', kind: 'percent', best: 'high' },
        { key: 'engagedPerRegistered', label: '% Engaged of registered', kind: 'percent', best: 'high' },
      ],
    },
    {
      title: 'Sessions that ran in range',
      metrics: [
        { key: 'sessionRegistered', label: 'Registered (session ran)', kind: 'count', best: null },
        { key: 'sessionSettled', label: 'Sessions finished', kind: 'count', best: null },
        { key: 'sessionLive', label: 'Attended live', kind: 'count', best: null },
        { key: 'sessionMissed', label: 'Missed', kind: 'count', best: null },
        { key: 'sessionUpcoming', label: 'Not finished yet', kind: 'count', best: null },
        { key: 'sessionAttendanceRate', label: '% Live attendance', kind: 'percent', best: 'high' },
        { key: 'sessionEngagedRate', label: `% Engaged of live (≥ ${engagementMinutes} min)`, kind: 'percent', best: 'high' },
        { key: 'sessionEngagedPerRegistered', label: '% Engaged of registered', kind: 'percent', best: 'high' },
        { key: 'sessionReplay', label: 'Caught the replay', kind: 'count', best: null },
        { key: 'sessionReplayRate', label: '% Replay recovery', kind: 'percent', best: 'high' },
      ],
    },
    {
      title: 'Sales & revenue',
      metrics: [
        { key: 'salesCount', label: 'Sales', kind: 'count', best: null },
        { key: 'revenueTotal', label: 'Revenue', kind: 'currency', best: null },
        { key: 'averageOrderValue', label: 'Average order value', kind: 'currency', best: 'high' },
      ],
    },
  ]
}

function formatMetric(kind: MetricKind, value: number | null): string {
  if (value === null || value === undefined) return '—'
  if (kind === 'percent') return formatPercent(value)
  if (kind === 'currency') return formatCurrency(value)
  return formatCount(Math.round(value))
}

/** The winning value in a row, or null when there's nothing to crown. */
function bestValue(values: (number | null)[], best: MetricDef['best']): number | null {
  if (!best) return null
  const nums = values.filter((v): v is number => typeof v === 'number')
  if (nums.length < 2) return null
  const max = Math.max(...nums)
  if (nums.every(v => v === max)) return null
  return max
}

export default function CompareReportsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<CompareRow[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' })
  const { timezone, setTimezone } = useTimezonePreference()
  const [engagementMinutes, setEngagementMinutes] = useState(30)
  const [webinars, setWebinars] = useState<WebinarOption[]>([])
  const [selectedWebinars, setSelectedWebinars] = useState<string[]>([])
  const [countryOptions, setCountryOptions] = useState<string[]>([])
  const [timezoneOptions, setTimezoneOptions] = useState<string[]>([])
  const [registrantFilters, setRegistrantFilters] = useState<RegistrantFilters>(EMPTY_REGISTRANT_FILTERS)
  const requestRef = useRef<AbortController | null>(null)
  const rangeSeeded = useRef(false)
  const selectionSeeded = useRef(false)

  // Shared-with-Key-Metrics preferences: engagement threshold and registrant filter.
  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(ENGAGEMENT_KEY))
      if (stored > 0) setEngagementMinutes(stored)
    } catch {
      /* ignore */
    }
    try {
      const raw = localStorage.getItem(REGISTRANT_FILTERS_KEY)
      if (raw) setRegistrantFilters(sanitizeRegistrantFilters(JSON.parse(raw)))
    } catch {
      /* ignore */
    }
  }, [])
  const changeEngagementMinutes = useCallback((minutes: number) => {
    setEngagementMinutes(minutes)
    try {
      localStorage.setItem(ENGAGEMENT_KEY, String(minutes))
    } catch {
      /* ignore */
    }
  }, [])
  const changeRegistrantFilters = useCallback((filters: RegistrantFilters) => {
    setRegistrantFilters(filters)
    try {
      localStorage.setItem(REGISTRANT_FILTERS_KEY, JSON.stringify(filters))
    } catch {
      /* ignore */
    }
  }, [])

  // Seed the range once the timezone is known — same rule as Key Metrics.
  useEffect(() => {
    if (!timezone || rangeSeeded.current) return
    rangeSeeded.current = true
    if (!dateRange.from) setDateRange(loadStoredRange(timezone) ?? presetRange('last7', timezone))
  }, [timezone, dateRange.from])

  // The comparison set survives a refresh.
  const changeSelectedWebinars = useCallback((ids: string[]) => {
    setSelectedWebinars(ids)
    try {
      localStorage.setItem(COMPARE_WEBINARS_KEY, JSON.stringify(ids))
    } catch {
      /* ignore */
    }
  }, [])

  // Filter option lists (countries / timezones on file).
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const res = await fetch('/api/reports/filter-options')
        if (!res.ok) return
        const data = await res.json()
        setCountryOptions(Array.isArray(data.countries) ? data.countries : [])
        setTimezoneOptions(Array.isArray(data.timezones) ? data.timezones : [])
      } catch (err) {
        console.error('Error fetching report filter options:', err)
      }
    }
    fetchFilterOptions()
  }, [])

  // Internal + external webinars to choose from, then restore last selection
  // pruned to webinars that still exist.
  useEffect(() => {
    const fetchWebinars = async () => {
      try {
        const [internalRes, externalRes] = await Promise.all([
          fetch('/api/webinars').catch(() => null),
          fetch('/api/external-webinars').catch(() => null),
        ])
        const internalData = internalRes?.ok ? await internalRes.json() : { webinars: [] }
        const externalData = externalRes?.ok ? await externalRes.json() : []
        const internalList = internalData.webinars ?? internalData
        const internal: WebinarOption[] = Array.isArray(internalList)
          ? internalList.map((w: any) => ({ id: w.id, title: w.internalName || w.title }))
          : []
        const external: WebinarOption[] = Array.isArray(externalData)
          ? externalData.map((w: any) => ({ id: `ext_${w.id}`, title: `${w.externalWebinarName || w.name} (External)` }))
          : []
        const all = [...internal, ...external]
        setWebinars(all)
        if (!selectionSeeded.current) {
          selectionSeeded.current = true
          try {
            const raw = localStorage.getItem(COMPARE_WEBINARS_KEY)
            const stored: unknown = raw ? JSON.parse(raw) : []
            const known = new Set(all.map(w => w.id))
            if (Array.isArray(stored)) {
              setSelectedWebinars(stored.filter((id): id is string => typeof id === 'string' && known.has(id)))
            }
          } catch {
            /* ignore */
          }
        }
      } catch (err) {
        console.error('Error fetching webinars:', err)
      }
    }
    fetchWebinars()
  }, [])

  const fetchComparison = useCallback(async () => {
    requestRef.current?.abort()
    if (!dateRange.from || !dateRange.to || !timezone || selectedWebinars.length === 0) {
      setRows([])
      setLoading(false)
      return
    }
    const controller = new AbortController()
    requestRef.current = controller

    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to,
        engagementMinutes: String(engagementMinutes),
        timezone,
        webinarIds: selectedWebinars.join(','),
      })
      applyRegistrantFilterParams(params, registrantFilters)
      const response = await fetch(`/api/reports/compare?${params.toString()}`, { signal: controller.signal })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || `Comparison request failed (${response.status})`)
      }
      const data = await response.json()
      setRows(Array.isArray(data.webinars) ? data.webinars : [])
      setLastUpdated(new Date())
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      console.error('Error fetching comparison:', err)
      setError(err?.message || 'Could not load the comparison')
    } finally {
      if (requestRef.current === controller) setLoading(false)
    }
  }, [dateRange, engagementMinutes, selectedWebinars, timezone, registrantFilters])

  useEffect(() => {
    fetchComparison()
    return () => requestRef.current?.abort()
  }, [fetchComparison])

  const groups = useMemo(() => metricGroups(engagementMinutes), [engagementMinutes])

  const exportCsv = () => {
    const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
    const lines: string[] = [['Metric', ...rows.map(r => r.name)].map(escape).join(',')]
    for (const group of groups) {
      for (const m of group.metrics) {
        lines.push(
          [m.label, ...rows.map(r => formatMetric(m.kind, r[m.key] as number | null))].map(escape).join(',')
        )
      }
    }
    downloadCsv(`webinar-comparison-${dateRange.from}-to-${dateRange.to}.csv`, lines.join('\n'))
  }

  const rangeLabel =
    dateRange.from && dateRange.to && timezone
      ? `${formatInTimeZone(new Date(`${dateRange.from}T12:00:00Z`), 'UTC', 'MMM d')} – ${formatInTimeZone(
          new Date(`${dateRange.to}T12:00:00Z`),
          'UTC',
          'MMM d, yyyy'
        )}`
      : ''

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Compare Webinars</h1>
            <p className="mt-1 text-sm text-gray-500">
              The webinars you pick, side by side
              {rangeLabel && <span className="text-gray-400"> · {rangeLabel}</span>}
            </p>
          </div>
          <ReportsSubNav />
        </div>

        <ReportsToolbar
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          timezone={timezone}
          onTimezoneChange={setTimezone}
          engagementMinutes={engagementMinutes}
          onEngagementMinutesChange={changeEngagementMinutes}
          webinars={webinars}
          selectedWebinars={selectedWebinars}
          onSelectedWebinarsChange={changeSelectedWebinars}
          countryOptions={countryOptions}
          timezoneOptions={timezoneOptions}
          registrantFilters={registrantFilters}
          onRegistrantFiltersChange={changeRegistrantFilters}
          loading={loading}
        />

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <div className="font-medium">Could not load the comparison</div>
              <div className="mt-0.5 text-red-700">{error}</div>
            </div>
            <Button size="sm" variant="outline" onClick={fetchComparison}>
              Retry
            </Button>
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-2.5">
            <div className="text-sm text-gray-600">
              {selectedWebinars.length > 0 ? (
                <>
                  Comparing <span className="font-medium text-gray-900">{rows.length || selectedWebinars.length}</span>{' '}
                  {(rows.length || selectedWebinars.length) === 1 ? 'webinar' : 'webinars'}
                  {lastUpdated && (
                    <span className="ml-2 text-xs text-gray-400">
                      Updated {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </>
              ) : (
                'No webinars selected'
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={fetchComparison} disabled={loading || selectedWebinars.length === 0}>
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="ml-1.5">Refresh</span>
              </Button>
              <Button size="sm" variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
                <Download className="h-3.5 w-3.5" />
                <span className="ml-1.5">Export CSV</span>
              </Button>
            </div>
          </div>

          {selectedWebinars.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Columns3 className="mx-auto h-10 w-10 text-gray-300" />
              <h3 className="mt-3 text-base font-medium text-gray-900">Pick the webinars to compare</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                Choose two or more webinars in the Webinars filter above and they&apos;ll line up here, one column
                each. Your pick is remembered for next time.
              </p>
            </div>
          ) : loading && rows.length === 0 ? (
            <div className="space-y-3 px-4 py-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-6 animate-pulse rounded bg-gray-100" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500">
              Nothing to show for this selection and range.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="sticky left-0 z-10 bg-white px-4 py-3 text-left font-semibold text-gray-700">
                      Metric
                    </th>
                    {rows.map(w => (
                      <th key={w.id} className="min-w-[150px] px-4 py-3 text-right align-bottom font-semibold text-gray-700">
                        <div>{w.name}</div>
                        {w.isExternal && (
                          <div className="mt-0.5 text-[11px] font-normal uppercase tracking-wide text-gray-400">
                            External
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={loading ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
                  {groups.map(group => (
                    <React.Fragment key={group.title}>
                      <tr className="bg-gray-50">
                        <td
                          colSpan={1 + rows.length}
                          className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500"
                        >
                          {group.title}
                        </td>
                      </tr>
                      {group.metrics.map(m => {
                        const values = rows.map(r => r[m.key] as number | null)
                        const winner = bestValue(values, m.best)
                        return (
                          <tr key={String(m.key)} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="sticky left-0 z-10 bg-white px-4 py-2.5 text-gray-600">{m.label}</td>
                            {rows.map((r, i) => {
                              const isBest = winner !== null && values[i] === winner
                              return (
                                <td
                                  key={r.id}
                                  className={`px-4 py-2.5 text-right tabular-nums ${
                                    isBest ? 'bg-emerald-50/70 font-semibold text-emerald-700' : 'text-gray-900'
                                  }`}
                                >
                                  {formatMetric(m.kind, values[i])}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400">
          The green cell is the best rate in its row. Sales and revenue are unknowable for external webinars, so
          they show as —. Ad spend is account-level and can&apos;t be split per webinar, which is why cost metrics
          live on the Key Metrics tab only.
        </p>
      </div>
    </DashboardLayout>
  )
}
