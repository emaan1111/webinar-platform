import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/tracking/offer - Track offer interactions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      registrationId,
      webinarId,
      offerTitle,
      offerUrl,
      action, // 'view' | 'click' | 'convert'
      videoPosition,
    } = body;

    if (!registrationId || !webinarId || !action) {
      return NextResponse.json(
        { error: 'Registration ID, Webinar ID, and action required' },
        { status: 400 }
      );
    }

    // Find or create offer analytics record
    let offerAnalytics = await prisma.offerAnalytics.findFirst({
      where: {
        registrationId,
        webinarId,
      },
    });

    if (!offerAnalytics) {
      offerAnalytics = await prisma.offerAnalytics.create({
        data: {
          registrationId,
          webinarId,
          offerTitle: offerTitle || 'Untitled Offer',
          offerUrl: offerUrl || '',
        },
      });
    }

    // Update based on action
    const updateData: any = {};

    if (action === 'view') {
      updateData.sawOffer = true;
      updateData.sawOfferAt = new Date();
      if (videoPosition !== undefined) {
        updateData.videoPosition = videoPosition;
      }
    }

    if (action === 'click') {
      updateData.clickedOffer = true;
      updateData.clickedOfferAt = new Date();
      if (!offerAnalytics.sawOffer) {
        updateData.sawOffer = true;
        updateData.sawOfferAt = new Date();
      }
    }

    if (action === 'convert') {
      updateData.converted = true;
      updateData.convertedAt = new Date();
    }

    await prisma.offerAnalytics.update({
      where: { id: offerAnalytics.id },
      data: updateData,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Offer tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track offer interaction' },
      { status: 500 }
    );
  }
}
