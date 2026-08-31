import { formatCellText, getColumn, ReportRow, ReportTotals, resolveCaption } from './columns'

/** RFC 4180-style quoting: anything with a comma, quote or newline gets wrapped. */
export function csvEscape(value: string | number | null | undefined): string {
  if (value == null) return ''
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export const toCsv = (rows: (string | number | null | undefined)[][]) =>
  rows.map(row => row.map(csvEscape).join(',')).join('\r\n')

interface BuildCsvArgs {
  columnIds: string[]
  reports: ReportRow[]
  totals: ReportTotals | null
  engagementMinutes: number
}

/**
 * Exports exactly what is on screen: the visible columns, in their current
 * order, plus the totals row. Headers use the full column name so the sheet
 * is readable away from the grid.
 */
export function buildReportCsv({ columnIds, reports, totals, engagementMinutes }: BuildCsvArgs): string {
  const columns = columnIds.map(getColumn).filter((c): c is NonNullable<typeof c> => Boolean(c))

  const headers = columns.map(col => {
    const caption = resolveCaption(col, { engagementMinutes })
    return caption ? `${col.fullLabel} (${caption})` : col.fullLabel
  })

  const body = reports.map(r => columns.map(col => formatCellText(col, col.value(r))))

  const footer = totals
    ? [columns.map(col => (col.total ? formatCellText(col, col.total(totals)) : ''))]
    : []

  return toCsv([headers, ...body, ...footer])
}

export function downloadCsv(filename: string, csv: string) {
  // BOM so Excel opens UTF-8 (e.g. the ÷ in some headers) without mangling it.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
