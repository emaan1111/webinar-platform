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
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
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

    // Get aggregate stats
    const stats = await prisma.externalWebinarRegistration.aggregate({
      where: { externalWebinarId: id },
      _count: true,
      _avg: {
        watchTimeMinutes: true,
        watchTimePercentage: true,
      }
    })

    const attendedCount = await prisma.externalWebinarRegistration.count({
      where: { externalWebinarId: id, attended: true }
    })

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
