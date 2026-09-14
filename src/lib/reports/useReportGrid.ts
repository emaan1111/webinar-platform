'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addColumn as addColumnPure,
  DEFAULT_VIEW_ID,
  Density,
  isBuiltInView,
  moveColumn as moveColumnPure,
  moveColumnBy as moveColumnByPure,
  moveColumnRelative as moveColumnRelativePure,
  nextSort,
  normalizeColumnIds,
  parseSavedViews,
  parseWorkingState,
  PREDEFINED_VIEWS,
  removeColumn as removeColumnPure,
  ReportView,
  sameOrder,
  SortState,
  STORAGE_KEYS,
  toggleColumn as toggleColumnPure,
  WorkingState,
} from './state'
import { RegistrantFilters, registrantFiltersEqual, sanitizeRegistrantFilters } from './registrantFilters'

export interface UseReportGridOptions {
  /**
   * The registrant country/timezone filter currently applied to the report.
   * When given, saving a view snapshots it and it counts toward "unsaved
   * changes" on views that carry a snapshot.
   */
  registrantFilters?: RegistrantFilters
  /** Called when a loaded view carries a filter snapshot to apply. */
  onApplyViewFilters?: (filters: RegistrantFilters) => void
}

const readStorage = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const writeStorage = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    /* private mode / quota - the grid still works, it just won't remember */
    return false
  }
}

/**
 * The stored view list, or null when it is missing or corrupt. Corrupt is
 * deliberately NOT [] here: treating garbage as an empty list once turned a
 * rename into a wipe of every saved view.
 */
const readStoredViews = (): ReportView[] | null => {
  const raw = readStorage(STORAGE_KEYS.savedViews)
  if (raw == null) return null
  try {
    if (!Array.isArray(JSON.parse(raw))) return null
  } catch {
    return null
  }
  return parseSavedViews(raw)
}

/**
 * Owns which columns the reports grid shows, in what order, how it is sorted,
 * and the saved views those can be stored as. Everything is remembered in
 * localStorage so the grid comes back the way it was left.
 */
