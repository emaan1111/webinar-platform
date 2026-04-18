import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    // Build query - removed hostId filter so all admins can see all attendees
    const whereClause: any = {}

    if (webinarId) {
      whereClause.webinarId = webinarId
    }

    if (status && status !== 'all') {
      whereClause.attended = status === 'attended'
    }

    // Get all lead pages upfront for efficient lookup
    const leadPagesMap = new Map<string, string>()
    const leadPages = await prisma.leadPage.findMany({
      select: { id: true, name: true }
    })
    leadPages.forEach(lp => leadPagesMap.set(lp.id, lp.name))

    // Get registrations with detailed analytics
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
            title: true,
            duration: true,
            status: true
          }
        },
        pageVisits: {
          where: {
            pageType: 'registration'
          },
          orderBy: {
            enteredAt: 'asc'
          },
          take: 1,
          select: {
            pageId: true
          }
        },
        sessions: {
          include: {
            videoEvents: true,
            engagements: true
          },
          orderBy: {
            joinedAt: 'desc'
          }
        },
        sales: {
          orderBy: {
            purchasedAt: 'desc'
          }
        },
        offerAnalytics: {
          orderBy: {
            sawOfferAt: 'desc'
          }
        }
      },
      orderBy: {
        registeredAt: 'desc'
      }
    })

    // Filter out test users (identified by patterns in name/email)
    const isTestUser = (name: string, email: string) => {
      const nameLower = (name || '').toLowerCase()
      const emailLower = (email || '').toLowerCase()
      return (
        emailLower.includes('test') ||
        emailLower.includes('demo') ||
        emailLower.includes('fake') ||
        emailLower.includes('scripted') ||
        emailLower.includes('example') ||
        emailLower.includes('sample') ||
        nameLower.includes('test') ||
        nameLower.includes('demo') ||
        nameLower.includes('fake') ||
        nameLower.includes('scripted') ||
        nameLower.includes('sample')
      )
    }

    // Filter out test users
    let filteredRegistrations = registrations.filter((reg: any) => {
      const name = reg.name || reg.user?.name || ''
      const email = reg.email || reg.user?.email || ''
      return !isTestUser(name, email)
    })

    // Filter by search if provided
    if (search) {
      const searchLower = search.toLowerCase()
      filteredRegistrations = filteredRegistrations.filter((reg: any) => 
        reg.name?.toLowerCase().includes(searchLower) ||
        reg.email?.toLowerCase().includes(searchLower) ||
        reg.phone?.toLowerCase().includes(searchLower) ||
        reg.user?.name?.toLowerCase().includes(searchLower) ||
        reg.user?.email?.toLowerCase().includes(searchLower)
      )
    }

    // Transform data with detailed analytics
    const attendees = filteredRegistrations.map((reg: any) => {
      const sales = reg.sales || []
      const lastSale = sales[0]
      const totalPurchaseAmount = sales.reduce((sum: number, sale: any) => {
        return sum + (sale.amount || 0)
      }, 0)
      const purchaseCurrency =
        lastSale?.currency ||
        sales.find((sale: any) => sale.currency)?.currency ||
        null

      // Calculate total watch time from all sessions
      // Use the maximum videoPosition (furthest point watched) across all sessions
      const maxVideoPosition = reg.sessions.reduce((max: number, session: any) => {
        return Math.max(max, session.videoPosition || 0)
      }, 0)

      // Use videoPosition if available, otherwise fall back to lastWatchedPosition
      const effectiveTotalWatchTime = maxVideoPosition > 0 ? maxVideoPosition : (reg.lastWatchedPosition || 0)

      // Get most recent session data
      const lastSession = reg.sessions[0]
      const lastSessionDevice = lastSession?.device || null
      const lastSessionBrowser = lastSession?.browser || null
      const lastSessionOS = lastSession?.os || null
      const lastSeenAt = lastSession?.lastSeenAt || null

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

      // Count engagement events
      const totalEngagements = reg.sessions.reduce((sum: number, session: any) => {
        return sum + (session.engagements?.length || 0)
      }, 0)
      
      // Calculate muted/unmuted data from sessions
      const totalMutedTime = reg.sessions.reduce((sum: number, session: any) => {
        return sum + (session.mutedDuration || 0)
      }, 0)
      const totalUnmutedTime = reg.sessions.reduce((sum: number, session: any) => {
        return sum + (session.unmutedDuration || 0)
      }, 0)
      const watchedMostlyMuted = totalMutedTime > totalUnmutedTime
      
      // Check if user viewed or clicked any offers
      const viewedOffer = (reg.offerAnalytics || []).some((o: any) => o.viewedOffer)
      const clickedOffer = (reg.offerAnalytics || []).some((o: any) => o.clickedOffer)

      // Get lead page name from the first registration page visit
      const registrationPageVisit = reg.pageVisits?.[0]
      const leadPageName = registrationPageVisit?.pageId 
        ? leadPagesMap.get(registrationPageVisit.pageId) || null
        : null

      // Format watch time
      const formatWatchTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`
      }

      // Calculate webinar status
      const calculateWebinarStatus = () => {
        const now = new Date()
        const scheduledStart = reg.scheduledStartTime ? new Date(reg.scheduledStartTime) : null
        const webinarDuration = reg.webinar.duration || 0
        
        if (!scheduledStart) {
          return 'Unknown'
        }
        
        const scheduledEnd = new Date(scheduledStart.getTime() + webinarDuration * 60 * 1000)
        
        if (now < scheduledStart) {
          return 'Upcoming'
        } else if (now >= scheduledStart && now <= scheduledEnd) {
          return 'Currently Happening'
        } else {
          // Past webinar
          return reg.attended ? 'Attended' : 'No Show'
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
        scheduledAt: reg.scheduledStartTime,
        webinarStatus: calculateWebinarStatus(),
        attended: reg.attended,
        joinedAt: reg.joinedAt,
        leftAt: reg.leftAt,
        lastSeenAt: lastSeenAt,
        engagementScore,
        gdprConsent: reg.gdprConsent,
        privacyConsent: reg.privacyConsent,
        marketingConsent: reg.marketingConsent,
        // New analytics fields
        registrationDevice: reg.registrationDevice || 'unknown',
        leadPageName: leadPageName,
        watchedReplay: reg.watchedReplay || false,
        replayWatchTime: reg.replayWatchTime || 0,
        replayWatchTimeFormatted: formatWatchTime(reg.replayWatchTime || 0),
        replayClickedCTA: reg.replayClickedCTA || false,
        replayDevice: reg.replayDevice || null,
        totalWatchTime: effectiveTotalWatchTime,
        totalWatchTimeFormatted: formatWatchTime(effectiveTotalWatchTime),
        lastWatchedPosition: reg.lastWatchedPosition || 0,
        lastWatchedPositionFormatted: formatWatchTime(reg.lastWatchedPosition || 0),
        lastSessionDevice,
        lastSessionBrowser,
        lastSessionOS,
        totalEngagements,
        sessionCount: reg.sessions.length,
        // Offer analytics
        viewedOffer,
        clickedOffer,
        // Muted/Unmuted tracking
        totalMutedTime,
        totalUnmutedTime,
        totalMutedTimeFormatted: formatWatchTime(totalMutedTime),
        totalUnmutedTimeFormatted: formatWatchTime(totalUnmutedTime),
        watchedMostlyMuted,
        // Purchase data
        hasPurchased: sales.length > 0,
        purchaseCount: sales.length,
        lastPurchaseAt: lastSale?.purchasedAt || null,
        lastPurchaseAmount: lastSale?.amount || null,
        lastPurchaseCurrency: lastSale?.currency || purchaseCurrency,
        lastPurchaseProduct: lastSale?.productName || null,
        totalPurchaseAmount,
        purchaseCurrency,
        // Sessions data for expandable rows
        sessions: reg.sessions.map((session: any) => ({
          id: session.id,
          joinedAt: session.joinedAt,
          leftAt: session.leftAt,
          videoPosition: session.videoPosition || 0,
          device: session.device || 'unknown',
          browser: session.browser || null,
          isActive: session.isActive,
          lastSeenAt: session.lastSeenAt
        }))
      }
    })

    // --- Also fetch External Webinar Registrations ---
    const extWhereClause: any = {}
    
    if (webinarId) {
      // If filtering by a specific internal webinarId, skip external (they won't match)
      // But if it starts with 'ext_', filter by externalWebinarId
      if (webinarId.startsWith('ext_')) {
        extWhereClause.externalWebinarId = webinarId.replace('ext_', '')
      }
    }

    if (status && status !== 'all') {
      extWhereClause.attended = status === 'attended'
    }

    // Only query external registrations when not filtering by an internal webinarId
    const shouldIncludeExternal = !webinarId || webinarId.startsWith('ext_')

    if (shouldIncludeExternal) {
      const externalRegs = await prisma.externalWebinarRegistration.findMany({
        where: extWhereClause,
        include: {
          externalWebinar: {
            select: {
              id: true,
              name: true,
              externalWebinarName: true,
              webinarDurationMinutes: true,
              mostlyAttendedThreshold: true,
            }
          }
        },
        orderBy: { registeredAt: 'desc' }
      })

      // Filter test users
      let filteredExtRegs = externalRegs.filter((reg: any) => {
        const name = reg.name || ''
        const email = reg.email || ''
        return !isTestUser(name, email)
      })

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase()
        filteredExtRegs = filteredExtRegs.filter((reg: any) =>
          reg.name?.toLowerCase().includes(searchLower) ||
          reg.email?.toLowerCase().includes(searchLower) ||
          reg.phone?.toLowerCase().includes(searchLower)
        )
      }

      const formatWatchTimeExt = (minutes: number) => {
        const totalSeconds = minutes * 60
        const hours = Math.floor(totalSeconds / 3600)
        const mins = Math.floor((totalSeconds % 3600) / 60)
        const secs = totalSeconds % 60
        if (hours > 0) {
          return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`
      }

      const externalAttendees = filteredExtRegs.map((reg: any) => {
        const ew = reg.externalWebinar
        const webinarDuration = ew?.webinarDurationMinutes || 60
        const watchTimeMinutes = reg.watchTimeMinutes || 0
        const watchTimeSeconds = watchTimeMinutes * 60
        const threshold = ew?.mostlyAttendedThreshold || 70
        const watchPercentage = webinarDuration > 0 ? (watchTimeMinutes / webinarDuration) * 100 : 0

        // Engagement score based on watch time
        let engagementScore = 0
        if (watchPercentage >= threshold) {
          engagementScore = 90 + Math.min(Math.floor(watchPercentage - threshold), 10)
        } else if (watchPercentage >= 50) {
          engagementScore = 70 + Math.floor((watchPercentage - 50) * 0.8)
        } else if (watchPercentage >= 20) {
          engagementScore = 40 + Math.floor((watchPercentage - 20) * 1.0)
        } else if (watchTimeMinutes > 0) {
          engagementScore = Math.floor(watchPercentage * 2)
        }

        // Determine webinar status
        let webinarStatus = 'Unknown'
        if (reg.scheduledStartTime) {
          const now = new Date()
          const scheduledStart = new Date(reg.scheduledStartTime)
          const scheduledEnd = new Date(scheduledStart.getTime() + webinarDuration * 60 * 1000)
          if (now < scheduledStart) {
            webinarStatus = 'Upcoming'
          } else if (now >= scheduledStart && now <= scheduledEnd) {
            webinarStatus = 'Currently Happening'
          } else {
            webinarStatus = reg.attended ? 'Attended' : 'No Show'
          }
        } else {
          webinarStatus = reg.attended ? 'Attended' : (watchTimeMinutes > 0 ? 'Attended' : 'No Show')
        }

        const leadPageName = reg.leadPageId ? leadPagesMap.get(reg.leadPageId) || null : null

        return {
          id: `ext_${reg.id}`,
          name: reg.name || 'Unknown',
          email: reg.email || 'Unknown',
          phone: reg.phone,
          timezone: reg.timezone,
          country: reg.country,
          webinarId: `ext_${ew?.id}`,
          webinarTitle: `${ew?.externalWebinarName || ew?.name || 'External Webinar'}`,
          registeredAt: reg.registeredAt,
          scheduledAt: reg.scheduledStartTime,
          webinarStatus,
          attended: reg.attended,
          joinedAt: reg.joinedAt,
          leftAt: reg.leftAt,
          lastSeenAt: null,
          engagementScore,
          gdprConsent: false,
          privacyConsent: reg.privacyConsent,
          marketingConsent: reg.marketingConsent,
          // Analytics fields
          registrationDevice: 'unknown',
          leadPageName,
          watchedReplay: false,
          replayWatchTime: 0,
          replayWatchTimeFormatted: '0:00',
          replayClickedCTA: false,
          replayDevice: null,
          totalWatchTime: watchTimeSeconds,
          totalWatchTimeFormatted: formatWatchTimeExt(watchTimeMinutes),
          lastWatchedPosition: watchTimeSeconds,
          lastWatchedPositionFormatted: formatWatchTimeExt(watchTimeMinutes),
          lastSessionDevice: null,
          lastSessionBrowser: null,
          lastSessionOS: null,
          totalEngagements: 0,
          sessionCount: reg.attended ? 1 : 0,
          // Offer analytics
          viewedOffer: false,
          clickedOffer: false,
          // Muted/Unmuted
          totalMutedTime: 0,
          totalUnmutedTime: 0,
          totalMutedTimeFormatted: '0:00',
          totalUnmutedTimeFormatted: '0:00',
          watchedMostlyMuted: false,
          // Purchase data
          hasPurchased: false,
          purchaseCount: 0,
          lastPurchaseAt: null,
          lastPurchaseAmount: null,
          lastPurchaseCurrency: null,
          lastPurchaseProduct: null,
          totalPurchaseAmount: 0,
          purchaseCurrency: null,
          // Sessions (none for external)
          sessions: [],
          // Extra: source indicator
          source: 'external',
          attendanceTag: reg.appliedTag || null,
        }
      })

      attendees.push(...externalAttendees)

      // Re-sort by registeredAt desc after merging
      attendees.sort((a: any, b: any) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
    }

    return NextResponse.json({ attendees }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    })
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
    const { id, attended, emailUnsubscribed } = body

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
    const updateData: Record<string, unknown> = {}
    if (typeof attended === 'boolean') {
      updateData.attended = attended
    }
    if (typeof emailUnsubscribed === 'boolean') {
      updateData.emailUnsubscribed = emailUnsubscribed
      updateData.emailUnsubscribedAt = emailUnsubscribed ? new Date() : null
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: updateData
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

// DELETE /api/attendees - Delete one or more attendees
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No attendee IDs provided' }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete registrations and their related data
    // Prisma will cascade delete related records (sessions, sales, etc.)
    const deleted = await prisma.registration.deleteMany({
      where: {
        id: { in: ids }
      }
    })

    return NextResponse.json({ 
      success: true, 
      deleted: deleted.count,
      message: `Successfully deleted ${deleted.count} attendee(s)`
    })
  } catch (error) {
    console.error('Error deleting attendees:', error)
    return NextResponse.json(
      { error: 'Failed to delete attendees' },
      { status: 500 }
    )
  }
}
