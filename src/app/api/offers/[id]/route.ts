import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const parseBulletPoints = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) {
    return undefined
  }

  const lines = Array.isArray(value)
    ? value.map((item) => String(item))
    : String(value).split(/\r?\n/)

  return lines
    .map((line) => line.trim())
    .filter(Boolean)
}

// PATCH /api/offers/[id] - Update an offer
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify ownership
    const existingOffer = await prisma.offer.findFirst({
      where: {
        id: params.id,
        webinar: {
          hostId: user.id
        }
      }
    })

    if (!existingOffer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}
    const normalizedBulletPoints = parseBulletPoints(body.bulletPoints)
    
    if (body.webinarId !== undefined) {
      updateData.webinar = { connect: { id: body.webinarId } }
    }
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.price !== undefined) updateData.price = parseFloat(body.price)
    if (body.ctaText !== undefined) updateData.ctaText = body.ctaText
    if (body.ctaUrl !== undefined) updateData.ctaUrl = body.ctaUrl
    if (body.videoTimestamp !== undefined) updateData.videoTimestamp = parseInt(body.videoTimestamp)
    if (body.hideAfter !== undefined) updateData.hideAfter = body.hideAfter ? parseInt(body.hideAfter) : null
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.originalPrice !== undefined) {
      updateData.originalPrice = body.originalPrice ? parseFloat(body.originalPrice) : null
    }
    if (body.discountLabel !== undefined) {
      updateData.discountLabel = body.discountLabel || null
    }
    if (body.countdownDuration !== undefined) {
      updateData.countdownDuration = body.countdownDuration
        ? parseInt(body.countdownDuration)
        : null
    }
    if (body.bulletPoints !== undefined) {
      updateData.bulletPoints =
        normalizedBulletPoints && normalizedBulletPoints.length
          ? normalizedBulletPoints
          : []
    }

    // Update offer
    const offer = await prisma.offer.update({
      where: { id: params.id },
      data: updateData,
      include: {
        webinar: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json({ offer })
  } catch (error) {
    console.error('Error updating offer:', error)
    return NextResponse.json(
      { error: 'Failed to update offer' },
      { status: 500 }
    )
  }
}

// DELETE /api/offers/[id] - Delete an offer
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify ownership
    const offer = await prisma.offer.findFirst({
      where: {
        id: params.id,
        webinar: {
          hostId: user.id
        }
      }
    })

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    // Delete offer
    await prisma.offer.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting offer:', error)
    return NextResponse.json(
      { error: 'Failed to delete offer' },
      { status: 500 }
    )
  }
}
