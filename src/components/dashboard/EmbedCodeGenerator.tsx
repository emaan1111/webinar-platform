'use client'

import { useState } from 'react'
import { Copy, Check, Eye } from 'lucide-react'

interface EmbedCodeGeneratorProps {
  webinarId: string
  webinarSlug: string
}

export default function EmbedCodeGenerator({ webinarId, webinarSlug }: EmbedCodeGeneratorProps) {
  const [formType, setFormType] = useState<'inline' | 'popup'>('inline')
  const [theme, setTheme] = useState('default')
  const [copied, setCopied] = useState(false)

  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env.NEXT_PUBLIC_APP_URL || 
       process.env.NEXTAUTH_URL || 
       'https://emaanpowerclasses.com')

  const getEmbedCode = () => {
    if (formType === 'inline') {
      return `<!-- Webinar Registration Form -->
<div id="webinar-embed-${webinarId}"></div>
<script src="${baseUrl}/api/embed/${webinarId}?theme=${theme}&type=inline"></script>`
    } else {
      return `<!-- Add this to your button -->
<button data-webinar-popup="${webinarId}">Register for Webinar</button>

<!-- Add this script anywhere on your page -->
<script src="${baseUrl}/api/embed/${webinarId}?theme=${theme}&type=popup"></script>`
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
