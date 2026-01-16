'use client'

import { useState } from 'react'
import { Copy, Check, Eye } from 'lucide-react'

interface EmbedCodeGeneratorProps {
  webinarId: string
  webinarSlug: string
}

export default function EmbedCodeGenerator({ webinarId, webinarSlug }: EmbedCodeGeneratorProps) {
  const [formType, setFormType] = useState<'inline' | 'popup'>('popup')
  const [theme, setTheme] = useState('registration')
  const [copied, setCopied] = useState(false)

  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env.NEXT_PUBLIC_APP_URL || 
       process.env.NEXTAUTH_URL || 
       'https://emaanpowerclasses.com')

  const getEmbedCode = () => {
    if (formType === 'inline') {
      return `<!-- Webinar Registration Form (Inline) -->
<iframe 
  src="${baseUrl}/embed/${webinarSlug}" 
  width="100%" 
  height="800" 
  frameborder="0" 
  style="border: none; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
  title="Webinar Registration">
</iframe>`
    } else {
      return `<!-- Webinar Registration Modal (Popup) -->
<script>
(function() {
  function openWebinarModal() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'webinar-modal-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn 0.2s ease-out;';
    
    // Create iframe container
    const container = document.createElement('div');
    container.style.cssText = 'width:100%;max-width:600px;max-height:95vh;background:transparent;border-radius:16px;overflow:hidden;animation:slideUp 0.3s ease-out;';
    
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = '${baseUrl}/embed-modal/${webinarSlug}';
    iframe.style.cssText = 'width:100%;height:95vh;max-height:700px;border:none;background:transparent;display:block;';
    iframe.setAttribute('allow', 'clipboard-write');
    
    // Close on overlay click
    overlay.onclick = (e) => { 
      if(e.target === overlay) {
        overlay.style.animation = 'fadeOut 0.2s ease-out';
        setTimeout(() => overlay.remove(), 200);
      }
    };
    
    // Listen for close message from iframe
    window.addEventListener('message', function(e) {
      if(e.data === 'closeWebinarModal') {
        overlay.style.animation = 'fadeOut 0.2s ease-out';
        setTimeout(() => overlay.remove(), 200);
      }
    });
    
    // Add animations
    if(!document.getElementById('webinar-modal-styles')) {
      const style = document.createElement('style');
      style.id = 'webinar-modal-styles';
      style.textContent = \`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      \`;
      document.head.appendChild(style);
    }
    
    container.appendChild(iframe);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
  }
  
  // Expose globally
  window.openWebinarModal = openWebinarModal;
})();
</script>

<!-- Use this button anywhere on your page -->
<button 
  onclick="openWebinarModal()" 
  style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 14px 32px; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 16px; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4); transition: all 0.2s;"
  onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 20px rgba(139, 92, 246, 0.5)';"
  onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 14px rgba(139, 92, 246, 0.4)';">
  Register for Webinar
</button>`
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getEmbedCode())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const previewForm = () => {
    window.open(`${baseUrl}/api/embed/${webinarId}/preview?theme=${theme}&type=${formType}`, '_blank')
  }

  const themes = [
    { value: 'registration', name: 'Registration Style', colors: 'bg-gradient-to-r from-purple-600 to-indigo-700', description: 'Modern with trust badges' },
    { value: 'purple', name: 'Corporate', colors: 'bg-gradient-to-r from-purple-600 to-indigo-600', description: 'Clean & professional' },
    { value: 'blue', name: 'Material', colors: 'bg-gradient-to-r from-blue-600 to-cyan-500', description: 'Card-based design' },
    { value: 'green', name: 'Playful', colors: 'bg-gradient-to-r from-green-600 to-emerald-500', description: 'Bold & vibrant' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Embed Code Generator</h3>
        <p className="text-sm text-gray-600 mb-4">
          Copy and paste this code into your website to add a registration form.
        </p>
      </div>

      {/* Form Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Form Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormType('inline')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              formType === 'inline'
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold mb-1">Inline Form</div>
            <div className="text-sm text-gray-600">
              Embeds directly on your page
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFormType('popup')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              formType === 'popup'
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold mb-1">Popup Form</div>
            <div className="text-sm text-gray-600">
              Opens in a modal when clicked
            </div>
          </button>
        </div>
      </div>

      {/* Theme Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Theme
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {themes.map((t) => (
            <button
              type="button"
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`p-3 border-2 rounded-lg text-center transition-all ${
                theme === t.value
                  ? 'border-purple-600 ring-2 ring-purple-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`h-16 rounded-md mb-2 ${t.colors}`}></div>
              <div className="text-sm font-medium">{t.name}</div>
              {t.description && (
                <div className="text-xs text-gray-500 mt-1">{t.description}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Embed Code */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Embed Code
          </label>
          <button
            type="button"
            onClick={previewForm}
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>
        <div className="relative">
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            {getEmbedCode()}
          </pre>
          <button
            type="button"
            onClick={copyToClipboard}
            className="absolute top-2 right-2 px-3 py-1.5 bg-white hover:bg-gray-100 rounded-md text-sm font-medium flex items-center gap-2 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">
          📝 How to Use:
        </h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          {formType === 'inline' ? (
            <>
              <li>Copy the embed code above</li>
              <li>Paste it into your website's HTML where you want the form to appear</li>
              <li>That's it! The form will automatically load on your page</li>
            </>
          ) : (
            <>
              <li>Copy the embed code above</li>
              <li>Add the button code where you want the trigger button</li>
              <li>Add the script code anywhere on your page (bottom of body tag recommended)</li>
              <li>Customize the button text and styling as needed</li>
            </>
          )}
        </ol>
      </div>

      {/* Direct Link */}
      <div className="border-t pt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or share the direct registration link:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={`${baseUrl}/w/${webinarSlug}`}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
          />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(`${baseUrl}/w/${webinarSlug}`)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
        </div>
      </div>
    </div>
  )
}
