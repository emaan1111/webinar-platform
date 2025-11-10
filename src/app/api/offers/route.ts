import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
      hideAfter
    } = body

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
        webinarId,
        title,
        description: description || null,
        price: parseFloat(price),
        ctaText,
        ctaUrl,
        videoTimestamp: parseInt(body.videoTimestamp),
        hideAfter: body.hideAfter ? parseInt(body.hideAfter) : null,
        isActive: true
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
    const { id, ...data } = body

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
    const updated = await prisma.offer.update({
      where: { id },
      data: {
        ...data,
        price: data.price ? parseFloat(data.price) : undefined,
        videoTimestamp: data.videoTimestamp ? parseInt(data.videoTimestamp) : undefined,
        hideAfter: data.hideAfter !== undefined ? (data.hideAfter ? parseInt(data.hideAfter) : null) : undefined
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
