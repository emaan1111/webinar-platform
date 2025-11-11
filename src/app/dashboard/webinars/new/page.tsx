'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import ABTestingConfig from '@/components/dashboard/ABTestingConfig'
import {
  ArrowLeft,
  Save,
  Calendar,
  Clock,
  Users,
  Upload,
  AlertCircle,
  CheckCircle,
  Repeat,
  Video,
  MessageSquare,
  DollarSign,
  ThumbsUp,
  Plus,
  Trash2
} from 'lucide-react'

export default function CreateWebinarPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  
  // Load templates on mount
  useEffect(() => {
    async function loadTemplates() {
      try {
        const response = await fetch('/api/registration-pages')
        if (response.ok) {
          const data = await response.json()
          setTemplates(data)
        }
      } catch (error) {
        console.error('Failed to load registration pages:', error)
      }
    }
    loadTemplates()
  }, [])
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    vimeoVideoId: '',
    videoUrl: '',
    videoDuration: 0,
    scheduleType: 'specific' as 'specific' | 'xMinutesFromNow' | 'recurring',
    scheduledAt: '',
    scheduledTime: '',
    minutesFromNow: 30,
    recurringInterval: 'daily' as 'daily' | 'weekly' | 'monthly',
    recurringTime: '14:00',
    recurringDays: [] as number[], // 0-6 for Sun-Sat
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    duration: 60,
    maxAttendees: 500,
    status: 'DRAFT',
    hasReplay: true,
    hasOffers: true,
    hasChat: true,
    hasReactions: true,
    thumbnail: null as File | null,
    maxSchedulesToShow: 3,
    registrationPageId: '',
    // A/B Testing
    enableABTesting: false,
    trafficSplitPercent: 50,
    testRegistrationPage: false,
    regPageAId: '',
    regPageBId: '',
    testSchedule: false,
    scheduleAIds: '',
    scheduleBIds: '',
    testOffer: false,
    offerAId: '',
    offerBId: '',
    testVideo: false,
    videoAId: '',
    videoBId: ''
  })

  const [additionalSchedules, setAdditionalSchedules] = useState<Array<any>>([])
  const [showAddSchedule, setShowAddSchedule] = useState(false)
  const [newScheduleType, setNewScheduleType] = useState<'specific' | 'justInTime' | 'recurring'>('specific')

  // Common timezones list
  const commonTimezones = [
    { value: 'USER_TIMEZONE', label: "User's Timezone (Auto-detect)" },
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
    { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
    { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
    { value: 'America/Phoenix', label: 'Arizona' },
    { value: 'America/Anchorage', label: 'Alaska' },
    { value: 'Pacific/Honolulu', label: 'Hawaii' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris, Berlin, Rome' },
    { value: 'Europe/Moscow', label: 'Moscow' },
    { value: 'Asia/Dubai', label: 'Dubai' },
    { value: 'Asia/Kolkata', label: 'India' },
    { value: 'Asia/Shanghai', label: 'China' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Asia/Singapore', label: 'Singapore' },
    { value: 'Australia/Sydney', label: 'Sydney' },
    { value: 'Pacific/Auckland', label: 'New Zealand' },
  ]

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
      .substring(0, 50)              // Limit length
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters'
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'URL slug is required'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters'
    }

    if (formData.duration < 15) {
      newErrors.duration = 'Duration must be at least 15 minutes'
    }

    // At least one schedule is required
    if (additionalSchedules.length === 0) {
      newErrors.schedules = 'At least one schedule is required. Click "Add Schedule" to create one.'
      setError('At least one schedule is required. Click "Add Schedule" to create one.')
    }

    console.log('Validation errors:', newErrors)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    console.log('Form submitted!')

    if (!validateForm()) {
      console.log('Validation failed')
      return
    }

    console.log('Validation passed, creating webinar...')
    setIsLoading(true)

    try {
      // Map all schedules from additionalSchedules
      const allSchedules = additionalSchedules.map((schedule: any) => {
        const mappedSchedule: any = {
          scheduleType: schedule.scheduleType,
        }

        if (schedule.scheduleType === 'specific') {
          mappedSchedule.scheduledAt = new Date(`${schedule.scheduledAt}T${schedule.scheduledTime}`).toISOString()
          mappedSchedule.timezone = schedule.timezone
          mappedSchedule.useUserTimezone = schedule.useUserTimezone
        } else if (schedule.scheduleType === 'justInTime') {
          mappedSchedule.minutesFromReg = schedule.minutesFromReg
        } else if (schedule.scheduleType === 'recurring') {
          mappedSchedule.recurringPattern = schedule.recurringPattern
          mappedSchedule.timezone = schedule.timezone
          mappedSchedule.useUserTimezone = schedule.useUserTimezone
        }

        return mappedSchedule
      })

      const webinarData = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        duration: parseInt(formData.duration.toString()),
        vimeoVideoId: formData.vimeoVideoId || null,
        videoUrl: formData.videoUrl || null,
        videoDuration: formData.videoDuration > 0 ? formData.videoDuration : null,
        status: formData.status,
        hasReplay: formData.hasReplay,
        hasOffers: formData.hasOffers,
        hasChat: formData.hasChat,
        hasReactions: formData.hasReactions,
        maxSchedulesToShow: formData.maxSchedulesToShow,
        registrationPageId: formData.registrationPageId || null,
        schedules: allSchedules,
        // A/B Testing
        enableABTesting: formData.enableABTesting,
        trafficSplitPercent: formData.trafficSplitPercent,
        testRegistrationPage: formData.testRegistrationPage,
        regPageAId: formData.regPageAId || null,
        regPageBId: formData.regPageBId || null,
        testSchedule: formData.testSchedule,
        scheduleAIds: formData.scheduleAIds || null,
        scheduleBIds: formData.scheduleBIds || null,
        testOffer: formData.testOffer,
        offerAId: formData.offerAId || null,
        offerBId: formData.offerBId || null,
        testVideo: formData.testVideo,
        videoAId: formData.videoAId || null,
        videoBId: formData.videoBId || null
      }

      console.log('Sending webinar data:', JSON.stringify(webinarData, null, 2))

      const response = await fetch('/api/webinars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webinarData)
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const data = await response.json()
        console.error('API error:', data)
        throw new Error(data.error || 'Failed to create webinar')
      }

      const result = await response.json()
      console.log('Webinar created successfully:', result)

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/webinars')
      }, 1500)
    } catch (err: any) {
      console.error('Submit error:', err)
      setError(err.message || 'Something went wrong')
      setIsLoading(false)
    }
  }

  const handleSaveDraft = async (e: React.MouseEvent) => {
    e.preventDefault()
    const updatedFormData = { ...formData, status: 'DRAFT' }
    setFormData(updatedFormData)
    
    // Trigger form submission with DRAFT status
    await handleSubmitWithStatus('DRAFT')
  }

  const handleSchedule = async (e: React.MouseEvent) => {
    e.preventDefault()
    const updatedFormData = { ...formData, status: 'SCHEDULED' }
    setFormData(updatedFormData)
    
    // Trigger form submission with SCHEDULED status
    await handleSubmitWithStatus('SCHEDULED')
  }

  const handleSubmitWithStatus = async (status: string) => {
    setError('')
    console.log('Submitting with status:', status)

    if (!validateForm()) {
      console.log('Validation failed')
      return
    }

    console.log('Validation passed, creating webinar with status:', status)
    setIsLoading(true)

    try {
      // Map all schedules from additionalSchedules
      const allSchedules = additionalSchedules.map((schedule: any) => {
        const mappedSchedule: any = {
          scheduleType: schedule.scheduleType,
        }

        if (schedule.scheduleType === 'specific') {
          mappedSchedule.scheduledAt = new Date(`${schedule.scheduledAt}T${schedule.scheduledTime}`).toISOString()
          mappedSchedule.timezone = schedule.timezone
          mappedSchedule.useUserTimezone = schedule.useUserTimezone
        } else if (schedule.scheduleType === 'justInTime') {
          mappedSchedule.minutesFromReg = schedule.minutesFromReg
        } else if (schedule.scheduleType === 'recurring') {
          mappedSchedule.recurringPattern = schedule.recurringPattern
          mappedSchedule.timezone = schedule.timezone
          mappedSchedule.useUserTimezone = schedule.useUserTimezone
        }

        return mappedSchedule
      })

      const webinarData = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        duration: parseInt(formData.duration.toString()),
        vimeoVideoId: formData.vimeoVideoId || null,
        videoUrl: formData.videoUrl || null,
        videoDuration: formData.videoDuration > 0 ? formData.videoDuration : null,
        status: status,
        hasReplay: formData.hasReplay,
        hasOffers: formData.hasOffers,
        hasChat: formData.hasChat,
        hasReactions: formData.hasReactions,
        maxSchedulesToShow: formData.maxSchedulesToShow,
        registrationPageId: formData.registrationPageId || null,
        schedules: allSchedules,
        // A/B Testing
        enableABTesting: formData.enableABTesting,
        trafficSplitPercent: formData.trafficSplitPercent,
        testRegistrationPage: formData.testRegistrationPage,
        regPageAId: formData.regPageAId || null,
        regPageBId: formData.regPageBId || null,
        testSchedule: formData.testSchedule,
        scheduleAIds: formData.scheduleAIds || null,
        scheduleBIds: formData.scheduleBIds || null,
        testOffer: formData.testOffer,
        offerAId: formData.offerAId || null,
        offerBId: formData.offerBId || null,
        testVideo: formData.testVideo,
        videoAId: formData.videoAId || null,
        videoBId: formData.videoBId || null
      }

      console.log('Sending webinar data (handleSubmitWithStatus):', JSON.stringify(webinarData, null, 2))

      const response = await fetch('/api/webinars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webinarData)
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const data = await response.json()
        console.error('API error:', data)
        throw new Error(data.error || 'Failed to create webinar')
      }

      const result = await response.json()
      console.log('Webinar created successfully:', result)

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/webinars')
      }, 1500)
    } catch (err: any) {
      console.error('Submit error:', err)
      setError(err.message || 'Something went wrong')
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
              Set up your webinar details and schedule
            </p>
          </div>
        </div>

        {/* Info Alert */}
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">Required fields are marked with <span className="text-red-500">*</span></p>
            <p className="text-xs text-blue-700 mt-1">Fill in all required fields to create your webinar</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
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
                      Webinar Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={formData.title}
                      onChange={(e) => {
                        const newTitle = e.target.value
                        setFormData({ 
                          ...formData, 
                          title: newTitle,
                          // Auto-generate slug if slug is empty or was auto-generated
                          slug: !formData.slug || formData.slug === generateSlug(formData.title) 
                            ? generateSlug(newTitle) 
                            : formData.slug
                        })
                      }}
                      className={`block w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.title ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Introduction to Web Development"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                    )}
                  </div>

                  {/* Slug */}
                  <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                      Public URL Slug <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center px-3 py-3 text-sm text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg">
                        /w/
                      </span>
                      <div className="flex-1">
                        <input
                          type="text"
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                          className={`block w-full px-4 py-3 border rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            errors.slug ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="e.g., intro-web-development"
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      This will be your public registration URL: <span className="font-mono text-blue-600">
                        {typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/w/{formData.slug || 'your-slug'}
                      </span>
                    </p>
                    {errors.slug && (
                      <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      rows={6}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={`block w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.description ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Describe what attendees will learn in this webinar..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.description.length} characters (minimum 20)
                    </p>
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                    )}
                  </div>

                  {/* Vimeo Video ID */}
                  <div>
                    <label htmlFor="vimeoVideoId" className="block text-sm font-medium text-gray-700 mb-2">
                      Vimeo Video ID (Preferred)
                    </label>
                    <div className="flex items-center gap-3">
                      <Video className="w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        id="vimeoVideoId"
                        value={formData.vimeoVideoId}
                        onChange={(e) => setFormData({ ...formData, vimeoVideoId: e.target.value })}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="e.g., 123456789"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Enter only the Vimeo video ID (numbers only)
                    </p>
                  </div>

                  {/* Alternative Video URL */}
                  <div>
                    <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                      Or Full Video URL (Alternative)
                    </label>
                    <div className="flex items-center gap-3">
                      <Video className="w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        id="videoUrl"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      YouTube, Vimeo full URL, or direct video URL
                    </p>
                  </div>

                  {/* Video Duration */}
                  <div>
                    <label htmlFor="videoDuration" className="block text-sm font-medium text-gray-700 mb-2">
                      Video Duration (seconds)
                    </label>
                    <input
                      type="number"
                      id="videoDuration"
                      min="0"
                      value={formData.videoDuration || ''}
                      onChange={(e) => setFormData({ ...formData, videoDuration: parseInt(e.target.value) || 0 })}
                      className="block w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., 3600 for 1 hour"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.videoDuration > 0 && `${Math.floor(formData.videoDuration / 60)} minutes ${formData.videoDuration % 60} seconds`}
                    </p>
                  </div>

                  {/* Webinar Duration */}
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                      Webinar Duration (minutes) <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      className="block w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={90}>1.5 hours</option>
                      <option value={120}>2 hours</option>
                      <option value={180}>3 hours</option>
                    </select>
                  </div>

                  {/* Thumbnail Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thumbnail Image
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.files?.[0] || null })}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>
                    {formData.thumbnail && (
                      <p className="mt-2 text-sm text-gray-600">
                        Selected: {formData.thumbnail.name}
                      </p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Schedules */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Webinar Schedules <span className="text-red-500">*</span></h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Add one or more schedule options. Users can choose which schedule works best for them.
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
                {additionalSchedules.length === 0 && !showAddSchedule && (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-600 font-medium mb-1">No schedules added yet</p>
                    <p className="text-xs text-gray-500">Click "Add Schedule" to create schedule options for your webinar</p>
                  </div>
                )}

                {/* Add Schedule Form */}
                {showAddSchedule && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-gray-900 mb-3">Add New Schedule</h3>
                    
                    {/* Schedule Type Selector */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Schedule Type
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setNewScheduleType('specific')}
                          className={`p-3 border-2 rounded-lg text-left transition-all ${
                            newScheduleType === 'specific'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Calendar className="w-5 h-5 mb-1 text-blue-600" />
                          <p className="text-xs font-medium">Specific Date</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewScheduleType('justInTime')}
                          className={`p-3 border-2 rounded-lg text-left transition-all ${
                            newScheduleType === 'justInTime'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Clock className="w-5 h-5 mb-1 text-green-600" />
                          <p className="text-xs font-medium">Just-in-Time</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewScheduleType('recurring')}
                          className={`p-3 border-2 rounded-lg text-left transition-all ${
                            newScheduleType === 'recurring'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Repeat className="w-5 h-5 mb-1 text-purple-600" />
                          <p className="text-xs font-medium">Recurring</p>
                        </button>
                      </div>
                    </div>

                    {/* Specific Date Fields */}
                    {newScheduleType === 'specific' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date
                          </label>
                          <input
                            type="date"
                            id="newScheduleDate"
                            min={new Date().toISOString().split('T')[0]}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Time
                          </label>
                          <input
                            type="time"
                            id="newScheduleTime"
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Timezone
                          </label>
                          <select
                            id="newScheduleTimezone"
                            defaultValue={formData.timezone}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {commonTimezones.map((tz) => (
                              <option key={tz.value} value={tz.value}>
                                {tz.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      </div>
                    )}

                    {/* Just-in-Time Fields */}
                    {newScheduleType === 'justInTime' && (
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start After Registration (minutes)
                      </label>
                      <input
                        type="number"
                        id="newScheduleMinutes"
                        min="5"
                        defaultValue="30"
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Webinar starts X minutes after user registers</p>
                      </div>
                    )}

                    {/* Recurring Fields */}
                    {newScheduleType === 'recurring' && (
                      <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Interval
                          </label>
                          <select
                            id="newScheduleInterval"
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => {
                              // Show/hide days selector based on interval
                              const daysSelector = document.getElementById('newScheduleDaysOfWeek')
                              if (daysSelector) {
                                daysSelector.style.display = e.target.value === 'weekly' ? 'block' : 'none'
                              }
                            }}
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Time
                          </label>
                          <input
                            type="time"
                            id="newScheduleRecurringTime"
                            defaultValue="14:00"
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Timezone
                          </label>
                          <select
                            id="newScheduleRecurringTimezone"
                            defaultValue={formData.timezone}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {commonTimezones.map((tz) => (
                              <option key={tz.value} value={tz.value}>
                                {tz.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {/* Days of Week Selector (for weekly recurring) */}
                      <div id="newScheduleDaysOfWeek" style={{ display: 'none' }}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Days <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: 0, label: 'Sun' },
                            { value: 1, label: 'Mon' },
                            { value: 2, label: 'Tue' },
                            { value: 3, label: 'Wed' },
                            { value: 4, label: 'Thu' },
                            { value: 5, label: 'Fri' },
                            { value: 6, label: 'Sat' }
                          ].map((day) => (
                            <label
                              key={day.value}
                              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                              <input
                                type="checkbox"
                                name="recurringDays"
                                value={day.value}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-gray-700">{day.label}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Select one or more days for your weekly webinar</p>
                      </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const newSchedule: any = { scheduleType: newScheduleType }

                          if (newScheduleType === 'specific') {
                            const dateInput = document.getElementById('newScheduleDate') as HTMLInputElement
                            const timeInput = document.getElementById('newScheduleTime') as HTMLInputElement
                            const timezoneSelect = document.getElementById('newScheduleTimezone') as HTMLSelectElement
                            
                            if (dateInput.value && timeInput.value) {
                              const selectedTimezone = timezoneSelect.value
                              newSchedule.scheduledAt = dateInput.value
                              newSchedule.scheduledTime = timeInput.value
                              newSchedule.timezone = selectedTimezone === 'USER_TIMEZONE' ? 'UTC' : selectedTimezone
                              newSchedule.useUserTimezone = selectedTimezone === 'USER_TIMEZONE'
                              
                              setAdditionalSchedules([...additionalSchedules, newSchedule])
                              dateInput.value = ''
                              timeInput.value = ''
                              setShowAddSchedule(false)
                            } else {
                              alert('Please fill in date and time')
                            }
                          } else if (newScheduleType === 'justInTime') {
                            const minutesInput = document.getElementById('newScheduleMinutes') as HTMLInputElement
                            newSchedule.minutesFromReg = parseInt(minutesInput.value) || 30
                            
                            setAdditionalSchedules([...additionalSchedules, newSchedule])
                            setShowAddSchedule(false)
                          } else if (newScheduleType === 'recurring') {
                            const intervalSelect = document.getElementById('newScheduleInterval') as HTMLSelectElement
                            const timeInput = document.getElementById('newScheduleRecurringTime') as HTMLInputElement
                            const timezoneSelect = document.getElementById('newScheduleRecurringTimezone') as HTMLSelectElement
                            
                            // Get selected days for weekly recurring
                            let daysOfWeek: number[] = []
                            if (intervalSelect.value === 'weekly') {
                              const checkedDays = document.querySelectorAll<HTMLInputElement>('input[name="recurringDays"]:checked')
                              daysOfWeek = Array.from(checkedDays).map(cb => parseInt(cb.value))
                              
                              if (daysOfWeek.length === 0) {
                                alert('Please select at least one day for weekly recurring schedule')
                                return
                              }
                            }
                            
                            newSchedule.recurringPattern = JSON.stringify({
                              interval: intervalSelect.value,
                              time: timeInput.value,
                              daysOfWeek
                            })
                            const selectedTimezone = timezoneSelect.value
                            newSchedule.timezone = selectedTimezone === 'USER_TIMEZONE' ? 'UTC' : selectedTimezone
                            newSchedule.useUserTimezone = selectedTimezone === 'USER_TIMEZONE'
                            
                            setAdditionalSchedules([...additionalSchedules, newSchedule])
                            setShowAddSchedule(false)
                          }
                        }}
                      >
                        Add This Schedule
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowAddSchedule(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Schedule List */}
                {additionalSchedules.length > 0 && (
                  <div className="space-y-2">
                    {additionalSchedules.map((schedule: any, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {schedule.scheduleType === 'specific' && <Calendar className="w-5 h-5 text-blue-400" />}
                          {schedule.scheduleType === 'justInTime' && <Clock className="w-5 h-5 text-green-400" />}
                          {schedule.scheduleType === 'recurring' && <Repeat className="w-5 h-5 text-purple-400" />}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {schedule.scheduleType === 'specific' && (
                                schedule.useUserTimezone ? (
                                  <>
                                    {new Date(`${schedule.scheduledAt}T${schedule.scheduledTime}Z`).toLocaleString('en-US', {
                                      dateStyle: 'full',
                                      timeStyle: 'short',
                                    })}
                                  </>
                                ) : (
                                  <>
                                    {new Date(`${schedule.scheduledAt}T${schedule.scheduledTime}`).toLocaleString('en-US', {
                                      dateStyle: 'full',
                                      timeStyle: 'short',
                                      timeZone: schedule.timezone
                                    })}
                                  </>
                                )
                              )}
                              {schedule.scheduleType === 'justInTime' && (
                                `Starts ${schedule.minutesFromReg} minutes after registration`
                              )}
                              {schedule.scheduleType === 'recurring' && (
                                `Recurring - ${JSON.parse(schedule.recurringPattern).interval}`
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {schedule.scheduleType === 'specific' && (
                                schedule.useUserTimezone ? (
                                  <span className="inline-flex items-center gap-1 text-blue-600">
                                    <Clock className="w-3 h-3" />
                                    User's Timezone
                                  </span>
                                ) : (
                                  schedule.timezone
                                )
                              )}
                              {schedule.scheduleType === 'justInTime' && 'Just-in-Time Schedule'}
                              {schedule.scheduleType === 'recurring' && schedule.timezone}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setAdditionalSchedules(additionalSchedules.filter((_, i) => i !== index))
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Webinar Features */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Webinar Features</h2>
                <p className="text-sm text-gray-500">Enable or disable features for this webinar</p>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {/* Replay */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Video className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Replay Available</p>
                        <p className="text-sm text-gray-500">Allow attendees to watch recording later</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, hasReplay: !formData.hasReplay })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.hasReplay ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.hasReplay ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Chat */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Live Chat</p>
                        <p className="text-sm text-gray-500">Enable real-time chat during webinar</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, hasChat: !formData.hasChat })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.hasChat ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.hasChat ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Offers */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Special Offers</p>
                        <p className="text-sm text-gray-500">Show timed offers during webinar</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, hasOffers: !formData.hasOffers })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.hasOffers ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.hasOffers ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Reactions */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <ThumbsUp className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Reaction Buttons</p>
                        <p className="text-sm text-gray-500">Allow attendees to react with emojis</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, hasReactions: !formData.hasReactions })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.hasReactions ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.hasReactions ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Registration Page */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Registration Page</h2>
                <p className="text-sm text-gray-500">Choose how your registration page will look</p>
              </CardHeader>
              <CardBody>
                <div className="space-y-6">
                  {/* Registration Page Selector */}
                  <div>
                    <label htmlFor="registrationPageId" className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Page
                    </label>
                    <select
                      id="registrationPageId"
                      value={formData.registrationPageId}
                      onChange={(e) => setFormData({ ...formData, registrationPageId: e.target.value })}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">No registration page (use default)</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name} {template.isSystem && '(System)'}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-gray-500">
                      {templates.length === 0 && 'No registration pages found. '}
                      <Link href="/dashboard/registration-pages" className="text-blue-600 hover:text-blue-700 underline">
                        Create registration pages
                      </Link>
                      {' '}to customize your registration page design.
                    </p>
                    {formData.registrationPageId && (
                      <div className="mt-2">
                        {templates.find(t => t.id === formData.registrationPageId)?.description && (
                          <p className="text-sm text-gray-600">
                            {templates.find(t => t.id === formData.registrationPageId)?.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Preview Note */}
                  {formData.slug && (
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                      <p className="text-sm text-gray-700">
                        💡 After creating your webinar, visit{' '}
                        <code className="text-blue-600 bg-white px-2 py-1 rounded">
                          /w/{formData.slug}
                        </code>{' '}
                        to preview your registration page.
                      </p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* A/B Testing Configuration */}
            <ABTestingConfig
              onChange={(abTestData) => {
                setFormData({
                  ...formData,
                  ...abTestData
                })
              }}
            />

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Link href="/dashboard/webinars">
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveDraft}
                disabled={isLoading}
              >
                <Save className="w-4 h-4 mr-2" />
                Save as Draft
              </Button>
              <Button
                type="button"
                onClick={handleSchedule}
                disabled={isLoading}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {isLoading ? 'Scheduling...' : 'Schedule Webinar'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
