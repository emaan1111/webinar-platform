import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'popup' // 'popup' or 'inline'
    const theme = searchParams.get('theme') || 'purple' // 'purple', 'blue', etc.

    // Fetch webinar data
    const webinar = await prisma.webinar.findUnique({
      where: { id: params.id },
      include: {
        schedules: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' }
        },
        host: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!webinar) {
      return new NextResponse('Webinar not found', { status: 404 })
    }

    // Generate embed JavaScript
    const embedScript = generateEmbedScript(webinar, type, theme)

    return new NextResponse(embedScript, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'Access-Control-Allow-Origin': '*', // Allow embedding from any domain
      }
    })
  } catch (error) {
    console.error('Embed script error:', error)
    return new NextResponse('Error generating embed script', { status: 500 })
  }
}

function generateEmbedScript(webinar: any, type: string, theme: string): string {
  const webinarData = JSON.stringify({
    id: webinar.id,
    title: webinar.title,
    slug: webinar.slug,
    description: webinar.description,
    duration: webinar.duration,
    schedules: webinar.schedules,
    host: webinar.host
  })

  // Theme configurations matching page-client.tsx
  const themes: Record<string, any> = {
    purple: {
      headerBg: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
      headerText: '#ffffff',
      buttonBg: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
      buttonHoverBg: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
      focusColor: '#8b5cf6'
    },
    blue: {
      headerBg: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
      headerText: '#ffffff',
      buttonBg: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
      buttonHoverBg: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
      focusColor: '#3b82f6'
    },
    green: {
      headerBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      headerText: '#ffffff',
      buttonBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      buttonHoverBg: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      focusColor: '#10b981'
    }
  }

  const selectedTheme = themes[theme] || themes.purple

  return `
(function() {
  'use strict';
  
  const WEBINAR_DATA = ${webinarData};
  const THEME = ${JSON.stringify(selectedTheme)};
  const TYPE = '${type}';
  const API_BASE = '${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}';

  // CSS Styles
  const styles = \`
    .webinar-embed-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { 
        opacity: 0;
        transform: translateY(20px);
      }
      to { 
        opacity: 1;
        transform: translateY(0);
      }
    }

    .webinar-embed-modal {
      background: white;
      border-radius: 24px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.4s ease-out;
      position: relative;
    }

    .webinar-embed-header {
      background: \${THEME.headerBg};
      color: \${THEME.headerText};
      padding: 24px 32px;
      position: relative;
      overflow: hidden;
    }

    .webinar-embed-header::before {
      content: '';
      position: absolute;
      top: -100px;
      right: -100px;
      width: 200px;
      height: 200px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
    }

    .webinar-embed-close {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: 24px;
      line-height: 1;
    }

    .webinar-embed-close:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: rotate(90deg);
    }

    .webinar-embed-content {
      padding: 32px;
      max-height: calc(90vh - 120px);
      overflow-y: auto;
    }

    .webinar-embed-form-group {
      margin-bottom: 20px;
    }

    .webinar-embed-label {
      display: block;
      font-weight: 600;
      font-size: 14px;
      color: #374151;
      margin-bottom: 8px;
    }

    .webinar-embed-input,
    .webinar-embed-select {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 16px;
      transition: all 0.2s;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .webinar-embed-input:focus,
    .webinar-embed-select:focus {
      outline: none;
      border-color: \${THEME.focusColor};
      box-shadow: 0 0 0 3px \${THEME.focusColor}20;
    }

    .webinar-embed-phone-group {
      display: flex;
      gap: 8px;
    }

    .webinar-embed-country-code {
      width: 130px;
      flex-shrink: 0;
    }

    .webinar-embed-button {
      width: 100%;
      padding: 16px 32px;
      background: \${THEME.buttonBg};
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);
    }

    .webinar-embed-button:hover {
      background: \${THEME.buttonHoverBg};
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
    }

    .webinar-embed-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .webinar-embed-error {
      color: #dc2626;
      font-size: 14px;
      margin-top: 6px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .webinar-embed-success {
      text-align: center;
      padding: 40px;
    }

    .webinar-embed-success-icon {
      width: 80px;
      height: 80px;
      background: #10b981;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 48px;
    }

    .webinar-embed-trust-badge {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 16px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 20px;
      font-size: 14px;
      color: #1e40af;
    }

    /* Inline mode styles */
    .webinar-embed-inline {
      max-width: 600px;
      margin: 0 auto;
      padding: 32px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
  \`;

  // Inject styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Country codes
  const countryCodes = [
    { code: '+1', country: 'US/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+91', country: 'India' },
    { code: '+971', country: 'UAE' },
    { code: '+966', country: 'Saudi Arabia' },
    { code: '+92', country: 'Pakistan' },
  ];

  // Format schedule time
  function formatScheduleTime(schedule) {
    if (schedule.scheduleType === 'justInTime') {
      return \`Starts \${schedule.minutesFromReg} minutes after registration\`;
    }
    if (schedule.scheduleType === 'recurring') {
      return \`Recurring: \${schedule.recurringPattern}\`;
    }
    if (schedule.scheduledAt) {
      const date = new Date(schedule.scheduledAt);
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    }
    return 'Schedule TBD';
  }

  // Create registration form HTML
  function createFormHTML() {
    const scheduleOptions = WEBINAR_DATA.schedules.map(s => 
      \`<option value="\${s.id}">\${formatScheduleTime(s)}</option>\`
    ).join('');

    const countryCodeOptions = countryCodes.map(cc =>
      \`<option value="\${cc.code}">\${cc.code} \${cc.country}</option>\`
    ).join('');

    return \`
      <div class="webinar-embed-trust-badge">
        🔒 Your information is safe with us. We never share your data.
      </div>

      <div class="webinar-embed-form-group">
        <label class="webinar-embed-label">Full Name *</label>
        <input type="text" class="webinar-embed-input" id="embed-name" required placeholder="John Doe">
        <div class="webinar-embed-error" id="error-name" style="display: none;"></div>
      </div>

      <div class="webinar-embed-form-group">
        <label class="webinar-embed-label">Email Address *</label>
        <input type="email" class="webinar-embed-input" id="embed-email" required placeholder="john@example.com">
        <div class="webinar-embed-error" id="error-email" style="display: none;"></div>
      </div>

      <div class="webinar-embed-form-group">
        <label class="webinar-embed-label">Phone Number *</label>
        <div class="webinar-embed-phone-group">
          <select class="webinar-embed-select webinar-embed-country-code" id="embed-country-code">
            \${countryCodeOptions}
          </select>
          <input type="tel" class="webinar-embed-input" id="embed-phone" required placeholder="555 123 4567">
        </div>
        <div class="webinar-embed-error" id="error-phone" style="display: none;"></div>
      </div>

      <div class="webinar-embed-form-group">
        <label class="webinar-embed-label">Select Webinar Time *</label>
        <select class="webinar-embed-select" id="embed-schedule" required>
          <option value="">Choose a time...</option>
          \${scheduleOptions}
        </select>
        <div class="webinar-embed-error" id="error-schedule" style="display: none;"></div>
      </div>

      <button type="submit" class="webinar-embed-button" id="embed-submit">
        Reserve My Spot
      </button>
    \`;
  }

  // Validation
  function validateForm() {
    const name = document.getElementById('embed-name').value.trim();
    const email = document.getElementById('embed-email').value.trim();
    const phone = document.getElementById('embed-phone').value.trim();
    const schedule = document.getElementById('embed-schedule').value;

    let isValid = true;
    const errors = {};

    // Clear previous errors
    document.querySelectorAll('.webinar-embed-error').forEach(el => el.style.display = 'none');

    if (!name) {
      errors.name = 'Name is required';
      isValid = false;
    }

    if (!email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      errors.email = 'Valid email is required';
      isValid = false;
    }

    if (!phone || phone.length < 8) {
      errors.phone = 'Valid phone number is required';
      isValid = false;
    }

    if (!schedule) {
      errors.schedule = 'Please select a webinar time';
      isValid = false;
    }

    // Display errors
    Object.keys(errors).forEach(field => {
      const errorEl = document.getElementById(\`error-\${field}\`);
      if (errorEl) {
        errorEl.textContent = errors[field];
        errorEl.style.display = 'flex';
      }
    });

    return { isValid, data: isValid ? { name, email, phone, schedule } : null };
  }

  // Submit registration
  async function submitRegistration(data) {
    const submitBtn = document.getElementById('embed-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';

    try {
      const countryCode = document.getElementById('embed-country-code').value;
      
      const response = await fetch(\`\${API_BASE}/api/webinars/\${WEBINAR_DATA.id}/register\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: countryCode + data.phone,
          scheduleId: data.schedule,
        })
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const result = await response.json();
      
      // Show success message
      showSuccess();
      
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Reserve My Spot';
    }
  }

  // Show success message
  function showSuccess() {
    const contentEl = document.querySelector('.webinar-embed-content') || document.getElementById('webinar-embed-${webinar.id}');
    contentEl.innerHTML = \`
      <div class="webinar-embed-success">
        <div class="webinar-embed-success-icon">✓</div>
        <h2 style="font-size: 28px; font-weight: 700; color: #1f2937; margin-bottom: 12px;">
          You're Registered!
        </h2>
        <p style="font-size: 16px; color: #6b7280; margin-bottom: 24px;">
          Check your email for confirmation and webinar details.
        </p>
        <button onclick="window.location.reload()" style="padding: 12px 24px; background: #8b5cf6; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
          Close
        </button>
      </div>
    \`;
  }

  // Create popup modal
  function createPopupModal() {
    const overlay = document.createElement('div');
    overlay.className = 'webinar-embed-overlay';
    overlay.innerHTML = \`
      <div class="webinar-embed-modal">
        <div class="webinar-embed-header">
          <button class="webinar-embed-close" onclick="this.closest('.webinar-embed-overlay').remove()">×</button>
          <h2 style="font-size: 24px; font-weight: 800; margin: 0 0 8px 0;">Register for \${WEBINAR_DATA.title}</h2>
          <p style="margin: 0; opacity: 0.9; font-size: 14px;">Join us for this exclusive webinar</p>
        </div>
        <div class="webinar-embed-content">
          <form id="webinar-embed-form">
            \${createFormHTML()}
          </form>
        </div>
      </div>
    \`;

    document.body.appendChild(overlay);

    // Handle form submission
    const form = document.getElementById('webinar-embed-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const validation = validateForm();
      if (validation.isValid) {
        await submitRegistration(validation.data);
      }
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }

  // Initialize based on type
  if (TYPE === 'popup') {
    // Find all buttons with data-webinar-popup attribute
    document.addEventListener('DOMContentLoaded', () => {
      const buttons = document.querySelectorAll(\`[data-webinar-popup="\${WEBINAR_DATA.id}"]\`);
      buttons.forEach(button => {
        button.addEventListener('click', createPopupModal);
      });
    });

    // If already loaded, attach immediately
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      const buttons = document.querySelectorAll(\`[data-webinar-popup="\${WEBINAR_DATA.id}"]\`);
      buttons.forEach(button => {
        button.addEventListener('click', createPopupModal);
      });
    }
  } else {
    // Inline mode
    const container = document.getElementById(\`webinar-embed-\${WEBINAR_DATA.id}\`);
    if (container) {
      container.className = 'webinar-embed-inline';
      container.innerHTML = \`
        <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #1f2937;">Register for \${WEBINAR_DATA.title}</h2>
        <p style="font-size: 16px; color: #6b7280; margin-bottom: 24px;">\${WEBINAR_DATA.description}</p>
        <form id="webinar-embed-form">
          \${createFormHTML()}
        </form>
      \`;

      const form = document.getElementById('webinar-embed-form');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const validation = validateForm();
        if (validation.isValid) {
          await submitRegistration(validation.data);
        }
      });
    }
  }
})();
  `.trim()
}
