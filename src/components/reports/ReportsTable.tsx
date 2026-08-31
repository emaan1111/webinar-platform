'use client'

import React, { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronsLeft,
  ChevronsRight,
  EyeOff,
  GripVertical,
  MoreHorizontal,
  MoveLeft,
  MoveRight,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import {
  COLUMN_GROUPS,
  DATE_COLUMN_ID,
  formatCount,
  formatCurrency,
  formatDateLabel,
  formatDateLong,
  formatPercent,
  getColumn,
  groupMeta,
  PercentTone,
  REPORT_COLUMNS,
  ReportColumn,
  ReportRow,
  ReportTotals,
  resolveCaption,
} from '@/lib/reports/columns'
import { sortReports } from '@/lib/reports/state'
import type { ReportGrid } from '@/lib/reports/useReportGrid'
import Popover, { MenuDivider, MenuItem } from './Popover'

interface ReportsTableProps {
  reports: ReportRow[]
  totals: ReportTotals | null
  grid: ReportGrid
  engagementMinutes: number
  loading: boolean
  dateRange: { from: string; to: string }
  buildDetailsHref: (metric: string, params: Record<string, string>) => string
  onOpenColumns: () => void
}

const isNumericKind = (col: ReportColumn) => col.kind !== 'date'

export default function ReportsTable({
  reports,
  totals,
  grid,
  engagementMinutes,
  loading,
  dateRange,
  buildDetailsHref,
  onOpenColumns,
}: ReportsTableProps) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ id: string; side: 'before' | 'after' } | null>(null)
  const [menuFor, setMenuFor] = useState<{ id: string; anchor: HTMLElement } | null>(null)
  const [addAnchor, setAddAnchor] = useState<HTMLElement | null>(null)

  const columns = useMemo(
    () => grid.columns.map(getColumn).filter((c): c is ReportColumn => Boolean(c)),
    [grid.columns]
  )
  const rows = useMemo(() => sortReports(reports, grid.sort), [reports, grid.sort])
  const ctx = useMemo(() => ({ engagementMinutes }), [engagementMinutes])

  const compact = grid.density === 'compact'
  const cellPad = compact ? 'px-3 py-1.5' : 'px-3 py-2.5'
  const textSize = compact ? 'text-xs' : 'text-sm'

  const closeMenu = useCallback(() => setMenuFor(null), [])
  const closeAdd = useCallback(() => setAddAnchor(null), [])

  // --- header drag & drop -------------------------------------------------
  const onHeaderDragOver = (e: React.DragEvent<HTMLTableCellElement>, id: string) => {
    if (!dragId || dragId === id || id === DATE_COLUMN_ID) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const rect = e.currentTarget.getBoundingClientRect()
    const side = e.clientX < rect.left + rect.width / 2 ? 'before' : 'after'
    if (dropTarget?.id !== id || dropTarget.side !== side) setDropTarget({ id, side })
  }
  const onHeaderDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    if (dragId && dropTarget?.id === id) grid.moveColumnRelative(dragId, id, dropTarget.side)
    setDragId(null)
    setDropTarget(null)
  }
  const endDrag = () => {
    setDragId(null)
    setDropTarget(null)
  }

  const skeletonRows = loading && reports.length === 0 ? 8 : 0

  return (
    // `isolate` keeps the sticky cells' z-indexes inside the card, so they
    // never paint over the dashboard's own sticky top bar.
    <div className="relative isolate">
      {loading && reports.length > 0 && (
        <div className="absolute inset-x-0 top-0 z-40 h-0.5 overflow-hidden bg-blue-100">
          <div className="h-full bg-blue-500 animate-progress-indeterminate" />
        </div>
      )}

      <div
        className={`overflow-auto rounded-b-xl max-h-[calc(100vh-13rem)] ${
          loading && reports.length > 0 ? 'opacity-60 transition-opacity' : ''
        }`}
      >
        <table className={`min-w-full border-separate border-spacing-0 ${textSize}`}>
          <thead>
            <tr>
              {columns.map((col, index) => {
                const isDate = col.id === DATE_COLUMN_ID
                const numeric = isNumericKind(col)
                const sorted = grid.sort?.columnId === col.id ? grid.sort.direction : null
                const meta = groupMeta(col.group)
                const caption = resolveCaption(col, ctx)
                const drop = dropTarget?.id === col.id ? dropTarget.side : null
                return (
                  <th
                    key={col.id}
                    scope="col"
                    draggable={!isDate}
                    onDragStart={e => {
                      setDragId(col.id)
                      e.dataTransfer.effectAllowed = 'move'
                      e.dataTransfer.setData('text/plain', col.id)
                    }}
                    onDragOver={e => onHeaderDragOver(e, col.id)}
                    onDrop={e => onHeaderDrop(e, col.id)}
                    onDragEnd={endDrag}
                    title={col.description}
                    className={`group/th sticky top-0 whitespace-nowrap border-b border-gray-200 bg-gray-50 font-medium text-gray-600 ${cellPad} ${
                      isDate ? 'left-0 z-30 shadow-[inset_-1px_0_0_#e5e7eb]' : 'z-20 cursor-grab active:cursor-grabbing'
                    } ${dragId === col.id ? 'opacity-40' : ''} ${numeric ? 'text-right' : 'text-left'}`}
                  >
                    {drop && (
                      <span
                        className={`pointer-events-none absolute inset-y-1 w-0.5 rounded bg-blue-500 ${
                          drop === 'before' ? 'left-0' : 'right-0'
                        }`}
                      />
                    )}
                    <div className={`flex items-center gap-1 ${numeric ? 'justify-end' : ''}`}>
                      {!isDate && (
                        <GripVertical
                          className="h-3.5 w-3.5 shrink-0 text-gray-300 opacity-0 transition-opacity group-hover/th:opacity-100"
                          aria-hidden
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => grid.toggleSort(col.id)}
                        className={`inline-flex items-center gap-1 rounded px-0.5 hover:text-gray-900 ${
                          sorted ? 'text-gray-900' : ''
                        }`}
                        aria-label={`Sort by ${col.fullLabel}`}
                      >
                        <span>{col.label}</span>
                        {sorted === 'asc' ? (
                          <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
                        ) : sorted === 'desc' ? (
                          <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-gray-300 opacity-0 transition-opacity group-hover/th:opacity-100" />
                        )}
                      </button>
                      {!isDate && (
                        <button
                          type="button"
                          onClick={e => setMenuFor({ id: col.id, anchor: e.currentTarget })}
                          className={`rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 ${
                            menuFor?.id === col.id ? 'bg-gray-200 text-gray-700' : 'opacity-0 group-hover/th:opacity-100 focus:opacity-100'
                          }`}
                          aria-label={`Options for ${col.fullLabel}`}
                          aria-haspopup="menu"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div
                      className={`mt-0.5 flex items-center gap-1 text-[10px] font-normal uppercase tracking-wide text-gray-400 ${
                        numeric ? 'justify-end' : ''
                      }`}
                    >
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${meta.swatch}`} aria-hidden />
                      <span>{caption ?? meta.label}</span>
                    </div>
                    {index === 0 && <span className="sr-only">Date</span>}
                  </th>
                )
              })}
              <th
                scope="col"
                // Pinned to the right edge so "add a column" is reachable
                // without scrolling to the end of a wide table.
                className={`sticky right-0 top-0 z-20 w-12 border-b border-gray-200 bg-gray-50 shadow-[inset_1px_0_0_#e5e7eb] ${cellPad} text-left`}
              >
                <button
                  type="button"
                  onClick={e => setAddAnchor(e.currentTarget)}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-md border border-dashed text-gray-400 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 ${
                    addAnchor ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-300'
                  }`}
                  aria-label="Add column"
                  title="Add column"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </th>
            </tr>
          </thead>

          <tbody>
            {skeletonRows > 0
              ? Array.from({ length: skeletonRows }).map((_, r) => (
                  <tr key={`sk-${r}`}>
                    {columns.map((col, c) => (
                      <td
                        key={col.id}
                        className={`border-b border-gray-100 ${cellPad} ${
                          c === 0 ? 'sticky left-0 z-10 bg-white shadow-[inset_-1px_0_0_#f3f4f6]' : ''
                        }`}
                      >
                        <div
                          className={`h-3.5 animate-pulse rounded bg-gray-100 ${isNumericKind(col) ? 'ml-auto w-12' : 'w-24'}`}
                        />
                      </td>
                    ))}
                    <td className="border-b border-gray-100" />
                  </tr>
                ))
              : rows.map(row => (
                  <tr key={row.date} className="group/row">
                    {columns.map((col, c) => {
                      const numeric = isNumericKind(col)
                      return (
                        <td
                          key={col.id}
                          className={`whitespace-nowrap border-b border-gray-100 tabular-nums transition-colors group-hover/row:bg-blue-50 ${cellPad} ${
                            c === 0
                              ? 'sticky left-0 z-10 bg-white font-medium text-gray-900 shadow-[inset_-1px_0_0_#f3f4f6]'
                              : 'text-gray-800'
                          } ${numeric ? 'text-right' : 'text-left'}`}
                        >
                          <Cell
                            col={col}
                            value={col.value(row)}
                            href={col.metric ? buildDetailsHref(col.metric, { date: row.date }) : undefined}
                          />
                        </td>
                      )
                    })}
                    <td className="border-b border-gray-100 group-hover/row:bg-blue-50" />
                  </tr>
                ))}
          </tbody>

          {totals && rows.length > 0 && (
            <tfoot>
              <tr>
                {columns.map((col, c) => {
                  const numeric = isNumericKind(col)
                  const value = col.total ? col.total(totals) : null
                  return (
                    <td
                      key={col.id}
                      className={`sticky bottom-0 whitespace-nowrap border-t-2 border-gray-200 bg-gray-50 font-semibold tabular-nums text-gray-900 ${cellPad} ${
                        c === 0 ? 'left-0 z-30 shadow-[inset_-1px_0_0_#e5e7eb]' : 'z-20'
                      } ${numeric ? 'text-right' : 'text-left'}`}
                    >
                      {col.id === DATE_COLUMN_ID ? (
                        <span className="flex flex-col leading-tight">
                          <span>Total</span>
                          <span className="text-[10px] font-normal uppercase tracking-wide text-gray-400">
                            {totals.days} {totals.days === 1 ? 'day' : 'days'}
                          </span>
                        </span>
                      ) : (
                        <Cell
                          col={col}
                          value={value}
                          href={
                            col.metric
                              ? buildDetailsHref(col.metric, { startDate: dateRange.from, endDate: dateRange.to })
                              : undefined
                          }
                          emphasis
                        />
                      )}
                    </td>
                  )
                })}
                <td className="sticky bottom-0 z-20 border-t-2 border-gray-200 bg-gray-50" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Header menu */}
      {menuFor && (
        <HeaderMenu
          anchor={menuFor.anchor}
          columnId={menuFor.id}
          grid={grid}
          onClose={closeMenu}
          onOpenColumns={onOpenColumns}
        />
      )}

      {/* Add-column popover */}
      <AddColumnPopover
        anchor={addAnchor}
        grid={grid}
        engagementMinutes={engagementMinutes}
        onClose={closeAdd}
        onOpenColumns={onOpenColumns}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cells
// ---------------------------------------------------------------------------

function toneClass(value: number, tone?: PercentTone, signed?: boolean) {
  if (signed) return value > 0 ? 'bg-emerald-500' : value < 0 ? 'bg-red-500' : 'bg-gray-300'
  if (!tone) return 'bg-gray-300'
  if (value >= tone.good) return 'bg-emerald-500'
  if (value >= tone.warn) return 'bg-amber-400'
  return 'bg-red-400'
}

function Cell({
  col,
  value,
  href,
  emphasis = false,
}: {
  col: ReportColumn
  value: number | string | null | undefined
  href?: string
  emphasis?: boolean
}) {
  if (value == null || value === '') return <span className="text-gray-300">—</span>

  if (col.kind === 'date' && typeof value === 'string') {
    return (
      <span title={formatDateLong(value)}>{formatDateLabel(value)}</span>
    )
  }

  const n = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(n)) return <span>{String(value)}</span>

  if (col.kind === 'percent') {
    const zero = n === 0
    return (
      <span className={`inline-flex items-center gap-1.5 ${zero ? 'text-gray-300' : ''}`}>
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${zero ? 'bg-gray-200' : toneClass(n, col.tone, col.signed)}`} aria-hidden />
        <span className={col.signed && !zero ? (n > 0 ? 'text-emerald-700' : 'text-red-600') : ''}>{formatPercent(n)}</span>
      </span>
    )
  }

  if (col.kind === 'currency') {
    if (n === 0) return <span className="text-gray-300">{formatCurrency(0)}</span>
    const cls = col.signed ? (n > 0 ? 'text-emerald-700' : 'text-red-600') : ''
    return <span className={cls}>{formatCurrency(n)}</span>
  }

  // count
  if (n === 0) return <span className="text-gray-300">0</span>
  const text = formatCount(n)
  if (href) {
    return (
      <Link
        href={href}
        className={`rounded-sm underline decoration-gray-300 decoration-dotted underline-offset-[3px] transition-colors hover:text-blue-700 hover:decoration-blue-400 ${
          emphasis ? 'font-semibold' : ''
        }`}
        title="See who these people are"
      >
        {text}
      </Link>
    )
  }
  return <span>{text}</span>
}

// ---------------------------------------------------------------------------
// Header menu
// ---------------------------------------------------------------------------

function HeaderMenu({
  anchor,
  columnId,
  grid,
  onClose,
  onOpenColumns,
}: {
  anchor: HTMLElement
  columnId: string
  grid: ReportGrid
  onClose: () => void
  onOpenColumns: () => void
}) {
  const col = getColumn(columnId)
  const index = grid.columns.indexOf(columnId)
  const last = grid.columns.length - 1
  if (!col) return null
  const run = (fn: () => void) => () => {
    fn()
    onClose()
  }
  const sorted = grid.sort?.columnId === columnId ? grid.sort.direction : null
  return (
    <Popover anchor={anchor} onClose={onClose} align="end" width={232}>
      <div className="border-b border-gray-100 px-3 py-2">
        <div className="text-sm font-medium text-gray-900">{col.fullLabel}</div>
        <div className="mt-0.5 text-xs leading-snug text-gray-500">{col.description}</div>
      </div>
      <div className="py-1" role="menu">
        <MenuItem
          icon={<ArrowUp />}
          onClick={run(() => grid.setSort({ columnId, direction: 'asc' }))}
          disabled={sorted === 'asc'}
        >
          Sort low → high
        </MenuItem>
        <MenuItem
          icon={<ArrowDown />}
          onClick={run(() => grid.setSort({ columnId, direction: 'desc' }))}
          disabled={sorted === 'desc'}
        >
          Sort high → low
        </MenuItem>
        {sorted && (
          <MenuItem icon={<ArrowUpDown />} onClick={run(() => grid.setSort(null))}>
            Clear sort
          </MenuItem>
        )}
        <MenuDivider />
        <MenuItem icon={<MoveLeft />} onClick={run(() => grid.moveColumnBy(columnId, -1))} disabled={index <= 1}>
          Move left
        </MenuItem>
        <MenuItem icon={<MoveRight />} onClick={run(() => grid.moveColumnBy(columnId, 1))} disabled={index >= last}>
          Move right
        </MenuItem>
        <MenuItem icon={<ChevronsLeft />} onClick={run(() => grid.moveColumn(index, 1))} disabled={index <= 1}>
          Move to start
        </MenuItem>
        <MenuItem icon={<ChevronsRight />} onClick={run(() => grid.moveColumn(index, last))} disabled={index >= last}>
          Move to end
        </MenuItem>
        <MenuDivider />
        <MenuItem icon={<SlidersHorizontal />} onClick={run(onOpenColumns)}>
          All columns…
        </MenuItem>
        <MenuItem icon={<EyeOff />} danger onClick={run(() => grid.removeColumn(columnId))}>
          Hide column
        </MenuItem>
      </div>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// Add-column popover
// ---------------------------------------------------------------------------

function AddColumnPopover({
  anchor,
  grid,
  engagementMinutes,
  onClose,
  onOpenColumns,
}: {
  anchor: HTMLElement | null
  grid: ReportGrid
  engagementMinutes: number
  onClose: () => void
  onOpenColumns: () => void
}) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const showLegacy = Boolean(q)

  const groups = COLUMN_GROUPS.map(g => ({
    meta: g,
    cols: REPORT_COLUMNS.filter(
      c =>
        c.group === g.id &&
        c.id !== DATE_COLUMN_ID &&
        (showLegacy || !c.legacy || grid.columns.includes(c.id)) &&
        (!q || `${c.label} ${c.fullLabel} ${c.description}`.toLowerCase().includes(q))
    ),
  })).filter(g => g.cols.length > 0)

  return (
    <Popover anchor={anchor} onClose={onClose} align="end" width={300} className="flex flex-col">
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Find a column…"
            className="w-full rounded-md border border-gray-300 py-1.5 pl-8 pr-7 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="py-1">
        {groups.length === 0 && <div className="px-3 py-6 text-center text-sm text-gray-500">No columns match.</div>}
        {groups.map(({ meta, cols }) => (
          <div key={meta.id} className="pb-1">
            <div className="flex items-center gap-1.5 px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${meta.swatch}`} />
              {meta.label}
            </div>
            {cols.map(col => {
              const on = grid.columns.includes(col.id)
              const caption = resolveCaption(col, { engagementMinutes })
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => grid.toggleColumn(col.id)}
                  className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm hover:bg-gray-100 ${
                    on ? 'text-gray-900' : 'text-gray-700'
                  }`}
                  title={col.description}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      on ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white'
                    }`}
                    aria-hidden
                  >
                    {on && <Plus className="h-3 w-3 rotate-45" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{col.fullLabel}</span>
                    {caption && <span className="block truncate text-[11px] text-gray-400">{caption}</span>}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
      <div className="sticky bottom-0 border-t border-gray-100 bg-white p-1.5">
        <MenuItem
          icon={<SlidersHorizontal />}
          onClick={() => {
            onClose()
            onOpenColumns()
          }}
        >
          Manage columns &amp; views…
        </MenuItem>
      </div>
    </Popover>
  )
}
