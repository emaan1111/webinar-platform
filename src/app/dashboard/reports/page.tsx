'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import MultiSelect from '@/components/ui/MultiSelect'
import {
  Calendar,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  UserCheck,
  Eye,
  Clock,
  ShoppingCart,
  Settings,
  BarChart3,
  FileText,
  Plus,
  Trash2,
  Edit2,
  X
} from 'lucide-react'

type ReportData = {
  date: string
  fbResults: {
    spend: number
    impressions: number
    clicks: number
    ctr: number
  }
  visitors: number
  registrations: number
  attendees: number
  replayAttendees: number
  engaged: number
  sales: number
  // Calculated percentages
  registrationRate: number
  attendanceRate: number
  engagedPerVisitor: number
  engagedPerRegistered: number
  engagementRate: number
  costPerReg: number
}

type ColumnId =
  | 'adSpend'
  | 'fbClicks'
  | 'fbCTR'
  | 'visitors'
  | 'registrations'
  | 'attendees'
  | 'replayAttendees'
  | 'engaged'
  | 'sales'
  | 'registrationRate'
  | 'attendanceRate'
  | 'engagedPerVisitor'
  | 'engagedPerRegistered'
  | 'engagementRate'
  | 'costPerReg'

type ColumnView = {
  id: string
  name: string
  columns: ColumnId[]
  isDefault?: boolean
}

const columnOptions: { id: ColumnId; label: string }[] = [
  { id: 'adSpend', label: 'Ad Spend' },
  { id: 'fbClicks', label: 'FB Clicks' },
  { id: 'fbCTR', label: 'FB CTR' },
  { id: 'visitors', label: 'Visitors' },
  { id: 'registrations', label: 'Registrations' },
  { id: 'attendees', label: 'Attendees' },
  { id: 'replayAttendees', label: 'Replay Attendees' },
  { id: 'engaged', label: 'Engaged' },
  { id: 'sales', label: 'Sales' },
  { id: 'registrationRate', label: '% Reg' },
  { id: 'attendanceRate', label: '% Attend' },
  { id: 'engagedPerVisitor', label: '% Eng/Visitor' },
  { id: 'engagedPerRegistered', label: '% Eng/Registered' },
  { id: 'engagementRate', label: '% Eng/Attendee' },
  { id: 'costPerReg', label: 'Cost/Reg' }
]

