import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/popups/[id]/leads - Get all leads for a popup
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const skip = (page - 1) * limit

  const [leads, total] = await Promise.all([
    prisma.popupLead.findMany({
      where: { popupId: params.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.popupLead.count({ where: { popupId: params.id } }),
  ])

  return NextResponse.json({
    leads,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}
