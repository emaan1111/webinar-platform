'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Download, RefreshCw, Loader2 } from 'lucide-react'

// yyyy-MM-dd from the reports table is already the viewer's local date - parse
// the parts so the header doesn't shift a day against the row it came from.
const formatDateLabel = (value: string) => {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString()
}

export default function ReportDetailsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const date = searchParams.get('date')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const metric = searchParams.get('metric')
  const webinarIds = searchParams.get('webinarIds')
  const timezone = searchParams.get('timezone')
  const engagementMinutes = searchParams.get('engagementMinutes')
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if ((date || (startDate && endDate)) && metric) {
      fetchDetails()
    }
  }, [date, startDate, endDate, metric, webinarIds, timezone, engagementMinutes])

  const fetchDetails = async () => {
    setLoading(true)
    setError('')
    try {
      let url = `/api/reports/details?metric=${metric}`
      if (date) url += `&date=${date}`
      else if (startDate && endDate) url += `&startDate=${startDate}&endDate=${endDate}`

      if (webinarIds) url += `&webinarIds=${webinarIds}`
      // Fall back to the browser zone for links saved before these params existed.
      url += `&timezone=${encodeURIComponent(timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)}`
      if (engagementMinutes) url += `&engagementMinutes=${engagementMinutes}`
      
      const response = await fetch(url)
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to fetch details')
      }
    } catch (err) {
      console.error('Error fetching details:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
     if (data.length === 0) return
     
     const headers = [
        'Name',
        'Email',
        'Phone',
        'Timezone',
        'Webinar',
        'Date Registered',
        'Date Attended',
        'Status',
        'Twatched Time',
        'Seconds Watched',
        'Saw Offer',
        'Replay Watched',
        'Left At',
        'Last Position',
        'Chats',
        'Reactions'
     ]
     
     // Helper function to escape CSV values (handles commas, quotes, and newlines)
     const escapeCSVValue = (val: string): string => {
       if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
         return `"${val.replace(/"/g, '""')}"`
       }
       return val
     }

     const rows = data.map(row => [
        escapeCSVValue(row.name || ''),
        escapeCSVValue(row.email || ''),
        escapeCSVValue(row.phone || ''),
        escapeCSVValue(row.timezone || ''),
        escapeCSVValue(row.webinarTitle || ''),
        escapeCSVValue(new Date(row.registeredAt).toLocaleString()),
        escapeCSVValue(row.attendedAt ? new Date(row.attendedAt).toLocaleString() : '-'),
        escapeCSVValue(row.status || ''),
        escapeCSVValue(String(row.totalTimeStayed || '')),
        escapeCSVValue(String(row.totalTimeSeconds || '')),
        escapeCSVValue(String(row.sawOffer || '')),
        escapeCSVValue(String(row.replayWatched || '')),
        escapeCSVValue(row.leftAt ? new Date(row.leftAt).toLocaleString() : '-'),
        escapeCSVValue(String(row.lastWatchedPosition || '')),
        escapeCSVValue(String(row.chatCount || '')),
        escapeCSVValue(String(row.reactionCount || ''))
     ])
     
     const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
     const blob = new Blob([csvContent], { type: 'text/csv' })
     const url = URL.createObjectURL(blob)
     const a = document.createElement('a')
     a.href = url
     a.download = `report-details-${metric}-${date}.csv`
     a.click()
  }

  const getMetricLabel = (m: string) => {
      const labels: Record<string, string> = {
          'registrations': 'Registrations',
          'totalAttendees': 'Total Attendees',
          'liveAttendees': 'Live Attendees',
          'replayAttendees': 'Replay Attendees',
          'engagedTotal': 'Engaged Users (Total)',
          'engagedLive': 'Engaged Users (Live)',
          'engagedReplay': 'Engaged Users (Replay)',
          'salesTotal': 'Sales (Total)',
          'salesLive': 'Sales (Live)',
          'salesReplay': 'Sales (Replay)',
          'pastRegistrationCount': 'Eligible Past Registrations'
      }
      return labels[m] || m
  }

  if ((!date && (!startDate || !endDate)) || !metric) {
      return (
          <DashboardLayout>
              <div className="p-8 text-center bg-yellow-50 rounded-lg">
                  <p className="text-yellow-700">Missing parameters. Please navigate here from the Reports page.</p>
                  <Link href="/dashboard/reports">
                    <Button variant="secondary" className="mt-4">Go Back</Button>
                  </Link>
              </div>
          </DashboardLayout>
      )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="sm" onClick={() => router.back()}>
                 <ArrowLeft className="w-4 h-4 mr-2" />
                 Back
             </Button>
             <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    {getMetricLabel(metric)}
                </h1>
                <p className="text-sm text-gray-500">
                    Breakdown for {date ? formatDateLabel(date) : `${formatDateLabel(startDate!)} - ${formatDateLabel(endDate!)}`} • {data.length} records
                </p>
             </div>
          </div>
          <div className="flex gap-2">
             <Button variant="secondary" onClick={fetchDetails} disabled={loading}>
                 <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                 Refresh
             </Button>
             <Button variant="primary" onClick={exportToCSV} disabled={data.length === 0}>
                 <Download className="w-4 h-4 mr-2" />
                 Export CSV
             </Button>
          </div>
        </div>

        {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
                {error}
            </div>
        )}

        {/* Table */}
        <Card>
            <CardBody className="p-0 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attended</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Watch Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                    Loading details...
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    No records found for this metric.
                                </td>
                            </tr>
                        ) : (
                            data.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{row.name}</div>
                                        <div className="text-sm text-gray-500">{row.email}</div>
                                        {row.phone && <div className="text-xs text-gray-400">{row.phone}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${row.status === 'Attended Live' ? 'bg-green-100 text-green-800' : 
                                              row.status === 'Watched Replay' ? 'bg-purple-100 text-purple-800' : 
                                              row.status === 'Missed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {row.status}
                                        </span>
                                        <div className="text-xs text-gray-400 mt-1">{row.timezone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(row.registeredAt).toLocaleDateString()} <br/>
                                        <span className="text-xs">{new Date(row.registeredAt).toLocaleTimeString()}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {row.attendedAt ? (
                                            <>
                                            {new Date(row.attendedAt).toLocaleDateString()} <br/>
                                            <span className="text-xs">{new Date(row.attendedAt).toLocaleTimeString()}</span>
                                            </>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="font-medium text-gray-900">{row.totalTimeStayed}</div>
                                        <div className="text-xs text-gray-400">Position: {row.lastWatchedPosition}</div>
                                        {row.leftAt && <div className="text-xs text-red-300">Left: {new Date(row.leftAt).toLocaleTimeString()}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex flex-col gap-1">
                                           <span title="Chats">💬 {row.chatCount}</span>
                                           <span title="Reactions">❤️ {row.reactionCount}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex flex-col gap-1">
                                            <span>Offer Seen: {row.sawOffer}</span>
                                            <span>Replay: {row.replayWatched}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  )
}
