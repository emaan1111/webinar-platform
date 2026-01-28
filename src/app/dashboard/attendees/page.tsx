'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import MultiSelect from '@/components/ui/MultiSelect'
import DateRangePicker from '@/components/ui/DateRangePicker'
import ViewManager, { CustomView, defaultColumns, ColumnConfig } from '@/components/attendees/ViewManager'
import {
  Search,
  Download,
  Mail,
  CheckCircle,
  XCircle,
  Eye,
  Monitor,
  Smartphone,
  Clock,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Filter as FilterIcon,
  Users,
  TrendingUp,
  Calendar,
  Globe,
  X,
  Trash2
} from 'lucide-react'

interface AttendeeSession {
  id: string
  joinedAt: string
  leftAt: string | null
  videoPosition: number
  device: string
  browser: string | null
  isActive: boolean
  lastSeenAt: string | null
}

interface Attendee {
  id: string
  name: string
  email: string
  phone: string | null
  timezone: string | null
  country: string | null
  webinarId: string
  webinarTitle: string
  registeredAt: string
  scheduledAt: string | null
  webinarStatus: string
  attended: boolean
  joinedAt: string | null
  leftAt: string | null
  lastSeenAt: string | null
  engagementScore: number
  gdprConsent: boolean
  privacyConsent: boolean
  marketingConsent: boolean
  // Analytics fields
  registrationDevice?: string
  watchedReplay?: boolean
  replayWatchTime?: number
  replayWatchTimeFormatted?: string
  replayClickedCTA?: boolean
  replayDevice?: string | null
  totalWatchTime?: number
  totalWatchTimeFormatted?: string
  lastWatchedPosition?: number
  lastWatchedPositionFormatted?: string
  lastSessionDevice?: string | null
  lastSessionBrowser?: string | null
  lastSessionOS?: string | null
  totalEngagements?: number
  sessionCount?: number
  hasPurchased?: boolean
  purchaseCount?: number
  lastPurchaseAt?: string | null
  lastPurchaseAmount?: number | null
  lastPurchaseCurrency?: string | null
  lastPurchaseProduct?: string | null
  totalPurchaseAmount?: number
  purchaseCurrency?: string | null
  // Sessions array
  sessions?: AttendeeSession[]
}

const VIEWS_STORAGE_KEY = 'attendee_views'

type SortConfig = {
  key: string
  direction: 'asc' | 'desc'
} | null

type FilterConfig = {
  [key: string]: string | boolean | number | null
}

