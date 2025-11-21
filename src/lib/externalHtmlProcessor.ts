/**
 * External HTML Processor
 * 
 * This utility processes external HTML (from landing page builders, custom HTML, etc.)
 * and automatically hooks up registration buttons to the webinar registration popup.
 * 
 * Features:
 * - Detects common registration button patterns
 * - Removes existing popup modals
 * - Converts onclick handlers to data attributes
 * - Injects webinar registration system
 */

interface ProcessorOptions {
  /**
   * Remove existing popup modals from the HTML
   */
  removeExistingPopups?: boolean;
  
  /**
   * Convert onclick handlers to data-webinar-trigger
   */
  convertOnClickHandlers?: boolean;
  
  /**
   * Add data-webinar-trigger to elements based on class/id patterns
   */
  autoDetectTriggers?: boolean;
  
  /**
   * Preserve existing scripts (except popup-related ones)
   */
  preserveScripts?: boolean;
}

const DEFAULT_OPTIONS: ProcessorOptions = {
  removeExistingPopups: true,
  convertOnClickHandlers: true,
  autoDetectTriggers: true,
  preserveScripts: true,
};

/**
 * Patterns to detect registration triggers
 */
const TRIGGER_PATTERNS = {
  // onclick patterns
  onClickPatterns: [
    /onclick\s*=\s*["'](?:openPopup|showPopup|showRegistration|openRegistration|register)\s*\(\s*\)\s*[;"']?/gi,
    /onclick\s*=\s*["'].*(?:popup|registration|register).*["']/gi,
  ],
  
  // Class patterns
  classPatterns: [
    'cta-button',
    'register-button',
    'registration-button',
    'btn-register',
    'btn-cta',
    'signup-button',
    'join-button',
  ],
  
  // ID patterns
  idPatterns: [
    'register',
    'registration',
    'registerButton',
    'register-button',
    'register-btn',
    'signup',
    'join',
    'cta',
  ],
  
  // Text content patterns (case-insensitive)
  textPatterns: [
    'register now',
    'sign up',
    'reserve',
    'save my spot',
    'claim',
    'join now',
    'get started',
    'enroll',
    'book now',
  ],
  
  // Elements to remove (existing popup modals)
  removePatterns: [
    '#registrationPopup',
    '#registration-popup',
    '.popup-overlay',
    '.modal-overlay',
    '[id*="popup"]',
    '[class*="popup-overlay"]',
  ],
  
  // Scripts to remove (popup-related)
  removeScriptPatterns: [
    /function\s+openPopup\s*\(/gi,
    /function\s+closePopup\s*\(/gi,
    /function\s+showPopup\s*\(/gi,
    /function\s+hidePopup\s*\(/gi,
    /getElementById\s*\(\s*["']registrationPopup["']\s*\)/gi,
  ],
};

/**
 * Process external HTML and prepare it for webinar integration
 */
export function processExternalHtml(html: string, options: ProcessorOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Parse HTML using DOMParser (browser) or jsdom (server)
  let doc: Document;
  if (typeof window !== 'undefined') {
    const parser = new DOMParser();
    doc = parser.parseFromString(html, 'text/html');
  } else {
    // Server-side: return HTML as-is with basic string replacements
    return processHtmlString(html, opts);
  }
  
  // 1. Remove existing popup modals
  if (opts.removeExistingPopups) {
    removeExistingPopups(doc);
  }
  
  // 2. Convert onclick handlers
  if (opts.convertOnClickHandlers) {
    convertOnClickHandlers(doc);
  }
  
  // 3. Auto-detect and mark trigger elements
  if (opts.autoDetectTriggers) {
    autoDetectTriggers(doc);
  }
  
  // 4. Clean up scripts
  if (opts.removeExistingPopups && opts.preserveScripts) {
    cleanupScripts(doc);
  }
  
  // Return processed HTML
  return doc.documentElement.outerHTML;
}

/**
 * Remove existing popup modals from the document
 */
function removeExistingPopups(doc: Document): void {
  TRIGGER_PATTERNS.removePatterns.forEach(pattern => {
    const elements = doc.querySelectorAll(pattern);
    elements.forEach(el => {
      console.log(`Removing existing popup element: ${el.tagName}#${el.id}.${el.className}`);
      el.remove();
    });
  });
}

/**
 * Convert onclick handlers to data-webinar-trigger
 */
function convertOnClickHandlers(doc: Document): void {
  const elementsWithOnClick = doc.querySelectorAll('[onclick]');
  
  elementsWithOnClick.forEach(el => {
    const onClickAttr = el.getAttribute('onclick') || '';
    
    // Check if onclick matches registration patterns
    const matchesPattern = TRIGGER_PATTERNS.onClickPatterns.some(pattern => 
      pattern.test(onClickAttr)
    );
    
    if (matchesPattern) {
      console.log(`Converting onclick to data-webinar-trigger: ${el.tagName}#${el.id}.${el.className}`);
      
      // Add data attribute
      el.setAttribute('data-webinar-trigger', 'true');
      
      // Remove onclick (we'll handle it with event listeners)
      el.removeAttribute('onclick');
      
      // Prevent default if it's a link
      if (el.tagName.toLowerCase() === 'a') {
        const href = el.getAttribute('href');
        if (href === '#' || href === '#register' || href === '#registration') {
          el.setAttribute('href', '#');
        }
      }
    }
  });
}

/**
 * Auto-detect trigger elements based on class, id, and text patterns
 */
function autoDetectTriggers(doc: Document): void {
  // Find by class
  TRIGGER_PATTERNS.classPatterns.forEach(className => {
    const elements = doc.querySelectorAll(`.${className}`);
    elements.forEach(el => {
      if (!el.hasAttribute('data-webinar-trigger')) {
        console.log(`Auto-detected trigger by class: ${className}`);
        el.setAttribute('data-webinar-trigger', 'true');
      }
    });
  });
  
  // Find by ID
  TRIGGER_PATTERNS.idPatterns.forEach(id => {
    const el = doc.getElementById(id);
    if (el && !el.hasAttribute('data-webinar-trigger')) {
      console.log(`Auto-detected trigger by id: ${id}`);
      el.setAttribute('data-webinar-trigger', 'true');
    }
  });
  
  // Find by text content
  const allButtons = doc.querySelectorAll('button, a, [role="button"]');
  allButtons.forEach(el => {
    const text = (el.textContent || '').toLowerCase().trim();
    
    const matchesText = TRIGGER_PATTERNS.textPatterns.some(pattern => 
      text.includes(pattern)
    );
    
    if (matchesText && !el.hasAttribute('data-webinar-trigger')) {
      console.log(`Auto-detected trigger by text: "${text}"`);
      el.setAttribute('data-webinar-trigger', 'true');
    }
  });
}

/**
 * Clean up popup-related scripts
 */
function cleanupScripts(doc: Document): void {
  const scripts = doc.querySelectorAll('script');
  
  scripts.forEach(script => {
    const scriptContent = script.textContent || '';
    
    // Check if script contains popup-related functions
    const containsPopupCode = TRIGGER_PATTERNS.removeScriptPatterns.some(pattern => 
      pattern.test(scriptContent)
    );
    
    if (containsPopupCode) {
      console.log('Removing popup-related script');
      
      // Remove popup-related functions but keep other code
      let cleanedContent = scriptContent;
      
      TRIGGER_PATTERNS.removeScriptPatterns.forEach(pattern => {
        // Remove entire function definitions
        cleanedContent = cleanedContent.replace(
          /function\s+(?:openPopup|closePopup|showPopup|hidePopup)\s*\([^)]*\)\s*\{[^}]*\}/gi,
          ''
        );
      });
      
      // If script is now empty or only whitespace, remove it
      if (cleanedContent.trim().length === 0) {
        script.remove();
      } else if (cleanedContent !== scriptContent) {
        script.textContent = cleanedContent;
      }
    }
  });
}

/**
 * Server-side string-based processing (fallback)
 */
function processHtmlString(html: string, opts: ProcessorOptions): string {
  let processed = html;
  
  // Remove existing popup modals (basic string matching)
  if (opts.removeExistingPopups) {
    // Remove common popup div structures
    processed = processed.replace(
      /<div[^>]*id\s*=\s*["']registrationPopup["'][^>]*>[\s\S]*?<\/div>/gi,
      ''
    );
    processed = processed.replace(
      /<div[^>]*class\s*=\s*["'][^"']*popup-overlay[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
      ''
    );
  }
  
  // Convert onclick handlers
  if (opts.convertOnClickHandlers) {
    processed = processed.replace(
      /onclick\s*=\s*["'](?:openPopup|showPopup)\s*\(\s*\)[^"']*["']/gi,
      'data-webinar-trigger="true"'
    );
  }
  
  // Add data-webinar-trigger to common CTA button classes
  if (opts.autoDetectTriggers) {
    processed = processed.replace(
      /<(button|a)([^>]*class\s*=\s*["'][^"']*cta-button[^"']*["'][^>]*)>/gi,
      '<$1$2 data-webinar-trigger="true">'
    );
  }
  
  // Remove popup-related scripts
  if (opts.removeExistingPopups) {
    processed = processed.replace(
      /function\s+(?:openPopup|closePopup)\s*\([^)]*\)\s*\{[^}]*\}/gi,
      ''
    );
  }
  
  return processed;
}

/**
 * Initialize event listeners for webinar triggers on the client side
 */
export function initializeWebinarTriggers(
  webinarId: string,
  onTrigger: () => void
): void {
  if (typeof window === 'undefined') return;
  
  // Find all elements with data-webinar-trigger
  const triggers = document.querySelectorAll('[data-webinar-trigger]');
  
  console.log(`Found ${triggers.length} webinar trigger elements`);
  
  triggers.forEach(trigger => {
    // Remove existing listeners (if any)
    const newTrigger = trigger.cloneNode(true) as HTMLElement;
    trigger.parentNode?.replaceChild(newTrigger, trigger);
    
    // Add click event listener
    newTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Webinar trigger clicked');
      onTrigger();
    });
  });
}

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  // This is a basic sanitization. In production, use a library like DOMPurify
  let sanitized = html;
  
  // Remove dangerous protocols
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  
  // Remove dangerous event handlers (except onclick which we handle separately)
  sanitized = sanitized.replace(/on(?!click)\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove iframe, object, embed tags (unless from trusted domains)
  sanitized = sanitized.replace(/<(iframe|object|embed)[^>]*>/gi, (match) => {
    // Allow iframes from trusted domains (YouTube, Vimeo, etc.)
    if (
      /src\s*=\s*["']https?:\/\/(?:www\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com)/i.test(match)
    ) {
      return match;
    }
    return '';
  });
  
  return sanitized;
}

/**
 * Extract useful metadata from external HTML
 */
export function extractMetadata(html: string): {
  title?: string;
  description?: string;
  hasForm: boolean;
  buttonCount: number;
  hasPopup: boolean;
} {
  // Simple regex-based extraction
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch = html.match(/<meta[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([^"']+)["']/i);
  
  const hasForm = /<form/i.test(html);
  const buttonMatches = html.match(/<button|<a[^>]*(?:class|onclick)/gi) || [];
  const buttonCount = buttonMatches.length;
  const hasPopup = /popup|modal/i.test(html);
  
  return {
    title: titleMatch?.[1],
    description: descMatch?.[1],
    hasForm,
    buttonCount,
    hasPopup,
  };
}
