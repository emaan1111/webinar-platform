'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  Calendar,
  Clock,
  Users,
  PlayCircle,
  Video,
  MessageSquare,
  Gift,
  ThumbsUp,
  Globe,
  Loader2,
  AlertCircle,
  HelpCircle
} from 'lucide-react'

interface WebinarSchedule {
  id: string
  scheduleType: string
  scheduledAt?: string
  timezone?: string
  minutesFromReg?: number
  recurringPattern?: string
  isActive: boolean
}

interface Webinar {
  id: string
  slug?: string | null
  title: string
  description: string
  duration: number
  status: string
  thumbnail?: string | null
  vimeoVideoId?: string | null
  videoUrl?: string | null
  videoDuration?: number | null
  hasReplay: boolean
  hasOffers: boolean
  hasChat: boolean
  hasReactions: boolean
  maxSchedulesToShow?: number
  schedules: WebinarSchedule[]
  registrations?: Array<{ id: string; attended: boolean }>
  createdAt: string
  updatedAt: string
}

export default function ViewWebinarPage() {
  const params = useParams()
  const router = useRouter()
  const [webinar, setWebinar] = useState<Webinar | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchWebinar()
    }
  }, [params.id])

  const fetchWebinar = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/webinars/${params.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch webinar')
      }
      const data = await response.json()
      console.log('Fetched webinar data:', data.webinar)
      console.log('Webinar slug:', data.webinar.slug)
      setWebinar(data.webinar)
    } catch (err: any) {
      setError(err.message)
      console.error('Fetch webinar error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this webinar? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/webinars/${params.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete webinar')
      }

      router.push('/dashboard/webinars')
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const copyLink = () => {
    const link = `${window.location.origin}/webinars/${params.id}`
    navigator.clipboard.writeText(link)
    alert('Webinar link copied to clipboard!')
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (error || !webinar) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error || 'Webinar not found'}</p>
                <Link href="/dashboard/webinars">
                  <Button variant="secondary">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Webinars
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-700',
    SCHEDULED: 'bg-blue-100 text-blue-700',
    LIVE: 'bg-green-100 text-green-700',
    ENDED: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-red-100 text-red-700'
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/webinars">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{webinar.title}</h1>
              <p className="mt-1 text-sm text-gray-500">Webinar Details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={copyLink}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            <Link href={`/dashboard/webinars/${webinar.id}/edit`}>
              <Button size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Link href={`/dashboard/webinars/${webinar.id}/faq`}>
              <Button variant="secondary" size="sm">
                <HelpCircle className="w-4 h-4 mr-2" />
                FAQs
              </Button>
            </Link>
            <Link href={`/dashboard/webinars/${webinar.id}/reminders`}>
              <Button variant="secondary" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Reminders
              </Button>
            </Link>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${statusColors[webinar.status as keyof typeof statusColors]}`}>
            <PlayCircle className="w-4 h-4" />
            {webinar.status}
          </span>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Basic Information</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-gray-900">{webinar.description || 'No description provided'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Duration</label>
                  <p className="mt-1 text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    {webinar.duration} minutes
                  </p>
                </div>
                
                {webinar.videoDuration && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Video Duration</label>
                    <p className="mt-1 text-gray-900 flex items-center gap-2">
                      <Video className="w-4 h-4 text-gray-500" />
                      {webinar.videoDuration} minutes
                    </p>
                  </div>
                )}
              </div>

              {webinar.thumbnail && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Thumbnail</label>
                  <div className="mt-2 w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                    <img src={webinar.thumbnail} alt={webinar.title} className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Schedules */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Schedules</h2>
          </CardHeader>
          <CardBody>
            {webinar.schedules && webinar.schedules.length > 0 ? (
              <div className="space-y-3">
                {webinar.schedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {schedule.scheduleType === 'specific' && (
                      <>
                        <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Specific Date</p>
                          <p className="text-sm text-gray-600" suppressHydrationWarning>
                            {schedule.scheduledAt && new Date(schedule.scheduledAt).toLocaleString()}
                            {schedule.timezone && ` (${schedule.timezone})`}
                          </p>
                        </div>
                      </>
                    )}
                    
                    {schedule.scheduleType === 'justInTime' && (
                      <>
                        <Clock className="w-5 h-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Just-in-Time</p>
                          <p className="text-sm text-gray-600">
                            Starts {schedule.minutesFromReg} minutes after registration
                          </p>
                        </div>
                      </>
                    )}
                    
                    {schedule.scheduleType === 'recurring' && schedule.recurringPattern && (
                      <>
                        <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Recurring</p>
                          <p className="text-sm text-gray-600">
                            {(() => {
                              try {
                                const pattern = JSON.parse(schedule.recurringPattern)
                                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                                
                                let scheduleText = ''
                                if (pattern.interval === 'weekly' && pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
                                  const days = pattern.daysOfWeek.map((d: number) => dayNames[d]).join(', ')
                                  scheduleText = `Every ${days} at ${pattern.time}`
                                } else {
                                  scheduleText = `${pattern.interval} at ${pattern.time}`
                                }
                                
                                return `${scheduleText}${schedule.timezone ? ` (${schedule.timezone})` : ''}`
                              } catch {
                                return 'Recurring schedule'
                              }
                            })()}
                          </p>
                        </div>
                      </>
                    )}
                    
                    <span className={`px-2 py-1 text-xs rounded-full ${schedule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {schedule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No schedules configured</p>
            )}
          </CardBody>
        </Card>

        {/* Registration Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Registration Settings</h2>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  const newCount = prompt('How many upcoming schedules to show on registration page?', String((webinar as any).maxSchedulesToShow || 3))
                  if (newCount && !isNaN(parseInt(newCount))) {
                    try {
                      const response = await fetch(`/api/webinars/${webinar!.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ maxSchedulesToShow: parseInt(newCount) })
                      })
                      if (response.ok) {
                        alert('Settings updated!')
                        fetchWebinar()
                      }
                    } catch (err) {
                      alert('Failed to update')
                    }
                  }
                }}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Schedules to Show</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Number of upcoming schedule slots displayed on registration page
                  </p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {(webinar as any).maxSchedulesToShow || 3}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    For recurring schedules, this shows the next {(webinar as any).maxSchedulesToShow || 3} occurrences
                  </p>
                </div>
              </div>

              {webinar.slug ? (
                <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <Globe className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Public Registration URL</p>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/w/${webinar.slug}`}
                        className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/w/${webinar.slug}`)
                          alert('URL copied to clipboard!')
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">No Public URL Set</p>
                    <p className="text-sm text-gray-600 mt-1">
                      This webinar doesn't have a public URL slug. To enable public registration:
                    </p>
                    <ol className="text-sm text-gray-600 mt-2 ml-4 list-decimal space-y-1">
                      <li>Create a new webinar with a slug, or</li>
                      <li>Add a slug to this webinar via the database</li>
                    </ol>
                    <div className="mt-3 p-3 bg-white rounded border border-yellow-300">
                      <p className="text-xs font-mono text-gray-700">
                        Example SQL: UPDATE webinars SET slug = 'my-webinar-slug' WHERE id = '{webinar.id}'
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Features</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-4">
              <div className={`flex items-center gap-3 p-3 rounded-lg ${webinar.hasReplay ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                <Video className={`w-5 h-5 ${webinar.hasReplay ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={webinar.hasReplay ? 'text-green-900 font-medium' : 'text-gray-600'}>
                  Replay Available
                </span>
              </div>
              
              <div className={`flex items-center gap-3 p-3 rounded-lg ${webinar.hasChat ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                <MessageSquare className={`w-5 h-5 ${webinar.hasChat ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={webinar.hasChat ? 'text-green-900 font-medium' : 'text-gray-600'}>
                  Chat Enabled
                </span>
              </div>
              
              <div className={`flex items-center gap-3 p-3 rounded-lg ${webinar.hasOffers ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                <Gift className={`w-5 h-5 ${webinar.hasOffers ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={webinar.hasOffers ? 'text-green-900 font-medium' : 'text-gray-600'}>
                  Offers Enabled
                </span>
              </div>
              
              <div className={`flex items-center gap-3 p-3 rounded-lg ${webinar.hasReactions ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                <ThumbsUp className={`w-5 h-5 ${webinar.hasReactions ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={webinar.hasReactions ? 'text-green-900 font-medium' : 'text-gray-600'}>
                  Reactions Enabled
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Video Configuration */}
        {(webinar.vimeoVideoId || webinar.videoUrl) && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Video Configuration</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {webinar.vimeoVideoId && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Vimeo Video ID</label>
                    <p className="mt-1 text-gray-900 font-mono">{webinar.vimeoVideoId}</p>
                  </div>
                )}
                {webinar.videoUrl && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Video URL</label>
                    <p className="mt-1 text-gray-900 break-all">{webinar.videoUrl}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Metadata</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-gray-700 font-medium">Created</label>
                <p className="text-gray-900" suppressHydrationWarning>
                  {new Date(webinar.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-gray-700 font-medium">Last Updated</label>
                <p className="text-gray-900" suppressHydrationWarning>
                  {new Date(webinar.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  )
}
