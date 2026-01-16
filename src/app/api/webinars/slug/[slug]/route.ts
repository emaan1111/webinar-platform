import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const webinar = await prisma.webinar.findUnique({
      where: { slug: params.slug },
      include: {
        schedules: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' }
        },
        host: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!webinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(webinar)
  } catch (error) {
    console.error('Error fetching webinar:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webinar' },
      { status: 500 }
    )
  }
}
