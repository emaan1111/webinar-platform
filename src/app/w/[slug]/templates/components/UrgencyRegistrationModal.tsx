'use client'

import { useState } from 'react'

interface UrgencyTemplateProps {
  webinar: any
  onRegister: (data: any) => Promise<void>
  schedules: any[]
  isEU: boolean
  onClose: () => void
  spotsLeft: number
}

export default function UrgencyRegistrationModal({ 
  webinar, 
  onRegister, 
  schedules,
  isEU,
  onClose,
  spotsLeft
}: UrgencyTemplateProps) {
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
      onClose()
    } catch (error) {
      console.error('Registration error:', error)
      alert('Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto relative">
        {/* Close button */}
        <button
          onClick={onClose}
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
  )
}
