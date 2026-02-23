import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    console.log('[Attendee Profile API] Fetching profile for ID:', id)
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('[Attendee Profile API] Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Attendee Profile API] Session user:', session.user.email)

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        webinar: {
          select: {
            id: true,
            title: true,
            hostId: true
          }
        },
        splitTest: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        splitTestVariant: {
          select: {
            id: true,
            weight: true,
            leadPage: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
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
            timeSpent: true,
            pageType: true,
            pageId: true
          },
          orderBy: { enteredAt: 'asc' }
        },
        sales: {
          select: {
            id: true,
            amount: true,
            createdAt: true,
            productName: true,
            orderId: true,
            currency: true,
            purchasedAt: true
          },
          orderBy: { createdAt: 'asc' }
        },
        reminders: {
          select: {
            id: true,
            type: true,
            channel: true,
            status: true,
            sentAt: true,
            scheduledFor: true,
            message: true,
            emailSentTo: true,
            smsSentTo: true,
            errorMessage: true,
            template: {
              select: {
                emailSubject: true,
                smsBody: true,
                minutesBefore: true,
                minutesAfter: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        clickFunnelsReminderTags: {
          select: {
            id: true,
            tagName: true,
            status: true,
            scheduledFor: true,
            appliedAt: true,
            errorMessage: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    console.log('[Attendee Profile API] Registration found:', registration ? 'Yes' : 'No')

    if (!registration) {
      console.log('[Attendee Profile API] Registration not found for ID:', id)
      return NextResponse.json({ error: 'Attendee not found' }, { status: 404 })
    }

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    console.log('[Attendee Profile API] User role:', user?.role)

    if (!user || user.role !== 'ADMIN') {
      console.log('[Attendee Profile API] Forbidden - user is not admin')
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

    // Get lead page source (from PageVisit with pageType 'registration')
    let leadPageSource = null
    const registrationVisit = registration.pageVisits.find((v: any) => v.pageType === 'registration' && v.pageId)
    if (registrationVisit?.pageId) {
      const leadPage = await prisma.leadPage.findUnique({
        where: { id: registrationVisit.pageId },
        select: {
          id: true,
          name: true,
          slug: true
        }
      })
      if (leadPage) {
        leadPageSource = leadPage
      }
    }

    // Calculate total watch time
    // Use the maximum videoPosition from all sessions (furthest point watched)
    const maxVideoPosition = registration.sessions.reduce((max: number, session: any) => {
      return Math.max(max, session.videoPosition || 0)
    }, 0)
    
    // Use videoPosition if available, otherwise fall back to lastWatchedPosition
    const effectiveTotalWatchTime = maxVideoPosition > 0 ? maxVideoPosition : (registration.lastWatchedPosition || 0)

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
      hasPurchased: registration.hasPurchased,

      // Purchases
      purchases: registration.sales.map((sale: any) => ({
        id: sale.id,
        productName: sale.productName || 'Unknown Product',
        amount: sale.amount,
        currency: sale.currency || 'USD',
        orderId: sale.orderId,
        purchasedAt: sale.purchasedAt?.toISOString() || sale.createdAt.toISOString()
      })),

      // SMS/Email Reminders
      reminders: registration.reminders.map((reminder: any) => ({
        id: reminder.id,
        type: reminder.type, // 'pre_webinar' or 'post_webinar'
        channel: reminder.channel, // 'SMS' or 'EMAIL'
        status: reminder.status, // 'PENDING', 'SENT', 'FAILED', etc.
        sentAt: reminder.sentAt?.toISOString() || null,
        scheduledFor: reminder.scheduledFor?.toISOString() || null,
        message: reminder.message || reminder.template?.smsBody || null,
        emailSubject: reminder.template?.emailSubject || null,
        sentTo: reminder.channel === 'SMS' ? reminder.smsSentTo : reminder.emailSentTo,
        errorMessage: reminder.errorMessage || null,
        timing: reminder.template?.minutesBefore 
          ? `${reminder.template.minutesBefore} min before`
          : reminder.template?.minutesAfter
          ? `${reminder.template.minutesAfter} min after`
          : 'Immediate'
      })),

      // ClickFunnels Tags
      clickFunnelsTags: registration.clickFunnelsReminderTags.map((tag: any) => ({
        id: tag.id,
        tagName: tag.tagName,
        status: tag.status, // 'PENDING', 'SENT', 'FAILED', etc.
        scheduledFor: tag.scheduledFor.toISOString(),
        appliedAt: tag.appliedAt?.toISOString() || null,
        errorMessage: tag.errorMessage || null
      })),

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
      referrerName: referrerInfo?.name || null,

      // Registration source (lead page or split test)
      registrationSource: {
        splitTest: registration.splitTest ? {
          id: registration.splitTest.id,
          name: registration.splitTest.name,
          slug: registration.splitTest.slug
        } : null,
        splitTestVariant: registration.splitTestVariant ? {
          id: registration.splitTestVariant.id,
          weight: registration.splitTestVariant.weight,
          leadPage: registration.splitTestVariant.leadPage ? {
            id: registration.splitTestVariant.leadPage.id,
            name: registration.splitTestVariant.leadPage.name,
            slug: registration.splitTestVariant.leadPage.slug
          } : null
        } : null,
        leadPage: leadPageSource ? {
          id: leadPageSource.id,
          name: leadPageSource.name,
          slug: leadPageSource.slug
        } : null
      }
    }

    console.log('[Attendee Profile API] Profile data prepared successfully')

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('[Attendee Profile API] Error fetching attendee profile:', error)
    console.error('[Attendee Profile API] Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { 
        error: 'Failed to fetch attendee profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
