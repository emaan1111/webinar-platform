import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { position } = body;

    console.log(`📥 [API] Received save request for registration ${id}, position: ${position}`);

    if (typeof position !== 'number' || position < 0) {
      console.log(`❌ [API] Invalid position value: ${position}`);
      return NextResponse.json(
        { error: 'Invalid position value' },
        { status: 400 }
      );
    }

    // Update the registration's lastWatchedPosition
    const updated = await prisma.registration.update({
      where: { id },
      data: {
        lastWatchedPosition: Math.floor(position),
        watchedReplay: true, // Mark that they've watched the replay
      } as any, // Type assertion until TS server refreshes
    });

    console.log(`✅ [API] Successfully updated position to ${Math.floor(position)} for registration ${id}`);

    return NextResponse.json({ success: true, position: Math.floor(position) });
  } catch (error) {
    console.error('❌ [API] Error saving watch position:', error);
    return NextResponse.json(
      { error: 'Failed to save watch position' },
      { status: 500 }
    );
  }
}
