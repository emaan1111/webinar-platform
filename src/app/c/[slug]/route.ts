import { prisma } from '@/lib/prisma';

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
  return m ? m[1] : null;
}

function buildOgTags(opts: { title: string; description: string; image: string; url: string }): string {
  const e = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return [
    `<meta property="og:type" content="website"/>`,
    `<meta property="og:title" content="${e(opts.title)}"/>`,
    `<meta property="og:description" content="${e(opts.description)}"/>`,
    `<meta property="og:image" content="${e(opts.image)}"/>`,
    `<meta property="og:url" content="${e(opts.url)}"/>`,
    `<meta name="twitter:card" content="summary_large_image"/>`,
    `<meta name="twitter:title" content="${e(opts.title)}"/>`,
    `<meta name="twitter:description" content="${e(opts.description)}"/>`,
    `<meta name="twitter:image" content="${e(opts.image)}"/>`,
  ].join('\n    ');
}

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const [page, settingsComment] = await Promise.all([
      (prisma as any).contentPage.findUnique({ where: { slug: params.slug } }),
      (prisma as any).contentComment.findFirst({
        where: { contentPage: { slug: params.slug }, name: '__admin__', text: { startsWith: '__settings__' } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

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

    // Parse admin settings for OG tags
    let settings: Record<string, string> = {};
    if (settingsComment?.text) {
      try { settings = JSON.parse(settingsComment.text.slice('__settings__'.length)); } catch {}
    }

    const pageTitle = settings.title || page.title || 'Watch Now';
    const pageDesc = settings.description || page.description || 'Join us for today\'s episode!';

    // Determine OG image: custom → YouTube thumbnail → fallback
    let ogImage = settings.ogImage || '';
    if (!ogImage && settings.videoUrl) {
      const ytId = extractYouTubeId(settings.videoUrl);
      if (ytId) ogImage = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    }
    if (!ogImage) ogImage = 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&q=80&w=1200';

    const pageUrl = req.url;
    const ogTags = buildOgTags({ title: pageTitle, description: pageDesc, image: ogImage, url: pageUrl });

    // Inject OG tags right after <head>
    const html = page.htmlContent.replace(/(<head[^>]*>)/i, `$1\n    ${ogTags}`);

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    console.error('Failed to serve content page:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
