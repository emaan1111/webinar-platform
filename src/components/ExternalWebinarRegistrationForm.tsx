'use client'

import { useState, useEffect, FormEvent } from 'react'

interface Schedule {
  id: string
  date: string
  time: string
  label: string
  isJIT: boolean
}

interface SchedulesResponse {
  webinarId: string
  webinarName: string
  platform: string
  isJIT: boolean
  userTimezone: string
  schedules: Schedule[]
}

interface RegistrationFormProps {
  /**
   * The external webinar ID from our system (not the WebinarJam ID)
   */
  webinarId: string
  
  /**
   * API base URL for your app (include trailing slash)
   * e.g., "https://yourapp.com/" or "/" for same-origin
   */
  apiBaseUrl?: string
  
  /**
   * Lead page ID for tracking (optional)
   */
  leadPageId?: string

  /**
   * Split test tracking IDs (optional)
   */
  splitTestId?: string
  splitTestVariantId?: string
  
  /**
   * Callback when registration succeeds
   */
  onSuccess?: (data: { registrationId: string; liveRoomUrl?: string }) => void
  
  /**
   * Callback on error
   */
  onError?: (error: string) => void
  
  /**
   * Button text
   */
  buttonText?: string
  
  /**
   * Show phone field
   */
  showPhone?: boolean
  
  /**
   * Custom CSS class for the form container
   */
  className?: string
}

export default function ExternalWebinarRegistrationForm({
  webinarId,
  apiBaseUrl = '/',
  leadPageId,
  splitTestId,
  splitTestVariantId,
  onSuccess,
  onError,
  buttonText = 'Register Now',
  showPhone = false,
  className = '',
}: RegistrationFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedSchedule, setSelectedSchedule] = useState('')
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [webinarName, setWebinarName] = useState('')
  const [isJIT, setIsJIT] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingSchedules, setLoadingSchedules] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Get user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // Fetch available schedules on mount
  useEffect(() => {
    async function fetchSchedules() {
      try {
        setLoadingSchedules(true)
        const url = `${apiBaseUrl}api/external-webinars/${webinarId}/schedules?timezone=${encodeURIComponent(userTimezone)}`
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error('Failed to fetch schedules')
        }
        
        const data: SchedulesResponse = await response.json()
        setSchedules(data.schedules)
        setWebinarName(data.webinarName)
        setIsJIT(data.isJIT)
        
        // Auto-select first schedule if only one
        if (data.schedules.length === 1) {
          setSelectedSchedule(data.schedules[0].id)
        }
      } catch (err) {
        setError('Failed to load available times')
        console.error('Schedule fetch error:', err)
      } finally {
        setLoadingSchedules(false)
      }
    }

    fetchSchedules()
  }, [webinarId, apiBaseUrl, userTimezone])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validation
      if (!name.trim() || !email.trim()) {
        throw new Error('Name and email are required')
      }
      
      if (!selectedSchedule && schedules.length > 1) {
        throw new Error('Please select a time')
      }

      const scheduleToUse = selectedSchedule || schedules[0]?.id
      const selectedScheduleData = schedules.find(s => s.id === scheduleToUse)
      const searchParams = new URLSearchParams(window.location.search)
      const effectiveSplitTestId = splitTestId || searchParams.get('st') || searchParams.get('splitTestId') || undefined
      const effectiveSplitTestVariantId = splitTestVariantId || searchParams.get('v') || searchParams.get('splitTestVariantId') || undefined

      const response = await fetch(`${apiBaseUrl}api/external-webinars/${webinarId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          scheduleId: scheduleToUse,
          scheduledStartTime: selectedScheduleData?.label,
          timezone: userTimezone,
          leadPageId,
          splitTestId: effectiveSplitTestId,
          splitTestVariantId: effectiveSplitTestVariantId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      setSuccess(true)
      
      if (onSuccess) {
        onSuccess({
          registrationId: result.registration?.id,
          liveRoomUrl: result.registration?.liveRoomUrl,
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setError(errorMessage)
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  // Success state
  if (success) {
    return (
      <div className={`text-center p-6 ${className}`}>
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">You're Registered!</h3>
        <p className="text-gray-600">Check your email for details about joining the webinar.</p>
      </div>
    )
  }

  // Loading schedules
  if (loadingSchedules) {
    return (
      <div className={`text-center p-6 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading available times...</p>
      </div>
    )
  }

  // No schedules available
  if (schedules.length === 0) {
    return (
      <div className={`text-center p-6 ${className}`}>
        <p className="text-gray-600">No sessions currently available. Please check back later.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Name field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Your name"
        />
      </div>

      {/* Email field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="you@example.com"
        />
      </div>

      {/* Phone field (optional) */}
      {showPhone && (
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="+1 (555) 123-4567"
          />
        </div>
      )}

      {/* Schedule selector */}
      {schedules.length > 1 && (
        <div>
          <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 mb-1">
            Select a Time *
          </label>
          <select
            id="schedule"
            value={selectedSchedule}
            onChange={(e) => setSelectedSchedule(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose a time...</option>
            {schedules.map((schedule) => (
              <option key={`${schedule.id}-${schedule.label}`} value={schedule.id}>
                {schedule.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Times shown in your local timezone ({userTimezone})
          </p>
        </div>
      )}

      {/* Single schedule - just show the time */}
      {schedules.length === 1 && (
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Date & Time:</span> {schedules[0].label}
          </p>
          <p className="text-xs text-gray-500">
            (Shown in your local timezone: {userTimezone})
          </p>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Registering...' : buttonText}
      </button>
    </form>
  )
}
