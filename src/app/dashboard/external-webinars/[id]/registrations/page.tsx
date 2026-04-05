'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import {
  ArrowLeft,
  Search,
  Download,
  Loader2,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Tag,
  Phone,
  Mail,
  BarChart3
} from 'lucide-react'

interface Registration {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  scheduleId?: string
  scheduleDate?: string
  attended: boolean
  attendedLive: boolean
  attendedReplay: boolean
  watchTimeMinutes?: number
  attendanceTag?: string
  attendanceTagsApplied: boolean
  sentToFacebookCAPI: boolean
  postSessionSMSSent: boolean
  createdAt: string
}

interface ExternalWebinar {
  id: string
  name: string
  platform: string
  externalWebinarId: string
}

export default function ExternalWebinarRegistrationsPage() {
  const params = useParams()
  const id = params.id as string

  const [webinar, setWebinar] = useState<ExternalWebinar | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAttendance, setFilterAttendance] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [webinarRes, registrationsRes] = await Promise.all([
        fetch(`/api/external-webinars/${id}`),
        fetch(`/api/external-webinars/${id}/registrations`)
      ])

      if (!webinarRes.ok) throw new Error('Failed to fetch webinar')
      if (!registrationsRes.ok) throw new Error('Failed to fetch registrations')

      const webinarData = await webinarRes.json()
      const registrationsData = await registrationsRes.json()

      setWebinar(webinarData)
      setRegistrations(registrationsData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredRegistrations = registrations.filter((r) => {
    const matchesSearch =
      r.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter =
      filterAttendance === 'all' ||
      (filterAttendance === 'attended' && r.attended) ||
      (filterAttendance === 'missed' && !r.attended)

    return matchesSearch && matchesFilter
  })

  const stats = {
    total: registrations.length,
    attended: registrations.filter((r) => r.attended).length,
    missed: registrations.filter((r) => !r.attended).length,
    facebookSent: registrations.filter((r) => r.sentToFacebookCAPI).length,
  }

  const exportCSV = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Attended', 'Watch Time (min)', 'Tag', 'Registered At']
    const rows = filteredRegistrations.map((r) => [
      r.firstName,
      r.lastName,
      r.email,
      r.phone || '',
      r.attended ? 'Yes' : 'No',
      r.watchTimeMinutes?.toString() || '',
      r.attendanceTag || '',
      new Date(r.createdAt).toLocaleString()
    ])

    const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `registrations-${webinar?.name || id}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  if (error || !webinar) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600">{error || 'Webinar not found'}</p>
          <Link href="/dashboard/external-webinars">
            <Button className="mt-4">Back to External Webinars</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/external-webinars/${id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Registrations</h1>
              <p className="text-sm text-gray-500">{webinar.name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-gray-500">Total Registrations</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.attended}</p>
                  <p className="text-xs text-gray-500">Attended</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.missed}</p>
                  <p className="text-xs text-gray-500">Missed</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.facebookSent}</p>
                  <p className="text-xs text-gray-500">FB CAPI Sent</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardBody>
            <div className="flex flex-col sm:flex-row gap-4">
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
              <select
                value={filterAttendance}
                onChange={(e) => setFilterAttendance(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Attendance</option>
                <option value="attended">Attended</option>
                <option value="missed">Missed</option>
              </select>
            </div>
          </CardBody>
        </Card>

        {/* Table */}
        <Card>
          <CardBody className="overflow-x-auto">
            {filteredRegistrations.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No registrations found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Contact</th>
                    <th className="pb-3 font-medium">Attendance</th>
                    <th className="pb-3 font-medium">Watch Time</th>
                    <th className="pb-3 font-medium">Tag</th>
                    <th className="pb-3 font-medium">Integrations</th>
                    <th className="pb-3 font-medium">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRegistrations.map((r) => (
                    <tr key={r.id} className="text-sm">
                      <td className="py-3">
                        <p className="font-medium text-gray-900">
                          {r.firstName} {r.lastName}
                        </p>
                      </td>
                      <td className="py-3">
                        <div className="space-y-1">
                          <p className="flex items-center gap-1 text-gray-600">
                            <Mail className="w-3 h-3" /> {r.email}
                          </p>
                          {r.phone && (
                            <p className="flex items-center gap-1 text-gray-500">
                              <Phone className="w-3 h-3" /> {r.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        {r.attended ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" />
                            {r.attendedLive && r.attendedReplay ? 'Live & Replay' : r.attendedLive ? 'Live' : 'Replay'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <XCircle className="w-3 h-3" />
                            Missed
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        {r.watchTimeMinutes != null ? (
                          <span className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-3 h-3" /> {r.watchTimeMinutes} min
                          </span>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </td>
                      <td className="py-3">
                        {r.attendanceTag ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Tag className="w-3 h-3" /> {r.attendanceTag}
                          </span>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          {r.sentToFacebookCAPI && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700" title="Sent to Facebook CAPI">
                              FB
                            </span>
                          )}
                          {r.postSessionSMSSent && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-700" title="Post-session SMS sent">
                              SMS
                            </span>
                          )}
                          {r.attendanceTagsApplied && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700" title="Tags applied">
                              Tag
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-gray-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  )
}
