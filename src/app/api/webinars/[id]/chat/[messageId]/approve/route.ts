import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// PATCH /api/webinars/[id]/chat/[messageId]/approve - Approve a message
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow all hosts to moderate messages (removed hostId verification)
    const webinar = await prisma.webinar.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!webinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      );
    }

    // Approve the message
    const message = await prisma.chatMessage.update({
      where: { id: params.messageId },
      data: {
        isApproved: true,
        isHidden: false,
      },
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('Error approving message:', error);
    return NextResponse.json(
      { error: 'Failed to approve message' },
      { status: 500 }
    );
  }
}
