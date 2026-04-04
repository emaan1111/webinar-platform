import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('📊 Fetching all sales data...')

    // Fetch all sales with registration data
    const sales = await prisma.webinarSale.findMany({
      orderBy: {
        purchasedAt: 'desc'
      },
      include: {
        registration: {
          select: {
            id: true,
            name: true,
            email: true,
            attended: true
          }
        }
      }
    })

    console.log(`✅ Found ${sales.length} sales`)

    // Calculate statistics
    const totalSales = sales.length
    const totalRevenue = sales.reduce((sum: number, sale: any) => sum + (sale.amount || 0), 0)
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0
    const linkedToRegistration = sales.filter((sale: any) => sale.registrationId !== null).length
    const notLinkedToRegistration = totalSales - linkedToRegistration

    const stats = {
      totalSales,
      totalRevenue,
      averageOrderValue,
      linkedToRegistration,
      notLinkedToRegistration
    }

    console.log('📈 Stats:', stats)

    return NextResponse.json({
      success: true,
      sales,
      stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error fetching sales:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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
      webinarId,
      email,
      amount,
      currency = 'USD',
      productName,
      status = 'paid',
      purchasedAt,
      orderId,
      registrationId
    } = body

    if (!webinarId || typeof webinarId !== 'string') {
      return NextResponse.json({ error: 'Webinar is required' }, { status: 400 })
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const parsedAmount = Number(amount)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 })
    }

    const purchaseDate = purchasedAt ? new Date(purchasedAt) : new Date()
    if (Number.isNaN(purchaseDate.getTime())) {
      return NextResponse.json({ error: 'Invalid purchase date' }, { status: 400 })
    }

    let linkedRegistrationId: string | null = null

    if (registrationId && typeof registrationId === 'string') {
      const reg = await prisma.registration.findUnique({ where: { id: registrationId } })
      if (!reg) {
        return NextResponse.json({ error: 'Selected registration was not found' }, { status: 404 })
      }
      linkedRegistrationId = reg.id
    } else {
      const matchingRegistration = await prisma.registration.findFirst({
        where: {
          webinarId,
          email: { equals: email.trim(), mode: 'insensitive' }
        },
        orderBy: {
          registeredAt: 'desc'
        }
      })
      linkedRegistrationId = matchingRegistration?.id || null
    }

    const generatedOrderId =
      (typeof orderId === 'string' && orderId.trim()) ||
      `manual-${webinarId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const sale = await prisma.$transaction(async (tx) => {
      const createdSale = await tx.webinarSale.create({
        data: {
          webinarId,
          registrationId: linkedRegistrationId,
          email: email.trim(),
          orderId: generatedOrderId,
          productName: typeof productName === 'string' && productName.trim() ? productName.trim() : 'Manual Sale',
          amount: parsedAmount,
          currency: typeof currency === 'string' && currency.trim() ? currency.trim().toUpperCase() : 'USD',
          status: typeof status === 'string' && status.trim() ? status.trim().toLowerCase() : 'paid',
          purchasedAt: purchaseDate,
          rawPayload: {
            source: 'manual_sales_dashboard',
            createdBy: session.user.email
          }
        },
        include: {
          registration: {
            select: {
              id: true,
              name: true,
              email: true,
              attended: true
            }
          }
        }
      })

      if (linkedRegistrationId) {
        await tx.registration.update({
          where: { id: linkedRegistrationId },
          data: { hasPurchased: true }
        })
      }

      return createdSale
    })

    return NextResponse.json({ success: true, sale }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Error creating sale:', error)

    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Order ID already exists. Use a different Order ID.' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
