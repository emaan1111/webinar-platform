import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { verifyOrderToken } from '@/lib/orderToken'

/**
 * POST /api/checkout/update-order
 * Body: { orderId, orderToken, email, firstName?, lastName?, phone?, address? }
 *
 * Backfills customer info onto an order that was created with placeholder
 * data (custom-HTML order forms pre-mount the Stripe Element before the
 * customer has filled in their details). Verifies orderToken.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { orderId, orderToken, email, firstName, lastName, phone, address } = body

    if (!orderId || !verifyOrderToken(orderId, orderToken)) {
      return NextResponse.json({ error: 'Invalid order token' }, { status: 403 })
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    await prisma.order.update({
      where: { id: orderId },
      data: {
        email: email || order.email,
        firstName: firstName || order.firstName,
        lastName: lastName || order.lastName,
        phone: phone || order.phone,
        addressLine1: address?.line1 || order.addressLine1,
        addressLine2: address?.line2 || order.addressLine2,
        city: address?.city || order.city,
        state: address?.state || order.state,
        postalCode: address?.postal_code || order.postalCode,
        country: address?.country || order.country,
      },
    })

    // Sync to Stripe customer too so receipt emails land in the right inbox.
    if (order.stripeCustomerId && email) {
      try {
        await stripe.customers.update(order.stripeCustomerId, {
          email,
          name: [firstName, lastName].filter(Boolean).join(' ') || undefined,
          phone: phone || undefined,
        })
      } catch (err) {
        // Non-fatal — log but don't fail the request.
        console.error('Stripe customer update failed:', err)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('update-order error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to update order' },
      { status: 500 }
    )
  }
}
