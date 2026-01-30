import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// CORS headers for cross-origin embed requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'inline';

    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        schedules: {
          where: {
            isActive: true,
            startTime: { gte: new Date() },
          },
          orderBy: { startTime: 'asc' },
        },
        bundledWebinar: {
          select: {
            id: true,
            title: true,
            slug: true,
            schedules: {
              where: { isActive: true },
              orderBy: { scheduledAt: 'asc' },
            },
          },
        },
      },
    });

    if (!event) {
      return new NextResponse('Event not found', {
        status: 404,
        headers: corsHeaders,
      });
    }

    const apiBase = new URL(request.url).origin;
    const embedScript = generateEventEmbedScript(event, type, apiBase);

    return new NextResponse(embedScript, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Event embed script error:', error);
    return new NextResponse('Error generating embed script', {
      status: 500,
      headers: corsHeaders,
    });
  }
}

function generateEventEmbedScript(event: any, type: string, apiBase: string): string {
  const eventData = JSON.stringify({
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description,
    requirePhone: event.requirePhone,
    webinarOptional: event.webinarOptional,
    schedules: event.schedules.map((s: any) => ({
      id: s.id,
      startTime: s.startTime.toISOString(),
      timezone: s.timezone,
    })),
    hasBundledWebinar: !!event.bundledWebinar,
  });

  return `
(function() {
  'use strict';
  
  const EVENT_DATA = ${eventData};
  const API_BASE = '${apiBase}';
  const EVENT_SLUG = '${event.slug}';
  
  // Extract tracking parameters from multiple sources
  // Priority: 1. window.__WEBINAR_TRACKING__ (injected by lead page for srcDoc iframes)
  //           2. URL params (for direct access or regular iframes)
  const pageParams = new URLSearchParams(window.location.search);
  const injectedTracking = window.__WEBINAR_TRACKING__ || {};
  
  const TRACKING_PARAMS = {
    splitTestId: injectedTracking.splitTestId || pageParams.get('st') || pageParams.get('splitTestId') || null,
    variantId: injectedTracking.variantId || pageParams.get('v') || pageParams.get('splitTestVariantId') || null,
    leadPageId: injectedTracking.leadPageId || pageParams.get('lp') || pageParams.get('leadPageId') || null
  };
  
  console.log('🎯 Event Embed Script Loaded', {
    eventId: EVENT_DATA.id,
    trackingParams: TRACKING_PARAMS,
    source: injectedTracking.splitTestId ? 'injected' : 'url'
  });

  // Build iframe URL with tracking params
  function buildIframeUrl() {
    let url = API_BASE + '/embed-event/' + EVENT_SLUG;
    const params = [];
    if (TRACKING_PARAMS.splitTestId) params.push('st=' + encodeURIComponent(TRACKING_PARAMS.splitTestId));
    if (TRACKING_PARAMS.variantId) params.push('v=' + encodeURIComponent(TRACKING_PARAMS.variantId));
    if (TRACKING_PARAMS.leadPageId) params.push('lp=' + encodeURIComponent(TRACKING_PARAMS.leadPageId));
    if (params.length > 0) url += '?' + params.join('&');
    return url;
  }

  // Create and insert iframe
  function createEmbed() {
    const container = document.getElementById('event-embed-' + EVENT_SLUG);
    if (!container) {
      console.error('Event embed container not found: event-embed-' + EVENT_SLUG);
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.src = buildIframeUrl();
    iframe.width = '100%';
    iframe.height = '600';
    iframe.frameBorder = '0';
    iframe.style.border = 'none';
    iframe.style.maxWidth = '100%';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    
    container.appendChild(iframe);
    console.log('✅ Event embed iframe created with URL:', iframe.src);
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createEmbed);
  } else {
    createEmbed();
  }
})();
`;
}
