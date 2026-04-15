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
  const filtersRaw = searchParams.get('filters')

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

  // If filters are set, narrow down to matching response IDs
  let filteredResponseIds: string[] | null = null
  if (filtersRaw) {
    try {
      const filters: Record<string, string> = JSON.parse(filtersRaw)
      const filterEntries = Object.entries(filters)
      if (filterEntries.length > 0) {
        // For each filter, find responses that have that answer
        const sets: Set<string>[] = []
        for (const [questionId, value] of filterEntries) {
          const matching = await prisma.surveyAnswer.findMany({
            where: {
              questionId,
              response: responseWhere,
              OR: [
                { value },
                { value: { contains: `"${value}"` } }, // for multi-select JSON arrays
              ],
            },
            select: { responseId: true },
          })
          sets.push(new Set(matching.map((a) => a.responseId)))
        }
        // Intersect all sets
        const intersection = sets.reduce((acc, s) => new Set([...acc].filter((id) => s.has(id))))
        filteredResponseIds = [...intersection]
      }
    } catch {
      // ignore bad filters
    }
  }

  // Build the where clause for counting/fetching
  const scopedWhere = filteredResponseIds !== null
    ? { ...responseWhere, id: { in: filteredResponseIds } }
    : responseWhere

  const totalResponses = await prisma.surveyResponse.count({ where: scopedWhere })

  // Get all answers scoped to filtered responses
  const answers = await prisma.surveyAnswer.findMany({
    where: {
      response: scopedWhere,
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
      ...scopedWhere,
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

// Admin: delete all responses for a survey (reset stats)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Delete answers first (FK), then responses
  await prisma.surveyAnswer.deleteMany({
    where: { response: { surveyId: params.id } },
  })
  await prisma.surveyResponse.deleteMany({
    where: { surveyId: params.id },
  })

  return NextResponse.json({ success: true })
}