export default function AttendeesPage() {
  const router = useRouter()
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [webinars, setWebinars] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [attendanceFilter, setAttendanceFilter] = useState('all')
  const [webinarFilter, setWebinarFilter] = useState('all')
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])
  
  // Advanced filtering, sorting, pagination
  const [filters, setFilters] = useState<FilterConfig>({})
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [showFilters, setShowFilters] = useState(false)
  const [applyingTags, setApplyingTags] = useState(false)
  const [tagResult, setTagResult] = useState<{ success?: boolean; message?: string } | null>(null)
  
  // New filters
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [registeredDateStart, setRegisteredDateStart] = useState('')
  const [registeredDateEnd, setRegisteredDateEnd] = useState('')
  const [joinedDateStart, setJoinedDateStart] = useState('')
  const [joinedDateEnd, setJoinedDateEnd] = useState('')

  // Timezone selector
  const [selectedTimezone, setSelectedTimezone] = useState<string>(() => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      return localStorage.getItem('attendees_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone
    }
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  })

  // Save timezone preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('attendees_timezone', selectedTimezone)
    }
  }, [selectedTimezone])

  // Delete functionality
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteMode, setDeleteMode] = useState<'single' | 'selected' | 'all'>('single')
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Expandable sessions rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // View management
  const [views, setViews] = useState<CustomView[]>([])
  const [activeView, setActiveView] = useState<CustomView>({
    id: 'default',
    name: 'Default View',
    columns: defaultColumns,
    isDefault: true
  })

  // Load views from localStorage
  useEffect(() => {
    const savedViews = localStorage.getItem(VIEWS_STORAGE_KEY)
    if (savedViews) {
      try {
        const parsed = JSON.parse(savedViews)
        
        // Migrate views: add any new columns from defaultColumns that don't exist in saved views
        let hasNewColumns = false
        const migratedViews = parsed.map((view: CustomView) => {
          const existingColumnKeys = new Set(view.columns.map(col => col.key))
          const newColumns = defaultColumns.filter(col => !existingColumnKeys.has(col.key))
          
          if (newColumns.length > 0) {
            hasNewColumns = true
          }
          
          return {
            ...view,
            columns: [...view.columns, ...newColumns]
          }
        })
        
        setViews(migratedViews)
        
        // Set first view as active
        if (migratedViews.length > 0) {
          setActiveView(migratedViews[0])
        }
        
        // Save migrated views back to localStorage
        if (hasNewColumns) {
          localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(migratedViews))
        }
      } catch (error) {
        console.error('Failed to parse saved views:', error)
      }
    } else {
      // Initialize with default view
      const defaultView: CustomView = {
        id: 'default',
        name: 'Default View',
        columns: defaultColumns,
        isDefault: true
      }
      setViews([defaultView])
      setActiveView(defaultView)
    }
  }, [])

  // Save views to localStorage
  const saveViews = (updatedViews: CustomView[]) => {
    setViews(updatedViews)
    localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(updatedViews))
  }

  // Fetch attendees from API
  useEffect(() => {
    fetch('/api/attendees')
      .then(res => res.json())
      .then(data => {
        setAttendees(data.attendees || [])
        setLoading(false)
      })
      .catch(error => {
        console.error('Failed to fetch attendees:', error)
        setLoading(false)
      })
  }, [])

  const filteredAttendees = attendees.filter(attendee => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    const matchesSearch = normalizedQuery.length === 0 || [
      attendee.name,
      attendee.email,
      attendee.phone,
      attendee.webinarTitle
    ].some(value => String(value ?? '').toLowerCase().includes(normalizedQuery))
    
    const matchesAttendance = 
      attendanceFilter === 'all' ||
      (attendanceFilter === 'attended' && attendee.attended) ||
      (attendanceFilter === 'no-show' && attendee.webinarStatus === 'No Show') ||
      (attendanceFilter === 'upcoming' && attendee.webinarStatus === 'Upcoming')
    
    const matchesWebinar = 
      webinarFilter === 'all' ||
      attendee.webinarTitle === webinarFilter

    // Country multi-select filter
    const matchesCountry = 
      selectedCountries.length === 0 ||
      (attendee.country && selectedCountries.includes(attendee.country))

    // Registered date range filter
    const matchesRegisteredDate = (() => {
      if (!registeredDateStart && !registeredDateEnd) return true
      const regDate = new Date(attendee.registeredAt)
      
      // Parse dates as local time by appending time component
      // YYYY-MM-DD -> YYYY-MM-DD T00:00:00 (Local)
      if (registeredDateStart) {
        const startDate = new Date(registeredDateStart + 'T00:00:00')
        if (regDate < startDate) return false
      }
      
      if (registeredDateEnd) {
        const endDate = new Date(registeredDateEnd + 'T23:59:59.999')
        if (regDate > endDate) return false
      }
      return true
    })()

    // Joined date range filter
    const matchesJoinedDate = (() => {
      if (!joinedDateStart && !joinedDateEnd) return true
      if (!attendee.joinedAt) return false
      const joinDate = new Date(attendee.joinedAt)
      
      if (joinedDateStart) {
        const startDate = new Date(joinedDateStart + 'T00:00:00')
        if (joinDate < startDate) return false
      }
      
      if (joinedDateEnd) {
        const endDate = new Date(joinedDateEnd + 'T23:59:59.999')
        if (joinDate > endDate) return false
      }
      return true
    })()

    // Advanced filters
    const matchesAdvancedFilters = Object.entries(filters).every(([key, value]) => {
      if (value === null || value === '' || value === 'all') return true
      
      const attendeeValue = (attendee as any)[key]
      
      // Handle boolean filters
      if (typeof value === 'boolean') {
        return attendeeValue === value
      }
      
      // Handle string filters (partial match)
      if (typeof value === 'string' && typeof attendeeValue === 'string') {
        return attendeeValue.toLowerCase().includes(value.toLowerCase())
      }
      
      // Handle exact match
      return attendeeValue === value
    })

    return matchesSearch && matchesAttendance && matchesWebinar && matchesCountry && 
           matchesRegisteredDate && matchesJoinedDate && matchesAdvancedFilters
  })

  // Sorting
  const sortedAttendees = React.useMemo(() => {
    if (!sortConfig) return filteredAttendees

    const sorted = [...filteredAttendees].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key]
      const bValue = (b as any)[sortConfig.key]

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      // Handle dates
      if (sortConfig.key.includes('At') || sortConfig.key.includes('Date')) {
        const aTime = new Date(aValue).getTime()
        const bTime = new Date(bValue).getTime()
        return sortConfig.direction === 'asc' ? aTime - bTime : bTime - aTime
      }

      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Handle strings
      const aString = String(aValue).toLowerCase()
      const bString = String(bValue).toLowerCase()
      
      if (aString < bString) return sortConfig.direction === 'asc' ? -1 : 1
      if (aString > bString) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [filteredAttendees, sortConfig])

  // Pagination
  const totalPages = Math.ceil(sortedAttendees.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedAttendees = sortedAttendees.slice(startIndex, endIndex)

  // Get unique countries for multi-select
  const uniqueCountries = Array.from(new Set(attendees.map(a => a.country).filter((c): c is string => c !== null))).sort()

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, attendanceFilter, webinarFilter, filters, sortConfig, selectedCountries, registeredDateStart, registeredDateEnd, joinedDateStart, joinedDateEnd])

  const handleSelectAll = () => {
    if (selectedAttendees.length === paginatedAttendees.length) {
      setSelectedAttendees([])
    } else {
      setSelectedAttendees(paginatedAttendees.map(a => a.id))
    }
  }

  const handleSelectAttendee = (id: string) => {
    if (selectedAttendees.includes(id)) {
      setSelectedAttendees(selectedAttendees.filter(aid => aid !== id))
    } else {
      setSelectedAttendees([...selectedAttendees, id])
    }
  }
  
  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleSort = (columnKey: string) => {
    setSortConfig(current => {
      if (!current || current.key !== columnKey) {
        return { key: columnKey, direction: 'asc' }
      }
      if (current.direction === 'asc') {
        return { key: columnKey, direction: 'desc' }
      }
      return null // Clear sort
    })
  }

  const handleFilterChange = (columnKey: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [columnKey]: value
    }))
  }

  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
    setAttendanceFilter('all')
    setWebinarFilter('all')
    setSortConfig(null)
    setSelectedCountries([])
    setRegisteredDateStart('')
    setRegisteredDateEnd('')
    setJoinedDateStart('')
    setJoinedDateEnd('')
  }

  const formatCurrencyValue = (amount?: number | null, currency?: string | null) => {
    if (amount === null || amount === undefined || Number.isNaN(amount)) {
      return 'N/A'
    }

    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency || 'USD'
      }).format(amount)
    } catch {
      return `$${amount.toFixed(2)}`
    }
  }

  const renderFilterInput = (column: ColumnConfig) => {
    const filterValue = filters[column.key]

    // Boolean filters (checkboxes)
    if (column.key === 'attended' || column.key === 'watchedReplay' || 
        column.key === 'replayClickedCTA' || column.key === 'gdprConsent' || 
        column.key === 'privacyConsent' || column.key === 'marketingConsent' ||
        column.key === 'hasPurchased') {
      return (
        <select
          value={filterValue === true ? 'true' : filterValue === false ? 'false' : 'all'}
          onChange={(e) => {
            const val = e.target.value
            handleFilterChange(column.key, val === 'all' ? null : val === 'true')
          }}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      )
    }

    // Device filters
    if (column.key === 'registrationDevice' || column.key === 'lastSessionDevice' || column.key === 'replayDevice') {
      return (
        <select
          value={filterValue?.toString() || 'all'}
          onChange={(e) => handleFilterChange(column.key, e.target.value === 'all' ? null : e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All</option>
          <option value="mobile">Mobile</option>
          <option value="desktop">Desktop</option>
          <option value="unknown">Unknown</option>
        </select>
      )
    }

    // Numeric filters (engagement score, watch time, etc.)
    if (column.key === 'engagementScore' || column.key === 'totalEngagements' || 
        column.key === 'sessionCount' || column.key === 'totalWatchTime' || column.key === 'replayWatchTime' ||
        column.key === 'purchaseCount' || column.key === 'lastPurchaseAmount' || column.key === 'totalPurchaseAmount') {
      return (
        <input
          type="number"
          placeholder="Min"
          value={filterValue?.toString() || ''}
          onChange={(e) => handleFilterChange(column.key, e.target.value ? Number(e.target.value) : null)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
        />
      )
    }

    // Text filters (default)
    return (
      <input
        type="text"
        placeholder="Filter..."
        value={filterValue?.toString() || ''}
        onChange={(e) => handleFilterChange(column.key, e.target.value || null)}
        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
      />
    )
  }

  const handleViewChange = (view: CustomView) => {
    setActiveView(view)
  }

  const handleSaveView = (view: CustomView) => {
    const existingIndex = views.findIndex(v => v.id === view.id)
    let updatedViews: CustomView[]
    
    if (existingIndex >= 0) {
      // Update existing view
      updatedViews = [...views]
      updatedViews[existingIndex] = view
    } else {
      // Add new view
      updatedViews = [...views, view]
    }
    
    saveViews(updatedViews)
    setActiveView(view)
  }

  const handleDeleteView = (viewId: string) => {
    const updatedViews = views.filter(v => v.id !== viewId)
    saveViews(updatedViews)
    
    // If deleted view was active, switch to first available view
    if (activeView.id === viewId && updatedViews.length > 0) {
      setActiveView(updatedViews[0])
    }
  }

  const handleCreateView = () => {
    const newView: CustomView = {
      id: `view_${Date.now()}`,
      name: 'New View',
      columns: defaultColumns.map(col => ({ ...col })) // Clone columns
    }
    
    const updatedViews = [...views, newView]
    saveViews(updatedViews)
    setActiveView(newView)
  }

  // Format date/time with selected timezone
  const formatDateTime = (dateString: string | null, type: 'date' | 'time' | 'full' = 'full') => {
    if (!dateString) return 'N/A'
    
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      timeZone: selectedTimezone
    }
    
    if (type === 'date' || type === 'full') {
      options.year = 'numeric'
      options.month = 'short'
      options.day = 'numeric'
    }
    
    if (type === 'time' || type === 'full') {
      options.hour = '2-digit'
      options.minute = '2-digit'
      options.second = '2-digit'
    }
    
    return date.toLocaleString('en-US', options)
  }
  
  const formatSessionTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  const handleExportCSV = () => {
    const enabledColumns = activeView.columns.filter(c => c.enabled)
    const headers = enabledColumns.map(c => c.label)
    
    // Helper function to escape CSV values (handles commas, quotes, and newlines)
    const escapeCSVValue = (val: string): string => {
      if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
        // Escape double quotes by doubling them, then wrap in quotes
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }
    
    // Use sorted/filtered data for export
    const rows = sortedAttendees.map(a => 
      enabledColumns.map(col => {
        const value = (a as any)[col.key]
        let formattedValue: string
        
        // Format special values
        if (col.key === 'registeredAt' || col.key === 'scheduledAt' || col.key === 'joinedAt' || col.key === 'leftAt' || col.key === 'lastSeenAt' || col.key === 'lastPurchaseAt') {
          formattedValue = value ? formatDateTime(value) : 'N/A'
        } else if (col.key === 'lastPurchaseAmount') {
          formattedValue = value != null ? formatCurrencyValue(value, (a as any).lastPurchaseCurrency) : 'N/A'
        } else if (col.key === 'totalPurchaseAmount') {
          formattedValue = value != null ? formatCurrencyValue(value, (a as any).purchaseCurrency) : 'N/A'
        } else if (col.key === 'attended' || col.key === 'watchedReplay' || col.key === 'replayClickedCTA' || 
            col.key === 'gdprConsent' || col.key === 'privacyConsent' || col.key === 'marketingConsent' ||
            col.key === 'hasPurchased') {
          formattedValue = value ? 'Yes' : 'No'
        } else if (col.key === 'webinarStatus') {
          formattedValue = value || 'Unknown'
        } else {
          formattedValue = value?.toString() || 'N/A'
        }
        
        return escapeCSVValue(formattedValue)
      })
    )
    
    // Also escape headers in case they contain special characters
    const escapedHeaders = headers.map(h => escapeCSVValue(h))
    const csv = [escapedHeaders, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendees-${activeView.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const handleApplyAttendanceTags = async () => {
    if (applyingTags) return

    const confirmed = confirm(
      webinarFilter === 'all'
        ? 'Apply attendance tags for ALL webinars? This will tag all attendees in ClickFunnels based on their attendance.'
        : 'Apply attendance tags for this webinar? This will tag all attendees in ClickFunnels based on their attendance.'
    )

    if (!confirmed) return

    setApplyingTags(true)
    setTagResult(null)

    try {
      const response = await fetch('/api/clickfunnels/apply-attendance-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webinarId: webinarFilter !== 'all' ? webinarFilter : undefined,
          all: webinarFilter === 'all'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setTagResult({
          success: true,
          message: data.message || 'Attendance tags applied successfully!'
        })
      } else {
        setTagResult({
          success: false,
          message: data.error || 'Failed to apply attendance tags'
        })
      }
    } catch (error) {
      console.error('Error applying attendance tags:', error)
      setTagResult({
        success: false,
        message: 'An error occurred while applying tags'
      })
    } finally {
      setApplyingTags(false)
      // Clear result after 5 seconds
      setTimeout(() => setTagResult(null), 5000)
    }
  }

  const handleDeleteClick = (mode: 'single' | 'selected' | 'all', attendeeId?: string) => {
    setDeleteMode(mode)
    setDeleteTargetId(attendeeId || null)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      let idsToDelete: string[] = []
      
      if (deleteMode === 'single' && deleteTargetId) {
        idsToDelete = [deleteTargetId]
      } else if (deleteMode === 'selected') {
        idsToDelete = selectedAttendees
      } else if (deleteMode === 'all') {
        idsToDelete = attendees.map(a => a.id)
      }

      const response = await fetch('/api/attendees', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsToDelete })
      })

      if (response.ok) {
        // Remove deleted attendees from state
        setAttendees(prev => prev.filter(a => !idsToDelete.includes(a.id)))
        setSelectedAttendees([])
        setShowDeleteModal(false)
        setDeleteTargetId(null)
      } else {
        const error = await response.json()
        alert(`Failed to delete: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete attendees')
    } finally {
      setIsDeleting(false)
    }
  }

  const renderCellValue = (attendee: Attendee, column: ColumnConfig) => {
    const value = (attendee as any)[column.key]
    
    switch (column.key) {
      case 'name':
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {attendee.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">{attendee.name}</div>
            </div>
          </div>
        )
      
      case 'email':
        return <div className="text-sm text-gray-900">{value}</div>
      
      case 'phone':
        return <div className="text-sm text-gray-500">{value || 'N/A'}</div>
      
      case 'webinarTitle':
        return <div className="text-sm text-gray-900">{value}</div>
      
      case 'country':
      case 'timezone':
        return <div className="text-sm text-gray-500">{value || 'N/A'}</div>
      
      case 'registeredAt':
      case 'scheduledAt':
      case 'joinedAt':
      case 'leftAt':
      case 'lastSeenAt':
      case 'lastPurchaseAt':
        if (!value) return <div className="text-sm text-gray-400">N/A</div>
        return (
          <div>
            <div className="text-sm text-gray-900">{formatDateTime(value, 'date')}</div>
            <div className="text-sm text-gray-500">{formatDateTime(value, 'time')}</div>
          </div>
        )
      
      case 'attended':
        return attendee.attended ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Yes
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            No
          </span>
        )

      case 'webinarStatus':
        const status = attendee.webinarStatus
        if (status === 'Upcoming') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Calendar className="w-3 h-3" />
              Upcoming
            </span>
          )
        } else if (status === 'Currently Happening') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />
              Live Now
            </span>
          )
        } else if (status === 'No Show') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <XCircle className="w-3 h-3" />
              No Show
            </span>
          )
        } else if (status === 'Attended') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3" />
              Attended
            </span>
          )
        } else {
          return <div className="text-sm text-gray-400">Unknown</div>
        }

      case 'hasPurchased':
        return attendee.hasPurchased ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3" />
            Purchased
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <XCircle className="w-3 h-3" />
            Not Yet
          </span>
        )
      
      case 'purchaseCount':
        return <div className="text-sm text-gray-900">{value ?? 0}</div>
      
      case 'engagementScore':
        const score = value || 0
        const color = score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600'
        return <div className={`text-sm font-medium ${color}`}>{score}%</div>
      
      case 'registrationDevice':
      case 'lastSessionDevice':
      case 'replayDevice':
        if (!value || value === 'unknown') return <div className="text-sm text-gray-400">Unknown</div>
        const Icon = value === 'mobile' ? Smartphone : Monitor
        return (
          <div className="flex items-center gap-1 text-sm text-gray-700">
            <Icon className="w-4 h-4" />
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </div>
        )
      
      case 'lastSessionBrowser':
      case 'lastSessionOS':
        return <div className="text-sm text-gray-700">{value || 'Unknown'}</div>
      
      case 'totalWatchTime':
      case 'replayWatchTime':
      case 'lastWatchedPosition':
        let formattedKey = 'totalWatchTimeFormatted'
        if (column.key === 'replayWatchTime') formattedKey = 'replayWatchTimeFormatted'
        if (column.key === 'lastWatchedPosition') formattedKey = 'lastWatchedPositionFormatted'
        return (
          <div className="flex items-center gap-1 text-sm text-gray-700">
            <Clock className="w-4 h-4" />
            {(attendee as any)[formattedKey] || '0:00'}
          </div>
        )
      
      case 'watchedReplay':
      case 'replayClickedCTA':
      case 'gdprConsent':
      case 'privacyConsent':
      case 'marketingConsent':
      case 'viewedOffer':
      case 'clickedOffer':
        return value ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <XCircle className="w-4 h-4 text-gray-300" />
        )
      
      case 'watchedMostlyMuted':
        return value ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <i className="fas fa-volume-mute" style={{ fontSize: '10px' }} />
            Muted
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <i className="fas fa-volume-up" style={{ fontSize: '10px' }} />
            Unmuted
          </span>
        )
      
      case 'totalMutedTime':
      case 'totalUnmutedTime':
        let mutedFormattedKey = column.key === 'totalMutedTime' ? 'totalMutedTimeFormatted' : 'totalUnmutedTimeFormatted'
        return (
          <div className="flex items-center gap-1 text-sm text-gray-700">
            <Clock className="w-4 h-4" />
            {(attendee as any)[mutedFormattedKey] || '0:00'}
          </div>
        )
      
      case 'totalEngagements':
      case 'sessionCount':
        return <div className="text-sm text-gray-700">{value || 0}</div>
      
      case 'lastPurchaseAmount':
        if (value == null) return <div className="text-sm text-gray-400">N/A</div>
        return (
          <div className="text-sm font-medium text-gray-900">
            {formatCurrencyValue(value, attendee.lastPurchaseCurrency)}
          </div>
        )

      case 'totalPurchaseAmount':
        if (value == null) return <div className="text-sm text-gray-400">N/A</div>
        return (
          <div className="text-sm font-medium text-gray-900">
            {formatCurrencyValue(value, attendee.purchaseCurrency)}
          </div>
        )
      
      default:
        return <div className="text-sm text-gray-700">{value?.toString() || 'N/A'}</div>
    }
  }
  const enabledColumns = activeView.columns.filter(c => c.enabled)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendees</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and analyze your webinar attendees
            </p>
          </div>
        </div>

        {/* Stats - Clean Minimal Design */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Total Registrations</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{attendees.length}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Attended</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {attendees.filter(a => a.attended).length}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Attendance Rate</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {attendees.length > 0 ? Math.round((attendees.filter(a => a.attended).length / attendees.length) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Tag Application Result Notification */}
        {tagResult && (
          <div
            className={`rounded-lg border p-4 ${
              tagResult.success
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {tagResult.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <p className="font-medium">{tagResult.message}</p>
            </div>
          </div>
        )}

        {/* Filters and Actions - Cleaner Layout */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col gap-6">
            {/* Search and View Manager */}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>
              
              <ViewManager
                views={views}
                activeView={activeView}
                onViewChange={handleViewChange}
                onSaveView={handleSaveView}
                onDeleteView={handleDeleteView}
                onCreateView={handleCreateView}
              />
            </div>

            {/* Filters - Simplified Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Attendance Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Attendance</label>
                <select
                  value={attendanceFilter}
                  onChange={(e) => setAttendanceFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="attended">Attended</option>
                  <option value="no-show">No Show</option>
                  <option value="upcoming">Upcoming</option>
                </select>
              </div>

              {/* Webinar Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Webinar</label>
                <select
                  value={webinarFilter}
                  onChange={(e) => setWebinarFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                >
                  <option value="all">All Webinars</option>
                  {Array.from(new Set(attendees.map(a => a.webinarTitle))).map(title => (
                    <option key={title} value={title}>{title}</option>
                  ))}
                </select>
              </div>

              {/* Country Multi-Select */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Countries</label>
                <MultiSelect
                  options={uniqueCountries}
                  selected={selectedCountries}
                  onChange={setSelectedCountries}
                  label="Select countries"
                />
              </div>

              {/* Timezone Selector */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Timezone
                </label>
                <select
                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                >
                  <option value="America/New_York">Eastern (ET)</option>
                  <option value="America/Chicago">Central (CT)</option>
                  <option value="America/Denver">Mountain (MT)</option>
                  <option value="America/Los_Angeles">Pacific (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Dubai">Dubai (GST)</option>
                  <option value="Asia/Kolkata">India (IST)</option>
                  <option value="Asia/Singapore">Singapore (SGT)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Australia/Sydney">Sydney (AEDT)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              {/* Page Size */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Per Page</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Date Range Filters - Cleaner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Registration Date Range */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Registration Date</label>
                <DateRangePicker
                  startDate={registeredDateStart}
                  endDate={registeredDateEnd}
                  onStartDateChange={setRegisteredDateStart}
                  onEndDateChange={setRegisteredDateEnd}
                  onClear={() => {
                    setRegisteredDateStart('')
                    setRegisteredDateEnd('')
                  }}
                  label=""
                />
              </div>

              {/* Joined Date Range */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Joined Date</label>
                <DateRangePicker
                  startDate={joinedDateStart}
                  endDate={joinedDateEnd}
                  onStartDateChange={setJoinedDateStart}
                  onEndDateChange={setJoinedDateEnd}
                  onClear={() => {
                    setJoinedDateStart('')
                    setJoinedDateEnd('')
                  }}
                  label=""
                />
              </div>
            </div>

            {/* Action Buttons - Minimal Design */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {selectedAttendees.length > 0 && (
                  <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    <Mail className="w-4 h-4" />
                    Email ({selectedAttendees.length})
                  </button>
                )}

                {selectedAttendees.length > 0 && (
                  <button 
                    onClick={() => handleDeleteClick('selected')}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Selected ({selectedAttendees.length})
                  </button>
                )}

                {attendees.length > 0 && (
                  <button 
                    onClick={() => handleDeleteClick('all')}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete All
                  </button>
                )}

                <button 
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>

                <button 
                  onClick={handleApplyAttendanceTags}
                  disabled={applyingTags}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {applyingTags ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Applying Tags...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Apply CF Tags
                    </>
                  )}
                </button>

                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FilterIcon className="w-4 h-4" />
                  {showFilters ? 'Hide' : 'Show'} Advanced
                </button>

                {(Object.keys(filters).length > 0 || sortConfig || searchQuery || 
                  selectedCountries.length > 0 || registeredDateStart || registeredDateEnd || 
                  joinedDateStart || joinedDateEnd) && (
                  <button 
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </div>

              {/* Results info */}
              <div className="text-xs text-gray-500">
                <span className="font-medium text-gray-700">{startIndex + 1}-{Math.min(endIndex, sortedAttendees.length)}</span> of <span className="font-medium text-gray-700">{sortedAttendees.length}</span>
                {sortedAttendees.length !== attendees.length && (
                  <span className="ml-1">(filtered from {attendees.length})</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table - Clean Modern Design */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-16 z-10">
                {/* Header Row */}
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left">
                    <input
                      type="checkbox"
                      checked={selectedAttendees.length === paginatedAttendees.length && paginatedAttendees.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                    />
                  </th>
                  {enabledColumns.map(column => (
                    <th
                      key={column.key}
                      scope="col"
                      className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap cursor-pointer hover:bg-gray-100 select-none transition-colors"
                      onClick={() => handleSort(column.key)}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{column.label}</span>
                        {sortConfig?.key === column.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3.5 h-3.5 opacity-20" />
                        )}
                      </div>
                    </th>
                  ))}
                  <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
                
                {/* Filter Row */}
                {showFilters && (
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-2"></th>
                    {enabledColumns.map(column => (
                      <th key={column.key} className="px-6 py-2">
                        {renderFilterInput(column)}
                      </th>
                    ))}
                    <th className="px-6 py-2"></th>
                  </tr>
                )}
              </thead>
              <tbody className="bg-white">
                {paginatedAttendees.map((attendee, index) => (
                  <React.Fragment key={attendee.id}>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedAttendees.includes(attendee.id)}
                            onChange={() => handleSelectAttendee(attendee.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                          />
                          {attendee.sessions && attendee.sessions.length > 1 && (
                            <button
                              onClick={() => toggleRowExpand(attendee.id)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title={`${attendee.sessions.length} sessions - click to ${expandedRows.has(attendee.id) ? 'collapse' : 'expand'}`}
                            >
                              {expandedRows.has(attendee.id) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      {enabledColumns.map(column => (
                        <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                          {renderCellValue(attendee, column)}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleDeleteClick('single', attendee.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete attendee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => router.push(`/dashboard/attendees/${attendee.id}`)}
                            className="text-blue-600 hover:text-blue-900" 
                            title="View detailed profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expandable Sessions Row */}
                    {expandedRows.has(attendee.id) && attendee.sessions && attendee.sessions.length > 0 && (
                      <tr className="bg-blue-50">
                        <td colSpan={enabledColumns.length + 2} className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="text-sm font-semibold text-gray-900 mb-3">
                              {attendee.sessions.length} Session{attendee.sessions.length > 1 ? 's' : ''} Details
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {attendee.sessions.map((session, idx) => (
                                <div key={session.id} className="bg-white rounded-lg border border-gray-200 p-3">
                                  <div className="grid grid-cols-6 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium text-gray-500">Session {idx + 1}</span>
                                      {session.isActive && (
                                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                                          Active
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      <span className="block text-xs text-gray-500">Joined</span>
                                      <span className="text-gray-900">{formatDateTime(session.joinedAt, 'time')}</span>
                                    </div>
                                    <div>
                                      <span className="block text-xs text-gray-500">Left</span>
                                      <span className="text-gray-900">{session.leftAt ? formatDateTime(session.leftAt, 'time') : '—'}</span>
                                    </div>
                                    <div>
                                      <span className="block text-xs text-gray-500">Watch Time</span>
                                      <span className="text-gray-900">{formatSessionTime(session.videoPosition || 0)}</span>
                                    </div>
                                    <div>
                                      <span className="block text-xs text-gray-500">Device</span>
                                      <span className="text-gray-900 capitalize">{session.device || 'Unknown'}</span>
                                    </div>
                                    <div>
                                      <span className="block text-xs text-gray-500">Browser</span>
                                      <span className="text-gray-900">{session.browser || 'Unknown'}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading attendees...</p>
            </div>
          )}

          {!loading && paginatedAttendees.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No attendees found</p>
            </div>
          )}
        </div>

        {/* Pagination - Minimal Clean Design */}
        {!loading && sortedAttendees.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                {totalPages > 5 && (
                  <>
                    {currentPage < totalPages - 2 && (
                      <span className="px-2 text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === totalPages
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {deleteMode === 'single' && 'Delete Attendee'}
                  {deleteMode === 'selected' && `Delete ${selectedAttendees.length} Attendees`}
                  {deleteMode === 'all' && `Delete All ${attendees.length} Attendees`}
                </h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              {deleteMode === 'single' && 'Are you sure you want to delete this attendee? All associated data will be permanently removed.'}
              {deleteMode === 'selected' && `Are you sure you want to delete ${selectedAttendees.length} selected attendees? All associated data will be permanently removed.`}
              {deleteMode === 'all' && `Are you sure you want to delete all ${attendees.length} attendees? This will permanently remove all attendee records and their associated data.`}
            </p>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteTargetId(null)
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
