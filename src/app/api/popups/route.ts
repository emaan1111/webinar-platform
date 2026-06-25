import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/popups - List all popups for the current user
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const popups = await prisma.popup.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { leads: true } },
    },
  })

  return NextResponse.json(popups)
}

// POST /api/popups - Create a new popup
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const body = await request.json()

  const { name, description, fields, layout, styles, customHtml, useCustomHtml, submitText, successMessage, redirectUrl, webhookUrl, externalWebinarId } = body

  if (!name || !fields || !Array.isArray(fields)) {
    return NextResponse.json({ error: 'Name and fields are required' }, { status: 400 })
  }

  // Generate slug from name
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  // Ensure unique slug
  let slug = baseSlug
  let counter = 1
  while (await prisma.popup.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  const popup = await prisma.popup.create({
    data: {
      name,
      slug,
      description: description || null,
      fields,
      layout: layout || null,
      styles: styles || null,
      customHtml: customHtml || null,
      useCustomHtml: useCustomHtml || false,
      submitText: submitText || 'Submit',
      successMessage: successMessage || 'Thank you for your submission!',
      redirectUrl: redirectUrl || null,
      webhookUrl: webhookUrl || null,
      externalWebinarId: externalWebinarId || null,
      userId,
    },
  })

  return NextResponse.json(popup, { status: 201 })
}
