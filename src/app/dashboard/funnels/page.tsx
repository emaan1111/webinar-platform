'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Plus, Loader2, ExternalLink, Layers, Copy } from 'lucide-react'

interface Product {
  id: string
  name: string
  priceInCents: number
  currency: string
}

interface Step {
  id: string
  type: string
  order: number
  product: Product | null
}

interface Funnel {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  steps: Step[]
  _count: { orders: number }
}

export default function FunnelsPage() {
  const [funnels, setFunnels] = useState<Funnel[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', slug: '', productId: '' })

  const fetchAll = async () => {
    setLoading(true)
    const [fr, pr] = await Promise.all([
      fetch('/api/funnels'),
      fetch('/api/products'),
    ])
    const fd = await fr.json()
    const pd = await pr.json()
    setFunnels(fd.funnels || [])
    setProducts(pd.products || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/funnels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        slug: form.slug || undefined,
        productId: form.productId || undefined,
      }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Failed')
      return
    }
    setForm({ name: '', slug: '', productId: '' })
    setShowForm(false)
    fetchAll()
  }

  const copyUrl = (slug: string) => {
    const url = `${window.location.origin}/checkout/${slug}`
    navigator.clipboard.writeText(url)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Funnels</h1>
            <p className="mt-1 text-sm text-gray-500">
              Order forms with one-click upsells, downsells, and confirmation
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 inline h-4 w-4" />
            New Funnel
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">Create Funnel</h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleCreate} className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Premium Course Funnel"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">
                    URL slug
                  </span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="premium-course (auto-generated if blank)"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="mt-1 block text-xs text-gray-500">
                    Public URL will be /checkout/&lt;your-slug&gt;
                  </span>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">
                    Initial product (order form)
                  </span>
                  <select
                    value={form.productId}
                    onChange={(e) => setForm({ ...form, productId: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">— Select later —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({(p.priceInCents / 100).toFixed(2)} {p.currency.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </label>
                {error && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="submit">Create Funnel</Button>
                  <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : funnels.length === 0 ? (
          <Card>
            <CardBody>
              <div className="py-12 text-center">
                <Layers className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-lg font-medium">No funnels yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create a funnel to start selling with one-click upsells.
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {funnels.map((f) => (
              <Card key={f.id}>
                <CardBody>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">{f.name}</h3>
                        {f.isActive ? (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                        <code className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                          /checkout/{f.slug}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyUrl(f.slug)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Copy URL"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {f.steps.map((s) => (
                          <span
                            key={s.id}
                            className={`rounded px-2 py-0.5 text-xs font-medium ${stepBadgeColor(s.type)}`}
                          >
                            {prettyType(s.type)}
                            {s.product ? ` · $${(s.product.priceInCents / 100).toFixed(0)}` : ''}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {f._count.orders} order{f._count.orders === 1 ? '' : 's'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`/checkout/${f.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                      >
                        <ExternalLink className="h-4 w-4" /> Preview
                      </a>
                      <Link href={`/dashboard/funnels/${f.id}`}>
                        <Button size="sm">Edit</Button>
                      </Link>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function prettyType(t: string) {
  return t.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function stepBadgeColor(t: string) {
  switch (t) {
    case 'ORDER_FORM':
      return 'bg-blue-100 text-blue-700'
    case 'UPSELL':
      return 'bg-purple-100 text-purple-700'
    case 'DOWNSELL':
      return 'bg-orange-100 text-orange-700'
    case 'CONFIRMATION':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}
