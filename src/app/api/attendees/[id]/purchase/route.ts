import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      amount,
      currency = 'USD',
      productName,
      purchasedAt,
      orderId
    } = body

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than zero' },
        { status: 400 }
      )
    }

    const purchaseDate = purchasedAt ? new Date(purchasedAt) : new Date()
    if (isNaN(purchaseDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid purchase date' },
        { status: 400 }
      )
    }

    const registration = await prisma.registration.findUnique({
      where: { id }
    })

    if (!registration) {
      return NextResponse.json({ error: 'Attendee not found' }, { status: 404 })
    }

    const manualOrderId = orderId || `manual-${registration.id}-${Date.now()}`

    const purchase = await prisma.$transaction(async (tx) => {
      const sale = await tx.webinarSale.create({
        data: {
          webinarId: registration.webinarId,
          registrationId: registration.id,
          email: registration.email,
          orderId: manualOrderId,
          productName: productName || 'Manual Purchase',
          amount: parsedAmount,
          currency,
          status: 'paid',
          purchasedAt: purchaseDate,
          rawPayload: {
            source: 'manual_entry',
            createdBy: session.user.email
          }
        }
      })

      await tx.registration.update({
        where: { id: registration.id },
        data: { hasPurchased: true }
      })

      return sale
    })

    return NextResponse.json({ purchase })
  } catch (error) {
    console.error('[Attendee Purchase API] Failed to record purchase', error)
    return NextResponse.json(
      { error: 'Failed to record purchase' },
      { status: 500 }
    )
  }
}
