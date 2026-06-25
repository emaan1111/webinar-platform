import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/zoom-sessions/webinar-options — webinars available to link, both
// external and internal, for the Zoom-session link picker.
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [external, internal] = await Promise.all([
      prisma.externalWebinar.findMany({
        select: { id: true, name: true, externalWebinarName: true },
        orderBy: { name: 'asc' },
      }),
      prisma.webinar.findMany({
        select: { id: true, title: true },
        orderBy: { title: 'asc' },
      }),
    ])

    return NextResponse.json({
      external: external.map((e) => ({ id: e.id, title: e.name || e.externalWebinarName || 'Untitled' })),
      internal: internal.map((w) => ({ id: w.id, title: w.title })),
    })
  } catch (error) {
    console.error('Error loading webinar options:', error)
    return NextResponse.json({ error: 'Failed to load webinar options' }, { status: 500 })
  }
}
