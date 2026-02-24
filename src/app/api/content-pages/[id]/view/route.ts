import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    await (prisma as any).contentPage.update({
      where: { id: params.id },
      data: { views: { increment: 1 } }
    });
    return NextResponse.json({ success: true });
  } catch {
    // Silently fail — view tracking is non-critical
    return NextResponse.json({ success: false });
  }
}
