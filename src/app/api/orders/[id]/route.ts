import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyOrderToken } from '@/lib/orderToken'

// Used by the confirmation page (public, gated by HMAC token in URL) and by
// the dashboard (authenticated admin).
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')

  let authorized = verifyOrderToken(params.id, token)
  if (!authorized) {
    // Fallback: dashboard / admin session can read any order.
    const session = await getServerSession(authOptions)
    if (session?.user?.email) authorized = true
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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
