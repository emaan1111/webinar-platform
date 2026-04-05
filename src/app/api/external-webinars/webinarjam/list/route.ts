import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listWebinars, isWebinarJamConfigured } from '@/lib/webinarjam'

/**
 * WebinarJam API - List available webinars for connection
 * 
 * GET /api/external-webinars/webinarjam/list
 * 
 * Returns list of webinars from WebinarJam account for selection
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if API is configured
    if (!isWebinarJamConfigured()) {
      return NextResponse.json({
        configured: false,
        error: 'WebinarJam API not configured',
        hint: 'Add WEBINARJAM_API_KEY to your .env file',
        webinars: []
      })
    }

    // Get platform from query params
    const { searchParams } = new URL(request.url)
    const platform = (searchParams.get('platform') || 'webinarjam') as 'webinarjam' | 'everwebinar'

    const webinars = await listWebinars(platform)

    return NextResponse.json({
      configured: true,
      platform,
      webinars: webinars.map(w => ({
        id: String(w.webinar_id),
        name: w.name,
        description: w.description,
        schedules: w.schedules?.map(s => ({
          id: String(s.schedule),
          date: s.date,
          time: s.time,
          timezone: s.timezone,
        })) || []
      }))
    })
  } catch (error) {
    console.error('Error listing WebinarJam webinars:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webinars from WebinarJam' },
      { status: 500 }
    )
  }
}
