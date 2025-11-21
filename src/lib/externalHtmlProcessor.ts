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
 * BUT preserve onclick="openModal()" as our system will provide that function
 */
function convertOnClickHandlers(doc: Document): void {
  const elementsWithOnClick = doc.querySelectorAll('[onclick]');
  
  elementsWithOnClick.forEach(el => {
    const onClickAttr = el.getAttribute('onclick') || '';
    
    // PRESERVE onclick="openModal()" - our system will provide this function
    if (onClickAttr.includes('openModal')) {
      console.log(`Preserving onclick="openModal()": ${el.tagName}#${el.id}.${el.className}`);
      return; // Don't modify this button
    }
    
    // Check if onclick matches OTHER registration patterns (not openModal)
    const matchesPattern = TRIGGER_PATTERNS.onClickPatterns.some(pattern => 
      pattern.test(onClickAttr)
    );
    
    if (matchesPattern) {
      console.log(`Converting onclick to openModal(): ${el.tagName}#${el.id}.${el.className}`);
      
      // Convert to onclick="openModal()" instead of data attribute
      el.setAttribute('onclick', 'openModal()');
      
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
 * Only add data-webinar-trigger to buttons that don't already have onclick="openModal()"
 */
function autoDetectTriggers(doc: Document): void {
  // Find by class
  TRIGGER_PATTERNS.classPatterns.forEach(className => {
    const elements = doc.querySelectorAll(`.${className}`);
    elements.forEach(el => {
      // Skip if already has onclick="openModal()"
      const onclick = el.getAttribute('onclick');
      if (onclick && onclick.includes('openModal')) {
        return;
      }
      
      if (!el.hasAttribute('data-webinar-trigger')) {
        console.log(`Auto-detected trigger by class: ${className}`);
        el.setAttribute('data-webinar-trigger', 'true');
      }
    });
  });
  
  // Find by ID
  TRIGGER_PATTERNS.idPatterns.forEach(id => {
    const el = doc.getElementById(id);
    if (el) {
      // Skip if already has onclick="openModal()"
      const onclick = el.getAttribute('onclick');
      if (onclick && onclick.includes('openModal')) {
        return;
      }
      
      if (!el.hasAttribute('data-webinar-trigger')) {
        console.log(`Auto-detected trigger by id: ${id}`);
        el.setAttribute('data-webinar-trigger', 'true');
      }
    }
  });
  
  // Find by text content
  const allButtons = doc.querySelectorAll('button, a, [role="button"]');
  allButtons.forEach(el => {
    const text = (el.textContent || '').toLowerCase().trim();
    
    const matchesText = TRIGGER_PATTERNS.textPatterns.some(pattern => 
      text.includes(pattern)
    );
    
    if (matchesText) {
      // Skip if already has onclick="openModal()"
      const onclick = el.getAttribute('onclick');
      if (onclick && onclick.includes('openModal')) {
        return;
      }
      
      if (!el.hasAttribute('data-webinar-trigger')) {
        console.log(`Auto-detected trigger by text: "${text}"`);
        el.setAttribute('data-webinar-trigger', 'true');
      }
    }
  });
}

/**
 * Clean up popup-related scripts
 * BUT preserve openModal/closeModal as our system will provide them
 */
function cleanupScripts(doc: Document): void {
  const scripts = doc.querySelectorAll('script');
  
  scripts.forEach(script => {
    const scriptContent = script.textContent || '';
    
    // DON'T remove scripts that define openModal or closeModal
    // Our React component will provide these functions
    if (scriptContent.includes('function openModal') || scriptContent.includes('function closeModal')) {
      console.log('Preserving openModal/closeModal script - React will provide these');
      // Remove the function definitions but keep other code
      let cleanedContent = scriptContent;
      
      // Remove openModal and closeModal function definitions
      cleanedContent = cleanedContent.replace(
        /function\s+openModal\s*\([^)]*\)\s*\{[^}]*\}/gi,
        '// openModal provided by React'
      );
      cleanedContent = cleanedContent.replace(
        /function\s+closeModal\s*\([^)]*\)\s*\{[^}]*\}/gi,
        '// closeModal provided by React'
      );
      
      script.textContent = cleanedContent;
      return;
    }
    
    // Check if script contains OTHER popup-related functions (not openModal/closeModal)
    const containsPopupCode = TRIGGER_PATTERNS.removeScriptPatterns.some(pattern => 
      pattern.test(scriptContent)
    );
    
    if (containsPopupCode) {
      console.log('Removing OLD popup-related script');
      
      // Remove OLD popup functions but keep other code
      let cleanedContent = scriptContent;
      
      // Remove OLD functions like openPopup, showPopup, hidePopup etc.
      cleanedContent = cleanedContent.replace(
        /function\s+(?:openPopup|closePopup|showPopup|hidePopup|showRegistration|hideRegistration)\s*\([^)]*\)\s*\{[^}]*\}/gi,
        ''
      );
      
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
    processed = processed.replace(
      /<div[^>]*id\s*=\s*["']webinarModal["'][^>]*>[\s\S]*?<\/div>/gi,
      ''
    );
  }
  
  // Convert onclick handlers to NOT remove them, but ensure they work
  // We DON'T want to remove onclick="openModal()" because our system will provide openModal()
  if (opts.convertOnClickHandlers) {
    // Only convert onclick handlers that point to OLD popup functions we want to replace
    // But preserve onclick="openModal()" as our system will handle it
    processed = processed.replace(
      /onclick\s*=\s*["'](?:openPopup|showPopup|showRegistration|openRegistration|showModal)\s*\(\s*\)[^"']*["']/gi,
      'onclick="openModal()"'
    );
  }
  
  // Add data-webinar-trigger to common CTA button classes as FALLBACK
  if (opts.autoDetectTriggers) {
    // Only add if button doesn't already have onclick
    processed = processed.replace(
      /<(button|a)([^>]*class\s*=\s*["'][^"']*(?:cta-button|register-button|btn-register|signup-button)[^"']*["'][^>]*)(?![^>]*onclick)>/gi,
      '<$1$2 data-webinar-trigger="true">'
    );
  }
  
  // DON'T remove openModal/closeModal functions - our system needs them
  // Only remove CONFLICTING popup functions with different names
  if (opts.removeExistingPopups && opts.preserveScripts) {
    // Remove OLD popup functions but preserve openModal/closeModal
    processed = processed.replace(
      /function\s+(?:openPopup|closePopup|showPopup|hidePopup|showRegistration|hideRegistration)\s*\([^)]*\)\s*\{[^}]*\}/gi,
      ''
    );
    
    // Remove getElementById calls for OLD popup IDs
    processed = processed.replace(
      /getElementById\s*\(\s*["'](?:registrationPopup|popup-overlay)["']\s*\)/gi,
      'getElementById("webinarModal")'
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

/**
 * Lightweight drag-and-drop HTML editor for client-side use.
 * - Makes text in the container editable (contenteditable)
 * - Allows dragging any direct element to reorder
 * - Alt+Click a <div> to delete it
 */
export function initializeDragDropHtmlEditor(container: HTMLElement): {
  destroy: () => void;
} {
  if (typeof window === 'undefined' || !container) {
    return { destroy: () => {} };
  }

  const EDITOR_STYLE_ID = 'html-editor-style';
  const addedAttributes: Array<{ node: HTMLElement; key: string }> = [];
  let dragged: HTMLElement | null = null;

  // Add minimal visual affordances
  if (!document.getElementById(EDITOR_STYLE_ID)) {
    const style = document.createElement('style');
    style.id = EDITOR_STYLE_ID;
    style.textContent = `
      [data-html-editor-editable]:hover { outline: 1px dashed #5b9bff; outline-offset: 2px; }
      [data-html-editor-dragging] { opacity: 0.4; }
      [data-html-editor-drop-target] { outline: 2px solid #5b9bff; }
    `;
    document.head.appendChild(style);
  }

  // Make everything text-editable except obvious interactive controls
  const allNodes = Array.from(container.querySelectorAll<HTMLElement>('*'));
  allNodes.forEach((node) => {
    const tag = node.tagName.toLowerCase();
    if (['input', 'select', 'textarea', 'option', 'button', 'script', 'style'].includes(tag)) return;
    if (node.isContentEditable) return;
    node.setAttribute('contenteditable', 'true');
    node.setAttribute('data-html-editor-editable', 'true');
    addedAttributes.push({ node, key: 'contenteditable' });
    addedAttributes.push({ node, key: 'data-html-editor-editable' });
  });

  // Enable drag-and-drop on elements to reorder them
  allNodes.forEach((node) => {
    node.draggable = true;
    addedAttributes.push({ node, key: 'draggable' });
  });

  const handleDragStart = (ev: DragEvent) => {
    const target = ev.target as HTMLElement | null;
    if (!target) return;
    dragged = target;
    target.setAttribute('data-html-editor-dragging', 'true');
    ev.dataTransfer?.setData('text/plain', 'dragging');
    ev.dataTransfer?.setDragImage(target, 10, 10);
  };

  const handleDragOver = (ev: DragEvent) => {
    if (!dragged) return;
    ev.preventDefault();
    const target = ev.target as HTMLElement | null;
    if (!target || dragged.contains(target)) return;
    target.setAttribute('data-html-editor-drop-target', 'true');
  };

  const handleDragLeave = (ev: DragEvent) => {
    const target = ev.target as HTMLElement | null;
    target?.removeAttribute('data-html-editor-drop-target');
  };

  const handleDrop = (ev: DragEvent) => {
    if (!dragged) return;
    ev.preventDefault();
    const target = ev.target as HTMLElement | null;
    if (!target || dragged === target || dragged.contains(target)) return;
    target.removeAttribute('data-html-editor-drop-target');
    const parent = target.parentElement;
    if (parent) {
      parent.insertBefore(dragged, target);
    }
  };

  const handleDragEnd = (ev: DragEvent) => {
    const target = ev.target as HTMLElement | null;
    dragged = null;
    target?.removeAttribute('data-html-editor-dragging');
    container.querySelectorAll('[data-html-editor-drop-target]').forEach((el) => {
      el.removeAttribute('data-html-editor-drop-target');
    });
  };

  const handleAltClickDelete = (ev: MouseEvent) => {
    const target = ev.target as HTMLElement | null;
    if (!target || target.tagName.toLowerCase() !== 'div') return;
    if (ev.altKey) {
      ev.preventDefault();
      const confirmed = confirm('Delete this section?');
      if (confirmed) {
        target.remove();
      }
    }
  };

  container.addEventListener('dragstart', handleDragStart);
  container.addEventListener('dragover', handleDragOver);
  container.addEventListener('dragleave', handleDragLeave);
  container.addEventListener('drop', handleDrop);
  container.addEventListener('dragend', handleDragEnd);
  container.addEventListener('click', handleAltClickDelete);

  const destroy = () => {
    container.removeEventListener('dragstart', handleDragStart);
    container.removeEventListener('dragover', handleDragOver);
    container.removeEventListener('dragleave', handleDragLeave);
    container.removeEventListener('drop', handleDrop);
    container.removeEventListener('dragend', handleDragEnd);
    container.removeEventListener('click', handleAltClickDelete);
    addedAttributes.forEach(({ node, key }) => {
      node.removeAttribute(key);
    });
    container.querySelectorAll('[data-html-editor-dragging]').forEach((el) =>
      el.removeAttribute('data-html-editor-dragging')
    );
    container.querySelectorAll('[data-html-editor-drop-target]').forEach((el) =>
      el.removeAttribute('data-html-editor-drop-target')
    );
  };

  return { destroy };
}

/**
 * Convert external HTML to registration template format
 * This is a wrapper around processExternalHtml for backwards compatibility
 */
export function convertHtmlToRegistrationTemplate(html: string): string {
  return processExternalHtml(html, {
    removeExistingPopups: true,
    convertOnClickHandlers: true,
    autoDetectTriggers: true,
    preserveScripts: true,
  });
}
