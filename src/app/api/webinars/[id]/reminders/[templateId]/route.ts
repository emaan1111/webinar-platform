import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateReminderTemplate, deleteReminderTemplate } from '@/lib/reminders'

// PATCH /api/webinars/[id]/reminders/[templateId] - Update a reminder template
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { templateId } = params
    const body = await request.json()
    const updateData = { ...body }

    if (body.watchTargetType) {
      if (
        body.watchTargetType === 'WATCHED_UP_TO' ||
        body.watchTargetType === 'WATCHED_AT_LEAST'
      ) {
        const parsedWatchSeconds =
          typeof body.watchTargetSeconds === 'number'
            ? Math.round(body.watchTargetSeconds)
            : Math.round(Number(body.watchTargetSeconds))

        if (
          Number.isNaN(parsedWatchSeconds) ||
          parsedWatchSeconds <= 0
        ) {
          return NextResponse.json(
            { error: 'watchTargetSeconds must be provided for this targeting mode' },
            { status: 400 }
          )
        }

        updateData.watchTargetSeconds = parsedWatchSeconds
      } else {
        updateData.watchTargetType = 'ANY'
        updateData.watchTargetSeconds = null
      }
    }

    const template = await updateReminderTemplate(templateId, updateData)

    return NextResponse.json(template)
  } catch (error: any) {
    console.error('Error updating reminder template:', error)
    return NextResponse.json(
      { error: 'Failed to update reminder template', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/webinars/[id]/reminders/[templateId] - Delete a reminder template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { templateId } = params

    await deleteReminderTemplate(templateId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting reminder template:', error)
    return NextResponse.json(
      { error: 'Failed to delete reminder template', details: error.message },
      { status: 500 }
    )
  }
}
