'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Clock,
  Mail,
  MessageSquare,
  Eye,
  EyeOff,
  Save,
  X,
  Loader2,
  AlertCircle,
  Bell,
  Send,
  CheckCircle2,
  Copy,
  Info
} from 'lucide-react'

type ReminderChannel = 'EMAIL' | 'SMS' | 'BOTH'
type WatchTargetType = 'ANY' | 'WATCHED_UP_TO' | 'WATCHED_AT_LEAST'

interface ReminderTemplate {
  id: string
  webinarId: string
  minutesBefore: number
  channel: ReminderChannel
  emailSubject: string
  emailBody: string
  smsBody?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  applyClickFunnelsTag: boolean
  clickFunnelsTag?: string | null
  isPostWebinar?: boolean
  watchTargetType?: WatchTargetType
  watchTargetSeconds?: number | null
}

interface ReminderLog {
  id: string
  status: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED' | 'CANCELLED'
  scheduledFor: string
  sentAt: string | null
  errorMessage?: string | null
  channel: 'EMAIL' | 'SMS' | 'BOTH'
  registration: {
    name?: string | null
    email: string
    phone?: string | null
  }
  template: {
    minutesBefore: number
    channel: ReminderChannel
    isPostWebinar?: boolean
    watchTargetType?: WatchTargetType
    watchTargetSeconds?: number | null
  }
}

interface Webinar {
  id: string
  title: string
  slug?: string
}

interface ReminderFormState {
  minutesBefore: number
  channel: ReminderChannel
  emailSubject: string
  emailBody: string
  smsBody: string
  isActive: boolean
  applyClickFunnelsTag: boolean
  clickFunnelsTag: string
  isPostWebinar: boolean
  watchTargetType: WatchTargetType
  watchTargetMinutes: number
}

