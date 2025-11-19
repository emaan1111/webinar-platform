import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// CORS headers for cross-origin embed requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

// OPTIONS handler for preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

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
      return new NextResponse('Webinar not found', { 
        status: 404,
        headers: corsHeaders
      })
    }

    // Get the API base URL from the request
    const apiBase = new URL(request.url).origin

    // Generate embed JavaScript
    const embedScript = generateEmbedScript(webinar, type, theme, apiBase)

    return new NextResponse(embedScript, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        ...corsHeaders
      }
    })
  } catch (error) {
    console.error('Embed script error:', error)
    return new NextResponse('Error generating embed script', { 
      status: 500,
      headers: corsHeaders
    })
  }
}

// Purple theme: Split-screen layout with left info, right form
function generatePurpleInlineStyles(theme: any): string {
  return `
    .webinar-embed-inline {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0;
      background: white;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }

    .webinar-embed-inline-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      min-height: 600px;
    }

    .webinar-embed-inline-info {
      background: ${theme.headerBg};
      color: ${theme.headerText};
      padding: 48px 40px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .webinar-embed-inline-info h2 {
      font-size: 32px;
      font-weight: 800;
      margin: 0 0 16px 0;
      line-height: 1.2;
    }

    .webinar-embed-inline-info p {
      font-size: 16px;
      opacity: 0.95;
      line-height: 1.6;
      margin: 0 0 32px 0;
    }

    .webinar-embed-inline-features {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .webinar-embed-inline-features li {
      padding: 12px 0;
      display: flex;
      align-items: center;
      font-size: 15px;
      opacity: 0.9;
    }

    .webinar-embed-inline-features li:before {
      content: '✓';
      margin-right: 12px;
      font-size: 20px;
      font-weight: bold;
    }

    .webinar-embed-inline-form {
      padding: 48px 40px;
      background: #fafafa;
    }

    @media (max-width: 768px) {
      .webinar-embed-inline-grid {
        grid-template-columns: 1fr;
      }
      .webinar-embed-inline-info {
        padding: 32px 24px;
      }
      .webinar-embed-inline-form {
        padding: 32px 24px;
      }
    }
  `;
}

// Blue theme: Top banner layout with horizontal design
function generateBlueInlineStyles(theme: any): string {
  return `
    .webinar-embed-inline {
      max-width: 900px;
      margin: 0 auto;
      padding: 0;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      overflow: hidden;
    }

    .webinar-embed-inline-banner {
      background: ${theme.headerBg};
      color: ${theme.headerText};
      padding: 40px 48px;
      text-align: center;
      position: relative;
    }

    .webinar-embed-inline-banner:after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.3) 100%);
    }

    .webinar-embed-inline-banner h2 {
      font-size: 36px;
      font-weight: 800;
      margin: 0 0 12px 0;
      letter-spacing: -0.5px;
    }

    .webinar-embed-inline-banner p {
      font-size: 18px;
      margin: 0;
      opacity: 0.95;
    }

    .webinar-embed-inline-form {
      padding: 40px 48px;
      background: white;
    }

    .webinar-embed-inline-form-title {
      text-align: center;
      font-size: 22px;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 32px 0;
    }

    @media (max-width: 768px) {
      .webinar-embed-inline-banner {
        padding: 32px 24px;
      }
      .webinar-embed-inline-banner h2 {
        font-size: 28px;
      }
      .webinar-embed-inline-form {
        padding: 32px 24px;
      }
    }
  `;
}

