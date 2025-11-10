'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  Calendar,
  Users,
  PlayCircle,
  Ban,
  Loader2
} from 'lucide-react'

interface Webinar {
  id: string
  title: string
  description?: string
  duration: number
  status: string
  thumbnail?: string | null
  maxAttendees?: number
  registrations: Array<{ id: string; attended: boolean }>
  schedules?: Array<{
    id: string
    scheduleType: string
    scheduledAt: string | null
    minutesFromReg: number | null
    recurringPattern: string | null
  }>
}

export default function WebinarsPage() {
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    fetchWebinars()
  }, [])

  const fetchWebinars = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/webinars')
      if (!response.ok) {
        throw new Error('Failed to fetch webinars')
      }
      const data = await response.json()
      setWebinars(data.webinars || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Fetch webinars error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webinar?')) {
      return
    }

    try {
      const response = await fetch(`/api/webinars/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete webinar')
      }

      // Refresh list
      fetchWebinars()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const handleDuplicate = async (id: string) => {
    if (!confirm('Create a copy of this webinar?')) {
      return
    }

    try {
      const response = await fetch(`/api/webinars/${id}/duplicate`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate webinar')
      }

      const data = await response.json()
      alert('Webinar duplicated successfully!')
      
      // Refresh list
      fetchWebinars()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const filteredWebinars = webinars.filter(webinar => {
    const matchesSearch = webinar.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || webinar.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Webinars</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage all your webinars in one place
            </p>
          </div>
          <Link href="/dashboard/webinars/new">
            <Button className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Webinar
            </Button>
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search webinars..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="LIVE">Live</option>
                <option value="ENDED">Ended</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </CardBody>
        </Card>

        {/* Webinars list */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardBody>
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600">Loading webinars...</p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <>
              {filteredWebinars.map((webinar) => (
                <WebinarCard 
                  key={webinar.id} 
                  webinar={webinar} 
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                />
              ))}
              
              {filteredWebinars.length === 0 && (
                <Card>
                  <CardBody>
                    <div className="text-center py-12">
                      <PlayCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No webinars found</h3>
                      <p className="text-gray-600 mb-6">
                        {searchQuery || statusFilter !== 'ALL' 
                          ? 'Try adjusting your search or filters' 
                          : 'Get started by creating your first webinar'}
                      </p>
                      <Link href="/dashboard/webinars/new">
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Webinar
                        </Button>
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

function WebinarCard({ 
  webinar, 
  onDelete, 
  onDuplicate 
}: { 
  webinar: any
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  
  const statusConfig = {
    DRAFT: { color: 'bg-gray-100 text-gray-700', icon: Edit },
    SCHEDULED: { color: 'bg-blue-100 text-blue-700', icon: Calendar },
    LIVE: { color: 'bg-green-100 text-green-700', icon: PlayCircle },
    ENDED: { color: 'bg-gray-100 text-gray-700', icon: Ban },
    CANCELLED: { color: 'bg-red-100 text-red-700', icon: Ban }
  }

  const config = statusConfig[webinar.status as keyof typeof statusConfig]
  const StatusIcon = config.icon
  const registrationCount = Array.isArray(webinar.registrations) ? webinar.registrations.length : 0
  const capacity = webinar.maxAttendees ? Math.round((registrationCount / webinar.maxAttendees) * 100) : 0

  return (
    <Card>
      <CardBody>
        <div className="flex items-start gap-6">
          {/* Thumbnail */}
          <div className="flex-shrink-0 w-40 h-28 bg-gray-200 rounded-lg overflow-hidden">
            {webinar.thumbnail ? (
              <img src={webinar.thumbnail} alt={webinar.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <PlayCircle className="w-12 h-12" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {webinar.title}
                  </h3>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {webinar.status}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span suppressHydrationWarning>
                      {webinar.schedules && webinar.schedules.length > 0 ? (
                        webinar.schedules[0].scheduleType === 'specific' && webinar.schedules[0].scheduledAt
                          ? new Date(webinar.schedules[0].scheduledAt).toLocaleString()
                          : webinar.schedules[0].scheduleType === 'justInTime'
                          ? `${webinar.schedules[0].minutesFromReg} min from registration`
                          : webinar.schedules[0].scheduleType === 'recurring'
                          ? 'Recurring schedule'
                          : 'No schedule set'
                      ) : (
                        'No schedule set'
                      )}
                      {webinar.schedules && webinar.schedules.length > 1 && (
                        <span className="ml-1 text-xs text-gray-500">
                          +{webinar.schedules.length - 1} more
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {registrationCount} / {webinar.maxAttendees || 0} ({capacity}%)
                  </div>
                  <div className="text-gray-500">
                    {webinar.duration} minutes
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4">
              <Link href={`/dashboard/webinars/${webinar.id}`}>
                <Button variant="secondary" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
              </Link>
              <Link href={`/dashboard/webinars/${webinar.id}/edit`}>
                <Button variant="secondary" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/webinars/${webinar.id}`)}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
              <Button variant="secondary" size="sm" onClick={() => onDuplicate(webinar.id)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </Button>
              <Button variant="danger" size="sm" onClick={() => onDelete(webinar.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
