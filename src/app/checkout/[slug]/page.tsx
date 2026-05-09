'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { StripeProvider } from '@/components/checkout/StripeProvider'
import { OrderForm } from '@/components/checkout/OrderForm'

interface Product {
  id: string
  name: string
  description: string | null
  priceInCents: number
  currency: string
  imageUrl: string | null
}

interface Step {
  id: string
  type: 'ORDER_FORM' | 'UPSELL' | 'DOWNSELL' | 'CONFIRMATION'
  order: number
  product: Product | null
}

interface Funnel {
  id: string
  name: string
  slug: string
  description: string | null
  brandColor: string | null
  brandLogoUrl: string | null
  steps: Step[]
}

function formatMoney(cents: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

export default function CheckoutPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [funnel, setFunnel] = useState<Funnel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  })

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [creatingIntent, setCreatingIntent] = useState(false)

  useEffect(() => {
    fetch(`/api/checkout/funnel/${slug}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || 'Failed to load')
        return r.json()
      })
      .then((data) => setFunnel(data.funnel))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [slug])

  const orderFormStep = funnel?.steps.find((s) => s.type === 'ORDER_FORM')
  const product = orderFormStep?.product || null
  const nextStep = funnel?.steps.find((s) => s.order === (orderFormStep?.order || 0) + 1)
  const nextStepOrder =
    nextStep && nextStep.type !== 'CONFIRMATION' ? nextStep.order : null

  const handleStartCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email) {
      setError('Email is required')
      return
    }
    setCreatingIntent(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout/initial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funnelSlug: slug,
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          address: {
            line1: form.line1,
            line2: form.line2,
            city: form.city,
            state: form.state,
            postal_code: form.postalCode,
            country: form.country,
          },
          orderId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setClientSecret(data.clientSecret)
      setOrderId(data.orderId)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCreatingIntent(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error && !funnel) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900">Checkout unavailable</h1>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!funnel || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900">This funnel isn't ready</h1>
          <p className="mt-2 text-gray-600">
            It's missing an order form product. Add one in the dashboard.
          </p>
        </div>
      </div>
    )
  }

  const brand = funnel.brandColor || '#2563eb'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          {funnel.brandLogoUrl ? (
            <img src={funnel.brandLogoUrl} alt="" className="h-8" />
          ) : (
            <div className="text-lg font-bold text-gray-900">{funnel.name}</div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            Secure checkout
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-5">
        {/* Form */}
        <div className="lg:col-span-3">
          {!clientSecret ? (
            <form onSubmit={handleStartCheckout} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Contact information</h2>
                <p className="mt-1 text-sm text-gray-500">We'll send your receipt here.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormInput
                  label="First name"
                  required
                  value={form.firstName}
                  onChange={(v) => setForm({ ...form, firstName: v })}
                />
                <FormInput
                  label="Last name"
                  value={form.lastName}
                  onChange={(v) => setForm({ ...form, lastName: v })}
                />
              </div>
              <FormInput
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
              />
              <FormInput
                label="Phone (optional)"
                type="tel"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
              />

              <div>
                <h3 className="text-sm font-semibold text-gray-900">Billing address</h3>
                <div className="mt-3 space-y-3">
                  <FormInput
                    label="Address"
                    value={form.line1}
                    onChange={(v) => setForm({ ...form, line1: v })}
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <FormInput
                      label="City"
                      value={form.city}
                      onChange={(v) => setForm({ ...form, city: v })}
                    />
                    <FormInput
                      label="State"
                      value={form.state}
                      onChange={(v) => setForm({ ...form, state: v })}
                    />
                    <FormInput
                      label="ZIP / Postal"
                      value={form.postalCode}
                      onChange={(v) => setForm({ ...form, postalCode: v })}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={creatingIntent}
                style={{ backgroundColor: brand }}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-lg font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
              >
                {creatingIntent ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Loading...
                  </>
                ) : (
                  'Continue to Payment'
                )}
              </button>
            </form>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900">Payment</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Charging {form.email}
                </p>
              </div>
              <StripeProvider clientSecret={clientSecret}>
                <OrderForm
                  funnelSlug={slug}
                  orderId={orderId!}
                  nextStepOrder={nextStepOrder}
                />
              </StripeProvider>
            </div>
          )}
        </div>

        {/* Order summary */}
        <aside className="lg:col-span-2">
          <div className="sticky top-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Order summary
            </h3>

            <div className="flex items-start gap-4">
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{product.name}</div>
                {product.description && (
                  <p className="mt-1 text-sm text-gray-600">{product.description}</p>
                )}
              </div>
              <div className="text-right font-semibold text-gray-900">
                {formatMoney(product.priceInCents, product.currency)}
              </div>
            </div>

            <div className="my-4 border-t border-gray-200" />

            <div className="flex items-center justify-between text-base font-bold text-gray-900">
              <span>Total today</span>
              <span>{formatMoney(product.priceInCents, product.currency)}</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}

function FormInput({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </label>
  )
}
