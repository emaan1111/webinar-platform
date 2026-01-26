import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/settings/sms - Get SMS settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get or create SMS settings (single row pattern)
    let settings = await prisma.sMSSettings.findUnique({
      where: { id: 'default' }
    })

    if (!settings) {
      settings = await prisma.sMSSettings.create({
        data: {
          id: 'default',
          blockedTimezones: []
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching SMS settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SMS settings' },
      { status: 500 }
    )
  }
}

// PUT /api/settings/sms - Update SMS settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { blockedTimezones } = body

    if (!Array.isArray(blockedTimezones)) {
      return NextResponse.json(
        { error: 'blockedTimezones must be an array' },
        { status: 400 }
      )
    }

    // Upsert SMS settings
    const settings = await prisma.sMSSettings.upsert({
      where: { id: 'default' },
      update: { blockedTimezones },
      create: {
        id: 'default',
        blockedTimezones
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating SMS settings:', error)
    return NextResponse.json(
      { error: 'Failed to update SMS settings' },
      { status: 500 }
    )
  }
}
