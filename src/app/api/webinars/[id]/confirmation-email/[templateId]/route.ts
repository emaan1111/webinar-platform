import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/webinars/[id]/confirmation-email/[templateId]
export async function GET(
  _request: Request,
  { params }: { params: { id: string; templateId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const template = await prisma.confirmationEmailTemplate.findFirst({
    where: { id: params.templateId, webinarId: params.id },
  })

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  return NextResponse.json({ template })
}

// PUT /api/webinars/[id]/confirmation-email/[templateId] — full update
export async function PUT(
  request: Request,
  { params }: { params: { id: string; templateId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, subject, htmlBody, isActive } = body

  if (!subject || !htmlBody) {
    return NextResponse.json(
      { error: 'Subject and HTML body are required' },
      { status: 400 }
    )
  }

  const existing = await prisma.confirmationEmailTemplate.findFirst({
    where: { id: params.templateId, webinarId: params.id },
    select: { id: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const template = await prisma.confirmationEmailTemplate.update({
    where: { id: params.templateId },
    data: {
      name: name || undefined,
      subject,
      htmlBody,
      isActive: typeof isActive === 'boolean' ? isActive : undefined,
    },
  })

  return NextResponse.json({ template })
}

// PATCH /api/webinars/[id]/confirmation-email/[templateId] — toggle active
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; templateId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.confirmationEmailTemplate.findFirst({
    where: { id: params.templateId, webinarId: params.id },
    select: { id: true, isActive: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const template = await prisma.confirmationEmailTemplate.update({
    where: { id: params.templateId },
    data: { isActive: !existing.isActive },
  })

  return NextResponse.json({ template })
}

// DELETE /api/webinars/[id]/confirmation-email/[templateId]
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; templateId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.confirmationEmailTemplate.findFirst({
    where: { id: params.templateId, webinarId: params.id },
    select: { id: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  await prisma.confirmationEmailTemplate.delete({
    where: { id: params.templateId },
  })

  return NextResponse.json({ success: true })
}
