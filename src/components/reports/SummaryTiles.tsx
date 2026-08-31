'use client'

import React from 'react'
import { DollarSign, PiggyBank, Receipt, ShoppingCart, UserCheck, Users } from 'lucide-react'
import { formatCount, formatCurrency, formatPercent, ReportTotals } from '@/lib/reports/columns'

interface SummaryTilesProps {
  totals: ReportTotals | null
  loading: boolean
}

/** Six numbers worth reading before the table. */
export default function SummaryTiles({ totals, loading }: SummaryTilesProps) {
  if (!totals) {
    if (!loading) return null
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
            <div className="mt-3 h-6 w-24 animate-pulse rounded bg-gray-100" />
            <div className="mt-2 h-3 w-20 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    )
  }

  const profitTone = totals.profit > 0 ? 'text-emerald-700' : totals.profit < 0 ? 'text-red-600' : 'text-gray-900'

  const tiles: Tile[] = [
    {
      label: 'Ad spend',
      value: formatCurrency(totals.spend),
      sub: totals.registrations > 0 ? `${formatCurrency(totals.costPerRegistration)} per registration` : 'No registrations yet',
      icon: <DollarSign className="h-4 w-4" />,
      accent: 'bg-sky-50 text-sky-600',
    },
    {
      label: 'Registrations',
      value: formatCount(totals.registrations),
      sub: totals.visitors > 0 ? `${formatPercent(totals.registrationRate)} of ${formatCount(totals.visitors)} visitors` : `${formatCount(totals.visitors)} visitors`,
      icon: <Users className="h-4 w-4" />,
      accent: 'bg-slate-100 text-slate-600',
    },
    {
      label: 'Live attendance',
      value: totals.sessionSettled > 0 ? formatPercent(totals.sessionAttendanceRate) : '—',
      sub:
        totals.sessionSettled > 0
          ? `${formatCount(totals.sessionLive)} of ${formatCount(totals.sessionSettled)} whose session ran`
          : 'No sessions have run yet',
      icon: <UserCheck className="h-4 w-4" />,
      accent: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Sales',
      value: formatCount(totals.salesTotal),
      sub: totals.salesTotal > 0 ? `${formatCurrency(totals.costPerSale)} per sale` : 'No sales in range',
      icon: <ShoppingCart className="h-4 w-4" />,
      accent: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Revenue',
      value: formatCurrency(totals.revenue),
      sub: totals.salesTotal > 0 ? `${formatCurrency(totals.averageOrderValue)} average order` : ' ',
      icon: <Receipt className="h-4 w-4" />,
      accent: 'bg-teal-50 text-teal-600',
    },
    {
      label: 'Profit',
      value: formatCurrency(totals.profit),
      valueClass: profitTone,
      sub: totals.spend > 0 ? `ROI ${formatPercent(totals.roi)}` : 'No ad spend recorded',
      icon: <PiggyBank className="h-4 w-4" />,
      accent: totals.profit < 0 ? 'bg-red-50 text-red-600' : 'bg-violet-50 text-violet-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {tiles.map(tile => (
        <div key={tile.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{tile.label}</span>
            <span className={`rounded-md p-1.5 ${tile.accent}`}>{tile.icon}</span>
          </div>
          <div className={`mt-2 text-xl font-semibold tabular-nums leading-tight ${tile.valueClass ?? 'text-gray-900'}`}>
            {tile.value}
          </div>
          <div className="mt-1 truncate text-xs text-gray-500" title={tile.sub}>
            {tile.sub}
          </div>
        </div>
      ))}
    </div>
  )
}

interface Tile {
  label: string
  value: string
  valueClass?: string
  sub: string
  icon: React.ReactNode
  accent: string
}