// Green theme: Compact card layout with centered design
function generateGreenInlineStyles(theme: any): string {
  return `
    .webinar-embed-inline {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px;
      background: white;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      border: 3px solid transparent;
      background-image: linear-gradient(white, white), ${theme.headerBg};
      background-origin: border-box;
      background-clip: padding-box, border-box;
    }

    .webinar-embed-inline-card-header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 2px solid #f3f4f6;
    }

    .webinar-embed-inline-icon {
      width: 64px;
      height: 64px;
      background: ${theme.headerBg};
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      font-size: 32px;
    }

    .webinar-embed-inline-card-header h2 {
      font-size: 28px;
      font-weight: 800;
      color: #1f2937;
      margin: 0 0 8px 0;
      line-height: 1.2;
    }

    .webinar-embed-inline-card-header p {
      font-size: 16px;
      color: #6b7280;
      margin: 0;
      line-height: 1.5;
    }

    .webinar-embed-inline-form {
      padding: 0;
    }

    @media (max-width: 768px) {
      .webinar-embed-inline {
        padding: 32px 24px;
      }
      .webinar-embed-inline-card-header h2 {
        font-size: 24px;
      }
    }
  `;
}

// Purple theme popup: Classic modal with gradient header
function generatePurplePopupStyles(theme: any): string {
  return `
    .webinar-embed-modal-purple {
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

    .webinar-embed-header-purple {
      background: ${theme.headerBg};
      color: ${theme.headerText};
      padding: 40px 32px 32px;
      position: relative;
      overflow: hidden;
    }

    .webinar-embed-header-purple::before {
      content: '';
      position: absolute;
      top: -100px;
      right: -100px;
      width: 200px;
      height: 200px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
    }

    .webinar-embed-header-purple h2 {
      font-size: 28px;
      font-weight: 800;
      margin: 0 0 8px 0;
      position: relative;
      z-index: 1;
    }

    .webinar-embed-header-purple p {
      margin: 0;
      opacity: 0.95;
      font-size: 16px;
      position: relative;
      z-index: 1;
    }

    .webinar-embed-content-purple {
      padding: 32px;
      max-height: calc(90vh - 140px);
      overflow-y: auto;
    }
  `;
}

// Blue theme popup: Side image with form (wide modal)
function generateBluePopupStyles(theme: any): string {
  return `
    .webinar-embed-modal-blue {
      background: white;
      border-radius: 20px;
      max-width: 900px;
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.6);
      animation: slideUp 0.4s ease-out;
      position: relative;
      display: grid;
      grid-template-columns: 1fr 1.3fr;
    }

    .webinar-embed-modal-blue-image {
      background: ${theme.headerBg};
      padding: 48px 32px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      color: ${theme.headerText};
      position: relative;
    }

    .webinar-embed-modal-blue-image::after {
      content: '';
      position: absolute;
      bottom: -50px;
      right: -50px;
      width: 200px;
      height: 200px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
    }

    .webinar-embed-modal-blue-icon {
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      margin-bottom: 24px;
    }

    .webinar-embed-modal-blue-image h2 {
      font-size: 32px;
      font-weight: 800;
      margin: 0 0 16px 0;
      line-height: 1.2;
    }

    .webinar-embed-modal-blue-image p {
      font-size: 16px;
      margin: 0;
      opacity: 0.95;
      line-height: 1.6;
    }

    .webinar-embed-content-blue {
      padding: 48px 40px;
      max-height: 90vh;
      overflow-y: auto;
      background: #fafafa;
    }

    @media (max-width: 768px) {
      .webinar-embed-modal-blue {
        grid-template-columns: 1fr;
        max-width: 600px;
      }
      .webinar-embed-modal-blue-image {
        padding: 32px 24px;
      }
      .webinar-embed-content-blue {
        padding: 32px 24px;
      }
    }
  `;
}

