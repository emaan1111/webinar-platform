'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addColumn as addColumnPure,
  applyViewsAction,
  DEFAULT_VIEW_ID,
  Density,
  EMPTY_STORED_VIEWS,
  isBuiltInView,
  moveColumn as moveColumnPure,
  moveColumnBy as moveColumnByPure,
  moveColumnRelative as moveColumnRelativePure,
  nextSort,
  normalizeColumnIds,
  parseSavedViews,
  parseStoredViews,
  parseWorkingState,
  PREDEFINED_VIEWS,
  removeColumn as removeColumnPure,
  ReportView,
  sameOrder,
  SortState,
  STORAGE_KEYS,
  StoredViews,
  toggleColumn as toggleColumnPure,
  ViewsAction,
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

const VIEWS_URL = '/api/reports/views'
const LOAD_ERROR = "Couldn't load your saved views. Refresh to try again."
const SAVE_ERROR = "Couldn't save your view changes. Check your connection and try again."

const readStorage = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* private mode / quota - the grid still works, it just won't remember */
  }
}

const removeStorage = (key: string) => {
  try {
    localStorage.removeItem(key)
  } catch {
    /* nothing to clean up if storage is unavailable */
  }
}

async function fetchViews(init?: RequestInit): Promise<StoredViews> {
  const res = await fetch(VIEWS_URL, { cache: 'no-store', ...init })
  if (!res.ok) throw new Error(`Saved views request failed (${res.status})`)
  return parseStoredViews(await res.json())
}

const sendViewsAction = (action: ViewsAction) =>
  fetchViews({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action) })

/** Views this browser saved before they moved to the server, as an upload. */
function readLegacyViews(): ViewsAction | null {
  const views = parseSavedViews(readStorage(STORAGE_KEYS.savedViews))
  const defaultViewId = readStorage(STORAGE_KEYS.defaultView)
  if (views.length === 0 && !defaultViewId) return null
  return { action: 'import', views, defaultViewId }
}

/**
 * The server's copy, after uploading any views still in this browser's
 * localStorage and clearing them there. When the server can't be reached,
 * whatever this browser still holds is shown rather than nothing.
 */
async function loadStoredViews(): Promise<{ stored: StoredViews; error: string | null }> {
  const legacy = readLegacyViews()
  let stored: StoredViews
  try {
    stored = await fetchViews()
  } catch {
    return {
      stored: legacy ? applyViewsAction(EMPTY_STORED_VIEWS, legacy) : EMPTY_STORED_VIEWS,
      error: LOAD_ERROR,
    }
  }
  if (!legacy) return { stored, error: null }
  try {
    stored = await sendViewsAction(legacy)
    removeStorage(STORAGE_KEYS.savedViews)
    removeStorage(STORAGE_KEYS.defaultView)
  } catch {
    // Keep the local copy; the upload is tried again on the next visit.
    stored = applyViewsAction(stored, legacy)
  }
  return { stored, error: null }
}

const resolveDefaultViewId = (stored: StoredViews) => {
  const id = stored.defaultViewId
  return id && (isBuiltInView(id) || stored.views.some(v => v.id === id)) ? id : DEFAULT_VIEW_ID
}

