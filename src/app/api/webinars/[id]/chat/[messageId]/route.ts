import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/webinars/[id]/chat/[messageId] - Delete a chat message
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    // Verify the message belongs to this webinar
    const message = await prisma.chatMessage.findUnique({
      where: { id: params.messageId },
      select: { webinarId: true },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    if (message.webinarId !== params.id) {
      return NextResponse.json(
        { error: 'Message does not belong to this webinar' },
        { status: 403 }
      );
    }

    // Delete the message
    await prisma.chatMessage.delete({
      where: { id: params.messageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}

// PATCH /api/webinars/[id]/chat/[messageId] - Update a chat message
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const body = await request.json();

    // Verify the message belongs to this webinar
    const message = await prisma.chatMessage.findUnique({
      where: { id: params.messageId },
      select: { webinarId: true },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    if (message.webinarId !== params.id) {
      return NextResponse.json(
        { error: 'Message does not belong to this webinar' },
        { status: 403 }
      );
    }

    // Update the message
    const updated = await prisma.chatMessage.update({
      where: { id: params.messageId },
      data: {
        message: body.message,
        videoTimestamp: body.videoTimestamp,
        isHidden: body.isHidden,
      },
    });

    return NextResponse.json({ message: updated });
  } catch (error) {
    console.error('Error updating chat message:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}
