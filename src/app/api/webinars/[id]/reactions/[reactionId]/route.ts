import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/webinars/[id]/reactions/[reactionId] - Delete a reaction
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; reactionId: string } }
) {
  try {
    const reaction = await prisma.reaction.findUnique({
      where: { id: params.reactionId },
    });

    if (!reaction || reaction.webinarId !== params.id) {
      return NextResponse.json(
        { error: 'Reaction not found' },
        { status: 404 }
      );
    }

    await prisma.reaction.delete({
      where: { id: params.reactionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Reaction deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting reaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete reaction' },
      { status: 500 }
    );
  }
}

// PATCH /api/webinars/[id]/reactions/[reactionId] - Update a reaction
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; reactionId: string } }
) {
  try {
    const body = await request.json();
    const { isHidden, videoTimestamp, type } = body;

    const reaction = await prisma.reaction.findUnique({
      where: { id: params.reactionId },
    });

    if (!reaction || reaction.webinarId !== params.id) {
      return NextResponse.json(
        { error: 'Reaction not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (typeof isHidden === 'boolean') updateData.isHidden = isHidden;
    if (typeof videoTimestamp === 'number') updateData.videoTimestamp = videoTimestamp;
    if (type && ['heart', 'clap', 'thumbsUp'].includes(type)) updateData.type = type;

    const updated = await prisma.reaction.update({
      where: { id: params.reactionId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      reaction: updated,
    });
  } catch (error) {
    console.error('Error updating reaction:', error);
    return NextResponse.json(
      { error: 'Failed to update reaction' },
      { status: 500 }
    );
  }
}
