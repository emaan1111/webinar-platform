import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Verify the comment belongs to this page before deleting
    const comment = await (prisma as any).contentComment.findFirst({
      where: { id: params.commentId, contentPageId: params.id },
    });
    if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await (prisma as any).contentComment.delete({
      where: { id: params.commentId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
