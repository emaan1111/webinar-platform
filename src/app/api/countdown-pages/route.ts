import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/countdown-pages - List all countdown pages
export async function GET() {
  try {
    const countdownPages = await prisma.countdownPage.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail: true,
        primaryColor: true,
        accentColor: true,
        isSystem: true,
        showVideo: true,
        showBonus: true,
        showReminder: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ countdownPages });
  } catch (error) {
    console.error('Error fetching countdown pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countdown pages' },
      { status: 500 }
    );
  }
}

// POST /api/countdown-pages - Create a new countdown page
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const countdownPage = await prisma.countdownPage.create({
      data: {
        name: body.name,
        description: body.description,
        htmlCode: body.htmlCode,
        showVideo: body.showVideo || false,
        videoUrl: body.videoUrl,
        videoTitle: body.videoTitle,
        videoPlaceholder: body.videoPlaceholder,
        showBonus: body.showBonus || false,
        bonusTitle: body.bonusTitle,
        bonusDescription: body.bonusDescription,
        bonusImage: body.bonusImage,
        bonusValue: body.bonusValue,
        bonusBadge: body.bonusBadge,
        showReminder: body.showReminder ?? true,
        showWhatsApp: body.showWhatsApp ?? true,
        showFacebook: body.showFacebook ?? true,
        showCustomCTA: body.showCustomCTA || false,
        customCTAText: body.customCTAText,
        customCTAUrl: body.customCTAUrl,
        organizationName: body.organizationName,
        contactEmail: body.contactEmail,
        websiteUrl: body.websiteUrl,
        logoUrl: body.logoUrl,
        thumbnail: body.thumbnail,
        primaryColor: body.primaryColor || '#6366f1',
        accentColor: body.accentColor || '#8b5cf6',
        isSystem: false,
      },
    });

    return NextResponse.json({ countdownPage }, { status: 201 });
  } catch (error) {
    console.error('Error creating countdown page:', error);
    return NextResponse.json(
      { error: 'Failed to create countdown page' },
      { status: 500 }
    );
  }
}
