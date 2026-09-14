import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Get a single survey with questions (admin)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const survey = await prisma.survey.findUnique({
    where: { id: params.id },
    include: {
      questions: { orderBy: { position: 'asc' } },
      _count: { select: { responses: true } },
    },
  })

  if (!survey) return NextResponse.json({ error: 'Survey not found' }, { status: 404 })

  return NextResponse.json({ survey })
}

// Update survey settings
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, description, thankYouTitle, thankYouBody, primaryColor, isActive, giftTitle, giftUrl, showOnWebinarPages } = body

  const data: Record<string, unknown> = {}
  if (title !== undefined) data.title = title
  if (description !== undefined) data.description = description || null
  if (thankYouTitle !== undefined) data.thankYouTitle = thankYouTitle
  if (thankYouBody !== undefined) data.thankYouBody = thankYouBody || null
  if (primaryColor !== undefined) data.primaryColor = primaryColor
  if (typeof isActive === 'boolean') data.isActive = isActive
  if (giftTitle !== undefined) data.giftTitle = giftTitle || null
  if (giftUrl !== undefined) data.giftUrl = giftUrl || null
  if (typeof showOnWebinarPages === 'boolean') data.showOnWebinarPages = showOnWebinarPages

  const survey = await prisma.survey.update({
    where: { id: params.id },
    data,
  })

  return NextResponse.json({ survey })
}

// Delete survey
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.survey.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
