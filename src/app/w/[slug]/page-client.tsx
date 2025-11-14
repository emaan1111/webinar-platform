'use client'

import { useState, useEffect } from 'react'
import { Gift, Clock, CheckCircle, X, AlertCircle, Globe } from 'lucide-react'
import RegistrationPageTracker from '@/components/tracking/RegistrationPageTracker'

interface Schedule {
  id: string
  scheduleType: string
  scheduledAt: string | null
  minutesFromReg: number | null
  timezone: string | null
  useUserTimezone: boolean
  recurringPattern: string | null
}

interface Webinar {
  id: string
  slug: string | null
  title: string
  description: string
  duration: number
  schedules: Schedule[]
  maxSchedulesToShow?: number
  videoUrl?: string | null
  vimeoVideoId?: string | null
  offer?: any
  enableABTesting?: boolean
  testGroup?: 'A' | 'B' | null
}

interface RegistrationPage {
  id: string
  name: string
  htmlCode: string
  collectPhone?: boolean
  collectCompany?: boolean
  collectCustom1?: boolean
  customField1Label?: string | null
  collectCustom2?: boolean
  customField2Label?: string | null
  showHostInfo?: boolean
  showBenefits?: boolean
  showTestimonials?: boolean
  showCountdown?: boolean
  showSocialProof?: boolean
  showVideo?: boolean
  videoUrl?: string | null
  videoTitle?: string | null
  videoAutoplay?: boolean
  primaryColor?: string | null
  secondaryColor?: string | null
  backgroundColor?: string | null
  textColor?: string | null
  ctaButtonText?: string | null
  ctaButtonStyle?: string | null
}

// Constants kept outside the component to avoid re-allocating large arrays on every render
const countryCodes = [
  { code: '+1', country: 'US/Canada', pattern: /^\d{10}$/ },
  { code: '+44', country: 'UK', pattern: /^\d{10,11}$/ },
  { code: '+91', country: 'India', pattern: /^\d{10}$/ },
  { code: '+61', country: 'Australia', pattern: /^\d{9}$/ },
  { code: '+81', country: 'Japan', pattern: /^\d{10}$/ },
  { code: '+86', country: 'China', pattern: /^\d{11}$/ },
  { code: '+33', country: 'France', pattern: /^\d{9}$/ },
  { code: '+49', country: 'Germany', pattern: /^\d{10,11}$/ },
  { code: '+39', country: 'Italy', pattern: /^\d{10}$/ },
  { code: '+34', country: 'Spain', pattern: /^\d{9}$/ },
  { code: '+971', country: 'UAE', pattern: /^\d{9}$/ },
  { code: '+966', country: 'Saudi Arabia', pattern: /^\d{9}$/ },
  { code: '+92', country: 'Pakistan', pattern: /^\d{10}$/ },
  { code: '+880', country: 'Bangladesh', pattern: /^\d{10}$/ },
  { code: '+234', country: 'Nigeria', pattern: /^\d{10}$/ },
  { code: '+27', country: 'South Africa', pattern: /^\d{9}$/ },
  { code: '+55', country: 'Brazil', pattern: /^\d{11}$/ },
  { code: '+52', country: 'Mexico', pattern: /^\d{10}$/ },
  { code: '+63', country: 'Philippines', pattern: /^\d{10}$/ },
  { code: '+65', country: 'Singapore', pattern: /^\d{8}$/ },
]

