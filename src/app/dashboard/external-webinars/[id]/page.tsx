'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import {
  ArrowLeft,
  Save,
  Loader2,
  Tag,
  MessageSquare,
  Settings,
  Users,
  RefreshCw,
  BarChart3,
  Calendar,
  Trash2,
  Code,
  Copy,
  Check
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
  registrationTag?: string
  attendedTag?: string
  mostlyAttendedTag?: string
  partlyAttendedTag?: string
  missedTag?: string
  mostlyAttendedThreshold: number
  autoSendPostSessionSMS: boolean
  postSessionSMSBody?: string
  lastSyncAt?: string
  createdAt: string
  _count: {
    registrations: number
    leadPages: number
    schedules: number
  }
}

export default function ExternalWebinarDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [webinar, setWebinar] = useState<ExternalWebinar | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copiedEmbed, setCopiedEmbed] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    isActive: true,
    syncAttendance: true,
    sendToFacebookCAPI: true,
    crmIntegration: 'CLICKFUNNELS' as 'CLICKFUNNELS' | 'MAUTIC' | 'NONE',
    registrationTag: '',
    attendedTag: '',
    mostlyAttendedTag: '',
    partlyAttendedTag: '',
    missedTag: '',
    mostlyAttendedThreshold: 70,
    attendanceTagDelayHours: 24,
    webinarDurationMinutes: 60,
    autoSendPostSessionSMS: false,
    postSessionSMSBody: '',
  })

  useEffect(() => {
    fetchWebinar()
  }, [id])

  const fetchWebinar = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/external-webinars/${id}`)
      if (!response.ok) throw new Error('Failed to fetch webinar')
      const data = await response.json()
      setWebinar(data)
      setFormData({
        name: data.name || '',
        isActive: data.isActive ?? true,
        syncAttendance: data.syncAttendance ?? true,
        sendToFacebookCAPI: data.sendToFacebookCAPI ?? true,
        crmIntegration: data.crmIntegration || 'CLICKFUNNELS',
        registrationTag: data.registrationTag || '',
        attendedTag: data.attendedTag || '',
        mostlyAttendedTag: data.mostlyAttendedTag || '',
        partlyAttendedTag: data.partlyAttendedTag || '',
        missedTag: data.missedTag || '',
        mostlyAttendedThreshold: data.mostlyAttendedThreshold ?? 70,
        attendanceTagDelayHours: data.attendanceTagDelayHours ?? 24,
        webinarDurationMinutes: data.webinarDurationMinutes ?? 60,
        autoSendPostSessionSMS: data.autoSendPostSessionSMS ?? false,
        postSessionSMSBody: data.postSessionSMSBody || '',
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/external-webinars/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save')
      }

      alert('Saved successfully!')
      fetchWebinar()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this external webinar? This will also delete all registrations.')) {
      return
    }

    try {
      const response = await fetch(`/api/external-webinars/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete')
      router.push('/dashboard/external-webinars')
    } catch (err: any) {
      alert('Error: ' + err.message)
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/external-webinars">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{webinar.name}</h1>
              <p className="text-sm text-gray-500">
                {webinar.platform === 'everwebinar' ? 'EverWebinar' : 'WebinarJam'} • ID: {webinar.externalWebinarId}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/external-webinars/${id}/registrations`}>
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Registrations ({webinar._count.registrations})
              </Button>
            </Link>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{webinar._count.registrations}</p>
                  <p className="text-sm text-gray-500">Registrations</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{webinar._count.schedules}</p>
                  <p className="text-sm text-gray-500">Schedules</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{webinar._count.leadPages}</p>
                  <p className="text-sm text-gray-500">Lead Pages</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {webinar.lastSyncAt ? new Date(webinar.lastSyncAt).toLocaleString() : 'Never'}
                  </p>
                  <p className="text-sm text-gray-500">Last Sync</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Settings */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5" /> General Settings
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Internal Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span className="text-sm">Active (sync registrations)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.syncAttendance}
                  onChange={(e) => setFormData({ ...formData, syncAttendance: e.target.checked })}
                />
                <span className="text-sm">Sync Attendance Data</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.sendToFacebookCAPI}
                  onChange={(e) => setFormData({ ...formData, sendToFacebookCAPI: e.target.checked })}
                />
                <span className="text-sm">Send to Facebook CAPI</span>
              </label>
            </div>
          </CardBody>
        </Card>

        {/* CRM Integration Selection */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">CRM Integration</h2>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-500 mb-4">Choose which CRM to sync contacts and apply tags for this webinar.</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="crmIntegration"
                  value="CLICKFUNNELS"
                  checked={formData.crmIntegration === 'CLICKFUNNELS'}
                  onChange={(e) => setFormData({ ...formData, crmIntegration: e.target.value as 'CLICKFUNNELS' | 'MAUTIC' | 'NONE' })}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">ClickFunnels</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="crmIntegration"
                  value="MAUTIC"
                  checked={formData.crmIntegration === 'MAUTIC'}
                  onChange={(e) => setFormData({ ...formData, crmIntegration: e.target.value as 'CLICKFUNNELS' | 'MAUTIC' | 'NONE' })}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Mautic</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="crmIntegration"
                  value="NONE"
                  checked={formData.crmIntegration === 'NONE'}
                  onChange={(e) => setFormData({ ...formData, crmIntegration: e.target.value as 'CLICKFUNNELS' | 'MAUTIC' | 'NONE' })}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">None</span>
              </label>
            </div>
          </CardBody>
        </Card>

        {/* Tags */}
        {formData.crmIntegration !== 'NONE' && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Tag className="w-5 h-5" /> {formData.crmIntegration === 'MAUTIC' ? 'Mautic' : 'ClickFunnels'} Tags
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Tag</label>
                <input
                  type="text"
                  value={formData.registrationTag}
                  onChange={(e) => setFormData({ ...formData, registrationTag: e.target.value })}
                  placeholder="e.g., WJ-Registered"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attended Tag</label>
                <input
                  type="text"
                  value={formData.attendedTag}
                  onChange={(e) => setFormData({ ...formData, attendedTag: e.target.value })}
                  placeholder="e.g., WJ-Attended"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mostly Attended Tag</label>
                <input
                  type="text"
                  value={formData.mostlyAttendedTag}
                  onChange={(e) => setFormData({ ...formData, mostlyAttendedTag: e.target.value })}
                  placeholder="e.g., WJ-MostlyAttended"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partly Attended Tag</label>
                <input
                  type="text"
                  value={formData.partlyAttendedTag}
                  onChange={(e) => setFormData({ ...formData, partlyAttendedTag: e.target.value })}
                  placeholder="e.g., WJ-PartlyAttended"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Missed Tag</label>
                <input
                  type="text"
                  value={formData.missedTag}
                  onChange={(e) => setFormData({ ...formData, missedTag: e.target.value })}
                  placeholder="e.g., WJ-Missed"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mostly Attended Threshold (%)</label>
                <input
                  type="number"
                  value={formData.mostlyAttendedThreshold}
                  onChange={(e) => setFormData({ ...formData, mostlyAttendedThreshold: parseInt(e.target.value) || 70 })}
                  className="w-full px-3 py-2 border rounded-lg"
                  min={0}
                  max={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Contacts who watched more than this percentage get the "Mostly Attended" tag
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Webinar Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.webinarDurationMinutes}
                  onChange={(e) => setFormData({ ...formData, webinarDurationMinutes: parseInt(e.target.value) || 60 })}
                  className="w-full px-3 py-2 border rounded-lg"
                  min={1}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used to calculate attendance percentage
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tag Delay (hours after registration)</label>
                <input
                  type="number"
                  value={formData.attendanceTagDelayHours}
                  onChange={(e) => setFormData({ ...formData, attendanceTagDelayHours: parseInt(e.target.value) || 24 })}
                  className="w-full px-3 py-2 border rounded-lg"
                  min={0}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Wait this many hours before applying attendance tags (ensures final watch time)
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        )}

        {/* SMS */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Post-Session SMS
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.autoSendPostSessionSMS}
                onChange={(e) => setFormData({ ...formData, autoSendPostSessionSMS: e.target.checked })}
              />
              <span className="text-sm font-medium">Send SMS after attendance is detected</span>
            </label>

            {formData.autoSendPostSessionSMS && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SMS Message</label>
                <textarea
                  value={formData.postSessionSMSBody}
                  onChange={(e) => setFormData({ ...formData, postSessionSMSBody: e.target.value })}
                  placeholder="Thanks for attending {{name}}! Here's the replay link: ..."
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available variables: {'{{name}}'}, {'{{email}}'}, {'{{phone}}'}
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Embed Code */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Code className="w-5 h-5" /> Embed Registration Form
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-sm text-gray-600">
              Add this registration form to any external page (ClickFunnels, WordPress, etc.). 
              The form automatically detects the visitor's timezone and shows available sessions in their local time.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Inline Form (shows directly in page)</label>
              <div className="relative">
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap break-all">
{`<div id="webinar-registration" 
     data-webinar-id="${id}"
     data-api-base="${typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com'}">
</div>
<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com'}/embed/webinar-registration.js"></script>`}
                </pre>
                <button
                  onClick={() => {
                    const code = `<div id="webinar-registration" 
     data-webinar-id="${id}"
     data-api-base="${window.location.origin}">
</div>
<script src="${window.location.origin}/embed/webinar-registration.js"></script>`;
                    navigator.clipboard.writeText(code);
                    setCopiedEmbed(true);
                    setTimeout(() => setCopiedEmbed(false), 2000);
                  }}
                  className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
                  title="Copy to clipboard"
                >
                  {copiedEmbed ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Popup Modal (with backdrop overlay)</label>
              <div className="relative">
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap break-all">
{`<div id="webinar-registration" 
     data-webinar-id="${id}"
     data-api-base="${typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com'}"
     data-popup="true">
</div>
<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com'}/embed/webinar-registration.js"></script>`}
                </pre>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Available Options</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li><code className="bg-blue-100 px-1 rounded">data-button-text="Reserve My Spot"</code> - Custom button text</li>
                <li><code className="bg-blue-100 px-1 rounded">data-show-phone="false"</code> - Hide phone field</li>
                <li><code className="bg-blue-100 px-1 rounded">data-redirect-url="https://..."</code> - Redirect after registration</li>
                <li><code className="bg-blue-100 px-1 rounded">data-lead-page-id="..."</code> - Track which lead page converted</li>
              </ul>
            </div>
          </CardBody>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
          </CardHeader>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete this external webinar connection</p>
                <p className="text-sm text-gray-500">
                  This will permanently delete all {webinar._count.registrations} registrations associated with this webinar.
                </p>
              </div>
              <Button variant="outline" onClick={handleDelete} className="text-red-600 border-red-300 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  )
}
