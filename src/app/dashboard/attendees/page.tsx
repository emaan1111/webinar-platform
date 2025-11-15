'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
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
  Clock
} from 'lucide-react'

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
  attended: boolean
  joinedAt: string | null
  leftAt: string | null
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
  lastSessionDevice?: string | null
  lastSessionBrowser?: string | null
  lastSessionOS?: string | null
  totalEngagements?: number
  sessionCount?: number
}

const VIEWS_STORAGE_KEY = 'attendee_views'

export default function AttendeesPage() {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [attendanceFilter, setAttendanceFilter] = useState('all')
  const [webinarFilter, setWebinarFilter] = useState('all')
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])

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
        setViews(parsed)
        
        // Set first view as active
        if (parsed.length > 0) {
          setActiveView(parsed[0])
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
    const matchesSearch = 
      attendee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attendee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (attendee.phone && attendee.phone.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesAttendance = 
      attendanceFilter === 'all' ||
      (attendanceFilter === 'attended' && attendee.attended) ||
      (attendanceFilter === 'no-show' && !attendee.attended)
    
    const matchesWebinar = 
      webinarFilter === 'all' ||
      attendee.webinarTitle === webinarFilter

    return matchesSearch && matchesAttendance && matchesWebinar
  })

  const handleSelectAll = () => {
    if (selectedAttendees.length === filteredAttendees.length) {
      setSelectedAttendees([])
    } else {
      setSelectedAttendees(filteredAttendees.map(a => a.id))
    }
  }

  const handleSelectAttendee = (id: string) => {
    if (selectedAttendees.includes(id)) {
      setSelectedAttendees(selectedAttendees.filter(aid => aid !== id))
    } else {
      setSelectedAttendees([...selectedAttendees, id])
    }
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

  const handleExportCSV = () => {
    const enabledColumns = activeView.columns.filter(c => c.enabled)
    const headers = enabledColumns.map(c => c.label)
    
    const rows = filteredAttendees.map(a => 
      enabledColumns.map(col => {
        const value = (a as any)[col.key]
        
        // Format special values
        if (col.key === 'registeredAt' || col.key === 'joinedAt' || col.key === 'leftAt') {
          return value ? new Date(value).toLocaleString() : 'N/A'
        }
        if (col.key === 'attended' || col.key === 'watchedReplay' || col.key === 'replayClickedCTA' || 
            col.key === 'gdprConsent' || col.key === 'privacyConsent' || col.key === 'marketingConsent') {
          return value ? 'Yes' : 'No'
        }
        
        return value?.toString() || 'N/A'
      })
    )
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendees-${activeView.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
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
      case 'joinedAt':
      case 'leftAt':
        if (!value) return <div className="text-sm text-gray-400">N/A</div>
        return (
          <div>
            <div className="text-sm text-gray-900">{new Date(value).toLocaleDateString()}</div>
            <div className="text-sm text-gray-500">{new Date(value).toLocaleTimeString()}</div>
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
        const formattedKey = column.key === 'totalWatchTime' ? 'totalWatchTimeFormatted' : 'replayWatchTimeFormatted'
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
        return value ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <XCircle className="w-4 h-4 text-gray-300" />
        )
      
      case 'totalEngagements':
      case 'sessionCount':
        return <div className="text-sm text-gray-700">{value || 0}</div>
      
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

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card>
            <CardBody>
              <h3 className="text-sm font-medium text-gray-600">Total Registrations</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{attendees.length}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h3 className="text-sm font-medium text-gray-600">Attended</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {attendees.filter(a => a.attended).length}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h3 className="text-sm font-medium text-gray-600">Attendance Rate</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {attendees.length > 0 ? Math.round((attendees.filter(a => a.attended).length / attendees.length) * 100) : 0}%
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardBody>
            <div className="flex flex-col gap-4">
              {/* Search and View Manager */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <select
                  value={attendanceFilter}
                  onChange={(e) => setAttendanceFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="attended">Attended</option>
                  <option value="no-show">No Show</option>
                </select>

                <select
                  value={webinarFilter}
                  onChange={(e) => setWebinarFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Webinars</option>
                  {Array.from(new Set(attendees.map(a => a.webinarTitle))).map(title => (
                    <option key={title} value={title}>{title}</option>
                  ))}
                </select>

                {selectedAttendees.length > 0 && (
                  <>
                    <Button variant="secondary" size="sm">
                      <Mail className="w-4 h-4 mr-2" />
                      Email Selected ({selectedAttendees.length})
                    </Button>
                  </>
                )}

                <Button variant="secondary" size="sm" onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedAttendees.length === filteredAttendees.length && filteredAttendees.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  {enabledColumns.map(column => (
                    <th
                      key={column.key}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {column.label}
                    </th>
                  ))}
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAttendees.map((attendee) => (
                  <tr key={attendee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedAttendees.includes(attendee.id)}
                        onChange={() => handleSelectAttendee(attendee.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    {enabledColumns.map(column => (
                      <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                        {renderCellValue(attendee, column)}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading attendees...</p>
            </div>
          )}

          {!loading && filteredAttendees.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No attendees found</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
