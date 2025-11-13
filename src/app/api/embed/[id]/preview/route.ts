import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'popup'
    const theme = searchParams.get('theme') || 'purple'

    // Fetch webinar data
    const webinar = await prisma.webinar.findUnique({
      where: { id: params.id },
      include: {
        schedules: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!webinar) {
      return new NextResponse('Webinar not found', { status: 404 })
    }

    const baseUrl = new URL(request.url).origin

    // Generate preview HTML page
    const previewHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Embed Preview - ${webinar.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .preview-container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 40px;
      max-width: 800px;
      width: 100%;
    }
    .preview-header {
      text-align: center;
      margin-bottom: 30px;
    }
    .preview-header h1 {
      font-size: 28px;
      color: #1a202c;
      margin-bottom: 8px;
    }
    .preview-header p {
      color: #718096;
      font-size: 16px;
    }
    .preview-type {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }
    .type-popup {
      background: #EDE9FE;
      color: #7C3AED;
    }
    .type-inline {
      background: #DBEAFE;
      color: #2563EB;
    }
    .demo-button {
      display: inline-block;
      padding: 16px 32px;
      font-size: 18px;
      font-weight: 600;
      color: white;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);
    }
    .demo-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.6);
    }
    .demo-button:active {
      transform: translateY(0);
    }
    .inline-container {
      margin-top: 30px;
      padding: 20px;
      background: #f7fafc;
      border-radius: 12px;
    }
    .info-box {
      margin-top: 30px;
      padding: 20px;
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      border-radius: 8px;
    }
    .info-box h3 {
      color: #047857;
      margin-bottom: 8px;
      font-size: 16px;
    }
    .info-box p {
      color: #065f46;
      font-size: 14px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="preview-container">
    <div class="preview-header">
      <span class="preview-type ${type === 'popup' ? 'type-popup' : 'type-inline'}">
        ${type === 'popup' ? '🎯 Popup Mode' : '📋 Inline Mode'}
      </span>
      <h1>Embed Form Preview</h1>
      <p>${webinar.title}</p>
    </div>

    ${type === 'popup' ? `
      <div style="text-align: center;">
        <button class="demo-button" data-webinar-popup="${webinar.id}">
          Register for Webinar
        </button>
      </div>
      
      <div class="info-box">
        <h3>✅ How the Popup Works:</h3>
        <p>
          Click the button above to see the registration popup in action. 
          The form will open in a beautiful modal overlay. This is how it will 
          appear when embedded on your website.
        </p>
      </div>
    ` : `
      <div class="info-box">
        <h3>📋 Inline Form Preview:</h3>
        <p>
          The registration form will appear below, embedded directly in your page. 
          This is how it will look when added to your website.
        </p>
      </div>
      
      <div class="inline-container">
        <div id="webinar-embed-${webinar.id}"></div>
      </div>
    `}
  </div>

  <!-- Load the embed script -->
  <script src="${baseUrl}/api/embed/${webinar.id}?theme=${theme}&type=${type}"></script>
</body>
</html>
    `.trim()

    return new NextResponse(previewHtml, {
      headers: {
        'Content-Type': 'text/html',
      }
    })
  } catch (error) {
    console.error('Preview error:', error)
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body {
            font-family: system-ui;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f3f4f6;
          }
          .error-box {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
          }
          h1 { color: #ef4444; margin-bottom: 16px; }
          p { color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="error-box">
          <h1>⚠️ Error Loading Preview</h1>
          <p>Unable to load webinar embed preview. Please try again.</p>
        </div>
      </body>
      </html>
    `, { 
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}
