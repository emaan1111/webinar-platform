import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Join data for the external countdown page.
 * GET /api/external-webinars/[id]/join?reg=<registrationId>
 *
 * Returns the registrant's start time + captured live room link so the countdown page can
 * count down and auto-enter the room. The registration id is an unguessable cuid (capability).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const regId = searchParams.get('reg')
    if (!regId) {
      return NextResponse.json({ error: 'Missing reg' }, { status: 400 })
    }

    const reg = await prisma.externalWebinarRegistration.findFirst({
      where: { id: regId, externalWebinarId: params.id },
      select: {
        scheduledStartTime: true,
        liveRoomUrl: true,
        name: true,
        externalWebinar: { select: { externalWebinarName: true, name: true } },
      },
    })

    if (!reg) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    return NextResponse.json({
      startTime: reg.scheduledStartTime ? reg.scheduledStartTime.toISOString() : null,
      liveRoomUrl: reg.liveRoomUrl || null,
      name: reg.name,
      webinarName: reg.externalWebinar?.externalWebinarName || reg.externalWebinar?.name || 'your webinar',
    })
  } catch (error) {
    console.error('External join data error:', error)
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 })
  }
}