// Green theme popup: Minimal card with border
function generateGreenPopupStyles(theme: any): string {
  return `
    .webinar-embed-modal-green {
      background: white;
      border-radius: 28px;
      max-width: 550px;
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 20px 60px -10px rgba(0, 0, 0, 0.4);
      animation: slideUp 0.4s ease-out;
      position: relative;
      border: 4px solid transparent;
      background-image: linear-gradient(white, white), ${theme.headerBg};
      background-origin: border-box;
      background-clip: padding-box, border-box;
    }

    .webinar-embed-header-green {
      padding: 40px 32px 32px;
      text-align: center;
      border-bottom: 2px solid #f3f4f6;
    }

    .webinar-embed-modal-green-icon {
      width: 80px;
      height: 80px;
      background: ${theme.headerBg};
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      margin: 0 auto 20px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }

    .webinar-embed-header-green h2 {
      font-size: 26px;
      font-weight: 800;
      color: #1f2937;
      margin: 0 0 8px 0;
      line-height: 1.2;
    }

    .webinar-embed-header-green p {
      font-size: 15px;
      color: #6b7280;
      margin: 0;
      line-height: 1.5;
    }

    .webinar-embed-content-green {
      padding: 32px;
      max-height: calc(90vh - 220px);
      overflow-y: auto;
    }
  `;
}

