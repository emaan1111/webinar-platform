import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/requireAdmin'

export async function GET() {
  try {
    const denied = await requireAdmin()
    if (denied) return denied

    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const denied = await requireAdmin()
    if (denied) return denied

    const body = await request.json()
    const { name, description, priceInCents, currency, imageUrl } = body

    if (!name || typeof priceInCents !== 'number' || priceInCents < 0) {
      return NextResponse.json(
        { error: 'name and priceInCents (>=0) are required' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        priceInCents,
        currency: (currency || 'usd').toLowerCase(),
        imageUrl: imageUrl || null,
      },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
