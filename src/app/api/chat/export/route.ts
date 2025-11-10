import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/chat/export?webinarId=xxx&format=json|csv
 * Export chat messages for a webinar
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const webinarId = searchParams.get('webinarId')
    const format = searchParams.get('format') || 'json'
    const scriptedOnly = searchParams.get('scriptedOnly') === 'true'

    if (!webinarId) {
      return NextResponse.json(
        { error: 'webinarId is required' },
        { status: 400 }
      )
    }

    // Verify webinar exists and user is the host
    const webinar = await prisma.webinar.findUnique({
      where: { id: webinarId }
    })

    if (!webinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      )
    }

    if (webinar.hostId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the host can export chat messages' },
        { status: 403 }
      )
    }

    // Fetch chat messages
    const messages = await prisma.chatMessage.findMany({
      where: {
        webinarId,
        ...(scriptedOnly && { isScripted: true })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { videoTimestamp: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    // Export as JSON
    if (format === 'json') {
      const exportData = messages.map((msg: any) => ({
        id: msg.id,
        userName: msg.user.name || 'Anonymous',
        userEmail: msg.user.email,
        message: msg.message,
        isScripted: msg.isScripted,
        videoTimestamp: msg.videoTimestamp,
        isHidden: msg.isHidden,
        createdAt: msg.createdAt.toISOString()
      }))

      return NextResponse.json({
        webinarId,
        webinarTitle: webinar.title,
        totalMessages: messages.length,
        messages: exportData
      })
    }

    // Export as CSV
    if (format === 'csv') {
      const csvHeader = 'userName,userEmail,message,videoTimestamp,isScripted,isHidden,createdAt\n'
      const csvRows = messages.map((msg: any) => {
        const userName = (msg.user.name || 'Anonymous').replace(/,/g, ';')
        const userEmail = msg.user.email.replace(/,/g, ';')
        const message = msg.message.replace(/,/g, ';').replace(/\n/g, ' ')
        const videoTimestamp = msg.videoTimestamp ?? ''
        const isScripted = msg.isScripted
        const isHidden = msg.isHidden
        const createdAt = msg.createdAt.toISOString()
        
        return `${userName},${userEmail},${message},${videoTimestamp},${isScripted},${isHidden},${createdAt}`
      }).join('\n')

      const csv = csvHeader + csvRows

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="chat-messages-${webinar.title.replace(/[^a-z0-9]/gi, '-')}.csv"`
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid format. Use json or csv' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Chat export error:', error)
    return NextResponse.json(
      { error: 'Failed to export chat messages' },
      { status: 500 }
    )
  }
}
