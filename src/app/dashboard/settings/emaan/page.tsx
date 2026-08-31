'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

type Scope = 'ALL' | 'ZOOM_ONLY'
type AppliesTo = 'ALL' | 'INTERNAL' | 'EXTERNAL'

interface EmaanRoute {
  id: string
  label: string
  webhookUrl: string
  scope: Scope
  appliesTo: AppliesTo
  isActive: boolean
}

function newRoute(): EmaanRoute {
  return {
    id: `new-${Math.random().toString(36).slice(2)}`,
    label: '',
    webhookUrl: '',
    scope: 'ZOOM_ONLY',
    appliesTo: 'ALL',
    isActive: true,
  }
}

export default function EmaanSettingsPage() {
  const [routes, setRoutes] = useState<EmaanRoute[]>([])
  const [syncWebhookUrl, setSyncWebhookUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/settings/emaan-routes')
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        setRoutes(Array.isArray(data.routes) ? data.routes : [])
      setSyncWebhookUrl(typeof data.syncWebhookUrl === 'string' ? data.syncWebhookUrl : '')
        setSyncWebhookUrl(typeof data.syncWebhookUrl === 'string' ? data.syncWebhookUrl : '')
      } catch {
        setMessage({ type: 'error', text: 'Could not load Emaan routes.' })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const update = (id: string, patch: Partial<EmaanRoute>) =>
    setRoutes((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const remove = (id: string) => setRoutes((prev) => prev.filter((r) => r.id !== id))

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/settings/emaan-routes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routes, syncWebhookUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setRoutes(Array.isArray(data.routes) ? data.routes : [])
      setMessage({ type: 'ok', text: 'Saved.' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Link href="/dashboard/settings" className="text-sm text-blue-600 hover:text-blue-800">
            ← Settings
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">📧 Emaan Email Integration</h1>
          <p className="mt-1 text-sm text-gray-500 max-w-3xl">
            Global rules that push webinar registrations into your Emaan app. Each rule forwards
            registrations to an Emaan lead-webhook URL; the list, tag and workflow live on the Emaan
            endpoint behind that URL. These rules apply broadly (all webinars, or all internal / all
            external). To target one specific webinar, use the “Emaan webhook URL” field inside that
            webinar’s editor instead.
          </p>
        </div>

        {message && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              message.type === 'ok'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Update webhook</h2>
            <p className="mt-1 text-sm text-gray-600">
              Where Emaan is told when something about a registration <em>changes</em> — a Zoom
              session moved or got a new link, attendance came back from WebinarJam, a replay link
              was added, or the backfill script ran. Registrations themselves go through the routes
              below, not this.
            </p>
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
              <strong className="font-semibold">This must be a webhook with no tags and no lists.</strong>{' '}
              Emaan applies an endpoint&rsquo;s tags on every post, and starts a workflow each time —
              so a tagged URL here would re-enrol people on every update, sending them duplicate
              reminders, and a backfill would email everyone at once.
            </div>
            <label className="mt-3 block text-sm">
              <span className="font-medium text-gray-700">Emaan webhook URL</span>
              <input
                type="url"
                value={syncWebhookUrl}
                onChange={(e) => setSyncWebhookUrl(e.target.value)}
                placeholder="https://your-emaan-app/webhooks/in/…"
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <span className="mt-1 block text-xs text-gray-500">
                Leave blank to switch updates off — registrations keep working, but attendance and
                replay links stop reaching Emaan.
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Global routes</h2>
              <button
                type="button"
                onClick={() => setRoutes((prev) => [...prev, newRoute()])}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                + Add route
              </button>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {loading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : routes.length === 0 ? (
              <p className="text-sm text-gray-500">
                No global routes yet. Click <span className="font-medium">“+ Add route”</span> to
                push every webinar’s registrations to an Emaan webhook.
              </p>
            ) : (
              routes.map((route) => (
                <div key={route.id} className="rounded-lg border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={route.label}
                      onChange={(e) => update(route.id, { label: e.target.value })}
                      placeholder="Label (e.g. Global Zoom workflow)"
                      className="flex-1 px-3 py-2 border rounded-lg text-sm font-medium"
                    />
                    <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={route.isActive}
                        onChange={(e) => update(route.id, { isActive: e.target.checked })}
                      />
                      Active
                    </label>
                    <button
                      type="button"
                      onClick={() => remove(route.id)}
                      className="text-sm text-gray-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Emaan webhook URL
                    </label>
                    <input
                      type="url"
                      value={route.webhookUrl}
                      onChange={(e) => update(route.id, { webhookUrl: e.target.value })}
                      placeholder="https://your-emaan-app.com/webhooks/in/<token>"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Applies to
                      </label>
                      <select
                        value={route.appliesTo}
                        onChange={(e) => update(route.id, { appliesTo: e.target.value as AppliesTo })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value="ALL">All webinars (internal + external)</option>
                        <option value="INTERNAL">Internal webinars only</option>
                        <option value="EXTERNAL">External webinars only</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Sessions</label>
                      <select
                        value={route.scope}
                        onChange={(e) => update(route.id, { scope: e.target.value as Scope })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value="ALL">All sessions</option>
                        <option value="ZOOM_ONLY">Zoom sessions only</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}

            <div className="pt-2">
              <Button onClick={save} disabled={saving || loading}>
                {saving ? 'Saving…' : 'Save routes'}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  )
}
