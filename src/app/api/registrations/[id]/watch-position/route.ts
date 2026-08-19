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

    // Update logic based on mode (single query instead of read + write):
    // - LIVE mode: Always update lastWatchedPosition (tracks live viewing progress)
    // - REPLAY mode: Only update replayWatchTime if new position is GREATER (keep maximum)
    const newPosition = Math.floor(position);

    if (isReplay) {
      // For replay: keep the MAX of the stored and new position, and only flip
      // watchedReplay to true when the position actually advances.
      // NOTE: "registrations" table with camelCase columns per prisma/schema.prisma @@map.
      const rows = await prisma.$executeRaw`
        UPDATE "registrations"
        SET "replayWatchTime" = GREATEST("replayWatchTime", ${newPosition}::int),
            "watchedReplay" = ("watchedReplay" OR "replayWatchTime" < ${newPosition}::int)
        WHERE "id" = ${id}
      `;

      if (rows === 0) {
        return NextResponse.json(
          { error: 'Registration not found' },
          { status: 404 }
        );
      }

      console.log(`💾 Replay: replayWatchTime is now max(current, ${newPosition}s) for registration ${id}`);
    } else {
      // For live: Always update lastWatchedPosition (tracks current live viewing position)
      const updated = await prisma.registration.updateMany({
        where: { id },
        data: { lastWatchedPosition: newPosition },
      });

      if (updated.count === 0) {
        return NextResponse.json(
          { error: 'Registration not found' },
          { status: 404 }
        );
      }

      console.log(`💾 Live: Updated lastWatchedPosition to ${newPosition}s for registration ${id}`);
    }

    return NextResponse.json({
      success: true,
      position: newPosition,
      mode: isReplay ? 'replay' : 'live'
    });
  } catch (error) {
    console.error('❌ [API] Error saving watch position:', error);
    return NextResponse.json(
      { error: 'Failed to save watch position' },
      { status: 500 }
    );
  }
}
