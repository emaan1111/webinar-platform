import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// POST /api/webinars/[id]/chat/messages - Save a user chat message
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
    const { message, videoTimestamp } = body;

    if (!message || typeof videoTimestamp !== 'number') {
      return NextResponse.json(
        { error: 'Message and videoTimestamp are required' },
        { status: 400 }
      );
    }

    // Verify webinar exists
    const webinar = await prisma.webinar.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 });
    }

    // Create the chat message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        webinarId: params.id,
        userId: (session.user as any).id,
        message,
        videoTimestamp,
        isScripted: false,
        isHidden: true, // Hidden by default until approved
        isApproved: false, // Needs admin approval
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
      message: chatMessage,
    });
  } catch (error) {
    console.error('Error saving chat message:', error);
    return NextResponse.json(
      { error: 'Failed to save chat message' },
      { status: 500 }
    );
  }
}
