import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const leadPage = await prisma.leadPage.findUnique({
      where: { id: params.id }
    });
    
    if (!leadPage) {
       return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    return NextResponse.json(leadPage);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch lead page' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { name, slug, type, webinarId, templateId, htmlContent } = body;

    const leadPage = await prisma.leadPage.update({
      where: { id: params.id },
      data: {
        name,
        slug,
        type,
        webinarId,
        templateId: type === 'TEMPLATE' ? templateId : undefined,
        htmlContent: type === 'CUSTOM' ? htmlContent : undefined,
      }
    });

    return NextResponse.json(leadPage);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update lead page' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await prisma.leadPage.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete lead page' }, { status: 500 });
  }
}
