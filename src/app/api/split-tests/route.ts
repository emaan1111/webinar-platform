import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');

  try {
    const splitTests = await prisma.splitTest.findMany({
      include: {
        variants: {
          include: {
            leadPage: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // If 'from' date is provided, calculate stats from events
    if (from) {
      const fromDate = new Date(from);
      
      const testsWithStats = await Promise.all(splitTests.map(async (test: any) => {
        const variantsWithStats = await Promise.all(test.variants.map(async (variant: any) => {
          // Count events since 'from' date
          // Get Raw counts
          // NOTE: We could use distinct: ['visitorId'] if we only wanted unique views.
          // For now, we fetch all events to calculate uniques manually if needed or just count total.
          // To truly answer "Unique Views", we should use distinct views.
          
          /*
            Prisma doesn't support counting distinct easily in a simple count query with Date filters in this version cleanly for relations.
            But we can use groupBy.
          */
         
         const viewsCount = await prisma.splitTestEvent.groupBy({
             by: ['visitorId'],
             where: {
                 variantId: variant.id,
                 type: 'VIEW',
                 createdAt: { gte: fromDate }
             }
         });
         
         const conversionsCount = await prisma.splitTestEvent.groupBy({
             by: ['visitorId'],
             where: {
                 variantId: variant.id,
                 type: 'CONVERSION',
                 createdAt: { gte: fromDate }
             }
         });

          return {
            ...variant,
            views: viewsCount.length, // Unique visitors
            conversions: conversionsCount.length // Unique conversions
          };
        }));

        return {
          ...test,
          variants: variantsWithStats
        };
      }));

      return NextResponse.json(testsWithStats);
    }

    return NextResponse.json(splitTests);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch split tests' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { name, slug, variants } = body;

    const splitTest = await prisma.splitTest.create({
      data: {
        name,
        slug,
        variants: {
          create: variants.map((v: any) => ({
            leadPageId: v.leadPageId,
            weight: v.weight
          }))
        }
      }
    });

    return NextResponse.json(splitTest);
  } catch (error: any) {
    console.error('❌ Failed to create split test:', error);
    
    // Check for unique constraint violation on slug
    if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
        return NextResponse.json({ error: 'A split test with this slug already exists.' }, { status: 400 });
    }

    return NextResponse.json({ error: error.message || 'Failed to create split test' }, { status: 500 });
  }
}
