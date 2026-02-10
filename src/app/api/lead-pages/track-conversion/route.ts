import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadPageId, registrationId } = body;

    if (!leadPageId) {
        return NextResponse.json({ error: 'Lead Page ID required' }, { status: 400 });
    }
    
    // Get the lead page to find its webinarId
    const leadPage = await prisma.leadPage.findUnique({
      where: { id: leadPageId },
      select: { id: true, webinarId: true }
    });

    if (!leadPage) {
      return NextResponse.json({ error: 'Lead page not found' }, { status: 404 });
    }

    // Record conversion for the standalone lead page
    await prisma.leadPage.update({
        where: { id: leadPageId },
        data: { conversions: { increment: 1 } }
    });

    // If we have a registrationId, create a PageVisit record to link them
    // This allows us to query which registrations came from which lead page
    if (registrationId && leadPage.webinarId) {
      try {
        await prisma.pageVisit.create({
          data: {
            registrationId,
            webinarId: leadPage.webinarId,
            visitorId: registrationId, // Use registrationId as visitorId for this tracking record
            pageType: 'registration',
            pageId: leadPageId,
          }
        });
        console.log(`✅ Beacon: Lead page conversion linked to registration ${registrationId}`);
      } catch (linkError) {
        // Don't fail if linking fails - the conversion count is already recorded
        console.error('Failed to link registration to lead page:', linkError);
      }
    }
    
    console.log(`✅ Beacon: Lead page conversion recorded for ${leadPageId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track lead page conversion error:', error);
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
  }
}
