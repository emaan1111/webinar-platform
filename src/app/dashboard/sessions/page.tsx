'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { formatInTimeZone } from 'date-fns-tz'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import {
  CalendarClock,
  Users,
  Video,
  Search,
  Download,
  ExternalLink,
  CheckCircle,
  XCircle,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'

interface LinkedWebinar {
  type: string
  id: string | null
  title: string
}

interface ZoomSessionSummary {
  id: string
  name: string
  zoomLink: string | null
  scheduledAt: string
  timezone: string
  notes: string | null
  isActive: boolean
  webinars: LinkedWebinar[]
  registrantCount: number
}

interface Registrant {
  id: string
  source: 'external' | 'internal'
  name: string
  email: string
  phone: string | null
  country: string | null
  timezone: string | null
  registeredAt: string
  attended: boolean
  webinarId: string | null
  webinarTitle: string
}

interface WebinarOption {
  id: string
  title: string
}

const TIMEZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Singapore',
  'Australia/Sydney',
  'UTC',
]

function browserTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
  } catch {
    return 'America/New_York'
  }
}

interface FormState {
  id: string | null
  name: string
  zoomLink: string
  date: string
  time: string
  timezone: string
  notes: string
  external: string[]
  internal: string[]
}

const emptyForm = (): FormState => ({
  id: null,
  name: '',
  zoomLink: '',
  date: '',
  time: '',
  timezone: browserTz(),
  notes: '',
  external: [],
  internal: [],
})

