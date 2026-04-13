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
  Tablet, Clock, Copy, Info, Users, Send, Ban, FlaskConical,
  SkipForward, RefreshCw, Download, ExternalLink, Link2,
  ChevronDown, ChevronUp, CheckCircle, XCircle, Timer,
} from 'lucide-react'
import {
  FOLLOWUP_PLACEHOLDERS, FOLLOWUP_DELAY_PRESETS, AUDIENCE_TYPES,
  minutesToAfterLabel, audienceLabel,
} from '@/lib/emailTracking'

const EmailEditor = dynamic(() => import('@/components/EmailEditor'), { ssr: false })

// ─── Types ───────────────────────────────────────────────────────────────────

interface TemplateStats {
  totalSent: number; totalOpens: number; totalClicks: number
  uniqueOpens: number; uniqueClicks: number; openRate: number; clickRate: number
}

interface Template {
  id: string; webinarId: string; name: string; subject: string
  subjectB?: string | null; htmlBody: string; fromName: string | null
  delayMinutes: number; audienceType: string; isActive: boolean
  skipIfPurchased?: boolean; resendToNonOpeners?: boolean
  resendAfterHours?: number | null; resendSubject?: string | null
  sortOrder: number; createdAt: string; updatedAt: string; stats: TemplateStats
}

// ─── Default HTML ────────────────────────────────────────────────────────────

const DEFAULT_ATTENDED_HTML = `<div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 640px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 24px; margin: 0 0 16px;">Thank you for attending!</h1>
  <p style="margin: 0 0 16px;">Hi {{name}},</p>
  <p style="margin: 0 0 16px;">Thank you for attending <strong>{{webinar_title}}</strong>. We hope you enjoyed it!</p>
  <p style="margin: 0 0 16px;">If you missed anything, you can catch the replay here:</p>
  <p style="margin: 0 0 16px;">
    <a href="{{replay_link}}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600;">Watch Replay</a>
  </p>
  <p style="margin: 24px 0 0; color: #4b5563;">See you next time!</p>
</div>`

const DEFAULT_MISSED_HTML = `<div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 640px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 24px; margin: 0 0 16px;">We missed you!</h1>
  <p style="margin: 0 0 16px;">Hi {{name}},</p>
  <p style="margin: 0 0 16px;">We noticed you couldn't make it to <strong>{{webinar_title}}</strong>. No worries — we recorded it for you!</p>
  <p style="margin: 0 0 16px;">
    <a href="{{replay_link}}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600;">Watch the Replay</a>
  </p>
  <p style="margin: 24px 0 0; color: #4b5563;">Don't miss out — the replay is available for a limited time.</p>
</div>`

const DEFAULT_ALL_HTML = `<div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 640px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 24px; margin: 0 0 16px;">{{webinar_title}} — Follow Up</h1>
  <p style="margin: 0 0 16px;">Hi {{name}},</p>
  <p style="margin: 0 0 16px;">Thank you for your interest in <strong>{{webinar_title}}</strong>.</p>
  <p style="margin: 0 0 16px;">
    <a href="{{replay_link}}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600;">Watch Replay</a>
  </p>
  <p style="margin: 24px 0 0; color: #4b5563;">We'd love to hear from you!</p>
</div>`

