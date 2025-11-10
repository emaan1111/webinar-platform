import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/embed/[webinarId] - Serve embeddable registration form
export async function GET(
  request: NextRequest,
  { params }: { params: { webinarId: string } }
) {
  try {
    const webinarId = params.webinarId;
    const url = new URL(request.url);
    const theme = url.searchParams.get('theme') || 'default';
    const formType = url.searchParams.get('type') || 'inline'; // inline or popup

    // Fetch webinar details
    const webinar = await prisma.webinar.findUnique({
      where: { id: webinarId },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        schedules: {
          where: { isActive: true },
          select: {
            id: true,
            scheduleType: true,
            scheduledAt: true,
            minutesFromReg: true,
            timezone: true,
          }
        }
      }
    });

    if (!webinar) {
      return new NextResponse('Webinar not found', { status: 404 });
    }

    // Generate the embeddable HTML/JS
    const embedCode = generateEmbedCode(webinar, theme, formType, request.headers.get('origin') || '');

    return new NextResponse(embedCode, {
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*', // Allow embedding on any site
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    });
  } catch (error) {
    console.error('Embed error:', error);
    return new NextResponse('Error generating embed', { status: 500 });
  }
}

function generateEmbedCode(webinar: any, theme: string, formType: string, origin: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const embedId = `webinar-embed-${webinar.id}`;

  // Generate theme-specific styles
  const themeStyles = getThemeStyles(theme);

  if (formType === 'popup') {
    return `
(function() {
  ${themeStyles}

  // Create popup trigger button if it doesn't exist
  var triggerButton = document.querySelector('[data-webinar-popup="${webinar.id}"]');
  if (!triggerButton) {
    console.warn('No trigger button found. Add data-webinar-popup="${webinar.id}" to a button.');
    return;
  }

  // Create popup modal
  var modal = document.createElement('div');
  modal.id = '${embedId}-modal';
  modal.className = 'webinar-popup-overlay';
  modal.innerHTML = \`
    <div class="webinar-popup-container">
      <button class="webinar-popup-close">&times;</button>
      <div class="webinar-popup-content">
        <h2>${escapeHtml(webinar.title)}</h2>
        <p>${escapeHtml(webinar.description || '')}</p>
        <form id="${embedId}-form" class="webinar-embed-form">
          <input type="text" name="name" placeholder="Your Name" required class="webinar-input" />
          <input type="email" name="email" placeholder="Your Email" required class="webinar-input" />
          <button type="submit" class="webinar-submit">Register Now</button>
        </form>
        <p class="webinar-powered">Powered by Your Webinar Platform</p>
      </div>
    </div>
  \`;

  document.body.appendChild(modal);

  // Show popup on button click
  triggerButton.addEventListener('click', function() {
    modal.style.display = 'flex';
  });

  // Close popup
  modal.querySelector('.webinar-popup-close').addEventListener('click', function() {
    modal.style.display = 'none';
  });

  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Handle form submission
  document.getElementById('${embedId}-form').addEventListener('submit', function(e) {
    e.preventDefault();
    var formData = new FormData(e.target);
    
    fetch('${baseUrl}/api/webinars/${webinar.id}/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name'),
        email: formData.get('email'),
        scheduleId: '${webinar.schedules[0]?.id || ''}',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      alert('Successfully registered! Check your email for details.');
      modal.style.display = 'none';
      e.target.reset();
    })
    .catch(function(err) {
      alert('Registration failed. Please try again.');
    });
  });
})();
    `;
  }

  // Default: Inline form
  return `
(function() {
  ${themeStyles}

  var container = document.getElementById('${embedId}');
  if (!container) {
    console.error('Container element not found. Add <div id="${embedId}"></div> to your page.');
    return;
  }

  container.innerHTML = \`
    <div class="webinar-embed-container theme-${theme}">
      <div class="webinar-embed-header">
        <h3>${escapeHtml(webinar.title)}</h3>
        <p>${escapeHtml(webinar.description || '')}</p>
      </div>
      <form id="${embedId}-form" class="webinar-embed-form">
        <input type="text" name="name" placeholder="Your Name" required class="webinar-input" />
        <input type="email" name="email" placeholder="Your Email" required class="webinar-input" />
        <input type="tel" name="phone" placeholder="Phone (optional)" class="webinar-input" />
        <button type="submit" class="webinar-submit">Register for Free</button>
      </form>
      <p class="webinar-powered">Powered by Your Webinar Platform</p>
    </div>
  \`;

  // Handle form submission
  document.getElementById('${embedId}-form').addEventListener('submit', function(e) {
    e.preventDefault();
    var submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';
    
    var formData = new FormData(e.target);
    
    fetch('${baseUrl}/api/webinars/${webinar.id}/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone') || '',
        scheduleId: '${webinar.schedules[0]?.id || ''}',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        gdprConsent: true,
        privacyConsent: true
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      container.innerHTML = \`
        <div class="webinar-embed-success">
          <h3>🎉 You're Registered!</h3>
          <p>Check your email for your webinar access link and calendar invite.</p>
        </div>
      \`;
    })
    .catch(function(err) {
      alert('Registration failed. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Register for Free';
    });
  });
})();
  `;
}

