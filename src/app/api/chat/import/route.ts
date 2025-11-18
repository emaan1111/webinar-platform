import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/chat/import
 * Import scripted chat messages from CSV/JSON
 * 
 * Expected JSON format:
 * {
 *   webinarId: string,
 *   messages: [
 *     { userName: string, userEmail: string, message: string, videoTimestamp: number },
 *     ...
 *   ]
 * }
 * 
 * Expected CSV format:
 * userName,userEmail,message,videoTimestamp
 * John Doe,john@example.com,Great presentation!,120
 * Jane Smith,jane@example.com,Love this!,180
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const contentType = req.headers.get('content-type') || ''
    
    // Handle JSON import
    if (contentType.includes('application/json')) {
      const body = await req.json()
      const { webinarId, messages } = body

      if (!webinarId || !messages || !Array.isArray(messages)) {
        return NextResponse.json(
          { error: 'Invalid request format' },
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

      // Removed ownership check - all admins can import chat messages

      // Create or find users and insert chat messages
      const createdMessages = []
      
      for (const msg of messages) {
        const { userName, userEmail, message, videoTimestamp } = msg

        if (!userName || !userEmail || !message || videoTimestamp === undefined) {
          continue // Skip invalid entries
        }

        // Find or create user
        let user = await prisma.user.findUnique({
          where: { email: userEmail }
        })

        if (!user) {
          // Create a dummy user for scripted messages
          user = await prisma.user.create({
            data: {
              email: userEmail,
              name: userName,
              password: '', // No password for dummy users
              role: 'ATTENDEE'
            }
          })
        }

        // Create scripted chat message
        const chatMessage = await prisma.chatMessage.create({
          data: {
            webinarId,
            userId: user.id,
            message,
            isScripted: true,
            videoTimestamp: Math.floor(videoTimestamp),
            isHidden: false
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })

        createdMessages.push(chatMessage)
      }

      return NextResponse.json({
        message: `Successfully imported ${createdMessages.length} chat messages`,
        count: createdMessages.length,
        messages: createdMessages
      })
    }

    // Handle CSV import
    if (contentType.includes('text/csv') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File
      const webinarId = formData.get('webinarId') as string

      if (!file || !webinarId) {
        return NextResponse.json(
          { error: 'Missing file or webinarId' },
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

      // Removed ownership check - all admins can import chat messages

      // Parse CSV
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        return NextResponse.json(
          { error: 'CSV file is empty or invalid' },
          { status: 400 }
        )
      }

      // Skip header row
      const dataLines = lines.slice(1)
      const createdMessages = []

      for (const line of dataLines) {
        const [userName, userEmail, message, timestampStr] = line.split(',').map(s => s.trim())
        const videoTimestamp = parseInt(timestampStr, 10)

        if (!userName || !userEmail || !message || isNaN(videoTimestamp)) {
          continue // Skip invalid entries
        }

        // Find or create user
        let user = await prisma.user.findUnique({
          where: { email: userEmail }
        })

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: userEmail,
              name: userName,
              password: '',
              role: 'ATTENDEE'
            }
          })
        }

        // Create scripted chat message
        const chatMessage = await prisma.chatMessage.create({
          data: {
            webinarId,
            userId: user.id,
            message,
            isScripted: true,
            videoTimestamp,
            isHidden: false
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })

        createdMessages.push(chatMessage)
      }

      return NextResponse.json({
        message: `Successfully imported ${createdMessages.length} chat messages`,
        count: createdMessages.length,
        messages: createdMessages
      })
    }

    return NextResponse.json(
      { error: 'Unsupported content type. Use application/json or text/csv' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Chat import error:', error)
    return NextResponse.json(
      { error: 'Failed to import chat messages' },
      { status: 500 }
    )
  }
}
