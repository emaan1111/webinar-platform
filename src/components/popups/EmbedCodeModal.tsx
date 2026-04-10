'use client'

import { useState } from 'react'
import { X, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface EmbedCodeModalProps {
  slug: string
  onClose: () => void
}

export default function EmbedCodeModal({ slug, onClose }: EmbedCodeModalProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  // Full iframe-based modal script (like webinar modal)
  const fullModalScript = `<!-- Popup Form Modal -->
<script>
(function() {
  function openPopupFormModal() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'popup-form-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;animation:popupFadeIn 0.2s ease-out;';
    
    // Create iframe container
    const container = document.createElement('div');
    container.style.cssText = 'width:100%;max-width:500px;max-height:95vh;background:transparent;border-radius:16px;overflow:hidden;animation:popupSlideUp 0.3s ease-out;';
    
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = '${origin}/popup-embed/${slug}';
    iframe.style.cssText = 'width:100%;height:95vh;max-height:650px;border:none;background:transparent;display:block;';
    iframe.setAttribute('allow', 'clipboard-write');
    
    // Close on overlay click
    overlay.onclick = (e) => { 
      if(e.target === overlay) {
        overlay.style.animation = 'popupFadeOut 0.2s ease-out';
        setTimeout(() => overlay.remove(), 200);
      }
    };
    
    // Listen for close message from iframe
    window.addEventListener('message', function handler(e) {
      if(e.data === 'closePopupModal') {
        overlay.style.animation = 'popupFadeOut 0.2s ease-out';
        setTimeout(() => overlay.remove(), 200);
        window.removeEventListener('message', handler);
      }
      if(e.data && e.data.type === 'popupRedirect') {
        window.location.href = e.data.url;
      }
    });
    
    // Add animations
    if(!document.getElementById('popup-form-styles')) {
      const style = document.createElement('style');
      style.id = 'popup-form-styles';
      style.textContent = \`
        @keyframes popupFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popupFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes popupSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      \`;
      document.head.appendChild(style);
    }
    
    container.appendChild(iframe);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
  }
  
  // Expose globally
  window.openPopupFormModal = openPopupFormModal;
})();
</script>

<!-- Use this button anywhere on your page -->
<button 
  onclick="openPopupFormModal()" 
  style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 14px 32px; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 16px; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4); transition: all 0.2s;"
  onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 20px rgba(139, 92, 246, 0.5)';"
  onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 14px rgba(139, 92, 246, 0.4)';">
  Sign Up Now
</button>`

  // Auto popup on page load
  const autoPopupScript = `<!-- Auto Popup on Page Load -->
<script>
(function() {
  function openPopupFormModal() {
    const overlay = document.createElement('div');
    overlay.id = 'popup-form-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;animation:popupFadeIn 0.2s ease-out;';
    
    const container = document.createElement('div');
    container.style.cssText = 'width:100%;max-width:500px;max-height:95vh;background:transparent;border-radius:16px;overflow:hidden;animation:popupSlideUp 0.3s ease-out;';
    
    const iframe = document.createElement('iframe');
    iframe.src = '${origin}/popup-embed/${slug}';
    iframe.style.cssText = 'width:100%;height:95vh;max-height:650px;border:none;background:transparent;display:block;';
    
    overlay.onclick = (e) => { 
      if(e.target === overlay) {
        overlay.style.animation = 'popupFadeOut 0.2s ease-out';
        setTimeout(() => overlay.remove(), 200);
      }
    };
    
    window.addEventListener('message', function handler(e) {
      if(e.data === 'closePopupModal') {
        overlay.style.animation = 'popupFadeOut 0.2s ease-out';
        setTimeout(() => overlay.remove(), 200);
      }
      if(e.data && e.data.type === 'popupRedirect') {
        window.location.href = e.data.url;
      }
    });
    
    if(!document.getElementById('popup-form-styles')) {
      const style = document.createElement('style');
      style.id = 'popup-form-styles';
      style.textContent = '@keyframes popupFadeIn{from{opacity:0}to{opacity:1}}@keyframes popupFadeOut{from{opacity:1}to{opacity:0}}@keyframes popupSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}';
      document.head.appendChild(style);
    }
    
    container.appendChild(iframe);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
  }
  
  // Auto open on page load
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', openPopupFormModal);
  } else {
    openPopupFormModal();
  }
})();
</script>`

  // Inline embed (no popup)
  const inlineEmbed = `<!-- Inline Form Embed (no popup overlay) -->
<div id="popup-form-container" style="max-width:500px;margin:0 auto;"></div>
<script>
(function() {
  const container = document.getElementById('popup-form-container');
  const iframe = document.createElement('iframe');
  iframe.src = '${origin}/popup-embed/${slug}';
  iframe.style.cssText = 'width:100%;min-height:500px;border:none;background:transparent;display:block;';
  
  window.addEventListener('message', function(e) {
    if(e.data && e.data.type === 'popupRedirect') {
      window.location.href = e.data.url;
    }
  });
  
  container.appendChild(iframe);
})();
</script>`

  const copyCode = (code: string, label: string) => {
    navigator.clipboard.writeText(code)
    setCopied(label)
    toast.success('Copied!')
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">Embed Code</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Recommended: Full Modal Script with Button */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-gray-800">Button + Modal (Recommended)</h3>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">Best for ClickFunnels</span>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Adds a styled button that opens the popup when clicked. Copy this entire script to your page.
            </p>
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-[300px]">
                {fullModalScript}
              </pre>
              <button
                onClick={() => copyCode(fullModalScript, 'full')}
                className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white"
              >
                {copied === 'full' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Auto Popup on Load */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Auto Popup (on page load)</h3>
            <p className="text-xs text-gray-500 mb-2">
              The popup appears automatically when the page loads. Good for lead capture pages.
            </p>
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-[200px]">
                {autoPopupScript}
              </pre>
              <button
                onClick={() => copyCode(autoPopupScript, 'auto')}
                className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white"
              >
                {copied === 'auto' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Inline Embed */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Inline Embed (no popup)</h3>
            <p className="text-xs text-gray-500 mb-2">
              Embeds the form directly on your page without a popup overlay.
            </p>
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-[200px]">
                {inlineEmbed}
              </pre>
              <button
                onClick={() => copyCode(inlineEmbed, 'inline')}
                className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white"
              >
                {copied === 'inline' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Direct iframe URL */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Direct Iframe URL</h3>
            <p className="text-xs text-gray-500 mb-2">
              Use this URL directly in an iframe if you need more control.
            </p>
            <div className="relative">
              <pre className="bg-gray-100 text-gray-800 text-xs p-3 rounded-lg overflow-x-auto">
                {origin}/popup-embed/{slug}
              </pre>
              <button
                onClick={() => copyCode(`${origin}/popup-embed/${slug}`, 'url')}
                className="absolute top-2 right-2 p-1.5 bg-gray-300 hover:bg-gray-400 rounded text-gray-700"
              >
                {copied === 'url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
