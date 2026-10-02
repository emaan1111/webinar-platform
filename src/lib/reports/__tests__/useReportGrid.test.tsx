import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useReportGrid } from '../useReportGrid'
import { PREDEFINED_VIEWS, STORAGE_KEYS } from '../state'
import { getColumn } from '../columns'
import { flush, installFakeViewsServer } from './fakeViewsServer'

const settle = flush

describe('useReportGrid', () => {
  let server: ReturnType<typeof installFakeViewsServer>
  beforeEach(() => {
    localStorage.clear()
    server = installFakeViewsServer()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('restores the last-used view across reloads, not the starred default', async () => {
    const sales = PREDEFINED_VIEWS.find(v => v.id === 'salesFocus')!
    localStorage.setItem(
      STORAGE_KEYS.working,
      JSON.stringify({ viewId: 'salesFocus', columns: sales.columns, sort: null, density: 'compact' })
    )
    const { result } = renderHook(() => useReportGrid())
    await settle()
    expect(result.current.viewId).toBe('salesFocus')
    expect(result.current.columns).toEqual(sales.columns)
    expect(result.current.density).toBe('compact')
    expect(result.current.isDirty).toBe(false)
  })

  it('falls back to the starred default view when there is no working state', async () => {
    server.stored = { views: [], defaultViewId: 'facebook' }
    const { result } = renderHook(() => useReportGrid())
    await settle()
    expect(result.current.viewId).toBe('facebook')
    expect(result.current.defaultViewId).toBe('facebook')
    expect(result.current.isDirty).toBe(false)
  })

  it('is not hydrated until the saved views have loaded', async () => {
    const { result } = renderHook(() => useReportGrid())
    expect(result.current.hydrated).toBe(false)
    await settle()
    expect(result.current.hydrated).toBe(true)
  })

  it('a saved custom view comes back as the active view on the next visit', async () => {
    // Visit 1: tweak columns, save as a view.
    const first = renderHook(() => useReportGrid())
    await settle()
    act(() => first.result.current.toggleColumn('profit'))
    let id: string | null = null
    act(() => {
      id = first.result.current.saveAsView('Mine')
    })
    expect(id).toBeTruthy()
    await settle()
    first.unmount()

    // Visit 2: the view is in the list AND it is what is on screen.
    const second = renderHook(() => useReportGrid())
    await settle()
    expect(second.result.current.savedViews.map(v => v.id)).toContain(id)
    expect(second.result.current.viewId).toBe(id)
    expect(second.result.current.currentView?.name).toBe('Mine')
    expect(second.result.current.columns).toContain('profit')
    expect(second.result.current.isDirty).toBe(false)
  })

  it('saved views and the starred default survive clearing the browser cache', async () => {
    const first = renderHook(() => useReportGrid())
    await settle()
    act(() => first.result.current.toggleColumn('profit'))
    let id: string | null = null
    act(() => {
      id = first.result.current.saveAsView('Mine')
    })
    act(() => first.result.current.setDefaultViewId(id!))
    await settle()
    first.unmount()

    localStorage.clear()

    const second = renderHook(() => useReportGrid())
    await settle()
    expect(second.result.current.savedViews.map(v => v.name)).toEqual(['Mine'])
    expect(second.result.current.defaultViewId).toBe(id)
    // No working state left, so the starred view opens.
    expect(second.result.current.viewId).toBe(id)
    expect(second.result.current.columns).toContain('profit')
  })

  it('uploads views saved in this browser before the move to the server, then clears them locally', async () => {
    server.stored = { views: [{ id: 'custom_server', name: 'Already there', columns: ['date'] }], defaultViewId: null }
    localStorage.setItem(
      STORAGE_KEYS.savedViews,
      JSON.stringify([
        { id: 'custom_local', name: 'Local only', columns: ['date', 'visitors'] },
        { id: 'custom_server', name: 'Stale local copy', columns: ['date', 'roi'] },
      ])
    )
    localStorage.setItem(STORAGE_KEYS.defaultView, 'custom_local')
    const { result } = renderHook(() => useReportGrid())
    await settle()
    expect(result.current.savedViews.map(v => v.name)).toEqual(['Already there', 'Local only'])
    expect(result.current.defaultViewId).toBe('custom_local')
    expect(server.stored.views.map(v => v.id)).toEqual(['custom_server', 'custom_local'])
    expect(localStorage.getItem(STORAGE_KEYS.savedViews)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.defaultView)).toBeNull()
  })

  it('shows the views this browser still has when the server is unreachable, and keeps them', async () => {
    server.fail = true
    localStorage.setItem(
      STORAGE_KEYS.savedViews,
      JSON.stringify([{ id: 'custom_local', name: 'Local only', columns: ['date', 'visitors'] }])
    )
    const { result } = renderHook(() => useReportGrid())
    await settle()
    expect(result.current.hydrated).toBe(true)
    expect(result.current.savedViews.map(v => v.name)).toEqual(['Local only'])
    expect(result.current.viewsError).toMatch(/couldn't load/i)
    // Not uploaded, so not cleared: the next visit tries again.
    expect(localStorage.getItem(STORAGE_KEYS.savedViews)).not.toBeNull()
  })

  it('saving does not clobber a view another device saved meanwhile', async () => {
    const { result } = renderHook(() => useReportGrid())
    await settle()
    // Another device saves its own view after this tab loaded.
    server.stored = { views: [{ id: 'custom_other', name: 'Other device', columns: ['date', 'visitors'] }], defaultViewId: null }
    act(() => {
      result.current.saveAsView('Mine')
    })
    await settle()
    expect(server.stored.views.map(v => v.name).sort()).toEqual(['Mine', 'Other device'])
    expect(result.current.savedViews.map(v => v.name).sort()).toEqual(['Mine', 'Other device'])
  })

  it('sends quick successive changes in order, and all of them land', async () => {
    const { result } = renderHook(() => useReportGrid())
    await settle()
    let a: string | null = null
    act(() => {
      a = result.current.saveAsView('A')
    })
    act(() => {
      result.current.saveAsView('B')
    })
    act(() => result.current.renameView(a!, 'A2'))
    expect(result.current.savedViews.map(v => v.name)).toEqual(['A2', 'B'])
    await settle()
    expect(server.requests.map(r => r.action)).toEqual(['save', 'save', 'rename'])
    expect(server.stored.views.map(v => v.name)).toEqual(['A2', 'B'])
    expect(result.current.savedViews.map(v => v.name)).toEqual(['A2', 'B'])
  })

  it('a failed save says so and keeps the view on screen', async () => {
    const { result } = renderHook(() => useReportGrid())
    await settle()
    server.fail = true
    act(() => {
      result.current.saveAsView('Mine')
    })
    await settle()
    expect(result.current.savedViews.map(v => v.name)).toEqual(['Mine'])
    expect(result.current.viewsError).toMatch(/couldn't save/i)

    // The next save that goes through brings the list back in line.
    server.fail = false
    act(() => {
      result.current.saveAsView('Again')
    })
    await settle()
    expect(result.current.viewsError).toBeNull()
    expect(result.current.savedViews.map(v => v.name)).toEqual(['Again'])
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
    await settle()
    expect(server.stored.views).toEqual([])
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

  it('updating a view another device deleted recreates it instead of losing the save', async () => {
    const { result } = renderHook(() => useReportGrid())
    await settle()
    let id: string | null = null
    act(() => {
      id = result.current.saveAsView('Mine')
    })
    await settle()
    // Another device deletes it.
    server.stored = { views: [], defaultViewId: null }
    act(() => result.current.toggleColumn('roi'))
    act(() => result.current.updateView(id!))
    await settle()
    expect(server.stored.views).toHaveLength(1)
    expect(server.stored.views[0].name).toBe('Mine')
    expect(server.stored.views[0].columns).toContain('roi')
    expect(result.current.currentView?.id).toBe(id)
    expect(result.current.isDirty).toBe(false)
  })

  it('deleting a view leaves a default another device starred meanwhile alone', async () => {
    const { result } = renderHook(() => useReportGrid())
    await settle()
    let id: string | null = null
    act(() => {
      id = result.current.saveAsView('Mine')
    })
    act(() => result.current.setDefaultViewId(id!))
    await settle()
    // Another device stars a different view.
    server.stored = { ...server.stored, defaultViewId: 'salesFocus' }
    act(() => result.current.deleteView(id!))
    await settle()
    expect(server.stored.defaultViewId).toBe('salesFocus')
    expect(result.current.defaultViewId).toBe('salesFocus')
  })
})
