import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

// Public: submit survey answers incrementally
// First call: no responseId → creates SurveyResponse + first answer(s)
// Subsequent calls: responseId included → upserts answers onto existing response
//
// The webinar poll (external thank-you / countdown pages) additionally passes the
// registrant it is being answered by; that context is stored on the response so the
// CSV export can say who said what. It is optional — the standalone /survey/[slug]
// flow sends answers only.

/** Trim identity fields to something sane before they hit the DB. */
function clip(value: unknown, max = 300): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

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

  const registrationId = clip(body.registrationId, 60)
  const externalWebinarId = clip(body.externalWebinarId, 60)
  const respondentName = clip(body.name)
  const respondentEmail = clip(body.email)
  const source = clip(body.source, 40)

  // Resolve the response to write onto: the one the client is holding, or — when the
  // poll is answered from a second page (thank-you then countdown) after localStorage
  // was cleared — the one this registrant already started.
  let target: { id: string } | null = null
  if (responseId) {
    target = await prisma.surveyResponse.findFirst({
      where: { id: responseId, surveyId: params.id },
      select: { id: true },
    })
    if (!target) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }
  } else if (registrationId) {
    target = await prisma.surveyResponse.findFirst({
      where: { surveyId: params.id, registrationId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    })
  }

  // If we already have a response, upsert answers onto it
  if (target) {
    for (const [questionId, value] of answerEntries) {
      const val = typeof value === 'string' ? value : JSON.stringify(value)
      const existingAnswer = await prisma.surveyAnswer.findFirst({
        where: { responseId: target.id, questionId },
      })
      if (existingAnswer) {
        await prisma.surveyAnswer.update({
          where: { id: existingAnswer.id },
          data: { value: val },
        })
      } else {
        await prisma.surveyAnswer.create({
          data: { responseId: target.id, questionId, value: val },
        })
      }
    }

    return NextResponse.json({ responseId: target.id }, { status: 200 })
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
      externalWebinarId,
      registrationId,
      respondentName,
      respondentEmail,
      source,
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
