'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Clock, Users, Send, Calendar } from 'lucide-react'

interface Webinar {
  id: string
  title: string
  scheduledAt: string
  duration: number | null
  _count?: {
    registrations: number
  }
}

export default function PostWebinarRemindersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  
  // Form state
  const [selectedWebinar, setSelectedWebinar] = useState('')
  const [watchedMinimum, setWatchedMinimum] = useState(30) // minimum minutes watched
  const [watchedPercentage, setWatchedPercentage] = useState(50) // minimum percentage watched
  const [useMinutes, setUseMinutes] = useState(true) // true = minutes, false = percentage
  const [sendTiming, setSendTiming] = useState<'immediate' | 'scheduled'>('immediate')
  const [scheduledDays, setScheduledDays] = useState(1)
  const [smsMessage, setSmsMessage] = useState(
    'Hi {name}! Thanks for attending our webinar. We have a special offer for you: {offer_link}'
  )
  
  useEffect(() => {
    fetchWebinars()
  }, [])
  
  useEffect(() => {
    // Pre-select webinar from URL parameter
    const webinarId = searchParams.get('webinar')
    if (webinarId) {
      setSelectedWebinar(webinarId)
    }
  }, [searchParams, webinars])
  
  const fetchWebinars = async () => {
    try {
      const response = await fetch('/api/webinars?includeCounts=true')
      if (response.ok) {
        const data = await response.json()
        // Filter to show only webinars that have ended
        const endedWebinars = data.webinars.filter((w: Webinar) => {
          const webinarEnd = new Date(w.scheduledAt)
          if (w.duration) {
            webinarEnd.setMinutes(webinarEnd.getMinutes() + w.duration)
          }
          return webinarEnd < new Date()
        })
        setWebinars(endedWebinars)
      }
    } catch (error) {
      console.error('Error fetching webinars:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSendReminders = async () => {
    if (!selectedWebinar) {
      alert('Please select a webinar')
      return
    }
    
    if (!smsMessage.trim()) {
      alert('Please enter an SMS message')
      return
    }
    
    const confirmMessage = sendTiming === 'immediate'
      ? `Send SMS reminders NOW to attendees who watched ${useMinutes ? `${watchedMinimum}+ minutes` : `${watchedPercentage}%+`}?`
      : `Schedule SMS reminders to be sent in ${scheduledDays} day(s) to attendees who watched ${useMinutes ? `${watchedMinimum}+ minutes` : `${watchedPercentage}%+`}?`
    
    if (!confirm(confirmMessage)) return
    
    setSending(true)
    
    try {
      const response = await fetch('/api/reminders/post-webinar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webinarId: selectedWebinar,
          watchedMinimum: useMinutes ? watchedMinimum : null,
          watchedPercentage: !useMinutes ? watchedPercentage : null,
          message: smsMessage,
          sendTiming,
          scheduledDays: sendTiming === 'scheduled' ? scheduledDays : null
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to send reminders')
      }
      
      const data = await response.json()
      alert(`Success! ${data.scheduled || data.sent} SMS reminder(s) ${sendTiming === 'immediate' ? 'sent' : 'scheduled'}`)
      
      // Reset form
      setSelectedWebinar('')
      setSmsMessage('Hi {name}! Thanks for attending our webinar. We have a special offer for you: {offer_link}')
    } catch (error) {
      console.error('Error sending reminders:', error)
      alert('Failed to send reminders. Please try again.')
    } finally {
      setSending(false)
    }
  }
  
  const selectedWebinarData = webinars.find(w => w.id === selectedWebinar)
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Post-Webinar SMS Reminders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Send SMS reminders to attendees who watched your webinar up to a certain point
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Configure SMS Campaign</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              {/* Webinar Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Webinar
                </label>
                <select
                  value={selectedWebinar}
                  onChange={(e) => setSelectedWebinar(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="">Choose a webinar...</option>
                  {webinars.map(webinar => (
                    <option key={webinar.id} value={webinar.id}>
                      {webinar.title} - {new Date(webinar.scheduledAt).toLocaleDateString()} ({webinar._count?.registrations || 0} attendees)
                    </option>
                  ))}
                </select>
                {webinars.length === 0 && !loading && (
                  <p className="text-sm text-gray-500 mt-2">No completed webinars found</p>
                )}
              </div>
              
              {/* Watch Criteria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Watch Criteria
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={useMinutes}
                        onChange={() => setUseMinutes(true)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">By Minutes Watched</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={!useMinutes}
                        onChange={() => setUseMinutes(false)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">By Percentage Watched</span>
                    </label>
                  </div>
                  
                  {useMinutes ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="300"
                        value={watchedMinimum}
                        onChange={(e) => setWatchedMinimum(Number(e.target.value))}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">minutes minimum</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={watchedPercentage}
                        onChange={(e) => setWatchedPercentage(Number(e.target.value))}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">% minimum</span>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    Only attendees who watched at least this much will receive the SMS
                  </p>
                </div>
              </div>
              
              {/* Send Timing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  When to Send
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={sendTiming === 'immediate'}
                      onChange={() => setSendTiming('immediate')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Send Immediately</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={sendTiming === 'scheduled'}
                      onChange={() => setSendTiming('scheduled')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Schedule for Later</span>
                  </label>
                  
                  {sendTiming === 'scheduled' && (
                    <div className="ml-6 flex items-center gap-2">
                      <span className="text-sm text-gray-700">Send in</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={scheduledDays}
                        onChange={(e) => setScheduledDays(Number(e.target.value))}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">day(s)</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* SMS Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMS Message
                </label>
                <textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your SMS message..."
                  maxLength={160}
                />
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    Available variables: {'{name}'}, {'{webinar_title}'}, {'{offer_link}'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {smsMessage.length}/160 characters
                  </p>
                </div>
              </div>
              
              {/* Preview */}
              {selectedWebinarData && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Preview</h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p><strong>Webinar:</strong> {selectedWebinarData.title}</p>
                    <p><strong>Criteria:</strong> Watched {useMinutes ? `${watchedMinimum}+ minutes` : `${watchedPercentage}%+`}</p>
                    <p><strong>Timing:</strong> {sendTiming === 'immediate' ? 'Immediate' : `In ${scheduledDays} day(s)`}</p>
                    <p><strong>Estimated Recipients:</strong> Calculating based on watch data...</p>
                  </div>
                </div>
              )}
              
              {/* Send Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSendReminders}
                  disabled={!selectedWebinar || sending || !smsMessage.trim()}
                  className="inline-flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Processing...' : (sendTiming === 'immediate' ? 'Send SMS Now' : 'Schedule SMS')}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  )
}
