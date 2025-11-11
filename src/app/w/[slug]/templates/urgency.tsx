'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertCircle, Gift, CheckCircle } from 'lucide-react'

interface UrgencyTemplateProps {
  webinar: any
  onRegister: (data: any) => Promise<void>
  schedules: any[]
  userTimezone: string
  isEU: boolean
}

export default function UrgencyTemplate({ 
  webinar, 
  onRegister, 
  schedules,
  userTimezone,
  isEU 
}: UrgencyTemplateProps) {
  const [countdown, setCountdown] = useState({ hours: 3, minutes: 47, seconds: 23 })
  const [spotsLeft] = useState(Math.floor(Math.random() * 30) + 20) // 20-50
  const [showModal, setShowModal] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gdprConsent: false,
    privacyConsent: true,
    marketingConsent: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Countdown timer
  useEffect(() => {
    const targetTime = new Date()
    targetTime.setHours(targetTime.getHours() + 3)

    const timer = setInterval(() => {
      const now = new Date()
      const difference = targetTime.getTime() - now.getTime()

      if (difference <= 0) {
        setCountdown({ hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const hours = Math.floor(difference / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setCountdown({ hours, minutes, seconds })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name required'
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email required'
    }
    // Phone is optional, but if provided, validate it
    if (formData.phone && formData.phone.length < 10) {
      newErrors.phone = 'Please enter a valid phone number (at least 10 digits)'
    }
    if (!formData.privacyConsent) {
      newErrors.privacyConsent = 'Must accept privacy policy'
    }
    if (isEU && !formData.gdprConsent) {
      newErrors.gdprConsent = 'GDPR consent required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || !selectedSchedule) return
    
    setSubmitting(true)
    try {
      await onRegister({ ...formData, scheduleId: selectedSchedule.id })
      setShowModal(false)
    } catch (error) {
      alert('Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-gradient-to-b from-red-50 to-orange-50 min-h-screen">
      {/* URGENT HEADER */}
      <header className="bg-gradient-to-r from-red-600 via-red-700 to-orange-600 text-white py-10 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* WARNING BADGE */}
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-400 text-red-900 px-6 py-2 rounded-full font-bold text-sm animate-pulse inline-flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              LIMITED TIME EVENT
            </div>
          </div>

          {/* TITLE */}
          <h1 className="text-4xl md:text-6xl font-black text-center mb-6 leading-tight">
            {webinar.title}
          </h1>

          {/* BIG COUNTDOWN */}
          <div className="mb-8">
            <p className="text-center text-yellow-300 font-semibold mb-3 text-lg">
              🔥 Event Starts In:
            </p>
            <div className="flex justify-center gap-3">
              <div className="bg-white text-red-600 rounded-xl p-4 md:p-6 min-w-[90px] md:min-w-[120px] shadow-2xl">
                <div className="text-4xl md:text-5xl font-black">{countdown.hours}</div>
                <div className="text-xs md:text-sm font-semibold uppercase">Hours</div>
              </div>
              <div className="bg-white text-red-600 rounded-xl p-4 md:p-6 min-w-[90px] md:min-w-[120px] shadow-2xl">
                <div className="text-4xl md:text-5xl font-black">{countdown.minutes}</div>
                <div className="text-xs md:text-sm font-semibold uppercase">Minutes</div>
              </div>
              <div className="bg-white text-red-600 rounded-xl p-4 md:p-6 min-w-[90px] md:min-w-[120px] shadow-2xl">
                <div className="text-4xl md:text-5xl font-black">{countdown.seconds}</div>
                <div className="text-xs md:text-sm font-semibold uppercase">Seconds</div>
              </div>
            </div>
          </div>

          {/* SCARCITY */}
          <div className="text-center mb-8">
            <div className="bg-yellow-400 text-red-900 inline-block px-8 py-4 rounded-full font-black text-xl shadow-lg">
              ⚠️ Only {spotsLeft} Spots Left!
            </div>
          </div>

          {/* MAIN CTA */}
          <div className="text-center">
            <button
              onClick={() => setShowModal(true)}
              className="bg-yellow-400 hover:bg-yellow-500 text-red-900 text-xl md:text-2xl font-black px-10 md:px-16 py-5 md:py-6 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-200 transform hover:scale-105 animate-pulse"
            >
              🎯 CLAIM YOUR FREE SPOT NOW!
            </button>
            <p className="text-yellow-200 mt-3 font-semibold">100% Free • No Credit Card Required</p>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        
        {/* URGENT BONUSES */}
        <div className="bg-white border-4 border-red-500 rounded-xl p-8 mb-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Gift className="w-8 h-8 text-red-600" />
            <h2 className="text-3xl font-black text-red-600">
              ⚡ FREE BONUSES - Ending in {countdown.hours}h {countdown.minutes}m
            </h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-red-50 p-4 rounded-lg">
              <CheckCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900">Exclusive PDF Guide ($97 Value)</h3>
                <p className="text-gray-600">Downloadable resource with implementation checklist</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-red-50 p-4 rounded-lg">
              <CheckCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900">Private Community Access ($47 Value)</h3>
                <p className="text-gray-600">Join exclusive group for continued support</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-red-50 p-4 rounded-lg">
              <CheckCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900">Templates & Tools ($67 Value)</h3>
                <p className="text-gray-600">Ready-to-use templates for immediate results</p>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-2xl font-black text-red-600">Total Value: $211 - Yours FREE!</p>
            <p className="text-gray-600 mt-1">⚠️ But you must register before timer runs out</p>
          </div>
        </div>

        {/* WHAT YOU'LL DISCOVER */}
        <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-xl p-8 mb-8 shadow-lg">
          <h2 className="text-3xl font-black text-center mb-6 text-gray-900">
            What You'll Discover in This FREE Training:
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">1</div>
              <p className="text-gray-800 font-medium">The #1 mistake keeping you from success (and how to fix it)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">2</div>
              <p className="text-gray-800 font-medium">A proven 3-step system used by top performers</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">3</div>
              <p className="text-gray-800 font-medium">How to get results in just 30 days or less</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">4</div>
              <p className="text-gray-800 font-medium">Real case studies and actionable strategies</p>
            </div>
          </div>
        </div>

        {/* URGENCY WARNING */}
        <div className="bg-red-600 text-white rounded-xl p-6 mb-8 text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertCircle className="w-6 h-6 animate-pulse" />
            <h3 className="text-2xl font-black">DON'T MISS OUT!</h3>
          </div>
          <p className="text-lg mb-4">This training is ONLY available for a limited time. Once the {spotsLeft} remaining spots are gone, registration closes FOREVER.</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-red-900 text-xl font-black px-8 py-4 rounded-full shadow-xl"
          >
            REGISTER NOW - IT'S FREE!
          </button>
        </div>

        {/* DESCRIPTION */}
        <div className="bg-white rounded-xl p-8 mb-8 shadow-lg">
          <p className="text-lg text-gray-700 leading-relaxed">
            {webinar.description}
          </p>
          <div className="mt-4 flex items-center gap-2 text-gray-600">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">{webinar.duration} minutes of pure value</span>
          </div>
        </div>
      </main>

      {/* STICKY BOTTOM CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white py-4 shadow-2xl z-40 border-t-4 border-yellow-400">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-black">{countdown.hours}:{countdown.minutes}:{countdown.seconds}</div>
            <div>
              <p className="font-bold">Only {spotsLeft} spots left!</p>
              <p className="text-sm text-red-200">Register now before it's too late</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-red-900 font-black px-8 py-3 rounded-full text-lg shadow-xl whitespace-nowrap"
          >
            CLAIM MY SPOT →
          </button>
        </div>
      </div>

      {/* REGISTRATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto relative">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>

            {/* Urgency header */}
            <div className="bg-red-600 text-white rounded-lg p-4 mb-6 -mt-2 -mx-2">
              <h3 className="text-2xl font-black text-center">🔥 Claim Your Spot!</h3>
              <p className="text-center text-red-100 text-sm">Only {spotsLeft} spots remaining</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Schedule Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Select Session *
                </label>
                <select
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  onChange={(e) => {
                    const schedule = schedules[parseInt(e.target.value)]
                    setSelectedSchedule(schedule)
                  }}
                >
                  <option value="">Choose your session...</option>
                  {schedules.map((schedule, index) => (
                    <option key={schedule.id || index} value={index}>
                      {schedule.scheduleType === 'specific' && schedule.scheduledAt
                        ? new Date(schedule.scheduledAt).toLocaleString()
                        : `Starts ${schedule.minutesFromReg} min after you register`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  placeholder="Your full name"
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  placeholder="your@email.com"
                />
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
              </div>

              {/* Consents */}
              <div className="space-y-3">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={formData.privacyConsent}
                    onChange={(e) => setFormData({ ...formData, privacyConsent: e.target.checked })}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-700">I accept the privacy policy *</span>
                </label>
                {errors.privacyConsent && <p className="text-red-600 text-sm">{errors.privacyConsent}</p>}

                {isEU && (
                  <>
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={formData.gdprConsent}
                        onChange={(e) => setFormData({ ...formData, gdprConsent: e.target.checked })}
                        className="mt-1"
                      />
                      <span className="text-sm text-gray-700">I consent to data processing (GDPR) *</span>
                    </label>
                    {errors.gdprConsent && <p className="text-red-600 text-sm">{errors.gdprConsent}</p>}
                  </>
                )}

                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={formData.marketingConsent}
                    onChange={(e) => setFormData({ ...formData, marketingConsent: e.target.checked })}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-700">Send me updates and bonuses</span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-lg py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {submitting ? 'SECURING YOUR SPOT...' : '🎯 YES! CLAIM MY FREE SPOT NOW'}
              </button>

              <p className="text-center text-xs text-gray-500">
                🔒 Your information is secure and will never be shared
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
