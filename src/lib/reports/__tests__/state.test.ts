import { describe, expect, it } from 'vitest'
import {
  addColumn,
  moveColumn,
  moveColumnBy,
  moveColumnRelative,
  nextSort,
  normalizeColumnIds,
  parseSavedViews,
  parseWorkingState,
  PREDEFINED_VIEWS,
  removeColumn,
  sortReports,
  toggleColumn,
} from '../state'
import { ALL_COLUMN_IDS, ReportRow } from '../columns'

describe('normalizeColumnIds', () => {
  it('pins date first, drops unknown ids and duplicates', () => {
    expect(normalizeColumnIds(['visitors', 'nope', 'date', 'visitors', 'fbSpend'])).toEqual([
      'date',
      'visitors',
      'fbSpend',
    ])
  })

  it('always yields at least the date column', () => {
    expect(normalizeColumnIds([])).toEqual(['date'])
  })

  it('every predefined view survives normalization intact', () => {
    for (const view of PREDEFINED_VIEWS) {
      expect(normalizeColumnIds(view.columns)).toEqual(view.columns)
    }
  })
})

describe('column reordering', () => {
  const ids = ['date', 'a', 'b', 'c'].map((id, i) => (i === 0 ? id : ['visitors', 'fbSpend', 'fbClicks'][i - 1]))
  // ids = ['date', 'visitors', 'fbSpend', 'fbClicks']

  it('moveColumn moves within the non-date range', () => {
    expect(moveColumn(ids, 1, 3)).toEqual(['date', 'fbSpend', 'fbClicks', 'visitors'])
    expect(moveColumn(ids, 3, 1)).toEqual(['date', 'fbClicks', 'visitors', 'fbSpend'])
  })

  it('moveColumn refuses to displace the date column', () => {
    expect(moveColumn(ids, 0, 2)).toEqual(ids)
    expect(moveColumn(ids, 2, 0)).toEqual(ids)
  })

  it('moveColumnBy clamps at the edges', () => {
    expect(moveColumnBy(ids, 'visitors', -5)).toEqual(ids)
    expect(moveColumnBy(ids, 'visitors', 1)).toEqual(['date', 'fbSpend', 'visitors', 'fbClicks'])
    expect(moveColumnBy(ids, 'fbClicks', 10)).toEqual(ids)
  })

  it('moveColumnRelative drops before/after the target', () => {
    expect(moveColumnRelative(ids, 'fbClicks', 'visitors', 'before')).toEqual([
      'date',
      'fbClicks',
      'visitors',
      'fbSpend',
    ])
    expect(moveColumnRelative(ids, 'visitors', 'fbSpend', 'after')).toEqual([
      'date',
      'fbSpend',
      'visitors',
      'fbClicks',
    ])
  })

  it('moveColumnRelative never lands before date', () => {
    expect(moveColumnRelative(ids, 'fbClicks', 'date', 'before')).toEqual([
      'date',
      'fbClicks',
      'visitors',
      'fbSpend',
    ])
    expect(moveColumnRelative(ids, 'date', 'fbSpend', 'after')).toEqual(ids)
  })
})

describe('add / remove / toggle', () => {
  const ids = ['date', 'visitors']

  it('adds at the end by default and at an index when given', () => {
    expect(addColumn(ids, 'fbSpend')).toEqual(['date', 'visitors', 'fbSpend'])
    expect(addColumn(ids, 'fbSpend', 1)).toEqual(['date', 'fbSpend', 'visitors'])
    expect(addColumn(ids, 'fbSpend', 0)).toEqual(['date', 'fbSpend', 'visitors'])
  })

  it('ignores unknown or already-present ids', () => {
    expect(addColumn(ids, 'visitors')).toEqual(ids)
    expect(addColumn(ids, 'ghost')).toEqual(ids)
  })

  it('never removes the date column', () => {
    expect(removeColumn(ids, 'date')).toEqual(ids)
    expect(removeColumn(ids, 'visitors')).toEqual(['date'])
  })

  it('toggle flips presence', () => {
    expect(toggleColumn(ids, 'visitors')).toEqual(['date'])
    expect(toggleColumn(['date'], 'visitors')).toEqual(['date', 'visitors'])
  })
})

