import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

// Public: submit survey answers incrementally
// First call: no responseId → creates SurveyResponse + first answer(s)
// Subsequent calls: responseId included → upserts answers onto existing response
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
  const { answers, responseId } = body // answers: Record<questionId, string | string[]>, responseId?: string

  if (!answers || typeof answers !== 'object') {
    return NextResponse.json({ error: 'Answers are required' }, { status: 400 })
  }

  const answerEntries = Object.entries(answers)

  // If we already have a response, upsert answers onto it
  if (responseId) {
    const existing = await prisma.surveyResponse.findFirst({
      where: { id: responseId, surveyId: params.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    for (const [questionId, value] of answerEntries) {
      const val = typeof value === 'string' ? value : JSON.stringify(value)
      const existingAnswer = await prisma.surveyAnswer.findFirst({
        where: { responseId, questionId },
      })
      if (existingAnswer) {
        await prisma.surveyAnswer.update({
          where: { id: existingAnswer.id },
          data: { value: val },
        })
      } else {
        await prisma.surveyAnswer.create({
          data: { responseId, questionId, value: val },
        })
      }
    }

    return NextResponse.json({ responseId }, { status: 200 })
  }

  // First call: create a new response with the initial answer(s)
  const headersList = headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const userAgent = headersList.get('user-agent') || null

  const response = await prisma.surveyResponse.create({
    data: {
      surveyId: params.id,
      ip,
      userAgent,
      answers: {
        create: answerEntries.map(([questionId, value]) => ({
          questionId,
          value: typeof value === 'string' ? value : JSON.stringify(value),
        })),
      },
    },
  })

  return NextResponse.json({ responseId: response.id }, { status: 201 })
}
