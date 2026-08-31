import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useReportGrid } from '../useReportGrid'
import { PREDEFINED_VIEWS, STORAGE_KEYS } from '../state'
import { getColumn } from '../columns'

const settle = () => act(async () => {})

describe('useReportGrid', () => {
  beforeEach(() => localStorage.clear())

  it('opens the starred default view when nothing is unsaved, keeping sort/density', async () => {
    const sales = PREDEFINED_VIEWS.find(v => v.id === 'salesFocus')!
    localStorage.setItem(
      STORAGE_KEYS.working,
      JSON.stringify({ viewId: 'salesFocus', columns: sales.columns, sort: null, density: 'compact' })
    )
    localStorage.setItem(STORAGE_KEYS.defaultView, 'essential')
    const { result } = renderHook(() => useReportGrid())
    await settle()
    expect(result.current.viewId).toBe('essential')
    expect(result.current.columns).toEqual(PREDEFINED_VIEWS[0].columns)
    expect(result.current.density).toBe('compact')
    expect(result.current.isDirty).toBe(false)
  })

  it('keeps unsaved columns across a reload rather than applying the default view', async () => {
    localStorage.setItem(
      STORAGE_KEYS.working,
      JSON.stringify({ viewId: 'salesFocus', columns: ['date', 'profit'], sort: null, density: 'comfortable' })
    )
    const { result } = renderHook(() => useReportGrid())
    await settle()
    expect(result.current.viewId).toBe('salesFocus')
    expect(result.current.columns).toEqual(['date', 'profit'])
    expect(result.current.isDirty).toBe(true)
  })

  it('clears the sort when the sorted column is removed by loading a view', async () => {
    const { result } = renderHook(() => useReportGrid())
    await settle()
    act(() => result.current.setSort({ columnId: 'visitors', direction: 'desc' }))
    expect(result.current.sort).not.toBeNull()
    act(() => result.current.loadView('liveVsReplay'))
    expect(result.current.columns).not.toContain('visitors')
    expect(result.current.sort).toBeNull()
  })

  it('deleting the active custom view leaves a view-less custom column set', async () => {
    const { result } = renderHook(() => useReportGrid())
    await settle()
    act(() => result.current.toggleColumn('profit'))
    let id: string | null = null
    act(() => {
      id = result.current.saveAsView('Mine')
    })
    expect(id).toBeTruthy()
    expect(result.current.viewId).toBe(id)
    expect(result.current.isDirty).toBe(false)

    act(() => result.current.deleteView(id!))
    expect(result.current.currentView).toBeNull()
    expect(result.current.viewId).toBe('')
    expect(result.current.columns).toContain('profit')
    expect(result.current.isDirty).toBe(true)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.savedViews)!)).toEqual([])
  })

  it('ignores prototype-polluting ids that arrive from storage', async () => {
    expect(getColumn('__proto__')).toBeUndefined()
    expect(getColumn('constructor')).toBeUndefined()
    localStorage.setItem(
      STORAGE_KEYS.working,
      JSON.stringify({ viewId: 'essential', columns: ['__proto__', 'constructor', 'visitors'] })
    )
    const { result } = renderHook(() => useReportGrid())
    await settle()
    expect(result.current.columns).toEqual(['date', 'visitors'])
  })
})
