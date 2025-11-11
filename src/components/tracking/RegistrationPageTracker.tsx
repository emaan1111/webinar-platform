'use client'

import { useEffect, useRef } from 'react'

interface RegistrationPageTrackerProps {
  webinarId: string
  pageId?: string | null
  variant?: string | null
  templateName?: string
}

/**
 * Client component that tracks registration page visits
 * Should be included on every registration page
 */
export default function RegistrationPageTracker({ 
  webinarId, 
  pageId,
  variant,
  templateName 
}: RegistrationPageTrackerProps) {
  const tracked = useRef(false)
  const startTime = useRef<number>(Date.now())
  const visitorIdRef = useRef<string | null>(null)

  useEffect(() => {
    // Only track once per page load
    if (tracked.current) return
    tracked.current = true

    // Get or create visitor ID
    let visitorId = localStorage.getItem('visitorId')
    if (!visitorId) {
      visitorId = crypto.randomUUID()
      localStorage.setItem('visitorId', visitorId)
    }
    visitorIdRef.current = visitorId

    // Detect device type
    const device = window.innerWidth <= 768 ? 'mobile' : (window.innerWidth <= 1024 ? 'tablet' : 'desktop')

    // Track the page visit
    const trackVisit = async () => {
      try {
        const response = await fetch('/api/tracking/page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webinarId,
            pageType: 'registration',
            pageId: pageId || null,
            variantGroup: variant || null,
            action: 'enter',
            visitorId,
            device,
            browser: navigator.userAgent,
            referrer: document.referrer || null,
          }),
        })
        
        const data = await response.json()
        if (data.visitorId) {
          visitorIdRef.current = data.visitorId
          localStorage.setItem('visitorId', data.visitorId)
        }
      } catch (error) {
        console.error('Failed to track registration page visit:', error)
      }
    }

    trackVisit()

    // Track time on page when user leaves
    const trackTimeOnPage = () => {
      const timeSpent = Math.floor((Date.now() - startTime.current) / 1000) // in seconds
      
      // Only track if spent more than 1 second (to filter out bounces)
      if (timeSpent > 1 && visitorIdRef.current) {
        const data = JSON.stringify({
          webinarId,
          pageType: 'registration',
          pageId: pageId || null,
          variantGroup: variant || null,
          action: 'leave',
          visitorId: visitorIdRef.current,
        })
        
        // Use sendBeacon for reliable tracking on page unload
        const blob = new Blob([data], { type: 'application/json' })
        navigator.sendBeacon('/api/tracking/page', blob)
      }
    }

    // Track when user leaves page
    window.addEventListener('beforeunload', trackTimeOnPage)
    
    // Also track on visibility change (tab switch, minimize, etc)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackTimeOnPage()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', trackTimeOnPage)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [webinarId, pageId, variant])

  // This component doesn't render anything
  return null
}
