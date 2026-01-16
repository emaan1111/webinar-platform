'use client'

import { useState } from 'react'
import RegistrationModal from '@/components/registration-pages/RegistrationModal'

interface EmbedRegistrationFormProps {
  webinarData: any
}

// Country codes - same as used in RegistrationModal
const COUNTRY_CODES = [
  { code: '+1', country: 'United States', pattern: /^[2-9]\d{2}[2-9]\d{6}$/ },
  { code: '+44', country: 'United Kingdom', pattern: /^[1-9]\d{9,10}$/ },
  { code: '+91', country: 'India', pattern: /^[6-9]\d{9}$/ },
  { code: '+971', country: 'UAE', pattern: /^[5]\d{8}$/ },
  { code: '+966', country: 'Saudi Arabia', pattern: /^[5]\d{8}$/ },
  { code: '+92', country: 'Pakistan', pattern: /^[3]\d{9}$/ },
  { code: '+880', country: 'Bangladesh', pattern: /^[1]\d{9}$/ },
  { code: '+20', country: 'Egypt', pattern: /^[1]\d{9}$/ },
  { code: '+27', country: 'South Africa', pattern: /^[6-8]\d{8}$/ },
  { code: '+61', country: 'Australia', pattern: /^[4]\d{8}$/ },
  { code: '+64', country: 'New Zealand', pattern: /^[2]\d{7,9}$/ },
  { code: '+65', country: 'Singapore', pattern: /^[689]\d{7}$/ },
  { code: '+60', country: 'Malaysia', pattern: /^[1]\d{8,9}$/ },
  { code: '+62', country: 'Indonesia', pattern: /^[8]\d{9,11}$/ },
  { code: '+63', country: 'Philippines', pattern: /^[9]\d{9}$/ },
  { code: '+94', country: 'Sri Lanka', pattern: /^[7]\d{8}$/ },
  { code: '+93', country: 'Afghanistan', pattern: /^[7]\d{8}$/ },
]

