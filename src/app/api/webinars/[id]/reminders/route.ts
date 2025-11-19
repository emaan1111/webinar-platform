import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  createReminderTemplate,
  getWebinarReminderTemplates,
  updateReminderTemplate,
  deleteReminderTemplate
} from '@/lib/reminders'

// GET /api/webinars/[id]/reminders - Get all reminder templates for a webinar
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const templates = await getWebinarReminderTemplates(id)

    return NextResponse.json({ reminders: templates })
  } catch (error: any) {
    console.error('Error fetching reminder templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reminder templates', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/webinars/[id]/reminders - Create a new reminder template
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    const {
      type,
      minutesBefore,
      minutesAfter,
      minWatchedMinutes,
      minWatchedPercentage,
      channel,
      emailSubject,
      emailBody,
      smsBody,
      isActive,
      applyClickFunnelsTag,
      clickFunnelsTag
    } = body

    const reminderType = type || 'pre_webinar'

    // Type-specific validation
    if (reminderType === 'pre_webinar') {
      const minutesBeforeNumber =
        typeof minutesBefore === 'number'
          ? minutesBefore
          : Number(minutesBefore)

      if (Number.isNaN(minutesBeforeNumber)) {
        return NextResponse.json(
          { error: 'minutesBefore is required for pre-webinar reminders' },
          { status: 400 }
        )
      }

      // For pre-webinar, validate based on channel
      if (channel === 'EMAIL' || channel === 'BOTH') {
        if (!emailSubject?.trim() || !emailBody?.trim()) {
          return NextResponse.json(
            { error: 'emailSubject and emailBody are required when sending emails' },
            { status: 400 }
          )
        }
      }

      if (channel === 'SMS' || channel === 'BOTH') {
        if (!smsBody?.trim()) {
          return NextResponse.json(
            { error: 'smsBody is required when sending SMS' },
            { status: 400 }
          )
        }
      }
    } else if (reminderType === 'post_webinar') {
      const minutesAfterNumber =
        typeof minutesAfter === 'number'
          ? minutesAfter
          : Number(minutesAfter)

      if (Number.isNaN(minutesAfterNumber)) {
        return NextResponse.json(
          { error: 'minutesAfter is required for post-session reminders' },
          { status: 400 }
        )
      }

      if (!minWatchedMinutes && !minWatchedPercentage) {
        return NextResponse.json(
          { error: 'Either minWatchedMinutes or minWatchedPercentage is required for post-session reminders' },
          { status: 400 }
        )
      }

      // For post-session, validate based on channel
      if (channel === 'EMAIL' || channel === 'BOTH') {
        if (!emailSubject?.trim() || !emailBody?.trim()) {
          return NextResponse.json(
            { error: 'emailSubject and emailBody are required when sending emails' },
            { status: 400 }
          )
        }
      }

      if (channel === 'SMS' || channel === 'BOTH') {
        if (!smsBody?.trim()) {
          return NextResponse.json(
            { error: 'smsBody is required when sending SMS' },
            { status: 400 }
          )
        }
      }
    }

    if (applyClickFunnelsTag && !clickFunnelsTag) {
      return NextResponse.json(
        { error: 'clickFunnelsTag is required when applyClickFunnelsTag is enabled' },
        { status: 400 }
      )
    }

    // Prepare data based on type
    const templateData: any = {
      channel: channel || 'EMAIL',
      emailSubject: emailSubject || null,
      emailBody: emailBody || null,
      smsBody: smsBody || null,
      isActive: typeof isActive === 'boolean' ? isActive : true,
      applyClickFunnelsTag: Boolean(applyClickFunnelsTag),
      clickFunnelsTag: clickFunnelsTag ? String(clickFunnelsTag).toUpperCase() : null,
      type: reminderType
    }

    if (reminderType === 'pre_webinar') {
      templateData.minutesBefore = typeof minutesBefore === 'number' ? minutesBefore : Number(minutesBefore)
    } else if (reminderType === 'post_webinar') {
      templateData.minutesAfter = typeof minutesAfter === 'number' ? minutesAfter : Number(minutesAfter)
      templateData.minWatchedMinutes = minWatchedMinutes || null
      templateData.minWatchedPercentage = minWatchedPercentage || null
    }

    const template = await createReminderTemplate(id, templateData)

    return NextResponse.json(template, { status: 201 })
  } catch (error: any) {
    console.error('Error creating reminder template:', error)
    return NextResponse.json(
      { error: 'Failed to create reminder template', details: error.message },
      { status: 500 }
    )
  }
}
