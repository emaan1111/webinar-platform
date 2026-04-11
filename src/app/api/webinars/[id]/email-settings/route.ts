import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/webinars/[id]/email-settings
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const webinar = await prisma.webinar.findUnique({
    where: { id: params.id },
    select: { reminderEmailSource: true },
  })
  if (!webinar) {
    return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
  }

  return NextResponse.json({ reminderEmailSource: webinar.reminderEmailSource })
}

// PUT /api/webinars/[id]/email-settings
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { reminderEmailSource } = body

  if (!['internal', 'cf_mautic'].includes(reminderEmailSource)) {
    return NextResponse.json(
      { error: 'reminderEmailSource must be "internal" or "cf_mautic"' },
      { status: 400 }
    )
  }

  const webinar = await prisma.webinar.update({
    where: { id: params.id },
    data: { reminderEmailSource },
    select: { reminderEmailSource: true },
  })

  return NextResponse.json({ reminderEmailSource: webinar.reminderEmailSource })
}
