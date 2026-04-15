import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Admin: export all survey responses as CSV
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const survey = await prisma.survey.findUnique({
    where: { id: params.id },
    include: {
      questions: { orderBy: { position: 'asc' } },
    },
  })

  if (!survey) return NextResponse.json({ error: 'Survey not found' }, { status: 404 })

  const responses = await prisma.surveyResponse.findMany({
    where: { surveyId: params.id },
    include: { answers: true },
    orderBy: { createdAt: 'asc' },
  })

  // Build CSV
  const questions = survey.questions
  const headers = ['Response #', 'Date', 'IP', ...questions.map((q) => q.question)]

  const escape = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }

  const rows = responses.map((r, i) => {
    const answerMap = new Map(r.answers.map((a) => [a.questionId, a.value]))
    const cells = [
      String(i + 1),
      r.createdAt.toISOString().split('T')[0],
      r.ip || '',
      ...questions.map((q) => {
        const val = answerMap.get(q.id) || ''
        // Multi-select answers are stored as JSON arrays
        try {
          const parsed = JSON.parse(val)
          if (Array.isArray(parsed)) return parsed.join('; ')
        } catch {
          // not JSON, use as-is
        }
        return val
      }),
    ]
    return cells.map(escape).join(',')
  })

  const csv = [headers.map(escape).join(','), ...rows].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${survey.slug}-responses.csv"`,
    },
  })
}
