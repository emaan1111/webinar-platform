/**
 * Popup Form Embed Script
 * 
 * Usage:
 *  Auto popup:    <script src="HOST/popup-embed.js" data-popup="SLUG"></script>
 *  Button:        <script src="HOST/popup-embed.js" data-popup="SLUG" data-trigger="button" data-button-text="Sign Up"></script>
 *  Inline:        <script src="HOST/popup-embed.js" data-popup="SLUG" data-mode="inline" data-container="my-div"></script>
 */
(function () {
  'use strict';

  var SCRIPT = document.currentScript;
  if (!SCRIPT) return;

  var SLUG = SCRIPT.getAttribute('data-popup');
  if (!SLUG) return;

  var MODE = SCRIPT.getAttribute('data-mode') || 'popup'; // popup | inline
  var TRIGGER = SCRIPT.getAttribute('data-trigger') || 'auto'; // auto | button
  var CONTAINER_ID = SCRIPT.getAttribute('data-container');
  var BTN_TEXT = SCRIPT.getAttribute('data-button-text') || 'Sign Up';
  var BTN_STYLE = SCRIPT.getAttribute('data-button-style') || '';

  // Derive API base from script src
  var scriptSrc = SCRIPT.src;
  var BASE_URL = scriptSrc.substring(0, scriptSrc.lastIndexOf('/'));

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
    fetch(BASE_URL + '/api/popups/embed/' + encodeURIComponent(SLUG))
      .then(function (res) {
        if (!res.ok) throw new Error('Popup not found');
        return res.json();
      })
      .then(function (config) {
        if (config.useCustomHtml && config.customHtml) {
          renderCustomHtml(config);
        } else {
          renderForm(config);
        }
      })
      .catch(function (err) {
        console.error('[PopupEmbed]', err.message);
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
    // Auto or inline: load on DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadPopup);
    } else {
      loadPopup();
    }
  }
})();
