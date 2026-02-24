import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const page = await (prisma as any).contentPage.findUnique({
      where: { slug: params.slug },
    });

    if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Only serve published pages publicly
    if (page.status !== 'published') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error('Failed to fetch content page by slug:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
