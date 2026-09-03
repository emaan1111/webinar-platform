'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CalendarX2, RefreshCw } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { useTimezonePreference } from '@/lib/useTimezonePreference'
import { computeTotals, ReportRow } from '@/lib/reports/columns'
import { buildReportCsv, downloadCsv } from '@/lib/reports/csv'
import { sortReports } from '@/lib/reports/state'
import { useReportGrid } from '@/lib/reports/useReportGrid'
import ReportsSubNav from '@/components/reports/ReportsSubNav'
import ReportsToolbar, { DateRange, isPresetKey, matchPresetKey, presetRange, WebinarOption } from '@/components/reports/ReportsToolbar'
import {
  applyRegistrantFilterParams,
  EMPTY_REGISTRANT_FILTERS,
  RegistrantFilters,
} from '@/lib/reports/registrantFilters'
import SummaryTiles from '@/components/reports/SummaryTiles'
import GridToolbar from '@/components/reports/GridToolbar'
import ReportsTable from '@/components/reports/ReportsTable'
import ColumnsDrawer from '@/components/reports/ColumnsDrawer'

const ENGAGEMENT_KEY = 'reportEngagementMinutes'
const DATE_RANGE_KEY = 'reportDateRange.v1'
const REGISTRANT_FILTERS_KEY = 'reportRegistrantFilters.v1'

/**
 * Restore the saved date range. A preset ("last 7 days") is re-evaluated
 * against today, so it stays relative; explicit dates come back as picked.
 */
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

