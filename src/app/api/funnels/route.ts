import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/funnels'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const funnels = await prisma.funnel.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        steps: {
          orderBy: { order: 'asc' },
          include: { product: true },
        },
        _count: { select: { orders: true } },
      },
    })
    return NextResponse.json({ funnels })
  } catch (error) {
    console.error('Error fetching funnels:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, slug: providedSlug, productId } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    let baseSlug = slugify(providedSlug || name)
    if (!baseSlug) baseSlug = `funnel-${Date.now()}`

    let slug = baseSlug
    let i = 1
    while (await prisma.funnel.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`
    }

    const funnel = await prisma.funnel.create({
      data: {
        name,
        slug,
        description: description || null,
        steps: {
          create: [
            {
              type: 'ORDER_FORM',
              order: 1,
              productId: productId || null,
              headline: 'Complete Your Order',
            },
            {
              type: 'CONFIRMATION',
              order: 2,
              headline: 'Thank you for your order!',
            },
          ],
        },
      },
      include: {
        steps: { orderBy: { order: 'asc' }, include: { product: true } },
      },
    })

    return NextResponse.json({ funnel }, { status: 201 })
  } catch (error) {
    console.error('Error creating funnel:', error)
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}
