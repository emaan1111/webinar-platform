'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  MessageSquare,
  DollarSign,
  ThumbsUp
} from 'lucide-react'

type ScheduleType = 'specific' | 'justInTime' | 'recurring'

interface Schedule {
  id: string
  scheduleType: ScheduleType
  // Specific
  scheduledDate?: string
  scheduledTime?: string
  timezone?: string
  useUserTimezone?: boolean
  // Just in time
  minutesFromReg?: number
  // Recurring
  recurringInterval?: 'daily' | 'weekly' | 'monthly'
  recurringTime?: string
  recurringDays?: number[]
}

export default function CreateWebinarPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    vimeoVideoId: '',
    videoUrl: '',
    videoDuration: 0,
    duration: 60,
    status: 'DRAFT',
    hasReplay: true,
    hasOffers: true,
    hasChat: true,
    hasReactions: true,
  })

  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [showAddSchedule, setShowAddSchedule] = useState(false)
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({
    scheduleType: 'specific',
    timezone: 'UTC',
    useUserTimezone: false,
    minutesFromReg: 5,
    recurringInterval: 'daily',
    recurringTime: '14:00',
    recurringDays: []
  })

  const commonTimezones = [
    { value: 'USER_TIMEZONE', label: "User's Timezone (Auto-detect)" },
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Dubai', label: 'Dubai' },
    { value: 'Asia/Kolkata', label: 'India' },
    { value: 'Asia/Shanghai', label: 'China' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Australia/Sydney', label: 'Sydney' },
  ]

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required')
      return false
    }
    if (!formData.description.trim()) {
      setError('Description is required')
      return false
    }
    if (schedules.length === 0) {
      setError('At least one schedule is required')
      return false
    }
    return true
  }

  const addSchedule = () => {
    if (newSchedule.scheduleType === 'specific') {
      if (!newSchedule.scheduledDate || !newSchedule.scheduledTime) {
        setError('Date and time are required for specific schedules')
        return
      }
    }

    const schedule: Schedule = {
      id: Date.now().toString(),
      scheduleType: newSchedule.scheduleType!,
      scheduledDate: newSchedule.scheduledDate,
      scheduledTime: newSchedule.scheduledTime,
      timezone: newSchedule.timezone === 'USER_TIMEZONE' ? 'UTC' : newSchedule.timezone,
      useUserTimezone: newSchedule.timezone === 'USER_TIMEZONE',
      minutesFromReg: newSchedule.minutesFromReg,
      recurringInterval: newSchedule.recurringInterval,
      recurringTime: newSchedule.recurringTime,
      recurringDays: newSchedule.recurringDays,
    }

    setSchedules([...schedules, schedule])
    setShowAddSchedule(false)
    setNewSchedule({
      scheduleType: 'specific',
      timezone: 'UTC',
      useUserTimezone: false,
      minutesFromReg: 5,
      recurringInterval: 'daily',
      recurringTime: '14:00',
      recurringDays: []
    })
  }

  const removeSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id))
  }

  const handleSubmit = async (status: 'DRAFT' | 'SCHEDULED') => {
    setError('')
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const webinarData = {
        title: formData.title,
        description: formData.description,
        vimeoVideoId: formData.vimeoVideoId || null,
        videoUrl: formData.videoUrl || null,
        videoDuration: formData.videoDuration > 0 ? formData.videoDuration : null,
        duration: formData.duration,
        status: status,
        hasReplay: formData.hasReplay,
        hasOffers: formData.hasOffers,
        hasChat: formData.hasChat,
        hasReactions: formData.hasReactions,
        schedules: schedules.map(schedule => {
          if (schedule.scheduleType === 'specific') {
            return {
              scheduleType: 'specific',
              scheduledAt: new Date(`${schedule.scheduledDate}T${schedule.scheduledTime}`).toISOString(),
              timezone: schedule.timezone,
              useUserTimezone: schedule.useUserTimezone,
            }
          } else if (schedule.scheduleType === 'justInTime') {
            return {
              scheduleType: 'justInTime',
              minutesFromReg: schedule.minutesFromReg,
            }
          } else {
            return {
              scheduleType: 'recurring',
              recurringPattern: JSON.stringify({
                interval: schedule.recurringInterval,
                time: schedule.recurringTime,
                daysOfWeek: schedule.recurringDays || []
              }),
              timezone: schedule.timezone,
              useUserTimezone: schedule.useUserTimezone,
            }
          }
        })
      }

      console.log('Submitting webinar data:', webinarData)

      const response = await fetch('/api/webinars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webinarData)
      })

      const data = await response.json()
      console.log('Response:', data)

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to create webinar')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/webinars')
      }, 1500)
    } catch (err: any) {
      console.error('Submit error:', err)
      setError(err.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto mt-12">
          <Card>
            <CardBody>
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Webinar Created Successfully!
                </h3>
                <p className="text-sm text-gray-600">Redirecting to webinars list...</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/dashboard/webinars">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Webinars
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Create Webinar</h1>
            <p className="mt-1 text-sm text-gray-500">
              Set up your simulated webinar with video and schedules
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800 font-medium">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Webinar Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Master React in 60 Minutes"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what attendees will learn..."
                />
              </div>

              {/* Vimeo Video ID */}
              <div>
                <label htmlFor="vimeoVideoId" className="block text-sm font-medium text-gray-700 mb-2">
                  <Video className="w-4 h-4 inline mr-1" />
                  Vimeo Video ID
                </label>
                <input
                  type="text"
                  id="vimeoVideoId"
                  value={formData.vimeoVideoId}
                  onChange={(e) => setFormData({ ...formData, vimeoVideoId: e.target.value })}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 123456789"
                />
                <p className="mt-1 text-xs text-gray-500">Enter only the video ID from Vimeo</p>
              </div>

              {/* Video Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="videoDuration" className="block text-sm font-medium text-gray-700 mb-2">
                    Video Duration (seconds)
                  </label>
                  <input
                    type="number"
                    id="videoDuration"
                    value={formData.videoDuration || ''}
                    onChange={(e) => setFormData({ ...formData, videoDuration: parseInt(e.target.value) || 0 })}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="3600"
                  />
                </div>
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                    Webinar Duration (minutes)
                  </label>
                  <select
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Schedules */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Schedules</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Add multiple schedules - users can choose when to attend
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowAddSchedule(!showAddSchedule)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Schedule
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {/* Add Schedule Form */}
            {showAddSchedule && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="space-y-4">
                  {/* Schedule Type Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schedule Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewSchedule({ ...newSchedule, scheduleType: 'specific' })}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          newSchedule.scheduleType === 'specific'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Calendar className="w-5 h-5 mx-auto mb-1" />
                        Specific Date
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewSchedule({ ...newSchedule, scheduleType: 'justInTime' })}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          newSchedule.scheduleType === 'justInTime'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Clock className="w-5 h-5 mx-auto mb-1" />
                        Just in Time
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewSchedule({ ...newSchedule, scheduleType: 'recurring' })}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          newSchedule.scheduleType === 'recurring'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Calendar className="w-5 h-5 mx-auto mb-1" />
                        Recurring
                      </button>
                    </div>
                  </div>

                  {/* Specific Date/Time */}
                  {newSchedule.scheduleType === 'specific' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                          <input
                            type="date"
                            value={newSchedule.scheduledDate || ''}
                            onChange={(e) => setNewSchedule({ ...newSchedule, scheduledDate: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                          <input
                            type="time"
                            value={newSchedule.scheduledTime || ''}
                            onChange={(e) => setNewSchedule({ ...newSchedule, scheduledTime: e.target.value })}
                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                        <select
                          value={newSchedule.timezone === 'USER_TIMEZONE' || newSchedule.useUserTimezone ? 'USER_TIMEZONE' : newSchedule.timezone}
                          onChange={(e) => setNewSchedule({ 
                            ...newSchedule, 
                            timezone: e.target.value === 'USER_TIMEZONE' ? 'UTC' : e.target.value,
                            useUserTimezone: e.target.value === 'USER_TIMEZONE'
                          })}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {commonTimezones.map(tz => (
                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Just in Time */}
                  {newSchedule.scheduleType === 'justInTime' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start webinar (minutes after registration)
                      </label>
                      <input
                        type="number"
                        value={newSchedule.minutesFromReg || 5}
                        onChange={(e) => setNewSchedule({ ...newSchedule, minutesFromReg: parseInt(e.target.value) })}
                        min={1}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Webinar starts in user's timezone, {newSchedule.minutesFromReg || 5} minutes after they register
                      </p>
                    </div>
                  )}

                  {/* Recurring */}
                  {newSchedule.scheduleType === 'recurring' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Repeat</label>
                          <select
                            value={newSchedule.recurringInterval || 'daily'}
                            onChange={(e) => setNewSchedule({ ...newSchedule, recurringInterval: e.target.value as any })}
                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                          <input
                            type="time"
                            value={newSchedule.recurringTime || '14:00'}
                            onChange={(e) => setNewSchedule({ ...newSchedule, recurringTime: e.target.value })}
                            className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                        <select
                          value={newSchedule.useUserTimezone ? 'USER_TIMEZONE' : newSchedule.timezone}
                          onChange={(e) => setNewSchedule({ 
                            ...newSchedule, 
                            timezone: e.target.value === 'USER_TIMEZONE' ? 'UTC' : e.target.value,
                            useUserTimezone: e.target.value === 'USER_TIMEZONE'
                          })}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {commonTimezones.map(tz => (
                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                          ))}
                        </select>
                      </div>
                      {newSchedule.recurringInterval === 'weekly' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Days of Week</label>
                          <div className="flex gap-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  const days = newSchedule.recurringDays || []
                                  const newDays = days.includes(idx)
                                    ? days.filter(d => d !== idx)
                                    : [...days, idx]
                                  setNewSchedule({ ...newSchedule, recurringDays: newDays })
                                }}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  (newSchedule.recurringDays || []).includes(idx)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={addSchedule}>
                      Add This Schedule
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddSchedule(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule List */}
            {schedules.length === 0 && !showAddSchedule && (
              <p className="text-sm text-gray-500 text-center py-8">
                No schedules added yet. Click "Add Schedule" to create one.
              </p>
            )}

            {schedules.length > 0 && (
              <div className="space-y-2">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {schedule.scheduleType === 'specific' && <Calendar className="w-5 h-5 text-gray-400" />}
                      {schedule.scheduleType === 'justInTime' && <Clock className="w-5 h-5 text-blue-500" />}
                      {schedule.scheduleType === 'recurring' && <Calendar className="w-5 h-5 text-purple-500" />}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {schedule.scheduleType === 'specific' && `${schedule.scheduledDate} at ${schedule.scheduledTime}`}
                          {schedule.scheduleType === 'justInTime' && `Starts ${schedule.minutesFromReg} min after registration`}
                          {schedule.scheduleType === 'recurring' && `${schedule.recurringInterval} at ${schedule.recurringTime}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {schedule.scheduleType === 'specific' && (schedule.useUserTimezone ? "User's Timezone" : schedule.timezone)}
                          {schedule.scheduleType === 'justInTime' && "User's timezone (auto)"}
                          {schedule.scheduleType === 'recurring' && (schedule.useUserTimezone ? "User's Timezone" : schedule.timezone)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeSchedule(schedule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Features</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.hasReplay}
                  onChange={(e) => setFormData({ ...formData, hasReplay: e.target.checked })}
                  className="w-5 h-5 text-blue-600"
                />
                <div>
                  <Video className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-sm font-medium text-gray-700">Replay</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.hasChat}
                  onChange={(e) => setFormData({ ...formData, hasChat: e.target.checked })}
                  className="w-5 h-5 text-blue-600"
                />
                <div>
                  <MessageSquare className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-sm font-medium text-gray-700">Chat</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.hasOffers}
                  onChange={(e) => setFormData({ ...formData, hasOffers: e.target.checked })}
                  className="w-5 h-5 text-blue-600"
                />
                <div>
                  <DollarSign className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-sm font-medium text-gray-700">Offers</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.hasReactions}
                  onChange={(e) => setFormData({ ...formData, hasReactions: e.target.checked })}
                  className="w-5 h-5 text-blue-600"
                />
                <div>
                  <ThumbsUp className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-sm font-medium text-gray-700">Reactions</span>
                </div>
              </label>
            </div>
          </CardBody>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            type="button"
            onClick={() => handleSubmit('DRAFT')}
            variant="secondary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save as Draft'}
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit('SCHEDULED')}
            disabled={isLoading}
          >
            {isLoading ? 'Scheduling...' : 'Schedule Webinar'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
