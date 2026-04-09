import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/popups/[id] - Get a single popup
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const popup = await prisma.popup.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { leads: true } },
    },
  })

  if (!popup) {
    return NextResponse.json({ error: 'Popup not found' }, { status: 404 })
  }

  return NextResponse.json(popup)
}

// PUT /api/popups/[id] - Update a popup
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const existing = await prisma.popup.findUnique({ where: { id: params.id } })

  if (!existing) {
    return NextResponse.json({ error: 'Popup not found' }, { status: 404 })
  }
  if (existing.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, description, fields, layout, styles, customHtml, useCustomHtml, submitText, successMessage, redirectUrl, isActive } = body

  const popup = await prisma.popup.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(fields !== undefined && { fields }),
      ...(layout !== undefined && { layout }),
      ...(styles !== undefined && { styles }),
      ...(customHtml !== undefined && { customHtml }),
      ...(useCustomHtml !== undefined && { useCustomHtml }),
      ...(submitText !== undefined && { submitText }),
      ...(successMessage !== undefined && { successMessage }),
      ...(redirectUrl !== undefined && { redirectUrl }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date(),
    },
  })

  return NextResponse.json(popup)
}

// DELETE /api/popups/[id] - Delete a popup
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const existing = await prisma.popup.findUnique({ where: { id: params.id } })

  if (!existing) {
    return NextResponse.json({ error: 'Popup not found' }, { status: 404 })
  }
  if (existing.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.popup.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
