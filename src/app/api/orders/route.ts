import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/requireAdmin'

export async function GET(request: Request) {
  try {
    const denied = await requireAdmin()
    if (denied) return denied

    const { searchParams } = new URL(request.url)
    const funnelId = searchParams.get('funnelId')
    const status = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)

    const where: any = {}
    if (funnelId) where.funnelId = funnelId
    if (status) where.status = status

    const orders = await prisma.order.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        funnel: { select: { id: true, name: true, slug: true } },
        items: { include: { product: true } },
        payments: true,
      },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
