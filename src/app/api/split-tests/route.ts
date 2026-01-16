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

    const fromDate = from ? new Date(from) : new Date(0); // Default to epoch if no date provided

    const testsWithStats = await Promise.all(splitTests.map(async (test: any) => {
      const variantsWithStats = await Promise.all(test.variants.map(async (variant: any) => {
        // 1. Calculate Unique Views (Group by VisitorID)
        const uniqueViewsGroups = await prisma.splitTestEvent.groupBy({
            by: ['visitorId'],
            where: {
                variantId: variant.id,
                type: 'VIEW',
                createdAt: { gte: fromDate }
            }
        });
        const uniqueViews = uniqueViewsGroups.length;

        // 2. Calculate Total Views (Count all VIEW events)
        const totalViews = await prisma.splitTestEvent.count({
            where: {
                variantId: variant.id,
                type: 'VIEW',
                createdAt: { gte: fromDate }
            }
        });

        // 3. Calculate Unique Conversions
        const uniqueConversionsGroups = await prisma.splitTestEvent.groupBy({
            by: ['visitorId'],
            where: {
                variantId: variant.id,
                type: 'CONVERSION',
                createdAt: { gte: fromDate }
            }
        });
        const uniqueConversions = uniqueConversionsGroups.length;

        // 4. Calculate Total Conversions
        const totalConversions = await prisma.splitTestEvent.count({
            where: {
                variantId: variant.id,
                type: 'CONVERSION',
                createdAt: { gte: fromDate }
            }
        });

        return {
          ...variant,
          views: totalViews,      // Total Page Loads
          uniqueViews,            // Unique Visitors
          conversions: totalConversions, // Total Actions
          uniqueConversions       // Unique Users who acted
        };
      }));

      return {
        ...test,
        variants: variantsWithStats
      };
    }));

    return NextResponse.json(testsWithStats);
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
