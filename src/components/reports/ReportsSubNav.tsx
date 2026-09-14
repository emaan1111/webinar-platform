'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Calculator, Columns3, FileText } from 'lucide-react'

const TABS = [
  { href: '/dashboard/reports', label: 'Key Metrics', icon: FileText, carriesFilters: false },
  { href: '/dashboard/reports/charts', label: 'Charts & Trends', icon: BarChart3, carriesFilters: false },
  { href: '/dashboard/reports/compare', label: 'Compare', icon: Columns3, carriesFilters: false },
  // The planner seeds itself from whatever filter you were looking at, so it
  // is handed the current one in the link rather than guessing.
  { href: '/dashboard/reports/profit', label: 'Profit Planner', icon: Calculator, carriesFilters: true },
]

interface ReportsSubNavProps {
  /**
   * The current filter as a query string (range, webinars, engagement
   * threshold, registrant filters). Tabs that read it get it appended.
   * The timezone is a dashboard-wide preference and carries on its own.
   */
  filterQuery?: string
}

/** Tab strip shared by the Reports pages so they switch between each other. */
export default function ReportsSubNav({ filterQuery }: ReportsSubNavProps) {
  const pathname = usePathname()
  return (
    <nav className="flex gap-1 rounded-lg bg-gray-100 p-1 w-fit" aria-label="Report sections">
      {TABS.map(({ href, label, icon: Icon, carriesFilters }) => {
        const active = pathname === href
        const target = carriesFilters && filterQuery && !active ? `${href}?${filterQuery}` : href
        return (
          <Link
            key={href}
            href={target}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
