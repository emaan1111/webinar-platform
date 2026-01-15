'use client'

import { useState } from 'react'
import { Clock, CheckCircle } from 'lucide-react'

interface MinimalTemplateProps {
  webinar: any
  onRegister: (data: any) => Promise<void>
  schedules: any[]
  isEU: boolean
  onClose: () => void
}

export default function MinimalRegistrationModal({ 
  webinar, 
  onRegister, 
  schedules, 
  isEU,
  onClose 
}: MinimalTemplateProps) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold">Register Now</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select a specific time
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
  )
}
