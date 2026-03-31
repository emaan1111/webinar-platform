import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requestFacebookInsights } from '@/lib/facebookAds'

const generateMockMetrics = (from: string, to: string, engagementThreshold: number) => {
  const startDate = new Date(from)
  const endDate = new Date(to)
  const daysDiff =
    Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    )

  const metrics = []

  for (let i = 0; i < daysDiff; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    const dateKey = currentDate.toISOString().split('T')[0]

    const baseRegistrations = 140 + Math.sin(i / 2) * 40
    const registrations = Math.max(20, Math.round(baseRegistrations))
    const attendanceRate = 0.65 + (Math.cos(i / 3) * 5) / 100
    const engagementRate = 0.45 + (Math.sin(i / 4) * 4) / 100

    const attended = Math.round(registrations * attendanceRate)
    const engaged = Math.max(
      0,
      Math.min(attended, Math.round(attended * engagementRate))
    )
    const spend = Math.round((registrations * 4.2 + Math.sin(i) * 30) * 100) / 100
    const costPerReg = registrations > 0 ? spend / registrations : 0
    const avgWatchTime =
      attended > 0 ? Math.round((engagementThreshold + 15 + Math.cos(i) * 5) * 10) / 10 : 0

    metrics.push({
      date: dateKey,
      registrations,
      attended,
      engaged,
      spend: parseFloat(spend.toFixed(2)),
      costPerReg: parseFloat(costPerReg.toFixed(2)),
      attendanceRate: parseFloat((attendanceRate * 100).toFixed(1)),
      engagementRate: parseFloat(
        (attended > 0 ? (engaged / attended) * 100 : 0).toFixed(1)
      ),
      avgWatchTime
    })
  }

  return metrics
}

const mockResponse = (
  from: string,
  to: string,
  engagementThreshold: number,
  reason: string,
  startTime: number
) =>
  NextResponse.json({
    success: true,
    metrics: generateMockMetrics(from, to, engagementThreshold),
    dateRange: { from, to },
    engagementThreshold,
    timestamp: new Date().toISOString(),
    isMockData: true,
    warning: reason,
    processingTime: Date.now() - startTime
  })

/**
 * GET /api/reports/charts
 * Fetch daily metrics for reports charts: registrations, attendance, engagement
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const engagementThreshold = parseInt(searchParams.get('engagementThreshold') || '30')
    const webinarIdsParam = searchParams.get('webinarIds')
    const webinarIds = webinarIdsParam
      ? webinarIdsParam.split(',').map(id => id.trim()).filter(Boolean)
      : []

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Date range required (from and to parameters)' },
        { status: 400 }
      )
    }

    console.log('📊 Fetching reports chart data from', from, 'to', to)

    const fromDate = new Date(from)
    const toDate = new Date(to)
    toDate.setHours(23, 59, 59, 999)

    // Fetch all registrations
    const registrations = await prisma.registration.findMany({
      where: {
        registeredAt: {
          gte: fromDate,
          lte: toDate
        },
        ...(webinarIds.length
          ? {
              webinarId: {
                in: webinarIds
              }
            }
          : {})
      },
      select: {
        id: true,
        email: true,
        webinarId: true,
        registeredAt: true
      }
    })

    if (registrations.length === 0) {
      console.warn('⚠️  No registrations in range, returning mock report metrics')
      return mockResponse(
        from,
        to,
        engagementThreshold,
        'No registration data found for selected range. Showing sample metrics.',
        startTime
      )
    }

    // Fetch all sessions for these registrations
    const registrationIds = registrations.map(r => r.id)
    const sessions = await prisma.attendeeSession.findMany({
      where: {
        registrationId: { in: registrationIds }
      },
      select: {
        registrationId: true,
        webinarId: true,
        totalWatchTime: true
      }
    })

    // Fetch FB ad spend per day
    const accessToken = process.env.FB_ACCESS_TOKEN
    const adAccountId = process.env.FB_AD_ACCOUNT_ID || 'act_280500016006811'
    
    let fbSpendByDate: Record<string, number> = {}
    
    if (accessToken) {
      try {
        const timeRange = encodeURIComponent(JSON.stringify({ since: from, until: to }))
        const url = `https://graph.facebook.com/v22.0/${adAccountId}/insights?fields=spend&time_range=${timeRange}&time_increment=1&access_token=${accessToken.trim()}`
        
        const response = await requestFacebookInsights(url)
        
        if (response.ok) {
          const data = response.data
          data.data?.forEach((day: any) => {
            fbSpendByDate[day.date_start] = parseFloat(day.spend || 0)
          })
        }
      } catch (error) {
        console.warn('⚠️  Could not fetch FB ad spend, using 0')
      }
    }

    // Group data by date
    const metricsByDate: Record<string, any> = {}

    // Process registrations
    registrations.forEach(reg => {
      const dateKey = reg.registeredAt.toISOString().split('T')[0]
      
      if (!metricsByDate[dateKey]) {
        metricsByDate[dateKey] = {
          date: dateKey,
          registrations: 0,
          attended: 0,
          totalWatchTime: 0,
          engaged: 0,
          spend: fbSpendByDate[dateKey] || 0
        }
      }

      metricsByDate[dateKey].registrations++

      // Check attendance from sessions
      const userSessions = sessions.filter((s: any) => 
        s.registrationId === reg.id
      )
      
      if (userSessions.length > 0) {
        metricsByDate[dateKey].attended++
        
        // Calculate total watch time (convert seconds to minutes)
        const totalWatch = userSessions.reduce((sum: number, session: any) => {
          return sum + ((session.totalWatchTime || 0) / 60)
        }, 0)
        
        metricsByDate[dateKey].totalWatchTime += totalWatch
        
        // Check if engaged (watched > threshold minutes)
        if (totalWatch >= engagementThreshold) {
          metricsByDate[dateKey].engaged++
        }
      }
    })

    // Convert to array and calculate metrics
    const metrics = Object.values(metricsByDate).map((day: any) => {
      const costPerReg = day.registrations > 0 ? day.spend / day.registrations : 0
      const attendanceRate = day.registrations > 0 ? (day.attended / day.registrations) * 100 : 0
      const engagementRate = day.attended > 0 ? (day.engaged / day.attended) * 100 : 0
      const avgWatchTime = day.attended > 0 ? day.totalWatchTime / day.attended : 0

      return {
        date: day.date,
        registrations: day.registrations,
        attended: day.attended,
        engaged: day.engaged,
        spend: day.spend,
        costPerReg: parseFloat(costPerReg.toFixed(2)),
        attendanceRate: parseFloat(attendanceRate.toFixed(1)),
        engagementRate: parseFloat(engagementRate.toFixed(1)),
        avgWatchTime: parseFloat(avgWatchTime.toFixed(1))
      }
    }).sort((a, b) => a.date.localeCompare(b.date))

    if (metrics.length === 0) {
      console.warn('⚠️  Calculated metrics empty, returning mock data')
      return mockResponse(
        from,
        to,
        engagementThreshold,
        'No reporting data available. Showing sample metrics.',
        startTime
      )
    }

    console.log(`✅ Retrieved ${metrics.length} days of reports data`)
    
    const totalTime = Date.now() - startTime
    console.log(`🏁 Total request time: ${totalTime}ms`)

    return NextResponse.json({
      success: true,
      metrics,
      dateRange: { from, to },
      engagementThreshold,
      timestamp: new Date().toISOString(),
      processingTime: totalTime
    })

  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`❌ Error fetching reports chart data after ${totalTime}ms:`, error)
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.name : 'unknown',
      processingTime: totalTime
    }, { status: 500 })
  }
}
