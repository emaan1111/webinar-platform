import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// POST /api/chat/[id]/like
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { registrationId, userId, userName } = body

    if (!id) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
    }

    // Determine liker identity
    if (!registrationId && !userId) {
       // Allow anonymous likes but warn? Or strictly require registration/user?
       // For this app, usually visitors are registered.
       return NextResponse.json({ error: 'Identity required' }, { status: 401 })
    }

    // Check if message exists
    const message = await prisma.chatMessage.findUnique({
      where: { id }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Check if already liked
    const existingLike = await prisma.chatMessageLike.findFirst({
      where: {
        chatMessageId: id,
        userId: userId || undefined,
        registrationId: registrationId || undefined,
        // If purely anonymous (no reg/user), we can't really track duplicate likes easily without sessionId/cookie
      }
    })

    if (existingLike) {
      // Unlike
      await prisma.chatMessageLike.delete({
        where: { id: existingLike.id }
      })
      
      return NextResponse.json({ liked: false })
    } else {
      // Like
      await prisma.chatMessageLike.create({
        data: {
          chatMessageId: id,
          userId: userId || undefined,
          registrationId: registrationId || undefined,
          likerName: userName || 'Anonymous'
        }
      })
      
      // Notification Logic:
      // "Naseera liked your comment"
      // If the message belongs to the current user, they see it immediately locally.
      // But if AI likes the user's comment, we need to push a notification?
      // For now, the UI just updates the heart icon. 
      // The requirement "when that happens user gets notification... 'Naseera liked your comment'"
      // implies a toast or specific alert.
      
      return NextResponse.json({ liked: true })
    }

  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}
