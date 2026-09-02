'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Columns3, Download, RefreshCw, Rows3, Rows4, Star } from 'lucide-react'
import type { ReportGrid } from '@/lib/reports/useReportGrid'
import Popover, { MenuDivider, MenuItem } from './Popover'

interface GridToolbarProps {
  grid: ReportGrid
  loading: boolean
  canExport: boolean
  lastUpdated: Date | null
  onRefresh: () => void
  onExport: () => void
  onOpenColumns: () => void
}

/** The row above the grid: which view is showing, and what to do with it. */
export default function GridToolbar({
  grid,
  loading,
  canExport,
  lastUpdated,
  onRefresh,
  onExport,
  onOpenColumns,
}: GridToolbarProps) {
  const [viewAnchor, setViewAnchor] = useState<HTMLElement | null>(null)
  const [saveAnchor, setSaveAnchor] = useState<HTMLElement | null>(null)
  const [saveName, setSaveName] = useState('')
  const saveInput = useRef<HTMLInputElement>(null)

  const closeView = useCallback(() => setViewAnchor(null), [])
  const closeSave = useCallback(() => setSaveAnchor(null), [])

  useEffect(() => {
    if (saveAnchor) setTimeout(() => saveInput.current?.focus(), 0)
  }, [saveAnchor])

  const builtIn = grid.views.filter(v => v.builtIn)
  const custom = grid.views.filter(v => !v.builtIn)
  const viewName = grid.currentView?.name ?? 'Custom'

  const commitSave = () => {
    const id = grid.saveAsView(saveName)
    if (id) {
      setSaveName('')
      setSaveAnchor(null)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3">
      {/* View switcher */}
      <button
        type="button"
        onClick={e => {
          const el = e.currentTarget
          setViewAnchor(prev => (prev ? null : el))
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
        aria-haspopup="menu"
        aria-expanded={Boolean(viewAnchor)}
      >
        <span className="text-gray-400">View</span>
        <span>{viewName}</span>
        <span className="rounded bg-gray-100 px-1.5 text-xs font-normal tabular-nums text-gray-500">
          {grid.columns.length}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {grid.isDirty && (
        <div className="inline-flex items-center gap-1 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-1 font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Unsaved changes
          </span>
          {grid.canUpdateCurrentView && (
            <button
              type="button"
              onClick={() => grid.updateView(grid.viewId)}
              className="rounded-md px-2 py-1 font-medium text-blue-700 hover:bg-blue-50"
            >
              Save
            </button>
          )}
          <button
            type="button"
            onClick={e => {
              const el = e.currentTarget
              setSaveAnchor(prev => (prev ? null : el))
            }}
            className="rounded-md px-2 py-1 font-medium text-blue-700 hover:bg-blue-50"
          >
            Save as…
          </button>
          {grid.currentView && (
            <button
              type="button"
              onClick={grid.resetView}
              className="rounded-md px-2 py-1 font-medium text-gray-600 hover:bg-gray-100"
            >
              Reset
            </button>
          )}
        </div>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        {lastUpdated && (
          <span className="hidden text-xs text-gray-400 sm:inline" title={lastUpdated.toLocaleString()}>
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}

        <button
          type="button"
          onClick={onOpenColumns}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <Columns3 className="h-4 w-4 text-gray-500" />
          Columns
        </button>

        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm" role="group" aria-label="Row density">
          <DensityButton
            active={grid.density === 'comfortable'}
            onClick={() => grid.setDensity('comfortable')}
            label="Comfortable rows"
          >
            <Rows3 className="h-4 w-4" />
          </DensityButton>
          <DensityButton active={grid.density === 'compact'} onClick={() => grid.setDensity('compact')} label="Compact rows">
            <Rows4 className="h-4 w-4" />
          </DensityButton>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          aria-label="Refresh"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        <button
          type="button"
          onClick={onExport}
          disabled={!canExport}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* View menu */}
      <Popover anchor={viewAnchor} onClose={closeView} width={320}>
        <div className="py-1" role="menu">
          <ViewSection title="Built-in" views={builtIn} grid={grid} onPick={closeView} />
          {custom.length > 0 && (
            <>
              <MenuDivider />
              <ViewSection title="Saved" views={custom} grid={grid} onPick={closeView} />
            </>
          )}
          <MenuDivider />
          <MenuItem
            icon={<Columns3 />}
            onClick={() => {
              closeView()
              onOpenColumns()
            }}
          >
            Manage columns &amp; views…
          </MenuItem>
        </div>
      </Popover>

      {/* Save-as popover */}
      <Popover anchor={saveAnchor} onClose={closeSave} width={280}>
        <form
          className="space-y-2 p-3"
          onSubmit={e => {
            e.preventDefault()
            commitSave()
          }}
        >
          <label className="block text-xs font-medium text-gray-600">Save these columns as a view</label>
          <input
            ref={saveInput}
            data-autofocus
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            placeholder="e.g. Monday check-in"
            className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeSave} className="rounded-md px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!saveName.trim()}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Save view
            </button>
          </div>
        </form>
      </Popover>
    </div>
  )
}

function DensityButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`rounded-md p-1.5 transition-colors ${
        active ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      }`}
    >
      {children}
    </button>
  )
}

function ViewSection({
  title,
  views,
  grid,
  onPick,
}: {
  title: string
  views: ReportGrid['views']
  grid: ReportGrid
  onPick: () => void
}) {
  return (
    <div>
      <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{title}</div>
      {views.map(view => {
        const active = grid.viewId === view.id
        const isDefault = grid.defaultViewId === view.id
        return (
          <div key={view.id} className={`group flex items-center pr-1 hover:bg-gray-100 ${active ? 'bg-blue-50' : ''}`}>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                grid.loadView(view.id)
                onPick()
              }}
              className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-1.5 text-left"
            >
              <span className={`w-4 shrink-0 ${active ? 'text-blue-600' : 'text-transparent'}`}>
                <Check className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-gray-900">{view.name}</span>
                {view.description && <span className="block truncate text-xs text-gray-500">{view.description}</span>}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-gray-400">{view.columns.length} cols</span>
            </button>
            <button
              type="button"
              onClick={() => grid.setDefaultViewId(view.id)}
              className={`shrink-0 rounded p-1 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isDefault ? 'text-amber-500' : 'text-gray-300 opacity-0 hover:text-amber-400 group-hover:opacity-100'
              }`}
              aria-label={isDefault ? 'Default view for new visits' : `Make ${view.name} the default for new visits`}
              title={isDefault ? 'Default view: opens on a first visit' : 'Make default for new visits'}
            >
              <Star className="h-3.5 w-3.5" fill={isDefault ? 'currentColor' : 'none'} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
