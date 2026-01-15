'use client'

import { useState } from 'react'
import { Clock, CheckCircle } from 'lucide-react'
import dynamic from 'next/dynamic'

const MinimalRegistrationModal = dynamic(() => import('./components/MinimalRegistrationModal'), {
  loading: () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="bg-white p-4 rounded-lg">Loading...</div></div>,
  ssr: false
})

interface MinimalTemplateProps {
  webinar: any
  onRegister: (data: any) => Promise<void>
  schedules: any[]
  userTimezone: string
  isEU: boolean
}

export default function MinimalTemplate({ 
  webinar, 
  onRegister, 
  schedules,
  userTimezone,
  isEU 
}: MinimalTemplateProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-2">{webinar.title}</h1>
          <p className="text-blue-100 text-lg">Free Live Training</p>
        </div>
      </header>

      {/* Main Content - Simple & Clean */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        
        {/* Description */}
        <div className="mb-8">
          <p className="text-xl text-gray-700 leading-relaxed">
            {webinar.description}
          </p>
        </div>

        {/* What You'll Learn - Simple Checklist */}
        <div className="bg-gray-50 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">What You'll Learn:</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700">Key strategies and techniques</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700">Step-by-step implementation guide</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700">Real-world examples and case studies</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700">Q&A with expert instructor</p>
            </div>
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2 mb-8 text-gray-600">
          <Clock className="w-5 h-5" />
          <span>{webinar.duration} minutes</span>
        </div>

        {/* CTA - Single, Clear, Above the Fold */}
        <div className="text-center py-12 border-t border-b border-gray-200">
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold px-12 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Register for Free
          </button>
          <p className="mt-4 text-gray-600">No credit card required</p>
        </div>

        {/* Available Sessions */}
        {schedules && schedules.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Available Sessions:</h3>
            <div className="grid gap-3">
              {schedules.map((schedule, index) => (
                <div 
                  key={schedule.id || index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
                >
                  {schedule.scheduleType === 'specific' && schedule.scheduledAt && (
                    <p className="text-gray-700">
                      {new Date(schedule.scheduledAt).toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        timeZone: schedule.timezone || userTimezone
                      })}
                    </p>
                  )}
                  {schedule.scheduleType === 'justInTime' && (
                    <p className="text-gray-700">
                      Starts {schedule.minutesFromReg} minutes after you register
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Registration Modal */}
      {showModal && (
        <MinimalRegistrationModal
          webinar={webinar}
          onRegister={onRegister}
          schedules={schedules}
          isEU={isEU}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
