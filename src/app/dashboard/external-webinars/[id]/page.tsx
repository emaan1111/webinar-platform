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
  Check,
  Mail,
  Bell,
  Send,
  ClipboardCopy,
  ChevronDown
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
  // Combined seamless picker
  combineScheduleSources?: boolean
  liveZoomEnabled?: boolean
  liveZoomLink?: string
  liveZoomAt?: string
  liveZoomTimezone?: string
  showJustInTime?: boolean
  jitLeadMinutes?: number
  recurringSlotsToShow?: number | null
  lastSyncAt?: string
  createdAt: string
  _count: {
    registrations: number
    leadPages: number
    schedules: number
  }
}

// Stored UTC ISO -> "YYYY-MM-DDTHH:mm" for <input type="datetime-local"> in the host's local tz.
function isoToDatetimeLocal(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// datetime-local value (host's local tz) -> UTC ISO string for storage.
function datetimeLocalToIso(value?: string): string | null {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d.toISOString()
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
  const [copiedPopup, setCopiedPopup] = useState(false)

  // Copy emails from internal webinar
  const [internalWebinars, setInternalWebinars] = useState<{ id: string; title: string }[]>([])
  const [showCopyPanel, setShowCopyPanel] = useState(false)
  const [selectedSourceId, setSelectedSourceId] = useState('')
  const [copyTypes, setCopyTypes] = useState<string[]>(['confirmation', 'reminder', 'followup'])
  const [copying, setCopying] = useState(false)
  const [copyResult, setCopyResult] = useState('')

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
    // Combined seamless picker
    combineScheduleSources: false,
    liveZoomEnabled: false,
    liveZoomLink: '',
    liveZoomAt: '', // datetime-local string in host's local timezone
    showJustInTime: false,
    jitLeadMinutes: 15,
    recurringSlotsToShow: '' as number | '' | string,
  })

  useEffect(() => {
    fetchWebinar()
    fetchInternalWebinars()
  }, [id])

  const fetchInternalWebinars = async () => {
    try {
      const res = await fetch('/api/webinars')
      if (!res.ok) return
      const data = await res.json()
      setInternalWebinars((data.webinars || []).map((w: any) => ({ id: w.id, title: w.title })))
    } catch {}
  }

  const handleCopyEmails = async () => {
    if (!selectedSourceId) return
    setCopying(true)
    setCopyResult('')
    try {
      const res = await fetch(`/api/external-webinars/${id}/copy-emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceWebinarId: selectedSourceId, types: copyTypes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Copy failed')
      setCopyResult(data.message)
      setShowCopyPanel(false)
      setSelectedSourceId('')
    } catch (err: any) {
      setCopyResult(`Error: ${err.message}`)
    } finally {
      setCopying(false)
    }
  }

  const toggleCopyType = (type: string) => {
    setCopyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

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
        combineScheduleSources: data.combineScheduleSources ?? false,
        liveZoomEnabled: data.liveZoomEnabled ?? false,
        liveZoomLink: data.liveZoomLink || '',
        liveZoomAt: isoToDatetimeLocal(data.liveZoomAt),
        showJustInTime: data.showJustInTime ?? false,
        jitLeadMinutes: data.jitLeadMinutes ?? 15,
        recurringSlotsToShow: data.recurringSlotsToShow ?? '',
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
      const payload = {
        ...formData,
        liveZoomAt: datetimeLocalToIso(formData.liveZoomAt),
        liveZoomTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        recurringSlotsToShow:
          formData.recurringSlotsToShow === '' || formData.recurringSlotsToShow == null
            ? null
            : Number(formData.recurringSlotsToShow),
      }
      const response = await fetch(`/api/external-webinars/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://emaanpowerclasses.com'

  // Full inline popup snippet (iframe modal) — paste into ClickFunnels/WordPress/etc.
  const popupSnippet = `<!-- Webinar Registration Modal (Popup) -->
<script>
(function() {
  function openWebinarModal() {
    var overlay = document.createElement('div');
    overlay.id = 'webinar-modal-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn 0.2s ease-out;';
    var container = document.createElement('div');
    container.style.cssText = 'width:100%;max-width:600px;max-height:95vh;background:transparent;border-radius:16px;overflow:hidden;animation:slideUp 0.3s ease-out;';
    var iframe = document.createElement('iframe');
    iframe.src = '${appOrigin}/embed-modal-external/${id}';
    iframe.style.cssText = 'width:100%;height:95vh;max-height:700px;border:none;background:transparent;display:block;';
    iframe.setAttribute('allow', 'clipboard-write');
    overlay.onclick = function(e) {
      if (e.target === overlay) {
        overlay.style.animation = 'fadeOut 0.2s ease-out';
        setTimeout(function() { overlay.remove(); }, 200);
      }
    };
    window.addEventListener('message', function(e) {
      if (e.data === 'closeWebinarModal') {
        overlay.style.animation = 'fadeOut 0.2s ease-out';
        setTimeout(function() { overlay.remove(); }, 200);
      }
    });
    if (!document.getElementById('webinar-modal-styles')) {
      var style = document.createElement('style');
      style.id = 'webinar-modal-styles';
      style.textContent = '@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } } @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }';
      document.head.appendChild(style);
    }
    container.appendChild(iframe);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
  }
  window.openWebinarModal = openWebinarModal;
})();
</script>

<!-- Use this button anywhere on your page -->
<button
  onclick="openWebinarModal()"
  style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 14px 32px; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 16px; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4); transition: all 0.2s;"
  onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 20px rgba(139, 92, 246, 0.5)';"
  onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 14px rgba(139, 92, 246, 0.4)';">
  Register for Webinar
</button>`

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

        {/* Email Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Mail className="w-5 h-5" /> Email Management
              </h2>
              <button
                onClick={() => setShowCopyPanel(!showCopyPanel)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <ClipboardCopy className="w-4 h-4" />
                Copy from Webinar
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCopyPanel ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </CardHeader>
          <CardBody>
            {showCopyPanel && (
              <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
                <p className="text-sm font-medium text-purple-900">Copy email templates from an internal webinar</p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Source Webinar</label>
                  <select
                    value={selectedSourceId}
                    onChange={(e) => setSelectedSourceId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select a webinar...</option>
                    {internalWebinars.map((w) => (
                      <option key={w.id} value={w.id}>{w.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Template Types</label>
                  <div className="flex gap-3">
                    {[
                      { key: 'confirmation', label: 'Confirmation' },
                      { key: 'reminder', label: 'Reminders' },
                      { key: 'followup', label: 'Follow-Ups' },
                    ].map((t) => (
                      <label key={t.key} className="flex items-center gap-1.5 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={copyTypes.includes(t.key)}
                          onChange={() => toggleCopyType(t.key)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        {t.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyEmails}
                    disabled={copying || !selectedSourceId || copyTypes.length === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {copying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCopy className="w-4 h-4" />}
                    {copying ? 'Copying...' : 'Copy Templates'}
                  </button>
                  <button
                    onClick={() => { setShowCopyPanel(false); setCopyResult('') }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {copyResult && (
              <div className={`mb-4 p-3 text-sm rounded-lg border ${
                copyResult.startsWith('Error') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
              }`}>
                {copyResult}
                <button onClick={() => setCopyResult('')} className="ml-2 font-medium underline">Dismiss</button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href={`/dashboard/external-webinars/${id}/confirmation-email`}>
                <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Confirmation Email</p>
                    <p className="text-xs text-gray-500">Sent on registration</p>
                  </div>
                </div>
              </Link>
              <Link href={`/dashboard/external-webinars/${id}/reminder-emails`}>
                <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-colors cursor-pointer">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Bell className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Reminder Emails</p>
                    <p className="text-xs text-gray-500">Before webinar starts</p>
                  </div>
                </div>
              </Link>
              <Link href={`/dashboard/external-webinars/${id}/followup-emails`}>
                <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors cursor-pointer">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Send className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Follow-Up Emails</p>
                    <p className="text-xs text-gray-500">After webinar ends</p>
                  </div>
                </div>
              </Link>
            </div>
          </CardBody>
        </Card>

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

        {/* Session Times / Combined Seamless Picker */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Session Times
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={formData.combineScheduleSources}
                onChange={(e) => setFormData({ ...formData, combineScheduleSources: e.target.checked })}
                className="mt-1"
              />
              <span className="text-sm">
                <span className="font-medium">Combine session times into one seamless picker</span>
                <span className="block text-gray-500">
                  Mix a live Zoom session, a "starting soon" time, and your recurring EverWebinar
                  times into one list. Registrants just pick a time — they can&apos;t tell which is
                  live and which is evergreen. All times show in the visitor&apos;s local timezone.
                </span>
              </span>
            </label>

            {formData.combineScheduleSources && (
              <div className="space-y-6 pl-6 border-l-2 border-gray-100">
                {/* Live Zoom session */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.liveZoomEnabled}
                      onChange={(e) => setFormData({ ...formData, liveZoomEnabled: e.target.checked })}
                    />
                    <span className="text-sm font-medium">Include a live Zoom session</span>
                  </label>
                  {formData.liveZoomEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date &amp; Time (your timezone)</label>
                        <input
                          type="datetime-local"
                          value={formData.liveZoomAt}
                          onChange={(e) => setFormData({ ...formData, liveZoomAt: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Tip: use a clean time (e.g. :00 or :30) so it blends in with the other options.
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Zoom Join Link</label>
                        <input
                          type="url"
                          value={formData.liveZoomLink}
                          onChange={(e) => setFormData({ ...formData, liveZoomLink: e.target.value })}
                          placeholder="https://zoom.us/j/..."
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Just-in-time "starting soon" option */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.showJustInTime}
                      onChange={(e) => setFormData({ ...formData, showJustInTime: e.target.checked })}
                    />
                    <span className="text-sm font-medium">Include a &quot;starting soon&quot; just-in-time option</span>
                  </label>
                  {formData.showJustInTime && (
                    <div className="max-w-xs">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Starts how many minutes from now</label>
                      <input
                        type="number"
                        min={1}
                        value={formData.jitLeadMinutes}
                        onChange={(e) => setFormData({ ...formData, jitLeadMinutes: parseInt(e.target.value) || 15 })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">Registers into EverWebinar&apos;s just-in-time session.</p>
                    </div>
                  )}
                </div>

                {/* Recurring EverWebinar sessions */}
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recurring EverWebinar times to show</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.recurringSlotsToShow as number | ''}
                    onChange={(e) => setFormData({ ...formData, recurringSlotsToShow: e.target.value })}
                    placeholder="All upcoming"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    e.g. set to 1 to show just the next session (like a daily 11 AM). Leave blank for all upcoming.
                  </p>
                </div>
              </div>
            )}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Popup Modal (iframe — recommended)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Full inline snippet: a button that opens the registration in a centered popup.
                Shows the combined live-Zoom + just-in-time + recurring times in the visitor&apos;s timezone.
              </p>
              <div className="relative">
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-all max-h-72">
{popupSnippet}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(popupSnippet)
                    setCopiedPopup(true)
                    setTimeout(() => setCopiedPopup(false), 2000)
                  }}
                  className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
                  title="Copy to clipboard"
                >
                  {copiedPopup ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
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
