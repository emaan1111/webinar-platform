'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import {
  Plus,
  Search,
  Settings,
  Trash2,
  Eye,
  Users,
  RefreshCw,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
  Calendar,
  Tag,
  MessageSquare,
  BarChart3
} from 'lucide-react'

interface ExternalWebinar {
  id: string
  name: string
  platform: string
  externalWebinarId: string
  externalWebinarName?: string
  isActive: boolean
  syncAttendance: boolean
  sendToFacebookCAPI: boolean
  lastSyncAt?: string
  createdAt: string
  _count: {
    registrations: number
    leadPages: number
    schedules: number
  }
}

export default function ExternalWebinarsPage() {
  const [externalWebinars, setExternalWebinars] = useState<ExternalWebinar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchExternalWebinars()
  }, [])

  const fetchExternalWebinars = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/external-webinars')
      if (!response.ok) throw new Error('Failed to fetch external webinars')
      const data = await response.json()
      setExternalWebinars(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this external webinar connection? This will also delete all associated registrations.')) {
      return
    }

    try {
      const response = await fetch(`/api/external-webinars/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete')
      fetchExternalWebinars()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      const response = await fetch('/api/cron/sync-webinarjam', { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        alert(`Sync complete!\n\nNew registrations: ${data.stats.newRegistrations}\nAttendance updated: ${data.stats.attendanceUpdated}\nFacebook events: ${data.stats.facebookEventsSent}`)
        fetchExternalWebinars()
      } else {
        alert('Sync failed: ' + (data.error || 'Unknown error'))
      }
    } catch (err: any) {
      alert('Sync error: ' + err.message)
    } finally {
      setSyncing(false)
    }
  }

  const filteredWebinars = externalWebinars.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.externalWebinarName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">External Webinars</h1>
            <p className="mt-1 text-sm text-gray-500">
              Connect WebinarJam/EverWebinar and manage registrations, tags, and SMS from here
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Connect Webinar
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Search */}
        <Card>
          <CardBody>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search external webinars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </CardBody>
        </Card>

        {/* List */}
        {loading ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Loading...</p>
              </div>
            </CardBody>
          </Card>
        ) : filteredWebinars.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <ExternalLink className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No external webinars connected</h3>
                <p className="text-gray-500 mb-4">Connect your WebinarJam or EverWebinar webinars to track registrations and attendance.</p>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Connect Webinar
                </Button>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredWebinars.map((webinar) => (
              <ExternalWebinarCard
                key={webinar.id}
                webinar={webinar}
                onDelete={() => handleDelete(webinar.id)}
              />
            ))}
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <AddExternalWebinarModal
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false)
              fetchExternalWebinars()
            }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

function ExternalWebinarCard({ webinar, onDelete }: { webinar: ExternalWebinar; onDelete: () => void }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{webinar.name}</h3>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                webinar.platform === 'everwebinar' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {webinar.platform === 'everwebinar' ? 'EverWebinar' : 'WebinarJam'}
              </span>
              {webinar.isActive ? (
                <span className="flex items-center text-xs text-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" /> Active
                </span>
              ) : (
                <span className="flex items-center text-xs text-gray-500">
                  <XCircle className="w-3 h-3 mr-1" /> Inactive
                </span>
              )}
            </div>
            
            {webinar.externalWebinarName && (
              <p className="text-sm text-gray-500 mb-3">
                External Name: {webinar.externalWebinarName}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{webinar._count.registrations} registrations</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{webinar._count.leadPages} lead pages</span>
              </div>
              {webinar.sendToFacebookCAPI && (
                <div className="flex items-center gap-1 text-blue-600">
                  <BarChart3 className="w-4 h-4" />
                  <span>Facebook CAPI</span>
                </div>
              )}
              {webinar.lastSyncAt && (
                <div className="flex items-center gap-1 text-gray-400">
                  <RefreshCw className="w-4 h-4" />
                  <span>Synced {new Date(webinar.lastSyncAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/dashboard/external-webinars/${webinar.id}/registrations`}>
              <Button variant="outline" size="sm">
                <Users className="w-4 h-4" />
              </Button>
            </Link>
            <Link href={`/dashboard/external-webinars/${webinar.id}`}>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

function AddExternalWebinarModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [fetchingWebinars, setFetchingWebinars] = useState(false)
  const [availableWebinars, setAvailableWebinars] = useState<any[]>([])
  const [platform, setPlatform] = useState<'webinarjam' | 'everwebinar'>('webinarjam')
  const [formData, setFormData] = useState({
    name: '',
    externalWebinarId: '',
    sendToFacebookCAPI: true,
    registrationTag: '',
    attendedTag: '',
    mostlyAttendedTag: '',
    partlyAttendedTag: '',
    missedTag: '',
    mostlyAttendedThreshold: 70,
    autoSendPostSessionSMS: false,
    postSessionSMSBody: '',
  })

  const fetchAvailableWebinars = async () => {
    setFetchingWebinars(true)
    try {
      const response = await fetch(`/api/external-webinars/webinarjam/list?platform=${platform}`)
      const data = await response.json()
      if (data.configured) {
        setAvailableWebinars(data.webinars || [])
      } else {
        alert(data.hint || 'WebinarJam API not configured')
      }
    } catch (err) {
      console.error('Failed to fetch webinars:', err)
    } finally {
      setFetchingWebinars(false)
    }
  }

  useEffect(() => {
    fetchAvailableWebinars()
  }, [platform])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.externalWebinarId) {
      alert('Please fill in required fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/external-webinars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          platform,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create')
      }

      onSuccess()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleWebinarSelect = (webinarId: string) => {
    const selected = availableWebinars.find(w => w.id === webinarId)
    setFormData({
      ...formData,
      externalWebinarId: webinarId,
      name: selected?.name || formData.name,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Connect External Webinar</h2>
          <p className="text-sm text-gray-500 mt-1">
            Connect a WebinarJam or EverWebinar webinar to track registrations and attendance
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={platform === 'webinarjam'}
                  onChange={() => setPlatform('webinarjam')}
                  className="mr-2"
                />
                WebinarJam
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={platform === 'everwebinar'}
                  onChange={() => setPlatform('everwebinar')}
                  className="mr-2"
                />
                EverWebinar
              </label>
            </div>
          </div>

          {/* Select Webinar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Webinar from {platform === 'everwebinar' ? 'EverWebinar' : 'WebinarJam'}
            </label>
            {fetchingWebinars ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading webinars...
              </div>
            ) : availableWebinars.length > 0 ? (
              <select
                value={formData.externalWebinarId}
                onChange={(e) => handleWebinarSelect(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">-- Select a webinar --</option>
                {availableWebinars.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (ID: {w.id})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-gray-500">
                No webinars found. Make sure your WEBINARJAM_API_KEY is configured.
                <br />
                <input
                  type="text"
                  placeholder="Or enter Webinar ID manually"
                  value={formData.externalWebinarId}
                  onChange={(e) => setFormData({ ...formData, externalWebinarId: e.target.value })}
                  className="mt-2 w-full px-3 py-2 border rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Internal Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Internal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., April Launch Webinar"
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>

          {/* Facebook CAPI */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.sendToFacebookCAPI}
                onChange={(e) => setFormData({ ...formData, sendToFacebookCAPI: e.target.checked })}
              />
              <span className="text-sm font-medium text-gray-700">Send registrations to Facebook Conversion API</span>
            </label>
          </div>

          {/* Tags Section */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" /> ClickFunnels Tags
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Registration Tag</label>
                <input
                  type="text"
                  value={formData.registrationTag}
                  onChange={(e) => setFormData({ ...formData, registrationTag: e.target.value })}
                  placeholder="e.g., WJ-Registered"
                  className="w-full px-2 py-1.5 text-sm border rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Attended Tag</label>
                <input
                  type="text"
                  value={formData.attendedTag}
                  onChange={(e) => setFormData({ ...formData, attendedTag: e.target.value })}
                  placeholder="e.g., WJ-Attended"
                  className="w-full px-2 py-1.5 text-sm border rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mostly Attended Tag</label>
                <input
                  type="text"
                  value={formData.mostlyAttendedTag}
                  onChange={(e) => setFormData({ ...formData, mostlyAttendedTag: e.target.value })}
                  placeholder="e.g., WJ-MostlyAttended"
                  className="w-full px-2 py-1.5 text-sm border rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Partly Attended Tag</label>
                <input
                  type="text"
                  value={formData.partlyAttendedTag}
                  onChange={(e) => setFormData({ ...formData, partlyAttendedTag: e.target.value })}
                  placeholder="e.g., WJ-PartlyAttended"
                  className="w-full px-2 py-1.5 text-sm border rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Missed Tag</label>
                <input
                  type="text"
                  value={formData.missedTag}
                  onChange={(e) => setFormData({ ...formData, missedTag: e.target.value })}
                  placeholder="e.g., WJ-Missed"
                  className="w-full px-2 py-1.5 text-sm border rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mostly Attended Threshold (%)</label>
                <input
                  type="number"
                  value={formData.mostlyAttendedThreshold}
                  onChange={(e) => setFormData({ ...formData, mostlyAttendedThreshold: parseInt(e.target.value) || 70 })}
                  className="w-full px-2 py-1.5 text-sm border rounded"
                  min={0}
                  max={100}
                />
              </div>
            </div>
          </div>

          {/* SMS Section */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Post-Session SMS
            </h3>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={formData.autoSendPostSessionSMS}
                onChange={(e) => setFormData({ ...formData, autoSendPostSessionSMS: e.target.checked })}
              />
              <span className="text-sm text-gray-700">Send SMS after attendance is detected</span>
            </label>
            {formData.autoSendPostSessionSMS && (
              <textarea
                value={formData.postSessionSMSBody}
                onChange={(e) => setFormData({ ...formData, postSessionSMSBody: e.target.value })}
                placeholder="Thanks for attending {{name}}! Here's the replay link: ..."
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={3}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Connect Webinar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
