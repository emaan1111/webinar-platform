'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import {
  COLUMN_GROUPS,
  DATE_COLUMN_ID,
  getColumn,
  groupMeta,
  REPORT_COLUMNS,
  resolveCaption,
} from '@/lib/reports/columns'
import { ReportView } from '@/lib/reports/state'
import type { ReportGrid } from '@/lib/reports/useReportGrid'
import { Button } from '@/components/ui/Button'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface ColumnsDrawerProps {
  open: boolean
  onClose: () => void
  grid: ReportGrid
  engagementMinutes: number
}

/**
 * Slide-over for choosing which columns the grid shows, in what order, and
 * for saving that as a view. Left pane picks columns; right pane orders them.
 */
export default function ColumnsDrawer({ open, onClose, grid, engagementMinutes }: ColumnsDrawerProps) {
  const [query, setQuery] = useState('')
  const [showLegacy, setShowLegacy] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [savingAs, setSavingAs] = useState(false)
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ id: string; side: 'before' | 'after' } | null>(null)
  const saveInputRef = useRef<HTMLInputElement>(null)
  const asideRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  // Read by the keydown handler, which is bound once per open.
  const formOpenRef = useRef(false)
  formOpenRef.current = Boolean(renaming || savingAs)

  const anyLegacySelected = useMemo(
    () => grid.columns.some(id => getColumn(id)?.legacy),
    [grid.columns]
  )

  // While open: focus lives inside the panel (Tab wraps), Escape closes, and
  // the page behind stops scrolling. On close: focus goes back where it was
  // and the transient form state is cleared so the next open starts clean.
  useEffect(() => {
    if (!open) return
    restoreFocusRef.current = document.activeElement as HTMLElement | null
    const focusTimer = setTimeout(() => closeButtonRef.current?.focus(), 0)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // First Escape backs out of a rename / save-as form; the next closes.
        if (formOpenRef.current) {
          setRenaming(null)
          setSavingAs(false)
          setSaveName('')
        } else {
          onClose()
        }
        return
      }
      if (e.key !== 'Tab' || !asideRef.current) return
      const nodes = Array.from(asideRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        el => el.offsetParent !== null || el === document.activeElement
      )
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const inside = asideRef.current.contains(document.activeElement)
      if (e.shiftKey && (!inside || document.activeElement === first)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      setQuery('')
      setSavingAs(false)
      setSaveName('')
      setRenaming(null)
      setDragId(null)
      setDropTarget(null)
      restoreFocusRef.current?.focus?.()
    }
  }, [open, onClose])

  useEffect(() => {
    if (savingAs) saveInputRef.current?.focus()
  }, [savingAs])

  if (!open || typeof document === 'undefined') return null

  const ctx = { engagementMinutes }
  const q = query.trim().toLowerCase()
  const matches = (id: string) => {
    const col = getColumn(id)
    if (!col) return false
    if (!q) return true
    return `${col.label} ${col.fullLabel} ${col.description}`.toLowerCase().includes(q)
  }
  const legacyVisible = showLegacy || anyLegacySelected || Boolean(q)

  const commitSaveAs = () => {
    const id = grid.saveAsView(saveName)
    if (id) {
      setSaveName('')
      setSavingAs(false)
    }
  }

  const commitRename = () => {
    if (renaming) grid.renameView(renaming.id, renaming.name)
    setRenaming(null)
  }

  const onRowDragOver = (e: React.DragEvent, id: string) => {
    if (!dragId || dragId === id) return
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const side = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
    if (dropTarget?.id !== id || dropTarget.side !== side) setDropTarget({ id, side })
  }

  const onRowDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    if (dragId && dropTarget && dropTarget.id === id) {
      grid.moveColumnRelative(dragId, id, dropTarget.side)
    }
    setDragId(null)
    setDropTarget(null)
  }

  const groupIdsShown = (groupId: string) =>
    REPORT_COLUMNS.filter(c => c.group === groupId && (legacyVisible || !c.legacy) && c.id !== DATE_COLUMN_ID)

  return createPortal(
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-labelledby="columns-drawer-title">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[1px]" onClick={onClose} />

      <aside ref={asideRef} className="absolute inset-y-0 right-0 flex w-full max-w-[860px] flex-col bg-white shadow-2xl">
        {/* Header */}
        <header className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
          <div>
            <h2 id="columns-drawer-title" className="text-lg font-semibold text-gray-900">
              Columns &amp; views
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Tick what you want to see, drag to order it, save it as a view to come back to.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Views */}
        <section className="border-b border-gray-200 px-6 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Views</span>
            <span className="text-xs text-gray-400">★ = opens by default</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {grid.views.map(view => (
              <ViewChip
                key={view.id}
                view={view}
                active={grid.viewId === view.id}
                isDefault={grid.defaultViewId === view.id}
                onSelect={() => grid.loadView(view.id)}
                onSetDefault={() => grid.setDefaultViewId(view.id)}
                onRename={view.builtIn ? undefined : () => setRenaming({ id: view.id, name: view.name })}
                onDelete={
                  view.builtIn
                    ? undefined
                    : () => {
                        if (!confirm(`Delete the view "${view.name}"?`)) return
                        if (renaming?.id === view.id) setRenaming(null)
                        grid.deleteView(view.id)
                      }
                }
              />
            ))}
          </div>
          {renaming && (
            <form
              className="mt-3 flex items-center gap-2"
              onSubmit={e => {
                e.preventDefault()
                commitRename()
              }}
            >
              <input
                autoFocus
                value={renaming.name}
                onChange={e => setRenaming({ ...renaming, name: e.target.value })}
                className="w-56 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
                aria-label="View name"
              />
              <Button type="submit" size="sm">Rename</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setRenaming(null)}>
                Cancel
              </Button>
            </form>
          )}
        </section>

        {/* Columns */}
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
          {/* Available */}
          <section className="flex min-h-0 flex-col border-b border-gray-200 md:border-b-0 md:border-r">
            <div className="space-y-2 px-6 pt-4 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Available</span>
                <label className="flex items-center gap-1.5 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={legacyVisible}
                    disabled={anyLegacySelected || Boolean(q)}
                    onChange={e => setShowLegacy(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Show signup-day columns
                </label>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search columns…"
                  className="w-full rounded-md border border-gray-300 py-1.5 pl-8 pr-8 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
              {COLUMN_GROUPS.map(group => {
                const cols = groupIdsShown(group.id).filter(c => matches(c.id))
                if (cols.length === 0) return null
                const allOn = cols.every(c => grid.columns.includes(c.id))
                return (
                  <div key={group.id} className="mb-4">
                    <div className="sticky top-0 z-10 -mx-1 mb-1 flex items-center justify-between bg-white/95 px-1 py-1 backdrop-blur">
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-900">
                        <span className={`inline-block h-2 w-2 rounded-full ${group.swatch}`} />
                        {group.label}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          allOn
                            ? grid.setColumns(grid.columns.filter(id => !cols.some(c => c.id === id)))
                            : grid.setColumns([...grid.columns, ...cols.map(c => c.id)])
                        }
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        {allOn ? 'Clear' : 'Add all'}
                      </button>
                    </div>
                    <ul className="space-y-0.5">
                      {cols.map(col => {
                        const checked = grid.columns.includes(col.id)
                        const caption = resolveCaption(col, ctx)
                        return (
                          <li key={col.id}>
                            <label
                              className={`flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-gray-50 ${
                                checked ? 'bg-blue-50/60' : ''
                              }`}
                              title={col.description}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => grid.toggleColumn(col.id)}
                                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm text-gray-800">{col.fullLabel}</span>
                                <span className="block truncate text-xs text-gray-500">
                                  {caption ? `${caption} · ` : ''}
                                  {col.description}
                                </span>
                              </span>
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Shown, in order */}
          <section className="flex min-h-0 flex-col">
            <div className="flex items-center justify-between px-6 pt-4 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Shown · {grid.columns.length}
              </span>
              <button
                type="button"
                onClick={() => grid.setColumns([DATE_COLUMN_ID])}
                disabled={grid.columns.length <= 1}
                className="text-xs font-medium text-gray-500 hover:text-gray-800 disabled:opacity-40"
              >
                Remove all
              </button>
            </div>
            <ol className="min-h-0 flex-1 space-y-1 overflow-y-auto px-6 pb-4">
              {grid.columns.map((id, index) => {
                const col = getColumn(id)
                if (!col) return null
                const isDate = id === DATE_COLUMN_ID
                const meta = groupMeta(col.group)
                const caption = resolveCaption(col, ctx)
                const isDrop = dropTarget?.id === id
                return (
                  <li
                    key={id}
                    draggable={!isDate}
                    onDragStart={e => {
                      setDragId(id)
                      e.dataTransfer.effectAllowed = 'move'
                      e.dataTransfer.setData('text/plain', id)
                    }}
                    onDragOver={e => !isDate && onRowDragOver(e, id)}
                    onDrop={e => !isDate && onRowDrop(e, id)}
                    onDragEnd={() => {
                      setDragId(null)
                      setDropTarget(null)
                    }}
                    className={`relative flex items-center gap-2 rounded-md border px-2 py-1.5 ${
                      isDate ? 'border-dashed border-gray-200 bg-gray-50' : 'border-gray-200 bg-white'
                    } ${dragId === id ? 'opacity-40' : ''}`}
                  >
                    {isDrop && (
                      <span
                        className={`pointer-events-none absolute inset-x-0 h-0.5 bg-blue-500 ${
                          dropTarget!.side === 'before' ? '-top-[3px]' : '-bottom-[3px]'
                        }`}
                      />
                    )}
                    <span
                      className={`shrink-0 text-gray-300 ${isDate ? '' : 'cursor-grab active:cursor-grabbing'}`}
                      aria-hidden
                    >
                      <GripVertical className="w-4 h-4" />
                    </span>
                    <span className="w-5 shrink-0 text-right text-xs tabular-nums text-gray-400">{index + 1}</span>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${meta.swatch}`} title={meta.label} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-gray-800">{col.fullLabel}</span>
                      {caption && <span className="block truncate text-[11px] text-gray-400">{caption}</span>}
                    </span>
                    {isDate ? (
                      <span className="text-[11px] text-gray-400">always first</span>
                    ) : (
                      <span className="flex shrink-0 items-center">
                        <IconButton
                          label="Move up"
                          disabled={index <= 1}
                          onClick={() => grid.moveColumnBy(id, -1)}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </IconButton>
                        <IconButton
                          label="Move down"
                          disabled={index >= grid.columns.length - 1}
                          onClick={() => grid.moveColumnBy(id, 1)}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </IconButton>
                        <IconButton label={`Remove ${col.fullLabel}`} onClick={() => grid.removeColumn(id)}>
                          <X className="w-4 h-4" />
                        </IconButton>
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          </section>
        </div>

        {/* Footer */}
        <footer className="flex flex-wrap items-center gap-2 border-t border-gray-200 bg-gray-50 px-6 py-3">
          <div className="mr-auto text-sm text-gray-600">
            {grid.currentView ? (
              <>
                <span className="font-medium text-gray-900">{grid.currentView.name}</span>
                {grid.isDirty && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">modified</span>}
              </>
            ) : (
              'Custom columns'
            )}
          </div>

          {savingAs ? (
            <form
              className="flex items-center gap-2"
              onSubmit={e => {
                e.preventDefault()
                commitSaveAs()
              }}
            >
              <input
                ref={saveInputRef}
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder="View name"
                className="w-48 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
              <Button type="submit" size="sm" disabled={!saveName.trim()}>
                Save
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setSavingAs(false)}>
                Cancel
              </Button>
            </form>
          ) : (
            <>
              {grid.isDirty && grid.currentView && (
                <Button size="sm" variant="ghost" onClick={grid.resetView}>
                  Reset
                </Button>
              )}
              {grid.canUpdateCurrentView && (
                <Button size="sm" variant="outline" onClick={() => grid.updateView(grid.viewId)}>
                  Update “{grid.currentView?.name}”
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setSavingAs(true)}>
                Save as new view
              </Button>
              <Button size="sm" onClick={onClose}>
                Done
              </Button>
            </>
          )}
        </footer>
      </aside>
    </div>,
    document.body
  )
}

function IconButton({
  label,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
      {...props}
    >
      {children}
    </button>
  )
}

interface ViewChipProps {
  view: ReportView
  active: boolean
  isDefault: boolean
  onSelect: () => void
  onSetDefault: () => void
  onRename?: () => void
  onDelete?: () => void
}

function ViewChip({ view, active, isDefault, onSelect, onSetDefault, onRename, onDelete }: ViewChipProps) {
  return (
    <div
      className={`group inline-flex items-center gap-1 rounded-full border pl-1 pr-1.5 py-0.5 text-sm transition-colors ${
        active
          ? 'border-blue-500 bg-blue-50 text-blue-800'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
      }`}
    >
      <button
        type="button"
        onClick={onSetDefault}
        className={`rounded-full p-1 ${isDefault ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
        aria-label={isDefault ? `${view.name} is the default view` : `Make ${view.name} the default view`}
        title={isDefault ? 'Default view' : 'Make default'}
      >
        <Star className="w-3.5 h-3.5" fill={isDefault ? 'currentColor' : 'none'} />
      </button>
      <button type="button" onClick={onSelect} className="flex items-center gap-1.5 pr-1 font-medium" title={view.description}>
        {active && <Check className="w-3.5 h-3.5" />}
        {view.name}
        <span className="text-xs font-normal text-gray-400">{view.columns.length}</span>
      </button>
      {onRename && (
        <button
          type="button"
          onClick={onRename}
          className="rounded-full p-1 text-gray-300 hover:text-gray-600"
          aria-label={`Rename ${view.name}`}
          title="Rename"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="rounded-full p-1 text-gray-300 hover:text-red-600"
          aria-label={`Delete ${view.name}`}
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
