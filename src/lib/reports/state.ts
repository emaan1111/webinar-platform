/**
 * Pure helpers for the reports grid's column order, saved views and sorting.
 * No React in here so the behaviour can be unit-tested directly; the hook in
 * useReportGrid.ts wires these to state and localStorage.
 */

import { ALL_COLUMN_IDS, DATE_COLUMN_ID, getColumn, ReportRow } from './columns'
import { RegistrantFilters, sanitizeRegistrantFilters } from './registrantFilters'

export interface ReportView {
  id: string
  name: string
  description?: string
  columns: string[]
  /**
   * Registrant country/timezone filter snapshot taken when the view was
   * saved. Loading the view applies it - an empty snapshot clears the filter.
   * Absent on built-in views and views saved before filters existed; loading
   * those leaves whatever filter is active untouched.
   */
  filters?: RegistrantFilters
  /** Shipped with the app; cannot be edited or deleted. */
  builtIn?: boolean
  createdAt?: string
  updatedAt?: string
}

export const DEFAULT_VIEW_ID = 'essential'

export const PREDEFINED_VIEWS: ReportView[] = [
  {
    id: 'essential',
    name: 'Essential',
    description: 'Spend, traffic, who showed up, what it cost',
    builtIn: true,
    columns: [
      'date',
      'fbSpend',
      'fbClicks',
      'visitors',
      'registrations',
      'sessionRegistered',
      'sessionLive',
      'sessionUpcoming',
      'sessionAttendanceRate',
      'salesTotal',
      'registrationRate',
      'costPerRegistration',
    ],
  },
  {
    id: 'salesFocus',
    name: 'Sales',
    description: 'Sales, revenue, profit and ROI',
    builtIn: true,
    columns: [
      'date',
      'visitors',
      'registrations',
      'salesTotal',
      'salesLive',
      'salesReplay',
      'revenue',
      'liveRevenue',
      'replayRevenue',
      'averageOrderValue',
      'profit',
      'roi',
      'costPerSale',
      'costPerRegistration',
    ],
  },
  {
    id: 'engagement',
    name: 'Engagement',
    description: 'How long people actually watched',
    builtIn: true,
    columns: [
      'date',
      'registrations',
      'engagedTotal',
      'engagedLive',
      'engagedReplay',
      'engagementRateTotal',
      'engagementRateLive',
      'engagementRateReplay',
      'engagedPerVisitor',
      'engagedPerRegistered',
    ],
  },
  {
    id: 'liveVsReplay',
    name: 'Live vs Replay',
    description: 'Compare the live room with the replay',
    builtIn: true,
    columns: [
      'date',
      'sessionRegistered',
      'sessionLive',
      'sessionReplay',
      'sessionMissed',
      'sessionUpcoming',
      'sessionAttendanceRate',
      'sessionReplayRate',
      'sessionEngaged',
      'sessionEngagementRateLive',
      'liveRevenue',
      'replayRevenue',
    ],
  },
  {
    id: 'facebook',
    name: 'Facebook Ads',
    description: 'Ad delivery and what it bought',
    builtIn: true,
    columns: [
      'date',
      'fbSpend',
      'fbImpressions',
      'fbClicks',
      'fbCtr',
      'fbCpm',
      'fbCpc',
      'visitors',
      'registrations',
      'costPerRegistration',
    ],
  },
  {
    id: 'comprehensive',
    name: 'Everything',
    description: 'Every available column',
    builtIn: true,
    columns: ALL_COLUMN_IDS,
  },
]

export const isBuiltInView = (id: string) => PREDEFINED_VIEWS.some(v => v.id === id)

/**
 * Drops unknown ids, removes duplicates and pins the date column first.
 * Saved views may reference columns that no longer exist.
 */
export function normalizeColumnIds(ids: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of ids) {
    if (id === DATE_COLUMN_ID || seen.has(id) || !getColumn(id)) continue
    seen.add(id)
    out.push(id)
  }
  return [DATE_COLUMN_ID, ...out]
}

export const sameOrder = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id, i) => id === b[i])

