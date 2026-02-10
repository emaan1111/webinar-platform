import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const leadPage = await prisma.leadPage.findUnique({
      where: { id }
    });
    
    if (!leadPage) {
       return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    return NextResponse.json(leadPage);
  } catch (error) {
    console.error('Failed to fetch lead page:', error);
    return NextResponse.json({ error: 'Failed to fetch lead page' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, slug, type, webinarId, templateId, htmlContent } = body;

    const leadPage = await prisma.leadPage.update({
      where: { id },
      data: {
        name,
        slug,
        type,
        webinarId: webinarId || null,
        templateId: type === 'TEMPLATE' ? (templateId || null) : null,
        htmlContent: type === 'CUSTOM' ? (htmlContent || null) : null,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json(leadPage);
  } catch (error) {
    console.error('Failed to update lead page:', error);
    return NextResponse.json({ error: 'Failed to update lead page' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.leadPage.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete lead page:', error);
    return NextResponse.json({ error: 'Failed to delete lead page' }, { status: 500 });
  }
}
