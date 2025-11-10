import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// POST /api/webinars/[id]/reactions - Save a user reaction
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, videoTimestamp } = body;

    if (!type || !['heart', 'clap', 'thumbsUp'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid reaction type. Must be: heart, clap, or thumbsUp' },
        { status: 400 }
      );
    }

    if (typeof videoTimestamp !== 'number' || videoTimestamp < 0) {
      return NextResponse.json(
        { error: 'Invalid videoTimestamp' },
        { status: 400 }
      );
    }

    // Verify webinar exists
    const webinar = await prisma.webinar.findUnique({
      where: { id: params.id },
    });

    if (!webinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      );
    }

    // Save reaction
    const reaction = await prisma.reaction.create({
      data: {
        webinarId: params.id,
        userId: (session.user as any).id,
        type,
        videoTimestamp,
        isScripted: false,
        isHidden: false, // Reactions are immediately visible (unlike chat messages)
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      reaction: {
        id: reaction.id,
        type: reaction.type,
        videoTimestamp: reaction.videoTimestamp,
        userName: reaction.user.name || reaction.user.email.split('@')[0],
        createdAt: reaction.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error saving reaction:', error);
    return NextResponse.json(
      { error: 'Failed to save reaction' },
      { status: 500 }
    );
  }
}
