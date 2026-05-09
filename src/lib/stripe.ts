import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey && process.env.NODE_ENV === 'production') {
  console.error('⚠️  STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(stripeSecretKey || 'sk_test_placeholder', {
  apiVersion: '2024-11-20.acacia' as any,
  typescript: true,
})

export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || ''
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

export function formatMoney(cents: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

export async function findOrCreateStripeCustomer(params: {
  email: string
  name?: string
  phone?: string
  existingCustomerId?: string | null
}) {
  if (params.existingCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(params.existingCustomerId)
      if (existing && !(existing as any).deleted) {
        return existing as Stripe.Customer
      }
    } catch {
      // fall through
    }
  }

  const search = await stripe.customers.list({ email: params.email, limit: 1 })
  if (search.data.length > 0) {
    return search.data[0]
  }

  return stripe.customers.create({
    email: params.email,
    name: params.name,
    phone: params.phone,
  })
}
