import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/chat - Get chat messages for webinars
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const webinarId = searchParams.get('webinarId')
    const search = searchParams.get('search')

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Build query
    const whereClause: any = {
      webinar: {
        hostId: user.id
      }
    }

    if (webinarId) {
      whereClause.webinarId = webinarId
    }

    // Get messages
    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        webinar: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Filter by search if provided
    let filteredMessages = messages
    if (search) {
      const searchLower = search.toLowerCase()
      filteredMessages = messages.filter((msg: any) => 
        msg.message.toLowerCase().includes(searchLower) ||
        msg.user.name?.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({ messages: filteredMessages })
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    )
  }
}

// PATCH /api/chat/[id] - Update message visibility
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, isHidden, isApproved } = body

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify ownership
    const message = await prisma.chatMessage.findFirst({
      where: {
        id,
        webinar: {
          hostId: user.id
        }
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Build update data
    const updateData: any = {}
    if (typeof isHidden === 'boolean') {
      updateData.isHidden = isHidden
    }
    if (typeof isApproved === 'boolean') {
      updateData.isApproved = isApproved
    }

    // Update message
    const updated = await prisma.chatMessage.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ message: updated })
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    )
  }
}

// POST /api/chat - Send a message
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { webinarId, message } = body

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create message
    const newMessage = await prisma.chatMessage.create({
      data: {
        webinarId,
        userId: user.id,
        message,
        isHidden: false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        webinar: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json({ message: newMessage }, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}
