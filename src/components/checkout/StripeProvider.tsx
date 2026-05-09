'use client'

import { ReactNode, useMemo } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe, Stripe as StripeJs } from '@stripe/stripe-js'

let stripePromise: Promise<StripeJs | null> | null = null

function getStripe() {
  if (stripePromise) return stripePromise
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) {
    console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
    stripePromise = Promise.resolve(null)
  } else {
    stripePromise = loadStripe(key)
  }
  return stripePromise
}

export function StripeProvider({
  clientSecret,
  children,
}: {
  clientSecret: string | null
  children: ReactNode
}) {
  const options = useMemo(
    () => ({
      clientSecret: clientSecret || undefined,
      appearance: {
        theme: 'stripe' as const,
        variables: {
          colorPrimary: '#2563eb',
          borderRadius: '8px',
        },
      },
    }),
    [clientSecret]
  )

  if (!clientSecret) return <>{children}</>

  return (
    <Elements stripe={getStripe()} options={options as any}>
      {children}
    </Elements>
  )
}
