import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET single thank you template
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.thankYouTemplate.findUnique({
      where: { id: params.id }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching thank you template:', error)
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
  }
}

// UPDATE thank you template
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'HOST')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, htmlCode, thumbnail } = body

    // Check if template exists
    const existingTemplate = await prisma.thankYouTemplate.findUnique({
      where: { id: params.id }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Allow ADMIN and HOST to edit system templates
    // (They just can't delete them unless they're ADMIN)

    const template = await prisma.thankYouTemplate.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(htmlCode && { htmlCode }),
        ...(thumbnail !== undefined && { thumbnail })
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating thank you template:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

// DELETE thank you template
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'HOST')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if template exists and is not a system template
    const existingTemplate = await prisma.thankYouTemplate.findUnique({
      where: { id: params.id }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (existingTemplate.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system templates' },
        { status: 403 }
      )
    }

    await prisma.thankYouTemplate.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('Error deleting thank you template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
