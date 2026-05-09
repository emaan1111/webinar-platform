import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/funnels'
import { requireAdmin } from '@/lib/requireAdmin'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdmin()
  if (denied) return denied
  const funnel = await prisma.funnel.findUnique({
    where: { id: params.id },
    include: {
      steps: { orderBy: { order: 'asc' }, include: { product: true } },
    },
  })
  if (!funnel) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ funnel })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const denied = await requireAdmin()
    if (denied) return denied

    const body = await req.json()
    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.description !== undefined) data.description = body.description || null
    if (body.isActive !== undefined) data.isActive = !!body.isActive
    if (body.successRedirectUrl !== undefined)
      data.successRedirectUrl = body.successRedirectUrl || null
    if (body.brandColor !== undefined) data.brandColor = body.brandColor || null
    if (body.brandLogoUrl !== undefined) data.brandLogoUrl = body.brandLogoUrl || null

    if (body.slug !== undefined) {
      const newSlug = slugify(body.slug)
      if (!newSlug) {
        return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
      }
      const conflict = await prisma.funnel.findFirst({
        where: { slug: newSlug, id: { not: params.id } },
      })
      if (conflict) {
        return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
      }
      data.slug = newSlug
    }

    const funnel = await prisma.funnel.update({
      where: { id: params.id },
      data,
      include: { steps: { orderBy: { order: 'asc' }, include: { product: true } } },
    })

    return NextResponse.json({ funnel })
  } catch (error) {
    console.error('Error updating funnel:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const denied = await requireAdmin()
    if (denied) return denied
    await prisma.funnel.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting funnel:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
