'use client'

import { useState } from 'react'
import { Clock, CheckCircle } from 'lucide-react'

interface MinimalTemplateProps {
  webinar: any
  onRegister: (data: any) => Promise<void>
  schedules: any[]
  userTimezone: string
  isEU: boolean
}

export default function MinimalTemplate({ 
  webinar, 
  onRegister, 
  schedules,
  userTimezone,
  isEU 
}: MinimalTemplateProps) {
  const [showModal, setShowModal] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gdprConsent: false,
    privacyConsent: false,
    marketingConsent: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.phone || formData.phone.length < 10) {
      newErrors.phone = 'Please enter a valid phone number'
    }
    
    if (!formData.privacyConsent) {
      newErrors.privacyConsent = 'You must accept the privacy policy'
    }
    
    if (isEU && !formData.gdprConsent) {
      newErrors.gdprConsent = 'GDPR consent is required for EU residents'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    if (!selectedSchedule) {
      alert('Please select a schedule')
      return
    }
    
    setSubmitting(true)
    try {
      await onRegister({
        ...formData,
        scheduleId: selectedSchedule.id,
      })
      setShowModal(false)
    } catch (error) {
      console.error('Registration error:', error)
      alert('Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-2">{webinar.title}</h1>
          <p className="text-blue-100 text-lg">Free Live Training</p>
        </div>
      </header>

      {/* Main Content - Simple & Clean */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        
        {/* Description */}
        <div className="mb-8">
          <p className="text-xl text-gray-700 leading-relaxed">
            {webinar.description}
          </p>
        </div>

        {/* What You'll Learn - Simple Checklist */}
        <div className="bg-gray-50 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">What You'll Learn:</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700">Key strategies and techniques</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700">Step-by-step implementation guide</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700">Real-world examples and case studies</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700">Q&A with expert instructor</p>
            </div>
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2 mb-8 text-gray-600">
          <Clock className="w-5 h-5" />
          <span>{webinar.duration} minutes</span>
        </div>

        {/* CTA - Single, Clear, Above the Fold */}
        <div className="text-center py-12 border-t border-b border-gray-200">
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold px-12 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Register for Free
          </button>
          <p className="mt-4 text-gray-600">No credit card required</p>
        </div>

        {/* Available Sessions */}
        {schedules && schedules.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Available Sessions:</h3>
            <div className="grid gap-3">
              {schedules.map((schedule, index) => (
                <div 
                  key={schedule.id || index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
                >
                  {schedule.scheduleType === 'specific' && schedule.scheduledAt && (
                    <p className="text-gray-700">
                      {new Date(schedule.scheduledAt).toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        timeZone: schedule.timezone || userTimezone
                      })}
                    </p>
                  )}
                  {schedule.scheduleType === 'justInTime' && (
                    <p className="text-gray-700">
                      Starts {schedule.minutesFromReg} minutes after you register
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">Register Now</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Schedule Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Session *
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                onChange={(e) => {
                  const schedule = schedules[parseInt(e.target.value)]
                  setSelectedSchedule(schedule)
                }}
              >
                <option value="">Choose a session...</option>
                {schedules.map((schedule, index) => (
                  <option key={schedule.id || index} value={index}>
                    {schedule.scheduleType === 'specific' && schedule.scheduledAt
                      ? new Date(schedule.scheduledAt).toLocaleString()
                      : `Starts ${schedule.minutesFromReg} min after registration`}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your name"
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
              </div>

              {/* Privacy Consent */}
              <div>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={formData.privacyConsent}
                    onChange={(e) => setFormData({ ...formData, privacyConsent: e.target.checked })}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the privacy policy *
                  </span>
                </label>
                {errors.privacyConsent && <p className="text-red-600 text-sm mt-1">{errors.privacyConsent}</p>}
              </div>

              {/* GDPR (EU only) */}
              {isEU && (
                <div>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={formData.gdprConsent}
                      onChange={(e) => setFormData({ ...formData, gdprConsent: e.target.checked })}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-700">
                      I consent to the processing of my personal data (GDPR) *
                    </span>
                  </label>
                  {errors.gdprConsent && <p className="text-red-600 text-sm mt-1">{errors.gdprConsent}</p>}
                </div>
              )}

              {/* Marketing Consent */}
              <div>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={formData.marketingConsent}
                    onChange={(e) => setFormData({ ...formData, marketingConsent: e.target.checked })}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    Send me updates and special offers (optional)
                  </span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Registering...' : 'Complete Registration'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
