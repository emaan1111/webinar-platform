'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

// Dynamically import templates to avoid SSR issues
const DefaultTemplate = dynamic(() => import('./templates/default'), { ssr: false })
const MinimalTemplate = dynamic(() => import('./templates/minimal'), { ssr: false })
const UrgencyTemplate = dynamic(() => import('./templates/urgency'), { ssr: false })
const CustomTemplate = dynamic(() => import('./templates/custom'), { ssr: false })

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
  registrationTemplate?: string
  customHtml?: string
  customCss?: string
  customJs?: string
}

export default function WebinarRegisterPage() {
  const params = useParams()
  const [webinar, setWebinar] = useState<Webinar | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWebinar()
  }, [params.slug])

  const fetchWebinar = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/webinars/public/${params.slug}`)
      
      if (!response.ok) {
        throw new Error('Webinar not found')
      }

      const data = await response.json()
      setWebinar(data.webinar)
    } catch (err) {
      console.error('Error fetching webinar:', err)
      setError('Webinar not found')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading webinar...</p>
        </div>
      </div>
    )
  }

  if (error || !webinar) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Webinar Not Found</h1>
          <p className="text-gray-600">The webinar you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  // Select template based on webinar.registrationTemplate
  const template = webinar.registrationTemplate || 'default'
  
  // Return appropriate template component
  if (template === 'minimal') {
    return <MinimalTemplate webinar={webinar} />
  } else if (template === 'urgency') {
    return <UrgencyTemplate webinar={webinar} />
  } else if (template === 'custom') {
    return <CustomTemplate webinar={webinar} />
  } else {
    return <DefaultTemplate webinar={webinar} />
  }
}
