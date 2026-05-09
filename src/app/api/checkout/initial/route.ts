import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe, findOrCreateStripeCustomer } from '@/lib/stripe'
import { signOrderToken, verifyOrderToken } from '@/lib/orderToken'

/**
 * POST /api/checkout/initial
 * Body: { funnelSlug, email, firstName, lastName, phone, address?, orderId? }
 * Creates (or reuses) an Order + initial Payment + PaymentIntent for the
 * funnel's first product. Returns clientSecret for Stripe Elements.
 *
 * setup_future_usage: 'off_session' so we can charge upsells one-click.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      funnelSlug,
      email,
      firstName,
      lastName,
      phone,
      address,
      orderId,
      orderToken,
    } = body

    if (!funnelSlug || !email) {
      return NextResponse.json(
        { error: 'funnelSlug and email are required' },
        { status: 400 }
      )
    }

    const funnel = await prisma.funnel.findUnique({
      where: { slug: funnelSlug },
      include: {
        steps: {
          orderBy: { order: 'asc' },
          include: { product: true },
        },
      },
    })

    if (!funnel || !funnel.isActive) {
      return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
    }

    const orderFormStep = funnel.steps.find((s) => s.type === 'ORDER_FORM')
    if (!orderFormStep || !orderFormStep.product) {
      return NextResponse.json(
        { error: 'Funnel is missing an order form product' },
        { status: 400 }
      )
    }

    const product = orderFormStep.product

    // Create or fetch Stripe customer
    const customer = await findOrCreateStripeCustomer({
      email,
      name: [firstName, lastName].filter(Boolean).join(' ') || undefined,
      phone,
    })

    // Reuse order if a valid (signed) orderId is passed (retry path).
    // Without the signed token we ignore it — otherwise an attacker could
    // hijack another customer's order by guessing the id.
    let order =
      orderId && verifyOrderToken(orderId, orderToken)
        ? await prisma.order.findUnique({ where: { id: orderId } })
        : null
    if (!order) {
      order = await prisma.order.create({
        data: {
          funnelId: funnel.id,
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          phone: phone || null,
          addressLine1: address?.line1 || null,
          addressLine2: address?.line2 || null,
          city: address?.city || null,
          state: address?.state || null,
          postalCode: address?.postal_code || null,
          country: address?.country || null,
          stripeCustomerId: customer.id,
          currency: product.currency,
          status: 'PENDING',
        },
      })
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          email,
          firstName: firstName || order.firstName,
          lastName: lastName || order.lastName,
          phone: phone || order.phone,
          stripeCustomerId: customer.id,
        },
      })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: product.priceInCents,
      currency: product.currency,
      customer: customer.id,
      setup_future_usage: 'off_session',
      automatic_payment_methods: { enabled: true },
      description: product.name,
      metadata: {
        orderId: order.id,
        funnelId: funnel.id,
        funnelStepId: orderFormStep.id,
        productId: product.id,
        source: 'initial',
      },
    })

    // Track this payment in our DB (PENDING)
    await prisma.payment.create({
      data: {
        orderId: order.id,
        stripePaymentIntentId: paymentIntent.id,
        amountCents: product.priceInCents,
        currency: product.currency,
        status: 'PENDING',
        source: 'initial',
      },
    })

    return NextResponse.json({
      orderId: order.id,
      orderToken: signOrderToken(order.id),
      clientSecret: paymentIntent.client_secret,
      product: {
        id: product.id,
        name: product.name,
        priceInCents: product.priceInCents,
        currency: product.currency,
      },
    })
  } catch (error: any) {
    console.error('Error creating initial payment intent:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
