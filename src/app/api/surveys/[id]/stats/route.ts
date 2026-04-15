import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Admin: get survey stats
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const dateFilter: Record<string, unknown> = {}
  if (from) dateFilter.gte = new Date(from)
  if (to) dateFilter.lte = new Date(to + 'T23:59:59.999Z')

  const responseWhere: Record<string, unknown> = { surveyId: params.id }
  if (from || to) responseWhere.createdAt = dateFilter

  const survey = await prisma.survey.findUnique({
    where: { id: params.id },
    include: {
      questions: { orderBy: { position: 'asc' } },
    },
  })

  if (!survey) return NextResponse.json({ error: 'Survey not found' }, { status: 404 })

  const totalResponses = await prisma.surveyResponse.count({ where: responseWhere })

  // Get all answers for this survey within date range
  const answers = await prisma.surveyAnswer.findMany({
    where: {
      response: responseWhere,
    },
    select: {
      questionId: true,
      value: true,
    },
  })

  // Build per-question stats
  const questionStats = survey.questions.map((q) => {
    const opts: string[] = JSON.parse(q.options)
    const qAnswers = answers.filter((a) => a.questionId === q.id)
    const totalAnswered = qAnswers.length

    // Count each option
    const optionCounts: Record<string, number> = {}
    for (const opt of opts) optionCounts[opt] = 0

    for (const a of qAnswers) {
      if (q.type === 'multi') {
        try {
          const selected: string[] = JSON.parse(a.value)
          for (const s of selected) {
            if (optionCounts[s] !== undefined) optionCounts[s]++
          }
        } catch {
          if (optionCounts[a.value] !== undefined) optionCounts[a.value]++
        }
      } else {
        if (optionCounts[a.value] !== undefined) optionCounts[a.value]++
      }
    }

    return {
      id: q.id,
      section: q.section,
      question: q.question,
      type: q.type,
      totalAnswered,
      options: opts.map((opt) => ({
        label: opt,
        count: optionCounts[opt] || 0,
        percentage: totalAnswered > 0 ? Math.round((optionCounts[opt] || 0) / totalAnswered * 100) : 0,
      })),
    }
  })

  // Responses over time (last 30 days by default)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentResponses = await prisma.surveyResponse.findMany({
    where: {
      surveyId: params.id,
      createdAt: { gte: from ? new Date(from) : thirtyDaysAgo },
    },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  // Group by day
  const dailyCounts: Record<string, number> = {}
  for (const r of recentResponses) {
    const day = r.createdAt.toISOString().split('T')[0]
    dailyCounts[day] = (dailyCounts[day] || 0) + 1
  }

  return NextResponse.json({
    totalResponses,
    questionStats,
    dailyCounts,
  })
}
