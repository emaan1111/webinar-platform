import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const page = await (prisma as any).contentPage.findUnique({
      where: { slug: params.slug },
    });

    if (!page || page.status !== 'published') {
      return new Response(
        `<!DOCTYPE html><html><head><title>Not Found</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8fafc;"><h1 style="color:#334155">Page not found</h1></body></html>`,
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Track view (fire & forget)
    (prisma as any).contentPage.update({
      where: { id: page.id },
      data: { views: { increment: 1 } },
    }).catch(() => {});

    return new Response(page.htmlContent, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    console.error('Failed to serve content page:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
