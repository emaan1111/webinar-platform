'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
  RefreshCw,
} from 'lucide-react'

interface SessionWebinar {
  id: string
  title: string
  count: number
}

interface SessionSummary {
  time: string
  total: number
  isZoom: boolean
  webinarCount: number
  webinars: SessionWebinar[]
  zoomLinks: string[]
}

interface Registrant {
  id: string
  name: string
  email: string
  phone: string | null
  country: string | null
  timezone: string | null
  registeredAt: string
  attended: boolean
  webinarId: string | null
  webinarTitle: string
  zoomLink: string | null
}

type Range = 'upcoming' | 'past' | 'all'

export default function SessionsPage() {
  const [range, setRange] = useState<Range>('upcoming')
  const [zoomOnly, setZoomOnly] = useState(true)
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)

  const [selected, setSelected] = useState<SessionSummary | null>(null)
  const [registrants, setRegistrants] = useState<Registrant[]>([])
  const [rosterLoading, setRosterLoading] = useState(false)
  const [search, setSearch] = useState('')

  const loadSessions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ range, zoomOnly: String(zoomOnly) })
      const res = await fetch(`/api/sessions?${params.toString()}`)
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch (err) {
      console.error('Failed to load sessions', err)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [range, zoomOnly])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const openRoster = useCallback(
    async (sessionItem: SessionSummary) => {
      setSelected(sessionItem)
      setRosterLoading(true)
      setRegistrants([])
      try {
        const params = new URLSearchParams({
          time: sessionItem.time,
          zoomOnly: String(zoomOnly),
        })
        const res = await fetch(`/api/sessions?${params.toString()}`)
        const data = await res.json()
        setRegistrants(data.registrants || [])
      } catch (err) {
        console.error('Failed to load roster', err)
        setRegistrants([])
      } finally {
        setRosterLoading(false)
      }
    },
    [zoomOnly]
  )

  const formatSessionTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    })
  }

  const formatDateTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const filteredRegistrants = search.trim()
    ? registrants.filter((r) =>
        [r.name, r.email, r.phone]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(search.trim().toLowerCase()))
      )
    : registrants

  const handleExportCSV = () => {
    if (!selected || filteredRegistrants.length === 0) return
    const escape = (val: string) => {
      if (val == null) return ''
      const needsQuotes = /[",\n]/.test(val)
      const escaped = val.replace(/"/g, '""')
      return needsQuotes ? `"${escaped}"` : escaped
    }
    const headers = ['Name', 'Email', 'Phone', 'Webinar', 'Country', 'Timezone', 'Registered At', 'Attended']
    const rows = filteredRegistrants.map((r) =>
      [
        r.name,
        r.email,
        r.phone || '',
        r.webinarTitle,
        r.country || '',
        r.timezone || '',
        formatDateTime(r.registeredAt),
        r.attended ? 'Yes' : 'No',
      ]
        .map((v) => escape(String(v)))
        .join(',')
    )
    const csv = [headers.map(escape).join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const stamp = new Date(selected.time).toISOString().slice(0, 16).replace(/[:T]/g, '-')
    a.download = `session-${stamp}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const RangeTab = ({ value, label }: { value: Range; label: string }) => (
    <button
      onClick={() => setRange(value)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        range === value ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarClock className="w-6 h-6 text-blue-600" />
              Sessions
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Everyone registered for the same session time, combined across all webinars.
            </p>
          </div>
          <Button variant="secondary" onClick={loadSessions} className="self-start">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            <RangeTab value="upcoming" label="Upcoming" />
            <RangeTab value="past" label="Past" />
            <RangeTab value="all" label="All" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={zoomOnly}
              onChange={(e) => setZoomOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Zoom sessions only
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Session list */}
          <div className="lg:col-span-2 space-y-3">
            {loading ? (
              <Card>
                <CardBody className="py-12 text-center text-gray-500">Loading sessions…</CardBody>
              </Card>
            ) : sessions.length === 0 ? (
              <Card>
                <CardBody className="py-12 text-center text-gray-500">
                  No {range !== 'all' ? range : ''} sessions found.
                </CardBody>
              </Card>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.time}
                  onClick={() => openRoster(s)}
                  className={`w-full text-left rounded-xl border transition-all ${
                    selected?.time === s.time
                      ? 'border-blue-500 ring-2 ring-blue-100 bg-white'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 font-semibold text-gray-900">
                        <CalendarClock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        {formatSessionTime(s.time)}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        {s.total} registered
                      </span>
                      <span className="text-gray-400">·</span>
                      <span>
                        {s.webinarCount} webinar{s.webinarCount === 1 ? '' : 's'}
                      </span>
                      {s.isZoom && (
                        <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                          <Video className="w-3.5 h-3.5" />
                          Zoom
                        </span>
                      )}
                    </div>
                    {s.webinars.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {s.webinars.map((w) => (
                          <span
                            key={w.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs"
                            title={w.title}
                          >
                            <span className="max-w-[140px] truncate">{w.title}</span>
                            <span className="font-semibold text-gray-500">{w.count}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Roster */}
          <div className="lg:col-span-3">
            {!selected ? (
              <Card>
                <CardBody className="py-20 text-center text-gray-400">
                  <CalendarClock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  Select a session to see everyone registered for that time.
                </CardBody>
              </Card>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h2 className="font-semibold text-gray-900">{formatSessionTime(selected.time)}</h2>
                        <p className="text-sm text-gray-500">
                          {filteredRegistrants.length} registrant{filteredRegistrants.length === 1 ? '' : 's'}
                          {' '}across {selected.webinarCount} webinar{selected.webinarCount === 1 ? '' : 's'}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={handleExportCSV}
                        disabled={filteredRegistrants.length === 0}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>

                    {selected.zoomLinks.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selected.zoomLinks.map((link, i) => (
                          <a
                            key={link}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                          >
                            <Video className="w-3.5 h-3.5" />
                            Zoom link{selected.zoomLinks.length > 1 ? ` ${i + 1}` : ''}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
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
                    ) : filteredRegistrants.length === 0 ? (
                      <div className="py-12 text-center text-gray-500">No registrants found.</div>
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
                          {filteredRegistrants.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">{r.name}</div>
                                <div className="text-gray-500">{r.email}</div>
                                {r.phone && <div className="text-gray-400 text-xs">{r.phone}</div>}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                <span className="max-w-[180px] truncate inline-block align-bottom" title={r.webinarTitle}>
                                  {r.webinarTitle}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                {formatDateTime(r.registeredAt)}
                              </td>
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
    </DashboardLayout>
  )
}
