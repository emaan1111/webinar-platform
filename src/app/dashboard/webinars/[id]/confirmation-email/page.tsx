'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Loader2,
  AlertCircle,
  Mail,
  BarChart3,
  MousePointer,
  Smartphone,
  Monitor,
  Tablet,
  CheckCircle2,
  Copy,
  Info,
  RefreshCw,
} from 'lucide-react'

// Dynamic import for WYSIWYG editor (no SSR)
const EmailEditor = dynamic(() => import('@/components/EmailEditor'), { ssr: false })

// ─── Types ───────────────────────────────────────────────────────────────────

interface TemplateStats {
  totalSent: number
  totalOpens: number
  totalClicks: number
  uniqueOpens: number
  uniqueClicks: number
  openRate: number
  clickRate: number
}

interface Template {
  id: string
  webinarId: string
  name: string
  subject: string
  htmlBody: string
  fromName: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  stats: TemplateStats
}

interface StatsOverview {
  totalSent: number
  totalOpens: number
  totalClicks: number
  uniqueOpens: number
  uniqueClicks: number
  openRate: number
  clickRate: number
}

interface DeviceBreakdown {
  device: string
  count: number
}

interface LinkBreakdown {
  url: string
  totalClicks: number
  uniqueClicks: number
}

interface RecentSend {
  id: string
  to: string
  subject: string
  status: string
  sentAt: string
  openedAt: string | null
  clickedAt: string | null
  openCount: number
  clickCount: number
  userAgent: string | null
  template: { name: string }
}

// ─── Available Placeholders ──────────────────────────────────────────────────

const PLACEHOLDERS = [
  { tag: '{{name}}', desc: 'Attendee name' },
  { tag: '{{webinar_title}}', desc: 'Webinar title' },
  { tag: '{{webinar_time}}', desc: 'Scheduled time (local)' },
  { tag: '{{webinar_scheduled_time}}', desc: 'Scheduled time with timezone (e.g. Tuesday, April 8, 2026 at 4:00 PM EDT)' },
  { tag: '{{access_link}}', desc: 'Webinar access / Zoom link' },
  { tag: '{{countdown_link}}', desc: 'Countdown page URL' },
  { tag: '{{calendar_link}}', desc: 'Add-to-calendar URL' },
  { tag: '{{referral_link}}', desc: 'Referral URL' },
]

// ─── Default HTML template ───────────────────────────────────────────────────

