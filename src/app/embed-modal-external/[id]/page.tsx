'use client'

import { Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import ExternalWebinarRegistrationForm from '@/components/ExternalWebinarRegistrationForm'

/**
 * Popup/inline modal embed for an EXTERNAL (EverWebinar/WebinarJam) webinar.
 *
 * Mirrors the internal /embed-modal/[slug] page: renders the registration form
 * (with the combined live-Zoom + JIT + recurring picker) on a transparent body so it
 * can be iframed into a popup, and posts `closeWebinarModal` to the parent on close.
 *
 * URL: /embed-modal-external/<externalWebinarId>?lp=<leadPageId>&button=Reserve%20My%20Spot&phone=true
 */
function ExternalEmbedModalInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string

  const leadPageId = searchParams.get('lp') || searchParams.get('leadPageId') || undefined
  const splitTestId = searchParams.get('st') || searchParams.get('splitTestId') || undefined
  const splitTestVariantId = searchParams.get('v') || searchParams.get('splitTestVariantId') || undefined
  const buttonText = searchParams.get('button') || undefined
  const showPhone = searchParams.get('phone') === 'true'
  const heading = searchParams.get('heading') || 'Save Your Seat'
  const subheading = searchParams.get('subheading') || 'Pick a time that works for you — we’ll email you the details.'

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage('closeWebinarModal', '*')
    }
  }

  return (
    <>
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          background: transparent !important;
        }
      `}</style>
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'transparent' }}
      >
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl relative">
          <button
            onClick={handleClose}
            aria-label="Close"
            className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-lg leading-none"
          >
            ✕
          </button>
          <div className="p-6 sm:p-8">
            <div className="mb-5 pr-8">
              <h2 className="text-xl font-bold text-gray-900">{heading}</h2>
              <p className="text-sm text-gray-500 mt-1">{subheading}</p>
            </div>
            <ExternalWebinarRegistrationForm
              webinarId={id}
              apiBaseUrl="/"
              leadPageId={leadPageId}
              splitTestId={splitTestId}
              splitTestVariantId={splitTestVariantId}
              buttonText={buttonText}
              showPhone={showPhone}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default function ExternalEmbedModalPage() {
  return (
    <Suspense fallback={null}>
      <ExternalEmbedModalInner />
    </Suspense>
  )
}