const defaultColumnView: ColumnView = {
  id: 'default',
  name: 'Core Performance',
  columns: [
    'adSpend',
    'fbClicks',
    'fbCTR',
    'visitors',
    'registrations',
    'attendees',
    'replayAttendees',
    'engaged',
    'sales',
    'registrationRate',
    'attendanceRate',
    'engagedPerVisitor',
    'engagedPerRegistered',
    'engagementRate',
    'costPerReg'
  ],
  isDefault: true
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<ReportData[]>([])
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [engagementMinutes, setEngagementMinutes] = useState(30)
  const [showSettings, setShowSettings] = useState(false)
  const [views, setViews] = useState<ColumnView[]>([defaultColumnView])
  const [activeViewId, setActiveViewId] = useState<string>(defaultColumnView.id)
  const [showViewBuilder, setShowViewBuilder] = useState(false)
  const [editingViewId, setEditingViewId] = useState<string | null>(null)
  const [viewNameInput, setViewNameInput] = useState('')
  const [viewColumnsInput, setViewColumnsInput] = useState<ColumnId[]>(defaultColumnView.columns)
  const [webinarOptions, setWebinarOptions] = useState<{ id: string; label: string }[]>([])
  const [selectedWebinars, setSelectedWebinars] = useState<string[]>([])
  const pathname = usePathname()
  const activeView = views.find(view => view.id === activeViewId) || defaultColumnView
  const activeColumns = activeView?.columns || defaultColumnView.columns

  const openCreateView = () => {
    setEditingViewId(null)
    setViewNameInput(`Custom View ${views.length + 1}`)
    setViewColumnsInput(activeColumns)
    setShowViewBuilder(true)
  }

  const openEditView = () => {
    if (!activeView) return
    setEditingViewId(activeView.id)
    setViewNameInput(activeView.name)
    setViewColumnsInput(activeView.columns)
    setShowViewBuilder(true)
  }

  const toggleColumnSelection = (columnId: ColumnId) => {
    setViewColumnsInput(prev =>
      prev.includes(columnId) ? prev.filter(id => id !== columnId) : [...prev, columnId]
    )
  }

  const handleSaveView = () => {
    if (viewColumnsInput.length === 0) return

    const trimmedName = viewNameInput.trim() || `Custom View ${views.length + 1}`

    if (editingViewId) {
      setViews(prev =>
        prev.map(view =>
          view.id === editingViewId
            ? { ...view, name: trimmedName, columns: viewColumnsInput }
            : view
        )
      )
      setActiveViewId(editingViewId)
    } else {
      const id = `view-${Date.now()}`
      setViews(prev => [...prev, { id, name: trimmedName, columns: viewColumnsInput }])
      setActiveViewId(id)
    }
    setShowViewBuilder(false)
  }

  const handleDeleteView = (viewId: string) => {
    const target = views.find(view => view.id === viewId)
    if (!target || target.isDefault) return
    setViews(prev => prev.filter(view => view.id !== viewId))
    if (activeViewId === viewId) {
      setActiveViewId(defaultColumnView.id)
    }
  }

  useEffect(() => {
    // Set default date range (last 30 days)
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    
    setDateRange({
      from: thirtyDaysAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    })
  }, [])

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchReports()
    }
  }, [dateRange, engagementMinutes, selectedWebinars, webinarOptions])

  useEffect(() => {
    const loadWebinars = async () => {
      try {
        const response = await fetch('/api/webinars')
        if (!response.ok) throw new Error('Failed to load webinars')
        const data = await response.json()
        const labelCounts: Record<string, number> = {}
        const options =
          data.webinars?.map((webinar: any) => {
            const baseLabel = webinar.internalName || webinar.title || 'Untitled Webinar'
            labelCounts[baseLabel] = (labelCounts[baseLabel] || 0) + 1
            const label =
              labelCounts[baseLabel] > 1 ? `${baseLabel} (${labelCounts[baseLabel]})` : baseLabel
            return { id: webinar.id, label }
          }) || []
        setWebinarOptions(options)
      } catch (err) {
        console.error('Failed to load webinars for reports', err)
      }
    }

    loadWebinars()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const selectedIds = webinarOptions
        .filter(option => selectedWebinars.includes(option.label))
        .map(option => option.id)
      const webinarFilter = selectedIds.length
        ? `&webinarIds=${encodeURIComponent(selectedIds.join(','))}`
        : ''
      const response = await fetch(
        `/api/reports?from=${dateRange.from}&to=${dateRange.to}&engagementMinutes=${engagementMinutes}${webinarFilter}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const headers = [
      'Date',
      'FB Spend',
      'FB Impressions',
      'FB Clicks',
      'FB CTR',
      'Visitors',
      'Registrations',
      'Attendees',
      'Replay Attendees',
      'Engaged',
      'Sales',
      '% Registrations',
      '% Attendance',
      '% Engaged/Visitor',
      '% Engaged/Registered',
      '% Engagement Live',
      'Cost per Reg'
    ]

    const rows = reports.map(r => [
      r.date,
      r.fbResults.spend.toFixed(2),
      r.fbResults.impressions,
      r.fbResults.clicks,
      r.fbResults.ctr.toFixed(2),
      r.visitors,
      r.registrations,
      r.attendees,
      r.replayAttendees,
      r.engaged,
      r.sales,
      r.registrationRate.toFixed(2),
      r.attendanceRate.toFixed(2),
      r.engagedPerVisitor.toFixed(2),
      r.engagedPerRegistered.toFixed(2),
      r.engagementRate.toFixed(2),
      r.costPerReg.toFixed(2)
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `webinar-reports-${dateRange.from}-to-${dateRange.to}.csv`
    a.click()
  }

  const calculateTotals = () => {
    if (reports.length === 0) return null

    const totals = reports.reduce((acc, r) => ({
      spend: acc.spend + r.fbResults.spend,
      visitors: acc.visitors + r.visitors,
      registrations: acc.registrations + r.registrations,
      attendees: acc.attendees + r.attendees,
      replayAttendees: acc.replayAttendees + r.replayAttendees,
      engaged: acc.engaged + r.engaged,
      sales: acc.sales + r.sales
    }), {
      spend: 0,
      visitors: 0,
      registrations: 0,
      attendees: 0,
      replayAttendees: 0,
      engaged: 0,
      sales: 0
    })

    return {
      ...totals,
      registrationRate: totals.visitors > 0 ? (totals.registrations / totals.visitors) * 100 : 0,
      attendanceRate: totals.registrations > 0 ? (totals.attendees / totals.registrations) * 100 : 0,
      engagedPerVisitor: totals.visitors > 0 ? (totals.engaged / totals.visitors) * 100 : 0,
      engagedPerRegistered: totals.registrations > 0 ? (totals.engaged / totals.registrations) * 100 : 0,
      engagementRate: totals.attendees > 0 ? (totals.engaged / totals.attendees) * 100 : 0,
      costPerReg: totals.registrations > 0 ? totals.spend / totals.registrations : 0
    }
  }

  const totals = calculateTotals()

  const renderHeaderLabel = (columnId: ColumnId) => {
    switch (columnId) {
      case 'adSpend':
        return 'Ad Spend'
      case 'fbClicks':
        return 'FB Clicks'
      case 'fbCTR':
        return 'FB CTR'
      case 'visitors':
        return 'Visitors'
      case 'registrations':
        return 'Registrations'
      case 'attendees':
        return 'Attendees'
      case 'replayAttendees':
        return 'Replay Attendees'
      case 'engaged':
        return `Engaged (${engagementMinutes}m+)`
      case 'sales':
        return 'Sales'
      case 'registrationRate':
        return '% Reg'
      case 'attendanceRate':
        return '% Attend'
      case 'engagedPerVisitor':
        return '% Eng/Vis'
      case 'engagedPerRegistered':
        return '% Eng/Reg'
      case 'engagementRate':
        return '% Eng Attendees'
      case 'costPerReg':
        return 'Cost/Reg'
      default:
        return columnId
    }
  }

  const renderCell = (columnId: ColumnId, report: ReportData) => {
    switch (columnId) {
      case 'adSpend':
        return `$${report.fbResults.spend.toFixed(2)}`
      case 'fbClicks':
        return <span className="text-gray-600">{report.fbResults.clicks.toLocaleString()}</span>
      case 'fbCTR':
        return <span className="text-gray-600">{report.fbResults.ctr.toFixed(2)}%</span>
      case 'visitors':
        return report.visitors.toLocaleString()
      case 'registrations':
        return <span className="font-medium text-gray-900">{report.registrations.toLocaleString()}</span>
      case 'attendees':
        return report.attendees.toLocaleString()
      case 'replayAttendees':
        return report.replayAttendees.toLocaleString()
      case 'engaged':
        return <span className="font-medium text-gray-900">{report.engaged.toLocaleString()}</span>
      case 'sales':
        return <span className="font-semibold text-gray-900">{report.sales.toLocaleString()}</span>
      case 'registrationRate':
        return <PercentageCell value={report.registrationRate} />
      case 'attendanceRate':
        return <PercentageCell value={report.attendanceRate} />
      case 'engagedPerVisitor':
        return <PercentageCell value={report.engagedPerVisitor} />
      case 'engagedPerRegistered':
        return <PercentageCell value={report.engagedPerRegistered} />
      case 'engagementRate':
        return <PercentageCell value={report.engagementRate} />
      case 'costPerReg':
        return `$${report.costPerReg.toFixed(2)}`
      default:
        return '--'
    }
  }

  const renderTotalsCell = (columnId: ColumnId) => {
    if (!totals) return '-'
    switch (columnId) {
      case 'adSpend':
        return `$${totals.spend.toFixed(2)}`
      case 'fbClicks':
        return '-'
      case 'fbCTR':
        return '-'
      case 'visitors':
        return totals.visitors.toLocaleString()
      case 'registrations':
        return totals.registrations.toLocaleString()
      case 'attendees':
        return totals.attendees.toLocaleString()
      case 'replayAttendees':
        return totals.replayAttendees.toLocaleString()
      case 'engaged':
        return totals.engaged.toLocaleString()
      case 'sales':
        return totals.sales.toLocaleString()
      case 'registrationRate':
        return <PercentageCell value={totals.registrationRate} />
      case 'attendanceRate':
        return <PercentageCell value={totals.attendanceRate} />
      case 'engagedPerVisitor':
        return <PercentageCell value={totals.engagedPerVisitor} />
      case 'engagedPerRegistered':
        return <PercentageCell value={totals.engagedPerRegistered} />
      case 'engagementRate':
        return <PercentageCell value={totals.engagementRate} />
      case 'costPerReg':
        return `$${totals.costPerReg.toFixed(2)}`
      default:
        return '-'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page header with sub-navigation */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Webinar Reports</h1>
              <p className="mt-1 text-sm text-gray-500">
                Comprehensive analytics combining Facebook Ads and webinar performance
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowSettings(!showSettings)}
                className="inline-flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>
              <Button
                variant="secondary"
                onClick={fetchReports}
                disabled={loading}
                className="inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="primary"
                onClick={exportToCSV}
                disabled={reports.length === 0}
                className="inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Sub-navigation tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { href: '/dashboard/reports', label: 'Key Metrics', icon: FileText },
                { href: '/dashboard/reports/charts', label: 'Charts & Trends', icon: BarChart3 }
              ].map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`border-b-2 py-4 px-1 text-sm font-medium inline-flex items-center gap-2 ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Report Settings</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline-block mr-2" />
                    Engagement Threshold (minutes)
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    Define how many minutes a user must watch to be considered "engaged"
                  </p>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      value={engagementMinutes}
                      onChange={(e) => setEngagementMinutes(parseInt(e.target.value) || 30)}
                      min="1"
                      max="180"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-sm text-gray-600">minutes</span>
                    <div className="flex gap-2 ml-4">
                      {[15, 30, 45, 60].map(minutes => (
                        <Button
                          key={minutes}
                          variant={engagementMinutes === minutes ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => setEngagementMinutes(minutes)}
                        >
                          {minutes}m
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Date range filter */}
        <Card>
          <CardBody>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Date Range:</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const today = new Date()
                  setDateRange({
                    from: today.toISOString().split('T')[0],
                    to: today.toISOString().split('T')[0]
                  })
                }}
              >
                Today
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const today = new Date()
                  const sevenDaysAgo = new Date(today)
                  sevenDaysAgo.setDate(today.getDate() - 7)
                  setDateRange({
                    from: sevenDaysAgo.toISOString().split('T')[0],
                    to: today.toISOString().split('T')[0]
                  })
                }}
              >
                Last 7 Days
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const today = new Date()
                  const thirtyDaysAgo = new Date(today)
                  thirtyDaysAgo.setDate(today.getDate() - 30)
                  setDateRange({
                    from: thirtyDaysAgo.toISOString().split('T')[0],
                    to: today.toISOString().split('T')[0]
                  })
                }}
              >
                Last 30 Days
              </Button>
              <div className="w-full sm:max-w-xs">
                <MultiSelect
                  options={webinarOptions.map(option => option.label)}
                  selected={selectedWebinars}
                  onChange={setSelectedWebinars}
                  label="Webinars"
                  placeholder={
                    webinarOptions.length === 0 ? 'Loading webinars...' : 'All webinars'
                  }
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Summary Cards */}
        {totals && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard
              title="Total Ad Spend"
              value={`$${totals.spend.toFixed(2)}`}
              icon={<DollarSign className="w-5 h-5" />}
              color="blue"
            />
            <SummaryCard
              title="Total Registrations"
              value={totals.registrations}
              icon={<UserCheck className="w-5 h-5" />}
              color="green"
            />
            <SummaryCard
              title="Average Cost/Reg"
              value={`$${totals.costPerReg.toFixed(2)}`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="purple"
            />
            <SummaryCard
              title="Total Sales"
              value={totals.sales}
              icon={<ShoppingCart className="w-5 h-5" />}
              color="orange"
            />
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading reports...</p>
            </div>
          </div>
        )}

        {/* Column views */}
        {!loading && reports.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <select
                value={activeViewId}
                onChange={(e) => setActiveViewId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                {views.map(view => (
                  <option key={view.id} value={view.id}>
                    {view.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={openEditView} className="inline-flex items-center gap-1">
                <Edit2 className="w-4 h-4" />
                Customize
              </Button>
              <Button variant="secondary" size="sm" onClick={openCreateView} className="inline-flex items-center gap-1">
                <Plus className="w-4 h-4" />
                New View
              </Button>
              {!activeView?.isDefault && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDeleteView(activeView.id)}
                  className="inline-flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete View
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Reports table */}
        {!loading && reports.length > 0 && (
          <Card>
            <CardBody className="p-0 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    {activeColumns.map(columnId => (
                      <th
                        key={columnId}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {renderHeaderLabel(columnId)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="sticky left-0 z-10 bg-white px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(report.date).toLocaleDateString()}
                      </td>
                      {activeColumns.map(columnId => (
                        <td key={columnId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {renderCell(columnId, report)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {totals && (
                    <tr className="bg-gray-100 font-semibold">
                      <td className="sticky left-0 z-10 bg-gray-100 px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        TOTAL / AVG
                      </td>
                      {activeColumns.map(columnId => (
                        <td key={columnId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {renderTotalsCell(columnId)}
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            </CardBody>
          </Card>
        )}

        {/* Empty state */}
        {!loading && reports.length === 0 && (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
                <p className="text-gray-500 mb-6">
                  No reports found for the selected date range. Try adjusting your filters.
                </p>
                <Button onClick={fetchReports}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {showViewBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingViewId ? 'Edit View' : 'Create New View'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Select which metrics appear in the reports table. The Date column is always visible.
                </p>
              </div>
              <button
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                onClick={() => setShowViewBuilder(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">View Name</label>
                <input
                  type="text"
                  value={viewNameInput}
                  onChange={(e) => setViewNameInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Revenue Focus"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Columns</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {columnOptions.map(option => (
                    <label
                      key={option.id}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={viewColumnsInput.includes(option.id)}
                        onChange={() => toggleColumnSelection(option.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Tip: Create different views for revenue, engagement, or ad performance.
              </p>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => setShowViewBuilder(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveView}
                  disabled={viewColumnsInput.length === 0}
                >
                  Save View
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

function SummaryCard({ title, value, icon, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  }

  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            {icon}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

function PercentageCell({ value }: { value: number }) {
  const getColor = (val: number) => {
    if (val >= 50) return 'text-green-600 bg-green-50'
    if (val >= 25) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColor(value)}`}>
      {value.toFixed(1)}%
    </span>
  )
}
