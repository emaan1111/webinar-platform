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
      minutesBefore,
      channel,
      emailSubject,
      emailBody,
      smsBody,
      isActive,
      applyClickFunnelsTag,
      clickFunnelsTag
    } = body

    const minutesBeforeNumber =
      typeof minutesBefore === 'number'
        ? minutesBefore
        : Number(minutesBefore)

    // Validation
    if (
      Number.isNaN(minutesBeforeNumber) ||
      emailSubject?.trim()?.length === 0 ||
      emailBody?.trim()?.length === 0
    ) {
      return NextResponse.json(
        { error: 'minutesBefore, emailSubject, and emailBody are required' },
        { status: 400 }
      )
    }

    if (applyClickFunnelsTag && !clickFunnelsTag) {
      return NextResponse.json(
        { error: 'clickFunnelsTag is required when applyClickFunnelsTag is enabled' },
        { status: 400 }
      )
    }

    const template = await createReminderTemplate(id, {
      minutesBefore: minutesBeforeNumber,
      channel: channel || 'EMAIL',
      emailSubject,
      emailBody,
      smsBody,
      isActive: typeof isActive === 'boolean' ? isActive : true,
      applyClickFunnelsTag: Boolean(applyClickFunnelsTag),
      clickFunnelsTag: clickFunnelsTag ? String(clickFunnelsTag).toUpperCase() : null
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error: any) {
    console.error('Error creating reminder template:', error)
    return NextResponse.json(
      { error: 'Failed to create reminder template', details: error.message },
      { status: 500 }
    )
  }
}
