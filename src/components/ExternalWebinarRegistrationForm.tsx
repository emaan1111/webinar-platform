'use client'

import { useState, useEffect, FormEvent } from 'react'
import { COMMON_TIMEZONES, timezoneLabel } from '@/lib/timezones'

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
  thankYouUrl?: string | null
  schedules: Schedule[]
}

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
  } catch {
    return 'America/New_York'
  }
}

// Common dialing codes for the separate country-code selector.
const COUNTRY_CODES: { code: string; label: string }[] = [
  { code: '+1', label: 'US/Canada (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+92', label: 'Pakistan (+92)' },
  { code: '+91', label: 'India (+91)' },
  { code: '+880', label: 'Bangladesh (+880)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+966', label: 'Saudi Arabia (+966)' },
  { code: '+974', label: 'Qatar (+974)' },
  { code: '+965', label: 'Kuwait (+965)' },
  { code: '+973', label: 'Bahrain (+973)' },
  { code: '+968', label: 'Oman (+968)' },
  { code: '+20', label: 'Egypt (+20)' },
  { code: '+60', label: 'Malaysia (+60)' },
  { code: '+62', label: 'Indonesia (+62)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+63', label: 'Philippines (+63)' },
  { code: '+90', label: 'Turkey (+90)' },
  { code: '+27', label: 'South Africa (+27)' },
  { code: '+234', label: 'Nigeria (+234)' },
  { code: '+254', label: 'Kenya (+254)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+64', label: 'New Zealand (+64)' },
  { code: '+49', label: 'Germany (+49)' },
  { code: '+33', label: 'France (+33)' },
  { code: '+34', label: 'Spain (+34)' },
  { code: '+39', label: 'Italy (+39)' },
  { code: '+31', label: 'Netherlands (+31)' },
  { code: '+46', label: 'Sweden (+46)' },
  { code: '+47', label: 'Norway (+47)' },
  { code: '+353', label: 'Ireland (+353)' },
  { code: '+86', label: 'China (+86)' },
  { code: '+81', label: 'Japan (+81)' },
  { code: '+82', label: 'South Korea (+82)' },
  { code: '+7', label: 'Russia (+7)' },
  { code: '+55', label: 'Brazil (+55)' },
  { code: '+52', label: 'Mexico (+52)' },
  { code: '+93', label: 'Afghanistan (+93)' },
  { code: '+94', label: 'Sri Lanka (+94)' },
]

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
  onSuccess?: (data: { registrationId: string; liveRoomUrl?: string; scheduledTime?: string; name?: string; isJIT?: boolean; thankYouUrl?: string | null }) => void
  
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
  const [phoneCountryCode, setPhoneCountryCode] = useState('+1')
  const [selectedSchedule, setSelectedSchedule] = useState('')
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [webinarName, setWebinarName] = useState('')
  const [isJIT, setIsJIT] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingSchedules, setLoadingSchedules] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [thankYouUrl, setThankYouUrl] = useState<string | null>(null)

  // User's timezone — auto-detected, but the registrant can change it (re-fetches times).
  const [userTimezone, setUserTimezone] = useState<string>(detectTimezone)

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
        setThankYouUrl(data.thankYouUrl ?? null)
        
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
          phoneCountryCode: phone.trim() ? phoneCountryCode : undefined,
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
          scheduledTime: selectedScheduleData?.label,
          name: name.trim(),
          isJIT: selectedScheduleData?.isJIT,
          thankYouUrl,
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

      {/* Timezone selector — auto-detected, editable. Changing it re-fetches the times. */}
      {!loadingSchedules && schedules.length > 0 && (
        <div>
          <label htmlFor="tz" className="block text-sm font-medium text-gray-700 mb-1">
            Your Timezone
          </label>
          <select
            id="tz"
            value={userTimezone}
            onChange={(e) => setUserTimezone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            {!COMMON_TIMEZONES.includes(userTimezone) && (
              <option value={userTimezone}>{timezoneLabel(userTimezone)}</option>
            )}
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{timezoneLabel(tz)}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Times below are shown in this timezone.</p>
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
        </div>
      )}

      {/* Single schedule - just show the time */}
      {schedules.length === 1 && (
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Date & Time:</span> {schedules[0].label}
          </p>
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

      {/* Phone field (optional) — separate country code + number */}
      {showPhone && (
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Mobile Number <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="flex gap-2">
            <select
              aria-label="Country code"
              value={phoneCountryCode}
              onChange={(e) => setPhoneCountryCode(e.target.value)}
              className="w-28 shrink-0 px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code + c.label} value={c.code}>{c.label}</option>
              ))}
            </select>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="555 123 4567"
            />
          </div>
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
