import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  applyAttendanceTagsForWebinar, 
  applyAttendanceTagsForAllCompletedWebinars 
} from '@/lib/clickfunnelsAttendanceTags'

/**
 * POST /api/clickfunnels/apply-attendance-tags
 * 
 * Manually trigger attendance tag application for webinars
 * 
 * Body options:
 * - { webinarId: 'xxx' } - Apply tags for a specific webinar
 * - { all: true } - Apply tags for all completed webinars
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { webinarId, all } = body

    // Apply tags for all webinars
    if (all === true) {
      console.log('📊 Applying attendance tags for all completed webinars...')
      
      const result = await applyAttendanceTagsForAllCompletedWebinars()
      
      return NextResponse.json({
        message: `Applied attendance tags for ${result.webinarsProcessed} webinars`,
        ...result
      })
    }

    // Apply tags for specific webinar
    if (webinarId) {
      console.log(`📊 Applying attendance tags for webinar ${webinarId}...`)
      
      const result = await applyAttendanceTagsForWebinar(webinarId)
      
      return NextResponse.json({
        message: `Applied ${result.tagged} attendance tags, ${result.errors} errors`,
        ...result
      })
    }

    return NextResponse.json(
      { error: 'Please provide either webinarId or all: true' },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ Error applying attendance tags:', error)
    return NextResponse.json(
      { 
        error: 'Failed to apply attendance tags',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