describe('sorting', () => {
  it('cycles asc → desc → off on the same column', () => {
    const first = nextSort(null, 'visitors')
    expect(first).toEqual({ columnId: 'visitors', direction: 'asc' })
    const second = nextSort(first, 'visitors')
    expect(second).toEqual({ columnId: 'visitors', direction: 'desc' })
    expect(nextSort(second, 'visitors')).toBeNull()
  })

  it('switching columns starts ascending again', () => {
    expect(nextSort({ columnId: 'visitors', direction: 'desc' }, 'fbSpend')).toEqual({
      columnId: 'fbSpend',
      direction: 'asc',
    })
  })

  const row = (date: string, visitors: number): ReportRow =>
    ({
      date,
      visitors,
      fbResults: { spend: 0, impressions: 0, clicks: 0, ctr: 0, cpm: 0, cpc: 0 },
    }) as unknown as ReportRow

  it('sorts numerically and by date string, and leaves input untouched', () => {
    const rows = [row('2026-08-02', 5), row('2026-08-01', 10), row('2026-08-03', 1)]
    expect(sortReports(rows, { columnId: 'visitors', direction: 'desc' }).map(r => r.visitors)).toEqual([10, 5, 1])
    expect(sortReports(rows, { columnId: 'date', direction: 'asc' }).map(r => r.date)).toEqual([
      '2026-08-01',
      '2026-08-02',
      '2026-08-03',
    ])
    expect(rows.map(r => r.visitors)).toEqual([5, 10, 1])
  })
})

describe('persistence parsing', () => {
  it('accepts the legacy saved-view shape and normalizes its columns', () => {
    const raw = JSON.stringify([
      { id: 'custom_1', name: 'Mine', columns: ['fbSpend', 'date', 'gone'], createdAt: 'x' },
      { id: 'broken' },
      'junk',
    ])
    expect(parseSavedViews(raw)).toEqual([
      { id: 'custom_1', name: 'Mine', columns: ['date', 'fbSpend'], createdAt: 'x', updatedAt: undefined },
    ])
  })

  it('keeps a filter snapshot when present and leaves it absent when not', () => {
    const raw = JSON.stringify([
      {
        id: 'custom_1',
        name: 'India only',
        columns: ['date'],
        filters: { countries: ['India'], countriesMode: 'exclude', timezones: 'junk' },
      },
      { id: 'custom_2', name: 'Pre-filter view', columns: ['date'] },
    ])
    const [withFilters, legacy] = parseSavedViews(raw)
    expect(withFilters.filters).toEqual({
      countries: ['India'],
      countriesMode: 'exclude',
      timezones: [],
      timezonesMode: 'include',
    })
    // Absent means "don't touch the active filter when loading this view",
    // so it must not be filled in with an empty snapshot.
    expect('filters' in legacy).toBe(false)
  })

  it('returns [] / null on garbage', () => {
    expect(parseSavedViews('{not json')).toEqual([])
    expect(parseSavedViews(null)).toEqual([])
    expect(parseWorkingState('{not json')).toBeNull()
    expect(parseWorkingState(JSON.stringify({ viewId: 'x' }))).toBeNull()
  })

  it('drops a sort on a column that no longer exists', () => {
    const state = parseWorkingState(
      JSON.stringify({ viewId: 'essential', columns: ['visitors'], sort: { columnId: 'gone', direction: 'desc' }, density: 'compact' })
    )
    expect(state).toEqual({ viewId: 'essential', columns: ['date', 'visitors'], sort: null, density: 'compact' })
  })

  it('the Everything view really has every column', () => {
    expect(PREDEFINED_VIEWS.find(v => v.id === 'comprehensive')?.columns).toEqual(ALL_COLUMN_IDS)
  })
})
