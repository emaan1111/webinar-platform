import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// PATCH /api/webinars/[id]/chat/[messageId]/reject - Reject/hide a message
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is host/admin
    const webinar = await prisma.webinar.findFirst({
      where: {
        id: params.id,
        hostId: (session.user as any).id,
      },
    });

    if (!webinar) {
      return NextResponse.json(
        { error: 'Not authorized to manage messages for this webinar' },
        { status: 403 }
      );
    }

    // Reject the message (hide it)
    const message = await prisma.chatMessage.update({
      where: { id: params.messageId },
      data: {
        isHidden: true,
        isApproved: false,
      },
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('Error rejecting message:', error);
    return NextResponse.json(
      { error: 'Failed to reject message' },
      { status: 500 }
    );
  }
}
