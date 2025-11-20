import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const registration = await prisma.registration.findUnique({
      where: { id: params.id },
      include: {
        webinar: {
          select: {
            id: true,
            title: true,
            hostId: true
          }
        },
        chatMessages: {
          select: {
            id: true,
            message: true,
            createdAt: true,
            isApproved: true
          },
          orderBy: { createdAt: 'asc' }
        },
        reactions: {
          select: {
            id: true,
            type: true,
            createdAt: true
          },
          orderBy: { createdAt: 'asc' }
        },
        sessions: {
          select: {
            id: true,
            joinedAt: true,
            leftAt: true,
            totalWatchTime: true,
            watchDuration: true,
            videoPosition: true,
            device: true,
            userAgent: true,
            lastSeenAt: true,
            watchedMuted: true,
            mutedDuration: true,
            unmutedDuration: true,
            lastMuteState: true,
            videoEvents: {
              select: {
                id: true,
                eventType: true,
                timestamp: true,
                createdAt: true
              },
              orderBy: { createdAt: 'asc' }
            },
            engagements: {
              select: {
                id: true,
                eventType: true,
                timestamp: true,
                createdAt: true
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { joinedAt: 'desc' }
        },
        pageVisits: {
          select: {
            id: true,
            enteredAt: true,
            timeSpent: true
          },
          orderBy: { enteredAt: 'asc' }
        },
        sales: {
          select: {
            id: true,
            amount: true,
            createdAt: true,
            productName: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!registration) {
      return NextResponse.json({ error: 'Attendee not found' }, { status: 404 })
    }

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get referred registrations
    const referredRegistrations = await prisma.registration.findMany({
      where: {
        referredBy: registration.referralCode || undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        registeredAt: true,
        attended: true,
        webinar: {
          select: {
            title: true
          }
        }
      },
      orderBy: { registeredAt: 'desc' }
    })

    // Get referrer information
    let referrerInfo = null
    if (registration.referredBy) {
      const referrer = await prisma.registration.findFirst({
        where: {
          referralCode: registration.referredBy
        },
        select: {
          name: true,
          email: true,
          referralCode: true
        }
      })
      referrerInfo = referrer
    }

    // Calculate total watch time
    const totalWatchTime = registration.sessions.reduce((sum: number, session: any) => {
      return sum + (session.totalWatchTime || 0)
    }, 0)
    const effectiveTotalWatchTime = totalWatchTime > 0 ? totalWatchTime : (registration.lastWatchedPosition || 0)

    // Calculate engagement score (0-100)
    let engagementScore = 0
    if (registration.attended) engagementScore += 30
    if (effectiveTotalWatchTime > 600) engagementScore += 20 // 10+ min watch
    if (registration.chatMessages.length > 0) engagementScore += 15
    if (registration.reactions.length > 0) engagementScore += 10
    if (registration.sales.length > 0) engagementScore += 25
    engagementScore = Math.min(100, engagementScore)

    // Format profile data
    const profile = {
      id: registration.id,
      name: registration.name,
      email: registration.email,
      phone: registration.phone,
      timezone: registration.timezone,
      country: registration.country,
      webinarTitle: registration.webinar.title,
      registeredAt: registration.registeredAt.toISOString(),
      scheduledAt: registration.scheduledStartTime?.toISOString() || null,
      attended: registration.attended,
      joinedAt: registration.joinedAt?.toISOString() || null,
      leftAt: registration.leftAt?.toISOString() || null,
      totalWatchTime: effectiveTotalWatchTime,
      engagementScore,

      // Engagement details
      chatMessages: registration.chatMessages.map((msg: any) => ({
        id: msg.id,
        message: msg.message,
        timestamp: msg.createdAt.toISOString(),
        isApproved: msg.isApproved
      })),

      reactions: registration.reactions.map((reaction: any) => ({
        id: reaction.id,
        type: reaction.type,
        timestamp: reaction.createdAt.toISOString()
      })),

      ctaClicks: registration.sales.map((sale: any) => ({
        id: sale.id,
        offerTitle: sale.productName || 'Unknown',
        timestamp: sale.createdAt.toISOString()
      })),

      pageVisits: registration.pageVisits.map((visit: any) => ({
        id: visit.id,
        timestamp: visit.enteredAt.toISOString(),
        duration: visit.timeSpent || 0
      })),

      watchSessions: registration.sessions.map((session: any) => {
        const duration = session.watchDuration || session.totalWatchTime || 0
        return {
          id: session.id,
          joinedAt: session.joinedAt.toISOString(),
          leftAt: session.leftAt?.toISOString() || null,
          lastSeenAt: session.lastSeenAt?.toISOString() || null,
          duration,
          videoPosition: session.videoPosition || 0,
          device: session.device || 'unknown',
          userAgent: session.userAgent || null,
          watchedMuted: session.watchedMuted,
          mutedDuration: session.mutedDuration || 0,
          unmutedDuration: session.unmutedDuration || 0,
          lastMuteState: session.lastMuteState,
          videoEvents: session.videoEvents.map((event: any) => ({
            id: event.id,
            event: event.eventType,
            timestamp: event.timestamp,
            videoPosition: event.timestamp || 0,
            createdAt: event.createdAt.toISOString()
          })),
          engagements: session.engagements.map((eng: any) => ({
            id: eng.id,
            type: eng.eventType,
            timestamp: eng.timestamp,
            createdAt: eng.createdAt.toISOString()
          }))
        }
      }),

      referrals: referredRegistrations.map((ref: any) => ({
        id: ref.id,
        name: ref.name,
        email: ref.email,
        registeredAt: ref.registeredAt.toISOString(),
        attended: ref.attended
      })),

      referralCode: registration.referralCode,
      referredBy: registration.referredBy,
      referrerName: referrerInfo?.name || null
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error fetching attendee profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendee profile' },
      { status: 500 }
    )
  }
}
