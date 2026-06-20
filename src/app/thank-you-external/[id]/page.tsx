'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Built-in thank-you page for external (EverWebinar/WebinarJam) registrations.
 *
 * The popup embed redirects here after a successful registration, passing the chosen time
 * and name as query params (?t=...&name=...&reg=...). Hosts can use this page as their
 * redirect target, or point the embed at their own thank-you URL instead.
 */
function ThankYouInner() {
  const searchParams = useSearchParams()
  const time = searchParams.get('t') || ''
  const name = (searchParams.get('name') || '').trim()
  const firstName = name ? name.split(' ')[0] : ''

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-9 h-9 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          You&apos;re registered{firstName ? `, ${firstName}` : ''}! 🎉
        </h1>

        {time ? (
          <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Your session</p>
            <p className="text-lg font-semibold text-gray-900 mt-0.5">{time}</p>
            <p className="text-xs text-slate-500 mt-1">(shown in your local timezone)</p>
          </div>
        ) : null}

        <p className="text-gray-600 mt-5">
          Check your email for the link to join the webinar — we&apos;ve sent the details and
          we&apos;ll remind you before it starts.
        </p>

        <p className="text-xs text-gray-400 mt-6">
          Don&apos;t see the email? Check your spam or promotions folder.
        </p>
      </div>
    </div>
  )
}

export default function ExternalThankYouPage() {
  return (
    <Suspense fallback={null}>
      <ThankYouInner />
    </Suspense>
  )
}
