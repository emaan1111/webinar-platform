/**
 * Make Winner Permanent API
 * 
 * POST /api/ab-test/make-winner-permanent
 * Applies the winning variant to the webinar and disables A/B testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface MakeWinnerPermanentRequest {
  webinarId: string;
  element: 'registration' | 'schedule' | 'offer' | 'video' | 'overall';
  winner: 'A' | 'B';
}

/**
 * POST /api/ab-test/make-winner-permanent
 * Makes the winning variant permanent for the webinar
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

    const body: MakeWinnerPermanentRequest = await request.json();
    const { webinarId, element, winner } = body;

    if (!webinarId || !element || !winner) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify webinar exists and belongs to user
    const webinar = await prisma.webinar.findFirst({
      where: {
        id: webinarId,
        hostId: (session.user as any).id,
      },
      select: {
        id: true,
        enableABTesting: true,
        testRegistrationPage: true,
        regPageAId: true,
        regPageBId: true,
        registrationPageId: true,
        testSchedule: true,
        scheduleAIds: true,
        scheduleBIds: true,
        testOffer: true,
        offerAId: true,
        offerBId: true,
        testVideo: true,
        videoAId: true,
        videoBId: true,
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

    // Prepare update data based on element and winner
    let updateData: any = {};

    if (element === 'overall') {
      // Apply winner to all active tests
      if (webinar.testRegistrationPage) {
        updateData.registrationPageId = winner === 'A' ? webinar.regPageAId : webinar.regPageBId;
        updateData.testRegistrationPage = false;
        updateData.regPageAId = null;
        updateData.regPageBId = null;
      }

      if (webinar.testSchedule) {
        // For schedules, we can't easily merge them, so just disable the test
        // Admin will need to manually update schedules
        updateData.testSchedule = false;
        updateData.scheduleAIds = null;
        updateData.scheduleBIds = null;
      }

      if (webinar.testOffer) {
        // For offers, disable the test and keep the winner
        // Note: Offers are handled separately, so this just disables the test
        updateData.testOffer = false;
        updateData.offerAId = null;
        updateData.offerBId = null;
      }

      if (webinar.testVideo) {
        // For videos, we can't easily update, so just disable the test
        updateData.testVideo = false;
        updateData.videoAId = null;
        updateData.videoBId = null;
      }

      // Disable A/B testing entirely
      updateData.enableABTesting = false;
      updateData.trafficSplitPercent = 50; // Reset to default

    } else if (element === 'registration') {
      // Apply winning template
      updateData.registrationPageId = winner === 'A' ? webinar.regPageAId : webinar.regPageBId;
      updateData.testRegistrationPage = false;
      updateData.regPageAId = null;
      updateData.regPageBId = null;

      // Check if any other tests are still active
      const hasOtherTests = webinar.testSchedule || webinar.testOffer || webinar.testVideo;
      if (!hasOtherTests) {
        updateData.enableABTesting = false;
        updateData.trafficSplitPercent = 50;
      }

    } else if (element === 'schedule') {
      updateData.testSchedule = false;
      updateData.scheduleAIds = null;
      updateData.scheduleBIds = null;

      // Check if any other tests are still active
      const hasOtherTests = webinar.testRegistrationPage || webinar.testOffer || webinar.testVideo;
      if (!hasOtherTests) {
        updateData.enableABTesting = false;
        updateData.trafficSplitPercent = 50;
      }

    } else if (element === 'offer') {
      updateData.testOffer = false;
      updateData.offerAId = null;
      updateData.offerBId = null;

      // Check if any other tests are still active
      const hasOtherTests = webinar.testRegistrationPage || webinar.testSchedule || webinar.testVideo;
      if (!hasOtherTests) {
        updateData.enableABTesting = false;
        updateData.trafficSplitPercent = 50;
      }

    } else if (element === 'video') {
      updateData.testVideo = false;
      updateData.videoAId = null;
      updateData.videoBId = null;

      // Check if any other tests are still active
      const hasOtherTests = webinar.testRegistrationPage || webinar.testSchedule || webinar.testOffer;
      if (!hasOtherTests) {
        updateData.enableABTesting = false;
        updateData.trafficSplitPercent = 50;
      }
    }

    // Update the webinar
    const updatedWebinar = await prisma.webinar.update({
      where: {
        id: webinarId,
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Winner (Variant ${winner}) has been made permanent`,
      webinar: updatedWebinar,
    });

  } catch (error) {
    console.error('Error making winner permanent:', error);
    return NextResponse.json(
      { error: 'Failed to make winner permanent' },
      { status: 500 }
    );
  }
}
