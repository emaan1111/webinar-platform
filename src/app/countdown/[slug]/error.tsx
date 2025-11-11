'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Countdown page error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
          <svg
            className="h-10 w-10 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Oops! Something went wrong
        </h2>
        
        <p className="text-gray-600 mb-6">
          We couldn't load the countdown page. This might happen if:
        </p>
        
        <ul className="text-left text-sm text-gray-600 mb-6 space-y-2">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>The webinar doesn't exist or has been removed</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Your registration link has expired</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>There's a temporary connection issue</span>
          </li>
        </ul>
        
        <div className="space-y-3">
          <Button
            onClick={reset}
            className="w-full"
          >
            Try again
          </Button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Go to Home
          </button>
        </div>
        
        {error.digest && (
          <p className="mt-6 text-xs text-gray-400">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