export function useReportGrid(options: UseReportGridOptions = {}) {
  const { registrantFilters, onApplyViewFilters } = options
  // The apply callback is only used inside stable callbacks; a ref keeps a
  // changing function identity from invalidating loadView/resetView.
  const applyFiltersRef = useRef(onApplyViewFilters)
  applyFiltersRef.current = onApplyViewFilters
  const [columns, setColumnsState] = useState<string[]>(() =>
    normalizeColumnIds(PREDEFINED_VIEWS[0].columns)
  )
  const [viewId, setViewId] = useState<string>(DEFAULT_VIEW_ID)
  const [savedViews, setSavedViews] = useState<ReportView[]>([])
  const [defaultViewId, setDefaultViewIdState] = useState<string>(DEFAULT_VIEW_ID)
  const [sort, setSort] = useState<SortState | null>(null)
  const [density, setDensity] = useState<Density>('comfortable')
  const [hydrated, setHydrated] = useState(false)
  const skipPersist = useRef(true)
  // Mirror of savedViews that is updated synchronously, so two mutations in
  // one tick never build on the same stale snapshot.
  const savedViewsRef = useRef<ReportView[]>([])
  // Set once a localStorage write fails (quota, private mode). From then on
  // storage is stale, so mutations must base themselves on memory or every
  // save after the first would vanish from the list mid-session.
  const storageBroken = useRef(false)

  // --- load ---------------------------------------------------------------
  useEffect(() => {
    const views = parseSavedViews(readStorage(STORAGE_KEYS.savedViews))
    savedViewsRef.current = views
    setSavedViews(views)

    const storedDefault = readStorage(STORAGE_KEYS.defaultView)
    const allIds = new Set([...PREDEFINED_VIEWS, ...views].map(v => v.id))
    const resolvedDefault = storedDefault && allIds.has(storedDefault) ? storedDefault : DEFAULT_VIEW_ID
    setDefaultViewIdState(resolvedDefault)

    const all = [...PREDEFINED_VIEWS, ...views]
    const defaultView = all.find(v => v.id === resolvedDefault) ?? PREDEFINED_VIEWS[0]
    const working = parseWorkingState(readStorage(STORAGE_KEYS.working))
    if (working) {
      // Whatever was on screen comes back - a saved view, a built-in one, or
      // unsaved tweaks. Opening the starred default here instead made a
      // freshly saved custom view vanish on the next visit, which read as
      // "custom views are not saving". The star only decides the first visit
      // (and what remains if the last-used view was deleted elsewhere).
      setSort(working.sort)
      setDensity(working.density)
      const workingView = all.find(v => v.id === working.viewId)
      setColumnsState(working.columns)
      setViewId(workingView ? workingView.id : '')
    } else {
      setColumnsState(normalizeColumnIds(defaultView.columns))
      setViewId(defaultView.id)
    }
    setHydrated(true)
  }, [])

  // --- persist working state ---------------------------------------------
  useEffect(() => {
    if (!hydrated) return
    // The first run after hydration only mirrors what we just loaded.
    if (skipPersist.current) {
      skipPersist.current = false
      return
    }
    const state: WorkingState = { viewId, columns, sort, density }
    writeStorage(STORAGE_KEYS.working, JSON.stringify(state))
  }, [hydrated, viewId, columns, sort, density])

  // A sort on a column that is no longer shown would reorder rows invisibly.
  useEffect(() => {
    if (sort && !columns.includes(sort.columnId)) setSort(null)
  }, [columns, sort])

  const persistViews = useCallback((views: ReportView[]) => {
    savedViewsRef.current = views
    setSavedViews(views)
    if (!writeStorage(STORAGE_KEYS.savedViews, JSON.stringify(views))) {
      storageBroken.current = true
    }
  }, [])

  // Every view mutation re-reads storage first: another tab may have saved
  // its own view since this tab loaded, and building on stale in-memory
  // state would overwrite that tab's list wholesale. Storage is only trusted
  // as the base while it is present, parseable, and writes are still landing;
  // otherwise this tab's own list is the best truth available.
  const mutateViews = useCallback(
    (mutate: (views: ReportView[]) => ReportView[]) => {
      const stored = storageBroken.current ? null : readStoredViews()
      persistViews(mutate(stored ?? savedViewsRef.current))
    },
    [persistViews]
  )

  // --- derived ------------------------------------------------------------
  const allViews = useMemo(() => [...PREDEFINED_VIEWS, ...savedViews], [savedViews])
  const currentView = useMemo(() => allViews.find(v => v.id === viewId) ?? null, [allViews, viewId])
  // A view that snapshots filters is also dirtied by a filter change; views
  // without a snapshot (built-in, pre-filter saves) only care about columns.
  const filtersDirty = Boolean(
    currentView?.filters &&
      registrantFilters &&
      !registrantFiltersEqual(currentView.filters, registrantFilters)
  )
  const isDirty = currentView ? !sameOrder(currentView.columns, columns) || filtersDirty : true
  const canUpdateCurrentView = Boolean(currentView && !currentView.builtIn && isDirty)

  // --- column actions -----------------------------------------------------
  const setColumns = useCallback((next: string[]) => setColumnsState(normalizeColumnIds(next)), [])
  const toggleColumn = useCallback((id: string) => setColumnsState(prev => toggleColumnPure(prev, id)), [])
  const addColumn = useCallback(
    (id: string, index?: number) => setColumnsState(prev => addColumnPure(prev, id, index)),
    []
  )
  const removeColumn = useCallback((id: string) => {
    setColumnsState(prev => removeColumnPure(prev, id))
    setSort(prev => (prev?.columnId === id ? null : prev))
  }, [])
  const moveColumn = useCallback(
    (from: number, to: number) => setColumnsState(prev => moveColumnPure(prev, from, to)),
    []
  )
  const moveColumnBy = useCallback(
    (id: string, delta: number) => setColumnsState(prev => moveColumnByPure(prev, id, delta)),
    []
  )
  const moveColumnRelative = useCallback(
    (id: string, targetId: string, side: 'before' | 'after') =>
      setColumnsState(prev => moveColumnRelativePure(prev, id, targetId, side)),
    []
  )
  const toggleSort = useCallback((id: string) => setSort(prev => nextSort(prev, id)), [])

  // --- view actions -------------------------------------------------------
  const loadView = useCallback(
    (id: string) => {
      const view = allViews.find(v => v.id === id)
      if (!view) return
      setColumnsState(normalizeColumnIds(view.columns))
      if (view.filters) applyFiltersRef.current?.(view.filters)
      setViewId(view.id)
    },
    [allViews]
  )

  const resetView = useCallback(() => {
    if (!currentView) return
    setColumnsState(normalizeColumnIds(currentView.columns))
    if (currentView.filters) applyFiltersRef.current?.(currentView.filters)
  }, [currentView])

  const saveAsView = useCallback(
    (name: string): string | null => {
      const trimmed = name.trim()
      if (!trimmed) return null
      const view: ReportView = {
        id: `custom_${Date.now()}`,
        name: trimmed,
        columns,
        // Snapshot the whole filter, even when empty: loading this view then
        // means "these columns, with this filter" - including "no filter".
        ...(registrantFilters ? { filters: sanitizeRegistrantFilters(registrantFilters) } : {}),
        createdAt: new Date().toISOString(),
      }
      mutateViews(base => [...base, view])
      setViewId(view.id)
      return view.id
    },
    [columns, mutateViews, registrantFilters]
  )

  const updateView = useCallback(
    (id: string) => {
      if (isBuiltInView(id)) return
      const meta = savedViewsRef.current.find(v => v.id === id)
      const snapshot = registrantFilters
        ? { filters: sanitizeRegistrantFilters(registrantFilters) }
        : {}
      mutateViews(base => {
        if (base.some(v => v.id === id)) {
          return base.map(v =>
            v.id === id ? { ...v, columns, ...snapshot, updatedAt: new Date().toISOString() } : v
          )
        }
        // Another tab deleted this view while it was being edited here.
        // "Update" still means "keep these columns under this name" - so the
        // view is recreated rather than the save silently thrown away.
        return [
          ...base,
          {
            id,
            name: meta?.name ?? 'Restored view',
            columns,
            ...snapshot,
            createdAt: meta?.createdAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]
      })
      setViewId(id)
    },
    [columns, mutateViews, registrantFilters]
  )

  const renameView = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim()
      if (!trimmed || isBuiltInView(id)) return
      mutateViews(base => base.map(v => (v.id === id ? { ...v, name: trimmed } : v)))
    },
    [mutateViews]
  )

  const setDefaultViewId = useCallback((id: string) => {
    setDefaultViewIdState(id)
    writeStorage(STORAGE_KEYS.defaultView, id)
  }, [])

  const deleteView = useCallback(
    (id: string) => {
      if (isBuiltInView(id)) return
      mutateViews(base => base.filter(v => v.id !== id))
      // Another tab may have re-starred a different view since this tab
      // loaded; only clear the stored default when it still points here.
      const storedDefault = readStorage(STORAGE_KEYS.defaultView) ?? defaultViewId
      if (storedDefault === id) setDefaultViewId(DEFAULT_VIEW_ID)
      if (viewId === id) {
        // Keep the columns on screen; they just stop belonging to any view.
        setViewId('')
      }
    },
    [defaultViewId, mutateViews, setDefaultViewId, viewId]
  )

  return {
    hydrated,
    columns,
    setColumns,
    toggleColumn,
    addColumn,
    removeColumn,
    moveColumn,
    moveColumnBy,
    moveColumnRelative,
    sort,
    setSort,
    toggleSort,
    density,
    setDensity,
    views: allViews,
    savedViews,
    viewId,
    currentView,
    isDirty,
    canUpdateCurrentView,
    defaultViewId,
    setDefaultViewId,
    loadView,
    resetView,
    saveAsView,
    updateView,
    renameView,
    deleteView,
  }
}

export type ReportGrid = ReturnType<typeof useReportGrid>
