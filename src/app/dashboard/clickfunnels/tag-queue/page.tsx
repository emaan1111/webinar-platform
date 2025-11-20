'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Calendar,
  User,
  Mail,
  Tag as TagIcon,
  Filter,
  AlertCircle
} from 'lucide-react'

interface ClickFunnelsTag {
  id: string
  registrationId: string
  tagName: string
  scheduledFor: string
  status: 'PENDING' | 'APPLIED' | 'FAILED'
  appliedAt?: string
  errorMessage?: string
  createdAt: string
  registration: {
    id: string
    name: string
    email: string
    scheduleId?: string
    scheduledStartTime?: string
    webinar: {
      id: string
      title: string
    }
  }
}

interface Stats {
  total: number
  pending: number
  applied: number
  failed: number
}

interface Webinar {
  id: string
  title: string
}

interface AttendanceTagRegistration {
  id: string
  name: string
  email: string
  attended: boolean
  lastWatchedPosition: number
  scheduledStartTime: string
  attendanceTagsApplied: boolean
  attendanceTagsAppliedAt?: string
  webinar: {
    id: string
    title: string
    duration: number
    mostlyAttendedThreshold?: number
  }
}

export default function ClickFunnelsTagQueuePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'reminders' | 'attendance'>('reminders')
  const [tags, setTags] = useState<ClickFunnelsTag[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, applied: 0, failed: 0 })
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [webinarFilter, setWebinarFilter] = useState('')
  
  // Attendance tab state
  const [attendanceRegistrations, setAttendanceRegistrations] = useState<AttendanceTagRegistration[]>([])
  const [attendanceStats, setAttendanceStats] = useState({ 
    totalEnded: 0, 
    tagged: 0, 
    pendingTagging: 0,
    willEndSoon: 0
  })
  const [attendanceFilter, setAttendanceFilter] = useState('all') // all, pending, tagged

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      if (activeTab === 'reminders') {
        fetchTags()
      } else {
        fetchAttendanceRegistrations()
      }
    }
  }, [status, statusFilter, webinarFilter, activeTab, attendanceFilter])

  const fetchTags = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (webinarFilter) params.append('webinarId', webinarFilter)
      
      const response = await fetch(`/api/clickfunnels/tag-queue?${params}`)
      const data = await response.json()
      
      setTags(data.tags || [])
      setStats(data.stats || { total: 0, pending: 0, applied: 0, failed: 0 })
      setWebinars(data.webinars || [])
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceRegistrations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (attendanceFilter !== 'all') params.append('filter', attendanceFilter)
      if (webinarFilter) params.append('webinarId', webinarFilter)
      
      const response = await fetch(`/api/clickfunnels/attendance-queue?${params}`)
      const data = await response.json()
      
      setAttendanceRegistrations(data.registrations || [])
      setAttendanceStats(data.stats || { totalEnded: 0, tagged: 0, pendingTagging: 0, willEndSoon: 0 })
      setWebinars(data.webinars || [])
    } catch (error) {
      console.error('Failed to fetch attendance registrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    if (activeTab === 'reminders') {
      await fetchTags()
    } else {
      await fetchAttendanceRegistrations()
    }
    setRefreshing(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'APPLIED':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APPLIED: 'bg-green-100 text-green-800 border-green-200',
      FAILED: 'bg-red-100 text-red-800 border-red-200'
    }
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    )
  }

  const getTagBadge = (tagName: string) => {
    const styles = {
      '24HRREMINDER': 'bg-blue-100 text-blue-800',
      '2HRREMINDER': 'bg-indigo-100 text-indigo-800',
      '1HRREMINDER': 'bg-purple-100 text-purple-800',
      '15MINREMINDER': 'bg-pink-100 text-pink-800',
      'WESTARTED': 'bg-green-100 text-green-800'
    }
    
    const displayNames = {
      '24HRREMINDER': '24 Hour',
      '2HRREMINDER': '2 Hour',
      '1HRREMINDER': '1 Hour',
      '15MINREMINDER': '15 Min',
      'WESTARTED': 'Started'
    }
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[tagName as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {displayNames[tagName as keyof typeof displayNames] || tagName}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const isOverdue = (scheduledFor: string, status: string) => {
    if (status !== 'PENDING') return false
    return new Date(scheduledFor) < new Date()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tag queue...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ClickFunnels Tag Queue</h1>
                <p className="text-sm text-gray-600 mt-1">Monitor tag application status for all registrations</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 inline-flex">
          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-6 py-2 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'reminders'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Reminder Tags
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-6 py-2 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'attendance'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Post-Webinar Attendance Tags
          </button>
        </div>
      </div>

      {/* Reminder Tags Tab */}
      {activeTab === 'reminders' && (
        <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">How the Tag Queue Works</h3>
              <p className="text-sm text-blue-800 mb-2">
                Tags are scheduled based on when registrants signed up and when the webinar starts. 
                A cron job runs every 5 minutes to apply tags that are due.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-blue-700">
                <div>
                  <strong>PENDING (Future):</strong> Tag scheduled for future time
                </div>
                <div>
                  <strong>PENDING (Overdue):</strong> Will apply in next cron run (~5 min)
                </div>
                <div>
                  <strong>APPLIED:</strong> Successfully tagged in ClickFunnels
                </div>
                <div>
                  <strong>FAILED:</strong> Error occurred (check error message)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Tags</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <TagIcon className="w-10 h-10 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 mb-1">Applied</p>
                <p className="text-3xl font-bold text-green-600">{stats.applied}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 mb-1">Failed</p>
                <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPLIED">Applied</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Webinar</label>
                <select
                  value={webinarFilter}
                  onChange={(e) => setWebinarFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Webinars</option>
                  {webinars.map((webinar) => (
                    <option key={webinar.id} value={webinar.id}>
                      {webinar.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tags Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {tags.length === 0 ? (
            <div className="text-center py-12">
              <TagIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tags found</h3>
              <p className="text-gray-600">
                {statusFilter !== 'all' || webinarFilter 
                  ? 'Try adjusting your filters' 
                  : 'Tags will appear here when registrations are created'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Webinar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tag
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Scheduled For
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Applied At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tags.map((tag) => (
                    <tr 
                      key={tag.id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        isOverdue(tag.scheduledFor, tag.status) ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <User className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{tag.registration.name}</p>
                            <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                              <Mail className="w-3 h-3" />
                              {tag.registration.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{tag.registration.webinar.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        {getTagBadge(tag.tagName)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-900">{formatDate(tag.scheduledFor)}</p>
                            {isOverdue(tag.scheduledFor, tag.status) ? (
                              <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                                <span className="inline-block w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                                Overdue - Will process in next cron run
                              </p>
                            ) : tag.status === 'PENDING' ? (
                              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                In {Math.ceil((new Date(tag.scheduledFor).getTime() - Date.now()) / (1000 * 60))} minutes
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(tag.status)}
                          {getStatusBadge(tag.status)}
                        </div>
                        {tag.errorMessage && (
                          <p className="text-xs text-red-600 mt-2 max-w-xs">{tag.errorMessage}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {tag.appliedAt ? (
                          <p className="text-sm text-gray-900">{formatDate(tag.appliedAt)}</p>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-2">How it works</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Tags are queued when someone registers for a webinar</li>
                <li>• The cron job runs every 5 minutes to apply overdue tags</li>
                <li>• <strong>PENDING</strong> = Tag is queued and waiting for scheduled time</li>
                <li>• <strong>APPLIED</strong> = Tag was successfully applied to ClickFunnels</li>
                <li>• <strong>FAILED</strong> = Tag application failed (check error message)</li>
                <li>• Overdue tags are highlighted in red and will be processed on next cron run</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Post-Webinar Attendance Tags Tab */}
      {activeTab === 'attendance' && (
        <AttendanceTagsTab
          registrations={attendanceRegistrations}
          stats={attendanceStats}
          webinars={webinars}
          attendanceFilter={attendanceFilter}
          webinarFilter={webinarFilter}
          setAttendanceFilter={setAttendanceFilter}
          setWebinarFilter={setWebinarFilter}
        />
      )}
    </div>
  )
}

// Attendance Tags Tab Component
function AttendanceTagsTab({
  registrations,
  stats,
  webinars,
  attendanceFilter,
  webinarFilter,
  setAttendanceFilter,
  setWebinarFilter
}: {
  registrations: AttendanceTagRegistration[]
  stats: { totalEnded: number; tagged: number; pendingTagging: number; willEndSoon: number }
  webinars: Webinar[]
  attendanceFilter: string
  webinarFilter: string
  setAttendanceFilter: (filter: string) => void
  setWebinarFilter: (filter: string) => void
}) {
  const getSessionEndTime = (scheduledStartTime: string, duration: number) => {
    const start = new Date(scheduledStartTime)
    return new Date(start.getTime() + duration * 60 * 1000)
  }

  const hasSessionEnded = (scheduledStartTime: string, duration: number) => {
    return getSessionEndTime(scheduledStartTime, duration) < new Date()
  }

  const getExpectedTag = (reg: AttendanceTagRegistration) => {
    if (!reg.attended) return 'MISSED'
    if (!reg.webinar.mostlyAttendedThreshold) return 'ATTENDED'
    if (reg.lastWatchedPosition >= reg.webinar.mostlyAttendedThreshold) return 'MOSTLY_ATTENDED'
    return 'PARTLY_ATTENDED'
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <>
      {/* Info Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-purple-900 mb-1">Post-Webinar Attendance Tagging</h3>
              <p className="text-sm text-purple-800 mb-2">
                After each user's webinar session ends, tags are applied based on their watch time. 
                A cron job runs every 15 minutes to process ended sessions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-purple-700">
                <div>
                  <strong>MISSED:</strong> Registered but never attended
                </div>
                <div>
                  <strong>ATTENDED:</strong> Attended (any amount, no threshold set)
                </div>
                <div>
                  <strong>MOSTLY_ATTENDED:</strong> Watched past threshold timestamp
                </div>
                <div>
                  <strong>PARTLY_ATTENDED:</strong> Attended but didn't reach threshold
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Sessions Ended</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalEnded}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 mb-1">Already Tagged</p>
                <p className="text-3xl font-bold text-green-600">{stats.tagged}</p>
              </div>
              <TagIcon className="w-10 h-10 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 mb-1">Pending Tagging</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingTagging}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 mb-1">Will End Soon</p>
                <p className="text-3xl font-bold text-blue-600">{stats.willEndSoon}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={attendanceFilter}
                  onChange={(e) => setAttendanceFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Registrations</option>
                  <option value="pending">Pending Tagging (Sessions Ended)</option>
                  <option value="tagged">Already Tagged</option>
                  <option value="upcoming">Will End Soon (Next 2 hours)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Webinar</label>
                <select
                  value={webinarFilter}
                  onChange={(e) => setWebinarFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Webinars</option>
                  {webinars.map((webinar) => (
                    <option key={webinar.id} value={webinar.id}>
                      {webinar.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {registrations.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No registrations found</h3>
              <p className="text-gray-600">
                {attendanceFilter !== 'all' || webinarFilter 
                  ? 'Try adjusting your filters' 
                  : 'Registrations will appear here when users sign up'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Webinar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Session End Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Watch Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Expected Tag
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tag Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {registrations.map((reg) => {
                    const sessionEnded = hasSessionEnded(reg.scheduledStartTime, reg.webinar.duration)
                    const sessionEndTime = getSessionEndTime(reg.scheduledStartTime, reg.webinar.duration)
                    const expectedTag = getExpectedTag(reg)
                    
                    return (
                      <tr 
                        key={reg.id} 
                        className={`hover:bg-gray-50 transition-colors ${
                          sessionEnded && !reg.attendanceTagsApplied ? 'bg-yellow-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{reg.name}</p>
                              <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                                <Mail className="w-3 h-3" />
                                {reg.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm text-gray-900">{reg.webinar.title}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Duration: {reg.webinar.duration} min
                              {reg.webinar.mostlyAttendedThreshold && (
                                <> • Threshold: {formatTime(reg.webinar.mostlyAttendedThreshold)}</>
                              )}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-900">{formatDate(sessionEndTime.toISOString())}</p>
                              {!sessionEnded ? (
                                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  In {Math.ceil((sessionEndTime.getTime() - Date.now()) / (1000 * 60))} minutes
                                </p>
                              ) : reg.attendanceTagsApplied ? (
                                <p className="text-xs text-green-600 mt-1">
                                  ✓ Session ended
                                </p>
                              ) : (
                                <p className="text-xs text-yellow-600 font-semibold mt-1 flex items-center gap-1">
                                  <span className="inline-block w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></span>
                                  Ended - Will tag in next cron run
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            {reg.attended ? (
                              <>
                                <p className="text-sm font-medium text-gray-900">
                                  {formatTime(reg.lastWatchedPosition)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  ({((reg.lastWatchedPosition / (reg.webinar.duration * 60)) * 100).toFixed(0)}% watched)
                                </p>
                              </>
                            ) : (
                              <span className="text-sm text-red-600 font-medium">Never Attended</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            expectedTag === 'MISSED' ? 'bg-red-100 text-red-800' :
                            expectedTag === 'MOSTLY_ATTENDED' ? 'bg-green-100 text-green-800' :
                            expectedTag === 'PARTLY_ATTENDED' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {expectedTag.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {reg.attendanceTagsApplied ? (
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium text-green-700">Tagged</span>
                              </div>
                              {reg.attendanceTagsAppliedAt && (
                                <p className="text-xs text-gray-500">
                                  {formatDate(reg.attendanceTagsAppliedAt)}
                                </p>
                              )}
                            </div>
                          ) : sessionEnded ? (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm font-medium text-yellow-700">Pending</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Session not ended</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-purple-900 mb-2">How it works</h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Each registration has a personal session (scheduledStartTime + webinar duration)</li>
                <li>• After session ends, cron job (runs every 15 min) applies attendance tag</li>
                <li>• Tag is based on total watch time vs threshold (if configured)</li>
                <li>• <strong>MISSED</strong> = Registered but never joined</li>
                <li>• <strong>ATTENDED</strong> = Joined (no threshold set)</li>
                <li>• <strong>MOSTLY_ATTENDED</strong> = Watched past threshold timestamp</li>
                <li>• <strong>PARTLY_ATTENDED</strong> = Attended but didn't reach threshold</li>
                <li>• Each registration tagged only once (prevents duplicates when users leave/rejoin)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
