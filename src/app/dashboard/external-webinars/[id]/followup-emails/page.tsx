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
  AlertCircle, Send, MousePointer, Copy, Info,
} from 'lucide-react'

const EmailEditor = dynamic(() => import('@/components/EmailEditor'), { ssr: false })

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
  externalWebinarId: string
  name: string
  subject: string
  subjectB: string | null
  htmlBody: string
  fromName: string | null
  delayMinutes: number
  audienceType: string
  isActive: boolean
  sortOrder: number
  skipIfPurchased: boolean
  resendToNonOpeners: boolean
  resendAfterHours: number | null
  resendSubject: string | null
  createdAt: string
  updatedAt: string
  stats: TemplateStats
}

const PLACEHOLDERS = [
  { tag: '{{name}}', desc: 'Attendee name' },
  { tag: '{{webinar_title}}', desc: 'Webinar title' },
  { tag: '{{webinar_time}}', desc: 'Scheduled time (local)' },
  { tag: '{{attendance_status}}', desc: 'Attended / Missed / etc.' },
]

const DELAY_PRESETS = [
  { label: 'Immediately', value: 0 },
  { label: '1 hour after', value: 60 },
  { label: '4 hours after', value: 240 },
  { label: '1 day after', value: 1440 },
  { label: '2 days after', value: 2880 },
  { label: '3 days after', value: 4320 },
]

const AUDIENCE_TYPES = [
  { label: 'All Registrants', value: 'all' },
  { label: 'Attended', value: 'attended' },
  { label: 'Mostly Attended', value: 'mostly_attended' },
  { label: 'Partly Attended', value: 'partly_attended' },
  { label: 'Missed', value: 'missed' },
  { label: 'Replay Viewers', value: 'replay' },
]

const DEFAULT_HTML = `<div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 640px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 28px; margin: 0 0 16px;">Thank you for joining!</h1>
  <p style="margin: 0 0 16px;">Hi {{name}},</p>
  <p style="margin: 0 0 16px;">Thank you for attending <strong>{{webinar_title}}</strong>.</p>
  <p style="margin: 24px 0 0; color: #4b5563;">We hope you found it valuable!</p>
</div>`

function formatDelay(m: number) {
  if (m === 0) return 'Immediately'
  if (m >= 1440) return `${m / 1440} day${m / 1440 > 1 ? 's' : ''} after`
  if (m >= 60) return `${m / 60} hour${m / 60 > 1 ? 's' : ''} after`
  return `${m} minute${m > 1 ? 's' : ''} after`
}

