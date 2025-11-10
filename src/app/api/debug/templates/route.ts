import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Temporary debug endpoint - remove in production
export async function GET() {
  try {
    const templates = await prisma.thankYouTemplate.findMany({
      select: {
        id: true,
        name: true,
        isSystem: true,
        description: true,
        createdAt: true
      }
    })

    const webinars = await prisma.webinar.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        thankYouTemplateId: true
      },
      take: 5
    })

    return NextResponse.json({
      templateCount: templates.length,
      templates,
      webinarCount: webinars.length,
      webinars,
      message: templates.length === 0 ? 'No templates found. Run: npx tsx prisma/seed-thank-you-templates.ts' : 'OK'
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
