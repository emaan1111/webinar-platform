import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/lead-pages/[id]/reset-stats - Reset stats for a lead page
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = params;

    // Verify lead page exists
    const leadPage = await prisma.leadPage.findUnique({
      where: { id }
    });

    if (!leadPage) {
      return NextResponse.json({ error: 'Lead page not found' }, { status: 404 });
    }

    // Reset lead page counters
    await prisma.leadPage.update({
      where: { id },
      data: {
        views: 0,
        conversions: 0
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Lead page stats have been reset' 
    });
  } catch (error) {
    console.error('Failed to reset lead page stats:', error);
    return NextResponse.json({ error: 'Failed to reset stats' }, { status: 500 });
  }
}
