'use client'

import { useState, useEffect } from 'react'
import DOMPurify from 'isomorphic-dompurify'
import dynamic from 'next/dynamic'

const CustomRegistrationModal = dynamic(() => import('./components/CustomRegistrationModal'), {
  loading: () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="bg-white p-4 rounded-lg">Loading...</div></div>,
  ssr: false
})

interface CustomTemplateProps {
  webinar: any
  onRegister: (data: any) => Promise<void>
  schedules: any[]
  userTimezone: string
  isEU: boolean
}

export default function CustomTemplate({ 
  webinar, 
  onRegister, 
  schedules,
  userTimezone,
  isEU 
}: CustomTemplateProps) {
  const [processedHtml, setProcessedHtml] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null)

  useEffect(() => {
    if (webinar.customHtml) {
      // Process the HTML with variable replacement
      let html = webinar.customHtml

      // Replace template variables
      html = html.replace(/\{\{webinar\.title\}\}/g, webinar.title || '')
      html = html.replace(/\{\{webinar\.description\}\}/g, webinar.description || '')
      html = html.replace(/\{\{webinar\.duration\}\}/g, webinar.duration || '')
      
      // Replace schedule placeholders
      if (schedules && schedules.length > 0) {
        const scheduleHtml = schedules.map((schedule, index) => {
          if (schedule.scheduleType === 'specific' && schedule.scheduledAt) {
            return `<div class="schedule-item" data-schedule-index="${index}">
              ${new Date(schedule.scheduledAt).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                timeZone: schedule.timezone || userTimezone
              })}
            </div>`
          } else if (schedule.scheduleType === 'justInTime') {
            return `<div class="schedule-item" data-schedule-index="${index}">
              Starts ${schedule.minutesFromReg} minutes after you register
            </div>`
          }
          return ''
        }).join('')

        html = html.replace(/\{\{schedules\}\}/g, scheduleHtml)
      }

      // Sanitize HTML to prevent XSS attacks
      const sanitized = DOMPurify.sanitize(html, {
        ADD_TAGS: ['style'],
        ADD_ATTR: ['onclick', 'data-schedule-index', 'data-action'],
      })

      setProcessedHtml(sanitized)
    }
  }, [webinar, schedules, userTimezone])

  // Handle clicks on CTA buttons in custom HTML
  useEffect(() => {
    const handleCustomClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Check if clicked element or parent has data-action attribute
      const actionElement = target.closest('[data-action]') as HTMLElement
      if (actionElement) {
        const action = actionElement.getAttribute('data-action')
        
        if (action === 'register' || action === 'open-modal') {
          e.preventDefault()
          setShowModal(true)
        }
        
        if (action === 'select-schedule') {
          const scheduleIndex = actionElement.getAttribute('data-schedule-index')
          if (scheduleIndex) {
            const schedule = schedules[parseInt(scheduleIndex)]
            setSelectedSchedule(schedule)
            setShowModal(true)
          }
        }
      }
    }

    document.addEventListener('click', handleCustomClick)
    return () => document.removeEventListener('click', handleCustomClick)
  }, [schedules])

  return (
    <>
      {/* Inject Custom CSS */}
      {webinar.customCss && (
        <style dangerouslySetInnerHTML={{ __html: webinar.customCss }} />
      )}

      {/* Render Custom HTML */}
      <div 
        className="custom-template-wrapper"
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />

      {/* Inject Custom JavaScript */}
      {webinar.customJs && (
        <script dangerouslySetInnerHTML={{ __html: webinar.customJs }} />
      )}

      {/* Registration Modal (Standard) */}
      {showModal && (
        <CustomRegistrationModal
          webinar={webinar}
          onRegister={onRegister}
          schedules={schedules}
          isEU={isEU}
          onClose={() => setShowModal(false)}
          preSelectedSchedule={selectedSchedule}
        />
      )}
    </>
  )
}
