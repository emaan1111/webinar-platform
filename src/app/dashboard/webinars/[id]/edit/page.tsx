'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import ABTestingConfig from '@/components/dashboard/ABTestingConfig'
import EmbedCodeGenerator from '@/components/dashboard/EmbedCodeGenerator'
import ThankYouTemplateSelector from '@/components/dashboard/ThankYouTemplateSelector'
import CountdownTemplateSelector from '@/components/dashboard/CountdownTemplateSelector'
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
  Trash2,
  Loader2
} from 'lucide-react'

export default function EditWebinarPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    slug: '',
    vimeoVideoId: '',
    videoUrl: '',
    videoDuration: 0,
    duration: 60,
    status: 'DRAFT',
    hasReplay: true,
    hasOffers: true,
    hasChat: true,
    hasReactions: true,
    thumbnail: '',
    registrationPageId: '',
    thankYouTemplateId: '',
    countdownPageId: '',
    registrationPopupStyle: 'center', // center, slide-up, fade, full-screen
    // A/B Testing fields
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
  const [templates, setTemplates] = useState<any[]>([])

  // Load registration pages on mount
  useEffect(() => {
    async function loadRegistrationPages() {
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
    loadRegistrationPages()
  }, [])

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

  // Fetch webinar data
  useEffect(() => {
    if (params.id) {
      fetchWebinar()
    }
  }, [params.id])

  const fetchWebinar = async () => {
    try {
      setIsFetching(true)
      const response = await fetch(`/api/webinars/${params.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch webinar')
      }
      const data = await response.json()
      const webinar = data.webinar
      
      // Populate form with existing data
      setFormData({
        title: webinar.title || '',
        description: webinar.description || '',
        slug: webinar.slug || '',
        vimeoVideoId: webinar.vimeoVideoId || '',
        videoUrl: webinar.videoUrl || '',
        videoDuration: webinar.videoDuration || 0,
        duration: webinar.duration || 60,
        status: webinar.status || 'DRAFT',
        hasReplay: webinar.hasReplay !== undefined ? webinar.hasReplay : true,
        hasOffers: webinar.hasOffers !== undefined ? webinar.hasOffers : true,
        hasChat: webinar.hasChat !== undefined ? webinar.hasChat : true,
        hasReactions: webinar.hasReactions !== undefined ? webinar.hasReactions : true,
        thumbnail: webinar.thumbnail || '',
        registrationPageId: webinar.registrationPageId || '',
        thankYouTemplateId: webinar.thankYouTemplateId || '',
        countdownPageId: webinar.countdownPageId || '',
        registrationPopupStyle: webinar.registrationPopupStyle || 'center',
        // A/B Testing fields
        enableABTesting: webinar.enableABTesting || false,
        trafficSplitPercent: webinar.trafficSplitPercent || 50,
        testRegistrationPage: webinar.testRegistrationPage || false,
        regPageAId: webinar.regPageAId || '',
        regPageBId: webinar.regPageBId || '',
        testSchedule: webinar.testSchedule || false,
        scheduleAIds: webinar.scheduleAIds || '',
        scheduleBIds: webinar.scheduleBIds || '',
        testOffer: webinar.testOffer || false,
        offerAId: webinar.offerAId || '',
        offerBId: webinar.offerBId || '',
        testVideo: webinar.testVideo || false,
        videoAId: webinar.videoAId || '',
        videoBId: webinar.videoBId || ''
      })

      // Convert schedules to the format used by the form
      if (webinar.schedules && Array.isArray(webinar.schedules)) {
        const formattedSchedules = webinar.schedules.map((schedule: any) => {
          if (schedule.scheduleType === 'specific' && schedule.scheduledAt) {
            const date = new Date(schedule.scheduledAt)
            return {
              scheduleType: 'specific',
              scheduledAt: date.toISOString().split('T')[0],
              scheduledTime: date.toTimeString().slice(0, 5),
              timezone: schedule.timezone || 'UTC',
              useUserTimezone: schedule.useUserTimezone || false
            }
          } else if (schedule.scheduleType === 'justInTime') {
            return {
              scheduleType: 'justInTime',
              minutesFromReg: schedule.minutesFromReg || 30
            }
          } else if (schedule.scheduleType === 'recurring' && schedule.recurringPattern) {
            return {
              scheduleType: 'recurring',
              recurringPattern: schedule.recurringPattern,
              timezone: schedule.timezone || 'UTC',
              useUserTimezone: schedule.useUserTimezone || false
            }
          }
          return schedule
        })
        setAdditionalSchedules(formattedSchedules)
      }
    } catch (err: any) {
      setError(err.message)
      console.error('Fetch webinar error:', err)
    } finally {
      setIsFetching(false)
    }
  }

  // Handle recurring interval change to show/hide day selectors
  useEffect(() => {
    const handleIntervalChange = () => {
      const intervalSelect = document.getElementById('newScheduleInterval') as HTMLSelectElement
      if (!intervalSelect) return
      
      const interval = intervalSelect.value
      const weeklySelector = document.getElementById('weeklyDaySelector')
      const monthlySelector = document.getElementById('monthlyDaySelector')
      
      if (weeklySelector) {
        weeklySelector.style.display = interval === 'weekly' ? 'block' : 'none'
      }
      if (monthlySelector) {
        monthlySelector.style.display = interval === 'monthly' ? 'block' : 'none'
      }
    }
    
    // Set up event listener
    window.addEventListener('intervalChange', handleIntervalChange)
    
    // Also call it immediately to set initial state
    setTimeout(handleIntervalChange, 100)
    
    return () => {
      window.removeEventListener('intervalChange', handleIntervalChange)
    }
  }, [newScheduleType, showAddSchedule])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters'
    }

    if (formData.duration < 15) {
      newErrors.duration = 'Duration must be at least 15 minutes'
    }

    if (additionalSchedules.length === 0) {
      newErrors.schedules = 'At least one schedule is required. Click "Add Schedule" to create one.'
      setError('At least one schedule is required. Please add at least one schedule before saving.')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault()
    
    console.log('Form submitted!')
    console.log('Current form data:', formData)
    console.log('Current schedules:', additionalSchedules)
    
    if (!validateForm()) {
      console.log('Validation failed:', errors)
      setError('Please fix all errors before submitting')
      return
    }

    console.log('Validation passed')

    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Map schedules to API format
      const allSchedules = additionalSchedules.map((schedule: any) => {
        const mappedSchedule: any = {
          scheduleType: schedule.scheduleType
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

      // Exclude slug from payload (it's auto-generated)
      const { slug, ...formDataWithoutSlug } = formData
      
      const payload = {
        ...formDataWithoutSlug,
        registrationPageId: formData.registrationPageId || null,
        thankYouTemplateId: formData.thankYouTemplateId || null,
        countdownPageId: formData.countdownPageId || null,
        vimeoVideoId: formData.vimeoVideoId || null,
        videoUrl: formData.videoUrl || null,
        videoDuration: formData.videoDuration || null,
        status: isDraft ? 'DRAFT' : formData.status,
        schedules: allSchedules,
        // A/B Testing data
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

      console.log('Sending webinar data:', payload)

      const response = await fetch(`/api/webinars/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      console.log('API Response status:', response.status)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update webinar')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/webinars')
      }, 1500)
    } catch (err: any) {
      setError(err.message)
      console.error('Update webinar error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const addSchedule = () => {
    const newSchedule: any = {
      scheduleType: newScheduleType
    }

    if (newScheduleType === 'specific') {
      const dateInput = document.getElementById('newScheduleDate') as HTMLInputElement
      const timeInput = document.getElementById('newScheduleTime') as HTMLInputElement
      const timezoneSelect = document.getElementById('newScheduleTimezone') as HTMLSelectElement

      if (!dateInput.value || !timeInput.value) {
        alert('Please select both date and time for the schedule')
        return
      }

      const timezone = timezoneSelect.value
      newSchedule.scheduledAt = dateInput.value
      newSchedule.scheduledTime = timeInput.value
      newSchedule.timezone = timezone
      newSchedule.useUserTimezone = timezone === 'USER_TIMEZONE'
    } else if (newScheduleType === 'justInTime') {
      const minutesInput = document.getElementById('newScheduleMinutes') as HTMLInputElement
      const minutes = parseInt(minutesInput.value) || 30
      
      newSchedule.minutesFromReg = minutes
    } else if (newScheduleType === 'recurring') {
      const intervalSelect = document.getElementById('newScheduleInterval') as HTMLSelectElement
      const timeInput = document.getElementById('newScheduleRecurringTime') as HTMLInputElement
      const timezoneSelect = document.getElementById('newScheduleRecurringTimezone') as HTMLSelectElement
      const dayOfWeekSelect = document.getElementById('newScheduleDayOfWeek') as HTMLSelectElement
      const dayOfMonthSelect = document.getElementById('newScheduleDayOfMonth') as HTMLSelectElement

      if (!timeInput.value) {
        alert('Please select a time for the recurring schedule')
        return
      }

      const interval = intervalSelect.value
      const timezone = timezoneSelect.value
      const pattern: any = {
        interval,
        time: timeInput.value
      }

      // Add day of week for weekly schedules
      if (interval === 'weekly' && dayOfWeekSelect) {
        const dayOfWeek = parseInt(dayOfWeekSelect.value)
        pattern.daysOfWeek = [dayOfWeek]
      }

      // Add day of month for monthly schedules
      if (interval === 'monthly' && dayOfMonthSelect) {
        pattern.dayOfMonth = parseInt(dayOfMonthSelect.value)
      }

      newSchedule.recurringPattern = JSON.stringify(pattern)
      newSchedule.timezone = timezone
      newSchedule.useUserTimezone = timezone === 'USER_TIMEZONE'
    }

    setAdditionalSchedules([...additionalSchedules, newSchedule])
    setShowAddSchedule(false)
    
    // Reset inputs
    const dateEl = document.getElementById('newScheduleDate') as HTMLInputElement
    const timeEl = document.getElementById('newScheduleTime') as HTMLInputElement
    const minutesEl = document.getElementById('newScheduleMinutes') as HTMLInputElement
    const recurringTimeEl = document.getElementById('newScheduleRecurringTime') as HTMLInputElement
    
    if (newScheduleType === 'specific' && dateEl && timeEl) {
      dateEl.value = ''
      timeEl.value = ''
    } else if (newScheduleType === 'justInTime' && minutesEl) {
      minutesEl.value = '30'
    } else if (newScheduleType === 'recurring' && recurringTimeEl) {
      recurringTimeEl.value = ''
    }
  }

  const removeSchedule = (index: number) => {
    setAdditionalSchedules(additionalSchedules.filter((_, i) => i !== index))
  }

  if (isFetching) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (error && !formData.title) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Edit Webinar</h1>
              <p className="mt-1 text-sm text-gray-500">Update your webinar details</p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Required fields are marked with *</strong>
          </p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800">Webinar updated successfully! Redirecting...</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Basic Information</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Webinar Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter webinar title"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Describe your webinar..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                {/* Registration Page */}
                <div>
                  <label htmlFor="registrationPageId" className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Page
                  </label>
                  <select
                    id="registrationPageId"
                    name="registrationPageId"
                    value={formData.registrationPageId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">No registration page (use default)</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} {template.isSystem && '(System)'}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {templates.length === 0 && 'No registration pages found. '}
                    <Link href="/dashboard/registration-pages" className="text-blue-600 hover:text-blue-700 underline">
                      Manage registration pages
                    </Link>
                    {' '}to customize your registration page design.
                    {formData.registrationPageId && (
                      <span>
                        {' '}•{' '}
                        <button
                          type="button"
                          onClick={() => window.open(`/api/registration-pages/${formData.registrationPageId}/preview`, '_blank')}
                          className="text-blue-600 hover:text-blue-700 underline"
                        >
                          Preview page
                        </button>
                      </span>
                    )}
                  </p>
                </div>

                {/* Vimeo Video ID */}
                <div>
                  <label htmlFor="vimeoVideoId" className="block text-sm font-medium text-gray-700 mb-1">
                    Vimeo Video ID
                  </label>
                  <input
                    type="text"
                    id="vimeoVideoId"
                    name="vimeoVideoId"
                    value={formData.vimeoVideoId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123456789"
                  />
                  <p className="mt-1 text-xs text-gray-500">Enter the numeric ID from your Vimeo video URL</p>
                </div>

                {/* Video URL */}
                <div>
                  <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Video URL (Alternative)
                  </label>
                  <input
                    type="url"
                    id="videoUrl"
                    name="videoUrl"
                    value={formData.videoUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <p className="mt-1 text-xs text-gray-500">Use if not using Vimeo</p>
                </div>

                {/* Video Duration */}
                <div>
                  <label htmlFor="videoDuration" className="block text-sm font-medium text-gray-700 mb-1">
                    Video Duration (seconds)
                  </label>
                  <input
                    type="number"
                    id="videoDuration"
                    name="videoDuration"
                    value={formData.videoDuration}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="3600"
                  />
                </div>

                {/* Webinar Duration */}
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                    Webinar Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.duration ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                  </select>
                  {errors.duration && (
                    <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
                  )}
                </div>

                {/* Thumbnail URL */}
                <div>
                  <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-1">
                    Thumbnail URL
                  </label>
                  <input
                    type="url"
                    id="thumbnail"
                    name="thumbnail"
                    value={formData.thumbnail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.thumbnail && (
                    <div className="mt-2">
                      <img src={formData.thumbnail} alt="Thumbnail preview" className="w-48 h-32 object-cover rounded-lg" />
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Registration Page Design */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Registration Page Design</h2>
              <p className="text-sm text-gray-600 mt-1">
                Choose a custom design for your registration page (optional)
              </p>
            </CardHeader>
            <CardBody>
              <div>
                <label htmlFor="registrationPageId" className="block text-sm font-medium text-gray-700 mb-1">
                  Page Design
                </label>
                <select
                  id="registrationPageId"
                  name="registrationPageId"
                  value={formData.registrationPageId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Default Design (Recommended)</option>
                  {templates.map((template: any) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  💡 Use the default design for reliability, or select a custom registration page design.
                </p>
                {formData.registrationPageId && (
                  <button
                    type="button"
                    onClick={() => window.open(`/api/registration-pages/${formData.registrationPageId}/preview`, '_blank')}
                    className="mt-2 text-sm text-purple-600 hover:text-purple-700"
                  >
                    Preview Design →
                  </button>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Schedules */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  Webinar Schedules <span className="text-red-500">*</span>
                </h2>
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
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No schedules added yet</p>
                  <p className="text-sm">Click "Add Schedule" to create your first schedule</p>
                </div>
              )}

              {/* Add Schedule Form */}
              {showAddSchedule && (
                <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Schedule</h3>
                  
                  {/* Schedule Type Selector */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setNewScheduleType('specific')}
                      className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-colors ${
                        newScheduleType === 'specific'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">Specific Date</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewScheduleType('justInTime')}
                      className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-colors ${
                        newScheduleType === 'justInTime'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">Just-in-Time</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewScheduleType('recurring')}
                      className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-colors ${
                        newScheduleType === 'recurring'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Repeat className="w-4 h-4" />
                      <span className="text-sm font-medium">Recurring</span>
                    </button>
                  </div>

                  {/* Specific Date Fields */}
                  {newScheduleType === 'specific' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                          <input
                            type="date"
                            id="newScheduleDate"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                          <input
                            type="time"
                            id="newScheduleTime"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                        <select
                          id="newScheduleTimezone"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          {commonTimezones.map((tz) => (
                            <option key={tz.value} value={tz.value}>
                              {tz.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Just-in-Time Fields */}
                  {newScheduleType === 'justInTime' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minutes from Registration
                      </label>
                      <input
                        type="number"
                        id="newScheduleMinutes"
                        defaultValue={30}
                        min={1}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Webinar will start X minutes after user registers
                      </p>
                    </div>
                  )}

                  {/* Recurring Fields */}
                  {newScheduleType === 'recurring' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Interval</label>
                        <select
                          id="newScheduleInterval"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          onChange={(e) => {
                            // Force re-render to show/hide day selectors
                            const interval = e.target.value;
                            const event = new Event('intervalChange');
                            (event as any).interval = interval;
                            window.dispatchEvent(event);
                          }}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      
                      {/* Weekly: Day of Week Selector */}
                      <div id="weeklyDaySelector" style={{ display: 'none' }}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
                        <select
                          id="newScheduleDayOfWeek"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="0">Sunday</option>
                          <option value="1">Monday</option>
                          <option value="2">Tuesday</option>
                          <option value="3">Wednesday</option>
                          <option value="4">Thursday</option>
                          <option value="5">Friday</option>
                          <option value="6">Saturday</option>
                        </select>
                      </div>
                      
                      {/* Monthly: Day of Month Selector */}
                      <div id="monthlyDaySelector" style={{ display: 'none' }}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Day of Month</label>
                        <select
                          id="newScheduleDayOfMonth"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                          <input
                            type="time"
                            id="newScheduleRecurringTime"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                          <select
                            id="newScheduleRecurringTimezone"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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

                  <div className="flex gap-2 mt-4">
                    <Button type="button" size="sm" onClick={addSchedule}>
                      Add This Schedule
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddSchedule(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Schedule List */}
              {additionalSchedules.length > 0 && (
                <div className="space-y-3">
                  {additionalSchedules.map((schedule: any, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        {schedule.scheduleType === 'specific' && (
                          <>
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {schedule.scheduledAt} at {schedule.scheduledTime}
                              </p>
                              <p className="text-xs text-gray-600">{schedule.timezone}</p>
                            </div>
                          </>
                        )}
                        {schedule.scheduleType === 'justInTime' && (
                          <>
                            <Clock className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Just-in-Time</p>
                              <p className="text-xs text-gray-600">
                                Starts {schedule.minutesFromReg} minutes after registration
                              </p>
                            </div>
                          </>
                        )}
                        {schedule.scheduleType === 'recurring' && (
                          <>
                            <Repeat className="w-5 h-5 text-purple-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Recurring</p>
                              <p className="text-xs text-gray-600">
                                {(() => {
                                  try {
                                    const pattern = JSON.parse(schedule.recurringPattern)
                                    return `${pattern.interval} at ${pattern.time}`
                                  } catch {
                                    return 'Recurring schedule'
                                  }
                                })()}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeSchedule(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {errors.schedules && (
                <p className="mt-2 text-sm text-red-600">{errors.schedules}</p>
              )}
            </CardBody>
          </Card>

          {/* Webinar Features */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Webinar Features</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="hasReplay"
                    checked={formData.hasReplay}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <Video className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Enable Replay</p>
                      <p className="text-xs text-gray-600">Allow attendees to watch the recording after the webinar</p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="hasChat"
                    checked={formData.hasChat}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <MessageSquare className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Enable Chat</p>
                      <p className="text-xs text-gray-600">Allow attendees to send messages during the webinar</p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="hasOffers"
                    checked={formData.hasOffers}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <DollarSign className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Enable Offers</p>
                      <p className="text-xs text-gray-600">Show special offers during the webinar</p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="hasReactions"
                    checked={formData.hasReactions}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <ThumbsUp className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Enable Reactions</p>
                      <p className="text-xs text-gray-600">Allow attendees to react with emojis</p>
                    </div>
                  </div>
                </label>
              </div>
            </CardBody>
          </Card>

          {/* A/B Testing Configuration */}
          <ABTestingConfig
            webinarId={params.id as string}
            initialData={{
              enableABTesting: formData.enableABTesting,
              trafficSplitPercent: formData.trafficSplitPercent,
              testRegistrationPage: formData.testRegistrationPage,
              regPageAId: formData.regPageAId,
              regPageBId: formData.regPageBId,
              testSchedule: formData.testSchedule,
              scheduleAIds: formData.scheduleAIds,
              scheduleBIds: formData.scheduleBIds,
              testOffer: formData.testOffer,
              offerAId: formData.offerAId,
              offerBId: formData.offerBId,
              testVideo: formData.testVideo,
              videoAId: formData.videoAId,
              videoBId: formData.videoBId
            }}
            onChange={(abTestData) => {
              setFormData({ ...formData, ...abTestData })
            }}
          />

          {/* Countdown Page Template */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">⏳ Countdown Page</h2>
              <p className="text-sm text-gray-600 mt-1">
                Choose the template for the pre-webinar countdown experience.
              </p>
            </CardHeader>
            <CardBody>
              <CountdownTemplateSelector
                webinarId={params.id as string}
                currentTemplateId={formData.countdownPageId}
                onChange={(templateId) => {
                  setFormData({ ...formData, countdownPageId: templateId || '' })
                }}
              />
            </CardBody>
          </Card>

          {/* Thank You Page Template */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">🎉 Thank You Page</h2>
              <p className="text-sm text-gray-600 mt-1">
                Choose which template to display after users register
              </p>
            </CardHeader>
            <CardBody>
              <ThankYouTemplateSelector
                webinarId={params.id as string}
                currentTemplateId={formData.thankYouTemplateId}
                onChange={(templateId) => {
                  setFormData({ ...formData, thankYouTemplateId: templateId || '' })
                }}
              />
            </CardBody>
          </Card>

          {/* Embed Code Generator */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">📋 Embed Registration Form</h2>
              <p className="text-sm text-gray-600 mt-1">
                Add a registration form to any website
              </p>
            </CardHeader>
            <CardBody>
              <EmbedCodeGenerator 
                webinarId={params.id as string} 
                webinarSlug={formData.slug || params.id as string}
              />
            </CardBody>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Status</h2>
            </CardHeader>
            <CardBody>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Webinar Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="LIVE">Live</option>
                  <option value="ENDED">Ended</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </CardBody>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Link href="/dashboard/webinars">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Webinar
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
