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

    // Update the registration's lastWatchedPosition
    // IMPORTANT: Only update lastWatchedPosition for LIVE viewing
    // Replay watching should update replayWatchTime instead
    const updateData: any = {};
    
    if (isReplay) {
      // For replay, update replayWatchTime (not lastWatchedPosition)
      updateData.watchedReplay = true;
      updateData.replayWatchTime = Math.floor(position);
    } else {
      // For live viewing, update lastWatchedPosition
      updateData.lastWatchedPosition = Math.floor(position);
    }
    
    const updated = await prisma.registration.update({
      where: { id },
      data: updateData,
    });

    console.log(`✅ [API] Successfully updated ${isReplay ? 'replayWatchTime' : 'lastWatchedPosition'} to ${Math.floor(position)} for registration ${id}`);

    return NextResponse.json({ success: true, position: Math.floor(position) });
  } catch (error) {
    console.error('❌ [API] Error saving watch position:', error);
    return NextResponse.json(
      { error: 'Failed to save watch position' },
      { status: 500 }
    );
  }
}
