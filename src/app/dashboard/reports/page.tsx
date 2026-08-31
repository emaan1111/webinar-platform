'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import MultiSelect from '@/components/ui/MultiSelect'
import TimezoneSelector from '@/components/dashboard/TimezoneSelector'
import { useTimezonePreference } from '@/lib/useTimezonePreference'
import { formatInTimeZone } from 'date-fns-tz'
import {
  Calendar,
  Download,
  RefreshCw,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  UserCheck,
  Eye,
  Clock,
  ShoppingCart,
  Settings,
  BarChart3,
  FileText
} from 'lucide-react'

type ReportData = {
  date: string
  fbResults: {
    spend: number
    impressions: number
    clicks: number
    ctr: number
    cpm: number
    cpc: number
  }
  visitors: number
  registrations: number
  
  // Attendance
  totalAttendees: number
  liveAttendees: number
  replayAttendees: number
  pastRegistrationCount: number
  pastAttendees: number

  // Webinar half - counted on the SESSION clock (the day the webinar ran),
  // and divided by sessions that have actually finished.
  // sessionRegistered = sessionLive + sessionMissed + sessionUpcoming
  sessionRegistered: number
  sessionSettled: number
  sessionLive: number
  sessionMissed: number
  sessionUpcoming: number
  sessionEngaged: number
  sessionSales: number
  sessionReplay: number
  sessionAttendanceRate: number
  sessionEngagedPerRegistered: number
  sessionEngagementRateLive: number
  sessionSalesPerRegistered: number
  sessionReplayRate: number
  
  // Engagement
  engagedTotal: number
  engagedLive: number
  engagedReplay: number
  
  // Sales
  salesTotal: number
  salesLive: number
  salesReplay: number
  
  // Rates
  registrationRate: number
  attendanceRate: number
  realAttendanceRate: number
  liveAttendanceRate: number
  replayAttendanceRate: number
  
  // Engagement rates
  engagedPerVisitor: number
  engagedLivePerVisitor: number
  engagedReplayPerVisitor: number
  engagedPerRegistered: number
  engagedLivePerRegistered: number
  engagedReplayPerRegistered: number
  engagementRateLive: number
  engagementRateReplay: number
  engagementRateTotal: number
  
  // Costs
  costPerRegistration: number
  costPerAttendee: number
  costPerSale: number
  
  // Revenue
  revenue: number
  liveRevenue?: number
  replayRevenue?: number
  averageOrderValue?: number
  profit: number
  roi: number
}

