import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/webinars/[id]/reminder-emails/[templateId]
export async function GET(
  _request: Request,
  { params }: { params: { id: string; templateId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const template = await prisma.reminderEmailTemplate.findFirst({
    where: { id: params.templateId, webinarId: params.id },
  })
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  return NextResponse.json({ template })
}

// PUT /api/webinars/[id]/reminder-emails/[templateId]
export async function PUT(
  request: Request,
  { params }: { params: { id: string; templateId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, subject, htmlBody, fromName, minutesBefore, isActive,
    subjectB, skipIfJoined, resendToNonOpeners, resendAfterHours, resendSubject } = body

  if (!subject || !htmlBody) {
    return NextResponse.json(
      { error: 'Subject and HTML body are required' },
      { status: 400 }
    )
  }

  const existing = await prisma.reminderEmailTemplate.findFirst({
    where: { id: params.templateId, webinarId: params.id },
    select: { id: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const template = await prisma.reminderEmailTemplate.update({
    where: { id: params.templateId },
    data: {
      name: name || undefined,
      subject,
      subjectB: subjectB !== undefined ? (subjectB || null) : undefined,
      htmlBody,
      fromName: fromName !== undefined ? (fromName || null) : undefined,
      minutesBefore: typeof minutesBefore === 'number' ? minutesBefore : undefined,
      isActive: typeof isActive === 'boolean' ? isActive : undefined,
      skipIfJoined: typeof skipIfJoined === 'boolean' ? skipIfJoined : undefined,
      resendToNonOpeners: typeof resendToNonOpeners === 'boolean' ? resendToNonOpeners : undefined,
      resendAfterHours: resendAfterHours !== undefined ? (resendAfterHours || null) : undefined,
      resendSubject: resendSubject !== undefined ? (resendSubject || null) : undefined,
    },
  })

  return NextResponse.json({ template })
}

// PATCH /api/webinars/[id]/reminder-emails/[templateId] — toggle active
export async function PATCH(
  _request: Request,
  { params }: { params: { id: string; templateId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.reminderEmailTemplate.findFirst({
    where: { id: params.templateId, webinarId: params.id },
    select: { id: true, isActive: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const template = await prisma.reminderEmailTemplate.update({
    where: { id: params.templateId },
    data: { isActive: !existing.isActive },
  })

  return NextResponse.json({ template })
}

// DELETE /api/webinars/[id]/reminder-emails/[templateId]
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; templateId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.reminderEmailTemplate.findFirst({
    where: { id: params.templateId, webinarId: params.id },
    select: { id: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  await prisma.reminderEmailTemplate.delete({
    where: { id: params.templateId },
  })

  return NextResponse.json({ success: true })
}
