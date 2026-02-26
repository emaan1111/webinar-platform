import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

function rewritePageIdInHtml(html: string, newPageId: string): string {
  if (!html) return html;
  const patterns: RegExp[] = [
    /var\s+PAGE_ID\s*=\s*'[^']*';/,
    /var\s+PAGE_ID\s*=\s*"[^"]*";/,
    /const\s+PAGE_ID\s*=\s*'[^']*';/,
    /const\s+PAGE_ID\s*=\s*"[^"]*";/,
  ];

  for (const pattern of patterns) {
    if (pattern.test(html)) {
      return html.replace(pattern, `var PAGE_ID = '${newPageId}';`);
    }
  }

  return html;
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const original = await (prisma as any).contentPage.findUnique({
      where: { id: params.id },
    });
    if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Build a unique slug: base-copy, base-copy-2, base-copy-3, …
    const baseSlug = original.slug.replace(/-copy(-\d+)?$/, '') + '-copy';
    let slug = baseSlug;
    let i = 2;
    while (await (prisma as any).contentPage.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }

    const duplicate = await (prisma as any).contentPage.create({
      data: {
        title: `Copy of ${original.title}`,
        slug,
        description: original.description,
        htmlContent: '',
        status: 'draft',
      },
    });

    const duplicatedHtml = rewritePageIdInHtml(original.htmlContent, duplicate.id);

    const updatedDuplicate = await (prisma as any).contentPage.update({
      where: { id: duplicate.id },
      data: { htmlContent: duplicatedHtml },
    });

    return NextResponse.json(updatedDuplicate, { status: 201 });
  } catch (error) {
    console.error('Failed to duplicate content page:', error);
    return NextResponse.json({ error: 'Failed to duplicate content page' }, { status: 500 });
  }
}
