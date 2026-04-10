/**
 * Popup Form Embed Script
 * 
 * USAGE:
 * 
 * 1. Auto Popup (appears on page load):
 *    <script src="https://YOUR_DOMAIN/popup-embed.js" data-popup="YOUR_POPUP_SLUG"></script>
 * 
 * 2. Button Trigger (click to open popup):
 *    <script src="https://YOUR_DOMAIN/popup-embed.js" data-popup="YOUR_POPUP_SLUG" data-trigger="button" data-button-text="Sign Up Now"></script>
 * 
 * 3. Inline Form (embedded directly in page):
 *    <div id="my-popup-form"></div>
 *    <script src="https://YOUR_DOMAIN/popup-embed.js" data-popup="YOUR_POPUP_SLUG" data-mode="inline" data-container="my-popup-form"></script>
 * 
 * OPTIONAL ATTRIBUTES:
 *    data-api-base="https://YOUR_DOMAIN"  - Override API base URL (for advanced use)
 *    data-button-style="..."              - Custom CSS for trigger button
 *    data-delay="3000"                    - Delay in ms before showing auto popup
 */
(function () {
  'use strict';

  // Find the current script tag
  var scripts = document.getElementsByTagName('script');
  var SCRIPT = null;
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].src && scripts[i].src.indexOf('popup-embed.js') !== -1 && scripts[i].getAttribute('data-popup')) {
      SCRIPT = scripts[i];
      break;
    }
  }
  // Fallback to currentScript if available
  if (!SCRIPT && document.currentScript) {
    SCRIPT = document.currentScript;
  }
  if (!SCRIPT) {
    console.error('[PopupEmbed] Script tag not found');
    return;
  }

  var SLUG = SCRIPT.getAttribute('data-popup');
  if (!SLUG) {
    console.error('[PopupEmbed] data-popup attribute is required');
    return;
  }

  var MODE = SCRIPT.getAttribute('data-mode') || 'popup'; // popup | inline
  var TRIGGER = SCRIPT.getAttribute('data-trigger') || 'auto'; // auto | button
  var CONTAINER_ID = SCRIPT.getAttribute('data-container');
  var BTN_TEXT = SCRIPT.getAttribute('data-button-text') || 'Sign Up';
  var BTN_STYLE = SCRIPT.getAttribute('data-button-style') || '';
  var DELAY = parseInt(SCRIPT.getAttribute('data-delay') || '0', 10);

  // Derive API base from script src - extract origin
  var scriptSrc = SCRIPT.src;
  var urlMatch = scriptSrc.match(/^(https?:\/\/[^\/]+)/);
  var BASE_URL = SCRIPT.getAttribute('data-api-base') || (urlMatch ? urlMatch[1] : '');
  
  if (!BASE_URL) {
    console.error('[PopupEmbed] Could not determine API base URL. Please add data-api-base attribute.');
    return;
  }

  // Log initialization for debugging
  console.log('[PopupEmbed] Initialized:', { slug: SLUG, mode: MODE, trigger: TRIGGER, apiBase: BASE_URL });

  // Inject CSS reset and base styles
  var CSS = [
    '.pf-overlay{position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}',
    '.pf-overlay *{box-sizing:border-box;margin:0;padding:0}',
    '.pf-popup{position:relative;max-width:480px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25)}',
    '.pf-inline{max-width:480px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1)}',
    '.pf-close{position:absolute;top:8px;right:12px;background:none;border:none;color:inherit;font-size:24px;cursor:pointer;opacity:0.8;z-index:10}',
    '.pf-close:hover{opacity:1}',
    '.pf-header{padding:16px 20px;position:relative}',
    '.pf-header h3{font-size:20px;font-weight:700;margin:0}',
    '.pf-body{padding:20px}',
    '.pf-fields{display:flex;flex-wrap:wrap;gap:12px}',
    '.pf-field{display:flex;flex-direction:column;gap:4px}',
    '.pf-field-full{width:100%}',
    '.pf-field-half{width:calc(50% - 6px)}',
    '.pf-label{font-size:14px;font-weight:500}',
    '.pf-label .required{color:#ef4444}',
    '.pf-input,.pf-select,.pf-textarea{width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;font-family:inherit;outline:none;transition:border-color 0.2s,box-shadow 0.2s}',
    '.pf-input:focus,.pf-select:focus,.pf-textarea:focus{border-color:#4f46e5;box-shadow:0 0 0 3px rgba(79,70,229,0.1)}',
    '.pf-textarea{resize:vertical;min-height:80px}',
    '.pf-phone-row{display:flex;gap:6px}',
    '.pf-phone-code{width:100px;flex-shrink:0}',
    '.pf-phone-input{flex:1}',
    '.pf-checkbox-wrap{display:flex;align-items:center;gap:8px}',
    '.pf-checkbox{width:18px;height:18px;cursor:pointer}',
    '.pf-btn{width:100%;margin-top:16px;padding:12px;border:none;border-radius:6px;font-size:16px;font-weight:600;cursor:pointer;transition:transform 0.15s,box-shadow 0.15s}',
    '.pf-btn:hover{transform:translateY(-1px)}',
    '.pf-btn:disabled{opacity:0.6;cursor:not-allowed;transform:none}',
    '.pf-msg{padding:20px;text-align:center;font-size:16px}',
    '.pf-error{background:#fef2f2;color:#991b1b;border-radius:8px;padding:12px;margin-bottom:12px;font-size:14px}',
    '.pf-loading{text-align:center;padding:40px}',
    '.pf-spinner{width:36px;height:36px;border:3px solid #e5e7eb;border-top-color:#4f46e5;border-radius:50%;animation:pf-spin 0.8s linear infinite;margin:0 auto 12px}',
    '@keyframes pf-spin{to{transform:rotate(360deg)}}'
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.id = 'popup-form-styles';
  styleEl.textContent = CSS;
  if (!document.getElementById('popup-form-styles')) {
    document.head.appendChild(styleEl);
  }

  var COUNTRY_CODES = [
    { code: '+1', country: 'US' }, { code: '+44', country: 'UK' }, { code: '+91', country: 'IN' },
    { code: '+61', country: 'AU' }, { code: '+49', country: 'DE' }, { code: '+33', country: 'FR' },
    { code: '+81', country: 'JP' }, { code: '+86', country: 'CN' }, { code: '+55', country: 'BR' },
    { code: '+234', country: 'NG' }, { code: '+27', country: 'ZA' }, { code: '+971', country: 'UAE' },
    { code: '+966', country: 'SA' }, { code: '+92', country: 'PK' }, { code: '+880', country: 'BD' },
    { code: '+62', country: 'ID' }, { code: '+52', country: 'MX' }, { code: '+39', country: 'IT' },
    { code: '+34', country: 'ES' }, { code: '+82', country: 'KR' }
  ];

  function loadPopup() {
    // Show loading state for inline mode
    if (MODE === 'inline' && CONTAINER_ID) {
      var container = document.getElementById(CONTAINER_ID);
      if (container) {
        container.innerHTML = '<div class="pf-loading"><div class="pf-spinner"></div><p>Loading form...</p></div>';
      }
    }

    fetch(BASE_URL + '/api/popups/embed/' + encodeURIComponent(SLUG), {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Popup not found (status ' + res.status + ')');
        return res.json();
      })
      .then(function (config) {
        console.log('[PopupEmbed] Config loaded:', config.name);
        if (config.useCustomHtml && config.customHtml) {
          renderCustomHtml(config);
        } else {
          renderForm(config);
        }
      })
      .catch(function (err) {
        console.error('[PopupEmbed] Error loading popup:', err.message);
        if (MODE === 'inline' && CONTAINER_ID) {
          var container = document.getElementById(CONTAINER_ID);
          if (container) {
            container.innerHTML = '<div class="pf-error">Failed to load form: ' + err.message + '</div>';
          }
        }
      });
  }

  function renderCustomHtml(config) {
    var wrapper = createWrapper(config);
    var formEl = document.createElement('form');
    formEl.innerHTML = config.customHtml;
    formEl.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {};
      var inputs = formEl.querySelectorAll('[data-field]');
      inputs.forEach(function (inp) {
        data[inp.getAttribute('data-field')] = inp.value || '';
      });
      submitForm(config, data, formEl);
    });
    wrapper.appendChild(formEl);
    mount(wrapper);
  }

  function renderForm(config) {
    var styles = config.styles || {};
    var fields = config.fields || [];

    var wrapper = createWrapper(config);
    var popup = document.createElement('div');
    popup.style.cssText = 'border-radius:' + (styles.borderRadius || 12) + 'px;overflow:hidden;font-family:' +
      (styles.fontFamily || 'Inter, Arial, sans-serif') + ';background:' + (styles.popupBg || '#fff') +
      ';max-width:480px;width:100%;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);';

    // Header
    var header = document.createElement('div');
    header.style.cssText = 'background:' + (styles.headerBg || '#4f46e5') + ';color:' +
      (styles.headerTextColor || '#fff') + ';padding:16px 20px;font-size:' +
      (styles.headerFontSize || 20) + 'px;font-weight:700;position:relative;';
    header.textContent = config.name || 'Popup Form';

    // Close button (only for popup mode)
    if (MODE === 'popup') {
      var closeBtn = document.createElement('button');
      closeBtn.innerHTML = '&times;';
      closeBtn.style.cssText = 'position:absolute;top:8px;right:12px;background:none;border:none;color:' +
        (styles.headerTextColor || '#fff') + ';font-size:24px;cursor:pointer;line-height:1;';
      closeBtn.addEventListener('click', function () { wrapper.remove(); });
      header.appendChild(closeBtn);
    }
    popup.appendChild(header);

    // Form
    var form = document.createElement('form');
    form.style.cssText = 'padding:20px;background:' + (styles.bodyBg || '#fff') + ';';

    var fieldsRow = document.createElement('div');
    fieldsRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px;';

    fields.forEach(function (field) {
      var fieldWrap = document.createElement('div');
      fieldWrap.style.width = field.width === 'half' ? 'calc(50% - 6px)' : '100%';

      // Label
      var label = document.createElement('label');
      label.style.cssText = 'display:block;margin-bottom:4px;font-size:' + (styles.labelFontSize || 14) +
        'px;font-weight:500;color:' + (styles.labelColor || '#374151') + ';';
      label.textContent = field.label + (field.required ? ' *' : '');
      fieldWrap.appendChild(label);

      var inputStyle = 'width:100%;background:' + (styles.inputBg || '#fff') + ';border:1px solid ' +
        (styles.inputBorderColor || '#d1d5db') + ';border-radius:6px;padding:8px 12px;font-size:' +
        (styles.inputFontSize || 14) + 'px;color:' + (styles.inputTextColor || '#111827') +
        ';box-sizing:border-box;outline:none;font-family:inherit;';

      if (field.type === 'phone') {
        var phoneWrap = document.createElement('div');
        phoneWrap.style.cssText = 'display:flex;gap:4px;';

        var countrySelect = document.createElement('select');
        countrySelect.style.cssText = inputStyle + 'width:100px;padding:8px 4px;';
        countrySelect.setAttribute('data-field', field.id + '_code');
        COUNTRY_CODES.forEach(function (cc) {
          var opt = document.createElement('option');
          opt.value = cc.code;
          opt.textContent = cc.code + ' ' + cc.country;
          countrySelect.appendChild(opt);
        });
        phoneWrap.appendChild(countrySelect);

        var phoneInput = document.createElement('input');
        phoneInput.type = 'tel';
        phoneInput.placeholder = field.placeholder || 'Phone number';
        phoneInput.style.cssText = inputStyle + 'flex:1;width:auto;';
        phoneInput.setAttribute('data-field', field.id);
        if (field.required) phoneInput.required = true;
        phoneWrap.appendChild(phoneInput);

        fieldWrap.appendChild(phoneWrap);
      } else if (field.type === 'textarea') {
        var ta = document.createElement('textarea');
        ta.placeholder = field.placeholder || '';
        ta.rows = 3;
        ta.style.cssText = inputStyle + 'resize:vertical;';
        ta.setAttribute('data-field', field.id);
        if (field.required) ta.required = true;
        fieldWrap.appendChild(ta);
      } else if (field.type === 'select') {
        var sel = document.createElement('select');
        sel.style.cssText = inputStyle;
        sel.setAttribute('data-field', field.id);
        if (field.required) sel.required = true;
        var defOpt = document.createElement('option');
        defOpt.value = '';
        defOpt.textContent = field.placeholder || 'Select...';
        sel.appendChild(defOpt);
        (field.options || '').split(',').forEach(function (o) {
          var opt = document.createElement('option');
          opt.value = o.trim();
          opt.textContent = o.trim();
          sel.appendChild(opt);
        });
        fieldWrap.appendChild(sel);
      } else if (field.type === 'checkbox') {
        var cbLabel = document.createElement('label');
        cbLabel.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;';
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.setAttribute('data-field', field.id);
        cbLabel.appendChild(cb);
        var cbText = document.createElement('span');
        cbText.textContent = field.placeholder || field.label;
        cbText.style.cssText = 'font-size:' + (styles.inputFontSize || 14) + 'px;color:' + (styles.inputTextColor || '#111827') + ';';
        cbLabel.appendChild(cbText);
        // Remove the standalone label for checkbox
        fieldWrap.removeChild(label);
        fieldWrap.appendChild(cbLabel);
      } else {
        var inp = document.createElement('input');
        inp.type = field.type === 'date' ? 'date' : (field.type || 'text');
        inp.placeholder = field.placeholder || '';
        inp.style.cssText = inputStyle;
        inp.setAttribute('data-field', field.id);
        if (field.required) inp.required = true;
        fieldWrap.appendChild(inp);
      }

      fieldsRow.appendChild(fieldWrap);
    });

    form.appendChild(fieldsRow);

    // Submit button
    var submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = config.submitText || 'Submit';
    submitBtn.style.cssText = 'width:100%;margin-top:16px;background:' + (styles.buttonBg || '#4f46e5') +
      ';color:' + (styles.buttonTextColor || '#fff') + ';font-size:' + (styles.buttonFontSize || 16) +
      'px;font-weight:600;padding:12px;border-radius:6px;border:none;cursor:pointer;font-family:inherit;';
    submitBtn.addEventListener('mouseenter', function () {
      submitBtn.style.background = styles.buttonHoverBg || '#4338ca';
    });
    submitBtn.addEventListener('mouseleave', function () {
      submitBtn.style.background = styles.buttonBg || '#4f46e5';
    });
    form.appendChild(submitBtn);

    // Message element (hidden)
    var msgEl = document.createElement('div');
    msgEl.style.cssText = 'display:none;padding:16px;text-align:center;font-size:16px;color:#059669;';
    form.appendChild(msgEl);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {};
      var inputs = form.querySelectorAll('[data-field]');
      inputs.forEach(function (el) {
        var fieldId = el.getAttribute('data-field');
        if (el.type === 'checkbox') {
          data[fieldId] = el.checked;
        } else if (fieldId.endsWith('_code')) {
          // Country code — merge with phone
          var phoneFieldId = fieldId.replace('_code', '');
          data[phoneFieldId] = el.value + ' ' + (data[phoneFieldId] || '');
        } else if (el.type === 'tel') {
          // Phone number — may already have country code prepended
          data[fieldId] = (data[fieldId] || '') + el.value;
        } else {
          data[fieldId] = el.value;
        }
      });
      // Clean up phone concatenation
      Object.keys(data).forEach(function(k) {
        if (typeof data[k] === 'string') data[k] = data[k].trim();
      });
      submitForm(config, data, form, msgEl, submitBtn);
    });

    popup.appendChild(form);
    wrapper.appendChild(popup);
    mount(wrapper);
  }

  function createWrapper(config) {
    var wrapper = document.createElement('div');
    wrapper.id = 'popup-embed-' + SLUG;
    if (MODE === 'popup') {
      var styles = config.styles || {};
      wrapper.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:' +
        (styles.overlayBg || 'rgba(0,0,0,0.5)') + ';padding:16px;';
      wrapper.addEventListener('click', function (e) {
        if (e.target === wrapper) wrapper.remove();
      });
    }
    return wrapper;
  }

  function mount(wrapper) {
    if (MODE === 'inline' && CONTAINER_ID) {
      var container = document.getElementById(CONTAINER_ID);
      if (container) {
        container.appendChild(wrapper);
        return;
      }
    }
    document.body.appendChild(wrapper);
  }

  function submitForm(config, data, formEl, msgEl, submitBtn) {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    fetch(BASE_URL + '/api/popups/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        popupSlug: SLUG,
        data: data,
        pageUrl: window.location.href
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (result.success) {
          if (result.redirectUrl) {
            window.location.href = result.redirectUrl;
            return;
          }
          // Show success message
          if (msgEl) {
            var fieldsRow = formEl.querySelector('div');
            if (fieldsRow) fieldsRow.style.display = 'none';
            if (submitBtn) submitBtn.style.display = 'none';
            msgEl.style.display = 'block';
            msgEl.textContent = result.successMessage || 'Thank you!';
          } else {
            formEl.innerHTML = '<div style="padding:20px;text-align:center;font-size:16px;color:#059669;">' +
              (result.successMessage || 'Thank you!') + '</div>';
          }
        } else {
          alert(result.error || 'Submission failed');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = config.submitText || 'Submit';
          }
        }
      })
      .catch(function () {
        alert('Something went wrong. Please try again.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = config.submitText || 'Submit';
        }
      });
  }

  // ─── Initialize ───
  if (TRIGGER === 'button') {
    var btn = document.createElement('button');
    btn.textContent = BTN_TEXT;
    if (BTN_STYLE) {
      btn.style.cssText = BTN_STYLE;
    } else {
      btn.style.cssText = 'background:#4f46e5;color:#fff;padding:12px 24px;border:none;border-radius:8px;font-size:16px;cursor:pointer;';
    }
    btn.addEventListener('click', function () { loadPopup(); });
    SCRIPT.parentNode.insertBefore(btn, SCRIPT.nextSibling);
  } else {
    // Auto or inline: load on DOMContentLoaded (with optional delay)
    function initLoad() {
      if (DELAY > 0) {
        setTimeout(loadPopup, DELAY);
      } else {
        loadPopup();
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initLoad);
    } else {
      initLoad();
    }
  }
})();
