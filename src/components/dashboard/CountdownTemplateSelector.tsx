'use client'

import { useEffect, useState } from 'react'

interface CountdownTemplate {
  id: string
  name: string
  description: string | null
  thumbnail: string | null
  htmlCode?: string
  isSystem: boolean
}

interface CountdownTemplateSelectorProps {
  webinarId: string
  currentTemplateId?: string | null
  onChange?: (templateId: string | null) => void
}

export default function CountdownTemplateSelector({
  webinarId,
  currentTemplateId,
  onChange,
}: CountdownTemplateSelectorProps) {
  const [templates, setTemplates] = useState<CountdownTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    currentTemplateId || null
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<CountdownTemplate | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/countdown-pages')
      if (response.ok) {
        const data = await response.json()
        // API returns { countdownPages: [...] }
        setTemplates(data.countdownPages || [])
      }
    } catch (error) {
      console.error('Error fetching countdown pages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateChange = async (templateId: string | null) => {
    setSelectedTemplateId(templateId)
    setSaving(true)

    try {
      const response = await fetch(`/api/webinars/${webinarId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countdownPageId: templateId }),
      })

      if (!response.ok) {
        throw new Error('Failed to update countdown page')
      }

      if (onChange) {
        onChange(templateId)
      }
    } catch (error) {
      console.error('Error updating countdown page:', error)
      alert('Failed to update countdown page')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = (template: CountdownTemplate) => {
    setPreviewTemplate(template)
    setShowPreviewModal(true)
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Countdown Page Template
        </label>
        <p className="text-sm text-gray-500 mb-4">
          Select the page people see before your webinar starts. Ideal for sharing with your audience or embedding in reminder emails.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            selectedTemplateId === null
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => handleTemplateChange(null)}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center">
              <input
                type="radio"
                checked={selectedTemplateId === null}
                onChange={() => handleTemplateChange(null)}
                className="mr-2"
              />
              <h3 className="font-semibold text-gray-900">Use Default</h3>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            The system default countdown page will be used
          </p>
        </div>

        {templates.map((template) => (
          <div
            key={template.id}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedTemplateId === template.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleTemplateChange(template.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center flex-1">
                <input
                  type="radio"
                  checked={selectedTemplateId === template.id}
                  onChange={() => handleTemplateChange(template.id)}
                  className="mr-2"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  {template.isSystem && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      System
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePreview(template)
                }}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Preview
              </button>
            </div>
            {template.description && (
              <p className="text-sm text-gray-600 mt-2">{template.description}</p>
            )}
            {template.thumbnail && (
              <img
                src={template.thumbnail}
                alt={template.name}
                className="mt-3 rounded border border-gray-200 w-full h-32 object-cover"
              />
            )}
          </div>
        ))}
      </div>

      {saving && (
        <div className="text-sm text-gray-500 flex items-center">
          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Saving...
        </div>
      )}

      {showPreviewModal && previewTemplate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{previewTemplate.name}</h2>
                {previewTemplate.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {previewTemplate.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-50">
              <div className="bg-white rounded shadow-lg">
                <iframe
                  srcDoc={previewTemplate.htmlCode || '<p>No preview available</p>'}
                  className="w-full h-[600px] border-0"
                  title="Countdown Template Preview"
                  sandbox="allow-same-origin"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Note: Preview uses placeholder data. The live countdown page will insert the real webinar details.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
