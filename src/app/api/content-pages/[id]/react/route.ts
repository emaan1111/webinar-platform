import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const VALID_REACTIONS = ['fire', 'heart', 'star'] as const;
type ReactionType = typeof VALID_REACTIONS[number];

const fieldMap: Record<ReactionType, string> = {
  fire: 'fireCount',
  heart: 'heartCount',
  star: 'starCount',
};

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const type = body.type as ReactionType;

    if (!VALID_REACTIONS.includes(type)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
    }

    const field = fieldMap[type];

    const updated = await (prisma as any).contentPage.update({
      where: { id: params.id },
      data: { [field]: { increment: 1 } },
      select: { fireCount: true, heartCount: true, starCount: true }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to record reaction:', error);
    return NextResponse.json({ error: 'Failed to record reaction' }, { status: 500 });
  }
}
