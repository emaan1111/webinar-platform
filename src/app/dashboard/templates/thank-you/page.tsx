'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'

interface ThankYouTemplate {
  id: string
  name: string
  description: string | null
  htmlCode: string
  thumbnail: string | null
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export default function ThankYouTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<ThankYouTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<ThankYouTemplate | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Partial<ThankYouTemplate>>({})
  const [editorMode, setEditorMode] = useState<'code' | 'visual'>('code')

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/thank-you-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (template: ThankYouTemplate) => {
    setEditingTemplate(template)
    setShowEditor(true)
  }

  const handleCreate = () => {
    setEditingTemplate({
      name: '',
      description: '',
      htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You - {{webinarTitle}}</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
        }
        h1 { color: #1a1a1a; }
        .info { background: #f5f5f5; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <h1>🎉 Thank You for Registering!</h1>
    <p>Hi {{attendeeName}},</p>
    <p>You're all set for: <strong>{{webinarTitle}}</strong></p>
    
    <div class="info">
        <p><strong>Date:</strong> {{webinarDate}}</p>
        <p><strong>Time:</strong> {{webinarTime}}</p>
        <p><strong>Duration:</strong> {{webinarDuration}} minutes</p>
    </div>
    
    <p><a href="{{joinLink}}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">View Countdown Page</a></p>
</body>
</html>`,
      isSystem: false
    })
    setShowEditor(true)
  }

  const handleSave = async () => {
    try {
      const url = editingTemplate.id
        ? `/api/thank-you-templates/${editingTemplate.id}`
        : '/api/thank-you-templates'
      
      const method = editingTemplate.id ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingTemplate.name,
          description: editingTemplate.description,
          htmlCode: editingTemplate.htmlCode,
          thumbnail: editingTemplate.thumbnail
        })
      })

      if (response.ok) {
        setShowEditor(false)
        setEditingTemplate({})
        fetchTemplates()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/thank-you-templates/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchTemplates()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template')
    }
  }

  const handlePreview = (template: ThankYouTemplate) => {
    setSelectedTemplate(template)
    setShowPreview(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/dashboard/templates')}
              className="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-2"
            >
              ← Back to Templates
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Thank You Page Templates</h1>
            <p className="text-gray-600 mt-2">
              Manage templates displayed after users register for webinars
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Create New Template
          </button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{template.name}</h3>
                    {template.isSystem && (
                      <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        System Template
                      </span>
                    )}
                  </div>
                </div>
                {template.description && (
                  <p className="text-sm text-gray-600 mt-2">{template.description}</p>
                )}
              </CardHeader>
              <CardBody>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handlePreview(template)}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
                  >
                    👁️ Preview
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
                  >
                    ✏️ Edit
                  </button>
                  {!template.isSystem && (
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                    >
                      🗑️
                    </button>
                  )}
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  <p>Created: {new Date(template.createdAt).toLocaleDateString()}</p>
                  <p>Updated: {new Date(template.updatedAt).toLocaleDateString()}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No templates found</p>
            <button
              onClick={handleCreate}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Template
            </button>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {editingTemplate.id ? 'Edit Template' : 'Create New Template'}
                </h2>
                <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setEditorMode('code')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      editorMode === 'code'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    💻 Code Editor
                  </button>
                  <button
                    onClick={() => setEditorMode('visual')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      editorMode === 'visual'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🎨 Visual Editor
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.name || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Modern Minimal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingTemplate.description || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Brief description of this template"
                  />
                </div>

                {editorMode === 'code' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HTML Code *
                    </label>
                    <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                      <p className="font-medium text-blue-900 mb-1">Available Variables:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-blue-700">
                        <code>{`{{webinarTitle}}`}</code>
                        <code>{`{{webinarDescription}}`}</code>
                        <code>{`{{webinarDuration}}`}</code>
                        <code>{`{{webinarDate}}`}</code>
                        <code>{`{{webinarTime}}`}</code>
                        <code>{`{{webinarDateTime}}`}</code>
                        <code>{`{{hostName}}`}</code>
                        <code>{`{{hostEmail}}`}</code>
                        <code>{`{{attendeeName}}`}</code>
                        <code>{`{{attendeeEmail}}`}</code>
                        <code>{`{{registrationId}}`}</code>
                        <code>{`{{joinLink}}`}</code>
                        <code>{`{{calendarLink}}`}</code>
                        <code>{`{{googleCalendarLink}}`}</code>
                        <code>{`{{appleCalendarLink}}`}</code>
                        <code>{`{{countdown}}`}</code>
                        <code className="font-bold">{`{{referralCode}}`}</code>
                        <code className="font-bold">{`{{referralLink}}`}</code>
                        <code className="font-bold">{`{{whatsappReferralLink}}`}</code>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        💡 <strong>Calendar Links:</strong> <code>{`{{calendarLink}}`}</code> = Google Calendar, 
                        <code className="ml-1">{`{{appleCalendarLink}}`}</code> = Apple/ICS (works with Apple Calendar, Outlook, etc.)
                      </p>
                      <p className="text-xs text-green-600 mt-2 font-semibold">
                        🎁 <strong>NEW - Referral System:</strong> <code>{`{{referralCode}}`}</code> = User's unique code (e.g., "ABC123"),
                        <code className="ml-1">{`{{referralLink}}`}</code> = Full shareable URL with ref code,
                        <code className="ml-1">{`{{whatsappReferralLink}}`}</code> = WhatsApp share link with message
                      </p>
                    </div>
                    <textarea
                      value={editingTemplate.htmlCode || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, htmlCode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      rows={20}
                      placeholder="Enter complete HTML code with CSS and JavaScript"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Visual Editor - Live Preview
                    </label>
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                      <p className="font-medium text-amber-900 mb-1">📝 How to use Visual Editor:</p>
                      <ul className="text-amber-800 space-y-1 ml-4 list-disc">
                        <li>Right-click any element in the preview to <strong>inspect</strong> it (opens browser DevTools)</li>
                        <li>Use DevTools to edit text, styles, delete elements, or add new ones</li>
                        <li>When satisfied, copy the modified HTML from DevTools and paste into Code Editor</li>
                        <li>Or use the preview to plan your changes, then edit the code directly</li>
                      </ul>
                    </div>
                    <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white" style={{ height: '600px' }}>
                      <iframe
                        srcDoc={editingTemplate.htmlCode || '<html><body><p style="padding: 20px; text-align: center; color: #666;">Your template preview will appear here. Switch to Code Editor to add HTML.</p></body></html>'}
                        className="w-full h-full border-0"
                        title="Visual Editor Preview"
                        sandbox="allow-same-origin allow-scripts"
                      />
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                      <p className="text-blue-900">
                        💡 <strong>Pro Tip:</strong> The visual editor shows a live preview. To make structural changes, 
                        switch back to Code Editor. This preview helps you visualize your template as you edit the code.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowEditor(false)
                  setEditingTemplate({})
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!editingTemplate.name || !editingTemplate.htmlCode}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {editingTemplate.id ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-[95vw] h-[95vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-white">
              <div>
                <h2 className="text-xl font-bold">{selectedTemplate.name}</h2>
                {selectedTemplate.description && (
                  <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
                )}
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50">
              <iframe
                srcDoc={selectedTemplate.htmlCode}
                className="w-full h-full border-0 min-h-[85vh]"
                title="Template Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
