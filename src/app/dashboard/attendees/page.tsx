'use client'

import React, { useState } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import {
  Search,
  Filter,
  Download,
  Mail,
  MoreVertical,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react'

interface Attendee {
  id: string
  name: string
  email: string
  phone: string | null
  timezone: string | null
  country: string | null
  webinarTitle: string
  registeredAt: string
  attended: boolean
  joinedAt: string | null
  leftAt: string | null
  engagementScore: number
  gdprConsent: boolean
  privacyConsent: boolean
  marketingConsent: boolean
}

export default function AttendeesPage() {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [attendanceFilter, setAttendanceFilter] = useState('all')
  const [webinarFilter, setWebinarFilter] = useState('all')
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])

  // Fetch attendees from API
  React.useEffect(() => {
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

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Webinar', 'Timezone', 'Country', 'Registered', 'Attended', 'GDPR Consent', 'Marketing Consent', 'Engagement Score']
    const rows = filteredAttendees.map(a => [
      a.name,
      a.email,
      a.phone || 'N/A',
      a.webinarTitle,
      a.timezone || 'N/A',
      a.country || 'N/A',
      new Date(a.registeredAt).toLocaleString(),
      a.attended ? 'Yes' : 'No',
      a.gdprConsent ? 'Yes' : 'No',
      a.marketingConsent ? 'Yes' : 'No',
      a.engagementScore
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendees-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const uniqueWebinars = Array.from(new Set(attendees.map((a: Attendee) => a.webinarTitle)))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendees</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and export attendee data
            </p>
          </div>
          <Button onClick={handleExportCSV} className="inline-flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Attendance Filter */}
              <select
                value={attendanceFilter}
                onChange={(e) => setAttendanceFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Attendees</option>
                <option value="attended">Attended</option>
                <option value="no-show">No Show</option>
              </select>

              {/* Webinar Filter */}
              <select
                value={webinarFilter}
                onChange={(e) => setWebinarFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Webinars</option>
                {uniqueWebinars.map(webinar => (
                  <option key={webinar} value={webinar}>{webinar}</option>
                ))}
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedAttendees.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-blue-900 font-medium">
                  {selectedAttendees.length} selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                  <Button size="sm" variant="secondary">
                    Export Selected
                  </Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Attendees Table */}
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendee
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Webinar
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consents
                  </th>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                          {attendee.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{attendee.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{attendee.email}</div>
                      {attendee.phone && (
                        <div className="text-sm text-gray-500">{attendee.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{attendee.webinarTitle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {attendee.country && (
                        <div className="text-sm text-gray-900">{attendee.country}</div>
                      )}
                      {attendee.timezone && (
                        <div className="text-sm text-gray-500">{attendee.timezone}</div>
                      )}
                      {!attendee.country && !attendee.timezone && (
                        <div className="text-sm text-gray-400">N/A</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(attendee.registeredAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(attendee.registeredAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {attendee.attended ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" />
                          Attended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <XCircle className="w-3 h-3" />
                          No Show
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {attendee.gdprConsent && (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                            <CheckCircle className="w-3 h-3" />
                            GDPR
                          </span>
                        )}
                        {attendee.privacyConsent && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Privacy
                          </span>
                        )}
                        {attendee.marketingConsent && (
                          <span className="inline-flex items-center gap-1 text-xs text-purple-600">
                            <CheckCircle className="w-3 h-3" />
                            Marketing
                          </span>
                        )}
                      </div>
                    </td>
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
                {attendees.filter((a: Attendee) => a.attended).length}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h3 className="text-sm font-medium text-gray-600">Attendance Rate</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {attendees.length > 0 ? Math.round((attendees.filter((a: Attendee) => a.attended).length / attendees.length) * 100) : 0}%
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