export default function EmbedRegistrationForm({ webinarData }: EmbedRegistrationFormProps) {
  const [showModal, setShowModal] = useState(true)

  const handleClose = () => {
    setShowModal(false)
    // Optionally reload or show success message
  }

  if (!showModal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Closed</h2>
          <p className="text-gray-600">Thank you for your interest!</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background: transparent !important;
        }
        /* Override fixed positioning for inline embed */
        .fixed.inset-0.z-50 {
          position: relative !important;
          z-index: 1 !important;
          display: block !important;
          padding: 0 !important;
        }
        /* Hide the backdrop overlay in inline embed */
        .fixed.inset-0.bg-gray-500 {
          display: none !important;
        }
        /* Ensure modal content is visible */
        .relative.transform {
          margin: 0 auto !important;
        }
      `}</style>
      <RegistrationModal
        onClose={handleClose}
        webinar={webinarData}
        countryCodes={COUNTRY_CODES}
      />
    </>
  )
}

// Timezone mapping for friendly names
const TIMEZONE_NAMES: Record<string, string> = {
  'America/New_York': 'EST (US & Canada)',
  'America/Chicago': 'CST (US & Canada)',
  'America/Denver': 'MST (US & Canada)',
  'America/Los_Angeles': 'PST (US & Canada)',
  'America/Anchorage': 'AKST (Alaska)',
  'Pacific/Honolulu': 'HST (Hawaii)',
  'Europe/London': 'GMT (London)',
  'Europe/Paris': 'CET (Paris)',
  'Europe/Berlin': 'CET (Berlin)',
  'Asia/Dubai': 'GST (Dubai)',
  'Asia/Kolkata': 'IST (India)',
  'Asia/Calcutta': 'IST (India)', // Alias for Kolkata
  'Asia/Singapore': 'SGT (Singapore)',
  'Asia/Tokyo': 'JST (Japan)',
  'Australia/Sydney': 'AEDT (Sydney)',
  'Pacific/Auckland': 'NZDT (Auckland)',
}

// Get friendly timezone name
const getTimezoneName = (timezone: string): string => {
  return TIMEZONE_NAMES[timezone] || timezone.replace(/_/g, ' ')
}

export default function EmbedRegistrationForm({ webinar }: EmbedRegistrationFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  })
  const [selectedSchedule, setSelectedSchedule] = useState('')
  const [userTimezone, setUserTimezone] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Detect user's timezone on component mount
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    setUserTimezone(detected)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/webinars/${webinar.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          scheduleId: selectedSchedule
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setSuccess(true)
      
      // Redirect to thank you page after 2 seconds
      setTimeout(() => {
        window.location.href = `/thank-you/${webinar.slug}?r=${data.registrationId}&s=${selectedSchedule}`
      }, 2000)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're Registered!</h2>
          <p className="text-gray-600">Redirecting to confirmation page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{webinar.title}</h1>
          {webinar.description && (
            <p className="text-sm text-gray-600">{webinar.description.substring(0, 150)}...</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Phone (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter your phone number"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Company (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Enter your company name"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Schedule Selection */}
          {webinar.schedules && webinar.schedules.length > 0 && (
            <div>
              {/* Timezone Selector - Compact */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  <Globe className="w-3 h-3 inline mr-1" />
                  Your Timezone
                </label>
                <select
                  value={userTimezone}
                  onChange={(e) => setUserTimezone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-gray-50 text-gray-700 focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                >
                  <option value="America/New_York">EST (US & Canada)</option>
                  <option value="America/Chicago">CST (US & Canada)</option>
                  <option value="America/Denver">MST (US & Canada)</option>
                  <option value="America/Los_Angeles">PST (US & Canada)</option>
                  <option value="America/Anchorage">AKST (Alaska)</option>
                  <option value="Pacific/Honolulu">HST (Hawaii)</option>
                  <option value="Europe/London">GMT (London)</option>
                  <option value="Europe/Paris">CET (Paris)</option>
                  <option value="Europe/Berlin">CET (Berlin)</option>
                  <option value="Asia/Dubai">GST (Dubai)</option>
                  <option value="Asia/Kolkata">IST (India)</option>
                  <option value="Asia/Singapore">SGT (Singapore)</option>
                  <option value="Asia/Tokyo">JST (Japan)</option>
                  <option value="Australia/Sydney">AEDT (Sydney)</option>
                  <option value="Pacific/Auckland">NZDT (Auckland)</option>
                </select>
              </div>

              {/* Date & Time Selection */}
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date & Time *
              </label>
              <div className="space-y-2">
                {webinar.schedules.slice(0, 3).map((schedule: any) => {
                  // Format the date and time in a user-friendly way
                  let dateDisplay = ''
                  let timeDisplay = ''
                  
                  if (schedule.scheduleType === 'specific' && schedule.scheduledAt) {
                    const scheduleDate = new Date(schedule.scheduledAt)
                    const displayTimezone = schedule.useUserTimezone ? userTimezone : (schedule.timezone || userTimezone)
                    
                    // Format date
                    dateDisplay = scheduleDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      timeZone: displayTimezone
                    })
                    
                    // Format time
                    const timeStr = scheduleDate.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      timeZone: displayTimezone
                    })
                    
                    // Get timezone abbreviation
                    const tzName = getTimezoneName(displayTimezone)
                    timeDisplay = `${timeStr} ${tzName}`
                    
                  } else if (schedule.scheduleType === 'justInTime') {
                    dateDisplay = 'On-Demand Webinar'
                    timeDisplay = `Starts ${schedule.minutesFromReg} minutes after you register`
                  } else if (schedule.scheduleType === 'recurring' && schedule.recurringPattern) {
                    // Parse recurring pattern to show friendly text
                    try {
                      const pattern = JSON.parse(schedule.recurringPattern)
                      if (pattern.frequency === 'daily') {
                        dateDisplay = 'Daily Webinar'
                        timeDisplay = pattern.time ? `Every day at ${pattern.time}` : 'Daily schedule'
                      } else if (pattern.frequency === 'weekly') {
                        const days = pattern.daysOfWeek || []
                        dateDisplay = 'Weekly Webinar'
                        timeDisplay = days.length > 0 
                          ? `Every ${days.join(', ')} at ${pattern.time || 'scheduled time'}`
                          : `Weekly at ${pattern.time || 'scheduled time'}`
                      } else if (pattern.frequency === 'monthly') {
                        dateDisplay = 'Monthly Webinar'
                        timeDisplay = `On the ${pattern.dayOfMonth || 'scheduled day'} at ${pattern.time || 'scheduled time'}`
                      } else {
                        dateDisplay = 'Recurring Webinar'
                        timeDisplay = 'Check schedule after registration'
                      }
                    } catch (e) {
                      dateDisplay = 'Recurring Webinar'
                      timeDisplay = 'Multiple dates available'
                    }
                  }

                  return (
                    <label
                      key={schedule.id}
                      className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedSchedule === schedule.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="schedule"
                        value={schedule.id}
                        checked={selectedSchedule === schedule.id}
                        onChange={(e) => setSelectedSchedule(e.target.value)}
                        className="mr-3"
                        required
                      />
                      <div className="flex-1">
                        <div className="flex items-start gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-gray-900 block">
                              {dateDisplay}
                            </span>
                            {timeDisplay && (
                              <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                                <Clock className="w-3 h-3" />
                                {timeDisplay}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-lg font-semibold"
          >
            {loading ? 'Registering...' : 'Register Now'}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-xs text-center text-gray-500 mt-4">
          By registering, you agree to receive webinar updates and reminders.
        </p>
      </div>
    </div>
  )
}
