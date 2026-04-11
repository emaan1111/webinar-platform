import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET
export async function GET(
  _request: Request,
  { params }: { params: { id: string; templateId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const template = await prisma.followUpEmailTemplate.findFirst({
    where: { id: params.templateId, webinarId: params.id },
  })
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  return NextResponse.json({ template })
}

// PUT — full update
export async function PUT(
  request: Request,
  { params }: { params: { id: string; templateId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, subject, htmlBody, fromName, delayMinutes, audienceType, isActive, sortOrder,
    subjectB, skipIfPurchased, resendToNonOpeners, resendAfterHours, resendSubject } = body

  if (!subject || !htmlBody) {
    return NextResponse.json(
      { error: 'Subject and HTML body are required' },
      { status: 400 }
    )
  }

  const existing = await prisma.followUpEmailTemplate.findFirst({
    where: { id: params.templateId, webinarId: params.id },
    select: { id: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const template = await prisma.followUpEmailTemplate.update({
    where: { id: params.templateId },
    data: {
      name: name || undefined,
      subject,
      subjectB: subjectB !== undefined ? (subjectB || null) : undefined,
      htmlBody,
      fromName: fromName !== undefined ? (fromName || null) : undefined,
      delayMinutes: typeof delayMinutes === 'number' ? delayMinutes : undefined,
      audienceType: audienceType || undefined,
      isActive: typeof isActive === 'boolean' ? isActive : undefined,
      sortOrder: typeof sortOrder === 'number' ? sortOrder : undefined,
      skipIfPurchased: typeof skipIfPurchased === 'boolean' ? skipIfPurchased : undefined,
      resendToNonOpeners: typeof resendToNonOpeners === 'boolean' ? resendToNonOpeners : undefined,
      resendAfterHours: resendAfterHours !== undefined ? (resendAfterHours || null) : undefined,
      resendSubject: resendSubject !== undefined ? (resendSubject || null) : undefined,
    },
  })

  return NextResponse.json({ template })
}

// PATCH — toggle active
export async function PATCH(
  _request: Request,
  { params }: { params: { id: string; templateId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.followUpEmailTemplate.findFirst({
    where: { id: params.templateId, webinarId: params.id },
    select: { id: true, isActive: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const template = await prisma.followUpEmailTemplate.update({
    where: { id: params.templateId },
    data: { isActive: !existing.isActive },
  })

  return NextResponse.json({ template })
}

// DELETE
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; templateId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.followUpEmailTemplate.findFirst({
    where: { id: params.templateId, webinarId: params.id },
    select: { id: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  await prisma.followUpEmailTemplate.delete({
    where: { id: params.templateId },
  })

  return NextResponse.json({ success: true })
}
