import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public read used by the confirmation page. Returns sanitized order data.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      funnel: { select: { id: true, name: true, slug: true, brandColor: true, brandLogoUrl: true } },
      items: { include: { product: true } },
      payments: { select: { id: true, amountCents: true, status: true, source: true, createdAt: true } },
    },
  })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ order })
}
