import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { position, isReplay } = body;

    console.log(`📥 [API] Received save request for registration ${id}, position: ${position}, isReplay: ${isReplay}`);

    if (typeof position !== 'number' || position < 0) {
      console.log(`❌ [API] Invalid position value: ${position}`);
      return NextResponse.json(
        { error: 'Invalid position value' },
        { status: 400 }
      );
    }

    // First, get the current values
    const registration = await prisma.registration.findUnique({
      where: { id },
      select: {
        lastWatchedPosition: true,
        replayWatchTime: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Update logic based on mode:
    // - LIVE mode: Always update lastWatchedPosition (tracks live viewing progress)
    // - REPLAY mode: Only update replayWatchTime if new position is GREATER (keep maximum)
    const updateData: any = {};
    const newPosition = Math.floor(position);

    if (isReplay) {
      // For replay: Only update if new position is greater than current replayWatchTime
      const currentReplayTime = registration.replayWatchTime || 0;
      if (newPosition > currentReplayTime) {
        updateData.replayWatchTime = newPosition;
        updateData.watchedReplay = true;
        console.log(`💾 Replay: Updating replayWatchTime from ${currentReplayTime}s to ${newPosition}s (new maximum)`);
      } else {
        console.log(`⏭️ Replay: Keeping replayWatchTime at ${currentReplayTime}s (current watch ${newPosition}s is not greater)`);
        return NextResponse.json({ 
          success: true, 
          position: newPosition,
          kept: currentReplayTime,
          message: 'No update - keeping maximum watch time'
        });
      }
    } else {
      // For live: Always update lastWatchedPosition (tracks current live viewing position)
      updateData.lastWatchedPosition = newPosition;
      console.log(`💾 Live: Updating lastWatchedPosition to ${newPosition}s`);
    }

    // Update the registration
    const updated = await prisma.registration.update({
      where: { id },
      data: updateData,
    });

    console.log(`✅ [API] Successfully updated ${isReplay ? 'replayWatchTime' : 'lastWatchedPosition'} to ${newPosition} for registration ${id}`);

    return NextResponse.json({ 
      success: true, 
      position: newPosition,
      mode: isReplay ? 'replay' : 'live',
      updated: Object.keys(updateData)
    });
  } catch (error) {
    console.error('❌ [API] Error saving watch position:', error);
    return NextResponse.json(
      { error: 'Failed to save watch position' },
      { status: 500 }
    );
  }
}