export default function ExternalFollowUpEmailsPage() {
  const params = useParams()
  const ewId = params.id as string

  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editing, setEditing] = useState<Template | null>(null)
  const [creating, setCreating] = useState(false)
  const [formName, setFormName] = useState('')
  const [formFromName, setFormFromName] = useState('')
  const [formSubject, setFormSubject] = useState('')
  const [formSubjectB, setFormSubjectB] = useState('')
  const [formHtml, setFormHtml] = useState('')
  const [formDelayMinutes, setFormDelayMinutes] = useState(0)
  const [formAudienceType, setFormAudienceType] = useState('all')
  const [formSkipIfPurchased, setFormSkipIfPurchased] = useState(false)
  const [formResendToNonOpeners, setFormResendToNonOpeners] = useState(false)
  const [formResendAfterHours, setFormResendAfterHours] = useState<number | ''>('')
  const [formResendSubject, setFormResendSubject] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/external-webinars/${ewId}/followup-emails`)
      if (!res.ok) throw new Error('Failed to fetch templates')
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [ewId])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  const startCreate = () => {
    setEditing(null); setCreating(true)
    setFormName('Follow-Up'); setFormFromName(''); setFormSubject('Thanks for attending {{webinar_title}}')
    setFormSubjectB(''); setFormHtml(DEFAULT_HTML); setFormDelayMinutes(0)
    setFormAudienceType('all'); setFormSkipIfPurchased(false); setFormResendToNonOpeners(false)
    setFormResendAfterHours(''); setFormResendSubject('')
  }

  const startEdit = (t: Template) => {
    setCreating(false); setEditing(t)
    setFormName(t.name); setFormFromName(t.fromName || ''); setFormSubject(t.subject)
    setFormSubjectB(t.subjectB || ''); setFormHtml(t.htmlBody); setFormDelayMinutes(t.delayMinutes)
    setFormAudienceType(t.audienceType); setFormSkipIfPurchased(t.skipIfPurchased)
    setFormResendToNonOpeners(t.resendToNonOpeners)
    setFormResendAfterHours(t.resendAfterHours ?? ''); setFormResendSubject(t.resendSubject || '')
  }

  const cancelEdit = () => { setEditing(null); setCreating(false) }

  const handleSave = async () => {
    if (!formSubject.trim() || !formHtml.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: formName, fromName: formFromName || null, subject: formSubject,
        subjectB: formSubjectB || null, htmlBody: formHtml, delayMinutes: formDelayMinutes,
        audienceType: formAudienceType, skipIfPurchased: formSkipIfPurchased,
        resendToNonOpeners: formResendToNonOpeners,
        resendAfterHours: formResendAfterHours || null, resendSubject: formResendSubject || null,
      }
      if (creating) {
        const res = await fetch(`/api/external-webinars/${ewId}/followup-emails`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Create failed')
      } else if (editing) {
        const res = await fetch(`/api/external-webinars/${ewId}/followup-emails/${editing.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Update failed')
      }
      cancelEdit(); await fetchTemplates()
    } catch (err: any) { setError(err.message) } finally { setSaving(false) }
  }

  const toggleActive = async (t: Template) => {
    try {
      const res = await fetch(`/api/external-webinars/${ewId}/followup-emails/${t.id}`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Toggle failed')
      await fetchTemplates()
    } catch (err: any) { setError(err.message) }
  }

  const deleteTemplate = async (t: Template) => {
    if (!confirm(`Delete "${t.name}"?`)) return
    try {
      const res = await fetch(`/api/external-webinars/${ewId}/followup-emails/${t.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      if (editing?.id === t.id) cancelEdit()
      await fetchTemplates()
    } catch (err: any) { setError(err.message) }
  }

  const insertPlaceholder = (tag: string) => {
    const editorInsert = (window as any).__emailEditorInsert
    if (editorInsert) { editorInsert(tag) } else { setFormHtml((prev) => prev + tag) }
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/external-webinars/${ewId}`}>
              <Button variant="secondary" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Follow-Up Emails</h1>
              <p className="text-sm text-gray-500">Send emails after the webinar ends based on attendance</p>
            </div>
          </div>
          {!creating && !editing && (
            <Button size="sm" onClick={startCreate}><Plus className="w-4 h-4 mr-2" /> New Follow-Up</Button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {(creating || editing) && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <h2 className="text-lg font-semibold">{creating ? 'New Follow-Up' : `Edit: ${editing!.name}`}</h2>
                <button onClick={cancelEdit}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                  <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Send Delay (after webinar ends)</label>
                  <div className="flex flex-wrap gap-2">
                    {DELAY_PRESETS.map((p) => (
                      <button key={p.value} type="button" onClick={() => setFormDelayMinutes(p.value)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${formDelayMinutes === p.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input type="number" value={formDelayMinutes} onChange={(e) => setFormDelayMinutes(parseInt(e.target.value) || 0)} min={0}
                      className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    <span className="text-sm text-gray-500">minutes after webinar ends</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                  <select value={formAudienceType} onChange={(e) => setFormAudienceType(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    {AUDIENCE_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Name <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="text" value={formFromName} onChange={(e) => setFormFromName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line (A)</label>
                  <input type="text" value={formSubject} onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line B <span className="text-gray-400 font-normal">(optional, A/B test)</span></label>
                  <input type="text" value={formSubjectB} onChange={(e) => setFormSubjectB(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="skipPurchased" checked={formSkipIfPurchased} onChange={(e) => setFormSkipIfPurchased(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="skipPurchased" className="text-sm text-gray-700">Skip if already purchased</label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="resendNonOpeners" checked={formResendToNonOpeners} onChange={(e) => setFormResendToNonOpeners(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="resendNonOpeners" className="text-sm text-gray-700">Resend to non-openers</label>
                </div>
                {formResendToNonOpeners && (
                  <div className="ml-6 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-700">Resend after</label>
                      <input type="number" value={formResendAfterHours} onChange={(e) => setFormResendAfterHours(parseInt(e.target.value) || '')} min={1}
                        className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
                      <span className="text-sm text-gray-500">hours</span>
                    </div>
                    <div>
                      <label className="text-sm text-gray-700">Resend subject (optional)</label>
                      <input type="text" value={formResendSubject} onChange={(e) => setFormResendSubject(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm mt-1" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Insert Placeholder</label>
                  <div className="flex flex-wrap gap-2">
                    {PLACEHOLDERS.map((p) => (
                      <button key={p.tag} type="button" onClick={() => insertPlaceholder(p.tag)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200" title={p.desc}>
                        <Copy className="w-3 h-3" /> {p.tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Body</label>
                  <div className="border border-gray-300 rounded-lg overflow-hidden [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-300 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[300px] [&_.ql-editor]:text-sm">
                    <EmailEditor value={formHtml} onChange={setFormHtml} placeholder="Compose your follow-up email..." />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
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

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : templates.length === 0 && !creating ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <Send className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Follow-Up Email Templates</h3>
                <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                  Create follow-up emails to send after the webinar ends, based on attendance status.
                </p>
                <Button size="sm" onClick={startCreate}><Plus className="w-4 h-4 mr-2" /> Create Follow-Up</Button>
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
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{t.name}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${t.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {t.isActive ? 'Active' : 'Disabled'}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {formatDelay(t.delayMinutes)}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 capitalize">
                          {t.audienceType.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate mb-2">Subject: {t.subject}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Send className="w-3.5 h-3.5" /> {t.stats.totalSent} sent</span>
                        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {t.stats.openRate}% opened</span>
                        <span className="flex items-center gap-1"><MousePointer className="w-3.5 h-3.5" /> {t.stats.clickRate}% clicked</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
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
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        <div className="flex items-start gap-2 p-3 text-xs text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <strong>How it works:</strong> Follow-up emails are sent after the webinar session ends. Use audience targeting to send
            different messages to attendees vs. those who missed. A/B testing splits 50/50 between subject A and B.
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
