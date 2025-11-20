import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const webinarId = searchParams.get('webinarId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const whereClause: any = {
      referredBy: { not: null }
    }

    if (webinarId && webinarId !== 'all') {
      whereClause.webinarId = webinarId
    }

    if (startDate) {
      whereClause.registeredAt = { ...whereClause.registeredAt, gte: new Date(startDate) }
    }

    if (endDate) {
      whereClause.registeredAt = { ...whereClause.registeredAt, lte: new Date(endDate) }
    }

    // Get all referred registrations with details
    const referredRegistrations = await prisma.registration.findMany({
      where: whereClause,
      include: {
        referredByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            referralCode: true,
          }
        },
        webinar: {
          select: {
            id: true,
            title: true,
          }
        },
        pageVisits: {
          where: {
            pageType: { in: ['registration', 'embed-inline', 'embed-popup'] }
          }
        },
        sales: true
      }
    })

    // Calculate metrics
    const totalReferred = referredRegistrations.length
    const referredAttended = referredRegistrations.filter((r: any) => r.attended).length
    const referredPurchased = referredRegistrations.filter((r: any) => r.sales && r.sales.length > 0).length
    
    // Count unique page views for referred people
    const referredWithViews = referredRegistrations.filter((r: any) => r.pageVisits && r.pageVisits.length > 0).length

    // Calculate percentages
    const regRate = totalReferred > 0 ? 100 : 0 // They're all registrations, so 100%
    const attendanceRate = totalReferred > 0 ? (referredAttended / totalReferred * 100) : 0
    const salesRate = totalReferred > 0 ? (referredPurchased / totalReferred * 100) : 0

    // Group by referrer
    const referrerStats = new Map<string, {
      referrerId: string
      referrerName: string
      referrerEmail: string
      referralCode: string
      totalReferred: number
      attended: number
      purchased: number
      uniqueViews: number
    }>()

    referredRegistrations.forEach((reg: any) => {
      if (!reg.referredByUser) return

      const key = reg.referredByUser.referralCode
      if (!referrerStats.has(key)) {
        referrerStats.set(key, {
          referrerId: reg.referredByUser.id,
          referrerName: reg.referredByUser.name || 'Unknown',
          referrerEmail: reg.referredByUser.email || 'Unknown',
          referralCode: reg.referredByUser.referralCode!,
          totalReferred: 0,
          attended: 0,
          purchased: 0,
          uniqueViews: 0
        })
      }

      const stats = referrerStats.get(key)!
      stats.totalReferred++
      if (reg.attended) stats.attended++
      if (reg.sales && reg.sales.length > 0) stats.purchased++
      if (reg.pageVisits && reg.pageVisits.length > 0) stats.uniqueViews++
    })

    // Convert to array and sort by total referred
    const referrers = Array.from(referrerStats.values()).sort((a, b) => b.totalReferred - a.totalReferred)

    // Get active referrers (those who have referred at least 1 person)
    const activeReferrers = referrers.length

    // Get total referred across all referrers
    const totalReferredByActiveReferrers = referrers.reduce((sum, r) => sum + r.totalReferred, 0)
    const totalPurchasedByReferred = referrers.reduce((sum, r) => sum + r.purchased, 0)
    const totalAttendedByReferred = referrers.reduce((sum, r) => sum + r.attended, 0)

    return NextResponse.json({
      summary: {
        activeReferrers,
        totalReferred: totalReferredByActiveReferrers,
        totalAttended: totalAttendedByReferred,
        totalPurchased: totalPurchasedByReferred,
        uniqueViews: referredWithViews,
        regRate: regRate.toFixed(2),
        attendanceRate: attendanceRate.toFixed(2),
        salesRate: salesRate.toFixed(2)
      },
      referrers
    })
  } catch (error) {
    console.error('Error fetching referral analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referral analytics' },
      { status: 500 }
    )
  }
}
