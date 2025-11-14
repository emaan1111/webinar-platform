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

    const template = await updateReminderTemplate(templateId, body)

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
