'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import {
  ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, Save, X, Loader2,
  AlertCircle, Mail, BarChart3, MousePointer, Smartphone, Monitor,
  Tablet, Clock, Copy, Info, Settings2, Send, Ban, FlaskConical,
  SkipForward, RefreshCw, Download, ExternalLink, Link2,
} from 'lucide-react'
import {
  REMINDER_PLACEHOLDERS, REMINDER_PRESETS,
  minutesToBeforeLabel,
} from '@/lib/emailTracking'

const EmailEditor = dynamic(() => import('@/components/EmailEditor'), { ssr: false })

// ─── Types ───────────────────────────────────────────────────────────────────

interface TemplateStats {
  totalSent: number; totalOpens: number; totalClicks: number
  uniqueOpens: number; uniqueClicks: number; openRate: number; clickRate: number
}

interface Template {
  id: string; webinarId: string; name: string; subject: string
  htmlBody: string; fromName: string | null; minutesBefore: number
  isActive: boolean; createdAt: string; updatedAt: string; stats: TemplateStats
}

interface PerTemplateStats {
  templateId: string; name: string; minutesBefore: number
  totalSent: number; uniqueOpens: number; uniqueClicks: number
  openRate: number; clickRate: number
}

// ─── Default HTML ────────────────────────────────────────────────────────────

