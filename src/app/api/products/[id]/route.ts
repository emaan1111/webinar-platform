import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/requireAdmin'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdmin()
  if (denied) return denied
  const product = await prisma.product.findUnique({ where: { id: params.id } })
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ product })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const denied = await requireAdmin()
    if (denied) return denied

    const body = await req.json()
    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.description !== undefined) data.description = body.description || null
    if (body.priceInCents !== undefined) data.priceInCents = body.priceInCents
    if (body.currency !== undefined) data.currency = String(body.currency).toLowerCase()
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null
    if (body.isActive !== undefined) data.isActive = !!body.isActive

    const product = await prisma.product.update({ where: { id: params.id }, data })
    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const denied = await requireAdmin()
    if (denied) return denied
    await prisma.product.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
