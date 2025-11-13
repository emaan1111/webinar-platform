'use client'

import { useEffect, useRef } from 'react'

interface TemplateRendererProps {
  html: string
  className?: string
}

export function TemplateRenderer({ html, className }: TemplateRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    // React does not execute scripts inserted via dangerouslySetInnerHTML,
    // so replay them manually to ensure template helpers (share buttons, timers, etc.) run.
    const scripts = Array.from(container.querySelectorAll('script'))
    scripts.forEach((oldScript, index) => {
      const scriptType = (oldScript.getAttribute('type') || '').trim()
      const shouldExecute =
        !scriptType ||
        scriptType === 'text/javascript' ||
        scriptType === 'application/javascript' ||
        scriptType === 'module'

      if (!shouldExecute) {
        return
      }

      try {
        const scriptContent = oldScript.textContent ?? ''
        
        // Skip empty scripts
        if (!scriptContent.trim()) {
          return
        }
        
        // Validate script content doesn't have obvious syntax errors
        // Check for unescaped special characters in strings
        const hasInvalidTokens = /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(scriptContent)
        if (hasInvalidTokens) {
          console.warn(`[TemplateRenderer] Skipping script ${index} due to invalid characters`)
          return
        }
        
        // Log potential issues but don't skip execution
        // (Script might be valid but just have different context requirements)
        if (process.env.NODE_ENV === 'development') {
          try {
            new Function(scriptContent)
          } catch (parseError) {
            // Log warning but don't return - let the script try to execute
            console.warn(`[TemplateRenderer] Script ${index} may have syntax issues (will still attempt):`, parseError)
            if (scriptContent.includes('shareOnWhatsApp') || scriptContent.includes('copyLink')) {
              console.log('Script content (first 1000 chars):', scriptContent.substring(0, 1000))
            }
          }
        }
        
        const newScript = document.createElement('script')
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value)
        })
        
        // Log script content before execution for debugging
        if (scriptContent.includes('shareOnWhatsApp') || scriptContent.includes('copyLink')) {
          console.log(`[TemplateRenderer] Executing script ${index} with share functions`)
        }
        
        // Wrap script in IIFE to avoid variable conflicts between multiple scripts
        // But preserve global function declarations (like shareOnWhatsApp)
        let wrappedScript = scriptContent
        
        // Check if this script declares functions that should be global
        const hasFunctionDeclarations = /function\s+\w+\s*\(/.test(scriptContent)
        
        if (hasFunctionDeclarations) {
          // Extract function declarations and make them global
          // Pattern: function name() { ... }
          const functionPattern = /function\s+(\w+)\s*\([^)]*\)\s*{/g
          const functions = []
          let match
          while ((match = functionPattern.exec(scriptContent)) !== null) {
            functions.push(match[1])
          }
          
          // Wrap in IIFE but expose functions to window
          wrappedScript = `(function() {
${scriptContent}

// Expose functions to global scope
${functions.map(fn => `if (typeof ${fn} !== 'undefined') window.${fn} = ${fn};`).join('\n')}
})();`
        } else {
          // Just wrap in IIFE for variable isolation
          wrappedScript = `(function() {
${scriptContent}
})();`
        }
        
        try {
          newScript.text = wrappedScript
          oldScript.parentNode?.replaceChild(newScript, oldScript)
        } catch (replaceError) {
          // Catch errors during script assignment/replacement (syntax errors)
          console.error(`[TemplateRenderer] Failed to replace/execute script ${index}:`, replaceError)
          console.error('This usually means the script has syntax errors.')
          console.error('Full script content:', scriptContent)
          console.error('Script length:', scriptContent.length)
          
          // Try to identify the problematic line
          const lines = scriptContent.split('\n')
          console.error(`Script has ${lines.length} lines`)
          lines.forEach((line, lineNum) => {
            // Check for unterminated strings (common issue)
            const singleQuotes = (line.match(/'/g) || []).length
            const doubleQuotes = (line.match(/"/g) || []).length
            if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
              console.error(`  ⚠️ Line ${lineNum + 1} may have unterminated string:`, line)
            }
            // Also show lines with {{
            if (line.includes('{{') || line.includes('}}')) {
              console.error(`  📝 Line ${lineNum + 1} has template variable:`, line)
            }
          })
          
          // Don't throw - just skip this script
          console.warn(`[TemplateRenderer] Skipping script ${index} due to syntax error`)
        }
      } catch (error) {
        console.error(`[TemplateRenderer] Error processing script ${index}:`, error)
      }
    })
  }, [html])

  return <div ref={containerRef} className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
