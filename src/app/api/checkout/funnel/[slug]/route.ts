import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public — used by checkout pages to fetch funnel + steps + products.
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const funnel = await prisma.funnel.findUnique({
    where: { slug: params.slug },
    include: {
      steps: {
        orderBy: { order: 'asc' },
        include: { product: true },
      },
    },
  })

  if (!funnel || !funnel.isActive) {
    return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
  }

  return NextResponse.json({ funnel })
}
