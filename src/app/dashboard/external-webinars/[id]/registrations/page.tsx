'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import {
  ArrowLeft,
  Search,
  Download,
  Loader2,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Tag,
  Phone,
  Mail,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react'

const PAGE_SIZE = 50
const EXPORT_LIMIT = 10000

// Mirrors the ExternalWebinarRegistration model returned by
// GET /api/external-webinars/[id]/registrations
interface Registration {
  id: string
  name: string
  email: string
  phone?: string | null
  timezone?: string | null
  country?: string | null
  scheduleId?: string | null
  scheduledStartTime?: string | null
  schedule?: {
    id: string
    scheduledAt: string
    timezone?: string | null
    comment?: string | null
  } | null
  registeredAt: string
  registrationSource?: string | null
  attended: boolean
  joinedAt?: string | null
  leftAt?: string | null
  watchTimeMinutes: number
  watchTimePercentage: number
  appliedTag?: string | null
  attendanceTagsApplied: boolean
  facebookCapiSent: boolean
  postSessionSmsSent: boolean
  createdAt: string
}

interface RegistrationStats {
  total: number
  attended: number
  notAttended: number
  facebookCapiSent: number
  postSessionSmsSent: number
  attendanceTagsApplied: number
  avgWatchTimeMinutes: number
  avgWatchTimePercentage: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
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
  const [stats, setStats] = useState<RegistrationStats | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [filterAttendance, setFilterAttendance] = useState<string>('all')
  const [page, setPage] = useState(1)

  // Search and attendance filtering happen server-side so they cover every
  // registration, not just the rows currently loaded into the table.
  const buildQuery = useCallback(
    (pageNumber: number, limit: number) => {
      const query = new URLSearchParams({
        page: String(pageNumber),
        limit: String(limit),
      })
      if (appliedSearch) query.set('search', appliedSearch)
      if (filterAttendance === 'attended') query.set('attended', 'true')
      if (filterAttendance === 'missed') query.set('attended', 'false')
      return query.toString()
    },
    [appliedSearch, filterAttendance]
  )

  useEffect(() => {
    let cancelled = false

    const fetchWebinar = async () => {
      try {
        const res = await fetch(`/api/external-webinars/${id}`)
        if (!res.ok) throw new Error('Failed to fetch webinar')
        const data = await res.json()
        if (!cancelled) setWebinar(data)
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to fetch webinar')
      }
    }

    fetchWebinar()
    return () => {
      cancelled = true
    }
  }, [id])

