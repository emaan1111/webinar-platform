'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Loader2, Lock } from 'lucide-react'

interface Props {
  funnelSlug: string
  orderId: string
  nextStepOrder: number | null // order # of the step to advance to after success
}

export function OrderForm({ funnelSlug, orderId, nextStepOrder }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setSubmitting(true)
    setError(null)

    const returnUrl =
      nextStepOrder != null
        ? `${window.location.origin}/checkout/${funnelSlug}/step/${nextStepOrder}?orderId=${orderId}`
        : `${window.location.origin}/checkout/${funnelSlug}/confirmation?orderId=${orderId}`

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: 'if_required',
    })

    if (stripeError) {
      setError(stripeError.message || 'Payment failed')
      setSubmitting(false)
      return
    }

    // No redirect needed - confirm succeeded inline.
    router.push(
      nextStepOrder != null
        ? `/checkout/${funnelSlug}/step/${nextStepOrder}?orderId=${orderId}`
        : `/checkout/${funnelSlug}/confirmation?orderId=${orderId}`
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <PaymentElement />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-4 text-lg font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Processing...
          </>
        ) : (
          <>
            <Lock className="h-5 w-5" /> Complete Order
          </>
        )}
      </button>

      <p className="text-center text-xs text-gray-500">
        Secured by Stripe. Your payment info is never stored on our servers.
      </p>
    </form>
  )
}
