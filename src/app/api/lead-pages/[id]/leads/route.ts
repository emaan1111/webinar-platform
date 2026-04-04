import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    // Strategy 1: Find registrations via PageVisit records
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

    // Strategy 2: Find registrations via SplitTestVariant that references this lead page
    const splitTestVariants = await prisma.splitTestVariant.findMany({
      where: { leadPageId: id },
      select: { id: true }
    });
    
    const variantIds = splitTestVariants.map(v => v.id);
    
    let registrationsFromVariants: any[] = [];
    if (variantIds.length > 0) {
      registrationsFromVariants = await prisma.registration.findMany({
        where: {
          splitTestVariantId: { in: variantIds }
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          registeredAt: true,
          attended: true,
          hasPurchased: true
        },
        orderBy: { registeredAt: 'desc' }
      });
    }

    // Combine and dedupe by registration ID
    const registrationMap = new Map<string, any>();
    
    // Add from page visits
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
    
    // Add from split test variants
    for (const reg of registrationsFromVariants) {
      if (!registrationMap.has(reg.id)) {
        registrationMap.set(reg.id, reg);
      }
    }

    const leads = Array.from(registrationMap.values())
      .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

    return NextResponse.json(leads, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error) {
    console.error('Error fetching lead page leads:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}
