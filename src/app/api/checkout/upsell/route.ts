import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { verifyOrderToken } from '@/lib/orderToken'

/**
 * POST /api/checkout/upsell
 * Body: { orderId, stepId }
 * Charges the customer's saved payment method off-session for the upsell/downsell
 * step's product. Returns one of:
 *   { status: 'succeeded', orderItemId, paymentId }
 *   { status: 'requires_action', clientSecret }   // 3DS
 *   { status: 'failed', error }
 */
export async function POST(req: Request) {
  try {
    const { orderId, stepId, orderToken } = await req.json()
    if (!orderId || !stepId) {
      return NextResponse.json({ error: 'orderId and stepId required' }, { status: 400 })
    }

    if (!verifyOrderToken(orderId, orderToken)) {
      return NextResponse.json({ error: 'Invalid order token' }, { status: 403 })
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (!order.stripeCustomerId) {
      return NextResponse.json({ error: 'No customer on order' }, { status: 400 })
    }

    const step = await prisma.funnelStep.findUnique({
      where: { id: stepId },
      include: { product: true },
    })
    if (!step || !step.product) {
      return NextResponse.json({ error: 'Step or product not found' }, { status: 404 })
    }
    if (step.type !== 'UPSELL' && step.type !== 'DOWNSELL') {
      return NextResponse.json({ error: 'Step is not an upsell/downsell' }, { status: 400 })
    }

    // Idempotency — if this step was already paid for on this order, return success.
    const alreadyPaid = await prisma.payment.findFirst({
      where: {
        orderId: order.id,
        status: 'SUCCEEDED',
        items: { some: { funnelStepId: step.id } },
      },
      include: { items: { where: { funnelStepId: step.id } } },
    })
    if (alreadyPaid) {
      return NextResponse.json({
        status: 'succeeded',
        orderItemId: alreadyPaid.items[0]?.id,
        paymentId: alreadyPaid.id,
        idempotent: true,
      })
    }

    // Resolve a saved payment method on this customer.
    let paymentMethodId = order.stripePaymentMethodId
    if (!paymentMethodId) {
      const customer = await stripe.customers.retrieve(order.stripeCustomerId)
      const defaultPm = (customer as any)?.invoice_settings?.default_payment_method
      if (defaultPm) {
        paymentMethodId = typeof defaultPm === 'string' ? defaultPm : defaultPm.id
      } else {
        const list = await stripe.paymentMethods.list({
          customer: order.stripeCustomerId,
          type: 'card',
          limit: 1,
        })
        paymentMethodId = list.data[0]?.id || null
      }
      if (paymentMethodId) {
        await prisma.order.update({
          where: { id: order.id },
          data: { stripePaymentMethodId: paymentMethodId },
        })
      }
    }

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'No saved payment method available for one-click upsell' },
        { status: 400 }
      )
    }

    const product = step.product

    const intent = await stripe.paymentIntents.create(
      {
        amount: product.priceInCents,
        currency: product.currency,
        customer: order.stripeCustomerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        description: `${product.name} (${step.type === 'UPSELL' ? 'upsell' : 'downsell'})`,
        metadata: {
          orderId: order.id,
          funnelStepId: step.id,
          productId: product.id,
          source: step.type === 'UPSELL' ? 'upsell' : 'downsell',
        },
      },
      // Stripe-side idempotency: retrying with the same key returns the same
      // PaymentIntent rather than creating a second charge.
      { idempotencyKey: `upsell:${order.id}:${step.id}` }
    )

    // Use upsert in case Stripe returned an existing intent via idempotencyKey.
    const payment = await prisma.payment.upsert({
      where: { stripePaymentIntentId: intent.id },
      update: {
        status: intent.status === 'succeeded' ? 'SUCCEEDED' : 'PENDING',
      },
      create: {
        orderId: order.id,
        stripePaymentIntentId: intent.id,
        amountCents: product.priceInCents,
        currency: product.currency,
        status: intent.status === 'succeeded' ? 'SUCCEEDED' : 'PENDING',
        source: step.type === 'UPSELL' ? 'upsell' : 'downsell',
      },
    })

    if (intent.status === 'succeeded') {
      // De-dupe: if an item for this step already exists (e.g. webhook beat us),
      // don't create another one.
      const existingItem = await prisma.orderItem.findFirst({
        where: { orderId: order.id, funnelStepId: step.id },
      })
      const item =
        existingItem ||
        (await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            funnelStepId: step.id,
            paymentId: payment.id,
            priceCents: product.priceInCents,
            currency: product.currency,
          },
        }))
      if (!existingItem) {
        await prisma.order.update({
          where: { id: order.id },
          data: { totalCents: { increment: product.priceInCents } },
        })
      }
      return NextResponse.json({
        status: 'succeeded',
        orderItemId: item.id,
        paymentId: payment.id,
      })
    }

    if (intent.status === 'requires_action' || intent.status === 'requires_confirmation') {
      return NextResponse.json({
        status: 'requires_action',
        clientSecret: intent.client_secret,
        paymentId: payment.id,
      })
    }

    return NextResponse.json({ status: 'failed', error: 'Payment did not succeed' })
  } catch (error: any) {
    // Stripe throws when off-session card fails (authentication needed, declined, etc.)
    const stripeErr = error?.raw || error
    if (stripeErr?.payment_intent) {
      const pi = stripeErr.payment_intent
      // 3DS required: surface client secret to the browser to confirm.
      if (pi.status === 'requires_action' || pi.last_payment_error?.code === 'authentication_required') {
        try {
          const { orderId, stepId } = await req.clone().json().catch(() => ({} as any))
          if (orderId) {
            await prisma.payment.create({
              data: {
                orderId,
                stripePaymentIntentId: pi.id,
                amountCents: pi.amount,
                currency: pi.currency,
                status: 'REQUIRES_ACTION',
                source: 'upsell',
                failureReason: stripeErr.message || null,
              },
            }).catch(() => {})
          }
        } catch {}
        return NextResponse.json({
          status: 'requires_action',
          clientSecret: pi.client_secret,
        })
      }
    }
    console.error('Upsell charge failed:', error)
    return NextResponse.json(
      { status: 'failed', error: error?.message || 'Charge failed' },
      { status: 200 }
    )
  }
}
