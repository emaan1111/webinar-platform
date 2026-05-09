import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import type Stripe from 'stripe'

export const runtime = 'nodejs'
// Webhook needs the raw request body for signature verification.
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const sig = headers().get('stripe-signature')
  if (!sig || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  const rawBody = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('Stripe webhook signature failed:', err?.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break
      default:
        // ignore other events
        break
    }
  } catch (err) {
    console.error('Stripe webhook handler error:', err)
    // Return 200 so Stripe doesn't retry on programming errors; logs surface the issue.
  }

  return NextResponse.json({ received: true })
}

async function handlePaymentIntentSucceeded(intent: Stripe.PaymentIntent) {
  const orderId = intent.metadata?.orderId
  const productId = intent.metadata?.productId
  const funnelStepId = intent.metadata?.funnelStepId
  const source = intent.metadata?.source || 'initial'

  if (!orderId) return

  const existingPayment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: intent.id },
  })

  // Already finalized? skip
  if (existingPayment?.status === 'SUCCEEDED') return

  await prisma.$transaction(async (tx) => {
    const payment = existingPayment
      ? await tx.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: 'SUCCEEDED',
            stripeChargeId: typeof intent.latest_charge === 'string' ? intent.latest_charge : null,
            rawPayload: intent as any,
          },
        })
      : await tx.payment.create({
          data: {
            orderId,
            stripePaymentIntentId: intent.id,
            stripeChargeId: typeof intent.latest_charge === 'string' ? intent.latest_charge : null,
            amountCents: intent.amount_received || intent.amount,
            currency: intent.currency,
            status: 'SUCCEEDED',
            source,
            rawPayload: intent as any,
          },
        })

    // Persist saved payment method for one-click upsells
    if (intent.payment_method && typeof intent.payment_method === 'string') {
      await tx.order.update({
        where: { id: orderId },
        data: { stripePaymentMethodId: intent.payment_method },
      })
    }

    // Create order item for ANY successful charge (initial OR upsell/downsell).
    // For upsells, the inline /api/checkout/upsell handler usually creates the
    // item — but when the charge requires 3DS, the inline path returns
    // requires_action without an OrderItem and the customer completes 3DS in
    // the browser. The webhook is what fires on success in that case, so it
    // must create the item too. Dedupe on (orderId, funnelStepId) so the
    // happy path doesn't double-insert.
    if (productId) {
      const alreadyItem = await tx.orderItem.findFirst({
        where: {
          orderId,
          OR: [
            { paymentId: payment.id },
            funnelStepId ? { funnelStepId } : { funnelStepId: 'never-matches' },
          ],
        },
      })
      if (!alreadyItem) {
        await tx.orderItem.create({
          data: {
            orderId,
            productId,
            funnelStepId: funnelStepId || null,
            paymentId: payment.id,
            priceCents: intent.amount_received || intent.amount,
            currency: intent.currency,
          },
        })
      }
    }

    // Update order totals + status
    const items = await tx.orderItem.findMany({ where: { orderId } })
    const totalCents = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0)

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        totalCents,
      },
    })
  })
}

async function handlePaymentIntentFailed(intent: Stripe.PaymentIntent) {
  await prisma.payment.updateMany({
    where: { stripePaymentIntentId: intent.id },
    data: {
      status: 'FAILED',
      failureReason: intent.last_payment_error?.message || 'Payment failed',
    },
  })
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  if (!charge.payment_intent) return
  const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent.id

  const payment = await prisma.payment.findUnique({ where: { stripePaymentIntentId: piId } })
  if (!payment) return

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED' },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'REFUNDED' },
    }),
  ])
}