/**
 * Owns which columns the reports grid shows, in what order, how it is sorted,
 * and the saved views those can be stored as. Saved views and the starred
 * default live on the server, per user, so clearing the browser's cache does
 * not lose them. What is on screen right now (columns, sort, density) is
 * remembered in localStorage so a refresh brings the grid back as it was.
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
  const [viewsError, setViewsError] = useState<string | null>(null)
  const skipPersist = useRef(true)
  // Mirror of the views that is updated synchronously, so two changes in one
  // tick never build on the same stale snapshot.
  const storedRef = useRef<StoredViews>(EMPTY_STORED_VIEWS)
  const hydratedRef = useRef(false)
  // Server writes go out one at a time, in the order they were made.
  const sendQueue = useRef<Promise<void>>(Promise.resolve())
  const pendingSends = useRef(0)

  const adoptStored = useCallback((stored: StoredViews) => {
    storedRef.current = stored
    setSavedViews(stored.views)
    setDefaultViewIdState(resolveDefaultViewId(stored))
  }, [])

  // --- load ---------------------------------------------------------------
  useEffect(() => {
    let cancelled = false
    loadStoredViews().then(({ stored, error }) => {
      if (cancelled) return
      adoptStored(stored)
      setViewsError(error)

      const all = [...PREDEFINED_VIEWS, ...stored.views]
      const defaultView = all.find(v => v.id === resolveDefaultViewId(stored)) ?? PREDEFINED_VIEWS[0]
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
      hydratedRef.current = true
      setHydrated(true)
    })
    return () => {
      cancelled = true
    }
  }, [adoptStored])

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

  /**
   * Applies a change here at once, then sends it to the server. Once the last
   * queued request settles, the server's answer - which also carries changes
   * made in other tabs and on other devices - replaces the local copy.
   * Returns false when the change was refused (e.g. too many views).
   */
  const changeViews = useCallback(
    (action: ViewsAction): boolean => {
      // Before the load lands there is nothing to build on; the load would
      // overwrite this change anyway.
      if (!hydratedRef.current) return false
      try {
        adoptStored(applyViewsAction(storedRef.current, action))
      } catch (err) {
        setViewsError(err instanceof Error ? err.message : SAVE_ERROR)
        return false
      }
      pendingSends.current += 1
      sendQueue.current = sendQueue.current
        .then(() => sendViewsAction(action))
        .then(
          stored => {
            pendingSends.current -= 1
            if (pendingSends.current === 0) {
              adoptStored(stored)
              setViewsError(null)
            }
          },
          () => {
            pendingSends.current -= 1
            setViewsError(SAVE_ERROR)
          }
        )
      return true
    },
    [adoptStored]
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
        // Random suffix: two saves in the same millisecond must not share an
        // id, or the server would treat the second as an update of the first.
        id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: trimmed,
        columns,
        // Snapshot the whole filter, even when empty: loading this view then
        // means "these columns, with this filter" - including "no filter".
        ...(registrantFilters ? { filters: sanitizeRegistrantFilters(registrantFilters) } : {}),
        createdAt: new Date().toISOString(),
      }
      if (!changeViews({ action: 'save', view })) return null
      setViewId(view.id)
      return view.id
    },
    [changeViews, columns, registrantFilters]
  )

  const updateView = useCallback(
    (id: string) => {
      if (isBuiltInView(id)) return
      const meta = storedRef.current.views.find(v => v.id === id)
      const now = new Date().toISOString()
      // If another tab or device deleted this view while it was being edited
      // here, saving recreates it under the same name rather than silently
      // throwing the change away.
      const view: ReportView = {
        id,
        name: meta?.name ?? 'Restored view',
        columns,
        ...(registrantFilters ? { filters: sanitizeRegistrantFilters(registrantFilters) } : {}),
        createdAt: meta?.createdAt ?? now,
        updatedAt: now,
      }
      changeViews({ action: 'save', view })
      setViewId(id)
    },
    [changeViews, columns, registrantFilters]
  )

  const renameView = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim()
      if (!trimmed || isBuiltInView(id)) return
      changeViews({ action: 'rename', id, name: trimmed })
    },
    [changeViews]
  )

  const setDefaultViewId = useCallback((id: string) => changeViews({ action: 'setDefault', id }), [changeViews])

  const deleteView = useCallback(
    (id: string) => {
      if (isBuiltInView(id)) return
      // Unstars it too, if it was the starred view.
      changeViews({ action: 'delete', id })
      if (viewId === id) {
        // Keep the columns on screen; they just stop belonging to any view.
        setViewId('')
      }
    },
    [changeViews, viewId]
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
    viewsError,
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
