'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Gift, Clock, CheckCircle, X, AlertCircle, Globe } from 'lucide-react'
import { extractReferralCode } from '@/lib/referral'

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
  title: string
  description: string
  duration: number
  schedules: Schedule[]
}

export default function WebinarRegisterPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [webinar, setWebinar] = useState<Webinar | null>(null)
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
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gdprConsent: false,
    privacyConsent: true,
    marketingConsent: false
  })

  // EU countries for GDPR
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
    { value: 'Asia/Shanghai', label: 'China' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Asia/Singapore', label: 'Singapore' },
    { value: 'Australia/Sydney', label: 'Sydney' },
    { value: 'Pacific/Auckland', label: 'New Zealand' },
    { value: 'UTC', label: 'UTC' },
  ]

  useEffect(() => {
    // Extract referral code from URL (?ref=ABC123)
    const refCode = extractReferralCode(searchParams)
    if (refCode) {
      setReferralCode(refCode)
      console.log('🎁 Referral code detected:', refCode)
    }
    
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setUserTimezone(detectedTimezone)
    setSelectedTimezone(detectedTimezone)
    
    // Detect country (using ipapi.co)
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        const country = data.country_code
        setUserCountry(country)
        setIsEU(euCountries.includes(country))
      })
      .catch(() => {
        setIsEU(true) // Safe default
      })
    
    fetchWebinar()
    
    // Countdown timer
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 3)
    
    const timer = setInterval(() => {
      const now = new Date()
      const difference = targetDate.getTime() - now.getTime()
      
      setCountdown({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const fetchWebinar = async () => {
    try {
      const response = await fetch(`/api/webinars/public/${params.slug}`)
      if (response.ok) {
        const data = await response.json()
        setWebinar(data.webinar)
      }
    } catch (error) {
      console.error('Failed to fetch webinar:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatScheduleTime = (schedule: Schedule) => {
    if (schedule.scheduleType === 'justInTime') {
      return `Starts ${schedule.minutesFromReg} minutes after you register`
    }
    
    if (schedule.scheduleType === 'recurring') {
      const pattern = JSON.parse(schedule.recurringPattern || '{}')
      return `Recurring ${pattern.interval} at ${pattern.time}`
    }
    
    if (schedule.scheduleType === 'specific' && schedule.scheduledAt) {
      const date = new Date(schedule.scheduledAt)
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: selectedTimezone,
        timeZoneName: 'short'
      })
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

    // Phone is optional, but if provided, validate it
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    if (formData.phone.trim()) {
      if (formData.phone.trim().length < 10) {
        newErrors.phone = 'Please enter a valid phone number'
      } else if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Phone number can only contain numbers, spaces, and + - ( )'
      }
    }

    if (isEU && !formData.gdprConsent) {
      newErrors.gdprConsent = 'GDPR consent is required for EU residents'
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
      // For recurring schedules, extract the base schedule ID
      const scheduleId = (selectedSchedule as any).baseScheduleId || selectedSchedule!.id
      const selectedDateTime = selectedSchedule!.scheduledAt
      
      const response = await fetch(`/api/webinars/${webinar!.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          scheduleId: scheduleId,
          selectedDateTime: selectedDateTime, // For recurring schedules
          timezone: selectedTimezone,
          gdprConsent: formData.gdprConsent,
          privacyConsent: formData.privacyConsent,
          marketingConsent: formData.marketingConsent,
          country: userCountry,
          referralCode: referralCode || undefined // Include referral code if present
        })
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an invalid response. Please try again.')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setRegistered(true)
      
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
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
                onClick={() => setShowScheduleModal(false)}
              ></div>
              
              <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">Complete Your Registration</h3>
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="+1 (555) 123-4567"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                  </div>

                  {/* Timezone Selector */}
                  <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                      <Globe className="inline w-4 h-4 mr-1" />
                      Select Your Timezone
                    </label>
                    <select
                      id="timezone"
                      value={selectedTimezone}
                      onChange={(e) => setSelectedTimezone(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {timezones.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      All times will be shown in your selected timezone
                    </p>
                  </div>

                  {/* Schedule Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select a Schedule <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {webinar.schedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          onClick={() => setSelectedSchedule(schedule)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedSchedule?.id === schedule.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-purple-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {formatScheduleTime(schedule)}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Duration: {webinar.duration} minutes
                              </p>
                            </div>
                            {selectedSchedule?.id === schedule.id && (
                              <CheckCircle className="w-5 h-5 text-purple-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {errors.schedule && (
                      <p className="mt-2 text-sm text-red-600">{errors.schedule}</p>
                    )}
                  </div>

                  {/* GDPR Consent (for EU only) */}
                  {isEU && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="gdprConsent"
                          checked={formData.gdprConsent}
                          onChange={(e) => setFormData({ ...formData, gdprConsent: e.target.checked })}
                          className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="gdprConsent" className="text-sm text-gray-700">
                          <span className="font-medium">GDPR Consent</span> - I consent to the collection and processing of my personal data as described in the privacy policy. <span className="text-red-500">*</span>
                        </label>
                      </div>
                      {errors.gdprConsent && (
                        <p className="mt-2 text-sm text-red-600">{errors.gdprConsent}</p>
                      )}
                    </div>
                  )}

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

                  {/* Marketing Consent (Optional) */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="marketingConsent"
                      checked={formData.marketingConsent}
                      onChange={(e) => setFormData({ ...formData, marketingConsent: e.target.checked })}
                      className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="marketingConsent" className="text-sm text-gray-700">
                      I would like to receive updates, tips, and special offers via email (optional)
                    </label>
                  </div>

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
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
