import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }
    
    const { searchParams } = new URL(request.url)
    const webinarId = searchParams.get('webinarId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const ids = searchParams.get('ids')

    const whereClause: any = {
      registration: {
        is: {
          webinar: {
            is: {
              hostId: user.id
            }
          }
        }
      }
    }
    
    if (ids) {
      const idsArray = ids.split(',').filter(Boolean)
      if (idsArray.length > 0) {
        whereClause.registrationId = { in: idsArray }
      }
    } else {
      if (webinarId && webinarId !== 'all') {
        whereClause.registration.is.webinarId = webinarId
      }

      if (startDate || endDate) {
        whereClause.joinedAt = {}
        if (startDate) {
          whereClause.joinedAt.gte = new Date(startDate)
        }
        if (endDate) {
          // Add one day to include the end date fully
          const end = new Date(endDate)
          end.setDate(end.getDate() + 1)
          whereClause.joinedAt.lt = end
        }
      }
    }

    // Fetch all session data.
    const sessions = await prisma.attendeeSession.findMany({
      where: whereClause,
      include: {
        registration: {
          include: {
            webinar: true
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    });

    // Helper to escape CSV values
    const escapeCSVValue = (val: string | number | null | undefined | boolean): string => {
      if (val === null || val === undefined) return ''
      const stringVal = String(val)
      if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n') || stringVal.includes('\r')) {
        return `"${stringVal.replace(/"/g, '""')}"`
      }
      return stringVal
    }

    const headers = [
      'Session ID',
      'Webinar Title',
      'Attendee Name',
      'Attendee Email',
      'Joined At',
      'Left At',
      'Last Seen At',
      'Total Watch Time (seconds)',
      'Video Position',
      'Completed',
      'Device',
      'Browser'
    ]

    const rows = sessions.map(s => {
      return [
        s.id,
        s.registration?.webinar?.title || 'Unknown Webinar',
        s.registration?.name || 'Unknown',
        s.registration?.email || 'Unknown',
        s.joinedAt.toISOString(),
        s.leftAt ? s.leftAt.toISOString() : '',
        s.lastSeenAt.toISOString(),
        s.totalWatchTime,
        s.videoPosition,
        s.completed ? 'Yes' : 'No',
        s.device || '',
        s.browser || ''
      ].map(escapeCSVValue).join(',')
    })

    const csvData = [headers.join(','), ...rows].join('\n')

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="attendee-sessions-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (err: any) {
    console.error('Error exporting sessions:', err);
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