const euCountries = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'UK'
]

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris, Berlin, Rome' },
  { value: 'Europe/Moscow', label: 'Moscow' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Kolkata', label: 'India' },
  { value: 'Asia/Calcutta', label: 'India' }, // Alias for Kolkata
  { value: 'Asia/Shanghai', label: 'China' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Australia/Sydney', label: 'Sydney' },
  { value: 'Pacific/Auckland', label: 'New Zealand' },
  { value: 'UTC', label: 'UTC' },
]

interface WebinarRegisterPageProps {
  webinarData: Webinar | null
  registrationPage?: RegistrationPage | null
}

// Popup Theme Configurations
const popupThemes = {
  purple: {
    headerBg: 'bg-gradient-to-r from-purple-600 to-blue-600',
    headerText: 'text-white',
    headerSubtext: 'text-purple-100',
    buttonBg: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    buttonShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
    focusRing: 'focus:ring-purple-500 focus:border-purple-500',
  },
  blue: {
    headerBg: 'bg-gradient-to-r from-blue-600 to-cyan-500',
    headerText: 'text-white',
    headerSubtext: 'text-blue-100',
    buttonBg: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    buttonShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
    focusRing: 'focus:ring-blue-500 focus:border-blue-500',
  },
  green: {
    headerBg: 'bg-gradient-to-r from-green-600 to-emerald-500',
    headerText: 'text-white',
    headerSubtext: 'text-green-100',
    buttonBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    buttonShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
    focusRing: 'focus:ring-green-500 focus:border-green-500',
  },
  red: {
    headerBg: 'bg-gradient-to-r from-red-600 to-pink-500',
    headerText: 'text-white',
    headerSubtext: 'text-red-100',
    buttonBg: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
    buttonShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
    focusRing: 'focus:ring-red-500 focus:border-red-500',
  },
  orange: {
    headerBg: 'bg-gradient-to-r from-orange-600 to-yellow-500',
    headerText: 'text-white',
    headerSubtext: 'text-orange-100',
    buttonBg: 'linear-gradient(135deg, #f97316 0%, #eab308 100%)',
    buttonShadow: '0 4px 14px rgba(249, 115, 22, 0.4)',
    focusRing: 'focus:ring-orange-500 focus:border-orange-500',
  },
  dark: {
    headerBg: 'bg-gradient-to-r from-gray-900 to-gray-700',
    headerText: 'text-white',
    headerSubtext: 'text-gray-300',
    buttonBg: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
    buttonShadow: '0 4px 14px rgba(31, 41, 55, 0.4)',
    focusRing: 'focus:ring-gray-500 focus:border-gray-500',
  },
}

export default function WebinarRegisterPage({ webinarData, registrationPage }: WebinarRegisterPageProps) {
  const webinar = webinarData
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [userTimezone, setUserTimezone] = useState('')
  const [selectedTimezone, setSelectedTimezone] = useState('')
  const [userCountry, setUserCountry] = useState('')
  const [isEU, setIsEU] = useState(false)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showTimezoneSelector, setShowTimezoneSelector] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+1',
    privacyConsent: true
  })

  // Helper function to get friendly timezone name
  const getTimezoneFriendlyName = (timezoneValue: string): string => {
    const timezone = timezones.find(tz => tz.value === timezoneValue)
    if (timezone) {
      return timezone.label
    }
    // Fallback: parse the timezone value
    return timezoneValue.split('/').pop()?.replace(/_/g, ' ') || timezoneValue
  }

  // Detect browser timezone immediately so the page can render without waiting for network calls
  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setUserTimezone(detectedTimezone)
    setSelectedTimezone(detectedTimezone)
    setLoading(false)
  }, [])

  // Fetch country info after the first paint so slow geo requests never block rendering
  useEffect(() => {
    const controller = new AbortController()
    const fetchCountry = () => {
      fetch('https://ipapi.co/json/', { signal: controller.signal })
        .then(res => res.json())
        .then(data => {
          const country = data.country_code
          setUserCountry(country)
          setIsEU(euCountries.includes(country))
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setIsEU(true)
          }
        })
    }

    let idleId: number | null = null
    let timeoutId: number | null = null

    if ('requestIdleCallback' in window) {
      idleId = (window as any).requestIdleCallback(() => {
        fetchCountry()
      }, { timeout: 1000 })
    } else {
      timeoutId = window.setTimeout(fetchCountry, 0)
    }

    return () => {
      controller.abort()
      if (idleId !== null) {
        ;(window as any).cancelIdleCallback?.(idleId)
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [])

  // Countdown timer can also run independently so it doesn't keep the render effect busy
  useEffect(() => {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 3)

    const timer = window.setInterval(() => {
      const now = new Date()
      const difference = targetDate.getTime() - now.getTime()

      setCountdown({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleOpenModal = () => {
      setShowScheduleModal(true)
    }
    
    const handleSelectSchedule = (e: any) => {
      const scheduleId = e.detail?.scheduleId
      if (scheduleId && webinar) {
        const schedule = webinar.schedules.find(s => s.id === scheduleId)
        if (schedule) {
          setSelectedSchedule(schedule)
        }
      }
    }
    
    // Expose global function for inline onclick handlers in custom templates
    (window as any).openModal = handleOpenModal;
    (window as any).openRegistrationModal = handleOpenModal;
    
    window.addEventListener('openRegistrationModal', handleOpenModal)
    window.addEventListener('selectSchedule', handleSelectSchedule as EventListener)

    return () => {
      window.removeEventListener('openRegistrationModal', handleOpenModal)
      window.removeEventListener('selectSchedule', handleSelectSchedule as EventListener)
      // Clean up global functions
      delete (window as any).openModal;
      delete (window as any).openRegistrationModal;
    }
  }, [webinar, registrationPage])

  // Setup button listeners for custom template (runs after DOM is rendered)
  useEffect(() => {
    if (!registrationPage || registered) return

    // Longer delay to ensure DOM is fully rendered with dangerouslySetInnerHTML
    const timer = setTimeout(() => {
      // Find buttons marked with data-action="register"
      const registerButtons = document.querySelectorAll('[data-action="register"]')

      if (registerButtons.length === 0) {
        return
      }

      registerButtons.forEach((button, index) => {
        const clickHandler = (e: Event) => {
          e.preventDefault()
          e.stopPropagation()
          e.stopImmediatePropagation()
          setShowScheduleModal(true)
        }
        
        // Try MULTIPLE event listeners to ensure one works
        button.addEventListener('click', clickHandler, true) // Capture phase
        button.addEventListener('click', clickHandler, false) // Bubble phase
        
        // Also try with pointer events
        button.addEventListener('pointerdown', () => {})
      })

      // Also handle schedule items if present
      const scheduleItems = document.querySelectorAll('[data-schedule-id], .schedule-item')
      
      scheduleItems.forEach((item) => {
        item.addEventListener('click', function(this: HTMLElement) {
          const scheduleId = this.getAttribute('data-schedule-id')
          if (scheduleId && webinar) {
            const schedule = webinar.schedules.find(s => s.id === scheduleId)
            if (schedule) {
              setSelectedSchedule(schedule)
            }
            setShowScheduleModal(true)
          }
        })
      })
    }, 500) // Increased delay to ensure template is rendered
    
    return () => clearTimeout(timer)
  }, [registrationPage, registered, webinar])

  // Generate multiple upcoming time slots for recurring schedules
  const generateRecurringSlots = (schedule: Schedule, count: number = 5) => {
    const slots: { id: string; time: Date; baseScheduleId: string }[] = []

    const pattern = JSON.parse(schedule.recurringPattern || '{}')

    const now = new Date()
    
    if (pattern.interval === 'daily') {
      const [hours, minutes] = pattern.time.split(':').map(Number)
      
      for (let i = 0; i < count; i++) {
        const slotDate = new Date()
        slotDate.setDate(now.getDate() + i)
        slotDate.setHours(hours, minutes, 0, 0)
        
        // Skip if time has already passed today
        if (slotDate > now) {
          slots.push({
            id: `${schedule.id}-slot-${i}`,
            time: slotDate,
            baseScheduleId: schedule.id
          })
        } else if (i === 0) {
          // If today's time passed, start from tomorrow
          const tomorrow = new Date()
          tomorrow.setDate(now.getDate() + 1)
          tomorrow.setHours(hours, minutes, 0, 0)
          slots.push({
            id: `${schedule.id}-slot-${i}`,
            time: tomorrow,
            baseScheduleId: schedule.id
          })
        }
      }
      
      // Fill remaining slots if we skipped today
      while (slots.length < count) {
        const lastSlot = slots[slots.length - 1]
        const nextSlot = new Date(lastSlot.time)
        nextSlot.setDate(nextSlot.getDate() + 1)
        slots.push({
          id: `${schedule.id}-slot-${slots.length}`,
          time: nextSlot,
          baseScheduleId: schedule.id
        })
      }
    } else if (pattern.interval === 'weekly' && pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
      const daysMap: Record<string, number> = {
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
        'Thursday': 4, 'Friday': 5, 'Saturday': 6
      }
      
      const [hours, minutes] = pattern.time.split(':').map(Number)
      
      // Handle both numeric days (e.g., [1]) and string days (e.g., ["Monday"])
      const targetDays = pattern.daysOfWeek.map((day: string | number) => {
        if (typeof day === 'number') {
          return day // Already numeric
        }
        return daysMap[day] // Convert string to number
      }).filter((day: number) => day !== undefined).sort((a: number, b: number) => a - b)
      
      let currentDate = new Date(now)
      let slotsGenerated = 0
      
      // Look ahead up to 20 weeks to find enough slots (supports up to 20 occurrences)
      for (let week = 0; week < 20 && slotsGenerated < count; week++) {
        for (const targetDay of targetDays) {
          if (slotsGenerated >= count) break
          
          const slotDate = new Date(currentDate)
          const currentDay = slotDate.getDay()
          const daysUntilTarget = (targetDay - currentDay + 7) % 7
          
          if (week === 0 && daysUntilTarget === 0) {
            // Same day - check if time hasn't passed
            slotDate.setHours(hours, minutes, 0, 0)
            if (slotDate > now) {
              slots.push({
                id: `${schedule.id}-slot-${slotsGenerated}`,
                time: slotDate,
                baseScheduleId: schedule.id
              })
              slotsGenerated++
            }
          } else {
            slotDate.setDate(slotDate.getDate() + daysUntilTarget + (week > 0 ? 7 * week : 0))
            slotDate.setHours(hours, minutes, 0, 0)
            if (slotDate > now) {
              slots.push({
                id: `${schedule.id}-slot-${slotsGenerated}`,
                time: slotDate,
                baseScheduleId: schedule.id
              })
              slotsGenerated++
            }
          }
        }
        if (week === 0) currentDate.setDate(currentDate.getDate() + 7)
      }
    } else {
      console.warn('⚠️ Unknown or incomplete pattern:', pattern)
    }

    return slots
  }

  const formatScheduleTime = (schedule: Schedule, slotTime?: Date) => {
    const tz = selectedTimezone || userTimezone
    
    // Get friendly timezone name
    const tzFriendly = getTimezoneFriendlyName(tz)
    
    // If a specific slot time is provided, format that
    if (slotTime) {
      const dateStr = slotTime.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        timeZone: tz
      })
      const timeStr = slotTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: tz
      })
      return `${dateStr}, ${timeStr} • ${tzFriendly}`
    }
    
    if (schedule.scheduleType === 'justInTime') {
      // Calculate exact time based on current time + minutes
      const futureTime = new Date()
      futureTime.setMinutes(futureTime.getMinutes() + (schedule.minutesFromReg || 0))
      
      const dateStr = futureTime.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        timeZone: tz
      })
      const timeStr = futureTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: tz
      })
      return `${dateStr}, ${timeStr} • ${tzFriendly}`
    }
    
    if (schedule.scheduleType === 'recurring') {
      const pattern = JSON.parse(schedule.recurringPattern || '{}')
      
      // Calculate next occurrence based on pattern
      const now = new Date()
      let nextDate = new Date()
      
      if (pattern.interval === 'daily') {
        // Set to today at the specified time
        const [hours, minutes] = pattern.time.split(':').map(Number)
        nextDate.setHours(hours, minutes, 0, 0)
        
        // If time has passed today, move to tomorrow
        if (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + 1)
        }
      } else if (pattern.interval === 'weekly' && pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        // Find next occurrence based on day of week
        const daysMap: Record<string, number> = {
          'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
          'Thursday': 4, 'Friday': 5, 'Saturday': 6
        }
        
        const [hours, minutes] = pattern.time.split(':').map(Number)
        const currentDay = now.getDay()
        const targetDays = pattern.daysOfWeek.map((day: string) => daysMap[day]).sort((a: number, b: number) => a - b)
        
        // Find next day of week
        let nextDay = targetDays.find((d: number) => d > currentDay)
        if (nextDay === undefined) {
          nextDay = targetDays[0]
          nextDate.setDate(nextDate.getDate() + (7 - currentDay + nextDay))
        } else {
          nextDate.setDate(nextDate.getDate() + (nextDay - currentDay))
        }
        
        nextDate.setHours(hours, minutes, 0, 0)
      }
      
      const dateStr = nextDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        timeZone: tz
      })
      const timeStr = nextDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: tz
      })
      return `${dateStr}, ${timeStr} • ${tzFriendly}`
    }
    
    if (schedule.scheduleType === 'specific' && schedule.scheduledAt) {
      const date = new Date(schedule.scheduledAt)
      const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        timeZone: tz
      })
      const timeStr = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: tz
      })
      return `${dateStr}, ${timeStr} • ${tzFriendly}`
    }
    
    return 'Schedule to be determined'
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Please enter your full name (at least 2 characters)'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Phone is optional, but if provided, validate it based on country code
    const selectedCountry = countryCodes.find(c => c.code === formData.countryCode)
    if (formData.phone.trim()) {
      if (selectedCountry && !selectedCountry.pattern.test(formData.phone.replace(/[\s\-]/g, ''))) {
        newErrors.phone = `Please enter a valid ${selectedCountry.country} phone number`
      } else if (!/^\d[\d\s\-]*\d$/.test(formData.phone.trim())) {
        newErrors.phone = 'Phone number can only contain digits, spaces, and hyphens'
      }
    }

    if (!formData.privacyConsent) {
      newErrors.privacyConsent = 'You must agree to the privacy policy'
    }

    if (!selectedSchedule) {
      newErrors.schedule = 'Please select a schedule'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async () => {
    if (!validateForm()) {
      return
    }

    setRegistering(true)

    try {
      // Calculate the exact start time for this registration
      let scheduleId = selectedSchedule!.id
      let selectedDateTime = selectedSchedule!.scheduledAt
      let scheduledStartTime: string | null = null
      
      // Check if this is a generated slot (contains "-slot-")
      if (scheduleId.includes('-slot-') && webinar) {
        const baseScheduleId = scheduleId.split('-slot-')[0]
        const baseSchedule = webinar.schedules.find(s => s.id === baseScheduleId)
        
        if (baseSchedule && baseSchedule.scheduleType === 'recurring') {
          // Find the slot to get the exact datetime
          const maxSlots = webinar.maxSchedulesToShow || 5
          const slots = generateRecurringSlots(baseSchedule, maxSlots * 2)
          const selectedSlot = slots.find(s => s.id === scheduleId)
          
          if (selectedSlot) {
            scheduleId = baseScheduleId
            selectedDateTime = selectedSlot.time.toISOString()
            scheduledStartTime = selectedSlot.time.toISOString() // Store the exact slot time
          }
        }
      } else if (selectedSchedule!.scheduleType === 'specific') {
        // Specific schedule - use the scheduled time
        scheduledStartTime = selectedSchedule!.scheduledAt
      } else if (selectedSchedule!.scheduleType === 'justInTime') {
        // Just-in-time - calculate from now
        const minutesFromReg = selectedSchedule!.minutesFromReg || 5
        scheduledStartTime = new Date(Date.now() + minutesFromReg * 60000).toISOString()
      }
      
      const response = await fetch(`/api/webinars/${webinar!.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: `${formData.countryCode} ${formData.phone.trim()}`,
          scheduleId: scheduleId,
          selectedDateTime: selectedDateTime, // For recurring schedules with specific time slot
          scheduledStartTime: scheduledStartTime, // NEW: The exact start time for this user's session
          timezone: selectedTimezone,
          privacyConsent: formData.privacyConsent,
          country: userCountry
        })
      })

      // Validate content-type before parsing JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an invalid response. Please try again.')
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Registration failed')
      }

      const registrationData = await response.json()
      
      // Track A/B test conversion if enabled
      if (webinar?.enableABTesting && registrationData.registrationId) {
        const payload = JSON.stringify({
          webinarId: webinar.id,
          registrationId: registrationData.registrationId,
        })

        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' })
          navigator.sendBeacon('/api/ab-test/track-conversion', blob)
        } else {
          fetch('/api/ab-test/track-conversion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
          }).catch(err => {
            console.error('Failed to track conversion:', err)
          })
        }
      }

      // Redirect to thank you page
      const thankYouUrl = `/thank-you/${webinar!.slug}?r=${registrationData.registrationId}&s=${scheduleId}`
      window.location.href = thankYouUrl
      
    } catch (error: any) {
      console.error('Registration error:', error)
      setErrors({ submit: error.message || 'Registration failed. Please try again.' })
    } finally {
      setRegistering(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!webinar) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-600">Webinar not found</p>
        </div>
      </div>
    )
  }

  // If custom template is provided, render it with registration functionality
  if (registrationPage && !registered) {
    // Track registration page visit
    const pageId = registrationPage.id
    const variantGroup = webinar.testGroup || null
    
    // Replace template variables with actual data
    let templateHtml = registrationPage.htmlCode
    
    // Remove script tags that might interfere with our button handlers
    templateHtml = templateHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    
    // Replace webinar variables
    templateHtml = templateHtml.replace(/\{\{webinar\.title\}\}/g, webinar.title)
    templateHtml = templateHtml.replace(/\{\{webinar\.description\}\}/g, webinar.description)
    templateHtml = templateHtml.replace(/\{\{webinar\.duration\}\}/g, String(webinar.duration))
    templateHtml = templateHtml.replace(/\{\{webinar\.host\}\}/g, 'Host')
    
    // Replace schedules
    const schedulesHtml = webinar.schedules.map((schedule) => {
      const timeStr = formatScheduleTime(schedule)
      return `<li class="schedule-item" style="padding: 12px; margin: 8px 0; border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; transition: all 0.3s ease;" data-schedule-id="${schedule.id}">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">🕒</span>
          <div>
            <div style="font-weight: 600; color: #333;">${timeStr}</div>
            <div style="font-size: 14px; color: #666;">Duration: ${webinar.duration} minutes</div>
          </div>
        </div>
      </li>`
    }).join('')
    
    templateHtml = templateHtml.replace(/\{\{schedules\}\}/g, schedulesHtml)
    
    return (
      <div className="custom-template-container">
        {/* Track registration page visit */}
        <RegistrationPageTracker
          webinarId={webinar.id}
          pageId={pageId}
          variant={variantGroup}
          templateName={registrationPage.name}
        />
        
        <div dangerouslySetInnerHTML={{ __html: templateHtml }} />
        
        {/* Registration Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
                onClick={() => setShowScheduleModal(false)}
              ></div>
              
              <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border-4 border-white/20" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                {/* Compact Header with gradient background */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 relative overflow-hidden">
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24"></div>
                  
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-2xl font-extrabold text-white mb-1 tracking-tight">Secure Your Spot!</h3>
                      <p className="text-purple-100 text-sm font-medium">Join thousands who've already registered</p>
                      
                      {/* Trust Badges - inline with text */}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-white/90">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-semibold">100% Secure</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/90">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                          </svg>
                          <span className="text-xs font-semibold">No Spam</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowScheduleModal(false)}
                      className="text-white hover:bg-white/20 transition-all duration-200 rounded-full p-2 hover:rotate-90 transform"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Form Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-8 py-6 space-y-5 bg-gradient-to-b from-gray-50 to-white">
                  {/* Name Field */}
                  <div>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="Enter your full name *"
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="Enter your email address *"
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div>
                    <div className="flex gap-2">
                      <select
                        value={formData.countryCode}
                        onChange={(e) => setFormData({ ...formData, countryCode: e.target.value, phone: '' })}
                        className="px-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium hover:border-gray-300 bg-white"
                        style={{ width: '130px' }}
                      >
                        {countryCodes.map((cc) => (
                          <option key={cc.code} value={cc.code}>
                            {cc.code} {cc.country}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d\s\-]/g, '')
                          setFormData({ ...formData, phone: value })
                        }}
                        className={`flex-1 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium ${
                          errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder={formData.countryCode === '+1' ? 'Phone number (optional)' : 'Phone number (optional)'}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Schedule Dropdown Selection */}
                  <div>
                    <label htmlFor="schedule-custom" className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      Select Webinar Time <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="schedule-custom"
                      value={selectedSchedule?.id || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        // Check if it's a slot ID (contains "-slot-")
                        if (value.includes('-slot-')) {
                          const baseScheduleId = value.split('-slot-')[0]
                          const baseSchedule = webinar.schedules.find(s => s.id === baseScheduleId)
                          if (baseSchedule) {
                            // Store the base schedule with the slot ID for later use
                            setSelectedSchedule({ ...baseSchedule, id: value } as any)
                          }
                        } else {
                          const schedule = webinar.schedules.find(s => s.id === value)
                          setSelectedSchedule(schedule || null)
                        }
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium ${
                        errors.schedule ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      } bg-white`}
                    >
                      <option value="">Choose your preferred time...</option>
                      {(() => {
                        const maxSchedulesToShow = webinar.maxSchedulesToShow || 5
                        
                        // Collect all time slots with their dates for sorting
                        interface TimeSlot {
                          id: string
                          time: Date
                          schedule: Schedule
                          isRecurring: boolean
                        }
                        
                        const allTimeSlots: TimeSlot[] = []
                        
                        // STEP 1: Add specific and just-in-time schedules
                        webinar.schedules.forEach((schedule) => {
                          if (schedule.scheduleType === 'specific' && schedule.scheduledAt) {
                            allTimeSlots.push({
                              id: schedule.id,
                              time: new Date(schedule.scheduledAt),
                              schedule,
                              isRecurring: false
                            })
                          } else if (schedule.scheduleType === 'justInTime') {
                            // JIT gets current time (will be sorted first)
                            allTimeSlots.push({
                              id: schedule.id,
                              time: new Date(),
                              schedule,
                              isRecurring: false
                            })
                          }
                        })
                        
                        // STEP 2: Generate slots from ALL recurring schedules (generate more than needed)
                        const recurringSchedules = webinar.schedules.filter(s => s.scheduleType === 'recurring')
                        recurringSchedules.forEach((schedule) => {
                          // Generate plenty of slots (we'll sort and limit later)
                          const slots = generateRecurringSlots(schedule, maxSchedulesToShow * 2)
                          slots.forEach((slot) => {
                            allTimeSlots.push({
                              id: slot.id,
                              time: slot.time,
                              schedule,
                              isRecurring: true
                            })
                          })
                        })
                        
                        // STEP 3: Sort all slots by time (earliest first)
                        allTimeSlots.sort((a, b) => a.time.getTime() - b.time.getTime())
                        
                        // STEP 4: Take the first N slots and convert to options
                        const finalSlots = allTimeSlots.slice(0, maxSchedulesToShow)
                        const allScheduleOptions = finalSlots.map((slot) => (
                          <option key={slot.id} value={slot.id}>
                            {slot.isRecurring 
                              ? formatScheduleTime(slot.schedule, slot.time)
                              : formatScheduleTime(slot.schedule)
                            }
                          </option>
                        ))
                        
                        return allScheduleOptions
                      })()}
                    </select>
                    {errors.schedule && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.schedule}
                      </p>
                    )}
                    
                    {/* Timezone Info with Change Link */}
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Times shown in {getTimezoneFriendlyName(selectedTimezone)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowTimezoneSelector(!showTimezoneSelector)}
                        className="text-xs text-purple-600 hover:text-purple-700 font-semibold underline"
                      >
                        Change
                      </button>
                    </div>

                    {/* Collapsible Timezone Selector */}
                    {showTimezoneSelector && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <label htmlFor="timezone-custom" className="block text-xs font-semibold text-gray-700 mb-2">
                          Select Your Timezone
                        </label>
                        <select
                          id="timezone-custom"
                          value={selectedTimezone}
                          onChange={(e) => {
                            setSelectedTimezone(e.target.value)
                            setShowTimezoneSelector(false)
                          }}
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
                        >
                          {timezones.map((tz) => (
                            <option key={tz.value} value={tz.value}>
                              {tz.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Privacy Policy Consent */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="privacyConsent"
                      checked={formData.privacyConsent}
                      onChange={(e) => setFormData({ ...formData, privacyConsent: e.target.checked })}
                      className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="privacyConsent" className="text-sm text-gray-700">
                      I agree to the <a href="/privacy" target="_blank" className="text-purple-600 hover:underline">Privacy Policy</a> and <a href="/terms" target="_blank" className="text-purple-600 hover:underline">Terms of Service</a>. <span className="text-red-500">*</span>
                    </label>
                  </div>
                  {errors.privacyConsent && (
                    <p className="text-sm text-red-600">{errors.privacyConsent}</p>
                  )}

                  {/* Submit Error */}
                  {errors.submit && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">{errors.submit}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowScheduleModal(false)}
                      disabled={registering}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleRegister}
                      disabled={registering}
                      className="px-6 py-2 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%)',
                        boxShadow: '0 4px 8px rgba(255, 107, 107, 0.3)'
                      }}
                    >
                      {registering ? 'Registering...' : 'Complete Registration'}
                    </button>
                  </div>

                  {/* Privacy Statement */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Your information is safe with us</p>
                        <p className="text-xs text-gray-600 mt-1">We respect your privacy and never share your data with third parties.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're Registered!</h2>
          <p className="text-gray-600 mb-4">
            Check your email for confirmation and webinar access details.
          </p>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-purple-800">
              <strong>Selected Time:</strong><br/>
              {selectedSchedule && formatScheduleTime(selectedSchedule)}
            </p>
          </div>
          <p className="text-sm text-gray-500">
            We've sent you an email with your webinar access link and calendar invite.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Track registration page visit for default template */}
      <RegistrationPageTracker
        webinarId={webinar.id}
        pageId={null}
        variant={webinar.testGroup || null}
        templateName="Default Template"
      />
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        body {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <header style={{
          background: 'linear-gradient(135deg, #6a4c93 0%, #4ecdc4 100%)',
          color: 'white',
          padding: '15px 0',
          textAlign: 'center'
        }}>
          <div className="container mx-auto px-4 max-w-5xl">
            <div style={{
              fontSize: '1rem',
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}>
              FREE CLASS FOR MOTHERS
            </div>
            <h1 style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: '10px'
            }}>
              {webinar.title}
            </h1>
            <p style={{
              fontSize: '0.95rem',
              marginBottom: '15px',
              maxWidth: '95%',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              You've taught them. You've reminded them. They pray and listen… but deep down, you feel it — their heart isn't fully in it.
            </p>
            <p style={{
              fontSize: '0.9rem',
              marginBottom: '15px'
            }}>
              {webinar.description}
            </p>
          </div>
        </header>

        {/* Bonus Section */}
        <section className="bg-white py-6 border-b-2 border-dashed" style={{ borderColor: '#4ecdc4' }}>
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="flex items-center justify-center flex-wrap gap-6">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 text-lg font-bold mb-2" style={{ color: '#6a4c93' }}>
                  <Gift className="w-5 h-5" />
                  BONUS GIFT
                </div>
                <p className="text-sm" style={{ color: '#2d3436' }}>
                  Attend and get for FREE the very inspiring story book for mothers sharing stories of great mothers, who raised great men!
                </p>
              </div>
              <img 
                src="https://z-cdn-media.chatglm.cn/files/6998d315-2977-4b25-84f9-4a6f22795255_unnamed%20%286%29.png?auth_key=1761852098-c3a12690badb453383fb2994d9c6f2c7-0-81fd39a4e3d7522b6a312db342ce01d8" 
                alt="Bonus gift" 
                className="w-[120px] h-[120px] rounded-lg object-cover shadow-lg"
                style={{ border: '3px solid #4ecdc4' }}
              />
            </div>
          </div>
        </section>

        {/* Timer Section */}
        <section className="bg-white py-4 text-center">
          <div className="container mx-auto px-4">
            <div style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#6a4c93',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              LIMITED AVAILABILITY
            </div>
            <div className="flex justify-center gap-2 mb-4">
              {[
                { label: 'Days', value: countdown.days },
                { label: 'Hours', value: countdown.hours },
                { label: 'Minutes', value: countdown.minutes },
                { label: 'Seconds', value: countdown.seconds }
              ].map((item) => (
                <div 
                  key={item.label}
                  className="rounded-lg shadow-md"
                  style={{
                    backgroundColor: '#6a4c93',
                    color: 'white',
                    padding: '6px 4px',
                    minWidth: '45px'
                  }}
                >
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1 }}>
                    {item.value}
                  </div>
                  <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', marginTop: '2px' }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowScheduleModal(true)}
              style={{
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 700,
                padding: '12px 25px',
                borderRadius: '50px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                boxShadow: '0 8px 16px rgba(255, 107, 107, 0.3)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 12px 20px rgba(255, 107, 107, 0.4)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(255, 107, 107, 0.3)'
              }}
            >
              CLAIM MY FREE PLACE
            </button>
          </div>
        </section>

        {/* What You Will Learn Section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#6a4c93', position: 'relative', paddingBottom: '12px' }}>
              What You Will Learn On This FREE Masterclass:
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60px',
                height: '3px',
                backgroundColor: '#4ecdc4',
                borderRadius: '2px'
              }}></div>
            </h2>
            
            <div className="space-y-6">
              <div className="p-5 rounded-lg bg-gray-50 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-2">
                  <span style={{ color: '#4ecdc4', fontSize: '1.5rem' }}>✅</span>
                  <h3 className="text-lg font-semibold" style={{ color: '#6a4c93' }}>
                    The one thing missing between your child knowing Islam… and loving it enough to hold on when you're not around
                  </h3>
                </div>
                <p className="text-gray-700 pl-10">
                  <span style={{ color: '#4ecdc4', fontWeight: 'bold' }}>→</span> You've taught the rituals. They're doing the actions. But you can feel the spark fading — and this is why.
                </p>
              </div>

              <div className="p-5 rounded-lg bg-gray-50 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-2">
                  <span style={{ color: '#4ecdc4', fontSize: '1.5rem' }}>✅</span>
                  <h3 className="text-lg font-semibold" style={{ color: '#6a4c93' }}>
                    How to reach a place in their heart no class, lecture, or screen-time limit ever could — even if they already feel far
                  </h3>
                </div>
                <p className="text-gray-700 pl-10">
                  <span style={{ color: '#4ecdc4', fontWeight: 'bold' }}>→</span> You don't need to beg. You don't need to bribe. You just need to speak to a part of them that's been waiting for you.
                </p>
              </div>

              <div className="p-5 rounded-lg bg-gray-50 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-2">
                  <span style={{ color: '#4ecdc4', fontSize: '1.5rem' }}>✅</span>
                  <h3 className="text-lg font-semibold" style={{ color: '#6a4c93' }}>
                    How to step into the one role no one taught you — not scholars, not teachers — but it's the role Allah trusted you with
                  </h3>
                </div>
                <p className="text-gray-700 pl-10">
                  <span style={{ color: '#4ecdc4', fontWeight: 'bold' }}>→</span> You've been showing up. But no one showed you this role. And that's what makes all the difference.
                </p>
              </div>
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => setShowScheduleModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 700,
                  padding: '12px 25px',
                  borderRadius: '50px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  boxShadow: '0 8px 16px rgba(255, 107, 107, 0.3)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 12px 20px rgba(255, 107, 107, 0.4)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(255, 107, 107, 0.3)'
                }}
              >
                CLICK HERE TO CLAIM YOUR FREE PLACE
              </button>
            </div>
          </div>
        </section>

        {/* Author Section */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="flex flex-wrap gap-8 items-center">
              <div className="flex-shrink-0 w-[180px] h-[180px] rounded-lg overflow-hidden shadow-lg" style={{ border: '3px solid #4ecdc4' }}>
                <img 
                  src="https://picsum.photos/seed/aribafarheen/180/180.jpg" 
                  alt="Ustadha Ariba Farheen"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-[250px]">
                <h3 className="text-3xl font-bold mb-2" style={{ color: '#6a4c93' }}>
                  Ustadha Ariba Farheen
                </h3>
                <p className="text-xl font-semibold mb-4" style={{ color: '#4ecdc4' }}>
                  Founder Emaan Power
                </p>
                <p className="text-gray-700 mb-4">
                  Benefit from the wisdom and experience of Ustadha Ariba Farheen, a dedicated mentor in faith-nurturing education. Over 18 years of experience teaching thousands of families around the world!
                </p>
                <p className="text-gray-700 mb-4">
                  For the past 20 years, I have helped more than 114,000 young Muslims across the globe discover their potential and become confident Muslims who contribute to our society.
                </p>
                <p className="text-gray-700">
                  <strong style={{ color: '#6a4c93' }}>Creator</strong> of online courses like My Guide to My Mother's Heart, Names of Allah, Enter My Paradise, and many more. <strong style={{ color: '#6a4c93' }}>Author</strong> of bestselling books including "Discover the Power of Salah" and "Secrets to Raising Strong and Confident Muslims".
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <footer style={{
          background: 'linear-gradient(135deg, #6a4c93 0%, #4ecdc4 100%)',
          padding: '25px 0',
          textAlign: 'center'
        }}>
          <div className="container mx-auto px-4">
            <button
              onClick={() => setShowScheduleModal(true)}
              style={{
                backgroundColor: 'white',
                color: '#6a4c93',
                fontSize: '1rem',
                fontWeight: 700,
                padding: '12px 25px',
                borderRadius: '50px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              CLICK HERE TO CLAIM YOUR FREE PLACE
            </button>
          </div>
        </footer>

        {/* Registration Modal */}
        {showScheduleModal && (() => {
          // Use default purple theme for all registration modals
          const theme = popupThemes.purple;
          
          return (
          <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-md">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div 
                className="fixed inset-0 bg-gradient-to-br from-purple-900/70 to-blue-900/70 transition-all duration-300" 
                onClick={() => setShowScheduleModal(false)}
              ></div>
              
              <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden modal-center border-4 border-white/20" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                {/* Compact Header with gradient background */}
                <div className={`${theme.headerBg} px-8 py-4 relative overflow-hidden`}>
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24"></div>
                  
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`text-2xl font-extrabold ${theme.headerText} mb-1 tracking-tight`}>Secure Your Spot!</h3>
                      <p className={`${theme.headerSubtext} text-sm font-medium`}>Join thousands who've already registered</p>
                      
                      {/* Trust Badges - inline with text */}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-white/90">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-semibold">100% Secure</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/90">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                          </svg>
                          <span className="text-xs font-semibold">No Spam</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowScheduleModal(false)}
                      className={`${theme.headerText} hover:bg-white/20 transition-all duration-200 rounded-full p-2 hover:rotate-90 transform`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-8 py-6 space-y-5 bg-gradient-to-b from-gray-50 to-white">
                  {/* Trust Message */}
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-blue-900">Your information is safe with us</p>
                        <p className="text-xs text-blue-700 mt-1">We respect your privacy and never share your data with third parties.</p>
                      </div>
                    </div>
                  </div>

                  {/* Name Field */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="John Doe"
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="john@example.com"
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.countryCode}
                        onChange={(e) => setFormData({ ...formData, countryCode: e.target.value, phone: '' })}
                        className="px-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium hover:border-gray-300 bg-white"
                        style={{ width: '130px' }}
                      >
                        {countryCodes.map((cc) => (
                          <option key={cc.code} value={cc.code}>
                            {cc.code} {cc.country}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d\s\-]/g, '')
                          setFormData({ ...formData, phone: value })
                        }}
                        className={`flex-1 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium ${
                          errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder={formData.countryCode === '+1' ? '555 123 4567' : 'Enter phone number'}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Schedule Dropdown Selection */}
                  <div>
                    <label htmlFor="schedule" className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      Select Webinar Time <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="schedule"
                      value={selectedSchedule?.id || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        // Check if it's a slot ID (contains "-slot-")
                        if (value.includes('-slot-')) {
                          const baseScheduleId = value.split('-slot-')[0]
                          const baseSchedule = webinar.schedules.find(s => s.id === baseScheduleId)
                          if (baseSchedule) {
                            // Store the base schedule with the slot ID for later use
                            setSelectedSchedule({ ...baseSchedule, id: value } as any)
                          }
                        } else {
                          const schedule = webinar.schedules.find(s => s.id === value)
                          setSelectedSchedule(schedule || null)
                        }
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium ${
                        errors.schedule ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      } bg-white`}
                    >
                      <option value="">Choose your preferred time...</option>
                      {(() => {
                        const maxSchedulesToShow = webinar.maxSchedulesToShow || 5
                        
                        // Collect all time slots with their dates for sorting
                        interface TimeSlot {
                          id: string
                          time: Date
                          schedule: Schedule
                          isRecurring: boolean
                        }
                        
                        const allTimeSlots: TimeSlot[] = []
                        
                        // STEP 1: Add specific and just-in-time schedules
                        webinar.schedules.forEach((schedule) => {
                          if (schedule.scheduleType === 'specific' && schedule.scheduledAt) {
                            allTimeSlots.push({
                              id: schedule.id,
                              time: new Date(schedule.scheduledAt),
                              schedule,
                              isRecurring: false
                            })
                          } else if (schedule.scheduleType === 'justInTime') {
                            // JIT gets current time (will be sorted first)
                            allTimeSlots.push({
                              id: schedule.id,
                              time: new Date(),
                              schedule,
                              isRecurring: false
                            })
                          }
                        })
                        
                        // STEP 2: Generate slots from ALL recurring schedules (generate more than needed)
                        const recurringSchedules = webinar.schedules.filter(s => s.scheduleType === 'recurring')
                        recurringSchedules.forEach((schedule) => {
                          // Generate plenty of slots (we'll sort and limit later)
                          const slots = generateRecurringSlots(schedule, maxSchedulesToShow * 2)
                          slots.forEach((slot) => {
                            allTimeSlots.push({
                              id: slot.id,
                              time: slot.time,
                              schedule,
                              isRecurring: true
                            })
                          })
                        })
                        
                        // STEP 3: Sort all slots by time (earliest first)
                        allTimeSlots.sort((a, b) => a.time.getTime() - b.time.getTime())
                        
                        // STEP 4: Take the first N slots and convert to options
                        const finalSlots = allTimeSlots.slice(0, maxSchedulesToShow)
                        const allScheduleOptions = finalSlots.map((slot) => (
                          <option key={slot.id} value={slot.id}>
                            {slot.isRecurring 
                              ? formatScheduleTime(slot.schedule, slot.time)
                              : formatScheduleTime(slot.schedule)
                            }
                          </option>
                        ))
                        
                        return allScheduleOptions
                      })()}
                    </select>
                    {errors.schedule && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.schedule}
                      </p>
                    )}
                    
                    {/* Timezone Info with Change Link */}
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Times shown in {getTimezoneFriendlyName(selectedTimezone)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowTimezoneSelector(!showTimezoneSelector)}
                        className="text-xs text-purple-600 hover:text-purple-700 font-semibold underline"
                      >
                        Change
                      </button>
                    </div>

                    {/* Collapsible Timezone Selector */}
                    {showTimezoneSelector && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <label htmlFor="timezone-selector" className="block text-xs font-semibold text-gray-700 mb-2">
                          Select Your Timezone
                        </label>
                        <select
                          id="timezone-selector"
                          value={selectedTimezone}
                          onChange={(e) => {
                            setSelectedTimezone(e.target.value)
                            setShowTimezoneSelector(false)
                          }}
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
                        >
                          {timezones.map((tz) => (
                            <option key={tz.value} value={tz.value}>
                              {tz.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Privacy Policy Consent */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="privacyConsent"
                      checked={formData.privacyConsent}
                      onChange={(e) => setFormData({ ...formData, privacyConsent: e.target.checked })}
                      className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="privacyConsent" className="text-sm text-gray-700">
                      I agree to the <a href="/privacy" target="_blank" className="text-purple-600 hover:underline">Privacy Policy</a> and <a href="/terms" target="_blank" className="text-purple-600 hover:underline">Terms of Service</a>. <span className="text-red-500">*</span>
                    </label>
                  </div>
                  {errors.privacyConsent && (
                    <p className="text-sm text-red-600">{errors.privacyConsent}</p>
                  )}

                  {/* Submit Error */}
                  {errors.submit && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800 font-medium">{errors.submit}</p>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-t-2 border-gray-200">
                  {/* Trust indicators */}
                  <div className="flex items-center justify-center gap-6 mb-4 pb-4 border-b border-gray-300">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">SSL Encrypted</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">GDPR Compliant</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">100% Free</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setShowScheduleModal(false)}
                      disabled={registering}
                      className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-white transition-all hover:shadow-md hover:border-gray-400"
                    >
                      Maybe Later
                    </button>
                    <button
                      type="button"
                      onClick={handleRegister}
                      disabled={registering}
                      className="flex-1 px-8 py-4 rounded-xl text-white font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                      style={{
                        background: theme.buttonBg,
                        boxShadow: theme.buttonShadow
                      }}
                    >
                      {/* Button glow effect */}
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                      
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {registering ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Securing your spot...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Yes, Reserve My Spot Now!
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                  
                  {/* Guarantee text */}
                  <p className="text-center text-xs text-gray-500 mt-4">
                    <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Your information is 100% secure and will never be shared
                  </p>
                </div>
              </div>
            </div>
          </div>
          );
        })()}
      </div>
    </>
  )
}
