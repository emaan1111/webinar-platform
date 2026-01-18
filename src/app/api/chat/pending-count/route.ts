import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const count = await prisma.chatMessage.count({
      where: {
        isScripted: false,
        isAI: false,
        isApproved: false
      }
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching pending chat count:', error)
    return NextResponse.json({ count: 0 }, { status: 200 }) // Fail safe to 0
  }
}
