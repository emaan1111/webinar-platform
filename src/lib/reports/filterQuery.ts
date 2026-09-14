/**
 * The current Reports filter as a query string, so one tab can hand its view
 * to another. The Profit Planner is the one that reads it: opening it from
 * Key Metrics or Compare plans the exact range, webinars and filters you were
 * just looking at, instead of whatever it happened to remember.
 *
 * The timezone is left out on purpose - it is a dashboard-wide preference and
 * already the same on every tab.
 */

import { applyRegistrantFilterParams, RegistrantFilters } from './registrantFilters'

export interface ReportFilterSnapshot {
  dateRange: { from: string; to: string }
  engagementMinutes: number
  selectedWebinars: string[]
  registrantFilters: RegistrantFilters
}

export function reportFilterQuery({
  dateRange,
  engagementMinutes,
  selectedWebinars,
  registrantFilters,
}: ReportFilterSnapshot): string {
  if (!dateRange.from || !dateRange.to) return ''
  const params = new URLSearchParams({
    from: dateRange.from,
    to: dateRange.to,
    engagementMinutes: String(engagementMinutes),
  })
  if (selectedWebinars.length > 0) params.set('webinarIds', selectedWebinars.join(','))
  applyRegistrantFilterParams(params, registrantFilters)
  return params.toString()
}