export default function WebinarRemindersPage() {
  const params = useParams()
  const router = useRouter()
  const [webinar, setWebinar] = useState<Webinar | null>(null)
  const [reminders, setReminders] = useState<ReminderTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showPlaceholders, setShowPlaceholders] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([])
  const [logStats, setLogStats] = useState<Record<string, number>>({})
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [logError, setLogError] = useState('')

  // Form state
  const [formData, setFormData] = useState<ReminderFormState>({
    minutesBefore: 1440, // 24 hours
    channel: 'EMAIL',
    emailSubject: '',
    emailBody: '',
    smsBody: '',
    isActive: true,
    applyClickFunnelsTag: false,
    clickFunnelsTag: '',
    isPostWebinar: false,
    watchTargetType: 'ANY',
    watchTargetMinutes: 0
  })

  useEffect(() => {
    if (params.id) {
      fetchWebinar()
      fetchReminders()
    }
  }, [params.id])

  const fetchWebinar = async () => {
    try {
      const response = await fetch(`/api/webinars/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch webinar')
      const data = await response.json()
      setWebinar(data.webinar)
    } catch (err: any) {
      console.error('Fetch webinar error:', err)
    }
  }

  const fetchReminderLogs = async () => {
    if (!params.id) return
    setLoadingLogs(true)
    setLogError('')

    try {
      const response = await fetch(`/api/webinars/${params.id}/reminders/logs`)

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || 'Failed to fetch reminder queue')
      }

      const data = await response.json()
      setReminderLogs(data.reminders || [])
      setLogStats(data.stats || {})
    } catch (err: any) {
      setLogError(err.message || 'Unable to load reminder queue')
      console.error('Fetch reminder logs error:', err)
    } finally {
      setLoadingLogs(false)
    }
  }

  const fetchReminders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/webinars/${params.id}/reminders`)
      if (!response.ok) throw new Error('Failed to fetch reminders')
      const data = await response.json()
      const reminderList = Array.isArray(data) ? data : data.reminders || []
      setReminders(reminderList)
      await fetchReminderLogs()
    } catch (err: any) {
      setError(err.message)
      console.error('Fetch reminders error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (
        formData.watchTargetType !== 'ANY' &&
        formData.watchTargetMinutes <= 0
      ) {
        throw new Error('Set a watch target greater than 0 minutes')
      }

      const url = editingId
        ? `/api/webinars/${params.id}/reminders/${editingId}`
        : `/api/webinars/${params.id}/reminders`

      const { watchTargetMinutes, ...rest } = formData
      const payload = {
        ...rest,
        watchTargetSeconds:
          rest.watchTargetType === 'ANY'
            ? null
            : Math.round(Math.max(1, watchTargetMinutes) * 60)
      }

      const response = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save reminder')
      }

      await fetchReminders()
      resetForm()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (reminder: ReminderTemplate) => {
    setFormData({
      minutesBefore: reminder.minutesBefore,
      channel: reminder.channel,
      emailSubject: reminder.emailSubject,
      emailBody: reminder.emailBody,
      smsBody: reminder.smsBody || '',
      isActive: reminder.isActive,
      applyClickFunnelsTag: reminder.applyClickFunnelsTag || false,
      clickFunnelsTag: reminder.clickFunnelsTag || '',
      isPostWebinar: Boolean(reminder.isPostWebinar),
      watchTargetType: reminder.watchTargetType || 'ANY',
      watchTargetMinutes:
        reminder.watchTargetSeconds && reminder.watchTargetSeconds > 0
          ? Math.max(1, Math.round((reminder.watchTargetSeconds || 0) / 60))
          : 0
    })
    setEditingId(reminder.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reminder template?')) {
      return
    }

    try {
      const response = await fetch(`/api/webinars/${params.id}/reminders/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete reminder')
      await fetchReminders()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleToggleActive = async (reminder: ReminderTemplate) => {
    try {
      const response = await fetch(`/api/webinars/${params.id}/reminders/${reminder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !reminder.isActive })
      })

      if (!response.ok) throw new Error('Failed to update reminder')
      await fetchReminders()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const resetForm = () => {
    setFormData({
      minutesBefore: 1440,
      channel: 'EMAIL',
      emailSubject: '',
      emailBody: '',
      smsBody: '',
      isActive: true,
      applyClickFunnelsTag: false,
      clickFunnelsTag: '',
      isPostWebinar: false,
      watchTargetType: 'ANY',
      watchTargetMinutes: 0
    })
    setEditingId(null)
    setShowForm(false)
  }

  const formatMinutes = (minutes: number) => {
    if (minutes === 0) return '0 minutes'
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`
    if (minutes < 1440) {
      const hours = Math.floor(minutes / 60)
      return `${hours} hour${hours !== 1 ? 's' : ''}`
    }
    const days = Math.floor(minutes / 1440)
    return `${days} day${days !== 1 ? 's' : ''}`
  }

  const getPresetOptions = () => {
    if (formData.isPostWebinar) {
      return [
        { label: 'Right after the webinar', value: 0 },
        { label: '30 minutes after', value: 30 },
        { label: '1 hour after', value: 60 },
        { label: '6 hours after', value: 360 },
        { label: '24 hours after', value: 1440 },
        { label: '3 days after', value: 4320 },
        { label: '1 week after', value: 10080 },
        { label: 'Custom', value: -1 }
      ]
    }

    return [
      { label: '1 minute before', value: 1 },
      { label: '2 minutes before', value: 2 },
      { label: '3 minutes before', value: 3 },
      { label: '5 minutes before', value: 5 },
      { label: '10 minutes before', value: 10 },
      { label: '15 minutes before', value: 15 },
      { label: '30 minutes before', value: 30 },
      { label: '1 hour before', value: 60 },
      { label: '2 hours before', value: 120 },
      { label: '6 hours before', value: 360 },
      { label: '12 hours before', value: 720 },
      { label: '24 hours before', value: 1440 },
      { label: '2 days before', value: 2880 },
      { label: '3 days before', value: 4320 },
      { label: '1 week before', value: 10080 },
      { label: 'Custom', value: -1 }
    ]
  }

  const describeReminderTiming = (
    minutes: number,
    isPostWebinar?: boolean,
    short = false
  ) => {
    if (isPostWebinar) {
      if (minutes === 0) {
        return short ? 'Right after end' : 'right after the webinar ends'
      }
      const base = formatMinutes(minutes)
      return short ? `${base} after end` : `${base} after the webinar ends`
    }

    if (minutes === 0) {
      return short ? 'At start' : 'at the scheduled start time'
    }

    const base = formatMinutes(minutes)
    return short ? `${base} before` : `${base} before the webinar starts`
  }

  const describeWatchTarget = (
    type?: WatchTargetType,
    seconds?: number | null
  ) => {
    if (!type || type === 'ANY' || !seconds || seconds <= 0) {
      return 'All registrants'
    }

    const minutes = Math.max(1, Math.round(seconds / 60))
    const formatted = formatMinutes(minutes)

    if (type === 'WATCHED_UP_TO') {
      return `Attended up to ${formatted}`
    }

    return `Reached at least ${formatted}`
  }

  const insertPlaceholder = (placeholder: string) => {
    const textarea = document.getElementById('emailBody') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = formData.emailBody
    const before = text.substring(0, start)
    const after = text.substring(end)

    setFormData({
      ...formData,
      emailBody: before + placeholder + after
    })

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length)
    }, 0)
  }

  const copyPlaceholder = (placeholder: string) => {
    navigator.clipboard.writeText(placeholder)
  }

  const placeholders = [
    { name: 'Attendee Name', value: '{{name}}', description: 'Full name of the attendee' },
    { name: 'Email', value: '{{email}}', description: 'Attendee email address' },
    { name: 'Webinar Title', value: '{{webinarTitle}}', description: 'Name of the webinar' },
    { name: 'Webinar Time', value: '{{webinarTime}}', description: 'Formatted time in user\'s timezone' },
    { name: 'Countdown Link', value: '{{countdownLink}}', description: 'Link to countdown page' },
    { name: 'Referral Link', value: '{{referralLink}}', description: 'User\'s unique referral link' },
    { name: 'Timezone', value: '{{webinarTimezone}}', description: 'User\'s timezone' }
  ]

  const defaultTemplates = [
    {
      name: '24 Hours Before',
      minutesBefore: 1440,
      emailSubject: 'Tomorrow: {{webinarTitle}}',
      emailBody: `<h2>Hi {{name}}!</h2>

<p>Your webinar <strong>{{webinarTitle}}</strong> starts in 24 hours!</p>

<p><strong>Time:</strong> {{webinarTime}}</p>

<p><a href="{{countdownLink}}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Go to Countdown Page</a></p>

<p>Invite friends and earn rewards:</p>
<p><a href="{{referralLink}}">{{referralLink}}</a></p>

<p>See you tomorrow!</p>`
    },
    {
      name: '2 Hours Before',
      minutesBefore: 120,
      emailSubject: 'Starting Soon: {{webinarTitle}}',
      emailBody: `<h2>Hi {{name}}!</h2>

<p>Your webinar <strong>{{webinarTitle}}</strong> starts in just 2 hours!</p>

<p><strong>Time:</strong> {{webinarTime}}</p>

<p><a href="{{countdownLink}}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Join Webinar</a></p>

<p>Make sure you're ready!</p>`
    },
    {
      name: '15 Minutes Before',
      minutesBefore: 15,
      emailSubject: 'Final Reminder: {{webinarTitle}} starts in 15 minutes!',
      emailBody: `<h2>Hi {{name}}!</h2>

<p><strong>{{webinarTitle}}</strong> starts in 15 minutes!</p>

<p><a href="{{countdownLink}}" style="display: inline-block; padding: 16px 32px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 18px;">JOIN NOW</a></p>

<p>Don't miss out!</p>`
    }
  ]

  const loadTemplate = (template: typeof defaultTemplates[0]) => {
    setFormData({
      ...formData,
      minutesBefore: template.minutesBefore,
      emailSubject: template.emailSubject,
      emailBody: template.emailBody
    })
  }

  const formatDateTime = (value?: string | null) => {
    if (!value) return '—'
    return new Date(value).toLocaleString()
  }

  const statusLabels: Record<ReminderLog['status'], string> = {
    PENDING: 'Pending',
    SENT: 'Sent',
    FAILED: 'Failed',
    SKIPPED: 'Skipped',
    CANCELLED: 'Cancelled'
  }

  const statusStyles: Record<ReminderLog['status'], string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    SENT: 'bg-green-100 text-green-800 border-green-200',
    FAILED: 'bg-red-100 text-red-800 border-red-200',
    SKIPPED: 'bg-gray-100 text-gray-800 border-gray-200',
    CANCELLED: 'bg-pink-100 text-pink-800 border-pink-200'
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/dashboard/webinars/${params.id}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Webinar
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bell className="h-8 w-8 text-blue-600" />
                Reminder Templates
              </h1>
              <p className="text-gray-600 mt-2">
                {webinar?.title || 'Loading...'}
              </p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
              {showForm ? (
                <>
                  <X className="h-4 w-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Reminder
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Info Banner */}
        <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">How reminders work:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Reminders are automatically scheduled when someone registers</li>
                <li>Only future reminders are sent (if someone registers 1 hour before, they won't get the 24-hour reminder)</li>
                <li>Use placeholders to personalize emails and SMS (click the "Show Placeholders" button)</li>
              </ul>
            </div>
          </div>
          <p className="text-sm text-blue-800">
            Keep running your existing cron job so callbacks or ClickFunnels tags stay in sync when reminders are sent.
          </p>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {editingId ? 'Edit Reminder' : 'Create New Reminder'}
              </h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Timing */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery timing
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { value: false, label: 'Before webinar starts' },
                        { value: true, label: 'After webinar ends' }
                      ].map(option => (
                        <button
                          key={String(option.value)}
                          type="button"
                          onClick={() => setFormData({ ...formData, isPostWebinar: option.value })}
                          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                            formData.isPostWebinar === option.value
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Choose whether this reminder goes out before the live session or as a post-webinar follow-up.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={formData.minutesBefore}
                      onChange={(e) => setFormData({ ...formData, minutesBefore: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {getPresetOptions().map(option => (
                        <option key={`${option.label}-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {formData.minutesBefore === -1 && (
                      <input
                        type="number"
                        min={formData.isPostWebinar ? 0 : 1}
                        placeholder={formData.isPostWebinar ? 'Minutes after end' : 'Minutes before start'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minutesBefore: parseInt(e.target.value) || 0
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    This reminder will be sent {describeReminderTiming(formData.minutesBefore, formData.isPostWebinar)}
                  </p>
                </div>

                {/* Default Templates */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Templates
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {defaultTemplates.map((template, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => loadTemplate(template)}
                        className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Channel Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channel
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: 'EMAIL', label: 'Email Only' },
                      { value: 'SMS', label: 'SMS Only' },
                      { value: 'BOTH', label: 'Email + SMS' }
                    ].map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, channel: option.value as ReminderTemplate['channel'] })}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                          formData.channel === option.value
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Targeting */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target attendees
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: 'ANY', label: 'Everyone registered' },
                      { value: 'WATCHED_UP_TO', label: 'Left before a point' },
                      { value: 'WATCHED_AT_LEAST', label: 'Watched at least this far' }
                    ].map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            watchTargetType: option.value as WatchTargetType,
                            watchTargetMinutes:
                              option.value === 'ANY'
                                ? 0
                                : formData.watchTargetMinutes || 45
                          })
                        }
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                          formData.watchTargetType === option.value
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {formData.watchTargetType !== 'ANY' && (
                    <div className="mt-3">
                      <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
                        Watch point (minutes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.watchTargetMinutes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            watchTargetMinutes: Math.max(0, parseInt(e.target.value) || 0)
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g. 45"
                      />
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Perfect for SMS nudges — send follow-ups only to attendees who reached (or didn&rsquo;t reach) a key moment in the webinar.
                  </p>
                </div>

                {/* Email Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={formData.emailSubject}
                    onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                    placeholder="Your webinar starts soon!"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Placeholders Helper */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowPlaceholders(!showPlaceholders)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                  >
                    {showPlaceholders ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showPlaceholders ? 'Hide' : 'Show'} Placeholders
                  </button>

                  {showPlaceholders && (
                    <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-3">Available Placeholders:</p>
                      <div className="grid grid-cols-2 gap-3">
                        {placeholders.map((ph, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <div className="flex-1">
                              <code className="text-xs bg-white px-2 py-1 rounded border border-gray-300 text-blue-600 font-mono">
                                {ph.value}
                              </code>
                              <p className="text-xs text-gray-600 mt-1">{ph.description}</p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => insertPlaceholder(ph.value)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Insert into email"
                              >
                                <Send className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => copyPlaceholder(ph.value)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Copy to clipboard"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {(formData.channel === 'SMS' || formData.channel === 'BOTH') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMS Body
                    </label>
                    <textarea
                      id="smsBody"
                      value={formData.smsBody}
                      onChange={(e) => setFormData({ ...formData, smsBody: e.target.value })}
                      placeholder="Hi {{name}}, your webinar {{webinarTitle}} starts soon. Join: {{countdownLink}}"
                      className="w-full min-h-[120px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Keep SMS concise (under 160 characters). All placeholders work here too.
                    </p>
                  </div>
                )}

                {/* Email Body */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Body (HTML)
                  </label>
                  <textarea
                    id="emailBody"
                    value={formData.emailBody}
                    onChange={(e) => setFormData({ ...formData, emailBody: e.target.value })}
                    rows={12}
                    placeholder="<h2>Hi {{name}}!</h2>&#10;<p>Your webinar starts soon...</p>"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can use HTML tags for formatting. Click placeholders above to insert them.
                  </p>
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Active (start sending this reminder immediately)
                  </label>
                </div>

                {/* ClickFunnels Integration */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    ClickFunnels Integration (Optional)
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Enable ClickFunnels Tag */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="applyClickFunnelsTag"
                        checked={formData.applyClickFunnelsTag}
                        onChange={(e) => setFormData({ ...formData, applyClickFunnelsTag: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="applyClickFunnelsTag" className="text-sm font-medium text-gray-700">
                        Apply ClickFunnels tag when reminder is sent
                      </label>
                    </div>

                    {formData.applyClickFunnelsTag && (
                      <>
                        {/* Preset Tag Buttons */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quick Tag Selection
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: '24 Hour', value: '24HRREMINDER' },
                              { label: '2 Hour', value: '2HRREMINDER' },
                              { label: '1 Hour', value: '1HRREMINDER' },
                              { label: '15 Minute', value: '15MINREMINDER' },
                              { label: 'We Started', value: 'WESTARTED' }
                            ].map((tag) => (
                              <button
                                key={tag.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, clickFunnelsTag: tag.value })}
                                className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                                  formData.clickFunnelsTag === tag.value
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {tag.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Custom Tag Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ClickFunnels Tag Name
                          </label>
                          <input
                            type="text"
                            value={formData.clickFunnelsTag}
                            onChange={(e) => setFormData({ ...formData, clickFunnelsTag: e.target.value.toUpperCase() })}
                            placeholder="e.g., 24HRREMINDER, WESTARTED"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            This tag will be applied to the contact in ClickFunnels when the reminder is sent
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {editingId ? 'Update Reminder' : 'Create Reminder'}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        {/* Reminders List */}
        <div className="space-y-4">
          {reminders.length === 0 ? (
            <Card>
              <CardBody>
                <div className="text-center py-12">
                  <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No reminders yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Create your first reminder to start sending automated emails to attendees.
                  </p>
                  <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 mx-auto">
                    <Plus className="h-4 w-4" />
                    Create First Reminder
                  </Button>
                </div>
              </CardBody>
            </Card>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Active Reminders ({reminders.filter(r => r.isActive).length} of {reminders.length})
              </h3>
              {reminders.map((reminder) => (
                <Card key={reminder.id} className={!reminder.isActive ? 'opacity-60' : ''}>
                  <CardBody>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                            reminder.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Clock className="h-4 w-4" />
                            {describeReminderTiming(reminder.minutesBefore, reminder.isPostWebinar, true)}
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-white text-gray-700 border border-gray-200">
                            <Send className="h-4 w-4" />
                            {reminder.channel === 'EMAIL' ? 'Email Only' : reminder.channel === 'SMS' ? 'SMS Only' : 'Email + SMS'}
                          </div>
                          {reminder.isActive ? (
                            <span className="flex items-center gap-1 text-sm text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              Active
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">Inactive</span>
                          )}
                          {reminder.applyClickFunnelsTag && reminder.clickFunnelsTag && (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                              <MessageSquare className="h-4 w-4" />
                              CF Tag: {reminder.clickFunnelsTag}
                            </div>
                          )}
                          {reminder.watchTargetType &&
                            reminder.watchTargetType !== 'ANY' &&
                            reminder.watchTargetSeconds &&
                            reminder.watchTargetSeconds > 0 && (
                              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                                <Info className="h-4 w-4" />
                                {describeWatchTarget(reminder.watchTargetType, reminder.watchTargetSeconds)}
                              </div>
                            )}
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {reminder.emailSubject}
                        </h4>
                        <div className="prose prose-sm max-w-none text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <div dangerouslySetInnerHTML={{ __html: reminder.emailBody.substring(0, 200) + (reminder.emailBody.length > 200 ? '...' : '') }} />
                        </div>
                        {reminder.smsBody && reminder.smsBody.trim().length > 0 && (reminder.channel === 'SMS' || reminder.channel === 'BOTH') && (
                          <p className="text-sm text-gray-500 mt-2 border border-dashed border-gray-200 rounded-lg p-2 bg-white">
                            <span className="font-semibold text-gray-700">SMS preview:</span> {reminder.smsBody.substring(0, 120)}{reminder.smsBody.length > 120 ? '…' : ''}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Updated {new Date(reminder.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleToggleActive(reminder)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title={reminder.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {reminder.isActive ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(reminder)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(reminder.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </>
          )}
        </div>

        {/* Reminder Queue */}
        <div className="mt-10 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Reminder Queue</h3>
              <p className="text-sm text-gray-500">
                See what reminders are pending, sent, failed, or skipped for this webinar.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <span className="font-semibold">{reminderLogs.length || 0}</span>
                records
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchReminderLogs}
                disabled={loadingLogs}
                className="flex items-center gap-2"
              >
                {loadingLogs ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Refreshing
                  </>
                ) : (
                  'Refresh'
                )}
              </Button>
            </div>
          </div>

          {logError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {logError}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {(['PENDING', 'SENT', 'FAILED', 'SKIPPED', 'CANCELLED'] as ReminderLog['status'][]).map(
              (status) => (
                <div
                  key={status}
                  className={`px-4 py-3 rounded-lg border ${statusStyles[status]}`}
                >
                  <p className="text-xs uppercase tracking-wide text-gray-500">{statusLabels[status]}</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {logStats[status] ?? 0}
                  </p>
                </div>
              )
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Scheduled</th>
                    <th className="px-4 py-3">Sent At</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {reminderLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 align-top">
                        <p className="font-semibold text-gray-900">
                          {log.registration.name || log.registration.email}
                        </p>
                        <p className="text-xs text-gray-500">{log.registration.email}</p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {formatDateTime(log.scheduledFor)}
                        <p className="text-xs text-gray-400">
                          {describeReminderTiming(log.template.minutesBefore, log.template.isPostWebinar, true)}
                        </p>
                        {log.template.watchTargetType &&
                          log.template.watchTargetType !== 'ANY' &&
                          log.template.watchTargetSeconds &&
                          log.template.watchTargetSeconds > 0 && (
                            <p className="text-xs text-gray-400">
                              Target: {describeWatchTarget(log.template.watchTargetType, log.template.watchTargetSeconds)}
                            </p>
                          )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {formatDateTime(log.sentAt)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusStyles[log.status]}`}>
                          {statusLabels[log.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {log.channel === 'BOTH' ? 'Email + SMS' : log.channel === 'SMS' ? 'SMS' : 'Email'}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="text-xs text-gray-600">{log.errorMessage || '—'}</p>
                      </td>
                    </tr>
                  ))}
                  {reminderLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                        No reminder activity yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
