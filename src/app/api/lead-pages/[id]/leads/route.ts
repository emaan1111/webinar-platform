import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/lead-pages/[id]/leads - Get all registrations that came from this lead page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get the lead page to verify it exists
    const leadPage = await prisma.leadPage.findUnique({
      where: { id },
      select: { id: true, slug: true, webinarId: true }
    });

    if (!leadPage) {
      return NextResponse.json({ error: 'Lead page not found' }, { status: 404 });
    }

    // Find registrations that came from this lead page
    // We look at PageVisit records where the visit resulted in a registration
    const pageVisitsWithRegistrations = await prisma.pageVisit.findMany({
      where: {
        pageId: id,
        pageType: 'registration',
        registrationId: { not: null }
      },
      include: {
        registration: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            registeredAt: true,
            attended: true,
            hasPurchased: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Also try to get registrations that may not have page visit records
    // by looking at registrations for the same webinar created recently after page visits
    // This is a fallback for edge cases

    // Dedupe by registration ID and format the response
    const registrationMap = new Map<string, any>();
    
    for (const visit of pageVisitsWithRegistrations) {
      if (visit.registration && !registrationMap.has(visit.registration.id)) {
        registrationMap.set(visit.registration.id, {
          id: visit.registration.id,
          name: visit.registration.name,
          email: visit.registration.email,
          phone: visit.registration.phone,
          registeredAt: visit.registration.registeredAt,
          attended: visit.registration.attended,
          hasPurchased: visit.registration.hasPurchased
        });
      }
    }

    const leads = Array.from(registrationMap.values());

    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching lead page leads:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}