function loadStoredRegistrantFilters(): RegistrantFilters {
  try {
    const raw = localStorage.getItem(REGISTRANT_FILTERS_KEY)
    if (!raw) return EMPTY_REGISTRANT_FILTERS
    const stored = JSON.parse(raw)
    return {
      countries: Array.isArray(stored?.countries) ? stored.countries.filter((v: unknown) => typeof v === 'string') : [],
      countriesMode: stored?.countriesMode === 'exclude' ? 'exclude' : 'include',
      timezones: Array.isArray(stored?.timezones) ? stored.timezones.filter((v: unknown) => typeof v === 'string') : [],
      timezonesMode: stored?.timezonesMode === 'exclude' ? 'exclude' : 'include',
    }
  } catch {
    return EMPTY_REGISTRANT_FILTERS
  }
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reports, setReports] = useState<ReportRow[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' })
  // Which zone the day buckets are cut in - remembered across visits.
  const { timezone, setTimezone } = useTimezonePreference()
  const [engagementMinutes, setEngagementMinutes] = useState(30)
  const [fbWarning, setFbWarning] = useState<string | null>(null)
  const [coverageWarning, setCoverageWarning] = useState<string | null>(null)
  const [webinars, setWebinars] = useState<WebinarOption[]>([])
  const [selectedWebinars, setSelectedWebinars] = useState<string[]>([])
  const [countryOptions, setCountryOptions] = useState<string[]>([])
  const [timezoneOptions, setTimezoneOptions] = useState<string[]>([])
  const [registrantFilters, setRegistrantFilters] = useState<RegistrantFilters>(EMPTY_REGISTRANT_FILTERS)
  const [filterNote, setFilterNote] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const requestRef = useRef<AbortController | null>(null)
  const rangeSeeded = useRef(false)

  const grid = useReportGrid()

  // Engagement threshold survives a refresh.
  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(ENGAGEMENT_KEY))
      if (stored > 0) setEngagementMinutes(stored)
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

  // Seed the range exactly once, when the timezone is first known: whatever
  // was used last visit, else the default (last 7 days). Switching zones keeps
  // the dates you picked, and a date input that is momentarily empty mid-edit
  // must not snap the range back.
  useEffect(() => {
    if (!timezone || rangeSeeded.current) return
    rangeSeeded.current = true
    if (!dateRange.from) setDateRange(loadStoredRange(timezone) ?? presetRange('last7', timezone))
  }, [timezone, dateRange.from])

  // Remember the range for the next visit. An active preset is stored by name
  // so "7d" is still the LAST 7 days tomorrow; custom dates are stored as-is.
  useEffect(() => {
    if (!rangeSeeded.current || !dateRange.from || !dateRange.to || !timezone) return
    try {
      const preset = matchPresetKey(dateRange, timezone)
      localStorage.setItem(
        DATE_RANGE_KEY,
        JSON.stringify(preset ? { preset } : { from: dateRange.from, to: dateRange.to })
      )
    } catch {
      /* ignore */
    }
  }, [dateRange, timezone])

  // Registrant country/timezone filter survives a refresh too.
  useEffect(() => {
    setRegistrantFilters(loadStoredRegistrantFilters())
  }, [])
  const changeRegistrantFilters = useCallback((filters: RegistrantFilters) => {
    setRegistrantFilters(filters)
    try {
      localStorage.setItem(REGISTRANT_FILTERS_KEY, JSON.stringify(filters))
    } catch {
      /* ignore */
    }
  }, [])

  // The countries and timezones actually on file, for the filter dropdowns.
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

  // Internal + external webinars for the filter.
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
        setWebinars([...internal, ...external])
      } catch (err) {
        console.error('Error fetching webinars:', err)
      }
    }
    fetchWebinars()
  }, [])

  const fetchReports = useCallback(async () => {
    if (!dateRange.from || !dateRange.to || !timezone) return
    requestRef.current?.abort()
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
      })
      if (selectedWebinars.length > 0) params.set('webinarIds', selectedWebinars.join(','))
      applyRegistrantFilterParams(params, registrantFilters)
      const response = await fetch(`/api/reports?${params.toString()}`, { signal: controller.signal })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || `Reports request failed (${response.status})`)
      }
      const data = await response.json()
      setReports(Array.isArray(data.reports) ? data.reports : [])
      setFbWarning(data.warning ?? null)
      // Registrations with no scheduled session time are invisible to every
      // session-clock column. Say so rather than quietly understating them.
      setCoverageWarning(data.coverageWarning ?? null)
      setFilterNote(data.filterNote ?? null)
      setLastUpdated(new Date())
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      console.error('Error fetching reports:', err)
      setError(err?.message || 'Could not load reports')
    } finally {
      if (requestRef.current === controller) setLoading(false)
    }
  }, [dateRange, engagementMinutes, selectedWebinars, timezone, registrantFilters])

  useEffect(() => {
    fetchReports()
    return () => requestRef.current?.abort()
  }, [fetchReports])

  const totals = useMemo(() => computeTotals(reports), [reports])

  // A drill-down has to carry the timezone, webinar filter and engagement
  // threshold the number was computed with, or it lists a different population
  // than the cell that was clicked.
  const buildDetailsHref = useCallback(
    (metric: string, dateParams: Record<string, string>) => {
      const params = new URLSearchParams({ ...dateParams, metric, engagementMinutes: String(engagementMinutes) })
      if (timezone) params.set('timezone', timezone)
      if (selectedWebinars.length > 0) params.set('webinarIds', selectedWebinars.join(','))
      applyRegistrantFilterParams(params, registrantFilters)
      return `/dashboard/reports/details?${params.toString()}`
    },
    [engagementMinutes, selectedWebinars, timezone, registrantFilters]
  )

  const exportCsv = () => {
    // Same rows, same order, same columns as the screen.
    const csv = buildReportCsv({
      columnIds: grid.columns,
      reports: sortReports(reports, grid.sort),
      totals,
      engagementMinutes,
    })
    downloadCsv(`webinar-reports-${dateRange.from}-to-${dateRange.to}.csv`, csv)
  }

  const openDrawer = useCallback(() => setDrawerOpen(true), [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

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
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Reports</h1>
            <p className="mt-1 text-sm text-gray-500">
              Facebook Ads and webinar performance, one row per day
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
          onSelectedWebinarsChange={setSelectedWebinars}
          countryOptions={countryOptions}
          timezoneOptions={timezoneOptions}
          registrantFilters={registrantFilters}
          onRegistrantFiltersChange={changeRegistrantFilters}
          loading={loading}
        />

        <SummaryTiles totals={totals} loading={loading} />

        {coverageWarning && (
          <Notice title="Some registrations have no session date">{coverageWarning}</Notice>
        )}

        {filterNote && <Notice title="Registrant filter active">{filterNote}</Notice>}

        {fbWarning && (
          <Notice title="Facebook Ads data unavailable">
            <p>{fbWarning}</p>
            <p className="mt-1.5">
              Get a new access token from the{' '}
              <a
                href="https://developers.facebook.com/tools/explorer/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline hover:text-amber-900"
              >
                Facebook Graph API Explorer
              </a>{' '}
              and update <code className="rounded bg-amber-100 px-1">FB_ACCESS_TOKEN</code>. See{' '}
              <code className="rounded bg-amber-100 px-1">FACEBOOK_TOKEN_REFRESH_GUIDE.md</code>.
            </p>
          </Notice>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <div className="font-medium">Could not load reports</div>
              <div className="mt-0.5 text-red-700">{error}</div>
            </div>
            <Button size="sm" variant="outline" onClick={fetchReports}>
              Retry
            </Button>
          </div>
        )}

        {/* Grid */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200">
            <GridToolbar
              grid={grid}
              loading={loading}
              canExport={reports.length > 0}
              lastUpdated={lastUpdated}
              onRefresh={fetchReports}
              onExport={exportCsv}
              onOpenColumns={openDrawer}
            />
          </div>

          {!loading && reports.length === 0 && !error ? (
            <div className="px-6 py-16 text-center">
              <CalendarX2 className="mx-auto h-10 w-10 text-gray-300" />
              <h3 className="mt-3 text-base font-medium text-gray-900">Nothing in this range</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                No days with activity between {dateRange.from} and {dateRange.to}. Try a wider range or clear the
                webinar filter.
              </p>
              <Button className="mt-5 inline-flex items-center gap-2" variant="outline" onClick={fetchReports}>
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
            </div>
          ) : (
            grid.hydrated && (
              <ReportsTable
                reports={reports}
                totals={totals}
                grid={grid}
                engagementMinutes={engagementMinutes}
                loading={loading}
                dateRange={dateRange}
                buildDetailsHref={buildDetailsHref}
                onOpenColumns={openDrawer}
              />
            )
          )}
        </div>

        <p className="text-xs text-gray-400">
          Tip: drag a column header to move it, click it to sort, hover for its menu. Use the{' '}
          <button type="button" onClick={openDrawer} className="underline decoration-dotted hover:text-gray-600">
            + button
          </button>{' '}
          at the end of the header row to add columns.
        </p>
      </div>

      <ColumnsDrawer open={drawerOpen} onClose={closeDrawer} grid={grid} engagementMinutes={engagementMinutes} />
    </DashboardLayout>
  )
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <div>
        <div className="font-medium">{title}</div>
        <div className="mt-0.5 text-amber-700">{children}</div>
      </div>
    </div>
  )
}
