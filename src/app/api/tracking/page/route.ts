import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// POST /api/tracking/page - Track page visits
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      registrationId,
      sessionId,
      webinarId,
      visitorId,
      pageType, // 'registration' | 'countdown' | 'webinar' | 'thank_you' | 'replay'
      pageId, // For registration/countdown pages: which specific page was shown
      variantGroup, // For A/B testing: 'A' or 'B'
      action, // 'enter' | 'leave'
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      device,
      browser,
      country,
    } = body;

    if (!webinarId || !pageType) {
      return NextResponse.json(
        { error: 'Webinar ID and page type required' },
        { status: 400 }
      );
    }

    const actualVisitorId = visitorId || uuidv4();

    if (action === 'enter') {
      // Create page visit entry
      const visit = await prisma.pageVisit.create({
        data: {
          registrationId,
          sessionId,
          webinarId,
          visitorId: actualVisitorId,
          pageType,
          pageId,
          variantGroup,
          referrer,
          utmSource,
          utmMedium,
          utmCampaign,
          device,
          browser,
          country,
        },
      });

      return NextResponse.json({ 
        success: true,
        visitId: visit.id,
        visitorId: actualVisitorId,
      });
    }

    if (action === 'leave') {
      // Find the most recent active visit for this visitor and page
      const visit = await prisma.pageVisit.findFirst({
        where: {
          visitorId: actualVisitorId,
          webinarId,
          pageType,
          leftAt: null,
        },
        orderBy: {
          enteredAt: 'desc',
        },
      });

      if (visit) {
        const timeSpent = Math.floor(
          (Date.now() - visit.enteredAt.getTime()) / 1000
        );

        await prisma.pageVisit.update({
          where: { id: visit.id },
          data: {
            leftAt: new Date(),
            timeSpent,
          },
        });

        return NextResponse.json({ 
          success: true,
          timeSpent,
        });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Page tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track page visit' },
      { status: 500 }
    );
  }
}
