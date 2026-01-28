import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/split-tests/[id]/reset-stats - Reset all stats for a split test
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = params;

    // Verify split test exists
    const splitTest = await prisma.splitTest.findUnique({
      where: { id },
      include: { variants: true }
    });

    if (!splitTest) {
      return NextResponse.json({ error: 'Split test not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Reset split test counters
      await tx.splitTest.update({
        where: { id },
        data: {
          conversions: 0
        }
      });

      // 2. Reset all variant counters
      await tx.splitTestVariant.updateMany({
        where: { splitTestId: id },
        data: {
          views: 0,
          conversions: 0
        }
      });

      // 3. Delete all events for this split test
      await tx.splitTestEvent.deleteMany({
        where: { splitTestId: id }
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Split test stats have been reset' 
    });
  } catch (error) {
    console.error('Failed to reset split test stats:', error);
    return NextResponse.json({ error: 'Failed to reset stats' }, { status: 500 });
  }
}
