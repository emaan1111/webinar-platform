import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const pages = await (prisma as any).contentPage.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { comments: true } }
      }
    });
    return NextResponse.json(pages);
  } catch (error) {
    console.error('Failed to fetch content pages:', error);
    return NextResponse.json({ error: 'Failed to fetch content pages' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { title, slug, description, htmlContent, status } = body;

    if (!title || !slug || !htmlContent) {
      return NextResponse.json({ error: 'title, slug and htmlContent are required' }, { status: 400 });
    }

    const page = await (prisma as any).contentPage.create({
      data: {
        title,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        description: description || null,
        htmlContent,
        status: status || 'draft',
      }
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 409 });
    }
    console.error('Failed to create content page:', error);
    return NextResponse.json({ error: 'Failed to create content page' }, { status: 500 });
  }
}