function getDefaultHtml(audience: string) {
  if (audience === 'attended' || audience === 'mostly_attended') return DEFAULT_ATTENDED_HTML
  if (audience === 'missed') return DEFAULT_MISSED_HTML
  return DEFAULT_ALL_HTML
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function FollowUpEmailsPage() {
  const params = useParams()
  const webinarId = params.id as string

  const [activeTab, setActiveTab] = useState<'templates' | 'stats'>('templates')
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
  const [formDelay, setFormDelay] = useState(0)
  const [formCustomDelay, setFormCustomDelay] = useState('')
  const [formDelayUnit, setFormDelayUnit] = useState<'minutes' | 'hours' | 'days'>('hours')
  const [formAudience, setFormAudience] = useState('all')
  const [saving, setSaving] = useState(false)
  const [useCustomDelay, setUseCustomDelay] = useState(false)

  // A/B Testing
  const [formSubjectB, setFormSubjectB] = useState('')
  // Smart Skip
  const [formSkipIfPurchased, setFormSkipIfPurchased] = useState(false)
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

  // Stats
  const [statsOverview, setStatsOverview] = useState<any>(null)
  const [perTemplateStats, setPerTemplateStats] = useState<any[]>([])
  const [recentSends, setRecentSends] = useState<any[]>([])
  const [statsLoading, setStatsLoading] = useState(false)

  // Per-template sends viewer
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null)
  const [sendsData, setSendsData] = useState<any>(null)
  const [sendsLoading, setSendsLoading] = useState(false)
  const [sendsFilter, setSendsFilter] = useState('all')

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/webinars/${webinarId}/followup-emails`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }, [webinarId])

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const res = await fetch(`/api/webinars/${webinarId}/followup-emails/stats`)
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

  const fetchSends = useCallback(async (templateId: string, filter: string = 'all') => {
    setSendsLoading(true)
    try {
      const res = await fetch(`/api/webinars/${webinarId}/followup-emails/${templateId}/sends?filter=${filter}&limit=50`)
      if (!res.ok) throw new Error('Failed to fetch sends')
      const data = await res.json()
      setSendsData(data)
    } catch { setSendsData(null) }
    finally { setSendsLoading(false) }
  }, [webinarId])

  const toggleSendsPanel = (templateId: string) => {
    if (expandedTemplateId === templateId) {
      setExpandedTemplateId(null)
      setSendsData(null)
    } else {
      setExpandedTemplateId(templateId)
      setSendsFilter('all')
      fetchSends(templateId, 'all')
    }
  }

  const getEffectiveDelay = (): number => {
    if (!useCustomDelay) return formDelay
    const v = Number(formCustomDelay) || 0
    if (formDelayUnit === 'hours') return v * 60
    if (formDelayUnit === 'days') return v * 1440
    return v
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  const startCreate = () => {
    setEditing(null); setCreating(true)
    setFormName('Follow-Up'); setFormFromName('')
    setFormSubject('{{webinar_title}} — Follow Up')
    setFormHtml(DEFAULT_ALL_HTML); setFormDelay(0)
    setFormAudience('all'); setUseCustomDelay(false)
    setFormSubjectB(''); setFormSkipIfPurchased(false)
    setFormResendToNonOpeners(false); setFormResendAfterHours('4'); setFormResendSubject('')
  }

  const startEdit = (t: Template) => {
    setCreating(false); setEditing(t)
    setFormName(t.name); setFormFromName(t.fromName || '')
    setFormSubject(t.subject); setFormHtml(t.htmlBody)
    setFormAudience(t.audienceType)
    setFormSubjectB((t as any).subjectB || '')
    setFormSkipIfPurchased((t as any).skipIfPurchased || false)
    setFormResendToNonOpeners((t as any).resendToNonOpeners || false)
    setFormResendAfterHours(String((t as any).resendAfterHours || 4))
    setFormResendSubject((t as any).resendSubject || '')
    // Check if delay matches a preset
    const preset = FOLLOWUP_DELAY_PRESETS.find((p) => p.value === t.delayMinutes)
    if (preset) {
      setFormDelay(t.delayMinutes); setUseCustomDelay(false)
    } else {
      setUseCustomDelay(true)
      if (t.delayMinutes >= 1440 && t.delayMinutes % 1440 === 0) {
        setFormCustomDelay(String(t.delayMinutes / 1440)); setFormDelayUnit('days')
      } else if (t.delayMinutes >= 60 && t.delayMinutes % 60 === 0) {
        setFormCustomDelay(String(t.delayMinutes / 60)); setFormDelayUnit('hours')
      } else {
        setFormCustomDelay(String(t.delayMinutes)); setFormDelayUnit('minutes')
      }
    }
  }

  const cancelEdit = () => { setEditing(null); setCreating(false) }

  const handleSave = async () => {
    if (!formSubject.trim() || !formHtml.trim()) return
    setSaving(true)
    const delay = getEffectiveDelay()
    const payload = {
      name: formName, fromName: formFromName || null,
      subject: formSubject, htmlBody: formHtml,
      delayMinutes: delay, audienceType: formAudience,
      subjectB: formSubjectB || null,
      skipIfPurchased: formSkipIfPurchased,
      resendToNonOpeners: formResendToNonOpeners,
      resendAfterHours: formResendToNonOpeners ? Number(formResendAfterHours) || 4 : null,
      resendSubject: formResendToNonOpeners ? (formResendSubject || null) : null,
    }
    try {
      if (creating) {
        const res = await fetch(`/api/webinars/${webinarId}/followup-emails`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Create failed')
      } else if (editing) {
        const res = await fetch(`/api/webinars/${webinarId}/followup-emails/${editing.id}`, {
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
      const res = await fetch(`/api/webinars/${webinarId}/followup-emails/${t.id}`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Toggle failed')
      await fetchTemplates()
    } catch (err: any) { setError(err.message) }
  }

  const deleteTemplate = async (t: Template) => {
    if (!confirm(`Delete "${t.name}"? This also deletes send history.`)) return
    try {
      const res = await fetch(`/api/webinars/${webinarId}/followup-emails/${t.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      if (editing?.id === t.id) cancelEdit()
      await fetchTemplates()
    } catch (err: any) { setError(err.message) }
  }

  const duplicateTemplate = async (t: Template) => {
    try {
      const res = await fetch(`/api/webinars/${webinarId}/followup-emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${t.name} (Copy)`,
          subject: t.subject,
          htmlBody: t.htmlBody,
          fromName: t.fromName,
          delayMinutes: t.delayMinutes,
          audienceType: t.audienceType,
          isActive: false,
          subjectB: t.subjectB,
          skipIfPurchased: t.skipIfPurchased,
          resendToNonOpeners: t.resendToNonOpeners,
          resendAfterHours: t.resendAfterHours,
          resendSubject: t.resendSubject,
        }),
      })
      if (!res.ok) throw new Error('Duplicate failed')
      await fetchTemplates()
    } catch (err: any) { setError(err.message) }
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
        body: JSON.stringify({ templateId: t.id, type: 'followup' }),
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
        body: JSON.stringify({ templateId: t.id, type: 'followup' }),
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
        body: JSON.stringify({ htmlBody: formHtml, type: 'followup' }),
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
        body: JSON.stringify({ sourceWebinarId: cloneSourceId, types: ['followup'] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      alert(`Cloned ${data.clonedFollowUps} follow-up template(s) as disabled`)
      setShowCloneDialog(false)
      await fetchTemplates()
    } catch (err: any) { setError(err.message) }
    finally { setCloning(false) }
  }

  const audienceColor = (type: string) => {
    const map: Record<string, string> = {
      all: 'bg-gray-100 text-gray-800',
      attended: 'bg-green-100 text-green-800',
      mostly_attended: 'bg-emerald-100 text-emerald-800',
      partly_attended: 'bg-yellow-100 text-yellow-800',
      missed: 'bg-red-100 text-red-800',
      replay: 'bg-purple-100 text-purple-800',
    }
    return map[type] || 'bg-gray-100 text-gray-800'
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
              <h1 className="text-2xl font-bold text-gray-900">Follow-Up Emails</h1>
              <p className="text-sm text-gray-500">Send targeted emails after the webinar based on attendance</p>
            </div>
          </div>
          {activeTab === 'templates' && !creating && !editing && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setShowCloneDialog(true); fetchWebinarsForClone() }}>
                <Download className="w-4 h-4 mr-2" /> Clone From…
              </Button>
              <Button size="sm" onClick={startCreate}>
                <Plus className="w-4 h-4 mr-2" /> New Follow-Up
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
          {(['templates', 'stats'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              {tab === 'templates' && <Send className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />}
              {tab === 'stats' && <BarChart3 className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ─── Templates Tab ────────────────────────────────────────────── */}
        {activeTab === 'templates' && (
          <>
            {/* Editor */}
            {(creating || editing) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <h2 className="text-lg font-semibold">{creating ? 'New Follow-Up Email' : `Edit: ${editing!.name}`}</h2>
                    <button onClick={cancelEdit}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {/* Audience */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Users className="w-4 h-4 inline-block mr-1 -mt-0.5" /> Who receives this?
                      </label>
                      <select value={formAudience} onChange={(e) => {
                        setFormAudience(e.target.value)
                        if (creating) setFormHtml(getDefaultHtml(e.target.value))
                      }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        {AUDIENCE_TYPES.map((a) => (
                          <option key={a.value} value={a.value}>{a.label}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400 mt-1">
                        {formAudience === 'all' && 'Sent to all registrants regardless of attendance.'}
                        {formAudience === 'attended' && 'Sent only to people who attended live.'}
                        {formAudience === 'mostly_attended' && 'Sent to people who watched most of the webinar.'}
                        {formAudience === 'partly_attended' && 'Sent to people who joined but left early.'}
                        {formAudience === 'missed' && 'Sent to people who registered but did not attend.'}
                        {formAudience === 'replay' && 'Sent to people who watched the replay.'}
                      </p>
                    </div>

                    {/* Delay */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Clock className="w-4 h-4 inline-block mr-1 -mt-0.5" /> Send Delay (after webinar ends)
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="radio" checked={!useCustomDelay} onChange={() => setUseCustomDelay(false)} />
                          Preset
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="radio" checked={useCustomDelay} onChange={() => setUseCustomDelay(true)} />
                          Custom
                        </label>
                      </div>
                      {!useCustomDelay ? (
                        <select value={formDelay} onChange={(e) => setFormDelay(Number(e.target.value))}
                          className="w-full mt-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          {FOLLOWUP_DELAY_PRESETS.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex gap-2 mt-2">
                          <input type="number" min="0" value={formCustomDelay}
                            onChange={(e) => setFormCustomDelay(e.target.value)}
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g. 3" />
                          <select value={formDelayUnit} onChange={(e) => setFormDelayUnit(e.target.value as any)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="minutes">Minutes</option>
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                      <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g. Thank You for Attending" />
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
                        placeholder="{{webinar_title}} — Follow Up" />
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
                      <input type="checkbox" checked={formSkipIfPurchased} onChange={(e) => setFormSkipIfPurchased(e.target.checked)}
                        className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <SkipForward className="w-4 h-4" /> Skip if Purchased
                        </p>
                        <p className="text-xs text-gray-500">Skip sending this follow-up if the attendee has already made a purchase.</p>
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
                        {FOLLOWUP_PLACEHOLDERS.map((p) => (
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
                        <EmailEditor value={formHtml} onChange={setFormHtml} placeholder="Compose your follow-up email..." />
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
                  <Send className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Follow-Up Emails</h3>
                  <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                    Create follow-up emails to send after the webinar. Target different audiences
                    like attendees, no-shows, or partial viewers with personalized messages.
                  </p>
                  <Button size="sm" onClick={startCreate}>
                    <Plus className="w-4 h-4 mr-2" /> Create Follow-Up
                  </Button>
                </div>
              </CardBody></Card>
            ) : (
              <div className="space-y-6">
                {(() => {
                  const audienceOrder = ['mostly_attended', 'partly_attended', 'missed', 'replay', 'attended', 'all']
                  const grouped = new Map<string, Template[]>()
                  for (const t of templates) {
                    const key = t.audienceType || 'all'
                    if (!grouped.has(key)) grouped.set(key, [])
                    grouped.get(key)!.push(t)
                  }
                  // Sort groups by the defined order
                  const sortedGroups = [...grouped.entries()].sort(
                    (a, b) => (audienceOrder.indexOf(a[0]) === -1 ? 99 : audienceOrder.indexOf(a[0])) -
                              (audienceOrder.indexOf(b[0]) === -1 ? 99 : audienceOrder.indexOf(b[0]))
                  )
                  return sortedGroups.map(([audience, groupTemplates]) => (
                    <div key={audience}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${audienceColor(audience)}`}>
                          <Users className="w-3.5 h-3.5 mr-1" />{audienceLabel(audience)}
                        </span>
                        <span className="text-xs text-gray-400">{groupTemplates.length} email{groupTemplates.length !== 1 ? 's' : ''}</span>
                        <div className="flex-1 border-t border-gray-200" />
                      </div>
                      <div className="space-y-2">
                        {groupTemplates.sort((a, b) => a.delayMinutes - b.delayMinutes).map((t) => (
                  <Card key={t.id}><CardBody>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{t.name}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${t.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {t.isActive ? 'Active' : 'Disabled'}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Clock className="w-3 h-3 mr-1" />{minutesToAfterLabel(t.delayMinutes)}
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
                        <button onClick={() => duplicateTemplate(t)} className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50" title="Duplicate">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteTemplate(t)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {/* Expand/collapse recipients */}
                    {t.stats.totalSent > 0 && (
                      <button
                        onClick={() => toggleSendsPanel(t.id)}
                        className="mt-3 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {expandedTemplateId === t.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {expandedTemplateId === t.id ? 'Hide' : 'View'} Recipients ({t.stats.totalSent})
                      </button>
                    )}
                    {/* Recipients panel */}
                    {expandedTemplateId === t.id && (
                      <div className="mt-3 border-t border-gray-100 pt-3">
                        {/* Filter tabs */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {[
                            { key: 'all', label: 'All' },
                            { key: 'opened', label: 'Opened' },
                            { key: 'clicked', label: 'Clicked' },
                            { key: 'sent', label: 'Not Opened' },
                            { key: 'pending', label: 'Pending' },
                            { key: 'failed', label: 'Failed' },
                          ].map((f) => (
                            <button
                              key={f.key}
                              onClick={() => { setSendsFilter(f.key); fetchSends(t.id, f.key) }}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                sendsFilter === f.key
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {f.label}
                              {sendsData?.summary && f.key === 'opened' && ` (${sendsData.summary.totalOpened})`}
                              {sendsData?.summary && f.key === 'clicked' && ` (${sendsData.summary.totalClicked})`}
                            </button>
                          ))}
                        </div>
                        {sendsLoading ? (
                          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                        ) : !sendsData?.sends?.length ? (
                          <p className="text-xs text-gray-400 text-center py-4">No recipients match this filter.</p>
                        ) : (
                          <div className="space-y-0 divide-y divide-gray-100 max-h-96 overflow-y-auto">
                            {sendsData.sends.map((s: any) => (
                              <div key={s.id} className="flex items-center gap-3 py-2 text-xs">
                                {/* Status icon */}
                                <div className="flex-shrink-0">
                                  {s.clickCount > 0 ? (
                                    <MousePointer className="w-4 h-4 text-blue-500" />
                                  ) : s.openCount > 0 ? (
                                    <Eye className="w-4 h-4 text-green-500" />
                                  ) : s.status === 'SENT' ? (
                                    <CheckCircle className="w-4 h-4 text-gray-300" />
                                  ) : s.status === 'PENDING' || s.status === 'SENDING' ? (
                                    <Timer className="w-4 h-4 text-yellow-500" />
                                  ) : s.status === 'FAILED' ? (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  ) : (
                                    <Mail className="w-4 h-4 text-gray-300" />
                                  )}
                                </div>
                                {/* Name & email */}
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium text-gray-900">{s.recipientName || 'Unknown'}</span>
                                  <span className="text-gray-400 ml-1.5">{s.to}</span>
                                </div>
                                {/* Open/click info */}
                                <div className="flex items-center gap-3 flex-shrink-0 text-gray-500">
                                  {s.openCount > 0 && (
                                    <span className="flex items-center gap-1 text-green-600">
                                      <Eye className="w-3 h-3" /> {s.openCount}x
                                      {s.openedAt && <span className="text-gray-400 ml-1">{new Date(s.openedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                                    </span>
                                  )}
                                  {s.clickCount > 0 && (
                                    <span className="flex items-center gap-1 text-blue-600">
                                      <MousePointer className="w-3 h-3" /> {s.clickCount}x
                                    </span>
                                  )}
                                  {s.status === 'PENDING' && (
                                    <span className="text-yellow-600">Scheduled {new Date(s.scheduledFor).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                  )}
                                  {s.status === 'FAILED' && (
                                    <span className="text-red-600 truncate max-w-[200px]" title={s.errorMessage}>{s.errorMessage || 'Failed'}</span>
                                  )}
                                  {s.status === 'SKIPPED' && (
                                    <span className="text-gray-400">Skipped</span>
                                  )}
                                </div>
                                {/* A/B variant badge */}
                                {s.abVariant === 'B' && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700">B</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {sendsData?.pagination && sendsData.pagination.totalPages > 1 && (
                          <p className="text-xs text-gray-400 text-center mt-2">
                            Showing {sendsData.sends.length} of {sendsData.pagination.total} recipients
                          </p>
                        )}
                        {/* Clicked URLs summary */}
                        {sendsFilter === 'clicked' && sendsData?.sends?.some((s: any) => s.clicks?.length > 0) && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs font-medium text-gray-600 mb-2">URLs Clicked</p>
                            <div className="space-y-1">
                              {(() => {
                                const urlCounts = new Map<string, number>()
                                for (const s of sendsData.sends) {
                                  for (const c of s.clicks || []) {
                                    if (c.url) urlCounts.set(c.url, (urlCounts.get(c.url) || 0) + 1)
                                  }
                                }
                                return [...urlCounts.entries()].sort((a, b) => b[1] - a[1]).map(([url, count]) => (
                                  <div key={url} className="flex items-center gap-2 text-xs">
                                    <Link2 className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                    <span className="text-gray-600 truncate flex-1" title={url}>{url}</span>
                                    <span className="text-gray-400 flex-shrink-0">{count} click{count !== 1 ? 's' : ''}</span>
                                  </div>
                                ))
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardBody></Card>
                        ))}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}

            <div className="flex items-start gap-2 p-3 text-xs text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>How it works:</strong> Follow-up emails are sent after the webinar ends.
                Each email targets a specific audience (attended, missed, etc.) and is sent after the
                configured delay. You can create multiple follow-ups with different delays and audiences.
                Open/click tracking and merge tags work the same as confirmation emails.
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
                  <p className="text-sm text-gray-500">Stats appear after follow-up emails are sent.</p>
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
                    <CardHeader><h2 className="text-sm font-semibold text-gray-900">Per Follow-Up Performance</h2></CardHeader>
                    <CardBody>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Audience</th>
                              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Delay</th>
                              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Sent</th>
                              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Open Rate</th>
                              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Click Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {perTemplateStats.map((s: any) => (
                              <tr key={s.templateId} className="border-b border-gray-100">
                                <td className="py-2 px-3 text-gray-900">{s.name}</td>
                                <td className="py-2 px-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${audienceColor(s.audienceType)}`}>
                                    {audienceLabel(s.audienceType)}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right text-gray-500">{minutesToAfterLabel(s.delayMinutes)}</td>
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
                {statsOverview?.abBreakdown && statsOverview.abBreakdown.variantB.sent > 0 && (
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
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Template</th>
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
                <h3 className="font-semibold text-gray-900">Clone Follow-Up Templates</h3>
                <button onClick={() => setShowCloneDialog(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-sm text-gray-500">Select a webinar to copy follow-up templates from. Cloned templates will be created as disabled.</p>
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