const DEFAULT_HTML = `<div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 640px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 24px; margin: 0 0 16px;">Reminder: Your webinar is coming up!</h1>
  <p style="margin: 0 0 16px;">Hi {{name}},</p>
  <p style="margin: 0 0 16px;">Just a quick reminder that <strong>{{webinar_title}}</strong> starts soon.</p>
  <p style="margin: 0 0 24px;"><strong>Scheduled time:</strong> {{webinar_time}}</p>
  <p style="margin: 0 0 16px;">
    <a href="{{access_link}}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600;">Join Now</a>
  </p>
  <p style="margin: 0 0 12px;">Countdown page: <a href="{{countdown_link}}">{{countdown_link}}</a></p>
  <p style="margin: 24px 0 0; color: #4b5563;">See you there!</p>
</div>`

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ReminderEmailsPage() {
  const params = useParams()
  const webinarId = params.id as string

  const [activeTab, setActiveTab] = useState<'templates' | 'stats' | 'settings'>('templates')
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Editor
  const [editing, setEditing] = useState<Template | null>(null)
  const [creating, setCreating] = useState(false)
  const [formName, setFormName] = useState('')
  const [formFromName, setFormFromName] = useState('')
  const [formSubject, setFormSubject] = useState('')
  const [formHtml, setFormHtml] = useState('')
  const [formMinutesBefore, setFormMinutesBefore] = useState(60)
  const [saving, setSaving] = useState(false)

  // A/B Testing
  const [formSubjectB, setFormSubjectB] = useState('')
  // Smart Skip
  const [formSkipIfJoined, setFormSkipIfJoined] = useState(true)
  // Auto-resend non-openers
  const [formResendToNonOpeners, setFormResendToNonOpeners] = useState(false)
  const [formResendAfterHours, setFormResendAfterHours] = useState('4')
  const [formResendSubject, setFormResendSubject] = useState('')

  // Preview modal
  const [previewHtml, setPreviewHtml] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  // Clone dialog
  const [showCloneDialog, setShowCloneDialog] = useState(false)
  const [cloneSourceId, setCloneSourceId] = useState('')
  const [cloning, setCloning] = useState(false)
  const [allWebinars, setAllWebinars] = useState<{ id: string; title: string }[]>([])

  // Settings
  const [reminderEmailSource, setReminderEmailSource] = useState('internal')
  const [savingSettings, setSavingSettings] = useState(false)

  // Stats
  const [statsOverview, setStatsOverview] = useState<any>(null)
  const [perTemplateStats, setPerTemplateStats] = useState<PerTemplateStats[]>([])
  const [recentSends, setRecentSends] = useState<any[]>([])
  const [statsLoading, setStatsLoading] = useState(false)

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/webinars/${webinarId}/reminder-emails`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setTemplates(data.templates || [])
      setReminderEmailSource(data.reminderEmailSource || 'internal')
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }, [webinarId])

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const res = await fetch(`/api/webinars/${webinarId}/reminder-emails/stats`)
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      setStatsOverview({ ...data.overview, abBreakdown: data.abBreakdown, linkBreakdown: data.linkBreakdown })
      setPerTemplateStats(data.perTemplate || [])
      setRecentSends(data.recentSends || [])
    } catch { /* ignore */ }
    finally { setStatsLoading(false) }
  }, [webinarId])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])
  useEffect(() => { if (activeTab === 'stats') fetchStats() }, [activeTab, fetchStats])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const startCreate = () => {
    setEditing(null); setCreating(true)
    setFormName('Reminder'); setFormFromName('')
    setFormSubject('Reminder: {{webinar_title}} starts soon')
    setFormHtml(DEFAULT_HTML); setFormMinutesBefore(60)
    setFormSubjectB(''); setFormSkipIfJoined(true)
    setFormResendToNonOpeners(false); setFormResendAfterHours('4'); setFormResendSubject('')
  }

  const startEdit = (t: Template) => {
    setCreating(false); setEditing(t)
    setFormName(t.name); setFormFromName(t.fromName || '')
    setFormSubject(t.subject); setFormHtml(t.htmlBody)
    setFormMinutesBefore(t.minutesBefore)
    setFormSubjectB((t as any).subjectB || '')
    setFormSkipIfJoined((t as any).skipIfJoined !== false)
    setFormResendToNonOpeners((t as any).resendToNonOpeners || false)
    setFormResendAfterHours(String((t as any).resendAfterHours || 4))
    setFormResendSubject((t as any).resendSubject || '')
  }

  const cancelEdit = () => { setEditing(null); setCreating(false) }

  const handleSave = async () => {
    if (!formSubject.trim() || !formHtml.trim()) return
    setSaving(true)
    const payload = {
      name: formName, fromName: formFromName || null,
      subject: formSubject, htmlBody: formHtml,
      minutesBefore: formMinutesBefore,
      subjectB: formSubjectB || null,
      skipIfJoined: formSkipIfJoined,
      resendToNonOpeners: formResendToNonOpeners,
      resendAfterHours: formResendToNonOpeners ? Number(formResendAfterHours) || 4 : null,
      resendSubject: formResendToNonOpeners ? (formResendSubject || null) : null,
    }
    try {
      if (creating) {
        const res = await fetch(`/api/webinars/${webinarId}/reminder-emails`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Create failed')
      } else if (editing) {
        const res = await fetch(`/api/webinars/${webinarId}/reminder-emails/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Update failed')
      }
      cancelEdit(); await fetchTemplates()
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  const toggleActive = async (t: Template) => {
    try {
      const res = await fetch(`/api/webinars/${webinarId}/reminder-emails/${t.id}`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Toggle failed')
      await fetchTemplates()
    } catch (err: any) { setError(err.message) }
  }

  const deleteTemplate = async (t: Template) => {
    if (!confirm(`Delete "${t.name}"? This also deletes send history.`)) return
    try {
      const res = await fetch(`/api/webinars/${webinarId}/reminder-emails/${t.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      if (editing?.id === t.id) cancelEdit()
      await fetchTemplates()
    } catch (err: any) { setError(err.message) }
  }

  const saveSettings = async (source: string) => {
    setSavingSettings(true)
    try {
      const res = await fetch(`/api/webinars/${webinarId}/email-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderEmailSource: source }),
      })
      if (!res.ok) throw new Error('Save failed')
      setReminderEmailSource(source)
    } catch (err: any) { setError(err.message) }
    finally { setSavingSettings(false) }
  }

  const insertPlaceholder = (tag: string) => {
    const editorInsert = (window as any).__emailEditorInsert
    if (editorInsert) editorInsert(tag)
    else setFormHtml((prev) => prev + tag)
  }

  const sendTestEmail = async (t: Template) => {
    if (!confirm(`Send a test email for "${t.name}" to your account email?`)) return
    try {
      const res = await fetch(`/api/webinars/${webinarId}/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: t.id, type: 'reminder' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      alert(`Test email sent to ${data.sentTo}`)
    } catch (err: any) { setError(err.message) }
  }

  const cancelSends = async (t: Template) => {
    if (!confirm(`Cancel all pending sends for "${t.name}"?`)) return
    try {
      const res = await fetch(`/api/webinars/${webinarId}/cancel-sends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: t.id, type: 'reminder' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Cancel failed')
      alert(`Cancelled ${data.cancelled} pending send(s)`)
      await fetchTemplates()
    } catch (err: any) { setError(err.message) }
  }

  const handlePreview = async () => {
    try {
      const res = await fetch(`/api/webinars/${webinarId}/preview-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ htmlBody: formHtml, type: 'reminder' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPreviewHtml(data.html)
      setShowPreview(true)
    } catch (err: any) { setError(err.message) }
  }

  const fetchWebinarsForClone = async () => {
    try {
      const res = await fetch('/api/webinars')
      const data = await res.json()
      setAllWebinars((data.webinars || data || []).filter((w: any) => w.id !== webinarId))
    } catch { /* ignore */ }
  }

  const handleClone = async () => {
    if (!cloneSourceId) return
    setCloning(true)
    try {
      const res = await fetch(`/api/webinars/${webinarId}/clone-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceWebinarId: cloneSourceId, types: ['reminder'] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      alert(`Cloned ${data.clonedReminders} reminder template(s) as disabled`)
      setShowCloneDialog(false)
      await fetchTemplates()
    } catch (err: any) { setError(err.message) }
    finally { setCloning(false) }
  }

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
              <Button variant="secondary" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reminder Emails</h1>
              <p className="text-sm text-gray-500">Schedule reminder emails before the webinar</p>
            </div>
          </div>
          {activeTab === 'templates' && !creating && !editing && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setShowCloneDialog(true); fetchWebinarsForClone() }}>
                <Download className="w-4 h-4 mr-2" /> Clone From…
              </Button>
              <Button size="sm" onClick={startCreate} disabled={reminderEmailSource !== 'internal'}>
                <Plus className="w-4 h-4 mr-2" /> New Reminder
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {(['templates', 'stats', 'settings'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              {tab === 'templates' && <Mail className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />}
              {tab === 'stats' && <BarChart3 className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />}
              {tab === 'settings' && <Settings2 className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ─── Settings Tab ─────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Reminder Email Source</h2>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-500 mb-4">
                Choose whether to send reminder emails from this platform or rely on ClickFunnels / Mautic automations.
              </p>
              <div className="space-y-3">
                {[
                  { value: 'internal', label: 'Send from this platform', desc: 'Design and schedule reminder emails here with full tracking and merge tags.' },
                  { value: 'cf_mautic', label: 'Use ClickFunnels / Mautic', desc: 'Reminders are handled by your CRM automation. Only CF/Mautic tags will be applied at the scheduled times.' },
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${reminderEmailSource === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="source" value={opt.value}
                      checked={reminderEmailSource === opt.value}
                      onChange={() => saveSettings(opt.value)} disabled={savingSettings}
                      className="mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* ─── Templates Tab ────────────────────────────────────────────── */}
        {activeTab === 'templates' && (
          <>
            {reminderEmailSource === 'cf_mautic' && (
              <div className="flex items-start gap-2 p-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  Reminder emails are currently handled by <strong>ClickFunnels / Mautic</strong>.
                  Switch to &ldquo;Send from this platform&rdquo; in Settings to manage templates here.
                </div>
              </div>
            )}

            {/* Editor */}
            {(creating || editing) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <h2 className="text-lg font-semibold">{creating ? 'New Reminder Email' : `Edit: ${editing!.name}`}</h2>
                    <button onClick={cancelEdit}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {/* Timing */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Clock className="w-4 h-4 inline-block mr-1 -mt-0.5" /> Send Timing
                      </label>
                      <select value={formMinutesBefore} onChange={(e) => setFormMinutesBefore(Number(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        {REMINDER_PRESETS.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                      <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g. 1 Hour Reminder" />
                    </div>
                    {/* From Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        From Name <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input type="text" value={formFromName} onChange={(e) => setFormFromName(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Defaults to env var" />
                    </div>
                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line (A)</label>
                      <input type="text" value={formSubject} onChange={(e) => setFormSubject(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Reminder: {{webinar_title}} starts soon" />
                    </div>
                    {/* Subject B (A/B Test) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <FlaskConical className="w-4 h-4 inline-block mr-1 -mt-0.5" /> Subject Line B <span className="text-gray-400 font-normal">(A/B test — optional)</span>
                      </label>
                      <input type="text" value={formSubjectB} onChange={(e) => setFormSubjectB(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Leave empty to disable A/B testing" />
                      {formSubjectB && (
                        <p className="text-xs text-purple-600 mt-1">
                          50% of recipients will receive Subject A, 50% will receive Subject B. Stats show which performs better.
                        </p>
                      )}
                    </div>
                    {/* Smart Skip */}
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <input type="checkbox" checked={formSkipIfJoined} onChange={(e) => setFormSkipIfJoined(e.target.checked)}
                        className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <SkipForward className="w-4 h-4" /> Smart Skip
                        </p>
                        <p className="text-xs text-gray-500">Skip sending this reminder if the attendee has already joined the webinar.</p>
                      </div>
                    </div>
                    {/* Auto-resend to non-openers */}
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                      <div className="flex items-start gap-3">
                        <input type="checkbox" checked={formResendToNonOpeners} onChange={(e) => setFormResendToNonOpeners(e.target.checked)}
                          className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <RefreshCw className="w-4 h-4" /> Auto-Resend to Non-Openers
                          </p>
                          <p className="text-xs text-gray-500">Automatically resend with a different subject to people who didn&apos;t open.</p>
                        </div>
                      </div>
                      {formResendToNonOpeners && (
                        <div className="ml-7 space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600 w-32">Resend after</label>
                            <input type="number" min="1" max="72" value={formResendAfterHours}
                              onChange={(e) => setFormResendAfterHours(e.target.value)}
                              className="w-20 rounded border border-gray-300 px-2 py-1 text-sm" />
                            <span className="text-xs text-gray-500">hours</span>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Resend subject <span className="text-gray-400">(optional — defaults to Subject B, then A)</span></label>
                            <input type="text" value={formResendSubject} onChange={(e) => setFormResendSubject(e.target.value)}
                              className="w-full mt-1 rounded border border-gray-300 px-2 py-1 text-sm"
                              placeholder="e.g. Did you see this? {{webinar_title}}" />
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Placeholders */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Insert Placeholder</label>
                      <div className="flex flex-wrap gap-2">
                        {REMINDER_PLACEHOLDERS.map((p) => (
                          <button key={p.tag} type="button" onClick={() => insertPlaceholder(p.tag)}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
                            title={p.desc}><Copy className="w-3 h-3" />{p.tag}</button>
                        ))}
                      </div>
                    </div>
                    {/* Email Body */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Body</label>
                      <div className="border border-gray-300 rounded-lg overflow-hidden [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-300 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[300px] [&_.ql-editor]:text-sm">
                        <EmailEditor value={formHtml} onChange={setFormHtml} placeholder="Compose your reminder email..." />
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="secondary" size="sm" onClick={handlePreview} disabled={!formHtml.trim()}>
                        <Eye className="w-4 h-4 mr-2" /> Preview
                      </Button>
                      <Button variant="secondary" size="sm" onClick={cancelEdit}>Cancel</Button>
                      <Button size="sm" onClick={handleSave} disabled={saving || !formSubject.trim() || !formHtml.trim()}>
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {creating ? 'Create' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Template List */}
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
            ) : templates.length === 0 && !creating ? (
              <Card><CardBody>
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Reminder Emails</h3>
                  <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                    Create reminder emails to automatically send before the webinar starts.
                  </p>
                  <Button size="sm" onClick={startCreate} disabled={reminderEmailSource !== 'internal'}>
                    <Plus className="w-4 h-4 mr-2" /> Create Reminder
                  </Button>
                </div>
              </CardBody></Card>
            ) : (
              <div className="space-y-3">
                {templates.map((t) => (
                  <Card key={t.id}><CardBody>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{t.name}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${t.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {t.isActive ? 'Active' : 'Disabled'}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Clock className="w-3 h-3 mr-1" />{minutesToBeforeLabel(t.minutesBefore)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate mb-2">Subject: {t.subject}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{t.stats.totalSent} sent</span>
                          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{t.stats.openRate}% opened</span>
                          <span className="flex items-center gap-1"><MousePointer className="w-3.5 h-3.5" />{t.stats.clickRate}% clicked</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => sendTestEmail(t)} className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50" title="Send Test Email">
                          <Send className="w-4 h-4" />
                        </button>
                        <button onClick={() => cancelSends(t)} className="p-2 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50" title="Cancel Pending Sends">
                          <Ban className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleActive(t)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100" title={t.isActive ? 'Disable' : 'Enable'}>
                          {t.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => startEdit(t)} className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteTemplate(t)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardBody></Card>
                ))}
              </div>
            )}

            <div className="flex items-start gap-2 p-3 text-xs text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>How it works:</strong> Each active reminder email is sent at the specified time
                before the webinar starts. Open tracking (1×1 pixel) and click tracking (link redirect)
                are injected automatically. Placeholders are replaced with real values at send time.
              </div>
            </div>
          </>
        )}

        {/* ─── Stats Tab ────────────────────────────────────────────────── */}
        {activeTab === 'stats' && (
          <>
            {statsLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
            ) : !statsOverview || statsOverview.totalSent === 0 ? (
              <Card><CardBody>
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Yet</h3>
                  <p className="text-sm text-gray-500">Stats appear after reminder emails are sent.</p>
                </div>
              </CardBody></Card>
            ) : (
              <>
                {/* Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card><CardBody>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total Sent</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{statsOverview.totalSent}</p>
                  </CardBody></Card>
                  <Card><CardBody>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Open Rate</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{statsOverview.openRate}%</p>
                    <p className="text-xs text-gray-400">{statsOverview.uniqueOpens} / {statsOverview.totalSent}</p>
                  </CardBody></Card>
                  <Card><CardBody>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Click Rate</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{statsOverview.clickRate}%</p>
                    <p className="text-xs text-gray-400">{statsOverview.uniqueClicks} / {statsOverview.totalSent}</p>
                  </CardBody></Card>
                  <Card><CardBody>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total Interactions</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{statsOverview.totalOpens + statsOverview.totalClicks}</p>
                  </CardBody></Card>
                </div>

                {/* Per-template stats */}
                {perTemplateStats.length > 0 && (
                  <Card>
                    <CardHeader><h2 className="text-sm font-semibold text-gray-900">Per-Reminder Performance</h2></CardHeader>
                    <CardBody>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Reminder</th>
                              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Timing</th>
                              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Sent</th>
                              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Open Rate</th>
                              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Click Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {perTemplateStats.map((s) => (
                              <tr key={s.templateId} className="border-b border-gray-100">
                                <td className="py-2 px-3 text-gray-900">{s.name}</td>
                                <td className="py-2 px-3 text-right text-gray-500">{minutesToBeforeLabel(s.minutesBefore)}</td>
                                <td className="py-2 px-3 text-right">{s.totalSent}</td>
                                <td className="py-2 px-3 text-right text-green-600">{s.openRate}%</td>
                                <td className="py-2 px-3 text-right text-blue-600">{s.clickRate}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardBody>
                  </Card>
                )}

                {/* A/B Test Results */}
                {statsOverview?.abBreakdown && (statsOverview.abBreakdown.variantA.sent > 0 || statsOverview.abBreakdown.variantB.sent > 0) && statsOverview.abBreakdown.variantB.sent > 0 && (
                  <Card>
                    <CardHeader><h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FlaskConical className="w-4 h-4" /> A/B Subject Line Test</h2></CardHeader>
                    <CardBody>
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-lg border-2 ${statsOverview.abBreakdown.variantA.openRate >= statsOverview.abBreakdown.variantB.openRate ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                          <p className="text-xs font-medium text-gray-500 uppercase">Variant A</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{statsOverview.abBreakdown.variantA.openRate}%</p>
                          <p className="text-xs text-gray-400">{statsOverview.abBreakdown.variantA.opens} opens / {statsOverview.abBreakdown.variantA.sent} sent</p>
                        </div>
                        <div className={`p-4 rounded-lg border-2 ${statsOverview.abBreakdown.variantB.openRate > statsOverview.abBreakdown.variantA.openRate ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                          <p className="text-xs font-medium text-gray-500 uppercase">Variant B</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{statsOverview.abBreakdown.variantB.openRate}%</p>
                          <p className="text-xs text-gray-400">{statsOverview.abBreakdown.variantB.opens} opens / {statsOverview.abBreakdown.variantB.sent} sent</p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )}

                {/* Link Click Breakdown */}
                {statsOverview?.linkBreakdown && statsOverview.linkBreakdown.length > 0 && (
                  <Card>
                    <CardHeader><h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Link2 className="w-4 h-4" /> Link Click Breakdown</h2></CardHeader>
                    <CardBody>
                      <div className="space-y-2">
                        {statsOverview.linkBreakdown.map((link: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <a href={link.url} target="_blank" rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline truncate max-w-[400px] flex items-center gap-1">
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />{link.url}
                            </a>
                            <span className="text-sm font-medium text-gray-700 flex-shrink-0 ml-4">{link.clicks} clicks</span>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                )}

                {/* Recent sends */}
                {recentSends.length > 0 && (
                  <Card>
                    <CardHeader><h2 className="text-sm font-semibold text-gray-900">Recent Sends</h2></CardHeader>
                    <CardBody>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">To</th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Reminder</th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Opens</th>
                              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Clicks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentSends.map((s: any) => (
                              <tr key={s.id} className="border-b border-gray-100">
                                <td className="py-2 px-3 text-gray-900 truncate max-w-[200px]">{s.to}</td>
                                <td className="py-2 px-3 text-gray-500">{s.template?.name}</td>
                                <td className="py-2 px-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'SENT' ? 'bg-green-100 text-green-800' : s.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                                    {s.status}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right">{s.openCount}</td>
                                <td className="py-2 px-3 text-right">{s.clickCount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardBody>
                  </Card>
                )}
              </>
            )}
          </>
        )}

        {/* ─── Preview Modal ────────────────────────────────────────────── */}
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPreview(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto m-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-gray-900">Email Preview (sample data)</h3>
                <button onClick={() => setShowPreview(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
              </div>
              <div className="p-4" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </div>
        )}

        {/* ─── Clone Dialog ─────────────────────────────────────────────── */}
        {showCloneDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCloneDialog(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full m-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-gray-900">Clone Reminder Templates</h3>
                <button onClick={() => setShowCloneDialog(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-sm text-gray-500">Select a webinar to copy reminder templates from. Cloned templates will be created as disabled.</p>
                <select value={cloneSourceId} onChange={(e) => setCloneSourceId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Select webinar…</option>
                  {allWebinars.map((w) => (
                    <option key={w.id} value={w.id}>{w.title}</option>
                  ))}
                </select>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setShowCloneDialog(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleClone} disabled={!cloneSourceId || cloning}>
                    {cloning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Clone
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
