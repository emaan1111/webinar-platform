import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useReportGrid } from '../useReportGrid'
import { PREDEFINED_VIEWS, STORAGE_KEYS } from '../state'
import { getColumn } from '../columns'

const settle = () => act(async () => {})

describe('useReportGrid', () => {
  beforeEach(() => localStorage.clear())

  it('restores the last-used view across reloads, not the starred default', async () => {
    const sales = PREDEFINED_VIEWS.find(v => v.id === 'salesFocus')!
    localStorage.setItem(
      STORAGE_KEYS.working,
      JSON.stringify({ viewId: 'salesFocus', columns: sales.columns, sort: null, density: 'compact' })
    )
    localStorage.setItem(STORAGE_KEYS.defaultView, 'essential')
    const { result } = renderHook(() => useReportGrid())
    await settle()
    expect(result.current.viewId).toBe('salesFocus')
    expect(result.current.columns).toEqual(sales.columns)
    expect(result.current.density).toBe('compact')
    expect(result.current.isDirty).toBe(false)
  })

  it('falls back to the starred default view when there is no working state', async () => {
    localStorage.setItem(STORAGE_KEYS.defaultView, 'facebook')
    const { result } = renderHook(() => useReportGrid())
    await settle()
    expect(result.current.viewId).toBe('facebook')
    expect(result.current.isDirty).toBe(false)
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

  it('saving does not clobber a view another tab wrote meanwhile', async () => {
    const { result } = renderHook(() => useReportGrid())
    await settle()
    // Another tab saves its own view after this tab loaded.
    localStorage.setItem(
      STORAGE_KEYS.savedViews,
      JSON.stringify([{ id: 'custom_other', name: 'Other tab', columns: ['date', 'visitors'] }])
    )
    act(() => {
      result.current.saveAsView('Mine')
    })
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.savedViews)!)
    expect(stored.map((v: any) => v.name).sort()).toEqual(['Mine', 'Other tab'])
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

  it('a rename does not wipe the list when storage got corrupted mid-session', async () => {
    const { result } = renderHook(() => useReportGrid())
    await settle()
    let id: string | null = null
    act(() => {
      id = result.current.saveAsView('Mine')
    })
    // Something else scribbles garbage over the key.
    localStorage.setItem(STORAGE_KEYS.savedViews, '{oops')
    act(() => result.current.renameView(id!, 'Mine 2'))
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.savedViews)!)
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('Mine 2')
  })

  it('keeps session saves visible when localStorage writes start failing', async () => {
    const { result } = renderHook(() => useReportGrid())
    await settle()
    const original = Storage.prototype.setItem
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === STORAGE_KEYS.savedViews) throw new Error('QuotaExceededError')
      return original.call(this, key, value)
    })
    try {
      act(() => {
        result.current.saveAsView('A')
      })
      act(() => {
        result.current.saveAsView('B')
      })
      expect(result.current.savedViews.map(v => v.name)).toEqual(['A', 'B'])
    } finally {
      spy.mockRestore()
    }
  })

  it('updating a view another tab deleted recreates it instead of losing the save', async () => {
    const { result } = renderHook(() => useReportGrid())
    await settle()
    let id: string | null = null
    act(() => {
      id = result.current.saveAsView('Mine')
    })
    // Another tab deletes it.
    localStorage.setItem(STORAGE_KEYS.savedViews, '[]')
    act(() => result.current.toggleColumn('roi'))
    act(() => result.current.updateView(id!))
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.savedViews)!)
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('Mine')
    expect(stored[0].columns).toContain('roi')
    expect(result.current.currentView?.id).toBe(id)
    expect(result.current.isDirty).toBe(false)
  })

  it('deleting a view leaves a default another tab starred meanwhile alone', async () => {
    const { result } = renderHook(() => useReportGrid())
    await settle()
    let id: string | null = null
    act(() => {
      id = result.current.saveAsView('Mine')
    })
    act(() => result.current.setDefaultViewId(id!))
    // Another tab stars a different view.
    localStorage.setItem(STORAGE_KEYS.defaultView, 'salesFocus')
    act(() => result.current.deleteView(id!))
    expect(localStorage.getItem(STORAGE_KEYS.defaultView)).toBe('salesFocus')
  })
})
