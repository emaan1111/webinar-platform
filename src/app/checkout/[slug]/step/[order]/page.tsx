'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Check } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'

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
  headline: string | null
  subheadline: string | null
  description: string | null
  videoUrl: string | null
  imageUrl: string | null
  yesButtonText: string | null
  noButtonText: string | null
  declineNextOrder: number | null
  product: Product | null
}

interface Funnel {
  id: string
  name: string
  slug: string
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

export default function FunnelStepPage() {
  const params = useParams<{ slug: string; order: string }>()
  const search = useSearchParams()
  const router = useRouter()

  const slug = params.slug
  const orderNum = parseInt(params.order)
  const orderId = search.get('orderId')

  const [funnel, setFunnel] = useState<Funnel | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/checkout/funnel/${slug}`)
      .then((r) => r.json())
      .then((data) => setFunnel(data.funnel))
      .catch(() => setError('Could not load funnel'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!funnel || !orderId) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-gray-600">Order not found.</p>
      </div>
    )
  }

  const step = funnel.steps.find((s) => s.order === orderNum)
  if (!step) {
    router.replace(`/checkout/${slug}/confirmation?orderId=${orderId}`)
    return null
  }

  if (step.type === 'CONFIRMATION') {
    router.replace(`/checkout/${slug}/confirmation?orderId=${orderId}`)
    return null
  }

  const product = step.product

  const goToNext = (declined: boolean) => {
    let nextOrder: number
    if (declined && step.declineNextOrder != null) {
      nextOrder = step.declineNextOrder
    } else {
      nextOrder = orderNum + 1
    }
    const nextStep = funnel.steps.find((s) => s.order === nextOrder)
    if (!nextStep || nextStep.type === 'CONFIRMATION') {
      router.push(`/checkout/${slug}/confirmation?orderId=${orderId}`)
    } else {
      router.push(`/checkout/${slug}/step/${nextOrder}?orderId=${orderId}`)
    }
  }

  const handleYes = async () => {
    if (!product) {
      goToNext(false)
      return
    }
    setProcessing(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout/upsell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, stepId: step.id }),
      })
      const data = await res.json()

      if (data.status === 'succeeded') {
        goToNext(false)
        return
      }

      if (data.status === 'requires_action' && data.clientSecret) {
        // 3DS / SCA — confirm in browser
        const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        if (!stripeKey) throw new Error('Stripe key missing')
        const stripe = await loadStripe(stripeKey)
        if (!stripe) throw new Error('Stripe failed to load')
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          data.clientSecret
        )
        if (confirmError) throw new Error(confirmError.message)
        if (paymentIntent?.status === 'succeeded') {
          goToNext(false)
          return
        }
        throw new Error('Payment did not complete')
      }

      throw new Error(data.error || 'Payment failed')
    } catch (e: any) {
      setError(e.message || 'Could not complete purchase')
      setProcessing(false)
    }
  }

  const brand = funnel.brandColor || '#16a34a'
  const isUpsell = step.type === 'UPSELL'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          {funnel.brandLogoUrl ? (
            <img src={funnel.brandLogoUrl} alt="" className="h-8" />
          ) : (
            <div className="text-lg font-bold text-gray-900">{funnel.name}</div>
          )}
          <div className="text-xs text-gray-500">
            {isUpsell ? 'Special offer' : 'Last chance'} — one-click add to your order
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Banner */}
          <div
            className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: brand }}
          >
            {isUpsell ? '🎉 Wait! Special One-Time Offer' : '⏰ Last chance — special discount'}
          </div>

          <div className="p-8">
            {step.headline && (
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                {step.headline}
              </h1>
            )}
            {step.subheadline && (
              <p className="mt-3 text-lg text-gray-600">{step.subheadline}</p>
            )}

            {step.videoUrl && (
              <div className="mt-6 aspect-video overflow-hidden rounded-lg bg-black">
                <iframe
                  src={step.videoUrl}
                  className="h-full w-full"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              </div>
            )}

            {step.imageUrl && !step.videoUrl && (
              <img
                src={step.imageUrl}
                alt=""
                className="mt-6 w-full rounded-lg object-cover"
              />
            )}

            {step.description && (
              <div className="prose prose-sm mt-6 max-w-none text-gray-700">
                {step.description.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}

            {product && (
              <div className="mt-8 flex items-center justify-between rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4">
                <div>
                  <div className="text-sm text-gray-500">Add to your order</div>
                  <div className="font-semibold text-gray-900">{product.name}</div>
                </div>
                <div className="text-2xl font-bold" style={{ color: brand }}>
                  {formatMoney(product.priceInCents, product.currency)}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-8 space-y-3">
              <button
                onClick={handleYes}
                disabled={processing}
                style={{ backgroundColor: brand }}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-6 py-4 text-lg font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Adding to your order...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    {step.yesButtonText || (isUpsell ? 'Yes! Add this to my order' : 'Yes, I want this')}
                  </>
                )}
              </button>

              <button
                onClick={() => goToNext(true)}
                disabled={processing}
                className="block w-full text-center text-sm text-gray-500 underline hover:text-gray-700"
              >
                {step.noButtonText || (isUpsell ? 'No thanks, continue without this' : 'No thanks, just my order')}
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-gray-400">
              Your card on file will be charged. No need to re-enter your details.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
