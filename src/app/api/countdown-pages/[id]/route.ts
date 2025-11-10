import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/countdown-pages/[id] - Get a single countdown page
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const countdownPage = await prisma.countdownPage.findUnique({
      where: { id: params.id },
    });

    if (!countdownPage) {
      return NextResponse.json(
        { error: 'Countdown page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ countdownPage });
  } catch (error) {
    console.error('Error fetching countdown page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countdown page' },
      { status: 500 }
    );
  }
}

// PATCH /api/countdown-pages/[id] - Update a countdown page
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Check if it's a system page
    const existing = await prisma.countdownPage.findUnique({
      where: { id: params.id },
      select: { isSystem: true },
    });

    if (existing?.isSystem) {
      return NextResponse.json(
        { error: 'Cannot modify system countdown pages' },
        { status: 403 }
      );
    }

    const countdownPage = await prisma.countdownPage.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        htmlCode: body.htmlCode,
        showVideo: body.showVideo,
        videoUrl: body.videoUrl,
        videoTitle: body.videoTitle,
        videoPlaceholder: body.videoPlaceholder,
        showBonus: body.showBonus,
        bonusTitle: body.bonusTitle,
        bonusDescription: body.bonusDescription,
        bonusImage: body.bonusImage,
        bonusValue: body.bonusValue,
        bonusBadge: body.bonusBadge,
        showReminder: body.showReminder,
        showWhatsApp: body.showWhatsApp,
        showFacebook: body.showFacebook,
        showCustomCTA: body.showCustomCTA,
        customCTAText: body.customCTAText,
        customCTAUrl: body.customCTAUrl,
        organizationName: body.organizationName,
        contactEmail: body.contactEmail,
        websiteUrl: body.websiteUrl,
        logoUrl: body.logoUrl,
        thumbnail: body.thumbnail,
        primaryColor: body.primaryColor,
        accentColor: body.accentColor,
      },
    });

    return NextResponse.json({ countdownPage });
  } catch (error) {
    console.error('Error updating countdown page:', error);
    return NextResponse.json(
      { error: 'Failed to update countdown page' },
      { status: 500 }
    );
  }
}

// DELETE /api/countdown-pages/[id] - Delete a countdown page
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if it's a system page
    const existing = await prisma.countdownPage.findUnique({
      where: { id: params.id },
      select: { isSystem: true },
    });

    if (existing?.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system countdown pages' },
        { status: 403 }
      );
    }

    await prisma.countdownPage.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting countdown page:', error);
    return NextResponse.json(
      { error: 'Failed to delete countdown page' },
      { status: 500 }
    );
  }
}
