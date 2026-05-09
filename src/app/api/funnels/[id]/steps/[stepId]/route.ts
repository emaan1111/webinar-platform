import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/requireAdmin'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; stepId: string } }
) {
  try {
    const denied = await requireAdmin()
    if (denied) return denied

    const body = await req.json()
    const data: any = {}

    const fields = [
      'productId',
      'headline',
      'subheadline',
      'description',
      'videoUrl',
      'imageUrl',
      'yesButtonText',
      'noButtonText',
      'declineNextOrder',
    ] as const

    for (const f of fields) {
      if (body[f] !== undefined) {
        data[f] = body[f] === '' ? null : body[f]
      }
    }

    const step = await prisma.funnelStep.update({
      where: { id: params.stepId },
      data,
      include: { product: true },
    })

    return NextResponse.json({ step })
  } catch (error) {
    console.error('Error updating step:', error)
    return NextResponse.json({ error: 'Failed to update step' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; stepId: string } }
) {
  try {
    const denied = await requireAdmin()
    if (denied) return denied

    const step = await prisma.funnelStep.findUnique({ where: { id: params.stepId } })
    if (!step) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (step.type === 'ORDER_FORM' || step.type === 'CONFIRMATION') {
      return NextResponse.json(
        { error: 'Cannot delete order form or confirmation step' },
        { status: 400 }
      )
    }

    await prisma.$transaction([
      prisma.funnelStep.delete({ where: { id: params.stepId } }),
      // shift later steps down by 1
      prisma.funnelStep.updateMany({
        where: { funnelId: params.id, order: { gt: step.order } },
        data: { order: { decrement: 1 } },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting step:', error)
    return NextResponse.json({ error: 'Failed to delete step' }, { status: 500 })
  }
}
