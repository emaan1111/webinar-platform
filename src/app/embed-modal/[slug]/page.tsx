'use client'

import { useState, useEffect } from 'react'
import RegistrationModal from '@/components/registration-pages/RegistrationModal'
import { useParams, useSearchParams } from 'next/navigation'

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

export default function EmbedModalPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [webinar, setWebinar] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Extract tracking params from URL
  const splitTestId = searchParams.get('st') || undefined
  const variantId = searchParams.get('v') || undefined
  const leadPageId = searchParams.get('lp') || searchParams.get('leadPageId') || undefined

  useEffect(() => {
    async function fetchWebinar() {
      try {
        const response = await fetch(`/api/webinars/slug/${params.slug}`)
        if (!response.ok) throw new Error('Webinar not found')
        const data = await response.json()
        setWebinar(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchWebinar()
  }, [params.slug])

  const handleClose = () => {
    // Send message to parent window to close modal
    if (window.parent !== window) {
      window.parent.postMessage('closeWebinarModal', '*')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !webinar) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <p className="text-red-600 text-lg font-semibold">Webinar not found</p>
          <p className="text-gray-600 mt-2">{error || 'This webinar may have been removed or is no longer available.'}</p>
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
        /* Override fixed positioning for embed */
        .fixed.inset-0.z-50 {
          position: relative !important;
          z-index: 1 !important;
        }
        /* Hide the backdrop overlay in embed */
        .fixed.inset-0.bg-gray-500 {
          display: none !important;
        }
      `}</style>
      <RegistrationModal
        onClose={handleClose}
        webinar={webinar}
        countryCodes={COUNTRY_CODES}
        splitTestId={splitTestId}
        variantId={variantId}
        leadPageId={leadPageId}
      />
    </>
  )
}
