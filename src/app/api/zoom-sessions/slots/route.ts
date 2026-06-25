import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/zoom-sessions/slots?external=id1,id2&internal=id3&range=upcoming|all
//
// Returns the distinct registration time slots (with counts) across the given
// webinars, so the session form can suggest real times that will actually have
// a roster. Avoids empty sessions caused by a mistyped time.
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const external = (searchParams.get('external') || '').split(',').filter(Boolean)
    const internal = (searchParams.get('internal') || '').split(',').filter(Boolean)
    const range = searchParams.get('range') || 'upcoming'

    if (external.length === 0 && internal.length === 0) {
      return NextResponse.json({ slots: [] })
    }

    const timeFilter: any = { not: null }
    if (range === 'upcoming') timeFilter.gte = new Date()

    const counts = new Map<string, number>()

    if (external.length) {
      const grouped = await prisma.externalWebinarRegistration.groupBy({
        by: ['scheduledStartTime'],
        where: { externalWebinarId: { in: external }, scheduledStartTime: timeFilter },
        _count: { _all: true },
      })
      for (const g of grouped) {
        if (!g.scheduledStartTime) continue
        const k = g.scheduledStartTime.toISOString()
        counts.set(k, (counts.get(k) || 0) + g._count._all)
      }
    }

    if (internal.length) {
      const grouped = await prisma.registration.groupBy({
        by: ['scheduledStartTime'],
        where: { webinarId: { in: internal }, scheduledStartTime: timeFilter },
        _count: { _all: true },
      })
      for (const g of grouped) {
        if (!g.scheduledStartTime) continue
        const k = g.scheduledStartTime.toISOString()
        counts.set(k, (counts.get(k) || 0) + g._count._all)
      }
    }

    const slots = Array.from(counts.entries())
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

    return NextResponse.json({ slots })
  } catch (error) {
    console.error('Error loading session slots:', error)
    return NextResponse.json({ error: 'Failed to load slots' }, { status: 500 })
  }
}
