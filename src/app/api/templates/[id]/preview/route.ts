/**
 * Template Preview API
 * 
 * GET /api/templates/[id]/preview
 * Returns rendered HTML of the template with sample data
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/templates/[id]/preview
 * Returns the template HTML with sample webinar data for preview
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = params;

    // Fetch the template
    const template = await prisma.template.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        htmlCode: true,
      },
    });

    if (!template) {
      return new NextResponse('Template not found', { status: 404 });
    }

    // Sample data for preview
    const sampleData = {
      webinar: {
        title: 'How to Help Your Child Love Islam Without Force',
        description: 'Discover the deeper role every Muslim mom is meant to grow into — and in this free training, you\'ll discover it.',
        duration: '60',
        host: 'Ustadha Ariba Farheen',
        date: 'November 15, 2025',
        time: '2:00 PM EST',
      },
      schedules: `
        <div class="schedule-list">
          <div class="schedule-item">
            <strong>Session 1:</strong> November 15, 2025 at 2:00 PM EST
          </div>
          <div class="schedule-item">
            <strong>Session 2:</strong> November 16, 2025 at 2:00 PM EST
          </div>
          <div class="schedule-item">
            <strong>Session 3:</strong> November 17, 2025 at 2:00 PM EST
          </div>
        </div>
      `,
    };

    // Replace template variables with sample data
    let html = template.htmlCode;

    // Replace all variables
    html = html.replace(/\{\{webinar\.title\}\}/g, sampleData.webinar.title);
    html = html.replace(/\{\{webinar\.description\}\}/g, sampleData.webinar.description);
    html = html.replace(/\{\{webinar\.duration\}\}/g, sampleData.webinar.duration);
    html = html.replace(/\{\{webinar\.host\}\}/g, sampleData.webinar.host);
    html = html.replace(/\{\{webinar\.date\}\}/g, sampleData.webinar.date);
    html = html.replace(/\{\{webinar\.time\}\}/g, sampleData.webinar.time);
    html = html.replace(/\{\{schedules\}\}/g, sampleData.schedules);

    // Add a preview banner at the top
    const previewBanner = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 20px;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 600;
        z-index: 999999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      ">
        🎨 TEMPLATE PREVIEW - Sample Data Shown
      </div>
      <div style="height: 48px;"></div>
    `;

    // Insert the banner right after <body> tag
    if (html.includes('<body')) {
      html = html.replace(/<body([^>]*)>/i, `<body$1>${previewBanner}`);
    } else {
      // If no body tag, wrap everything
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Template Preview</title></head><body>${previewBanner}${html}</body></html>`;
    }

    // Return HTML response
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'SAMEORIGIN', // Allow iframe embedding from same origin
      },
    });
  } catch (error) {
    console.error('Error generating template preview:', error);
    return new NextResponse('Failed to generate preview', { status: 500 });
  }
}
