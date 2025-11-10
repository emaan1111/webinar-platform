/**
 * Reset A/B Test API
 * 
 * POST /api/ab-test/reset
 * Deletes all test metrics for a webinar to start fresh
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resetABTestMetrics } from '@/lib/abTracking';

interface ResetTestRequest {
  webinarId: string;
}

/**
 * POST /api/ab-test/reset
 * Resets all A/B test metrics for a webinar
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: ResetTestRequest = await request.json();
    const { webinarId } = body;

    if (!webinarId) {
      return NextResponse.json(
        { error: 'Missing webinarId' },
        { status: 400 }
      );
    }

    // Verify webinar exists and belongs to user
    const webinar = await prisma.webinar.findUnique({
      where: {
        id: webinarId,
        userId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        enableABTesting: true,
      },
    });

    if (!webinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      );
    }

    if (!webinar.enableABTesting) {
      return NextResponse.json(
        { error: 'A/B testing is not enabled for this webinar' },
        { status: 400 }
      );
    }

    // Reset all metrics
    await resetABTestMetrics(webinarId);

    return NextResponse.json({
      success: true,
      message: 'A/B test metrics have been reset',
    });

  } catch (error) {
    console.error('Error resetting A/B test:', error);
    return NextResponse.json(
      { error: 'Failed to reset A/B test' },
      { status: 500 }
    );
  }
}
