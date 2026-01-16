'use client'

import { useState } from 'react'
import RegistrationModal from '@/components/registration-pages/RegistrationModal'

interface EmbedRegistrationFormProps {
  webinarData: any
  splitTestId?: string
  variantId?: string
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

export default function EmbedRegistrationForm({ webinarData, splitTestId, variantId }: EmbedRegistrationFormProps) {
  const [showModal, setShowModal] = useState(true)

  const handleClose = () => {
    setShowModal(false)
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
        .fixed.inset-0.z-50 {
          position: relative !important;
          z-index: 1 !important;
          display: block !important;
          padding: 0 !important;
        }
        .fixed.inset-0.bg-gray-500 {
          display: none !important;
        }
        .relative.transform {
          margin: 0 auto !important;
        }
      `}</style>
      <RegistrationModal
        onClose={handleClose}
        webinar={webinarData}
        countryCodes={COUNTRY_CODES}
        splitTestId={splitTestId}
        variantId={variantId}
      />
    </>
  )
}
