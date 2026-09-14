'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Common timezones organized by region
const TIMEZONE_OPTIONS = [
  { region: 'North America', zones: [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'America/Anchorage',
    'America/Honolulu',
    'America/Toronto',
    'America/Vancouver',
    'America/Mexico_City'
  ]},
  { region: 'Europe', zones: [
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Rome',
    'Europe/Madrid',
    'Europe/Amsterdam',
    'Europe/Brussels',
    'Europe/Vienna',
    'Europe/Stockholm',
    'Europe/Warsaw'
  ]},
  { region: 'Asia', zones: [
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Asia/Singapore',
    'Asia/Bangkok',
    'Asia/Jakarta',
    'Asia/Manila'
  ]},
  { region: 'Australia & Pacific', zones: [
    'Australia/Sydney',
    'Australia/Melbourne',
    'Australia/Brisbane',
    'Australia/Perth',
    'Pacific/Auckland',
    'Pacific/Fiji'
  ]},
  { region: 'South America', zones: [
    'America/Sao_Paulo',
    'America/Buenos_Aires',
    'America/Santiago',
    'America/Lima',
    'America/Bogota'
  ]},
  { region: 'Africa', zones: [
    'Africa/Cairo',
    'Africa/Lagos',
    'Africa/Johannesburg',
    'Africa/Nairobi',
    'Africa/Casablanca'
  ]}
]

// Common dialing codes for the allowed-countries list
const COUNTRY_OPTIONS = [
  { code: '1', label: 'United States & Canada (+1)' },
  { code: '44', label: 'United Kingdom (+44)' },
  { code: '61', label: 'Australia (+61)' },
  { code: '64', label: 'New Zealand (+64)' },
  { code: '353', label: 'Ireland (+353)' },
  { code: '27', label: 'South Africa (+27)' },
  { code: '971', label: 'UAE (+971)' },
  { code: '91', label: 'India (+91)' },
  { code: '92', label: 'Pakistan (+92)' },
]

export default function SMSSettingsPage() {
  const [blockedTimezones, setBlockedTimezones] = useState<string[]>([])
  const [allowedCountryCodes, setAllowedCountryCodes] = useState<string[]>([])
  const [customCode, setCustomCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/sms')
      if (response.ok) {
        const data = await response.json()
        setBlockedTimezones(data.blockedTimezones || [])
        setAllowedCountryCodes(data.allowedCountryCodes || [])
      }
    } catch (error) {
      console.error('Error fetching SMS settings:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleCountry = (code: string) => {
    setAllowedCountryCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  const handleAddCustomCode = () => {
    const code = customCode.replace(/\D/g, '')
    if (!code) return
    setAllowedCountryCodes(prev => (prev.includes(code) ? prev : [...prev, code]))
    setCustomCode('')
  }

  const handleToggleTimezone = (timezone: string) => {
    setBlockedTimezones(prev =>
      prev.includes(timezone)
        ? prev.filter(tz => tz !== timezone)
        : [...prev, timezone]
    )
  }

  const handleSelectAllInRegion = (zones: string[]) => {
    const allSelected = zones.every(zone => blockedTimezones.includes(zone))
    if (allSelected) {
      setBlockedTimezones(prev => prev.filter(tz => !zones.includes(tz)))
    } else {
      setBlockedTimezones(prev => [...new Set([...prev, ...zones])])
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch('/api/settings/sms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedTimezones, allowedCountryCodes })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'SMS settings saved successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' })
      }
    } catch (error) {
      console.error('Error saving SMS settings:', error)
      setMessage({ type: 'error', text: 'Error saving settings' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading settings...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">SMS Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Control who receives SMS to reduce costs: limit sending to specific countries, or block specific timezones. Applies to every SMS the app sends (reminders and post-session).
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Allowed Countries</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {allowedCountryCodes.length === 0
                    ? 'No restriction - SMS goes to every country'
                    : `SMS only goes to numbers starting with: ${allowedCountryCodes.map(c => `+${c}`).join(', ')}`
                  }
                </p>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="min-w-[120px]"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {COUNTRY_OPTIONS.map(({ code, label }) => {
                const isAllowed = allowedCountryCodes.includes(code)
                return (
                  <label
                    key={code}
                    className={`
                      flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                      ${isAllowed
                        ? 'bg-green-50 border-green-300 hover:border-green-400'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isAllowed}
                      onChange={() => handleToggleCountry(code)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className={`text-sm ${isAllowed ? 'text-green-900 font-medium' : 'text-gray-700'}`}>
                      {label}
                    </span>
                  </label>
                )
              })}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomCode() } }}
                placeholder="Other dialing code, e.g. 65"
                className="w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <Button variant="secondary" size="sm" onClick={handleAddCustomCode}>Add</Button>
              {allowedCountryCodes.filter(c => !COUNTRY_OPTIONS.some(o => o.code === c)).map(code => (
                <span key={code} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  +{code}
                  <button onClick={() => handleToggleCountry(code)} className="hover:text-green-950" aria-label={`Remove +${code}`}>×</button>
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Leave everything unchecked to send SMS worldwide. When any country is selected, numbers saved without a
              recognizable country code are skipped too.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Blocked Timezones</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {blockedTimezones.length === 0 
                    ? 'No timezones blocked - SMS will be sent to all registrants'
                    : `${blockedTimezones.length} timezone${blockedTimezones.length !== 1 ? 's' : ''} blocked`
                  }
                </p>
              </div>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="min-w-[120px]"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              {TIMEZONE_OPTIONS.map(({ region, zones }) => {
                const allSelected = zones.every(zone => blockedTimezones.includes(zone))
                const someSelected = zones.some(zone => blockedTimezones.includes(zone))

                return (
                  <div key={region} className="border-b border-gray-200 pb-6 last:border-0">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-md font-semibold text-gray-800">{region}</h3>
                      <button
                        onClick={() => handleSelectAllInRegion(zones)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {allSelected ? 'Unblock All' : 'Block All'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {zones.map(timezone => {
                        const isBlocked = blockedTimezones.includes(timezone)
                        return (
                          <label
                            key={timezone}
                            className={`
                              flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                              ${isBlocked 
                                ? 'bg-red-50 border-red-300 hover:border-red-400' 
                                : 'bg-white border-gray-200 hover:border-gray-300'
                              }
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={isBlocked}
                              onChange={() => handleToggleTimezone(timezone)}
                              className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                            />
                            <span className={`text-sm ${isBlocked ? 'text-red-900 font-medium' : 'text-gray-700'}`}>
                              {timezone.replace(/_/g, ' ')}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Important Notes</h4>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>Blocked timezones and non-allowed countries will not receive ANY SMS messages (reminders or post-session)</li>
                <li>This only affects SMS - email reminders will still be sent</li>
                <li>Changes take effect immediately for future SMS sends</li>
                <li>Registrants without a timezone will still receive SMS</li>
              </ul>
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  )
}
