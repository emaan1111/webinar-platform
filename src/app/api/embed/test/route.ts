import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const webinars = await prisma.webinar.findMany({
      select: {
        id: true,
        title: true,
        status: true,
      },
      take: 10,
    })

    return NextResponse.json({
      success: true,
      count: webinars.length,
      webinars: webinars.map((w: any) => ({
        id: w.id,
        title: w.title,
        status: w.status,
        embedUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://emaanpowerclasses.com'}/api/embed/${w.id}?type=inline&theme=purple`,
        previewUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://emaanpowerclasses.com'}/api/embed/${w.id}/preview?type=inline&theme=purple`
      }))
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