function getThemeStyles(theme: string) {
  const baseStyles = `
  var style = document.createElement('style');
  style.textContent = \`
    .webinar-embed-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 500px;
      margin: 0 auto;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    
    .webinar-embed-header h3 {
      margin: 0 0 10px 0;
      font-size: 24px;
      font-weight: 700;
    }
    
    .webinar-embed-header p {
      margin: 0 0 20px 0;
      font-size: 16px;
      color: #666;
    }
    
    .webinar-embed-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .webinar-input {
      padding: 12px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.3s;
    }
    
    .webinar-input:focus {
      outline: none;
      border-color: #6366f1;
    }
    
    .webinar-submit {
      padding: 14px 24px;
      font-size: 16px;
      font-weight: 600;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .webinar-submit:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    
    .webinar-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .webinar-powered {
      margin-top: 12px;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
    
    .webinar-embed-success {
      text-align: center;
      padding: 40px 20px;
    }
    
    .webinar-embed-success h3 {
      margin: 0 0 10px 0;
      font-size: 24px;
      color: #10b981;
    }
  `;

  const themeSpecific = {
    default: `
      background: white;
    }
    .webinar-submit {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    }
    `,
    modern: `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .webinar-embed-header h3, .webinar-embed-header p {
      color: white;
    }
    .webinar-input {
      background: rgba(255,255,255,0.9);
    }
    .webinar-submit {
      background: white;
      color: #667eea;
    }
    `,
    minimal: `
      background: #f9fafb;
      border: 2px solid #e5e7eb;
    }
    .webinar-submit {
      background: #111827;
    }
    `,
    vibrant: `
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }
    .webinar-embed-header h3, .webinar-embed-header p {
      color: white;
    }
    .webinar-input {
      background: rgba(255,255,255,0.95);
    }
    .webinar-submit {
      background: #dc2626;
    }
    `
  };

  const popupStyles = `
    .webinar-popup-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.6);
      z-index: 999999;
      justify-content: center;
      align-items: center;
    }
    
    .webinar-popup-container {
      position: relative;
      background: white;
      padding: 40px;
      border-radius: 16px;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    
    .webinar-popup-close {
      position: absolute;
      top: 15px;
      right: 15px;
      background: none;
      border: none;
      font-size: 32px;
      cursor: pointer;
      color: #999;
      line-height: 1;
      padding: 0;
      width: 32px;
      height: 32px;
    }
    
    .webinar-popup-close:hover {
      color: #333;
    }
    
    .webinar-popup-content h2 {
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    
    .webinar-popup-content p {
      margin: 0 0 20px 0;
      color: #666;
    }
  `;

  return baseStyles + (themeSpecific[theme as keyof typeof themeSpecific] || themeSpecific.default) + popupStyles + `\`;
  document.head.appendChild(style);`;
}

function escapeHtml(text: string) {
  const div = { textContent: text };
  return JSON.stringify(text).slice(1, -1);
}
