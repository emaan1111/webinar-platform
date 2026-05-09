import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/requireAdmin'

const VALID_TYPES = ['ORDER_FORM', 'UPSELL', 'DOWNSELL', 'CONFIRMATION'] as const

// POST /api/funnels/[id]/steps  — append a new step before the CONFIRMATION step
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const denied = await requireAdmin()
    if (denied) return denied

    const body = await req.json()
    const {
      type,
      productId,
      headline,
      subheadline,
      description,
      videoUrl,
      imageUrl,
      yesButtonText,
      noButtonText,
    } = body

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const funnel = await prisma.funnel.findUnique({
      where: { id: params.id },
      include: { steps: { orderBy: { order: 'asc' } } },
    })
    if (!funnel) return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })

    // Insert new step before the CONFIRMATION step (or at end if no confirmation yet)
    const confirmation = funnel.steps.find((s) => s.type === 'CONFIRMATION')
    let insertOrder: number

    if (type === 'CONFIRMATION') {
      const maxOrder = Math.max(0, ...funnel.steps.map((s) => s.order))
      insertOrder = maxOrder + 1
    } else if (confirmation) {
      insertOrder = confirmation.order
      // shift confirmation +1
      await prisma.funnelStep.update({
        where: { id: confirmation.id },
        data: { order: confirmation.order + 1 },
      })
    } else {
      const maxOrder = Math.max(0, ...funnel.steps.map((s) => s.order))
      insertOrder = maxOrder + 1
    }

    const step = await prisma.funnelStep.create({
      data: {
        funnelId: params.id,
        type,
        order: insertOrder,
        productId: productId || null,
        headline: headline || null,
        subheadline: subheadline || null,
        description: description || null,
        videoUrl: videoUrl || null,
        imageUrl: imageUrl || null,
        yesButtonText: yesButtonText || null,
        noButtonText: noButtonText || null,
      },
      include: { product: true },
    })

    return NextResponse.json({ step }, { status: 201 })
  } catch (error) {
    console.error('Error creating step:', error)
    return NextResponse.json({ error: 'Failed to create step' }, { status: 500 })
  }
}
