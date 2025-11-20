'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import {
  ArrowLeft,
  Clock,
  MessageSquare,
  Heart,
  Eye,
  MousePointerClick,
  Users,
  TrendingUp,
  Calendar,
  Mail,
  Phone,
  Globe,
  CheckCircle,
  XCircle,
  PlayCircle,
  Activity
} from 'lucide-react'

interface AttendeeProfile {
  id: string
  name: string
  email: string
  phone: string | null
  timezone: string | null
  country: string | null
  webinarTitle: string
  registeredAt: string
  scheduledAt: string | null
  attended: boolean
  joinedAt: string | null
  leftAt: string | null
  totalWatchTime: number
  engagementScore: number
  
  // Engagement details
  chatMessages: Array<{
    id: string
    message: string
    timestamp: string
    isApproved: boolean
  }>
  
  reactions: Array<{
    id: string
    type: string
    timestamp: string
  }>
  
  ctaClicks: Array<{
    id: string
    offerTitle: string
    timestamp: string
  }>
  
  pageVisits: Array<{
    id: string
    timestamp: string
    duration: number
  }>
  
  watchSessions: Array<{
    id: string
    joinedAt: string
    leftAt: string | null
    duration: number
  }>
  
  referrals: Array<{
    id: string
    name: string
    email: string
    registeredAt: string
    attended: boolean
  }>
  
  referralCode: string | null
  referredBy: string | null
  referrerName: string | null
}

export default function AttendeeProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<AttendeeProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchProfile(params.id as string)
    }
  }, [params.id])

  const fetchProfile = async (id: string) => {
    try {
      const response = await fetch(`/api/attendees/${id}/profile`)
      if (!response.ok) throw new Error('Failed to fetch profile')
      const data = await response.json()
      setProfile(data.profile)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Failed to load attendee profile')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600">{error || 'Profile not found'}</p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.back()}
              variant="secondary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-sm text-gray-500">{profile.webinarTitle}</p>
            </div>
          </div>
          <div>
            {profile.attended ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4" />
                Attended
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800">
                <XCircle className="w-4 h-4" />
                No Show
              </span>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{profile.email}</p>
              </div>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{profile.phone}</p>
                </div>
              </div>
            )}
            {profile.country && (
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Country</p>
                  <p className="text-sm font-medium text-gray-900">{profile.country}</p>
                </div>
              </div>
            )}
            {profile.timezone && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Timezone</p>
                  <p className="text-sm font-medium text-gray-900">{profile.timezone}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Watch Time</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatTime(profile.totalWatchTime)}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Engagement Score</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{profile.engagementScore}%</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Chat Messages</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{profile.chatMessages.length}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-pink-50 rounded-lg">
                <Heart className="w-5 h-5 text-pink-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Reactions</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{profile.reactions.length}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Engagement Timeline
          </h2>
          <div className="space-y-4">
            {/* Registration */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Registered</p>
                <p className="text-xs text-gray-500">{formatDateTime(profile.registeredAt)}</p>
              </div>
            </div>

            {/* Watch Sessions */}
            {profile.watchSessions.map((session, index) => (
              <div key={session.id} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <PlayCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Watch Session #{index + 1} ({formatTime(session.duration)})
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(session.joinedAt)}
                    {session.leftAt && ` - ${formatDateTime(session.leftAt)}`}
                  </p>
                </div>
              </div>
            ))}

            {/* Chat Messages */}
            {profile.chatMessages.slice(0, 5).map((msg) => (
              <div key={msg.id} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Sent chat message</p>
                  <p className="text-xs text-gray-600 italic">"{msg.message}"</p>
                  <p className="text-xs text-gray-500">{formatDateTime(msg.timestamp)}</p>
                </div>
              </div>
            ))}

            {/* Reactions */}
            {profile.reactions.slice(0, 5).map((reaction) => (
              <div key={reaction.id} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-pink-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Reacted: {reaction.type}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(reaction.timestamp)}</p>
                </div>
              </div>
            ))}

            {/* CTA Clicks */}
            {profile.ctaClicks.map((click) => (
              <div key={click.id} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <MousePointerClick className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Clicked CTA: {click.offerTitle}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(click.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referrals Section */}
        {(profile.referralCode || profile.referrals.length > 0 || profile.referredBy) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Referral Information
            </h2>
            <div className="space-y-4">
              {profile.referredBy && (
                <div>
                  <p className="text-sm text-gray-600">Referred by:</p>
                  <p className="text-base font-medium text-gray-900">{profile.referrerName}</p>
                </div>
              )}
              
              {profile.referralCode && (
                <div>
                  <p className="text-sm text-gray-600">Their referral code:</p>
                  <p className="text-base font-mono font-medium text-blue-600">{profile.referralCode}</p>
                </div>
              )}

              {profile.referrals.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-3">People they referred ({profile.referrals.length}):</p>
                  <div className="space-y-2">
                    {profile.referrals.map((referral) => (
                      <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{referral.name}</p>
                          <p className="text-xs text-gray-500">{referral.email}</p>
                        </div>
                        <div className="text-right">
                          {referral.attended ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3" />
                              Attended
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              <XCircle className="w-3 h-3" />
                              No Show
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
