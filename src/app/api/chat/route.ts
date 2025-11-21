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

    // Build query - removed hostId filter so all admins can see all chats
    const whereClause: any = {}

    if (webinarId) {
      whereClause.webinarId = webinarId
    }

    // Get messages
    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      select: {
        id: true,
        userId: true,
        registrationId: true,
        userName: true, // Include userName field from ChatMessage table
        message: true,
        isHidden: true,
        isApproved: true,
        isScripted: true,
        isAI: true,
        videoTimestamp: true,
        createdAt: true,
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

    // Check if message exists (removed hostId check so all admins can update)
    const message = await prisma.chatMessage.findUnique({
      where: {
        id
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
    const body = await request.json()
    const { webinarId, message, registrationId } = body

    // Debug logging
    console.log('💬 [API] Received chat message:', {
      webinarId,
      message: message?.substring(0, 50),
      registrationId,
      hasRegistrationId: !!registrationId
    });

    // Validate required fields
    if (!webinarId || !message) {
      return NextResponse.json(
        { error: 'webinarId and message are required' },
        { status: 400 }
      )
    }

    // Check if user is authenticated OR has a valid registration
    const session = await getServerSession(authOptions)
    
    let userId: string | null = null
    let userName: string | null = null
    let regId: string | null = null

    // Priority 1: Authenticated user
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })
      
      if (user) {
        userId = user.id
        userName = user.name || user.email.split('@')[0]
      }
    }
    
    // Priority 2: Registered attendee (if no authenticated user)
    if (!userId && registrationId) {
      console.log('💬 [API] Looking up registration:', registrationId);
      
      const registration = await prisma.registration.findUnique({
        where: { id: registrationId }
      })

      console.log('💬 [API] Found registration:', {
        found: !!registration,
        name: registration?.name,
        email: registration?.email
      });

      if (!registration) {
        return NextResponse.json(
          { error: 'Invalid registration' },
          { status: 404 }
        )
      }

      // Verify registration is for this webinar
      if (registration.webinarId !== webinarId) {
        return NextResponse.json(
          { error: 'Registration does not match webinar' },
          { status: 403 }
        )
      }

      regId = registration.id
      userName = registration.name
    }

    console.log('💬 [API] Final userName:', userName);

    // If neither authenticated user nor valid registration, deny access
    if (!userId && !regId) {
      return NextResponse.json(
        { error: 'Must be authenticated or have a valid registration' },
        { status: 401 }
      )
    }

    // Create message
    const newMessage = await prisma.chatMessage.create({
      data: {
        webinarId,
        userId,
        registrationId: regId,
        userName,
        message,
        isHidden: false, // Visible in current session
        isApproved: false // Needs approval to show in future sessions
      },
      include: {
        user: userId ? {
          select: {
            id: true,
            name: true,
            email: true
          }
        } : undefined,
        registration: regId ? {
          select: {
            id: true,
            name: true,
            email: true
          }
        } : undefined,
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
