'use client'

import { useEffect, useState, ChangeEvent, FormEvent } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface BrandingForm {
  organizationName: string
  contactEmail: string
  websiteUrl: string
  primaryColor: string
  accentColor: string
  logoUrl: string
}

export default function BrandingSettingsPage() {
  const [form, setForm] = useState<BrandingForm>({
    organizationName: '',
    contactEmail: '',
    websiteUrl: '',
    primaryColor: '#4a3b6b',
    accentColor: '#d53f8c',
    logoUrl: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/branding')
        if (response.ok) {
          const data = await response.json()
          setForm((prev) => ({
            ...prev,
            organizationName: data.organizationName ?? prev.organizationName,
            contactEmail: data.contactEmail ?? prev.contactEmail,
            websiteUrl: data.websiteUrl ?? prev.websiteUrl,
            primaryColor: data.primaryColor ?? prev.primaryColor,
            accentColor: data.accentColor ?? prev.accentColor,
            logoUrl: data.logoUrl ?? prev.logoUrl,
          }))
        } else {
          console.error('Failed to load branding settings')
        }
      } catch (error) {
        console.error('Error fetching branding settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setStatusMessage('')

    try {
      const response = await fetch('/api/settings/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (response.ok) {
        setStatusMessage('Branding defaults updated successfully!')
      } else {
        setStatusMessage('Failed to save settings. Please try again.')
      }
    } catch (error) {
      console.error('Error saving branding settings:', error)
      setStatusMessage('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Branding Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            These defaults replace <code>{"{{organizationName}}"}</code>, contact email, website,
            and color placeholders inside countdown templates.
          </p>
        </div>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="space-y-1 text-sm text-gray-700">
                  Organization Name
                  <input
                    name="organizationName"
                    value={form.organizationName}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Emaan Power Educational Institute"
                    className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 text-sm text-gray-700">
                  Contact Email
                  <input
                    name="contactEmail"
                    type="email"
                    value={form.contactEmail}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="info@example.com"
                    className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 text-sm text-gray-700">
                  Website URL
                  <input
                    name="websiteUrl"
                    type="url"
                    value={form.websiteUrl}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="https://www.example.com"
                    className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 text-sm text-gray-700">
                  Logo URL
                  <input
                    name="logoUrl"
                    value={form.logoUrl}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="https://cdn.example.com/logo.png"
                    className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <label className="space-y-1 text-sm text-gray-700">
                  Primary Color
                  <input
                    name="primaryColor"
                    type="color"
                    value={form.primaryColor}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-12 w-full appearance-none rounded border border-gray-200 p-1"
                  />
                </label>
                <label className="space-y-1 text-sm text-gray-700">
                  Accent Color
                  <input
                    name="accentColor"
                    type="color"
                    value={form.accentColor}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-12 w-full appearance-none rounded border border-gray-200 p-1"
                  />
                </label>
              </div>

              <div className="space-y-1 text-sm text-gray-500">
                <p>Values saved here apply to every countdown page that uses the matching templates.</p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Button type="submit" disabled={saving || loading}>
                  {saving ? 'Saving…' : 'Save Branding Defaults'}
                </Button>
                {statusMessage && (
                  <p className="text-sm text-gray-600">{statusMessage}</p>
                )}
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  )
}