/** Move the item at `from` so it lands at `to`. The date column never moves. */
export function moveColumn(ids: readonly string[], from: number, to: number): string[] {
  if (from === to || from <= 0 || to <= 0 || from >= ids.length || to >= ids.length) {
    return [...ids]
  }
  const next = [...ids]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export function moveColumnBy(ids: readonly string[], id: string, delta: number): string[] {
  const from = ids.indexOf(id)
  if (from === -1) return [...ids]
  const to = Math.min(Math.max(from + delta, 1), ids.length - 1)
  return moveColumn(ids, from, to)
}

/**
 * Place `id` immediately before or after `targetId`. Used by header
 * drag-and-drop, where the drop side depends on which half of the header the
 * pointer was over.
 */
export function moveColumnRelative(
  ids: readonly string[],
  id: string,
  targetId: string,
  side: 'before' | 'after'
): string[] {
  if (id === targetId || id === DATE_COLUMN_ID) return [...ids]
  const without = ids.filter(x => x !== id)
  let index = without.indexOf(targetId)
  if (index === -1) return [...ids]
  if (side === 'after') index += 1
  // Nothing goes before the date column.
  index = Math.max(index, 1)
  without.splice(index, 0, id)
  return without
}

/** Add a column (at the end, or at `index`) if it is not already shown. */
export function addColumn(ids: readonly string[], id: string, index?: number): string[] {
  if (ids.includes(id) || !getColumn(id)) return [...ids]
  const next = [...ids]
  const at = index == null ? next.length : Math.min(Math.max(index, 1), next.length)
  next.splice(at, 0, id)
  return next
}

export function removeColumn(ids: readonly string[], id: string): string[] {
  if (id === DATE_COLUMN_ID) return [...ids]
  return ids.filter(x => x !== id)
}

export function toggleColumn(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? removeColumn(ids, id) : addColumn(ids, id)
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

export type SortDirection = 'asc' | 'desc'

export interface SortState {
  columnId: string
  direction: SortDirection
}

/** asc → desc → off, the way most spreadsheets cycle a header click. */
export function nextSort(current: SortState | null, columnId: string): SortState | null {
  if (!current || current.columnId !== columnId) return { columnId, direction: 'asc' }
  if (current.direction === 'asc') return { columnId, direction: 'desc' }
  return null
}

export function sortReports(rows: readonly ReportRow[], sort: SortState | null): ReportRow[] {
  if (!sort) return [...rows]
  const col = getColumn(sort.columnId)
  if (!col) return [...rows]
  const sign = sort.direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const av = col.value(a)
    const bv = col.value(b)
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sign
    return String(av).localeCompare(String(bv)) * sign
  })
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export type Density = 'comfortable' | 'compact'

export const STORAGE_KEYS = {
  /** Custom views - same key and shape the old page used, so nothing is lost. */
  savedViews: 'reportViews',
  defaultView: 'reportDefaultView',
  /** Whatever the grid currently shows, saved or not, so a refresh keeps it. */
  working: 'reportGrid.working.v1',
} as const

export interface WorkingState {
  viewId: string
  columns: string[]
  sort: SortState | null
  density: Density
}

export function parseSavedViews(raw: string | null): ReportView[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(v => v && typeof v.id === 'string' && typeof v.name === 'string' && Array.isArray(v.columns))
      .map(v => ({
        id: v.id,
        name: v.name,
        columns: normalizeColumnIds(v.columns),
        // Absent stays absent (load must not touch the active filter); present
        // is sanitized, so a corrupt snapshot degrades to "clears the filter".
        ...(v.filters !== undefined ? { filters: sanitizeRegistrantFilters(v.filters) } : {}),
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      }))
  } catch {
    return []
  }
}

export function parseWorkingState(raw: string | null): WorkingState | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.columns)) return null
    const sort =
      parsed.sort && typeof parsed.sort.columnId === 'string' && getColumn(parsed.sort.columnId)
        ? { columnId: parsed.sort.columnId, direction: parsed.sort.direction === 'desc' ? 'desc' : 'asc' }
        : null
    return {
      viewId: typeof parsed.viewId === 'string' ? parsed.viewId : DEFAULT_VIEW_ID,
      columns: normalizeColumnIds(parsed.columns),
      sort: sort as SortState | null,
      density: parsed.density === 'compact' ? 'compact' : 'comfortable',
    }
  } catch {
    return null
  }
}
