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

/**
 * Owns which columns the reports grid shows, in what order, how it is sorted,
 * and the saved views those can be stored as. Everything is remembered in
 * localStorage so the grid comes back the way it was left.
 */
export function useReportGrid() {
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

  // --- load ---------------------------------------------------------------
  useEffect(() => {
    const views = parseSavedViews(readStorage(STORAGE_KEYS.savedViews))
    setSavedViews(views)

    const storedDefault = readStorage(STORAGE_KEYS.defaultView)
    const allIds = new Set([...PREDEFINED_VIEWS, ...views].map(v => v.id))
    const resolvedDefault = storedDefault && allIds.has(storedDefault) ? storedDefault : DEFAULT_VIEW_ID
    setDefaultViewIdState(resolvedDefault)

    const working = parseWorkingState(readStorage(STORAGE_KEYS.working))
    if (working) {
      setColumnsState(working.columns)
      setViewId(allIds.has(working.viewId) ? working.viewId : resolvedDefault)
      setSort(working.sort)
      setDensity(working.density)
    } else {
      const view = [...PREDEFINED_VIEWS, ...views].find(v => v.id === resolvedDefault) ?? PREDEFINED_VIEWS[0]
      setColumnsState(normalizeColumnIds(view.columns))
      setViewId(view.id)
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

  const persistViews = useCallback((views: ReportView[]) => {
    setSavedViews(views)
    writeStorage(STORAGE_KEYS.savedViews, JSON.stringify(views))
  }, [])

  // --- derived ------------------------------------------------------------
  const allViews = useMemo(() => [...PREDEFINED_VIEWS, ...savedViews], [savedViews])
  const currentView = useMemo(() => allViews.find(v => v.id === viewId) ?? null, [allViews, viewId])
  const isDirty = currentView ? !sameOrder(currentView.columns, columns) : true
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
      setViewId(view.id)
    },
    [allViews]
  )

  const resetView = useCallback(() => {
    if (currentView) setColumnsState(normalizeColumnIds(currentView.columns))
  }, [currentView])

  const saveAsView = useCallback(
    (name: string): string | null => {
      const trimmed = name.trim()
      if (!trimmed) return null
      const view: ReportView = {
        id: `custom_${Date.now()}`,
        name: trimmed,
        columns,
        createdAt: new Date().toISOString(),
      }
      persistViews([...savedViews, view])
      setViewId(view.id)
      return view.id
    },
    [columns, persistViews, savedViews]
  )

  const updateView = useCallback(
    (id: string) => {
      if (isBuiltInView(id)) return
      persistViews(
        savedViews.map(v => (v.id === id ? { ...v, columns, updatedAt: new Date().toISOString() } : v))
      )
      setViewId(id)
    },
    [columns, persistViews, savedViews]
  )

  const renameView = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim()
      if (!trimmed || isBuiltInView(id)) return
      persistViews(savedViews.map(v => (v.id === id ? { ...v, name: trimmed } : v)))
    },
    [persistViews, savedViews]
  )

  const setDefaultViewId = useCallback((id: string) => {
    setDefaultViewIdState(id)
    writeStorage(STORAGE_KEYS.defaultView, id)
  }, [])

  const deleteView = useCallback(
    (id: string) => {
      if (isBuiltInView(id)) return
      persistViews(savedViews.filter(v => v.id !== id))
      if (defaultViewId === id) setDefaultViewId(DEFAULT_VIEW_ID)
      if (viewId === id) {
        // Keep the columns on screen; they just stop belonging to a view.
        setViewId(DEFAULT_VIEW_ID)
      }
    },
    [defaultViewId, persistViews, savedViews, setDefaultViewId, viewId]
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
