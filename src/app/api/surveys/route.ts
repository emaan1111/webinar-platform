import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// List all surveys (admin)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const surveys = await prisma.survey.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { questions: true, responses: true } },
    },
  })

  return NextResponse.json({ surveys })
}

// Create a new survey
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, description, thankYouTitle, thankYouBody, primaryColor } = body

  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now().toString(36)

  const survey = await prisma.survey.create({
    data: {
      title,
      slug,
      description: description || null,
      thankYouTitle: thankYouTitle || 'Thank you!',
      thankYouBody: thankYouBody || null,
      primaryColor: primaryColor || '#1a5c3a',
    },
  })

  return NextResponse.json({ survey }, { status: 201 })
}
