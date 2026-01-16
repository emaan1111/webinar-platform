import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const leadPages = await prisma.leadPage.findMany({
      include: {
        webinar: {
          select: { title: true }
        },
        template: {
          select: { name: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(leadPages);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch lead pages' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { name, slug, type, webinarId, templateId, htmlContent } = body;

    const leadPage = await prisma.leadPage.create({
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
    return NextResponse.json({ error: 'Failed to create lead page' }, { status: 500 });
  }
}
