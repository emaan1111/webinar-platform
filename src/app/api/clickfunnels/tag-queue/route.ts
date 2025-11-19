import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/clickfunnels/tag-queue - Get all queued and processed tags
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const webinarId = searchParams.get('webinarId')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Build where clause
    const where: any = {}
    
    if (status !== 'all') {
      where.status = status
    }

    // Get tags with registration and webinar details
    const tags = await prisma.clickFunnelsReminderTag.findMany({
      where,
      include: {
        registration: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            webinar: {
              select: {
                id: true,
                title: true,
              }
            },
            schedule: {
              select: {
                id: true,
                scheduledAt: true,
                scheduleType: true,
              }
            }
          }
        }
      },
      orderBy: {
        scheduledFor: 'asc'
      },
      take: limit
    })

    // Filter by webinarId if provided
    let filteredTags = tags
    if (webinarId) {
      filteredTags = tags.filter((tag: any) => tag.registration.webinar.id === webinarId)
    }

    // Get summary statistics
    const stats = {
      total: filteredTags.length,
      pending: filteredTags.filter((t: any) => t.status === 'PENDING').length,
      applied: filteredTags.filter((t: any) => t.status === 'APPLIED').length,
      failed: filteredTags.filter((t: any) => t.status === 'FAILED').length
    }

    // Get unique webinars for filter
    const webinars = await prisma.webinar.findMany({
      where: {
        registrations: {
          some: {
            clickFunnelsReminderTags: {
              some: {}
            }
          }
        }
      },
      select: {
        id: true,
        title: true
      }
    })

    return NextResponse.json({
      tags: filteredTags,
      stats,
      webinars
    })
  } catch (error) {
    console.error('Error fetching tag queue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tag queue' },
      { status: 500 }
    )
  }
}
