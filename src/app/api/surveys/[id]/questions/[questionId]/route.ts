import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Update a question
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; questionId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { section, question, type, options, maxSelect, position } = body

  const data: Record<string, unknown> = {}
  if (section !== undefined) data.section = section
  if (question !== undefined) data.question = question
  if (type !== undefined) data.type = type
  if (options !== undefined) data.options = JSON.stringify(options)
  if (maxSelect !== undefined) data.maxSelect = maxSelect
  if (position !== undefined) data.position = position

  const updated = await prisma.surveyQuestion.update({
    where: { id: params.questionId },
    data,
  })

  return NextResponse.json({ question: updated })
}

// Delete a question
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; questionId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.surveyQuestion.delete({ where: { id: params.questionId } })

  return NextResponse.json({ success: true })
}