  // Debounce typing so each keystroke doesn't fire a request. Resetting the page
  // in the same tick keeps a filter change to a single list fetch.
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedSearch(searchQuery.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    let cancelled = false

    const fetchRegistrations = async () => {
      try {
        setListLoading(true)
        const res = await fetch(
          `/api/external-webinars/${id}/registrations?${buildQuery(page, PAGE_SIZE)}`
        )
        if (!res.ok) throw new Error('Failed to fetch registrations')
        const data = await res.json()
        if (cancelled) return

        setRegistrations(Array.isArray(data.registrations) ? data.registrations : [])
        setStats(data.stats || null)
        setPagination(
          data.pagination || { page, limit: PAGE_SIZE, total: 0, totalPages: 0 }
        )
        setError('')
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to fetch registrations')
      } finally {
        if (!cancelled) {
          setListLoading(false)
          setLoading(false)
        }
      }
    }

    fetchRegistrations()
    return () => {
      cancelled = true
    }
  }, [id, page, buildQuery])

  const formatDateTime = (value?: string | null) => {
    if (!value) return null
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
  }

  const sessionTimeOf = (r: Registration) =>
    formatDateTime(r.schedule?.scheduledAt || r.scheduledStartTime)

  const exportCSV = async () => {
    try {
      setExporting(true)
      // Export everything matching the current filters, not just this page.
      const res = await fetch(
        `/api/external-webinars/${id}/registrations?${buildQuery(1, EXPORT_LIMIT)}`
      )
      if (!res.ok) throw new Error('Failed to export registrations')
      const data = await res.json()
      const rowsToExport: Registration[] = Array.isArray(data.registrations)
        ? data.registrations
        : []

      const headers = [
        'Name',
        'Email',
        'Phone',
        'Session',
        'Attended',
        'Watch Time (min)',
        'Watch %',
        'Tag',
        'Tags Applied',
        'FB CAPI Sent',
        'Post-session SMS Sent',
        'Registered At',
      ]
      const rows = rowsToExport.map((r) => {
        const session = sessionTimeOf(r)
        const registered = formatDateTime(r.registeredAt || r.createdAt)
        return [
          r.name || '',
          r.email || '',
          r.phone || '',
          session ? session.toLocaleString() : '',
          r.attended ? 'Yes' : 'No',
          String(r.watchTimeMinutes ?? 0),
          String(r.watchTimePercentage ?? 0),
          r.appliedTag || '',
          r.attendanceTagsApplied ? 'Yes' : 'No',
          r.facebookCapiSent ? 'Yes' : 'No',
          r.postSessionSmsSent ? 'Yes' : 'No',
          registered ? registered.toLocaleString() : '',
        ]
      })

      const csv = [headers, ...rows]
        .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `registrations-${webinar?.name || id}-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message || 'Failed to export registrations')
    } finally {
      setExporting(false)
    }
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

  const isFiltered = Boolean(appliedSearch) || filterAttendance !== 'all'

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
          <Button variant="outline" onClick={exportCSV} disabled={exporting}>
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
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
                  <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
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
                  <p className="text-2xl font-bold">{stats?.attended ?? 0}</p>
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
                  <p className="text-2xl font-bold">{stats?.notAttended ?? 0}</p>
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
                  <p className="text-2xl font-bold">{stats?.avgWatchTimeMinutes ?? 0}</p>
                  <p className="text-xs text-gray-500">Avg Watch Time (min)</p>
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
                onChange={(e) => {
                  setFilterAttendance(e.target.value)
                  setPage(1)
                }}
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
            {listLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {isFiltered ? 'No registrations match these filters' : 'No registrations found'}
                </p>
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Contact</th>
                      <th className="pb-3 font-medium">Session</th>
                      <th className="pb-3 font-medium">Attendance</th>
                      <th className="pb-3 font-medium">Watch Time</th>
                      <th className="pb-3 font-medium">Tag</th>
                      <th className="pb-3 font-medium">Integrations</th>
                      <th className="pb-3 font-medium">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {registrations.map((r) => {
                      const session = sessionTimeOf(r)
                      const registered = formatDateTime(r.registeredAt || r.createdAt)
                      return (
                        <tr key={r.id} className="text-sm">
                          <td className="py-3">
                            <p className="font-medium text-gray-900">{r.name || '--'}</p>
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
                          <td className="py-3 text-gray-600">
                            {session ? (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {session.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-gray-400">--</span>
                            )}
                          </td>
                          <td className="py-3">
                            {r.attended ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3" />
                                Attended
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                <XCircle className="w-3 h-3" />
                                Missed
                              </span>
                            )}
                          </td>
                          <td className="py-3">
                            {r.watchTimeMinutes ? (
                              <span className="flex items-center gap-1 text-gray-600">
                                <Clock className="w-3 h-3" /> {r.watchTimeMinutes} min
                                {r.watchTimePercentage ? ` (${r.watchTimePercentage}%)` : ''}
                              </span>
                            ) : (
                              <span className="text-gray-400">--</span>
                            )}
                          </td>
                          <td className="py-3">
                            {r.appliedTag ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Tag className="w-3 h-3" /> {r.appliedTag}
                              </span>
                            ) : (
                              <span className="text-gray-400">--</span>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              {r.facebookCapiSent && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700" title="Sent to Facebook CAPI">
                                  FB
                                </span>
                              )}
                              {r.postSessionSmsSent && (
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
                            {registered ? registered.toLocaleDateString() : '--'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 mt-4 border-t">
                    <p className="text-sm text-gray-500">
                      Page {pagination.page} of {pagination.totalPages} ({pagination.total}{' '}
                      {isFiltered ? 'matching ' : ''}registrations)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={pagination.page <= 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={pagination.page >= pagination.totalPages}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  )
}
