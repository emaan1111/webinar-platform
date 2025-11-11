'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  TestTube2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  FileText,
  Calendar,
  Gift,
  Video,
  Info
} from 'lucide-react'

interface Template {
  id: string
  name: string
  description?: string
}

interface Schedule {
  id: string
  scheduleType: string
  scheduledAt?: string
  minutesFromReg?: number
}

interface Offer {
  id: string
  title: string
  price?: number
}

interface ABTestingConfigProps {
  webinarId?: string // For edit mode
  initialData?: {
    enableABTesting: boolean
    trafficSplitPercent: number
    testRegistrationPage: boolean
    regTemplateAId: string | null
    regTemplateBId: string | null
    testSchedule: boolean
    scheduleAIds: string | null
    scheduleBIds: string | null
    testOffer: boolean
    offerAId: string | null
    offerBId: string | null
    testVideo: boolean
    videoAId: string | null
    videoBId: string | null
  }
  onChange: (data: any) => void
}

export default function ABTestingConfig({ webinarId, initialData, onChange }: ABTestingConfigProps) {
  const [expanded, setExpanded] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  
  const [config, setConfig] = useState({
    enableABTesting: initialData?.enableABTesting ?? false,
    trafficSplitPercent: initialData?.trafficSplitPercent ?? 50,
    testRegistrationPage: initialData?.testRegistrationPage ?? false,
    regTemplateAId: initialData?.regTemplateAId ?? '',
    regTemplateBId: initialData?.regTemplateBId ?? '',
    testSchedule: initialData?.testSchedule ?? false,
    scheduleAIds: initialData?.scheduleAIds ?? '',
    scheduleBIds: initialData?.scheduleBIds ?? '',
    testOffer: initialData?.testOffer ?? false,
    offerAId: initialData?.offerAId ?? '',
    offerBId: initialData?.offerBId ?? '',
    testVideo: initialData?.testVideo ?? false,
    videoAId: initialData?.videoAId ?? '',
    videoBId: initialData?.videoBId ?? ''
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Fetch templates
  useEffect(() => {
    fetch('/api/registration-pages')
      .then(res => res.json())
      .then(data => setTemplates(data || []))
      .catch(err => console.error('Failed to fetch registration pages:', err))
  }, [])

  // Fetch schedules if editing
  useEffect(() => {
    if (webinarId) {
      fetch(`/api/webinars/${webinarId}`)
        .then(res => res.json())
        .then(data => {
          if (data.webinar?.schedules) {
            setSchedules(data.webinar.schedules)
          }
        })
        .catch(err => console.error('Failed to fetch schedules:', err))
    }
  }, [webinarId])

  // Fetch offers if editing
  useEffect(() => {
    if (webinarId) {
      fetch(`/api/offers?webinarId=${webinarId}`)
        .then(res => res.json())
        .then(data => setOffers(data.offers || []))
        .catch(err => console.error('Failed to fetch offers:', err))
    }
  }, [webinarId])

  // Update parent when config changes
  useEffect(() => {
    onChange(config)
    validateConfig()
  }, [config])

  const validateConfig = () => {
    const errors: string[] = []

    if (!config.enableABTesting) {
      setValidationErrors([])
      return
    }

    // Check if at least one test is enabled
    if (!config.testRegistrationPage && !config.testSchedule && !config.testOffer && !config.testVideo) {
      errors.push('Enable at least one test type')
    }

    // Validate registration page test
    if (config.testRegistrationPage) {
      if (!config.regTemplateAId || !config.regTemplateBId) {
        errors.push('Registration: Select both Page A and Page B')
      }
      if (config.regTemplateAId === config.regTemplateBId) {
        errors.push('Registration: Pages must be different')
      }
    }

    // Validate schedule test
    if (config.testSchedule) {
      const scheduleAIds = config.scheduleAIds?.split(',').filter(id => id.trim())
      const scheduleBIds = config.scheduleBIds?.split(',').filter(id => id.trim())
      
      if (!scheduleAIds?.length || !scheduleBIds?.length) {
        errors.push('Schedule: Select schedules for both variants')
      }
    }

    // Validate offer test
    if (config.testOffer) {
      if (!config.offerAId || !config.offerBId) {
        errors.push('Offer: Select both Offer A and Offer B')
      }
      if (config.offerAId === config.offerBId) {
        errors.push('Offer: Offers must be different')
      }
    }

    // Validate video test
    if (config.testVideo) {
      if (!config.videoAId || !config.videoBId) {
        errors.push('Video: Enter both Video A and Video B')
      }
      if (config.videoAId === config.videoBId) {
        errors.push('Video: Videos must be different')
      }
    }

    setValidationErrors(errors)
  }

  const updateConfig = (updates: Partial<typeof config>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const activeTestsCount = 
    (config.testRegistrationPage ? 1 : 0) +
    (config.testSchedule ? 1 : 0) +
    (config.testOffer ? 1 : 0) +
    (config.testVideo ? 1 : 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TestTube2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">A/B Testing (Optional)</h2>
              <p className="text-sm text-gray-500">
                Split test different elements to optimize conversions
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardBody>
          <div className="space-y-6">
            {/* Info Box */}
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">What is A/B Testing?</p>
                <p>Test different versions of your registration page, schedules, offers, or videos to see which performs better. Visitors are randomly split between variants and conversions are tracked automatically.</p>
              </div>
            </div>

            {/* Edit Mode Warning */}
            {webinarId && (
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">⚠️ Important Note</p>
                  <p>Changing A/B test configuration may affect ongoing tests. Test results and statistics will continue to accumulate, but changes to variants will apply to new visitors only.</p>
                </div>
              </div>
            )}

            {/* Master Toggle */}
            <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Enable A/B Testing</p>
                <p className="text-sm text-gray-500">Turn on split testing for this webinar</p>
              </div>
              <button
                type="button"
                onClick={() => updateConfig({ enableABTesting: !config.enableABTesting })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.enableABTesting ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.enableABTesting ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {config.enableABTesting && (
              <>
                {/* Traffic Split */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Traffic Split: {config.trafficSplitPercent}% to Variant A, {100 - config.trafficSplitPercent}% to Variant B
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={config.trafficSplitPercent}
                    onChange={(e) => updateConfig({ trafficSplitPercent: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0% (All B)</span>
                    <span>50% (Equal)</span>
                    <span>100% (All A)</span>
                  </div>
                </div>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800 mb-1">Configuration Issues:</p>
                        <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                          {validationErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Tests Summary */}
                {activeTestsCount > 0 && (
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-sm font-medium text-green-800">
                      ✓ {activeTestsCount} test{activeTestsCount !== 1 ? 's' : ''} active
                    </p>
                  </div>
                )}

                {/* Registration Page Test */}
                <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">Registration Page Template</p>
                        <p className="text-sm text-gray-500">Test different page designs</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateConfig({ testRegistrationPage: !config.testRegistrationPage })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.testRegistrationPage ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.testRegistrationPage ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {config.testRegistrationPage && (
                    <div className="grid grid-cols-2 gap-4 pl-8">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Page A <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={config.regTemplateAId}
                          onChange={(e) => updateConfig({ regTemplateAId: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select page...</option>
                          {templates.map(template => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Page B <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={config.regTemplateBId}
                          onChange={(e) => updateConfig({ regTemplateBId: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select page...</option>
                          {templates.map(template => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Schedule Test */}
                <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">Schedule Options</p>
                        <p className="text-sm text-gray-500">Test different time slots</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateConfig({ testSchedule: !config.testSchedule })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.testSchedule ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.testSchedule ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {config.testSchedule && (
                    <div className="grid grid-cols-2 gap-4 pl-8">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Schedules A <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={config.scheduleAIds}
                          onChange={(e) => updateConfig({ scheduleAIds: e.target.value })}
                          placeholder="schedule-1-id,schedule-2-id"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Comma-separated IDs</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Schedules B <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={config.scheduleBIds}
                          onChange={(e) => updateConfig({ scheduleBIds: e.target.value })}
                          placeholder="schedule-3-id,schedule-4-id"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Comma-separated IDs</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Offer Test */}
                <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Gift className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-gray-900">Special Offers</p>
                        <p className="text-sm text-gray-500">Test different pricing/offers</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateConfig({ testOffer: !config.testOffer })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.testOffer ? 'bg-purple-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.testOffer ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {config.testOffer && (
                    <div className="grid grid-cols-2 gap-4 pl-8">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Offer A <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={config.offerAId}
                          onChange={(e) => updateConfig({ offerAId: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Select offer...</option>
                          {offers.map(offer => (
                            <option key={offer.id} value={offer.id}>
                              {offer.title} {offer.price && `- $${offer.price}`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Offer B <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={config.offerBId}
                          onChange={(e) => updateConfig({ offerBId: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Select offer...</option>
                          {offers.map(offer => (
                            <option key={offer.id} value={offer.id}>
                              {offer.title} {offer.price && `- $${offer.price}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Video Test */}
                <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Video className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium text-gray-900">Video Content</p>
                        <p className="text-sm text-gray-500">Test different videos</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateConfig({ testVideo: !config.testVideo })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.testVideo ? 'bg-red-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.testVideo ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {config.testVideo && (
                    <div className="grid grid-cols-2 gap-4 pl-8">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Video A ID/URL <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={config.videoAId}
                          onChange={(e) => updateConfig({ videoAId: e.target.value })}
                          placeholder="123456789 or https://..."
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Vimeo ID or full URL</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Video B ID/URL <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={config.videoBId}
                          onChange={(e) => updateConfig({ videoBId: e.target.value })}
                          placeholder="987654321 or https://..."
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Vimeo ID or full URL</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Results Link */}
                {webinarId && config.enableABTesting && (
                  <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                    <p className="text-sm text-purple-800">
                      📊 View test results and analytics on the{' '}
                      <a 
                        href={`/dashboard/webinars/${webinarId}/ab-test`}
                        className="font-medium underline hover:text-purple-900"
                      >
                        A/B Test Results page
                      </a>
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardBody>
      )}
    </Card>
  )
}
