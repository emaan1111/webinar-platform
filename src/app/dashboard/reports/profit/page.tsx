'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Copy, RefreshCw, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { useTimezonePreference } from '@/lib/useTimezonePreference'
import { computeTotals, formatCount, ReportRow } from '@/lib/reports/columns'
import ReportsSubNav from '@/components/reports/ReportsSubNav'
import ProfitSlider, { SliderSource } from '@/components/reports/ProfitSlider'
import ReportsToolbar, {
  DateRange,
  isPresetKey,
  presetRange,
  WebinarOption,
} from '@/components/reports/ReportsToolbar'
import {
  applyRegistrantFilterParams,
  EMPTY_REGISTRANT_FILTERS,
  parseRegistrantFilters,
  RegistrantFilters,
  sanitizeRegistrantFilters,
} from '@/lib/reports/registrantFilters'
import {
  baselineFromTotals,
  conversionScale,
  FxQuote,
  deriveRates,
  engagedConversionFromAttendees,
  engagedConversionFromRegistrations,
  inputsEqual,
  ProfitInputKey,
  ProfitInputs,
  projectScenario,
  sliderScale,
} from '@/lib/reports/profitModel'

// Shared with the other Reports tabs, so the range and filters follow you here.
const DATE_RANGE_KEY = 'reportDateRange.v1'
const REGISTRANT_FILTERS_KEY = 'reportRegistrantFilters.v1'
const ENGAGEMENT_KEY = 'reportEngagementMinutes'
// Key Metrics does not remember its webinar pick, so the planner keeps its own
// rather than resetting to "everything" on every visit.
const PROFIT_WEBINARS_KEY = 'reportProfitWebinars.v1'

/** Same restore rule as the other tabs: presets stay relative. */
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

type ScenarioKey = 'A' | 'B'

// Facebook bills in AUD and the offer is priced in USD, so no figure on this
// page carries a bare "$" - the report's own columns make the same distinction.
const money = (prefix: string) => (n: number, decimals = 0) =>
  `${n < 0 ? '−' : ''}${prefix}${Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`

/** Everything the model projects is AUD: revenue is converted before it lands. */
const aud = money('A$')
const usd = money('US$')

const people = (n: number) =>
  n.toLocaleString('en-US', { maximumFractionDigits: n < 10 ? 1 : 0 })

interface DialDef {
  key: ProfitInputKey
  label: string
  decimals: number
  prefix?: string
  suffix?: string
}

const TRAFFIC: DialDef[] = [
  { key: 'registrationsPerDay', label: 'Registrations a day', decimals: 0 },
  { key: 'costPerRegistration', label: 'Cost per registration', decimals: 2, prefix: 'A$' },
]
const OFFER: DialDef[] = [
  { key: 'price', label: 'Sale price', decimals: 0, prefix: 'US$' },
  { key: 'upsellRate', label: 'Take the upsell', decimals: 0, suffix: '%' },
  { key: 'upsellPrice', label: 'Upsell price', decimals: 0, prefix: 'US$' },
]
const SUBSCRIPTION: DialDef[] = [
  { key: 'renewMonths', label: 'Renews every', decimals: 0, suffix: 'mo' },
  { key: 'churnRate', label: 'Churn at each renewal', decimals: 0, suffix: '%' },
]

function ProfitPlannerPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<ReportRow[]>([])
  const [notices, setNotices] = useState<string[]>([])
  /** The rate the report converted at, so the planner converts identically. */
  const [fx, setFx] = useState<FxQuote | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' })
  const { timezone, setTimezone } = useTimezonePreference()
  const [engagementMinutes, setEngagementMinutes] = useState(30)
  const [webinars, setWebinars] = useState<WebinarOption[]>([])
  const [selectedWebinars, setSelectedWebinars] = useState<string[]>([])
  const [countryOptions, setCountryOptions] = useState<string[]>([])
  const [timezoneOptions, setTimezoneOptions] = useState<string[]>([])
  const [hasZoomSessions, setHasZoomSessions] = useState(false)
  const [registrantFilters, setRegistrantFilters] = useState<RegistrantFilters>(EMPTY_REGISTRANT_FILTERS)
  const requestRef = useRef<AbortController | null>(null)
  const rangeSeeded = useRef(false)
  const selectionSeeded = useRef(false)
  /** Filters handed over by the link from another Reports tab, read once. */
  const handover = useRef<URLSearchParams | null>(null)

  // Scenarios. Both start as whatever the report measured; `edited` marks the
  // ones the user has moved, which are then left alone when the data reloads.
  const [scenarios, setScenarios] = useState<Record<ScenarioKey, ProfitInputs> | null>(null)
  const [edited, setEdited] = useState<Record<ScenarioKey, boolean>>({ A: false, B: false })
  const [current, setCurrent] = useState<ScenarioKey>('B')

  // ---------------------------------------------------------------------
  // Filters: the link's query string first, then the shared preferences.
  // ---------------------------------------------------------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    handover.current = params

    // A link from another tab carries the whole filter, including the parts
    // that are switched off - so a handover is taken wholesale rather than
    // merged with whatever was remembered here last time.
    const handedOver = params.has('from') && params.has('to')
    const minutes = Number(params.get('engagementMinutes'))

    if (handedOver) {
      if (minutes > 0) setEngagementMinutes(minutes)
      setRegistrantFilters(parseRegistrantFilters(params))
      return
    }

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

  // Seed the range once the timezone is known, exactly as the other tabs do.
  useEffect(() => {
    if (!timezone || rangeSeeded.current) return
    rangeSeeded.current = true
    if (dateRange.from) return
    const params = handover.current
    const from = params?.get('from')
    const to = params?.get('to')
    if (from && to) setDateRange({ from, to })
    else setDateRange(loadStoredRange(timezone) ?? presetRange('last7', timezone))
  }, [timezone, dateRange.from])

  const changeSelectedWebinars = useCallback((ids: string[]) => {
    setSelectedWebinars(ids)
    try {
      localStorage.setItem(PROFIT_WEBINARS_KEY, JSON.stringify(ids))
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const res = await fetch('/api/reports/filter-options')
        if (!res.ok) return
        const data = await res.json()
        setCountryOptions(Array.isArray(data.countries) ? data.countries : [])
        setTimezoneOptions(Array.isArray(data.timezones) ? data.timezones : [])
        setHasZoomSessions(Boolean(data.hasZoomSessions))
      } catch (err) {
        console.error('Error fetching report filter options:', err)
      }
    }
    fetchFilterOptions()
  }, [])

  // Internal + external webinars, then the selection handed over in the link,
  // else the one remembered here, pruned to webinars that still exist.
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
          ? externalData.map((w: any) => ({
              id: `ext_${w.id}`,
              title: `${w.externalWebinarName || w.name} (External)`,
            }))
          : []
        const all = [...internal, ...external]
        setWebinars(all)
        if (selectionSeeded.current) return
        selectionSeeded.current = true
        const known = new Set(all.map(w => w.id))
        const keep = (ids: unknown) =>
          Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string' && known.has(id)) : []
        const handed = handover.current?.get('webinarIds')
        if (handed) {
          setSelectedWebinars(keep(handed.split(',').filter(Boolean)))
          return
        }
        try {
          const raw = localStorage.getItem(PROFIT_WEBINARS_KEY)
          if (raw) setSelectedWebinars(keep(JSON.parse(raw)))
        } catch {
          /* ignore */
        }
      } catch (err) {
        console.error('Error fetching webinars:', err)
      }
    }
    fetchWebinars()
  }, [])

  // ---------------------------------------------------------------------
  // The real numbers
  // ---------------------------------------------------------------------
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
        throw new Error(body.error || `Report request failed (${response.status})`)
      }
      const data = await response.json()
      setRows(Array.isArray(data.reports) ? data.reports : [])
      setFx(data.fx ?? null)
      setNotices(
        [data.warning, data.coverageWarning, data.filterNote].filter(
          (note: unknown): note is string => typeof note === 'string' && note.length > 0
        )
      )
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      console.error('Error fetching reports:', err)
      setError(err?.message || 'Could not load the report behind this plan')
    } finally {
      if (requestRef.current === controller) setLoading(false)
    }
  }, [dateRange, engagementMinutes, selectedWebinars, timezone, registrantFilters])

  useEffect(() => {
    fetchReports()
    return () => requestRef.current?.abort()
  }, [fetchReports])

  const totals = useMemo(() => computeTotals(rows), [rows])
  const baseline = useMemo(() => baselineFromTotals(totals, fx), [totals, fx])

  // New data re-seeds the untouched scenarios and leaves edited ones standing.
  useEffect(() => {
    setScenarios(prev => {
      if (!prev) return { A: { ...baseline.inputs }, B: { ...baseline.inputs } }
      return {
        A: edited.A ? prev.A : { ...baseline.inputs },
        B: edited.B ? prev.B : { ...baseline.inputs },
      }
    })
    // `edited` is read, not tracked: re-seeding is a reaction to new data only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseline])

  const isFromReport = useCallback(
    (key: ProfitInputKey): SliderSource =>
      baseline.fromReport.includes(key) ? 'report' : 'assumption',
    [baseline]
  )

  const setInput = useCallback(
    (key: ProfitInputKey, value: number) => {
      setScenarios(prev => (prev ? { ...prev, [current]: { ...prev[current], [key]: value } } : prev))
      setEdited(prev => ({ ...prev, [current]: true }))
    },
    [current]
  )

  const setConversion = useCallback(
    (dial: 'registrations' | 'attendees' | 'engaged', value: number) => {
      setScenarios(prev => {
        if (!prev) return prev
        const scenario = prev[current]
        const conversionOfEngaged =
          dial === 'engaged'
            ? value
            : dial === 'attendees'
              ? engagedConversionFromAttendees(value, scenario)
              : engagedConversionFromRegistrations(value, scenario)
        return { ...prev, [current]: { ...scenario, conversionOfEngaged } }
      })
      setEdited(prev => ({ ...prev, [current]: true }))
    },
    [current]
  )

  const resetScenario = useCallback(
    (key: ScenarioKey) => {
      setScenarios(prev => (prev ? { ...prev, [key]: { ...baseline.inputs } } : prev))
      setEdited(prev => ({ ...prev, [key]: false }))
    },
    [baseline]
  )

  const copyScenario = useCallback((from: ScenarioKey, to: ScenarioKey) => {
    setScenarios(prev => (prev ? { ...prev, [to]: { ...prev[from] } } : prev))
    setEdited(prev => ({ ...prev, [to]: prev[from] }))
  }, [])

  // Slider travel is fixed by the seeded values, so a dial does not rescale
  // underneath the thumb while it is being dragged.
  const scales = useMemo(() => {
    const seedRates = deriveRates(baseline.inputs)
    return {
      dial: (key: ProfitInputKey) => sliderScale(key, baseline.inputs[key]),
      conversionOfRegistrations: conversionScale(seedRates.conversionOfRegistrations, 10),
      conversionOfAttendees: conversionScale(seedRates.conversionOfAttendees, 30),
      conversionOfEngaged: conversionScale(seedRates.conversionOfEngaged, 60),
    }
  }, [baseline])

  const other: ScenarioKey = current === 'A' ? 'B' : 'A'
  const scenario = scenarios?.[current] ?? baseline.inputs
  const comparison = scenarios?.[other] ?? baseline.inputs
  const rates = useMemo(() => deriveRates(scenario), [scenario])
  const comparisonRates = useMemo(() => deriveRates(comparison), [comparison])
  const results = useMemo(
    () => ({
      A: projectScenario(scenarios?.A ?? baseline.inputs),
      B: projectScenario(scenarios?.B ?? baseline.inputs),
    }),
    [scenarios, baseline]
  )

  const overSold = rates.conversionOfEngaged > 100.0001
  const firstYearGap = results.B.firstYear - results.A.firstYear
  const secondYearGap = results.B.secondYear - results.A.secondYear
  const sameOutcome = Math.abs(firstYearGap) < 0.5 && Math.abs(secondYearGap) < 0.5

  const rangeLabel =
    dateRange.from && dateRange.to
      ? `${formatInTimeZone(new Date(`${dateRange.from}T12:00:00Z`), 'UTC', 'MMM d')} – ${formatInTimeZone(
          new Date(`${dateRange.to}T12:00:00Z`),
          'UTC',
          'MMM d, yyyy'
        )}`
      : ''

  const scenarioCard = (key: ScenarioKey) => {
    const r = results[key]
    const active = key === current
    const losing = r.firstYear < 0
    // Labelled by the numbers, not by whether a slider was touched: drag one
    // away and back and this is the measured funnel again.
    const untouched = scenarios ? inputsEqual(scenarios[key], baseline.inputs) : true
    const accent = key === 'A' ? 'emerald' : 'amber'
    return (
      <button
        type="button"
        onClick={() => setCurrent(key)}
        aria-pressed={active}
        className={`min-w-[260px] flex-1 rounded-xl border-2 bg-white px-4 py-3.5 text-left transition-colors ${
          active
            ? accent === 'emerald'
              ? 'border-emerald-600'
              : 'border-amber-600'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
          <span
            className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-semibold ${
              active
                ? accent === 'emerald'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {key}
          </span>
          {key === 'A' ? 'Scenario A' : 'Scenario B'}
          <span className="text-gray-400">· {untouched ? 'as measured' : 'what if'}</span>
        </div>
        <div className="text-xs text-gray-500">First year profit</div>
        <div
          className={`mb-2 text-[34px] font-bold leading-none tracking-tight tabular-nums ${
            !active ? 'text-gray-400' : losing ? 'text-red-600' : 'text-emerald-700'
          }`}
        >
          {aud(r.firstYear)}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          {[
            { label: 'Second year', value: r.secondYear },
            { label: 'Month 1', value: r.firstMonth },
            { label: 'By month 12', value: r.twelfthMonth },
          ].map(item => (
            <div key={item.label}>
              <div className="text-[11px] text-gray-500">{item.label}</div>
              <div
                className={`text-[15px] font-bold tabular-nums ${active ? 'text-gray-900' : 'text-gray-400'}`}
              >
                {aud(item.value)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-[11px] text-gray-500">
          {people(r.customersPerMonth)} customers a month, {people(r.customersPerYear)} a year
        </div>
      </button>
    )
  }

  const dialSlider = (dial: DialDef) => (
    <ProfitSlider
      key={dial.key}
      id={`dial-${dial.key}`}
      label={dial.label}
      value={scenario[dial.key]}
      scale={scales.dial(dial.key)}
      decimals={dial.decimals}
      prefix={dial.prefix}
      suffix={dial.suffix}
      source={isFromReport(dial.key)}
      compareValue={comparison[dial.key]}
      compareLabel={other}
      tone={current === 'A' ? 'primary' : 'alt'}
      onChange={value => setInput(dial.key, value)}
      disabled={!scenarios}
    />
  )

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Profit Planner</h1>
            <p className="mt-1 text-sm text-gray-500">
              Your funnel, run forward a year — then dragged anywhere you like
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
          hasZoomSessions={hasZoomSessions}
          registrantFilters={registrantFilters}
          onRegistrantFiltersChange={changeRegistrantFilters}
          loading={loading}
        />

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <div className="font-medium">Could not load the report behind this plan</div>
              <div className="mt-0.5 text-red-700">{error}</div>
            </div>
            <Button size="sm" variant="outline" onClick={fetchReports}>
              Retry
            </Button>
          </div>
        )}

        {/* What the report actually measured, before any dial is touched. */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-2.5">
            <div className="text-sm font-medium text-gray-700">
              Measured over {totals ? `${totals.days} ${totals.days === 1 ? 'day' : 'days'}` : 'this range'}
              {selectedWebinars.length > 0 && (
                <span className="ml-1.5 text-sm font-normal text-gray-500">
                  · {selectedWebinars.length} {selectedWebinars.length === 1 ? 'webinar' : 'webinars'}
                </span>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={fetchReports} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="ml-1.5">Refresh</span>
            </Button>
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-100 sm:grid-cols-4 lg:grid-cols-7">
            {([
              { label: 'Registrations', value: totals ? formatCount(totals.registrations) : '—' },
              { label: 'Attendees', value: totals ? formatCount(totals.totalAttendees) : '—' },
              { label: `Engaged ≥ ${engagementMinutes}m`, value: totals ? formatCount(totals.engagedTotal) : '—' },
              { label: 'Sales', value: totals ? formatCount(totals.salesTotal) : '—' },
              { label: 'Revenue', value: totals ? usd(totals.revenue) : '—' },
              { label: 'Ad spend', value: totals ? aud(totals.spend) : '—' },
              {
                label: 'Profit',
                value: totals ? aud(totals.profit) : '—',
                tone: totals && totals.profit < 0 ? 'text-red-600' : 'text-emerald-700',
              },
            ] as { label: string; value: string; tone?: string }[]).map(stat => (
              <div key={stat.label} className="px-4 py-3">
                <div className="text-[11px] uppercase tracking-wide text-gray-500">{stat.label}</div>
                <div className={`mt-0.5 text-base font-semibold tabular-nums ${stat.tone ?? 'text-gray-900'}`}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
          {(baseline.notes.length > 0 || notices.length > 0) && (
            <div className="space-y-1 border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500">
              {baseline.notes.map(note => (
                <div key={note}>{note}</div>
              ))}
              {notices.map(note => (
                <div key={note}>{note}</div>
              ))}
            </div>
          )}
        </div>

        {/* Scenarios */}
        <div className="flex flex-wrap items-stretch gap-3">
          {scenarioCard('A')}
          {scenarioCard('B')}
          <div className="flex shrink-0 flex-col justify-center gap-1">
            <button
              type="button"
              onClick={() => copyScenario(current, other)}
              className="inline-flex items-center gap-1.5 text-left text-[13px] text-gray-500 underline underline-offset-4 hover:text-gray-900"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy {current} into {other}
            </button>
            <button
              type="button"
              onClick={() => resetScenario(current)}
              className="inline-flex items-center gap-1.5 text-left text-[13px] text-gray-500 underline underline-offset-4 hover:text-gray-900"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset {current} to the report
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <p
            className={`text-sm ${
              sameOutcome ? 'text-gray-600' : firstYearGap >= 0 ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {sameOutcome
              ? 'A and B come out the same.'
              : `B makes ${aud(Math.abs(firstYearGap))} ${
                  firstYearGap >= 0 ? 'more' : 'less'
                } than A in the first year, and ${aud(Math.abs(secondYearGap))} ${
                  secondYearGap >= 0 ? 'more' : 'less'
                } in the second.`}
          </p>
          <p className="text-sm text-gray-500">
            {current} runs {aud(results[current].adSpendPerMonth)} of ad spend a month.{' '}
            {scenario.upsellRate > 0 && scenario.upsellPrice > 0
              ? `Upsell subscribers ${
                  !Number.isFinite(results[current].subscriberLifetimeMonths)
                    ? 'never leave'
                    : results[current].subscriberLifetimeMonths >= 24
                      ? `stay about ${(results[current].subscriberLifetimeMonths / 12).toFixed(1)} years`
                      : `stay about ${Math.round(results[current].subscriberLifetimeMonths)} months`
                }.`
              : 'No upsell in this scenario — dial one in on the right to model it.'}
          </p>
        </div>

        {/* Dials */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3 text-sm text-gray-600">
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            Editing <span className="font-semibold text-gray-900">Scenario {current}</span>
            <span className="text-gray-400">
              — click the other card above to edit it instead
            </span>
          </div>

          <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <h2 className="mb-2.5 text-xs font-medium uppercase tracking-wide text-gray-500">Traffic</h2>
              {TRAFFIC.map(dialSlider)}

              <h2 className="mb-2.5 mt-5 text-xs font-medium uppercase tracking-wide text-gray-500">
                Attendance
              </h2>
              <ProfitSlider
                id="dial-showUpRate"
                label="Show up (live or replay)"
                value={scenario.showUpRate}
                scale={scales.dial('showUpRate')}
                suffix="%"
                source={isFromReport('showUpRate')}
                compareValue={comparison.showUpRate}
                compareLabel={other}
                tone={current === 'A' ? 'primary' : 'alt'}
                onChange={value => setInput('showUpRate', value)}
                disabled={!scenarios}
              />
              <ProfitSlider
                id="dial-engagedRate"
                label={`Stay ≥ ${engagementMinutes} min`}
                value={scenario.engagedRate}
                scale={scales.dial('engagedRate')}
                suffix="%"
                source={isFromReport('engagedRate')}
                compareValue={comparison.engagedRate}
                compareLabel={other}
                tone={current === 'A' ? 'primary' : 'alt'}
                onChange={value => setInput('engagedRate', value)}
                disabled={!scenarios}
              />
            </div>

            <div>
              <h2 className="mb-2.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                Conversion — set any one, the others follow
              </h2>
              <ProfitSlider
                id="dial-convReg"
                label="Of registrations"
                value={rates.conversionOfRegistrations}
                scale={scales.conversionOfRegistrations}
                decimals={2}
                suffix="%"
                source={isFromReport('conversionOfEngaged')}
                compareValue={comparisonRates.conversionOfRegistrations}
                compareLabel={other}
                tone={current === 'A' ? 'primary' : 'alt'}
                invalid={rates.conversionOfRegistrations > 100.0001}
                onChange={value => setConversion('registrations', value)}
                disabled={!scenarios}
              />
              <ProfitSlider
                id="dial-convAtt"
                label="Of attendees"
                value={rates.conversionOfAttendees}
                scale={scales.conversionOfAttendees}
                decimals={2}
                suffix="%"
                source={isFromReport('conversionOfEngaged')}
                compareValue={comparisonRates.conversionOfAttendees}
                compareLabel={other}
                tone={current === 'A' ? 'primary' : 'alt'}
                invalid={rates.conversionOfAttendees > 100.0001}
                onChange={value => setConversion('attendees', value)}
                disabled={!scenarios}
              />
              <ProfitSlider
                id="dial-convEng"
                label="Of engaged"
                value={rates.conversionOfEngaged}
                scale={scales.conversionOfEngaged}
                decimals={2}
                suffix="%"
                source={isFromReport('conversionOfEngaged')}
                compareValue={comparisonRates.conversionOfEngaged}
                compareLabel={other}
                tone={current === 'A' ? 'primary' : 'alt'}
                invalid={overSold}
                onChange={value => setConversion('engaged', value)}
                disabled={!scenarios}
              />
              {overSold && (
                <p className="-mt-2 mb-3 text-xs text-red-600">
                  That needs {rates.conversionOfEngaged.toFixed(0)}% of engaged attendees to buy. Lower it, or
                  raise attendance.
                </p>
              )}
              {!overSold && rates.salesPerDay > 0 && (
                <p className="-mt-2 mb-3 text-xs text-gray-500">
                  {people(rates.attendeesPerDay)} attendees a day, {people(rates.engagedPerDay)} of them engaged,{' '}
                  {people(rates.salesPerDay)} buying.
                </p>
              )}

              <h2 className="mb-2.5 mt-5 text-xs font-medium uppercase tracking-wide text-gray-500">
                Exchange
              </h2>
              <ProfitSlider
                id="dial-usdToAud"
                label="A$ per US$1"
                value={scenario.usdToAud}
                scale={scales.dial('usdToAud')}
                decimals={3}
                source={isFromReport('usdToAud')}
                compareValue={comparison.usdToAud}
                compareLabel={other}
                tone={current === 'A' ? 'primary' : 'alt'}
                onChange={value => setInput('usdToAud', value)}
                disabled={!scenarios}
              />
              <p className="-mt-2 mb-3 text-xs text-gray-500">
                Ads are billed in A$ and the offer is priced in US$, so every figure above is
                converted at this rate — the same one the report used.
              </p>
            </div>

            <div>
              <h2 className="mb-2.5 text-xs font-medium uppercase tracking-wide text-gray-500">Offer</h2>
              {OFFER.map(dialSlider)}

              <h2 className="mb-2.5 mt-5 text-xs font-medium uppercase tracking-wide text-gray-500">
                Upsell subscription
              </h2>
              {SUBSCRIPTION.map(dialSlider)}
            </div>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-gray-400">
          <span className="font-medium text-gray-500">Live</span> dials are measured over the range, webinars and
          filters set above; <span className="font-medium text-gray-500">Assumed</span> ones are not tracked
          anywhere in your reports, so they start at a guess and are yours to set. Profit is stated in A$, the
          currency the ad spend arrives in — US$ prices are converted first, so no figure here subtracts one
          currency from the other. The projection repeats the
          measured day, every day, for two years — it is arithmetic, not a forecast: it knows nothing of
          seasonality, rising ad costs or a saturating audience. Registrations a day is the range average, so a
          range that includes today counts a part-finished day. Ad spend is account-level, so filtering to one
          webinar narrows the registrations but not the cost behind them.
        </p>
      </div>
    </DashboardLayout>
  )
}

export default ProfitPlannerPage
