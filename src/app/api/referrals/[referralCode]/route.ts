import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { referralCode: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the referrer
    const referrer = await prisma.registration.findUnique({
      where: { referralCode: params.referralCode },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        registeredAt: true,
        webinar: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!referrer) {
      return NextResponse.json({ error: 'Referrer not found' }, { status: 404 })
    }

    // Get all people referred by this person
    const referrals = await prisma.registration.findMany({
      where: {
        referredBy: params.referralCode
      },
      include: {
        webinar: {
          select: {
            id: true,
            title: true
          }
        },
        sales: true,
        pageVisits: {
          where: {
            pageType: { in: ['registration', 'embed-inline', 'embed-popup'] }
          }
        }
      },
      orderBy: {
        registeredAt: 'desc'
      }
    })

    // Calculate stats
    const totalReferred = referrals.length
    const attended = referrals.filter((r: any) => r.attended).length
    const purchased = referrals.filter((r: any) => r.sales && r.sales.length > 0).length
    const withViews = referrals.filter((r: any) => r.pageVisits && r.pageVisits.length > 0).length

    // Format referrals for response
    const formattedReferrals = referrals.map((r: any) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      webinarTitle: r.webinar.title,
      registeredAt: r.registeredAt,
      attended: r.attended,
      hasPurchased: r.sales && r.sales.length > 0,
      hasViewed: r.pageVisits && r.pageVisits.length > 0
    }))

    return NextResponse.json({
      referrer: {
        name: referrer.name,
        email: referrer.email,
        referralCode: referrer.referralCode,
        registeredAt: referrer.registeredAt,
        webinarTitle: referrer.webinar.title
      },
      stats: {
        totalReferred,
        attended,
        purchased,
        withViews,
        attendanceRate: totalReferred > 0 ? ((attended / totalReferred) * 100).toFixed(2) : '0',
        salesRate: totalReferred > 0 ? ((purchased / totalReferred) * 100).toFixed(2) : '0'
      },
      referrals: formattedReferrals
    })
  } catch (error) {
    console.error('Error fetching referrer details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referrer details' },
      { status: 500 }
    )
  }
}
