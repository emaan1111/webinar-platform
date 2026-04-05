/**
 * External Webinar Registration Widget
 * 
 * Embeddable registration form for use on external pages (ClickFunnels, etc.)
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
 *    - data-button-text="Reserve My Spot"
 *    - data-show-phone="true"
 *    - data-redirect-url="https://example.com/thank-you" (redirect after success)
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
  const buttonText = container.dataset.buttonText || 'Register Now';
  const showPhone = container.dataset.showPhone === 'true';
  const redirectUrl = container.dataset.redirectUrl;

  if (!webinarId) {
    console.error('Webinar registration widget: data-webinar-id is required');
    container.innerHTML = '<p style="color:red;">Configuration error: Missing webinar ID</p>';
    return;
  }

  // Get user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // State
  let schedules = [];
  let webinarName = '';

  // Styles (injected inline for portability)
  const styles = `
    .wr-form { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 400px; }
    .wr-form * { box-sizing: border-box; }
    .wr-field { margin-bottom: 16px; }
    .wr-label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 4px; }
    .wr-input, .wr-select { width: 100%; padding: 10px 12px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 16px; }
    .wr-input:focus, .wr-select:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
    .wr-button { width: 100%; padding: 12px 16px; background: #2563EB; color: white; font-size: 16px; font-weight: 600; border: none; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
    .wr-button:hover { background: #1D4ED8; }
    .wr-button:disabled { opacity: 0.6; cursor: not-allowed; }
    .wr-error { background: #FEF2F2; border: 1px solid #FECACA; color: #DC2626; padding: 12px; border-radius: 6px; margin-bottom: 16px; font-size: 14px; }
    .wr-success { text-align: center; padding: 24px; }
    .wr-success-icon { font-size: 48px; color: #10B981; margin-bottom: 12px; }
    .wr-success h3 { font-size: 20px; color: #111827; margin: 0 0 8px 0; }
    .wr-success p { color: #6B7280; margin: 0; }
    .wr-loading { text-align: center; padding: 24px; }
    .wr-spinner { width: 32px; height: 32px; border: 3px solid #E5E7EB; border-top-color: #3B82F6; border-radius: 50%; animation: wr-spin 1s linear infinite; margin: 0 auto 12px; }
    @keyframes wr-spin { to { transform: rotate(360deg); } }
    .wr-timezone { font-size: 12px; color: #9CA3AF; margin-top: 4px; }
    .wr-schedule-info { background: #F3F4F6; padding: 12px; border-radius: 6px; margin-bottom: 16px; }
    .wr-schedule-info p { margin: 0; font-size: 14px; color: #4B5563; }
  `;

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  // Render loading state
  function renderLoading() {
    container.innerHTML = `
      <div class="wr-form wr-loading">
        <div class="wr-spinner"></div>
        <p style="color:#6B7280;">Loading available times...</p>
      </div>
    `;
  }

  // Render success state
  function renderSuccess() {
    container.innerHTML = `
      <div class="wr-form wr-success">
        <div class="wr-success-icon">✓</div>
        <h3>You're Registered!</h3>
        <p>Check your email for details about joining the webinar.</p>
      </div>
    `;
    
    // Redirect if configured
    if (redirectUrl) {
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 2000);
    }
  }

  // Render form
  function renderForm(error = '') {
    const phoneField = showPhone ? `
      <div class="wr-field">
        <label class="wr-label" for="wr-phone">Phone Number</label>
        <input type="tel" id="wr-phone" class="wr-input" placeholder="+1 (555) 123-4567">
      </div>
    ` : '';

    let scheduleField = '';
    if (schedules.length > 1) {
      const options = schedules.map(s => 
        `<option value="${s.id}">${s.label}</option>`
      ).join('');
      
      scheduleField = `
        <div class="wr-field">
          <label class="wr-label" for="wr-schedule">Select a Time *</label>
          <select id="wr-schedule" class="wr-select" required>
            <option value="">Choose a time...</option>
            ${options}
          </select>
          <p class="wr-timezone">Times shown in your local timezone (${userTimezone})</p>
        </div>
      `;
    } else if (schedules.length === 1) {
      scheduleField = `
        <div class="wr-schedule-info">
          <p><strong>Date & Time:</strong> ${schedules[0].label}</p>
          <p class="wr-timezone">Your timezone: ${userTimezone}</p>
        </div>
      `;
    }

    const errorHtml = error ? `<div class="wr-error">${error}</div>` : '';

    container.innerHTML = `
      <form class="wr-form" id="wr-form">
        ${errorHtml}
        
        <div class="wr-field">
          <label class="wr-label" for="wr-name">Full Name *</label>
          <input type="text" id="wr-name" class="wr-input" placeholder="Your name" required>
        </div>
        
        <div class="wr-field">
          <label class="wr-label" for="wr-email">Email Address *</label>
          <input type="email" id="wr-email" class="wr-input" placeholder="you@example.com" required>
        </div>
        
        ${phoneField}
        ${scheduleField}
        
        <button type="submit" class="wr-button">${buttonText}</button>
      </form>
    `;

    // Attach submit handler
    document.getElementById('wr-form').addEventListener('submit', handleSubmit);
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('wr-name').value.trim();
    const email = document.getElementById('wr-email').value.trim().toLowerCase();
    const phone = document.getElementById('wr-phone')?.value?.trim() || '';
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
    const button = container.querySelector('.wr-button');
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
        container.innerHTML = `
          <div class="wr-form" style="text-align:center;padding:24px;">
            <p style="color:#6B7280;">No sessions currently available. Please check back later.</p>
          </div>
        `;
        return;
      }

      renderForm();

    } catch (err) {
      console.error('Webinar widget error:', err);
      container.innerHTML = `
        <div class="wr-form">
          <div class="wr-error">Failed to load registration form. Please refresh the page.</div>
        </div>
      `;
    }
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
