import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const dateFilter = searchParams.get('dateFilter'); // 'today', 'last24h', 'last1h', 'last7d', 'last30d', 'custom'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const webinarId = searchParams.get('webinarId'); // optional webinar filter

    // Calculate date range
    let dateFrom: Date | null = null;
    let dateTo: Date | null = null;
    const now = new Date();

    switch (dateFilter) {
      case 'last1h':
        dateFrom = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'last24h':
        dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'today':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'last7d':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30d':
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (startDate) dateFrom = new Date(startDate);
        if (endDate) dateTo = new Date(endDate);
        break;
    }

    const leadPages = await prisma.leadPage.findMany({
      where: {
        ...(webinarId ? { webinarId } : {})
      },
      include: {
        webinar: {
          select: { id: true, title: true, internalName: true }
        },
        template: {
          select: { name: true }
        }
      },
      orderBy: [{ folder: 'asc' as const }, { updatedAt: 'desc' as const }] as any
    });

    // If date filter is applied, calculate filtered views/conversions
    if (dateFrom || dateTo) {
      const leadPagesWithFilteredStats = await Promise.all(
        leadPages.map(async (lp) => {
          // Count views (page visits to this lead page)
          const viewsWhere: any = {
            pageId: lp.id,
            pageType: 'registration'
          };
          if (dateFrom) viewsWhere.createdAt = { gte: dateFrom };
          if (dateTo) viewsWhere.createdAt = { ...viewsWhere.createdAt, lte: dateTo };

          const filteredViews = await prisma.pageVisit.count({
            where: viewsWhere
          });

          // Count conversions (page visits with registrationId)
          const conversionsWhere: any = {
            pageId: lp.id,
            pageType: 'registration',
            registrationId: { not: null }
          };
          if (dateFrom) conversionsWhere.createdAt = { gte: dateFrom };
          if (dateTo) conversionsWhere.createdAt = { ...conversionsWhere.createdAt, lte: dateTo };

          const filteredConversions = await prisma.pageVisit.count({
            where: conversionsWhere
          });

          return {
            ...lp,
            filteredViews,
            filteredConversions
          };
        })
      );

      return NextResponse.json(leadPagesWithFilteredStats);
    }

    return NextResponse.json(leadPages);
  } catch (error) {
    console.error('Failed to fetch lead pages:', error);
    return NextResponse.json({ error: 'Failed to fetch lead pages' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { name, slug, type, webinarId, templateId, htmlContent } = body;

    const leadPage = await prisma.leadPage.create({
      data: {
        name,
        slug,
        type,
        webinarId,
        templateId: type === 'TEMPLATE' ? templateId : undefined,
        htmlContent: type === 'CUSTOM' ? htmlContent : undefined,
      }
    });

    return NextResponse.json(leadPage);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create lead page' }, { status: 500 });
  }
}
