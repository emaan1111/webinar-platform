import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Add a question to a survey
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { section, question, type, options, maxSelect, position } = body

  if (!question || !options || !Array.isArray(options) || options.length === 0) {
    return NextResponse.json({ error: 'Question and options are required' }, { status: 400 })
  }

  // Get next position if not specified
  let pos = position
  if (pos === undefined) {
    const last = await prisma.surveyQuestion.findFirst({
      where: { surveyId: params.id },
      orderBy: { position: 'desc' },
      select: { position: true },
    })
    pos = (last?.position ?? -1) + 1
  }

  const q = await prisma.surveyQuestion.create({
    data: {
      surveyId: params.id,
      section: section || 'General',
      question,
      type: type || 'single',
      options: JSON.stringify(options),
      maxSelect: maxSelect || 1,
      position: pos,
    },
  })

  return NextResponse.json({ question: q }, { status: 201 })
}

// Bulk update question positions / reorder
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { questions } = body // Array of { id, position }

  if (!Array.isArray(questions)) {
    return NextResponse.json({ error: 'questions array required' }, { status: 400 })
  }

  await prisma.$transaction(
    questions.map((q: { id: string; position: number }) =>
      prisma.surveyQuestion.update({
        where: { id: q.id },
        data: { position: q.position },
      })
    )
  )

  return NextResponse.json({ success: true })
}
