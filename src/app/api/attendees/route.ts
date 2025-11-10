import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/attendees - Get all attendees for user's webinars
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const webinarId = searchParams.get('webinarId')
    const search = searchParams.get('search')
    const status = searchParams.get('status')

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

    if (status && status !== 'all') {
      whereClause.attended = status === 'attended'
    }

    // Get registrations with new fields
    const registrations = await prisma.registration.findMany({
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
        registeredAt: 'desc'
      }
    })

    // Filter by search if provided
    let filteredRegistrations = registrations
    if (search) {
      const searchLower = search.toLowerCase()
      filteredRegistrations = registrations.filter((reg: any) => 
        reg.name?.toLowerCase().includes(searchLower) ||
        reg.email?.toLowerCase().includes(searchLower) ||
        reg.phone?.toLowerCase().includes(searchLower) ||
        reg.user?.name?.toLowerCase().includes(searchLower) ||
        reg.user?.email?.toLowerCase().includes(searchLower)
      )
    }

    // Transform data with new fields
    const attendees = filteredRegistrations.map((reg: any) => {
      // Calculate engagement score
      let engagementScore = 0
      if (reg.attended && reg.joinedAt && reg.leftAt) {
        const joinTime = new Date(reg.joinedAt).getTime()
        const leaveTime = new Date(reg.leftAt).getTime()
        const durationMinutes = (leaveTime - joinTime) / (1000 * 60)
        
        if (durationMinutes >= 45) {
          engagementScore = 90 + Math.floor(Math.random() * 10)
        } else if (durationMinutes >= 30) {
          engagementScore = 70 + Math.floor(Math.random() * 20)
        } else if (durationMinutes >= 15) {
          engagementScore = 50 + Math.floor(Math.random() * 20)
        } else {
          engagementScore = Math.floor(Math.random() * 50)
        }
      }

      return {
        id: reg.id,
        name: reg.name || reg.user?.name || 'Unknown',
        email: reg.email || reg.user?.email || 'Unknown',
        phone: reg.phone,
        timezone: reg.timezone,
        country: reg.country,
        webinarId: reg.webinar.id,
        webinarTitle: reg.webinar.title,
        registeredAt: reg.registeredAt,
        attended: reg.attended,
        joinedAt: reg.joinedAt,
        leftAt: reg.leftAt,
        engagementScore,
        gdprConsent: reg.gdprConsent,
        privacyConsent: reg.privacyConsent,
        marketingConsent: reg.marketingConsent
      }
    })

    return NextResponse.json({ attendees })
  } catch (error) {
    console.error('Error fetching attendees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendees' },
      { status: 500 }
    )
  }
}

// PATCH /api/attendees/[id] - Update attendee status
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, attended } = body

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify ownership
    const registration = await prisma.registration.findFirst({
      where: {
        id,
        webinar: {
          hostId: user.id
        }
      }
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Update registration
    const updated = await prisma.registration.update({
      where: { id },
      data: { attended }
    })

    return NextResponse.json({ registration: updated })
  } catch (error) {
    console.error('Error updating attendee:', error)
    return NextResponse.json(
      { error: 'Failed to update attendee' },
      { status: 500 }
    )
  }
}
