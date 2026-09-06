'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Columns3, FileText } from 'lucide-react'

const TABS = [
  { href: '/dashboard/reports', label: 'Key Metrics', icon: FileText },
  { href: '/dashboard/reports/charts', label: 'Charts & Trends', icon: BarChart3 },
  { href: '/dashboard/reports/compare', label: 'Compare', icon: Columns3 },
]

/** Tab strip shared by the Reports pages so they switch between each other. */
export default function ReportsSubNav() {
  const pathname = usePathname()
  return (
    <nav className="flex gap-1 rounded-lg bg-gray-100 p-1 w-fit" aria-label="Report sections">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
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
