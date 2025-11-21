'use client'

import { useEffect, useRef } from 'react'

interface ExternalHtmlRendererProps {
  html: string
  onTriggerClick: () => void
}

/**
 * Component that renders external HTML and automatically hooks up
 * registration buttons to the webinar registration system
 */
export default function ExternalHtmlRenderer({ html, onTriggerClick }: ExternalHtmlRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Process HTML to remove existing popups and convert triggers
    const processedHtml = processHtml(html)
    
    // Set the HTML content
    containerRef.current.innerHTML = processedHtml

    // Initialize event listeners after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initializeTriggers(containerRef.current!, onTriggerClick)
    }, 100)

    return () => {
      clearTimeout(timer)
    }
  }, [html, onTriggerClick])

  return <div ref={containerRef} className="external-html-content" />
}

/**
 * Process HTML to remove existing popups and convert onclick handlers
 */
function processHtml(html: string): string {
  let processed = html

  // Remove existing popup modals
  // Pattern 1: div with id containing "popup"
  processed = processed.replace(
    /<div[^>]*id\s*=\s*["']([^"']*popup[^"']*|[^"']*modal[^"']*)["'][^>]*>[\s\S]*?<\/div>\s*(?=<\/div>|<script|<footer|<\/body)/gi,
    ''
  )
  
  // Pattern 2: div with class containing "popup-overlay" or "modal-overlay"
  processed = processed.replace(
    /<div[^>]*class\s*=\s*["'][^"']*(popup-overlay|modal-overlay)[^"']*["'][^>]*>[\s\S]*?<\/div>\s*(?=<\/div>|<script|<footer|<\/body)/gi,
    ''
  )

  // Convert onclick="openPopup()" to data-webinar-trigger
  processed = processed.replace(
    /onclick\s*=\s*["'](?:[^"']*(?:openPopup|showPopup|showRegistration|openRegistration|register)\s*\([^)]*\)[^"']*)["']/gi,
    'data-webinar-trigger="true"'
  )

  // Remove popup-related scripts
  processed = processed.replace(
    /<script[^>]*>[\s\S]*?(?:function\s+(?:openPopup|closePopup|showPopup|hidePopup))[\s\S]*?<\/script>/gi,
    ''
  )

  // Add data-webinar-trigger to common CTA button classes (if not already present)
  processed = processed.replace(
    /<(button|a)([^>]*class\s*=\s*["'][^"']*(?:cta-button|register-button|btn-register)[^"']*["'][^>]*)(?!.*data-webinar-trigger)>/gi,
    '<$1$2 data-webinar-trigger="true">'
  )

  return processed
}

/**
 * Initialize event listeners for all trigger elements
 */
function initializeTriggers(container: HTMLElement, onTriggerClick: () => void): void {
  // Pattern 1: Elements with data-webinar-trigger
  const triggers = container.querySelectorAll('[data-webinar-trigger]')
  
  // Pattern 2: Elements with common CTA classes (backup)
  const ctaButtons = container.querySelectorAll('.cta-button, .register-button, .btn-register, .signup-button')
  
  // Pattern 3: Links with href="#register" or similar
  const registerLinks = container.querySelectorAll('a[href="#register"], a[href="#registration"], a[href="#signup"]')
  
  // Pattern 4: Buttons/links with registration-related text
  const allClickables = container.querySelectorAll('button, a[href], [role="button"]')
  const textTriggers: Element[] = []
  
  allClickables.forEach(el => {
    const text = (el.textContent || '').toLowerCase().trim()
    const isRegistrationButton = 
      text.includes('register') ||
      text.includes('sign up') ||
      text.includes('reserve') ||
      text.includes('save my spot') ||
      text.includes('claim') ||
      text.includes('join now') ||
      text.includes('book now') ||
      text.includes('enroll')
    
    if (isRegistrationButton && !triggers.length && !ctaButtons.length) {
      textTriggers.push(el)
    }
  })

  // Combine all trigger elements
  const allTriggers = new Set([
    ...Array.from(triggers),
    ...Array.from(ctaButtons),
    ...Array.from(registerLinks),
    ...textTriggers,
  ])

  console.log(`[ExternalHtmlRenderer] Found ${allTriggers.size} registration trigger elements`)

  // Add click listeners to all triggers
  allTriggers.forEach((trigger) => {
    // Remove existing onclick attribute to prevent conflicts
    trigger.removeAttribute('onclick')
    
    // Add our click handler
    const clickHandler = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('[ExternalHtmlRenderer] Registration trigger clicked')
      onTriggerClick()
    }

    // Use both capture and bubble phases to ensure we catch the event
    trigger.addEventListener('click', clickHandler, true)
    trigger.addEventListener('click', clickHandler, false)
    
    // Also add pointer event for better mobile support
    trigger.addEventListener('touchstart', (e) => {
      e.preventDefault()
      onTriggerClick()
    }, { passive: false })
  })

  // Also expose global functions for any remaining inline onclick handlers
  ;(window as any).openPopup = onTriggerClick
  ;(window as any).showPopup = onTriggerClick
  ;(window as any).openRegistration = onTriggerClick
  ;(window as any).showRegistration = onTriggerClick
}