const DEFAULT_HTML = `<div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 640px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 28px; margin: 0 0 16px;">You're registered!</h1>
  <p style="margin: 0 0 16px;">Hi {{name}},</p>
  <p style="margin: 0 0 16px;">Your registration for <strong>{{webinar_title}}</strong> is confirmed.</p>
  <p style="margin: 0 0 24px;"><strong>Your session time:</strong> {{webinar_time}}</p>
  <p style="margin: 0 0 16px;">
    <a href="{{access_link}}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600;">Access your webinar</a>
  </p>
  <p style="margin: 0 0 12px;">Countdown page: <a href="{{countdown_link}}">{{countdown_link}}</a></p>
  <p style="margin: 0 0 12px;">Add to calendar: <a href="{{calendar_link}}">{{calendar_link}}</a></p>
  <p style="margin: 0 0 12px;">Referral link: <a href="{{referral_link}}">{{referral_link}}</a></p>
  <p style="margin: 24px 0 0; color: #4b5563;">Keep this email for quick access before the webinar starts.</p>
</div>`

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ConfirmationEmailPage() {
  const params = useParams()
  const webinarId = params.id as string

  // Tab state
  const [activeTab, setActiveTab] = useState<'templates' | 'stats'>('templates')

  // Template list
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Editor state
  const [editing, setEditing] = useState<Template | null>(null)
  const [creating, setCreating] = useState(false)
  const [formName, setFormName] = useState('')
  const [formFromName, setFormFromName] = useState('')
  const [formSubject, setFormSubject] = useState('')
  const [formHtml, setFormHtml] = useState('')
  const [saving, setSaving] = useState(false)

  // Stats
  const [statsOverview, setStatsOverview] = useState<StatsOverview | null>(null)
  const [deviceBreakdown, setDeviceBreakdown] = useState<DeviceBreakdown[]>([])
  const [linkBreakdown, setLinkBreakdown] = useState<LinkBreakdown[]>([])
  const [recentSends, setRecentSends] = useState<RecentSend[]>([])
  const [statsLoading, setStatsLoading] = useState(false)
  const [resettingStats, setResettingStats] = useState(false)
  const [statsDateFrom, setStatsDateFrom] = useState('')
  const [statsDateTo, setStatsDateTo] = useState('')

  // Calendar invite toggle
  const [sendCalendarInvite, setSendCalendarInvite] = useState(true)
  const [calendarToggleSaving, setCalendarToggleSaving] = useState(false)

  // ── Fetch templates ──────────────────────────────────────────────────────

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/webinars/${webinarId}/confirmation-email`)
      if (!res.ok) throw new Error('Failed to fetch templates')
      const data = await res.json()
      setTemplates(data.templates || [])
      if (typeof data.sendCalendarInvite === 'boolean') {
        setSendCalendarInvite(data.sendCalendarInvite)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [webinarId])

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const queryParams = new URLSearchParams()
      if (statsDateFrom) queryParams.set('from', statsDateFrom)
      if (statsDateTo) queryParams.set('to', statsDateTo)
      const suffix = queryParams.toString() ? `?${queryParams.toString()}` : ''
      const res = await fetch(`/api/webinars/${webinarId}/confirmation-email/stats${suffix}`)
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      setStatsOverview(data.overview)
      setDeviceBreakdown(data.deviceBreakdown || [])
      setLinkBreakdown(data.linkBreakdown || [])
      setRecentSends(data.recentSends || [])
    } catch {
      // silently ignore stats errors
    } finally {
      setStatsLoading(false)
    }
  }, [statsDateFrom, statsDateTo, webinarId])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  useEffect(() => {
    if (activeTab === 'stats') fetchStats()
  }, [activeTab, fetchStats])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const toggleCalendarInvite = async () => {
    try {
      setCalendarToggleSaving(true)
      const newValue = !sendCalendarInvite
      const res = await fetch(`/api/webinars/${webinarId}/confirmation-email`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendCalendarInvite: newValue }),
      })
      if (res.ok) {
        setSendCalendarInvite(newValue)
      }
    } catch {
      // ignore
    } finally {
      setCalendarToggleSaving(false)
    }
  }

  const startCreate = () => {
    setEditing(null)
    setCreating(true)
    setFormName('Registration Confirmation')
    setFormFromName('')
    setFormSubject('Registration confirmed: {{webinar_title}}')
    setFormHtml(DEFAULT_HTML)
  }

  const startEdit = (t: Template) => {
    setCreating(false)
    setEditing(t)
    setFormName(t.name)
    setFormFromName(t.fromName || '')
    setFormSubject(t.subject)
    setFormHtml(t.htmlBody)
  }

  const cancelEdit = () => {
    setEditing(null)
    setCreating(false)
  }

  const handleSave = async () => {
    if (!formSubject.trim() || !formHtml.trim()) return
    setSaving(true)
    try {
      if (creating) {
        const res = await fetch(`/api/webinars/${webinarId}/confirmation-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formName, fromName: formFromName || null, subject: formSubject, htmlBody: formHtml }),
        })
        if (!res.ok) throw new Error('Create failed')
      } else if (editing) {
        const res = await fetch(`/api/webinars/${webinarId}/confirmation-email/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formName, fromName: formFromName || null, subject: formSubject, htmlBody: formHtml }),
        })
        if (!res.ok) throw new Error('Update failed')
      }
      cancelEdit()
      await fetchTemplates()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (t: Template) => {
    try {
      const res = await fetch(`/api/webinars/${webinarId}/confirmation-email/${t.id}`, {
        method: 'PATCH',
      })
      if (!res.ok) throw new Error('Toggle failed')
      await fetchTemplates()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteTemplate = async (t: Template) => {
    if (!confirm(`Delete "${t.name}"? This also deletes send history.`)) return
    try {
      const res = await fetch(`/api/webinars/${webinarId}/confirmation-email/${t.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed')
      if (editing?.id === t.id) cancelEdit()
      await fetchTemplates()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const insertPlaceholder = (tag: string) => {
    const editorInsert = (window as any).__emailEditorInsert
    if (editorInsert) {
      editorInsert(tag)
    } else {
      setFormHtml((prev) => prev + tag)
    }
  }

  const handleResetStats = async () => {
    if (!confirm('Reset confirmation email tracking stats for this webinar? This will clear opens, clicks, and tracking events, but keep the send history.')) {
      return
    }

    setResettingStats(true)
    try {
      const res = await fetch(`/api/webinars/${webinarId}/confirmation-email/reset-stats`, {
        method: 'POST',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to reset stats')
      alert('Confirmation email stats have been reset')
      await Promise.all([fetchStats(), fetchTemplates()])
    } catch (err: any) {
      setError(err.message || 'Failed to reset stats')
    } finally {
      setResettingStats(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const deviceIcon = (d: string) => {
    if (d === 'mobile') return <Smartphone className="w-4 h-4" />
    if (d === 'tablet') return <Tablet className="w-4 h-4" />
    return <Monitor className="w-4 h-4" />
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/webinars/${webinarId}`}>
              <Button variant="secondary" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Confirmation Email</h1>
              <p className="text-sm text-gray-500">
                Manage registration confirmation emails &amp; tracking
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {activeTab === 'stats' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetStats}
                disabled={resettingStats}
                className="text-orange-700 border-orange-200 hover:bg-orange-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${resettingStats ? 'animate-spin' : ''}`} />
                {resettingStats ? 'Resetting...' : 'Reset Stats'}
              </Button>
            )}
            {!creating && !editing && activeTab === 'templates' && (
              <Button size="sm" onClick={startCreate}>
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'templates'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Mail className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            Templates
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'stats'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            Stats
          </button>
        </div>

        {/* ─── Templates Tab ────────────────────────────────────────────────── */}
        {activeTab === 'templates' && (
          <>
            {/* Calendar Invite Toggle */}
            <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg">📅</span>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Send Calendar Invite</h3>
                  <p className="text-xs text-gray-500">
                    Send a separate email with a .ics calendar file after registration
                  </p>
                </div>
              </div>
              <button
                onClick={toggleCalendarInvite}
                disabled={calendarToggleSaving}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  sendCalendarInvite ? 'bg-blue-600' : 'bg-gray-200'
                } ${calendarToggleSaving ? 'opacity-50' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    sendCalendarInvite ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Editor */}
            {(creating || editing) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <h2 className="text-lg font-semibold">
                      {creating ? 'New Template' : `Edit: ${editing!.name}`}
                    </h2>
                    <button onClick={cancelEdit}>
                      <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Template Name
                      </label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g. Registration Confirmation"
                      />
                    </div>
                    {/* From Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        From Name <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formFromName}
                        onChange={(e) => setFormFromName(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g. Ustadha Ariba Farheen (defaults to env var)"
                      />
                    </div>
                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject Line
                      </label>
                      <input
                        type="text"
                        value={formSubject}
                        onChange={(e) => setFormSubject(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Registration confirmed: {{webinar_title}}"
                      />
                    </div>
                    {/* Placeholders */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Insert Placeholder
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {PLACEHOLDERS.map((p) => (
                          <button
                            key={p.tag}
                            type="button"
                            onClick={() => insertPlaceholder(p.tag)}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
                            title={p.desc}
                          >
                            <Copy className="w-3 h-3" />
                            {p.tag}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* WYSIWYG Email Body */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Body
                      </label>
                      <div className="border border-gray-300 rounded-lg overflow-hidden [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-300 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[300px] [&_.ql-editor]:text-sm">
                        <EmailEditor
                          value={formHtml}
                          onChange={setFormHtml}
                          placeholder="Compose your confirmation email..."
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Use the image button in the toolbar to insert images by URL.</p>
                    </div>
                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="secondary" size="sm" onClick={cancelEdit}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving || !formSubject.trim() || !formHtml.trim()}
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        {creating ? 'Create' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Template List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : templates.length === 0 && !creating ? (
              <Card>
                <CardBody>
                  <div className="text-center py-12">
                    <Mail className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Confirmation Email Templates
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                      A built-in fallback is used until you create a custom template. Create one to
                      customize the email and enable tracking.
                    </p>
                    <Button size="sm" onClick={startCreate}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Template
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ) : (
              <div className="space-y-3">
                {templates.map((t) => (
                  <Card key={t.id}>
                    <CardBody>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {t.name}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                t.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {t.isActive ? 'Active' : 'Disabled'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate mb-2">
                            Subject: {t.subject}
                          </p>
                          {/* Inline stats */}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5" />
                              {t.stats.totalSent} sent
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              {t.stats.openRate}% opened
                            </span>
                            <span className="flex items-center gap-1">
                              <MousePointer className="w-3.5 h-3.5" />
                              {t.stats.clickRate}% clicked
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => toggleActive(t)}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            title={t.isActive ? 'Disable' : 'Enable'}
                          >
                            {t.isActive ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => startEdit(t)}
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTemplate(t)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}

            {/* Info note */}
            <div className="flex items-start gap-2 p-3 text-xs text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>How it works:</strong> The most recently created <em>active</em> template is
                used for new registrations. If none are active, a built-in fallback is sent. Open
                tracking (1×1 pixel) and click tracking (link redirect) are injected automatically.
                Placeholders like <code className="px-1 py-0.5 bg-gray-200 rounded">{'{{name}}'}</code>{' '}
                are replaced with real values at send time.
              </div>
            </div>
          </>
        )}

        {/* ─── Stats Tab ────────────────────────────────────────────────────── */}
        {activeTab === 'stats' && (
          <>
            {statsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : !statsOverview || statsOverview.totalSent === 0 ? (
              <Card>
                <CardBody>
                  <div className="flex flex-col gap-3 pb-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Date Range</h3>
                      <p className="text-xs text-gray-500">Filter email stats by sent date.</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        type="date"
                        value={statsDateFrom}
                        onChange={(e) => setStatsDateFrom(e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                      <span className="text-sm text-gray-500">to</span>
                      <input
                        type="date"
                        value={statsDateTo}
                        onChange={(e) => setStatsDateTo(e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                      {(statsDateFrom || statsDateTo) && (
                        <Button variant="secondary" size="sm" onClick={() => { setStatsDateFrom(''); setStatsDateTo('') }}>
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Yet</h3>
                    <p className="text-sm text-gray-500">
                      Stats will appear here after confirmation emails are sent to registrants.
                    </p>
                  </div>
                </CardBody>
              </Card>
            ) : (
              <>
                <Card>
                  <CardBody>
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Date Range</h3>
                        <p className="text-xs text-gray-500">Filter email stats by sent date.</p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          type="date"
                          value={statsDateFrom}
                          onChange={(e) => setStatsDateFrom(e.target.value)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                        <span className="text-sm text-gray-500">to</span>
                        <input
                          type="date"
                          value={statsDateTo}
                          onChange={(e) => setStatsDateTo(e.target.value)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                        {(statsDateFrom || statsDateTo) && (
                          <Button variant="secondary" size="sm" onClick={() => { setStatsDateFrom(''); setStatsDateTo('') }}>
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Overview cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardBody>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Total Sent</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {statsOverview.totalSent}
                      </p>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Open Rate</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {statsOverview.openRate}%
                      </p>
                      <p className="text-xs text-gray-400">
                        {statsOverview.uniqueOpens} / {statsOverview.totalSent}
                      </p>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Click Rate</p>
                      <p className="text-2xl font-bold text-blue-600 mt-1">
                        {statsOverview.clickRate}%
                      </p>
                      <p className="text-xs text-gray-400">
                        {statsOverview.uniqueClicks} / {statsOverview.totalSent}
                      </p>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Total Interactions
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {statsOverview.totalOpens + statsOverview.totalClicks}
                      </p>
                      <p className="text-xs text-gray-400">
                        {statsOverview.totalOpens} opens · {statsOverview.totalClicks} clicks
                      </p>
                    </CardBody>
                  </Card>
                </div>

                {/* Device breakdown */}
                {deviceBreakdown.length > 0 && (
                  <Card>
                    <CardHeader>
                      <h2 className="text-sm font-semibold text-gray-900">
                        Device Breakdown
                      </h2>
                    </CardHeader>
                    <CardBody>
                      <div className="flex flex-wrap gap-6">
                        {deviceBreakdown.map((d) => {
                          const total = deviceBreakdown.reduce((s, x) => s + x.count, 0)
                          const pct = total > 0 ? Math.round((d.count / total) * 100) : 0
                          return (
                            <div key={d.device} className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gray-100">
                                {deviceIcon(d.device)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 capitalize">
                                  {d.device}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {d.count} events · {pct}%
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardBody>
                  </Card>
                )}

                {/* Per-Link Click Breakdown */}
                {linkBreakdown.length > 0 && (
                  <Card>
                    <CardHeader>
                      <h2 className="text-sm font-semibold text-gray-900">
                        Link Performance
                      </h2>
                    </CardHeader>
                    <CardBody>
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Link URL
                              </th>
                              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Unique Clicks
                              </th>
                              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Total Clicks
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {linkBreakdown.map((link, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="py-2 px-3 text-gray-900">
                                  <a 
                                    href={link.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline truncate block max-w-[400px]"
                                    title={link.url}
                                  >
                                    {link.url.length > 60 ? link.url.slice(0, 60) + '...' : link.url}
                                  </a>
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <span className="text-blue-600 font-medium">
                                    {link.uniqueClicks}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right text-gray-600">
                                  {link.totalClicks}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardBody>
                  </Card>
                )}

                {/* Recent sends table */}
                <Card>
                  <CardHeader>
                    <h2 className="text-sm font-semibold text-gray-900">
                      Recent Sends ({recentSends.length})
                    </h2>
                  </CardHeader>
                  <CardBody>
                    {recentSends.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4 text-center">No sends yet</p>
                    ) : (
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Recipient
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Status
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Opened
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Clicked
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Sent At
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {recentSends.map((s) => (
                              <tr key={s.id} className="hover:bg-gray-50">
                                <td className="py-2 px-3 text-gray-900 truncate max-w-[200px]">
                                  {s.to}
                                </td>
                                <td className="py-2 px-3">
                                  <span
                                    className={`inline-flex items-center gap-1 text-xs font-medium ${
                                      s.status === 'SENT'
                                        ? 'text-green-700'
                                        : 'text-red-700'
                                    }`}
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    {s.status}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-gray-600">
                                  {s.openCount > 0 ? (
                                    <span className="text-green-600 font-medium">
                                      {s.openCount}×
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">–</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-gray-600">
                                  {s.clickCount > 0 ? (
                                    <span className="text-blue-600 font-medium">
                                      {s.clickCount}×
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">–</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-gray-500 whitespace-nowrap">
                                  {new Date(s.sentAt).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
