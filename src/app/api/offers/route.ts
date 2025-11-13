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

  const normalized = lines
    .map((line) => line.trim())
    .filter(Boolean)

  return normalized
}

// GET /api/offers - Get all offers for user's webinars
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const webinarId = searchParams.get('webinarId')

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Build query
    const whereClause: any = {
      webinar: {
        hostId: user.id
      }
    }

    if (webinarId) {
      whereClause.webinarId = webinarId
    }

    // Get offers
    const offers = await prisma.offer.findMany({
      where: whereClause,
      include: {
        webinar: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ offers })
  } catch (error) {
    console.error('Error fetching offers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    )
  }
}

// POST /api/offers - Create a new offer
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      webinarId,
      title,
      description,
      price,
      ctaText,
      ctaUrl,
      videoTimestamp,
      hideAfter,
      originalPrice,
      discountLabel,
      countdownDuration,
      bulletPoints
    } = body
    const normalizedBulletPoints = parseBulletPoints(bulletPoints)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify webinar ownership
    const webinar = await prisma.webinar.findFirst({
      where: {
        id: webinarId,
        hostId: user.id
      }
    })

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found or unauthorized' }, { status: 404 })
    }

    // Create offer
    const offer = await prisma.offer.create({
      data: {
        title,
        description: description || null,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        discountLabel: discountLabel || null,
        countdownDuration: countdownDuration ? parseInt(countdownDuration) : null,
        ctaText,
        ctaUrl,
        videoTimestamp: parseInt(body.videoTimestamp),
        hideAfter: body.hideAfter ? parseInt(body.hideAfter) : null,
        bulletPoints:
          normalizedBulletPoints && normalizedBulletPoints.length
            ? normalizedBulletPoints
            : [],
        isActive: true,
        webinar: {
          connect: {
            id: webinarId
          }
        }
      },
      include: {
        webinar: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json({ offer }, { status: 201 })
  } catch (error) {
    console.error('Error creating offer:', error)
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    )
  }
}

// PATCH /api/offers - Update an offer
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      id,
      webinarId,
      title,
      description,
      price,
      ctaText,
      ctaUrl,
      videoTimestamp,
      hideAfter,
      isActive,
      bulletPoints,
      originalPrice,
      discountLabel,
      countdownDuration,
    } = body

    const normalizedBulletPoints = parseBulletPoints(bulletPoints)

    if (!id) {
      return NextResponse.json({ error: 'Offer ID required' }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify offer ownership through webinar
    const offer = await prisma.offer.findFirst({
      where: {
        id,
        webinar: {
          hostId: user.id
        }
      }
    })

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found or unauthorized' }, { status: 404 })
    }

    // Update offer
    const updateData: any = {}
    if (webinarId !== undefined) updateData.webinarId = webinarId
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description || null
    if (price !== undefined) updateData.price = parseFloat(price)
    if (ctaText !== undefined) updateData.ctaText = ctaText
    if (ctaUrl !== undefined) updateData.ctaUrl = ctaUrl
    if (videoTimestamp !== undefined) updateData.videoTimestamp = parseInt(videoTimestamp)
    if (hideAfter !== undefined) {
      updateData.hideAfter = hideAfter ? parseInt(hideAfter) : null
    }
    if (isActive !== undefined) updateData.isActive = isActive
    if (originalPrice !== undefined) {
      updateData.originalPrice = originalPrice ? parseFloat(originalPrice) : null
    }
    if (discountLabel !== undefined) {
      updateData.discountLabel = discountLabel || null
    }
    if (countdownDuration !== undefined) {
      updateData.countdownDuration = countdownDuration
        ? parseInt(countdownDuration)
        : null
    }
    if (bulletPoints !== undefined) {
      updateData.bulletPoints =
        normalizedBulletPoints && normalizedBulletPoints.length
          ? normalizedBulletPoints
          : []
    }

    const updated = await prisma.offer.update({
      where: { id },
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

    return NextResponse.json({ offer: updated })
  } catch (error) {
    console.error('Error updating offer:', error)
    return NextResponse.json(
      { error: 'Failed to update offer' },
      { status: 500 }
    )
  }
}

// DELETE /api/offers - Delete an offer
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Offer ID required' }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify offer ownership through webinar
    const offer = await prisma.offer.findFirst({
      where: {
        id,
        webinar: {
          hostId: user.id
        }
      }
    })

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found or unauthorized' }, { status: 404 })
    }

    // Delete offer
    await prisma.offer.delete({
      where: { id }
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
