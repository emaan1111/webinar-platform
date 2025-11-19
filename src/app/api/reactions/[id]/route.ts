import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if reaction exists
    const reaction = await prisma.reaction.findUnique({
      where: { id },
    })

    if (!reaction) {
      return NextResponse.json(
        { error: 'Reaction not found' },
        { status: 404 }
      )
    }

    // Delete the reaction
    await prisma.reaction.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Reaction deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting reaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete reaction' },
      { status: 500 }
    )
  }
}
