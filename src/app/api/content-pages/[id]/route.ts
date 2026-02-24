import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const page = await (prisma as any).contentPage.findUnique({
      where: { id: params.id },
      include: { comments: { orderBy: { createdAt: 'desc' } } }
    });
    if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(page);
  } catch (error) {
    console.error('Failed to fetch content page:', error);
    return NextResponse.json({ error: 'Failed to fetch content page' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { title, slug, description, htmlContent, status } = body;

    const page = await (prisma as any).contentPage.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-') }),
        ...(description !== undefined && { description }),
        ...(htmlContent !== undefined && { htmlContent }),
        ...(status !== undefined && { status }),
        updatedAt: new Date(),
      }
    });

    return NextResponse.json(page);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 409 });
    }
    console.error('Failed to update content page:', error);
    return NextResponse.json({ error: 'Failed to update content page' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await (prisma as any).contentPage.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete content page:', error);
    return NextResponse.json({ error: 'Failed to delete content page' }, { status: 500 });
  }
}
