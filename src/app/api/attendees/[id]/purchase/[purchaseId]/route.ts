import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user || user.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { session }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; purchaseId: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return auth.error

    const { id, purchaseId } = await params
    const body = await request.json()
    const { amount, currency = 'USD', productName, purchasedAt, orderId } = body

    const parsedAmount = Number(amount)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 })
    }

    const purchaseDate = purchasedAt ? new Date(purchasedAt) : new Date()
    if (Number.isNaN(purchaseDate.getTime())) {
      return NextResponse.json({ error: 'Invalid purchase date' }, { status: 400 })
    }

    const existingPurchase = await prisma.webinarSale.findFirst({
      where: {
        id: purchaseId,
        registrationId: id
      }
    })

    if (!existingPurchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }

    const updatedPurchase = await prisma.webinarSale.update({
      where: { id: purchaseId },
      data: {
        amount: parsedAmount,
        currency: typeof currency === 'string' && currency.trim() ? currency.trim().toUpperCase() : 'USD',
        productName: typeof productName === 'string' && productName.trim() ? productName.trim() : 'Manual Purchase',
        purchasedAt: purchaseDate,
        orderId: typeof orderId === 'string' && orderId.trim() ? orderId.trim() : existingPurchase.orderId,
        rawPayload: {
          source: 'manual_entry',
          updatedBy: auth.session!.user!.email
        }
      }
    })

    return NextResponse.json({ purchase: updatedPurchase })
  } catch (error: any) {
    console.error('[Attendee Purchase API] Failed to update purchase', error)

    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Order ID already exists. Use a different Order ID.' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Failed to update purchase' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; purchaseId: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return auth.error

    const { id, purchaseId } = await params

    const existingPurchase = await prisma.webinarSale.findFirst({
      where: {
        id: purchaseId,
        registrationId: id
      }
    })

    if (!existingPurchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.webinarSale.delete({ where: { id: purchaseId } })

      const remainingSales = await tx.webinarSale.count({
        where: { registrationId: id }
      })

      await tx.registration.update({
        where: { id },
        data: { hasPurchased: remainingSales > 0 }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Attendee Purchase API] Failed to delete purchase', error)
    return NextResponse.json({ error: 'Failed to delete purchase' }, { status: 500 })
  }
}