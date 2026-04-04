import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/analytics - Get analytics data for user's webinars
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') || '30d'

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (dateRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Get all webinars - removed hostId filter so all admins can see all analytics
    const webinars = await prisma.webinar.findMany({
      include: {
        _count: {
          select: {
            registrations: true
          }
        }
      }
    })

    // Get registrations with attendance data - removed hostId filter
    const registrations = await prisma.registration.findMany({
      where: {
        registeredAt: {
          gte: startDate
        }
      },
      include: {
        webinar: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    // Get chat messages for engagement
    const chatMessages = await prisma.chatMessage.findMany({
      where: {
        webinar: {
          hostId: user.id,
        },
        createdAt: {
          gte: startDate
        }
      }
    })

    // Calculate metrics
    const totalRegistrations = registrations.length
    const totalAttendees = registrations.filter(r => r.attended).length
    const attendanceRate = totalRegistrations > 0 
      ? ((totalAttendees / totalRegistrations) * 100).toFixed(1)
      : '0'

    // Registration trends by month
    const registrationsByMonth: { [key: string]: { registrations: number, attendees: number } } = {}
    
    registrations.forEach(reg => {
      const month = new Date(reg.registeredAt).toLocaleDateString('en-US', { month: 'short' })
      if (!registrationsByMonth[month]) {
        registrationsByMonth[month] = { registrations: 0, attendees: 0 }
      }
      registrationsByMonth[month].registrations++
      if (reg.attended) {
        registrationsByMonth[month].attendees++
      }
    })

    const registrationTrends = Object.entries(registrationsByMonth).map(([date, data]) => ({
      date,
      registrations: data.registrations,
      attendees: data.attendees
    }))

    // Attendance by webinar
    const attendanceByWebinar = webinars.map(webinar => {
      const webinarRegs = registrations.filter(r => r.webinarId === webinar.id)
      const attended = webinarRegs.filter(r => r.attended).length
      const noShow = webinarRegs.length - attended
      
      return {
        webinar: webinar.title,
        attended,
        noShow
      }
    })

    // Engagement breakdown (mock data for now)
    const engagementData = {
      chatMessages: chatMessages.length,
      questions: Math.floor(chatMessages.length * 0.3),
      polls: Math.floor(chatMessages.length * 0.15),
      reactions: Math.floor(chatMessages.length * 0.8)
    }

    // Peak viewing times (mock data - would need actual viewing data)
    const peakViewingTimes = [
      { time: '9 AM', viewers: 20 },
      { time: '10 AM', viewers: 45 },
      { time: '11 AM', viewers: 80 },
      { time: '12 PM', viewers: 120 },
      { time: '1 PM', viewers: 95 },
      { time: '2 PM', viewers: 150 },
      { time: '3 PM', viewers: 200 },
      { time: '4 PM', viewers: 180 },
      { time: '5 PM', viewers: 140 },
      { time: '6 PM', viewers: 90 },
    ]

    return NextResponse.json({
      summary: {
        totalRegistrations,
        totalAttendees,
        attendanceRate: parseFloat(attendanceRate),
        totalEngagement: engagementData.chatMessages + engagementData.questions + 
                        engagementData.polls + engagementData.reactions
      },
      registrationTrends,
      attendanceByWebinar,
      engagement: [
        { name: 'Chat Messages', value: engagementData.chatMessages, color: '#3b82f6' },
        { name: 'Questions', value: engagementData.questions, color: '#10b981' },
        { name: 'Polls', value: engagementData.polls, color: '#f59e0b' },
        { name: 'Reactions', value: engagementData.reactions, color: '#8b5cf6' },
      ],
      peakViewingTimes
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
