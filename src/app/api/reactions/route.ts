import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all reactions with related data
    const reactions = await prisma.reaction.findMany({
      include: {
        webinar: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        registration: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(reactions)
  } catch (error) {
    console.error('Error fetching reactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reactions' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const deleteType = searchParams.get('type') // 'fake' or 'selected'
    const ids = searchParams.get('ids')?.split(',') || []

    let result

    if (deleteType === 'fake') {
      // Delete all fake/scripted reactions
      result = await prisma.reaction.deleteMany({
        where: {
          isScripted: true,
        },
      })
    } else if (deleteType === 'selected' && ids.length > 0) {
      // Delete selected reactions by IDs
      result = await prisma.reaction.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid delete type or no IDs provided' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Successfully deleted ${result.count} reaction(s)`,
    })
  } catch (error) {
    console.error('Error deleting reactions:', error)
    return NextResponse.json(
      { error: 'Failed to delete reactions' },
      { status: 500 }
    )
  }
}
