import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const versions = await prisma.leadPageVersion.findMany({
      where: { leadPageId: id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true,
        source: true,
        changeSummary: true,
        prompt: true,
        createdByEmail: true,
        createdAt: true,
        htmlContent: true,
      },
    });

    return NextResponse.json(
      versions.map((v) => ({
        id: v.id,
        source: v.source,
        changeSummary: v.changeSummary,
        prompt: v.prompt,
        createdByEmail: v.createdByEmail,
        createdAt: v.createdAt,
        charCount: v.htmlContent.length,
      }))
    );
  } catch (error) {
    console.error('Failed to fetch lead page versions:', error);
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const versionId = typeof body?.versionId === 'string' ? body.versionId : '';

    if (!versionId) {
      return NextResponse.json({ error: 'versionId is required' }, { status: 400 });
    }

    const [leadPage, version] = await Promise.all([
      prisma.leadPage.findUnique({
        where: { id },
        select: {
          id: true,
          type: true,
          htmlContent: true,
        },
      }),
      prisma.leadPageVersion.findUnique({
        where: { id: versionId },
        select: {
          id: true,
          leadPageId: true,
          htmlContent: true,
        },
      }),
    ]);

    if (!leadPage) {
      return NextResponse.json({ error: 'Lead page not found' }, { status: 404 });
    }

    if (leadPage.type !== 'CUSTOM') {
      return NextResponse.json({ error: 'Only custom HTML lead pages can be restored' }, { status: 400 });
    }

    if (!version || version.leadPageId !== id) {
      return NextResponse.json({ error: 'Version not found for this lead page' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.leadPageVersion.create({
        data: {
          leadPageId: id,
          htmlContent: leadPage.htmlContent || '',
          source: 'restore_checkpoint',
          changeSummary: 'Checkpoint before version restore',
          createdById: (session.user as any)?.id || null,
          createdByEmail: session.user?.email || null,
        },
      });

      await tx.leadPage.update({
        where: { id },
        data: {
          htmlContent: version.htmlContent,
          updatedAt: new Date(),
        },
      });

      await tx.leadPageVersion.create({
        data: {
          leadPageId: id,
          htmlContent: version.htmlContent,
          source: 'restore_apply',
          changeSummary: `Restored from version ${version.id}`,
          createdById: (session.user as any)?.id || null,
          createdByEmail: session.user?.email || null,
        },
      });
    });

    return NextResponse.json({
      success: true,
      htmlContent: version.htmlContent,
    });
  } catch (error) {
    console.error('Failed to restore lead page version:', error);
    return NextResponse.json({ error: 'Failed to restore version' }, { status: 500 });
  }
}
