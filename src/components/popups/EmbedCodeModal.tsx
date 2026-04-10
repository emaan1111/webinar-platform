'use client'

import { useState } from 'react'
import { X, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface EmbedCodeModalProps {
  slug: string
  onClose: () => void
}

export default function EmbedCodeModal({ slug, onClose }: EmbedCodeModalProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const embedScript = `<!-- Popup Form Embed -->
<script src="${origin}/popup-embed.js" data-popup="${slug}"></script>`

  const embedButton = `<!-- Popup Form Button Trigger -->
<script src="${origin}/popup-embed.js" data-popup="${slug}" data-trigger="button" data-button-text="Sign Up" data-button-style="background:#4f46e5;color:#fff;padding:12px 24px;border:none;border-radius:8px;font-size:16px;cursor:pointer;"></script>`

  const embedInline = `<!-- Popup Form Inline Embed -->
<div id="popup-${slug}"></div>
<script src="${origin}/popup-embed.js" data-popup="${slug}" data-mode="inline" data-container="popup-${slug}"></script>`

  const embedDelayed = `<!-- Popup appears after 3 seconds -->
<script src="${origin}/popup-embed.js" data-popup="${slug}" data-delay="3000"></script>`

  const copyCode = (code: string, label: string) => {
    navigator.clipboard.writeText(code)
    setCopied(label)
    toast.success('Copied!')
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Embed Code</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Popup Trigger */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Auto Popup (appears on page load)</h3>
            <p className="text-xs text-gray-500 mb-2">
              Add this script tag to any page. The popup will appear automatically.
            </p>
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                {embedScript}
              </pre>
              <button
                onClick={() => copyCode(embedScript, 'script')}
                className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white"
              >
                {copied === 'script' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Button Trigger */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Button Trigger</h3>
            <p className="text-xs text-gray-500 mb-2">
              Adds a button that opens the popup when clicked. Customize data-button-text and data-button-style.
            </p>
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                {embedButton}
              </pre>
              <button
                onClick={() => copyCode(embedButton, 'button')}
                className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white"
              >
                {copied === 'button' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Inline Embed */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Inline Embed</h3>
            <p className="text-xs text-gray-500 mb-2">
              Renders the form directly inside a container on your page (no popup overlay).
            </p>
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                {embedInline}
              </pre>
              <button
                onClick={() => copyCode(embedInline, 'inline')}
                className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white"
              >
                {copied === 'inline' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Delayed Popup */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Delayed Popup</h3>
            <p className="text-xs text-gray-500 mb-2">
              Show popup after a delay (in milliseconds). Great for exit-intent style behavior.
            </p>
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                {embedDelayed}
              </pre>
              <button
                onClick={() => copyCode(embedDelayed, 'delayed')}
                className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white"
              >
                {copied === 'delayed' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Optional Attributes */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Optional Attributes</h3>
            <div className="text-xs text-gray-600 space-y-1 font-mono bg-gray-50 p-3 rounded">
              <p><code className="text-blue-600">data-delay="3000"</code> — Delay before showing (ms)</p>
              <p><code className="text-blue-600">data-trigger="button"</code> — Show button instead of auto popup</p>
              <p><code className="text-blue-600">data-button-text="..."</code> — Custom button text</p>
              <p><code className="text-blue-600">data-button-style="..."</code> — Custom button CSS</p>
              <p><code className="text-blue-600">data-mode="inline"</code> — Embed form inline (no overlay)</p>
              <p><code className="text-blue-600">data-container="id"</code> — Container element ID for inline mode</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
