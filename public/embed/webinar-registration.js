/**
 * External Webinar Registration Widget
 * 
 * Embeddable registration form for use on external pages (ClickFunnels, etc.)
 * Styled to match the internal webinar registration modal.
 * 
 * USAGE:
 * 1. Add this script to your page:
 *    <script src="https://yourapp.com/embed/webinar-registration.js"></script>
 * 
 * 2. Add a container div with the webinar ID:
 *    <div id="webinar-registration" data-webinar-id="YOUR_WEBINAR_ID"></div>
 * 
 * 3. Optional attributes:
 *    - data-api-base="https://yourapp.com" (required for cross-origin)
 *    - data-lead-page-id="your-lead-page-id" (for tracking)
 *    - data-button-text="Complete Registration"
 *    - data-show-phone="true"
 *    - data-redirect-url="https://example.com/thank-you" (redirect after success)
 *    - data-popup="true" (show as popup modal instead of inline)
 */

(function() {
  'use strict';

  // Find the container
  const container = document.getElementById('webinar-registration') || 
                    document.querySelector('[data-webinar-id]');
  
  if (!container) {
    console.error('Webinar registration widget: No container found. Add <div id="webinar-registration" data-webinar-id="YOUR_ID"></div>');
    return;
  }

  // Get configuration from data attributes
  const webinarId = container.dataset.webinarId;
  const apiBase = container.dataset.apiBase || window.location.origin;
  const leadPageId = container.dataset.leadPageId;
  const buttonText = container.dataset.buttonText || 'Complete Registration';
  const showPhone = container.dataset.showPhone !== 'false'; // Default true
  const redirectUrl = container.dataset.redirectUrl;
  const isPopup = container.dataset.popup === 'true';

  if (!webinarId) {
    console.error('Webinar registration widget: data-webinar-id is required');
    container.innerHTML = '<p style="color:red;">Configuration error: Missing webinar ID</p>';
    return;
  }

  // Get user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const getTimezoneFriendlyName = (tz) => tz.split('/').pop()?.replace(/_/g, ' ') || tz;

  // State
  let schedules = [];
  let webinarName = '';

  // Styles matching internal modal design
  const styles = `
    .wr-modal-backdrop { position: fixed; inset: 0; background: rgba(107, 114, 128, 0.75); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .wr-modal { position: relative; background: white; border-radius: 16px; max-width: 512px; width: 100%; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
    .wr-inline { background: white; border-radius: 16px; max-width: 512px; width: 100%; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); }
    .wr-form { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wr-form * { box-sizing: border-box; }
    
    /* Header - Purple to Blue Gradient */
    .wr-header { background: linear-gradient(to right, #9333ea, #2563eb); padding: 16px 32px; position: relative; overflow: hidden; }
    .wr-header-circle1 { position: absolute; top: -40px; right: -40px; width: 160px; height: 160px; background: white; opacity: 0.1; border-radius: 50%; filter: blur(32px); }
    .wr-header-circle2 { position: absolute; bottom: -40px; left: -40px; width: 120px; height: 120px; background: #60a5fa; opacity: 0.2; border-radius: 50%; filter: blur(24px); }
    .wr-header h3 { font-size: 24px; font-weight: 800; color: white; margin: 0 0 4px 0; letter-spacing: -0.025em; position: relative; z-index: 1; }
    .wr-header p { color: #e9d5ff; font-size: 14px; font-weight: 500; margin: 0; position: relative; z-index: 1; }
    .wr-header-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; font-size: 12px; color: white; font-weight: 500; margin-top: 12px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(4px); position: relative; z-index: 1; }
    .wr-close-btn { position: absolute; top: 16px; right: 16px; background: none; border: none; color: rgba(255,255,255,0.8); cursor: pointer; padding: 4px; z-index: 10; }
    .wr-close-btn:hover { color: white; }
    
    /* Form Body */
    .wr-body { padding: 24px 32px; }
    .wr-field { margin-bottom: 16px; }
    .wr-input { width: 100%; padding: 12px 16px; background: white; border: 1px solid #e5e7eb; border-radius: 12px; font-size: 16px; color: #111827; font-weight: 500; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all 0.2s; }
    .wr-input::placeholder { color: #9ca3af; }
    .wr-input:focus { outline: none; border-color: #9333ea; box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1); }
    .wr-select { width: 100%; padding: 12px 40px 12px 16px; background: white; border: 1px solid #e5e7eb; border-radius: 12px; font-size: 16px; color: #111827; font-weight: 500; box-shadow: 0 1px 2px rgba(0,0,0,0.05); cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); background-position: right 8px center; background-repeat: no-repeat; background-size: 24px 24px; }
    .wr-select:focus { outline: none; border-color: #9333ea; box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1); }
    
    /* Phone row */
    .wr-phone-row { display: flex; gap: 8px; }
    .wr-phone-code { width: 33%; min-width: 110px; }
    .wr-phone-number { flex: 1; }
    
    /* Schedule label */
    .wr-schedule-label { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 8px; }
    .wr-schedule-label svg { color: #9333ea; }
    .wr-required { color: #ef4444; }
    
    /* Timezone */
    .wr-timezone-row { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
    .wr-timezone { font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 4px; }
    .wr-timezone-change { font-size: 12px; color: #9333ea; font-weight: 600; text-decoration: underline; background: none; border: none; cursor: pointer; }
    
    /* Consent */
    .wr-consent { display: flex; align-items: flex-start; gap: 12px; margin-top: 16px; }
    .wr-consent input { margin-top: 4px; width: 20px; height: 20px; accent-color: #9333ea; cursor: pointer; }
    .wr-consent label { font-size: 14px; color: #374151; line-height: 1.4; }
    .wr-consent a { color: #9333ea; text-decoration: none; }
    .wr-consent a:hover { text-decoration: underline; }
    
    /* Buttons */
    .wr-buttons { display: flex; gap: 12px; margin-top: 16px; }
    .wr-btn-cancel { width: 33%; padding: 12px; border: 1px solid #d1d5db; border-radius: 12px; background: white; color: #374151; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .wr-btn-cancel:hover { background: #f9fafb; }
    .wr-btn-submit { flex: 1; padding: 12px; border: none; border-radius: 12px; color: white; font-size: 18px; font-weight: 700; cursor: pointer; transition: all 0.2s; background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%); box-shadow: 0 4px 14px rgba(255, 107, 107, 0.4); }
    .wr-btn-submit:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255, 107, 107, 0.5); }
    .wr-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    
    /* Trust Footer */
    .wr-trust { display: flex; align-items: flex-start; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #f3f4f6; }
    .wr-trust svg { color: #2563eb; flex-shrink: 0; }
    .wr-trust-title { font-size: 14px; font-weight: 700; color: #111827; margin: 0 0 2px 0; }
    .wr-trust-text { font-size: 12px; color: #6b7280; margin: 0; }
    
    /* Error */
    .wr-error { display: flex; align-items: flex-start; gap: 8px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
    .wr-error svg { color: #dc2626; flex-shrink: 0; margin-top: 2px; }
    .wr-error p { font-size: 14px; color: #991b1b; margin: 0; }
    
    /* Success */
    .wr-success { text-align: center; padding: 48px 32px; }
    .wr-success-icon { width: 64px; height: 64px; background: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
    .wr-success-icon svg { color: #16a34a; }
    .wr-success h3 { font-size: 24px; font-weight: 800; color: #111827; margin: 0 0 8px 0; }
    .wr-success p { font-size: 16px; color: #6b7280; margin: 0; }
    
    /* Loading */
    .wr-loading { text-align: center; padding: 48px 32px; }
    .wr-spinner { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #9333ea; border-radius: 50%; animation: wr-spin 1s linear infinite; margin: 0 auto 16px; }
    @keyframes wr-spin { to { transform: rotate(360deg); } }
    .wr-loading p { color: #6b7280; margin: 0; }
  `;

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  // SVG Icons
  const icons = {
    shield: `<svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`,
    clock: `<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path stroke-width="2" stroke-linecap="round" d="M12 6v6l4 2"/></svg>`,
    globe: `<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path stroke-width="2" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`,
    check: `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    alert: `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    close: `<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
    checkCircle: `<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd"/></svg>`,
  };

  // Helper to wrap content in modal or inline
  function wrapContent(content, showCloseBtn = false) {
    const closeBtn = showCloseBtn ? `<button class="wr-close-btn" onclick="document.getElementById('wr-modal-backdrop')?.remove()">${icons.close}</button>` : '';
    
    if (isPopup) {
      return `
        <div class="wr-modal-backdrop" id="wr-modal-backdrop">
          <div class="wr-modal wr-form">
            ${closeBtn}
            ${content}
          </div>
        </div>
      `;
    }
    return `<div class="wr-inline wr-form">${content}</div>`;
  }

  // Render loading state
  function renderLoading() {
    const content = `
      <div class="wr-loading">
        <div class="wr-spinner"></div>
        <p>Loading available times...</p>
      </div>
    `;
    container.innerHTML = wrapContent(content);
  }

  // Render success state
  function renderSuccess() {
    const content = `
      <div class="wr-success">
        <div class="wr-success-icon">${icons.checkCircle}</div>
        <h3>You're Registered!</h3>
        <p>Check your email for details about joining the webinar.</p>
      </div>
    `;
    container.innerHTML = wrapContent(content);
    
    // Redirect if configured
    if (redirectUrl) {
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 2000);
    }
  }

  // Render form
  function renderForm(error = '') {
    // Phone field
    const phoneField = showPhone ? `
      <div class="wr-field wr-phone-row">
        <select id="wr-phone-code" class="wr-select wr-phone-code">
          <option value="+1">+1 US</option>
          <option value="+44">+44 UK</option>
          <option value="+61">+61 AU</option>
          <option value="+91">+91 IN</option>
          <option value="+49">+49 DE</option>
          <option value="+33">+33 FR</option>
          <option value="+81">+81 JP</option>
          <option value="+86">+86 CN</option>
        </select>
        <input type="tel" id="wr-phone" class="wr-input wr-phone-number" placeholder="Phone number (optional)">
      </div>
    ` : '';

    // Schedule field
    let scheduleField = '';
    if (schedules.length > 0) {
      const options = schedules.map(s => 
        `<option value="${s.id}">${s.label}</option>`
      ).join('');
      
      scheduleField = `
        <div class="wr-field">
          <div class="wr-schedule-label">
            ${icons.clock}
            Select Webinar Time <span class="wr-required">*</span>
          </div>
          <select id="wr-schedule" class="wr-select" required>
            <option value="">Choose your preferred time...</option>
            ${options}
          </select>
          <div class="wr-timezone-row">
            <span class="wr-timezone">${icons.globe} Times shown in ${getTimezoneFriendlyName(userTimezone)}</span>
          </div>
        </div>
      `;
    }

    // Error HTML
    const errorHtml = error ? `
      <div class="wr-error">
        ${icons.alert}
        <p>${error}</p>
      </div>
    ` : '';

    const content = `
      <!-- Header -->
      <div class="wr-header">
        <div class="wr-header-circle1"></div>
        <div class="wr-header-circle2"></div>
        ${isPopup ? `<button class="wr-close-btn" onclick="document.getElementById('wr-modal-backdrop')?.remove()">${icons.close}</button>` : ''}
        <h3>Secure Your Spot!</h3>
        <p>Join thousands who've already registered</p>
        <div class="wr-header-badge">
          ${icons.shield}
          <span>100% Secure</span>
        </div>
      </div>
      
      <!-- Form Body -->
      <div class="wr-body">
        ${errorHtml}
        
        <form id="wr-form">
          <!-- Name -->
          <div class="wr-field">
            <input type="text" id="wr-name" class="wr-input" placeholder="Enter your full name *" required>
          </div>
          
          <!-- Email -->
          <div class="wr-field">
            <input type="email" id="wr-email" class="wr-input" placeholder="Enter your email address *" required>
          </div>
          
          ${phoneField}
          ${scheduleField}
          
          <!-- Consent -->
          <div class="wr-consent">
            <input type="checkbox" id="wr-consent" checked>
            <label for="wr-consent">
              I agree to the <a href="/privacy" target="_blank">Privacy Policy</a> and <a href="/terms" target="_blank">Terms of Service</a>. <span class="wr-required">*</span>
            </label>
          </div>
          
          <!-- Buttons -->
          <div class="wr-buttons">
            ${isPopup ? '<button type="button" class="wr-btn-cancel" onclick="document.getElementById(\'wr-modal-backdrop\')?.remove()">Cancel</button>' : ''}
            <button type="submit" class="wr-btn-submit" ${!isPopup ? 'style="width:100%"' : ''}>${buttonText}</button>
          </div>
          
          <!-- Trust Footer -->
          <div class="wr-trust">
            ${icons.check}
            <div>
              <p class="wr-trust-title">Your information is safe with us</p>
              <p class="wr-trust-text">We respect your privacy and never share your data with third parties.</p>
            </div>
          </div>
        </form>
      </div>
    `;

    container.innerHTML = isPopup ? `
      <div class="wr-modal-backdrop" id="wr-modal-backdrop">
        <div class="wr-modal wr-form">${content}</div>
      </div>
    ` : `<div class="wr-inline wr-form">${content}</div>`;

    // Attach submit handler
    document.getElementById('wr-form').addEventListener('submit', handleSubmit);
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('wr-name').value.trim();
    const email = document.getElementById('wr-email').value.trim().toLowerCase();
    const phoneCode = document.getElementById('wr-phone-code')?.value || '+1';
    const phoneNumber = document.getElementById('wr-phone')?.value?.trim() || '';
    const phone = phoneNumber ? `${phoneCode} ${phoneNumber.replace(/\D/g, '')}` : '';
    const scheduleSelect = document.getElementById('wr-schedule');
    const scheduleId = scheduleSelect?.value || schedules[0]?.id || '0';

    // Validation
    if (!name || !email) {
      renderForm('Name and email are required');
      return;
    }

    if (schedules.length > 1 && !scheduleSelect?.value) {
      renderForm('Please select a time');
      return;
    }

    // Disable button
    const button = container.querySelector('.wr-btn-submit');
    button.disabled = true;
    button.textContent = 'Registering...';

    try {
      const selectedSchedule = schedules.find(s => s.id === scheduleId);
      
      const response = await fetch(`${apiBase}/api/external-webinars/${webinarId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          scheduleId,
          scheduledStartTime: selectedSchedule?.label,
          timezone: userTimezone,
          leadPageId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      renderSuccess();
      
      // Fire custom event for tracking
      window.dispatchEvent(new CustomEvent('webinarRegistration', {
        detail: {
          webinarId,
          email,
          name,
          registrationId: result.registration?.id,
        }
      }));

    } catch (err) {
      button.disabled = false;
      button.textContent = buttonText;
      renderForm(err.message || 'Registration failed. Please try again.');
    }
  }

  // Initialize
  async function init() {
    renderLoading();

    try {
      const response = await fetch(
        `${apiBase}/api/external-webinars/${webinarId}/schedules?timezone=${encodeURIComponent(userTimezone)}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load schedules');
      }

      const data = await response.json();
      schedules = data.schedules || [];
      webinarName = data.webinarName;

      if (schedules.length === 0) {
        const noSchedulesContent = `
          <div class="wr-header">
            <div class="wr-header-circle1"></div>
            <div class="wr-header-circle2"></div>
            <h3>Secure Your Spot!</h3>
            <p>Registration coming soon</p>
          </div>
          <div class="wr-body" style="text-align:center;">
            <p style="color:#6B7280;margin:24px 0;">No sessions currently available. Please check back later.</p>
          </div>
        `;
        container.innerHTML = isPopup 
          ? `<div class="wr-modal-backdrop" id="wr-modal-backdrop"><div class="wr-modal wr-form">${noSchedulesContent}</div></div>`
          : `<div class="wr-inline wr-form">${noSchedulesContent}</div>`;
        return;
      }

      renderForm();

    } catch (err) {
      console.error('Webinar widget error:', err);
      const errorContent = `
        <div class="wr-header">
          <div class="wr-header-circle1"></div>
          <div class="wr-header-circle2"></div>
          <h3>Secure Your Spot!</h3>
          <p>Registration</p>
        </div>
        <div class="wr-body">
          <div class="wr-error">
            ${icons.alert}
            <p>Failed to load registration form. Please refresh the page.</p>
          </div>
        </div>
      `;
      container.innerHTML = isPopup 
        ? `<div class="wr-modal-backdrop" id="wr-modal-backdrop"><div class="wr-modal wr-form">${errorContent}</div></div>`
        : `<div class="wr-inline wr-form">${errorContent}</div>`;
    }
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