// report.date is a plain yyyy-MM-dd already expressed in the viewer's timezone,
// so parse it as a local date - new Date('2026-08-27') is UTC midnight and would
// render as the previous day west of Greenwich.
const formatDateLabel = (value: string) => {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString()
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<ReportData[]>([])
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  // Which zone the day buckets are cut in - remembered across visits.
  const { timezone, setTimezone } = useTimezonePreference()
  const [engagementMinutes, setEngagementMinutes] = useState(30)
  const [showSettings, setShowSettings] = useState(false)
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [fbWarning, setFbWarning] = useState<string | null>(null)
  const [coverageWarning, setCoverageWarning] = useState<string | null>(null)
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [savedViews, setSavedViews] = useState<any[]>([])
  const [currentView, setCurrentView] = useState<string>('default')
  const [defaultView, setDefaultView] = useState<string>('essential')
  const [showViewManager, setShowViewManager] = useState(false)
  const [newViewName, setNewViewName] = useState('')
  const [editingView, setEditingView] = useState<string | null>(null)
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  
  // Webinar filter
  const [webinars, setWebinars] = useState<{id: string, title: string}[]>([])
  const [selectedWebinars, setSelectedWebinars] = useState<string[]>([])
  const [showWebinarFilter, setShowWebinarFilter] = useState(false)
  const pathname = usePathname()

  // Define all available columns
  const availableColumns = {
    basic: [
      { id: 'date', label: 'Date', group: 'Basic' },
      { id: 'visitors', label: 'Visitors', group: 'Basic' },
      { id: 'registrations', label: 'Registrations', group: 'Basic' },
    ],
    facebook: [
      { id: 'fbSpend', label: 'FB Spend', group: 'Facebook' },
      { id: 'fbImpressions', label: 'FB Impressions', group: 'Facebook' },
      { id: 'fbClicks', label: 'FB Clicks', group: 'Facebook' },
      { id: 'fbCtr', label: 'FB CTR', group: 'Facebook' },
      { id: 'fbCpm', label: 'FB CPM', group: 'Facebook' },
      { id: 'fbCpc', label: 'FB CPC', group: 'Facebook' },
    ],
    attendance: [
      // --- Webinars that ran in the period (session clock) ---------------
      // These are the trustworthy ones: filed under the day the webinar ran,
      // and every rate divides by sessions that have actually finished.
      { id: 'sessionRegistered', label: 'Registered (ran today)', group: 'Attendance' },
      { id: 'sessionLive', label: 'Live Attendees (ran today)', group: 'Attendance' },
      { id: 'sessionMissed', label: 'Missed', group: 'Attendance' },
      { id: 'sessionUpcoming', label: 'Yet to run', group: 'Attendance' },
      { id: 'sessionAttendanceRate', label: '% Attendance', group: 'Attendance' },
      { id: 'sessionReplay', label: 'Replay Watchers (ran today)', group: 'Attendance' },
      { id: 'sessionReplayRate', label: '% Replay', group: 'Attendance' },
      // --- Legacy: everything below is filed by SIGNUP date ---------------
      // Kept so saved views keep working. A "live attendee" here is someone
      // who signed up that day and attended whenever their session ran, and
      // the rates divide by everyone who signed up - including people whose
      // webinar has not happened yet.
      { id: 'totalAttendees', label: 'Total Attendees (by signup)', group: 'Attendance' },
      { id: 'liveAttendees', label: 'Live Attendees (by signup)', group: 'Attendance' },
      { id: 'replayAttendees', label: 'Replay Attendees (by signup)', group: 'Attendance' },
      { id: 'pastRegistrationCount', label: 'Eligible Registrations (Past)', group: 'Attendance' },
      { id: 'attendanceRate', label: '% Attendance (by signup, incl. unrun)', group: 'Attendance' },
      { id: 'realAttendanceRate', label: '% Real Attendance (by signup, past only)', group: 'Attendance' },
      { id: 'liveAttendanceRate', label: '% Live Attendance (by signup, incl. unrun)', group: 'Attendance' },
      { id: 'replayAttendanceRate', label: '% Replay Attendance (by signup, incl. unrun)', group: 'Attendance' },
    ],
    engagement: [
      { id: 'sessionEngaged', label: 'Engaged (ran today)', group: 'Engagement' },
      { id: 'sessionEngagedPerRegistered', label: '% Engaged / Registered', group: 'Engagement' },
      { id: 'sessionEngagementRateLive', label: '% Engaged / Live', group: 'Engagement' },
      { id: 'engagedTotal', label: 'Engaged (Total, by signup)', group: 'Engagement' },
      { id: 'engagedLive', label: 'Engaged (Live)', group: 'Engagement' },
      { id: 'engagedReplay', label: 'Engaged (Replay)', group: 'Engagement' },
      { id: 'engagedPerVisitor', label: '% Eng/Visitor (Total)', group: 'Engagement' },
      { id: 'engagedLivePerVisitor', label: '% Eng/Visitor (Live)', group: 'Engagement' },
      { id: 'engagedReplayPerVisitor', label: '% Eng/Visitor (Replay)', group: 'Engagement' },
      { id: 'engagedPerRegistered', label: '% Eng/Reg (Total)', group: 'Engagement' },
      { id: 'engagedLivePerRegistered', label: '% Eng/Reg (Live)', group: 'Engagement' },
      { id: 'engagedReplayPerRegistered', label: '% Eng/Reg (Replay)', group: 'Engagement' },
      { id: 'engagementRateTotal', label: '% Eng Rate (Total)', group: 'Engagement' },
      { id: 'engagementRateLive', label: '% Eng Rate (Live)', group: 'Engagement' },
      { id: 'engagementRateReplay', label: '% Eng Rate (Replay)', group: 'Engagement' },
    ],
    sales: [
      { id: 'salesTotal', label: 'Sales (Total)', group: 'Sales' },
      { id: 'salesLive', label: 'Sales (Live)', group: 'Sales' },
      { id: 'salesReplay', label: 'Sales (Replay)', group: 'Sales' },
    ],
    costs: [
      { id: 'costPerRegistration', label: 'Cost/Reg', group: 'Costs' },
      { id: 'costPerAttendee', label: 'Cost/Attendee', group: 'Costs' },
      { id: 'costPerSale', label: 'Cost/Sale', group: 'Costs' },
    ],
    revenue: [
      { id: 'revenue', label: 'Revenue (Total)', group: 'Revenue' },
      { id: 'liveRevenue', label: 'Revenue (Live)', group: 'Revenue' },
      { id: 'replayRevenue', label: 'Revenue (Replay)', group: 'Revenue' },
      { id: 'averageOrderValue', label: 'Avg Order Value', group: 'Revenue' },
      { id: 'profit', label: 'Profit', group: 'Revenue' },
      { id: 'roi', label: 'ROI %', group: 'Revenue' },
    ],
    rates: [
      { id: 'registrationRate', label: '% Registration Rate', group: 'Rates' },
    ]
  }

  // Pre-defined views
  const predefinedViews = {
    essential: {
      name: 'Essential',
      description: 'Key metrics only',
      columns: ['date', 'fbSpend', 'fbClicks', 'visitors', 'registrations', 'sessionRegistered', 'sessionLive', 'sessionUpcoming', 'sessionAttendanceRate', 'salesTotal', 'registrationRate', 'costPerRegistration']
    },
    salesFocus: {
      name: 'Sales Focus',
      description: 'Sales and revenue metrics',
      columns: ['date', 'visitors', 'registrations', 'salesTotal', 'salesLive', 'salesReplay', 'revenue', 'liveRevenue', 'replayRevenue', 'averageOrderValue', 'profit', 'roi', 'costPerSale', 'costPerRegistration']
    },
    engagement: {
      name: 'Engagement Analysis',
      description: 'Detailed engagement metrics',
      columns: ['date', 'registrations', 'engagedTotal', 'engagedLive', 'engagedReplay', 'engagementRateTotal', 'engagementRateLive', 'engagementRateReplay', 'engagedPerVisitor', 'engagedPerRegistered']
    },
    liveVsReplay: {
      name: 'Live vs Replay',
      description: 'Compare live and replay performance',
      columns: ['date', 'sessionRegistered', 'sessionLive', 'sessionReplay', 'sessionMissed', 'sessionUpcoming', 'sessionAttendanceRate', 'sessionReplayRate', 'sessionEngaged', 'sessionEngagementRateLive', 'liveRevenue', 'replayRevenue']
    },
    facebook: {
      name: 'Facebook Ads',
      description: 'Facebook advertising metrics',
      columns: ['date', 'fbSpend', 'fbImpressions', 'fbClicks', 'fbCtr', 'fbCpm', 'fbCpc', 'visitors', 'registrations', 'costPerRegistration']
    },
    comprehensive: {
      name: 'Full Analytics',
      description: 'All available metrics',
      columns: Object.values(availableColumns).flatMap(group => group.map(col => col.id))
    }
  }

  // Define loadView first before using it in useEffect
  const loadView = (viewId: string) => {
    // Check if it's a predefined view
    if (predefinedViews[viewId as keyof typeof predefinedViews]) {
      const view = predefinedViews[viewId as keyof typeof predefinedViews]
      setSelectedColumns(view.columns)
      setCurrentView(viewId)
      return
    }

    // Check if it's a saved custom view
    const customView = savedViews.find(v => v.id === viewId)
    if (customView) {
      setSelectedColumns(customView.columns)
      setCurrentView(viewId)
    }
  }

  // Load saved views and default view from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('reportViews')
    if (stored) {
      try {
        setSavedViews(JSON.parse(stored))
      } catch (e) {
        console.error('Error parsing saved views:', e)
      }
    }

    const storedDefault = localStorage.getItem('reportDefaultView')
    if (storedDefault) {
      setDefaultView(storedDefault)
      loadView(storedDefault)
    } else {
      // Load essential view by default
      loadView('essential')
    }
  }, [])

  const saveView = () => {
    if (!newViewName.trim()) return

    const newView = {
      id: `custom_${Date.now()}`,
      name: newViewName,
      columns: selectedColumns,
      createdAt: new Date().toISOString()
    }

    const updated = [...savedViews, newView]
    setSavedViews(updated)
    localStorage.setItem('reportViews', JSON.stringify(updated))
    setCurrentView(newView.id)
    setNewViewName('')
    setShowViewManager(false)
  }

  const updateView = (viewId: string) => {
    const updated = savedViews.map(v => 
      v.id === viewId ? { ...v, columns: selectedColumns, updatedAt: new Date().toISOString() } : v
    )
    setSavedViews(updated)
    localStorage.setItem('reportViews', JSON.stringify(updated))
    setEditingView(null)
  }

  const deleteView = (viewId: string) => {
    const updated = savedViews.filter(v => v.id !== viewId)
    setSavedViews(updated)
    localStorage.setItem('reportViews', JSON.stringify(updated))
    if (currentView === viewId) {
      loadView('essential')
    }
    if (defaultView === viewId) {
      setDefaultView('essential')
      localStorage.setItem('reportDefaultView', 'essential')
    }
  }

  const setAsDefault = (viewId: string) => {
    setDefaultView(viewId)
    localStorage.setItem('reportDefaultView', viewId)
  }

  const toggleColumn = (columnId: string) => {
    if (selectedColumns.includes(columnId)) {
      setSelectedColumns(selectedColumns.filter(id => id !== columnId))
    } else {
      setSelectedColumns([...selectedColumns, columnId])
    }
  }

  const selectAllColumns = () => {
    const allIds = Object.values(availableColumns).flatMap(group => group.map(col => col.id))
    setSelectedColumns(allIds)
  }

  const deselectAllColumns = () => {
    setSelectedColumns(['date']) // Keep date always
  }

  const moveColumn = (fromIndex: number, toIndex: number) => {
    const newColumns = [...selectedColumns]
    const [movedColumn] = newColumns.splice(fromIndex, 1)
    newColumns.splice(toIndex, 0, movedColumn)
    setSelectedColumns(newColumns)
  }

  const handleDragStart = (columnId: string) => {
    setDraggedColumn(columnId)
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    if (!draggedColumn || draggedColumn === columnId) return
    
    const fromIndex = selectedColumns.indexOf(draggedColumn)
    const toIndex = selectedColumns.indexOf(columnId)
    
    if (fromIndex !== -1 && toIndex !== -1) {
      moveColumn(fromIndex, toIndex)
    }
  }

  const handleDragEnd = () => {
    setDraggedColumn(null)
  }

  // Helper function to get column configuration
  const getColumnConfig = (columnId: string) => {
    const allCols = Object.values(availableColumns).flat()
    return allCols.find(col => col.id === columnId)
  }

  // A drill-down has to carry the timezone, webinar filter and engagement
  // threshold the number was computed with, or it lists a different population
  // than the cell that was clicked.
  const buildDetailsHref = (metric: string, dateParams: Record<string, string>) => {
    const params = new URLSearchParams({
      ...dateParams,
      metric,
      engagementMinutes: String(engagementMinutes)
    })
    if (timezone) params.set('timezone', timezone)
    if (selectedWebinars.length > 0) params.set('webinarIds', selectedWebinars.join(','))
    return `/dashboard/reports/details?${params.toString()}`
  }

  // Helper function to render cell value
  const renderCellValue = (report: ReportData, columnId: string) => {
    // Helper for linked numeric values
    const renderLink = (value: number, metric: string) => (
      <Link 
        href={buildDetailsHref(metric, { date: report.date })}
        className="hover:underline hover:text-blue-800 cursor-pointer"
      >
        {value.toLocaleString()}
      </Link>
    )

    // The session-clock columns are drillable too - they are the only place
    // the real audience is counted, so "who are these people?" has to be one
    // click away. A missing value stays a dash rather than a link to zero.
    const renderSessionLink = (value: number | undefined, metric: string) =>
      value == null ? <span>-</span> : renderLink(value, metric)

    switch (columnId) {
      case 'date':
        return formatDateLabel(report.date)
      case 'fbSpend':
        return `$${report.fbResults.spend.toFixed(2)}`
      case 'fbImpressions':
        return report.fbResults.impressions.toLocaleString()
      case 'fbClicks':
        return report.fbResults.clicks.toLocaleString()
      case 'fbCtr':
        return `${report.fbResults.ctr.toFixed(2)}%`
      case 'fbCpm':
        return `$${report.fbResults.cpm.toFixed(2)}`
      case 'fbCpc':
        return `$${report.fbResults.cpc.toFixed(2)}`
      case 'visitors':
        return report.visitors.toLocaleString()
      case 'registrations':
        return renderLink(report.registrations, 'registrations')
      case 'sessionRegistered':
        return renderSessionLink(report.sessionRegistered, 'sessionRegistered')
      case 'sessionLive':
        return renderSessionLink(report.sessionLive, 'sessionLive')
      case 'sessionMissed':
        return renderSessionLink(report.sessionMissed, 'sessionMissed')
      case 'sessionUpcoming':
        return renderSessionLink(report.sessionUpcoming, 'sessionUpcoming')
      case 'sessionReplay':
        return renderSessionLink(report.sessionReplay, 'sessionReplay')
      case 'sessionEngaged':
        return renderSessionLink(report.sessionEngaged, 'sessionEngaged')
      case 'sessionAttendanceRate':
        return <PercentageCell value={report.sessionAttendanceRate ?? 0} />
      case 'sessionReplayRate':
        return <PercentageCell value={report.sessionReplayRate ?? 0} />
      case 'sessionEngagedPerRegistered':
        return <PercentageCell value={report.sessionEngagedPerRegistered ?? 0} />
      case 'sessionEngagementRateLive':
        return <PercentageCell value={report.sessionEngagementRateLive ?? 0} />
      case 'totalAttendees':
        return renderLink(report.totalAttendees, 'totalAttendees')
      case 'liveAttendees':
        return renderLink(report.liveAttendees, 'liveAttendees')
      case 'replayAttendees':
        return renderLink(report.replayAttendees, 'replayAttendees')
      case 'pastRegistrationCount':
        return renderLink(report.pastRegistrationCount, 'pastRegistrationCount')
      case 'engagedTotal':
        return renderLink(report.engagedTotal, 'engagedTotal')
      case 'engagedLive':
        return renderLink(report.engagedLive, 'engagedLive')
      case 'engagedReplay':
        return renderLink(report.engagedReplay, 'engagedReplay')
      case 'salesTotal':
        return renderLink(report.salesTotal, 'salesTotal')
      case 'salesLive':
        return renderLink(report.salesLive, 'salesLive')
      case 'salesReplay':
        return renderLink(report.salesReplay, 'salesReplay')
      case 'registrationRate':
        return <PercentageCell value={report.registrationRate} />
      case 'attendanceRate':
        return <PercentageCell value={report.attendanceRate} />
      case 'realAttendanceRate':
        return <PercentageCell value={report.realAttendanceRate} />
      case 'liveAttendanceRate':
        return <PercentageCell value={report.liveAttendanceRate} />
      case 'replayAttendanceRate':
        return <PercentageCell value={report.replayAttendanceRate} />
      case 'engagedPerVisitor':
        return <PercentageCell value={report.engagedPerVisitor} />
      case 'engagedLivePerVisitor':
        return <PercentageCell value={report.engagedLivePerVisitor} />
      case 'engagedReplayPerVisitor':
        return <PercentageCell value={report.engagedReplayPerVisitor} />
      case 'engagedPerRegistered':
        return <PercentageCell value={report.engagedPerRegistered} />
      case 'engagedLivePerRegistered':
        return <PercentageCell value={report.engagedLivePerRegistered} />
      case 'engagedReplayPerRegistered':
        return <PercentageCell value={report.engagedReplayPerRegistered} />
      case 'engagementRateTotal':
        return <PercentageCell value={report.engagementRateTotal} />
      case 'engagementRateLive':
        return <PercentageCell value={report.engagementRateLive} />
      case 'engagementRateReplay':
        return <PercentageCell value={report.engagementRateReplay} />
      case 'costPerRegistration':
        return `$${report.costPerRegistration.toFixed(2)}`
      case 'costPerAttendee':
        return `$${report.costPerAttendee.toFixed(2)}`
      case 'costPerSale':
        return `$${report.costPerSale.toFixed(2)}`
      case 'revenue':
        return `$${report.revenue.toFixed(2)}`
      case 'liveRevenue':
        return `$${(report.liveRevenue || 0).toFixed(2)}`
      case 'replayRevenue':
        return `$${(report.replayRevenue || 0).toFixed(2)}`
      case 'averageOrderValue':
        return `$${(report.averageOrderValue || 0).toFixed(2)}`
      case 'profit':
        return (
          <span className={report.profit > 0 ? 'text-green-600' : report.profit < 0 ? 'text-red-600' : 'text-gray-900'}>
            ${report.profit.toFixed(2)}
          </span>
        )
      case 'roi':
        return `${report.roi.toFixed(2)}%`
      default:
        return '-'
    }
  }

  // Helper function to get cell color class
  const getCellColorClass = (columnId: string) => {
    if (columnId.includes('Live') || columnId === 'liveAttendees' || columnId === 'salesLive' || columnId === 'engagedLive' || columnId === 'liveRevenue') {
      return 'text-green-600'
    }
    if (columnId.includes('Replay') || columnId === 'replayAttendees' || columnId === 'salesReplay' || columnId === 'engagedReplay' || columnId === 'replayRevenue') {
      return 'text-purple-600'
    }
    if (columnId.includes('Total') || columnId === 'totalAttendees' || columnId === 'engagedTotal' || columnId === 'salesTotal' || columnId === 'engagementRateTotal') {
      return 'text-blue-600'
    }
    if (columnId.includes('sale') || columnId.includes('Sale') || columnId.includes('revenue') || columnId.includes('profit') || columnId === 'averageOrderValue') {
      return 'text-gray-900 font-semibold'
    }
    return 'text-gray-900'
  }

  // Calendar date in the selected timezone - toISOString() would give the UTC
  // date, which is the wrong day for anyone ahead of UTC.
  const zonedDate = (d: Date) => formatInTimeZone(d, timezone || 'UTC', 'yyyy-MM-dd')

  // Date N days back from today, counted in the selected zone.
  const zonedDaysAgo = (days: number) => zonedDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000))

  useEffect(() => {
    // Seed the default range (last 30 days) once the timezone is known. Only
    // when empty - switching zones keeps the dates you picked, it just reads
    // them in the new zone.
    if (!timezone || dateRange.from) return
    setDateRange({
      from: zonedDaysAgo(30),
      to: zonedDate(new Date())
    })
  }, [timezone])

  useEffect(() => {
    // Fetch internal + external webinars list
    const fetchWebinars = async () => {
      try {
        const [internalRes, externalRes] = await Promise.all([
          fetch('/api/webinars').catch(() => null),
          fetch('/api/external-webinars').catch(() => null)
        ])
        const internalData = internalRes?.ok ? await internalRes.json() : { webinars: [] }
        const externalData = externalRes?.ok ? await externalRes.json() : []
        const internalList = internalData.webinars ?? internalData
        const internal = Array.isArray(internalList)
          ? internalList.map((w: any) => ({ id: w.id, title: w.internalName || w.title }))
          : []
        const external = Array.isArray(externalData)
          ? externalData.map((w: any) => ({ id: `ext_${w.id}`, title: `${w.externalWebinarName || w.name} (External)` }))
          : []
        setWebinars([...internal, ...external])
      } catch (error) {
        console.error('Error fetching webinars:', error)
      }
    }
    fetchWebinars()
  }, [])

  useEffect(() => {
    if (dateRange.from && dateRange.to && timezone) {
      fetchReports()
    }
  }, [dateRange, engagementMinutes, selectedWebinars, timezone])

  const fetchReports = async () => {
    setLoading(true)
    setFbWarning(null)
    try {
      const tz = timezone || 'UTC'
      let url = `/api/reports?from=${dateRange.from}&to=${dateRange.to}&engagementMinutes=${engagementMinutes}&timezone=${encodeURIComponent(tz)}`
      if (selectedWebinars.length > 0) {
        url += `&webinarIds=${selectedWebinars.join(',')}`
      }
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports)
        if (data.warning) {
          setFbWarning(data.warning)
        }
        // Registrations with no scheduled session time are invisible to every
        // session-clock column. Say so rather than quietly understating them.
        setCoverageWarning(data.coverageWarning ?? null)
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
      'Total Attendees',
      'Live Attendees',
      'Replay Attendees',
      'Engaged Total',
      'Engaged Live',
      'Engaged Replay',
      'Sales Total',
      'Sales Live',
      'Sales Replay',
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
      r.totalAttendees,
      r.liveAttendees,
      r.replayAttendees,
      r.engagedTotal,
      r.engagedLive,
      r.engagedReplay,
      r.salesTotal,
      r.salesLive,
      r.salesReplay,
      r.registrationRate.toFixed(2),
      r.attendanceRate.toFixed(2),
      r.realAttendanceRate.toFixed(2),
      r.engagedPerVisitor.toFixed(2),
      r.engagedPerRegistered.toFixed(2),
      r.engagementRateLive.toFixed(2),
      r.costPerRegistration.toFixed(2)
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
      revenue: acc.revenue + r.revenue,
      liveRevenue: acc.liveRevenue + (r.liveRevenue || 0),
      replayRevenue: acc.replayRevenue + (r.replayRevenue || 0),
      visitors: acc.visitors + r.visitors,
      registrations: acc.registrations + r.registrations,
      totalAttendees: acc.totalAttendees + r.totalAttendees,
      liveAttendees: acc.liveAttendees + r.liveAttendees,
      replayAttendees: acc.replayAttendees + r.replayAttendees,
      pastRegistrationCount: acc.pastRegistrationCount + r.pastRegistrationCount,
      pastAttendees: acc.pastAttendees + r.pastAttendees,
      engagedTotal: acc.engagedTotal + r.engagedTotal,
      engagedLive: acc.engagedLive + r.engagedLive,
      engagedReplay: acc.engagedReplay + r.engagedReplay,
      salesTotal: acc.salesTotal + r.salesTotal,
      salesLive: acc.salesLive + r.salesLive,
      salesReplay: acc.salesReplay + r.salesReplay,
      sessionRegistered: acc.sessionRegistered + (r.sessionRegistered || 0),
      sessionSettled: acc.sessionSettled + (r.sessionSettled || 0),
      sessionLive: acc.sessionLive + (r.sessionLive || 0),
      sessionMissed: acc.sessionMissed + (r.sessionMissed || 0),
      sessionUpcoming: acc.sessionUpcoming + (r.sessionUpcoming || 0),
      sessionEngaged: acc.sessionEngaged + (r.sessionEngaged || 0),
      sessionSales: acc.sessionSales + (r.sessionSales || 0),
      sessionReplay: acc.sessionReplay + (r.sessionReplay || 0)
    }), {
      spend: 0,
      revenue: 0,
      liveRevenue: 0,
      replayRevenue: 0,
      visitors: 0,
      registrations: 0,
      totalAttendees: 0,
      liveAttendees: 0,
      replayAttendees: 0,
      pastRegistrationCount: 0,
      pastAttendees: 0,
      engagedTotal: 0,
      engagedLive: 0,
      engagedReplay: 0,
      salesTotal: 0,
      salesLive: 0,
      salesReplay: 0,
      sessionRegistered: 0,
      sessionSettled: 0,
      sessionLive: 0,
      sessionMissed: 0,
      sessionUpcoming: 0,
      sessionEngaged: 0,
      sessionSales: 0,
      sessionReplay: 0
    })

    return {
      ...totals,
      // Session-clock rates, recomputed from the summed counts. Averaging the
      // daily percentages instead would weight a 2-registrant day the same as
      // a 200-registrant one.
      sessionAttendanceRate: totals.sessionSettled > 0 ? (totals.sessionLive / totals.sessionSettled) * 100 : 0,
      sessionReplayRate: totals.sessionSettled > 0 ? (totals.sessionReplay / totals.sessionSettled) * 100 : 0,
      sessionEngagedPerRegistered: totals.sessionSettled > 0 ? (totals.sessionEngaged / totals.sessionSettled) * 100 : 0,
      sessionEngagementRateLive: totals.sessionLive > 0 ? (totals.sessionEngaged / totals.sessionLive) * 100 : 0,
      sessionSalesPerRegistered: totals.sessionSettled > 0 ? (totals.sessionSales / totals.sessionSettled) * 100 : 0,
      profit: totals.revenue - totals.spend,
      roi: totals.spend > 0 ? ((totals.revenue - totals.spend) / totals.spend) * 100 : 0,
      averageOrderValue: totals.salesTotal > 0 ? totals.revenue / totals.salesTotal : 0,
      registrationRate: totals.visitors > 0 ? (totals.registrations / totals.visitors) * 100 : 0,
      attendanceRate: totals.registrations > 0 ? (totals.totalAttendees / totals.registrations) * 100 : 0,
      realAttendanceRate: totals.pastRegistrationCount > 0 ? (totals.pastAttendees / totals.pastRegistrationCount) * 100 : 0,
      engagedPerVisitor: totals.visitors > 0 ? (totals.engagedTotal / totals.visitors) * 100 : 0,
      engagedPerRegistered: totals.registrations > 0 ? (totals.engagedTotal / totals.registrations) * 100 : 0,
      engagementRateTotal: totals.totalAttendees > 0 ? (totals.engagedTotal / totals.totalAttendees) * 100 : 0,
      engagementRateLive: totals.liveAttendees > 0 ? (totals.engagedLive / totals.liveAttendees) * 100 : 0,
      costPerReg: totals.registrations > 0 ? totals.spend / totals.registrations : 0,
      costPerSale: totals.salesTotal > 0 ? totals.spend / totals.salesTotal : 0
    }
  }

  const totals = calculateTotals()

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
                onClick={() => setShowViewManager(!showViewManager)}
                className="inline-flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Manage Views
              </Button>
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

        {/* View Manager Modal */}
        {showViewManager && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Manage Column Views</h2>
                <button
                  onClick={() => setShowViewManager(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                {/* Current View Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select View
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Predefined Views */}
                    {Object.entries(predefinedViews).map(([key, view]) => (
                      <button
                        key={key}
                        onClick={() => loadView(key)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          currentView === key
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{view.name}</span>
                          {defaultView === key && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{view.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{view.columns.length} columns</p>
                      </button>
                    ))}
                    
                    {/* Custom Saved Views */}
                    {savedViews.map(view => (
                      <button
                        key={view.id}
                        onClick={() => loadView(view.id)}
                        className={`p-3 rounded-lg border-2 text-left transition-all relative group ${
                          currentView === view.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{view.name}</span>
                          {defaultView === view.id && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{view.columns.length} columns</p>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setAsDefault(view.id)
                            }}
                            className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                            title="Set as default"
                          >
                            ⭐
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingView(view.id)
                            }}
                            className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                            title="Update columns"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm(`Delete view "${view.name}"?`)) {
                                deleteView(view.id)
                              }
                            }}
                            className="p-1 bg-white rounded shadow-sm hover:bg-red-50 text-red-600"
                            title="Delete view"
                          >
                            🗑️
                          </button>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Column Selector */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Customize Columns
                    </label>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={selectAllColumns}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={deselectAllColumns}
                      >
                        Deselect All
                      </Button>
                    </div>
                  </div>

                  {/* Selected Columns - Reorderable */}
                  {selectedColumns.length > 0 && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          Selected Columns (Drag to reorder)
                        </h4>
                        <span className="text-xs text-gray-600">{selectedColumns.length} selected</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedColumns.map((columnId, index) => {
                          const config = getColumnConfig(columnId)
                          return (
                            <div
                              key={columnId}
                              draggable={columnId !== 'date'}
                              onDragStart={() => handleDragStart(columnId)}
                              onDragOver={(e) => handleDragOver(e, columnId)}
                              onDragEnd={handleDragEnd}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                                columnId === 'date' 
                                  ? 'bg-gray-200 text-gray-700' 
                                  : 'bg-white border border-blue-300 text-blue-700 cursor-move hover:border-blue-400'
                              } ${draggedColumn === columnId ? 'opacity-50' : ''}`}
                            >
                              <span className="text-xs text-gray-500">#{index + 1}</span>
                              <span>{config?.label || columnId}</span>
                              {columnId !== 'date' && (
                                <button
                                  onClick={() => toggleColumn(columnId)}
                                  className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Drag columns to reorder them. Date column is always first.
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {Object.entries(availableColumns).map(([groupKey, columns]) => (
                      <div key={groupKey}>
                        <h3 className="font-medium text-sm text-gray-900 mb-2 sticky top-0 bg-white pb-1 border-b">
                          {columns[0]?.group || groupKey}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {columns.map(column => (
                            <label
                              key={column.id}
                              className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedColumns.includes(column.id)}
                                onChange={() => toggleColumn(column.id)}
                                disabled={column.id === 'date'} // Date always required
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{column.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Custom View */}
                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Save Current Selection as View
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newViewName}
                      onChange={(e) => setNewViewName(e.target.value)}
                      placeholder="Enter view name..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyDown={(e) => e.key === 'Enter' && saveView()}
                    />
                    <Button
                      variant="primary"
                      onClick={saveView}
                      disabled={!newViewName.trim() || selectedColumns.length === 0}
                    >
                      Save View
                    </Button>
                  </div>
                  {editingView && (
                    <div className="mt-2">
                      <Button
                        variant="secondary"
                        onClick={() => updateView(editingView)}
                        className="w-full"
                      >
                        Update "{savedViews.find(v => v.id === editingView)?.name}" with Current Columns
                      </Button>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    {selectedColumns.length} columns selected
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowViewManager(false)
                      }}
                    >
                      Close
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setShowViewManager(false)
                      }}
                    >
                      Apply View
                    </Button>
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
                  const today = zonedDate(new Date())
                  setDateRange({ from: today, to: today })
                }}
              >
                Today
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDateRange({ from: zonedDaysAgo(7), to: zonedDate(new Date()) })}
              >
                Last 7 Days
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDateRange({ from: zonedDaysAgo(30), to: zonedDate(new Date()) })}
              >
                Last 30 Days
              </Button>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm font-medium text-gray-700">Timezone:</span>
                <TimezoneSelector value={timezone} onChange={setTimezone} disabled={loading} />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Webinar filter */}
        {webinars.length > 0 && (
          <Card>
            <CardBody>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Filter by Webinar:</span>
                </div>
                <div className="flex-1 min-w-[300px]">
                  <MultiSelect
                    options={webinars.map(w => w.title)}
                    selected={selectedWebinars.map(id => webinars.find(w => w.id === id)?.title || id)}
                    onChange={(titles) => {
                      const ids = titles.map(title => webinars.find(w => w.title === title)?.id).filter(Boolean) as string[]
                      setSelectedWebinars(ids)
                    }}
                    placeholder="All Webinars"
                  />
                </div>
                {selectedWebinars.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedWebinars([])}
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        )}

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
              value={totals.salesTotal}
              icon={<ShoppingCart className="w-5 h-5" />}
              color="orange"
            />
          </div>
        )}

        {/* Facebook API Warning */}
        {coverageWarning && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  Some registrations have no session date
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>{coverageWarning}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {fbWarning && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Facebook Ads Data Unavailable
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>{fbWarning}</p>
                  <p className="mt-2">
                    To fix this, get a new access token from{' '}
                    <a 
                      href="https://developers.facebook.com/tools/explorer/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium underline hover:text-yellow-900"
                    >
                      Facebook Graph API Explorer
                    </a>
                    {' '}and update your <code className="bg-yellow-100 px-1 rounded">FB_ACCESS_TOKEN</code> environment variable.
                  </p>
                  <p className="mt-2 font-medium">
                    📖 See <code className="bg-yellow-100 px-1 rounded">FACEBOOK_TOKEN_REFRESH_GUIDE.md</code> for detailed instructions.
                  </p>
                </div>
              </div>
            </div>
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

        {/* Reports table - Dynamic columns based on selected view */}
        {!loading && reports.length > 0 && (
          <Card>
            <CardBody className="p-0 overflow-x-auto">
              <div className="mb-4 px-6 pt-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Current View: <span className="font-semibold text-gray-900">
                      {currentView === 'essential' ? predefinedViews.essential.name :
                       currentView === 'salesFocus' ? predefinedViews.salesFocus.name :
                       currentView === 'engagement' ? predefinedViews.engagement.name :
                       currentView === 'liveVsReplay' ? predefinedViews.liveVsReplay.name :
                       currentView === 'facebook' ? predefinedViews.facebook.name :
                       currentView === 'comprehensive' ? predefinedViews.comprehensive.name :
                       savedViews.find(v => v.id === currentView)?.name || 'Custom'}
                    </span> ({selectedColumns.length} columns)
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowViewManager(true)}
                    className="inline-flex items-center gap-2"
                  >
                    <Settings className="w-3 h-3" />
                    Change View
                  </Button>
                </div>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {selectedColumns.map((columnId, index) => {
                      const config = getColumnConfig(columnId)
                      return (
                        <th 
                          key={columnId}
                          className={`${index === 0 ? 'sticky left-0 z-10 bg-gray-50' : ''} px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}
                        >
                          {config?.label || columnId}
                          {columnId === 'engagedTotal' || columnId === 'engagedLive' || columnId === 'engagedReplay' ? ` (${engagementMinutes}m+)` : ''}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {selectedColumns.map((columnId, colIndex) => (
                        <td 
                          key={columnId}
                          className={`${colIndex === 0 ? 'sticky left-0 z-10 bg-white' : ''} px-6 py-4 whitespace-nowrap text-sm ${getCellColorClass(columnId)} ${colIndex === 0 ? 'font-medium' : ''}`}
                        >
                          {renderCellValue(report, columnId)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Totals row */}
                  {totals && (
                    <tr className="bg-gray-100 font-semibold">
                      {selectedColumns.map((columnId, colIndex) => {
                        let totalValue: any = '-'
                        
                        // Helper for linked numeric values in totals
                        const renderTotalLink = (value: number, metric: string) => (
                          <Link 
                            href={buildDetailsHref(metric, { startDate: dateRange.from, endDate: dateRange.to })}
                            className="hover:underline hover:text-blue-800 cursor-pointer"
                          >
                            {value.toLocaleString()}
                          </Link>
                        )

                        if (columnId === 'date') totalValue = 'TOTAL / AVG'
                        else if (columnId === 'fbSpend') totalValue = `$${totals.spend.toFixed(2)}`
                        else if (columnId === 'visitors') totalValue = totals.visitors.toLocaleString()
                        else if (columnId === 'registrations') totalValue = renderTotalLink(totals.registrations, 'registrations')
                        else if (columnId === 'sessionRegistered') totalValue = renderTotalLink(totals.sessionRegistered, 'sessionRegistered')
                        else if (columnId === 'sessionLive') totalValue = renderTotalLink(totals.sessionLive, 'sessionLive')
                        else if (columnId === 'sessionMissed') totalValue = renderTotalLink(totals.sessionMissed, 'sessionMissed')
                        else if (columnId === 'sessionUpcoming') totalValue = renderTotalLink(totals.sessionUpcoming, 'sessionUpcoming')
                        else if (columnId === 'sessionReplay') totalValue = renderTotalLink(totals.sessionReplay, 'sessionReplay')
                        else if (columnId === 'sessionEngaged') totalValue = renderTotalLink(totals.sessionEngaged, 'sessionEngaged')
                        else if (columnId === 'sessionAttendanceRate') totalValue = <PercentageCell value={totals.sessionAttendanceRate} />
                        else if (columnId === 'sessionReplayRate') totalValue = <PercentageCell value={totals.sessionReplayRate} />
                        else if (columnId === 'sessionEngagedPerRegistered') totalValue = <PercentageCell value={totals.sessionEngagedPerRegistered} />
                        else if (columnId === 'sessionEngagementRateLive') totalValue = <PercentageCell value={totals.sessionEngagementRateLive} />
                        else if (columnId === 'totalAttendees') totalValue = renderTotalLink(totals.totalAttendees, 'totalAttendees')
                        else if (columnId === 'liveAttendees') totalValue = renderTotalLink(totals.liveAttendees, 'liveAttendees')
                        else if (columnId === 'replayAttendees') totalValue = renderTotalLink(totals.replayAttendees, 'replayAttendees')
                        else if (columnId === 'pastRegistrationCount') totalValue = renderTotalLink(totals.pastRegistrationCount, 'pastRegistrationCount')
                        else if (columnId === 'engagedTotal') totalValue = renderTotalLink(totals.engagedTotal, 'engagedTotal')
                        else if (columnId === 'engagedLive') totalValue = renderTotalLink(totals.engagedLive, 'engagedLive')
                        else if (columnId === 'engagedReplay') totalValue = renderTotalLink(totals.engagedReplay, 'engagedReplay')
                        else if (columnId === 'salesTotal') totalValue = renderTotalLink(totals.salesTotal, 'salesTotal')
                        else if (columnId === 'salesLive') totalValue = renderTotalLink(totals.salesLive, 'salesLive')
                        else if (columnId === 'salesReplay') totalValue = renderTotalLink(totals.salesReplay, 'salesReplay')
                        else if (columnId === 'registrationRate') totalValue = <PercentageCell value={totals.registrationRate} />
                        else if (columnId === 'attendanceRate') totalValue = <PercentageCell value={totals.attendanceRate} />
                        else if (columnId === 'realAttendanceRate') totalValue = <PercentageCell value={totals.realAttendanceRate} />
                        else if (columnId === 'engagedPerVisitor') totalValue = <PercentageCell value={totals.engagedPerVisitor} />
                        else if (columnId === 'engagedPerRegistered') totalValue = <PercentageCell value={totals.engagedPerRegistered} />
                        else if (columnId === 'engagementRateTotal') totalValue = <PercentageCell value={totals.engagementRateTotal} />
                        else if (columnId === 'engagementRateLive') totalValue = <PercentageCell value={totals.engagementRateLive} />
                        else if (columnId === 'costPerRegistration') totalValue = `$${totals.costPerReg.toFixed(2)}`
                        else if (columnId === 'costPerSale') totalValue = `$${totals.costPerSale.toFixed(2)}`
                        else if (columnId === 'revenue') totalValue = `$${totals.revenue.toFixed(2)}`
                        else if (columnId === 'liveRevenue') totalValue = `$${totals.liveRevenue.toFixed(2)}`
                        else if (columnId === 'replayRevenue') totalValue = `$${totals.replayRevenue.toFixed(2)}`
                        else if (columnId === 'averageOrderValue') totalValue = `$${totals.averageOrderValue.toFixed(2)}`
                        else if (columnId === 'profit') totalValue = <span className={totals.profit > 0 ? 'text-green-600' : totals.profit < 0 ? 'text-red-600' : 'text-gray-900'}>${totals.profit.toFixed(2)}</span>
                        else if (columnId === 'roi') totalValue = `${totals.roi.toFixed(2)}%`
                        
                        return (
                          <td 
                            key={columnId}
                            className={`${colIndex === 0 ? 'sticky left-0 z-10 bg-gray-100' : ''} px-6 py-4 whitespace-nowrap text-sm ${getCellColorClass(columnId)}`}
                          >
                            {totalValue}
                          </td>
                        )
                      })}
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
