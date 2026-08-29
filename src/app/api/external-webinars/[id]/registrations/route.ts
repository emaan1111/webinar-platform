import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

/**
 * External Webinar Registrations API
 * 
 * GET /api/external-webinars/[id]/registrations
 * 
 * Lists all registrations for an external webinar with attendance data
 */

const MAX_LIMIT = 10000

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { searchParams } = new URL(request.url)
    
    // Pagination. Non-numeric or out-of-range values would otherwise reach
    // Prisma as NaN/negative skip and blow up the whole request.
    const parsedPage = parseInt(searchParams.get('page') || '1', 10)
    const parsedLimit = parseInt(searchParams.get('limit') || '50', 10)
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, MAX_LIMIT) : 50
    const skip = (page - 1) * limit

    // Filters
    const attended = searchParams.get('attended')
    const search = searchParams.get('search')
    const tagsApplied = searchParams.get('tagsApplied')

    // Build where clause
    const where: any = { externalWebinarId: id }
    
    if (attended === 'true') where.attended = true
    if (attended === 'false') where.attended = false
    if (tagsApplied === 'true') where.attendanceTagsApplied = true
    if (tagsApplied === 'false') where.attendanceTagsApplied = false
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get registrations
    const [registrations, total] = await Promise.all([
      prisma.externalWebinarRegistration.findMany({
        where,
        orderBy: { registeredAt: 'desc' },
        skip,
        take: limit,
        include: {
          schedule: true,
        }
      }),
      prisma.externalWebinarRegistration.count({ where })
    ])

    // Aggregate stats are for the whole webinar, not the current filter/page —
    // the dashboard cards show overall totals while the table shows the filtered slice.
    const [stats, attendedCount, facebookCapiCount, smsSentCount, tagsAppliedCount] = await Promise.all([
      prisma.externalWebinarRegistration.aggregate({
        where: { externalWebinarId: id },
        _count: true,
        _avg: {
          watchTimeMinutes: true,
          watchTimePercentage: true,
        }
      }),
      prisma.externalWebinarRegistration.count({
        where: { externalWebinarId: id, attended: true }
      }),
      prisma.externalWebinarRegistration.count({
        where: { externalWebinarId: id, facebookCapiSent: true }
      }),
      prisma.externalWebinarRegistration.count({
        where: { externalWebinarId: id, postSessionSmsSent: true }
      }),
      prisma.externalWebinarRegistration.count({
        where: { externalWebinarId: id, attendanceTagsApplied: true }
      }),
    ])

    return NextResponse.json({
      registrations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total: stats._count,
        attended: attendedCount,
        notAttended: stats._count - attendedCount,
        facebookCapiSent: facebookCapiCount,
        postSessionSmsSent: smsSentCount,
        attendanceTagsApplied: tagsAppliedCount,
        avgWatchTimeMinutes: Math.round(stats._avg.watchTimeMinutes || 0),
        avgWatchTimePercentage: Math.round(stats._avg.watchTimePercentage || 0),
      }
    })
  } catch (error) {
    console.error('Error fetching external webinar registrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    )
  }
}
