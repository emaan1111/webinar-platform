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
          const [views, conversions] = await Promise.all([
            prisma.splitTestEvent.count({
              where: {
                variantId: variant.id,
                type: 'VIEW',
                createdAt: { gte: fromDate }
              }
            }),
            prisma.splitTestEvent.count({
              where: {
                variantId: variant.id,
                type: 'CONVERSION',
                createdAt: { gte: fromDate }
              }
            })
          ]);
          
          return {
            ...variant,
            views,
            conversions
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create split test' }, { status: 500 });
  }
}
