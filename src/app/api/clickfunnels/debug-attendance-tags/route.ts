import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  tagClickFunnelsContact,
  getOrCreateClickFunnelsTagId 
} from '@/lib/clickfunnels'
import { applyAttendanceTagOnSessionEnd } from '@/lib/clickfunnelsAttendanceTags'

/**
 * POST /api/clickfunnels/debug-attendance-tags
 * 
 * Debug endpoint to test attendance tag application
 * 
 * Body options:
 * - { email: 'test@example.com', tagName: 'UM-Webinar-Attended' } - Test specific tag
 * - { registrationId: 'xxx' } - Debug a specific registration
 * - { registrationId: 'xxx', apply: true } - Actually apply tags to a registration
 * - { listTags: true } - List all tags in the system
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
    const { email, tagName, registrationId, listTags, testLookup, apply } = body

    // Actually apply attendance tags to a registration
    if (registrationId && apply) {
      console.log(`🧪 DEBUG: Manually applying attendance tags for registration ${registrationId}`)
      
      const result = await applyAttendanceTagOnSessionEnd({ registrationId })
      
      return NextResponse.json({
        message: result.success 
          ? `Successfully applied tag: ${result.tag}` 
          : `Failed: ${result.error}`,
        ...result
      })
    }

    // Test tag lookup only
    if (testLookup && tagName) {
      console.log(`🔍 Testing tag lookup for: "${tagName}"`)
      const tagId = await getOrCreateClickFunnelsTagId(tagName)
      return NextResponse.json({
        success: !!tagId,
        tagName,
        tagId,
        message: tagId 
          ? `Tag "${tagName}" resolved to ID: ${tagId}`
          : `Failed to resolve tag "${tagName}"`
      })
    }

    // Test applying a tag to an email
    if (email && tagName) {
      console.log(`🧪 Testing tag application: "${tagName}" to ${email}`)
      
      // First try to resolve the tag
      const tagId = await getOrCreateClickFunnelsTagId(tagName)
      console.log(`📋 Tag resolution result: ${tagId}`)
      
      if (!tagId) {
        return NextResponse.json({
          success: false,
          error: 'Failed to resolve tag ID',
          details: {
            tagName,
            email,
            tagIdResolved: false
          }
        })
      }

      // Now try to apply the tag
      const success = await tagClickFunnelsContact(email, [tagId])
      
      return NextResponse.json({
        success,
        details: {
          tagName,
          tagId,
          email,
          applied: success
        },
        message: success 
          ? `Successfully applied tag "${tagName}" (ID: ${tagId}) to ${email}`
          : `Failed to apply tag "${tagName}" (ID: ${tagId}) to ${email}`
      })
    }

    // Debug a specific registration
    if (registrationId) {
      const registration = await prisma.registration.findUnique({
        where: { id: registrationId },
        include: {
          webinar: {
            select: {
              id: true,
              title: true,
              duration: true,
              mostlyAttendedThreshold: true,
              registrationTag: true,
              registrationTagId: true,
              attendedTag: true,
              attendedTagId: true,
              mostlyAttendedTag: true,
              mostlyAttendedTagId: true,
              partlyAttendedTag: true,
              partlyAttendedTagId: true,
              missedTag: true,
              missedTagId: true,
              replayAttendedTag: true,
              replayAttendedTagId: true,
            }
          },
          sessions: {
            select: {
              id: true,
              watchDuration: true,
              totalWatchTime: true
            }
          }
        }
      })

      if (!registration) {
        return NextResponse.json(
          { error: 'Registration not found' },
          { status: 404 }
        )
      }

      // Calculate watch time
      const sessionWatchTime = registration.sessions.reduce((sum, s) => 
        sum + (s.watchDuration || s.totalWatchTime || 0), 0)
      const effectiveWatchTime = Math.max(
        sessionWatchTime,
        registration.replayWatchTime || 0,
        registration.lastWatchedPosition || 0
      )

      // Determine which tag should apply
      let expectedTag = 'MISSED'
      let expectedTagName = registration.webinar.missedTag || 'UM-Webinar-Missed'
      let expectedTagId = registration.webinar.missedTagId

      if (registration.attended) {
        const threshold = registration.webinar.mostlyAttendedThreshold
        if (threshold && effectiveWatchTime >= threshold) {
          expectedTag = 'MOSTLY_ATTENDED'
          expectedTagName = registration.webinar.mostlyAttendedTag || 'UM-WebinarMostlyAttended'
          expectedTagId = registration.webinar.mostlyAttendedTagId
        } else if (threshold && effectiveWatchTime > 0) {
          expectedTag = 'PARTLY_ATTENDED'
          expectedTagName = registration.webinar.partlyAttendedTag || 'UM-Webinar-PartlyAttended'
          expectedTagId = registration.webinar.partlyAttendedTagId
        } else {
          expectedTag = 'ATTENDED'
          expectedTagName = registration.webinar.attendedTag || 'UM-Webinar-Attended'
          expectedTagId = registration.webinar.attendedTagId
        }
      }

      // Try to resolve the expected tag
      const resolvedTagId = await getOrCreateClickFunnelsTagId(expectedTagName)

      return NextResponse.json({
        registration: {
          id: registration.id,
          email: registration.email,
          name: registration.name,
          attended: registration.attended,
          attendanceTagsApplied: registration.attendanceTagsApplied,
          attendanceTagsAppliedAt: registration.attendanceTagsAppliedAt
        },
        watchTime: {
          sessionWatchTime,
          replayWatchTime: registration.replayWatchTime,
          lastWatchedPosition: registration.lastWatchedPosition,
          effectiveWatchTime
        },
        webinar: {
          id: registration.webinar.id,
          title: registration.webinar.title,
          duration: registration.webinar.duration,
          mostlyAttendedThreshold: registration.webinar.mostlyAttendedThreshold,
          tags: {
            registrationTag: registration.webinar.registrationTag,
            registrationTagId: registration.webinar.registrationTagId,
            attendedTag: registration.webinar.attendedTag,
            attendedTagId: registration.webinar.attendedTagId,
            mostlyAttendedTag: registration.webinar.mostlyAttendedTag,
            mostlyAttendedTagId: registration.webinar.mostlyAttendedTagId,
            partlyAttendedTag: registration.webinar.partlyAttendedTag,
            partlyAttendedTagId: registration.webinar.partlyAttendedTagId,
            missedTag: registration.webinar.missedTag,
            missedTagId: registration.webinar.missedTagId,
          }
        },
        expectedTag: {
          tagKey: expectedTag,
          tagName: expectedTagName,
          configuredTagId: expectedTagId,
          resolvedTagId,
          tagResolutionSuccess: !!resolvedTagId
        },
        envVars: {
          CLICKFUNNELS_API_KEY: !!process.env.CLICKFUNNELS_API_KEY,
          CLICKFUNNELS_WORKSPACE_ID: !!process.env.CLICKFUNNELS_WORKSPACE_ID,
          CLICKFUNNELS_TAG_ATTENDED: process.env.CLICKFUNNELS_TAG_ATTENDED || null,
          CLICKFUNNELS_TAG_MOSTLY_ATTENDED: process.env.CLICKFUNNELS_TAG_MOSTLY_ATTENDED || null,
          CLICKFUNNELS_TAG_PARTLY_ATTENDED: process.env.CLICKFUNNELS_TAG_PARTLY_ATTENDED || null,
          CLICKFUNNELS_TAG_MISSED: process.env.CLICKFUNNELS_TAG_MISSED || null,
          CLICKFUNNELS_TAG_REPLAY_ATTENDED: process.env.CLICKFUNNELS_TAG_REPLAY_ATTENDED || null,
        }
      })
    }

    return NextResponse.json(
      { 
        error: 'Invalid request',
        usage: {
          'Test tag lookup': { testLookup: true, tagName: 'UM-Webinar-Attended' },
          'Test tag application': { email: 'test@example.com', tagName: 'UM-Webinar-Attended' },
          'Debug registration': { registrationId: 'xxx' },
          'Apply tags to registration': { registrationId: 'xxx', apply: true }
        }
      },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ Debug endpoint error:', error)
    return NextResponse.json(
      { 
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
