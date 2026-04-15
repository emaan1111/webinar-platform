import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

// Public: submit a survey response
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const survey = await prisma.survey.findUnique({
    where: { id: params.id },
    select: { id: true, isActive: true },
  })

  if (!survey || !survey.isActive) {
    return NextResponse.json({ error: 'Survey not found or inactive' }, { status: 404 })
  }

  const body = await request.json()
  const { answers } = body // Record<questionId, string | string[]>

  if (!answers || typeof answers !== 'object') {
    return NextResponse.json({ error: 'Answers are required' }, { status: 400 })
  }

  const headersList = headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const userAgent = headersList.get('user-agent') || null

  const response = await prisma.surveyResponse.create({
    data: {
      surveyId: params.id,
      ip,
      userAgent,
      answers: {
        create: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          value: typeof value === 'string' ? value : JSON.stringify(value),
        })),
      },
    },
    include: { answers: true },
  })

  return NextResponse.json({ responseId: response.id }, { status: 201 })
}
