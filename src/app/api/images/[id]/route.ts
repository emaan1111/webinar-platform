import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'

// DELETE /api/images/[id] - Delete image
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'HOST')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Get image from database
    const image = await (prisma as any).image.findUnique({
      where: { id }
    })

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Delete file from disk
    const filePath = join(process.cwd(), 'public', 'uploads', image.filename)
    try {
      await unlink(filePath)
    } catch (error) {
      console.error('Error deleting file:', error)
      // Continue even if file deletion fails
    }

    // Delete from database
    await (prisma as any).image.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}

// PATCH /api/images/[id] - Update image metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'HOST')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { tags, description } = body

    const image = await (prisma as any).image.update({
      where: { id },
      data: {
        tags,
        description,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(image)
  } catch (error) {
    console.error('Error updating image:', error)
    return NextResponse.json({ error: 'Failed to update image' }, { status: 500 })
  }
}
