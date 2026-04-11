import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cancelPendingSendsForTemplate } from '@/lib/emailScheduler'

// POST /api/webinars/[id]/cancel-sends
// Cancel all pending sends for a specific template
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { templateId, type } = body as {
    templateId: string
    type: 'reminder' | 'followup'
  }

  if (!templateId || !type) {
    return NextResponse.json(
      { error: 'templateId and type are required' },
      { status: 400 }
    )
  }

  if (!['reminder', 'followup'].includes(type)) {
    return NextResponse.json(
      { error: 'type must be "reminder" or "followup"' },
      { status: 400 }
    )
  }

  try {
    const result = await cancelPendingSendsForTemplate(templateId, type)
    return NextResponse.json({ ok: true, cancelled: result.count })
  } catch (err: any) {
    console.error('Cancel sends error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to cancel sends' },
      { status: 500 }
    )
  }
}
