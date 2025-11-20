import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { applyAttendanceTagsForWebinar } from '@/lib/clickfunnelsAttendanceTags'

/**
 * POST /api/cron/process-attendance-tags
 * 
 * Cron job that automatically applies attendance tags to ClickFunnels contacts
 * after webinars end.
 * 
 * Runs every hour to check for:
 * - Webinars that recently ended (status: COMPLETED)
 * - Webinars that are still marked as LIVE but the scheduled time has passed
 * - Applies attendance tags based on actual watch time
 * 
 * Protected by CRON_SECRET environment variable
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('❌ CRON_SECRET not configured')
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ Invalid cron secret')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('\n🔄 Starting attendance tagging cron job...')

    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Find webinars that:
    // 1. Are COMPLETED and haven't had tags applied yet
    // 2. Or are LIVE but scheduled time is more than 3 hours ago (likely ended but not marked complete)
    const webinarsToProcess = await prisma.webinar.findMany({
      where: {
        OR: [
          {
            // Completed webinars
            status: 'COMPLETED',
            attendanceTagsApplied: false
          },
          {
            // Live webinars that likely ended (scheduled time was 3+ hours ago)
            status: 'LIVE',
            attendanceTagsApplied: false,
            scheduledStartTime: {
              lte: new Date(now.getTime() - 3 * 60 * 60 * 1000)
            }
          }
        ],
        duration: {
          not: null
        }
      },
      select: {
        id: true,
        title: true,
        status: true,
        scheduledStartTime: true,
        duration: true,
        _count: {
          select: {
            registrations: true
          }
        }
      }
    })

    if (webinarsToProcess.length === 0) {
      console.log('✅ No webinars need attendance tagging')
      return NextResponse.json({
        success: true,
        message: 'No webinars to process',
        processed: 0
      })
    }

    console.log(`📊 Found ${webinarsToProcess.length} webinar(s) to process`)

    let totalTagged = 0
    let totalErrors = 0
    const results = []

    for (const webinar of webinarsToProcess) {
      console.log(`\n🎯 Processing: ${webinar.title}`)
      console.log(`   Status: ${webinar.status}`)
      console.log(`   Registrations: ${webinar._count.registrations}`)

      try {
        // Apply attendance tags for this webinar
        const result = await applyAttendanceTagsForWebinar(webinar.id)

        totalTagged += result.tagged
        totalErrors += result.errors

        // Mark this webinar as having tags applied
        await prisma.webinar.update({
          where: { id: webinar.id },
          data: { 
            attendanceTagsApplied: true,
            attendanceTagsAppliedAt: new Date()
          }
        })

        results.push({
          webinarId: webinar.id,
          webinarTitle: webinar.title,
          success: true,
          tagged: result.tagged,
          errors: result.errors
        })

        console.log(`✅ Successfully processed ${webinar.title}`)
        console.log(`   Tagged: ${result.tagged}, Errors: ${result.errors}`)

      } catch (error) {
        console.error(`❌ Error processing ${webinar.title}:`, error)
        
        results.push({
          webinarId: webinar.id,
          webinarTitle: webinar.title,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }

      // Add delay between webinars to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n✅ Attendance tagging cron job completed')
    console.log(`   Webinars processed: ${webinarsToProcess.length}`)
    console.log(`   Total tagged: ${totalTagged}`)
    console.log(`   Total errors: ${totalErrors}`)

    return NextResponse.json({
      success: true,
      message: `Processed ${webinarsToProcess.length} webinar(s)`,
      webinarsProcessed: webinarsToProcess.length,
      totalTagged,
      totalErrors,
      results
    })

  } catch (error) {
    console.error('❌ Attendance tagging cron job failed:', error)
    return NextResponse.json(
      { 
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