function generateEmbedScript(webinar: any, type: string, theme: string, apiBase: string): string {
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

  // Generate theme-specific inline styles
  const themeInlineStyles: Record<string, string> = {
    purple: generatePurpleInlineStyles(selectedTheme),
    blue: generateBlueInlineStyles(selectedTheme),
    green: generateGreenInlineStyles(selectedTheme)
  }
  const inlineStyles = themeInlineStyles[theme] || themeInlineStyles.purple

  // Generate theme-specific popup styles
  const themePopupStyles: Record<string, string> = {
    purple: generatePurplePopupStyles(selectedTheme),
    blue: generateBluePopupStyles(selectedTheme),
    green: generateGreenPopupStyles(selectedTheme)
  }
  const popupThemeStyles = themePopupStyles[theme] || themePopupStyles.purple

  return `
(function() {
  'use strict';
  
  const WEBINAR_DATA = ${webinarData};
  const THEME = ${JSON.stringify(selectedTheme)};
  const TYPE = '${type}';
  const API_BASE = '${apiBase}';
  const THEME_NAME = '${theme}';
  
  console.log('🎯 Webinar Embed Script Loaded', {
    type: TYPE,
    theme: THEME_NAME,
    webinarId: WEBINAR_DATA.id,
    readyState: document.readyState
  });

  // CSS Styles
  const popupBaseStyles = \`
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
      z-index: 10;
    }

    .webinar-embed-close:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: rotate(90deg);
    }
  \`;

  const popupThemeStylesCSS = \`
    ${popupThemeStyles}
  \`;

  const sharedFormStyles = \`
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
  \`;

  const inlineStylesCSS = \`
    ${inlineStyles}
  \`;

  // Inject styles based on type
  const styleSheet = document.createElement('style');
  if (TYPE === 'popup') {
    styleSheet.textContent = popupBaseStyles + popupThemeStylesCSS + sharedFormStyles;
  } else {
    styleSheet.textContent = sharedFormStyles + inlineStylesCSS;
  }
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
    const contentEl = document.querySelector('.webinar-embed-content-purple, .webinar-embed-content-blue, .webinar-embed-content-green, .webinar-embed-content') 
      || document.getElementById(\`webinar-embed-\${WEBINAR_DATA.id}\`);
    
    if (contentEl) {
      contentEl.innerHTML = \`
        <div class="webinar-embed-success">
          <div class="webinar-embed-success-icon">✓</div>
          <h2 style="font-size: 28px; font-weight: 700; color: #1f2937; margin-bottom: 12px;">
            You're Registered!
          </h2>
          <p style="font-size: 16px; color: #6b7280; margin-bottom: 24px;">
            Check your email for confirmation and webinar details.
          </p>
          <button onclick="window.location.reload()" style="padding: 12px 24px; background: \${THEME.buttonBg}; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
            Close
          </button>
        </div>
      \`;
    }
  }

  // Create popup modal
  function createPopupModal() {
    const overlay = document.createElement('div');
    overlay.className = 'webinar-embed-overlay';
    
    let modalHTML = '';
    const formHTML = createFormHTML();
    
    if (THEME_NAME === 'purple') {
      // Purple: Classic gradient header modal
      modalHTML = \`
        <div class="webinar-embed-modal-purple">
          <div class="webinar-embed-header-purple">
            <button class="webinar-embed-close" onclick="this.closest('.webinar-embed-overlay').remove()">×</button>
            <h2>Register for \${WEBINAR_DATA.title}</h2>
            <p>Join us for this exclusive webinar</p>
          </div>
          <div class="webinar-embed-content-purple">
            <form id="webinar-embed-form">
              \${formHTML}
            </form>
          </div>
        </div>
      \`;
    } else if (THEME_NAME === 'blue') {
      // Blue: Wide modal with side image
      modalHTML = \`
        <div class="webinar-embed-modal-blue">
          <div class="webinar-embed-modal-blue-image">
            <div class="webinar-embed-modal-blue-icon">🎯</div>
            <h2>\${WEBINAR_DATA.title}</h2>
            <p>\${WEBINAR_DATA.description || 'Join us for this exclusive webinar session with industry experts.'}</p>
          </div>
          <div class="webinar-embed-content-blue">
            <button class="webinar-embed-close" onclick="this.closest('.webinar-embed-overlay').remove()" style="color: #374151;">×</button>
            <form id="webinar-embed-form">
              \${formHTML}
            </form>
          </div>
        </div>
      \`;
    } else if (THEME_NAME === 'green') {
      // Green: Minimal card with gradient border
      modalHTML = \`
        <div class="webinar-embed-modal-green">
          <button class="webinar-embed-close" onclick="this.closest('.webinar-embed-overlay').remove()" style="color: #374151;">×</button>
          <div class="webinar-embed-header-green">
            <div class="webinar-embed-modal-green-icon">🚀</div>
            <h2>\${WEBINAR_DATA.title}</h2>
            <p>\${WEBINAR_DATA.description || 'Limited spots available - Register today!'}</p>
          </div>
          <div class="webinar-embed-content-green">
            <form id="webinar-embed-form">
              \${formHTML}
            </form>
          </div>
        </div>
      \`;
    } else {
      // Default fallback
      modalHTML = \`
        <div class="webinar-embed-modal-purple">
          <div class="webinar-embed-header-purple">
            <button class="webinar-embed-close" onclick="this.closest('.webinar-embed-overlay').remove()">×</button>
            <h2>Register for \${WEBINAR_DATA.title}</h2>
            <p>Join us for this exclusive webinar</p>
          </div>
          <div class="webinar-embed-content-purple">
            <form id="webinar-embed-form">
              \${formHTML}
            </form>
          </div>
        </div>
      \`;
    }
    
    overlay.innerHTML = modalHTML;

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

  // Create theme-specific inline HTML
  function createInlineHTML(themeType) {
    const formHTML = createFormHTML();
    
    if (themeType === 'purple') {
      // Split-screen layout
      return \`
        <div class="webinar-embed-inline-grid">
          <div class="webinar-embed-inline-info">
            <h2>\${WEBINAR_DATA.title}</h2>
            <p>\${WEBINAR_DATA.description || 'Join us for this exclusive webinar session.'}</p>
            <ul class="webinar-embed-inline-features">
              <li>Live Q&A with experts</li>
              <li>Exclusive insights and strategies</li>
              <li>Certificate of completion</li>
              <li>Networking opportunities</li>
            </ul>
          </div>
          <div class="webinar-embed-inline-form">
            <form id="webinar-embed-form">
              \${formHTML}
            </form>
          </div>
        </div>
      \`;
    } else if (themeType === 'blue') {
      // Top banner layout
      return \`
        <div class="webinar-embed-inline-banner">
          <h2>\${WEBINAR_DATA.title}</h2>
          <p>\${WEBINAR_DATA.description || 'Register now to secure your spot!'}</p>
        </div>
        <div class="webinar-embed-inline-form">
          <div class="webinar-embed-inline-form-title">Complete the form below to register</div>
          <form id="webinar-embed-form">
            \${formHTML}
          </form>
        </div>
      \`;
    } else if (themeType === 'green') {
      // Compact card layout
      return \`
        <div class="webinar-embed-inline-card-header">
          <div class="webinar-embed-inline-icon">🎯</div>
          <h2>\${WEBINAR_DATA.title}</h2>
          <p>\${WEBINAR_DATA.description || 'Limited spots available - Register today!'}</p>
        </div>
        <div class="webinar-embed-inline-form">
          <form id="webinar-embed-form">
            \${formHTML}
          </form>
        </div>
      \`;
    } else {
      // Default/fallback layout
      return \`
        <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #1f2937;">Register for \${WEBINAR_DATA.title}</h2>
        <p style="font-size: 16px; color: #6b7280; margin-bottom: 24px;">\${WEBINAR_DATA.description}</p>
        <form id="webinar-embed-form">
          \${formHTML}
        </form>
      \`;
    }
  }

  // Initialize inline embed
  function initializeInlineEmbed() {
    console.log('[Webinar Embed] Initializing inline embed...');
    console.log('[Webinar Embed] Looking for container:', \`webinar-embed-\${WEBINAR_DATA.id}\`);
    
    const container = document.getElementById(\`webinar-embed-\${WEBINAR_DATA.id}\`);
    console.log('[Webinar Embed] Container found:', !!container);
    
    if (container) {
      console.log('[Webinar Embed] Setting up inline form...');
      container.className = 'webinar-embed-inline';
      container.innerHTML = createInlineHTML(THEME_NAME);

      const form = document.getElementById('webinar-embed-form');
      console.log('[Webinar Embed] Form found:', !!form);
      
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const validation = validateForm();
          if (validation.isValid) {
            await submitRegistration(validation.data);
          }
        });
      } else {
        console.error('[Webinar Embed] Form element not found after initialization');
      }
    } else {
      console.error('[Webinar Embed] Container not found:', \`webinar-embed-\${WEBINAR_DATA.id}\`);
      console.error('[Webinar Embed] Make sure you have a div with id:', \`webinar-embed-\${WEBINAR_DATA.id}\`);
    }
  }

  // Initialize popup embed
  function initializePopupEmbed() {
    console.log('[Webinar Embed] Initializing popup embed...');
    const buttons = document.querySelectorAll(\`[data-webinar-popup="\${WEBINAR_DATA.id}"]\`);
    console.log('[Webinar Embed] Found', buttons.length, 'popup buttons');
    buttons.forEach(button => {
      button.addEventListener('click', createPopupModal);
    });
  }

  // Initialize based on type
  console.log('[Webinar Embed] Script loaded. Type:', TYPE, 'Theme:', THEME_NAME, 'Webinar ID:', WEBINAR_DATA.id);
  console.log('[Webinar Embed] Document ready state:', document.readyState);
  
  if (TYPE === 'popup') {
    // Find all buttons with data-webinar-popup attribute
    if (document.readyState === 'loading') {
      console.log('[Webinar Embed] Waiting for DOM to load (popup mode)...');
      document.addEventListener('DOMContentLoaded', initializePopupEmbed);
    } else {
      console.log('[Webinar Embed] DOM already loaded, initializing popup...');
      initializePopupEmbed();
    }
  } else {
    // Inline mode - wait for DOM to be ready
    if (document.readyState === 'loading') {
      console.log('[Webinar Embed] Waiting for DOM to load (inline mode)...');
      document.addEventListener('DOMContentLoaded', initializeInlineEmbed);
    } else {
      // DOM is already ready, but use setTimeout to ensure container exists
      console.log('[Webinar Embed] DOM already loaded, initializing inline...');
      setTimeout(initializeInlineEmbed, 0);
    }
  }
})();
  `.trim()
}
