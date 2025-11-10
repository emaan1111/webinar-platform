import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { webinarId: string } }
) {
  const url = new URL(request.url);
  const theme = url.searchParams.get('theme') || 'default';
  const formType = url.searchParams.get('type') || 'inline';

  const webinar = await prisma.webinar.findUnique({
    where: { id: params.webinarId },
    select: {
      id: true,
      title: true,
      description: true,
    }
  });

  if (!webinar) {
    return new NextResponse('Webinar not found', { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Embed Preview - ${webinar.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 40px 20px;
      margin: 0;
    }
    .preview-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .preview-header {
      background: white;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .preview-header h1 {
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    .preview-header p {
      margin: 0;
      color: #666;
    }
    .preview-content {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    ${formType === 'popup' ? `
    .popup-demo-button {
      display: inline-block;
      padding: 14px 28px;
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }
    .popup-demo-button:hover {
      background: #4f46e5;
      transform: translateY(-2px);
    }
    ` : ''}
  </style>
</head>
<body>
  <div class="preview-container">
    <div class="preview-header">
      <h1>📋 Embed Form Preview</h1>
      <p>This is how your ${formType} form will look on your website (Theme: ${theme})</p>
    </div>
    
    <div class="preview-content">
      ${formType === 'inline' ? `
        <div id="webinar-embed-${webinar.id}"></div>
        <script src="${baseUrl}/api/embed/${webinar.id}?theme=${theme}&type=inline"></script>
      ` : `
        <h2 style="margin-top: 0;">Click the button to see the popup:</h2>
        <button class="popup-demo-button" data-webinar-popup="${webinar.id}">
          Register for Webinar
        </button>
        <script src="${baseUrl}/api/embed/${webinar.id}?theme=${theme}&type=popup"></script>
      `}
    </div>
  </div>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    }
  });
}
