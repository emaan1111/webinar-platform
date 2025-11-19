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
            firstName: true,
            lastName: true,
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
