import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { emails } = await request.json()

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ lookups: {} })
    }

    // Limit to prevent abuse
    const limitedEmails = emails.slice(0, 100).map((e: string) => e.toLowerCase().trim())

    // Find registrations by email (get the most recent one per email)
    const registrations = await prisma.registration.findMany({
      where: {
        email: {
          in: limitedEmails,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        email: true,
        registeredAt: true
      },
      orderBy: {
        registeredAt: 'desc'
      }
    })

    // Build lookup map (use first/most recent registration per email)
    const lookups: Record<string, string | null> = {}
    limitedEmails.forEach(email => {
      lookups[email] = null
    })
    
    registrations.forEach(reg => {
      const key = reg.email.toLowerCase().trim()
      // Only set if not already set (keeps the most recent)
      if (!lookups[key]) {
        lookups[key] = reg.id
      }
    })

    return NextResponse.json({ lookups })
  } catch (error) {
    console.error('[Email Lookup] Error:', error)
    return NextResponse.json(
      { error: 'Failed to lookup emails' },
      { status: 500 }
    )
  }
}
