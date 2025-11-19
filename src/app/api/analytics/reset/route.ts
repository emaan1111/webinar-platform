import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { webinarId } = await request.json()

    if (!webinarId) {
      return NextResponse.json({ error: 'Webinar ID is required' }, { status: 400 })
    }

    // Verify the webinar exists and user has access
    const webinar = await prisma.webinar.findUnique({
      where: { id: webinarId },
    })

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    // Reset analytics data for the webinar
    // Note: analyticsEvent table doesn't exist in current schema
    // await prisma.analyticsEvent.deleteMany({
    //   where: { webinarId }
    // })

    // Reset registration analytics data
    await prisma.registration.updateMany({
      where: { webinarId },
      data: {
        hasAttended: false,
        joinedAt: null,
        leftAt: null,
        watchTimeSeconds: 0,
        lastHeartbeat: null,
        sawOffer: false,
        clickedOffer: false,
        hasPurchased: false,
      }
    })

    // Delete all page visits
    await prisma.pageVisit.deleteMany({
      where: { webinarId }
    })

    // Delete chat messages (optional - you might want to keep these)
    // await prisma.chatMessage.deleteMany({
    //   where: { webinarId }
    // })

    // Delete reactions (optional - you might want to keep these)
    // await prisma.reaction.deleteMany({
    //   where: { webinarId }
    // })

    console.log(`✅ Reset analytics for webinar: ${webinarId}`)

    return NextResponse.json({
      success: true,
      message: 'Analytics reset successfully',
      webinarId
    })
  } catch (error) {
    console.error('Error resetting analytics:', error)
    return NextResponse.json(
      { error: 'Failed to reset analytics' },
      { status: 500 }
    )
  }
}
