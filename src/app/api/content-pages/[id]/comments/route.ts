import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const comments = await (prisma as any).contentComment.findMany({
      where: { contentPageId: params.id },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { name, text } = body;

    if (!name?.trim() || !text?.trim()) {
      return NextResponse.json({ error: 'name and text are required' }, { status: 400 });
    }

    // Ensure page exists
    const page = await (prisma as any).contentPage.findUnique({ where: { id: params.id } });
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

    const comment = await (prisma as any).contentComment.create({
      data: {
        contentPageId: params.id,
        name: name.trim().slice(0, 100),
        text: text.trim().slice(0, 2000),
      }
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Failed to post comment:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