export default function SessionsPage() {
  const [sessions, setSessions] = useState<ZoomSessionSummary[]>([])
  const [loading, setLoading] = useState(true)

  const [selected, setSelected] = useState<ZoomSessionSummary | null>(null)
  const [roster, setRoster] = useState<Registrant[]>([])
  const [rosterLoading, setRosterLoading] = useState(false)
  const [search, setSearch] = useState('')

  const [options, setOptions] = useState<{ external: WebinarOption[]; internal: WebinarOption[] }>({
    external: [],
    internal: [],
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)

  const loadSessions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/zoom-sessions')
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch (err) {
      console.error('Failed to load zoom sessions', err)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSessions()
    fetch('/api/zoom-sessions/webinar-options')
      .then((r) => r.json())
      .then((d) => setOptions({ external: d.external || [], internal: d.internal || [] }))
      .catch(() => {})
  }, [loadSessions])

  const openRoster = useCallback(async (s: ZoomSessionSummary) => {
    setSelected(s)
    setRosterLoading(true)
    setRoster([])
    setSearch('')
    try {
      const res = await fetch(`/api/zoom-sessions/${s.id}`)
      const data = await res.json()
      setRoster(data.roster || [])
    } catch (err) {
      console.error('Failed to load roster', err)
      setRoster([])
    } finally {
      setRosterLoading(false)
    }
  }, [])

  const fmtSessionTime = (iso: string, tz: string) => {
    try {
      return formatInTimeZone(new Date(iso), tz, "EEE, MMM d, yyyy · h:mm a zzz")
    } catch {
      return new Date(iso).toLocaleString()
    }
  }

  const fmtRegistered = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    })

  // ---------- Create / edit ----------
  const openCreate = () => {
    setForm(emptyForm())
    setModalOpen(true)
  }

  const openEdit = (s: ZoomSessionSummary) => {
    setForm({
      id: s.id,
      name: s.name,
      zoomLink: s.zoomLink || '',
      date: formatInTimeZone(new Date(s.scheduledAt), s.timezone, 'yyyy-MM-dd'),
      time: formatInTimeZone(new Date(s.scheduledAt), s.timezone, 'HH:mm'),
      timezone: s.timezone,
      notes: s.notes || '',
      external: s.webinars.filter((w) => w.type === 'external' && w.id).map((w) => w.id as string),
      internal: s.webinars.filter((w) => w.type === 'internal' && w.id).map((w) => w.id as string),
    })
    setModalOpen(true)
  }

  const toggle = (list: 'external' | 'internal', id: string) => {
    setForm((f) => {
      const arr = f[list]
      return { ...f, [list]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] }
    })
  }

  const saveSession = async () => {
    if (!form.name.trim() || !form.date || !form.time) {
      alert('Name, date and time are required.')
      return
    }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      zoomLink: form.zoomLink.trim(),
      date: form.date,
      time: form.time,
      timezone: form.timezone,
      notes: form.notes.trim(),
      webinars: [
        ...form.external.map((id) => ({ type: 'external', id })),
        ...form.internal.map((id) => ({ type: 'internal', id })),
      ],
    }
    try {
      const res = await fetch(form.id ? `/api/zoom-sessions/${form.id}` : '/api/zoom-sessions', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('save failed')
      setModalOpen(false)
      await loadSessions()
      if (selected && form.id === selected.id) {
        const refreshed = (await (await fetch('/api/zoom-sessions')).json()).sessions?.find(
          (x: ZoomSessionSummary) => x.id === form.id
        )
        if (refreshed) openRoster(refreshed)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to save the session.')
    } finally {
      setSaving(false)
    }
  }

  const deleteSession = async (s: ZoomSessionSummary) => {
    if (!confirm(`Delete Zoom session "${s.name}"? This does not delete any registrations.`)) return
    try {
      await fetch(`/api/zoom-sessions/${s.id}`, { method: 'DELETE' })
      if (selected?.id === s.id) setSelected(null)
      await loadSessions()
    } catch (err) {
      console.error(err)
      alert('Failed to delete.')
    }
  }

  // ---------- Roster ----------
  const filteredRoster = search.trim()
    ? roster.filter((r) =>
        [r.name, r.email, r.phone]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(search.trim().toLowerCase()))
      )
    : roster

  const exportCSV = () => {
    if (!selected || filteredRoster.length === 0) return
    const esc = (v: string) => {
      if (v == null) return ''
      const s = String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const headers = ['Name', 'Email', 'Phone', 'Webinar', 'Source', 'Country', 'Registered At', 'Attended']
    const rows = filteredRoster.map((r) =>
      [r.name, r.email, r.phone || '', r.webinarTitle, r.source, r.country || '', fmtRegistered(r.registeredAt), r.attended ? 'Yes' : 'No']
        .map((v) => esc(String(v)))
        .join(',')
    )
    const csv = [headers.map(esc).join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zoom-session-${selected.name.toLowerCase().replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarClock className="w-6 h-6 text-blue-600" />
              Zoom Sessions
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create a Zoom session, link it to webinars, and see everyone registered for that time in one place.
            </p>
          </div>
          <Button onClick={openCreate} className="self-start">
            <Plus className="w-4 h-4 mr-2" />
            New Zoom Session
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Session list */}
          <div className="lg:col-span-2 space-y-3">
            {loading ? (
              <Card>
                <CardBody className="py-12 text-center text-gray-500">Loading…</CardBody>
              </Card>
            ) : sessions.length === 0 ? (
              <Card>
                <CardBody className="py-12 text-center text-gray-500">
                  No Zoom sessions yet. Click <span className="font-medium">New Zoom Session</span> to create one.
                </CardBody>
              </Card>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className={`w-full text-left rounded-xl border transition-all bg-white ${
                    selected?.id === s.id
                      ? 'border-blue-500 ring-2 ring-blue-100'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <button onClick={() => openRoster(s)} className="w-full text-left p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-gray-900">{s.name}</div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-blue-700">
                      <CalendarClock className="w-4 h-4" />
                      {fmtSessionTime(s.scheduledAt, s.timezone)}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        {s.registrantCount} registered
                      </span>
                      <span className="text-gray-400">·</span>
                      <span>{s.webinars.length} webinar{s.webinars.length === 1 ? '' : 's'}</span>
                      {s.zoomLink && (
                        <span className="inline-flex items-center gap-1 text-blue-600">
                          <Video className="w-3.5 h-3.5" /> Zoom
                        </span>
                      )}
                    </div>
                    {s.webinars.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {s.webinars.map((w) => (
                          <span
                            key={`${w.type}-${w.id}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs"
                            title={`${w.type} · ${w.title}`}
                          >
                            <span className="max-w-[150px] truncate">{w.title}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                  <div className="flex items-center gap-2 px-4 pb-3 -mt-1">
                    <button onClick={() => openEdit(s)} className="text-xs text-gray-500 hover:text-blue-600 inline-flex items-center gap-1">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => deleteSession(s)} className="text-xs text-gray-500 hover:text-red-600 inline-flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Roster */}
          <div className="lg:col-span-3">
            {!selected ? (
              <Card>
                <CardBody className="py-20 text-center text-gray-400">
                  <CalendarClock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  Select a Zoom session to see everyone registered for that time.
                </CardBody>
              </Card>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-gray-900">{selected.name}</h2>
                      <p className="text-sm text-gray-500">
                        {fmtSessionTime(selected.scheduledAt, selected.timezone)} · {filteredRoster.length} registrant
                        {filteredRoster.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <Button variant="secondary" onClick={exportCSV} disabled={filteredRoster.length === 0}>
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>

                  {selected.zoomLink && (
                    <div className="mt-3">
                      <a
                        href={selected.zoomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        <Video className="w-3.5 h-3.5" /> Join / view Zoom link <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  <div className="mt-3 relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name, email, or phone…"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {rosterLoading ? (
                    <div className="py-12 text-center text-gray-500">Loading registrants…</div>
                  ) : filteredRoster.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                      No registrants match this session's time across the linked webinars.
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-100">
                          <th className="px-4 py-3 font-medium">Name</th>
                          <th className="px-4 py-3 font-medium">Webinar</th>
                          <th className="px-4 py-3 font-medium">Registered</th>
                          <th className="px-4 py-3 font-medium">Attended</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredRoster.map((r) => (
                          <tr key={`${r.source}-${r.id}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{r.name}</div>
                              <div className="text-gray-500">{r.email}</div>
                              {r.phone && <div className="text-gray-400 text-xs">{r.phone}</div>}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              <span className="max-w-[170px] truncate inline-block align-bottom" title={r.webinarTitle}>
                                {r.webinarTitle}
                              </span>
                              <span className="ml-1 text-[10px] uppercase text-gray-400">{r.source}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtRegistered(r.registeredAt)}</td>
                            <td className="px-4 py-3">
                              {r.attended ? (
                                <span className="inline-flex items-center gap-1 text-green-600">
                                  <CheckCircle className="w-4 h-4" /> Yes
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-gray-400">
                                  <XCircle className="w-4 h-4" /> No
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create / edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                {form.id ? 'Edit Zoom Session' : 'New Zoom Session'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Saturday 11 AM Live"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zoom link</label>
                <input
                  type="url"
                  value={form.zoomLink}
                  onChange={(e) => setForm({ ...form, zoomLink: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone *</label>
                  <select
                    value={form.timezone}
                    onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    {[...new Set([form.timezone, ...TIMEZONES])].map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500 -mt-2">
                Set this to the exact time registrants picked — the roster matches registrations at this instant.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Linked webinars</label>
                <div className="border border-gray-200 rounded-lg max-h-56 overflow-y-auto divide-y divide-gray-50">
                  {options.external.length > 0 && (
                    <div className="p-2">
                      <div className="text-[10px] uppercase tracking-wide text-gray-400 px-1 pb-1">External webinars</div>
                      {options.external.map((w) => (
                        <label key={w.id} className="flex items-center gap-2 px-1 py-1.5 text-sm cursor-pointer hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            checked={form.external.includes(w.id)}
                            onChange={() => toggle('external', w.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-800">{w.title}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {options.internal.length > 0 && (
                    <div className="p-2">
                      <div className="text-[10px] uppercase tracking-wide text-gray-400 px-1 pb-1">Internal webinars</div>
                      {options.internal.map((w) => (
                        <label key={w.id} className="flex items-center gap-2 px-1 py-1.5 text-sm cursor-pointer hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            checked={form.internal.includes(w.id)}
                            onChange={() => toggle('internal', w.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-800">{w.title}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {options.external.length === 0 && options.internal.length === 0 && (
                    <div className="p-3 text-sm text-gray-400">No webinars found.</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveSession} disabled={saving}>
                {saving ? 'Saving…' : form.id ? 'Save changes' : 'Create session'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
