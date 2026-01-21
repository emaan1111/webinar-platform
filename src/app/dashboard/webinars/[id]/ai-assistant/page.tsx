'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  Bot,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  FileText,
  DollarSign,
  HelpCircle,
  BookOpen,
  Star,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Loader,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react'

interface ProgramDocument {
  id: string
  title: string
  content: string
  category: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

interface AIConfig {
  id?: string
  enabled: boolean
  activateAfterOffer: boolean
  assistantName: string
  systemPrompt: string | null
  temperature: number
  maxTokens: number
  autoRespond: boolean
  requireApproval: boolean
  autoLikeEnabled: boolean
  autoLikePrompt: string | null
}

const categoryOptions = [
  { value: 'overview', label: 'Program Overview', icon: BookOpen, color: 'blue' },
  { value: 'pricing', label: 'Pricing & Payment', icon: DollarSign, color: 'green' },
  { value: 'faq', label: 'FAQs', icon: HelpCircle, color: 'purple' },
  { value: 'curriculum', label: 'Curriculum', icon: FileText, color: 'orange' },
  { value: 'testimonials', label: 'Testimonials', icon: Star, color: 'yellow' },
  { value: 'general', label: 'General', icon: FileText, color: 'gray' }
]

export default function AIAssistantPage() {
  const params = useParams()
  const webinarId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [documents, setDocuments] = useState<ProgramDocument[]>([])
  const [aiConfig, setAIConfig] = useState<AIConfig>({
    enabled: false,
    activateAfterOffer: true,
    assistantName: 'AI Assistant',
    systemPrompt: null,
    temperature: 0.7,
    maxTokens: 500,
    autoRespond: true,
    requireApproval: false,
    autoLikeEnabled: true,
    autoLikePrompt: null
  })

  const [showDocEditor, setShowDocEditor] = useState(false)
  const [editingDoc, setEditingDoc] = useState<ProgramDocument | null>(null)
  const [docForm, setDocForm] = useState({
    title: '',
    content: '',
    category: 'overview',
    isActive: true
  })

  const [showConfigEditor, setShowConfigEditor] = useState(false)
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set())
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Fetch AI config and documents
  useEffect(() => {
    if (webinarId) {
      fetchAIConfig()
      fetchDocuments()
    }
  }, [webinarId])

  const fetchAIConfig = async () => {
    try {
      const response = await fetch(`/api/webinars/${webinarId}/ai-config`)
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          setAIConfig(data.config)
        }
      }
    } catch (error) {
      console.error('Failed to fetch AI config:', error)
    }
  }

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/webinars/${webinarId}/program-documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveAIConfig = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/webinars/${webinarId}/ai-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiConfig)
      })

      if (response.ok) {
        alert('AI configuration saved successfully!')
        setShowConfigEditor(false)
        fetchAIConfig()
      } else {
        alert('Failed to save AI configuration')
      }
    } catch (error) {
      console.error('Failed to save AI config:', error)
      alert('Error saving AI configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleAddDocument = () => {
    setEditingDoc(null)
    setDocForm({
      title: '',
      content: '',
      category: 'overview',
      isActive: true
    })
    setShowDocEditor(true)
  }

  const handleEditDocument = (doc: ProgramDocument) => {
    setEditingDoc(doc)
    setDocForm({
      title: doc.title,
      content: doc.content,
      category: doc.category,
      isActive: doc.isActive
    })
    setShowDocEditor(true)
  }

  const handleSaveDocument = async () => {
    try {
      setSaving(true)

      if (editingDoc) {
        // Update existing document
        const response = await fetch(`/api/webinars/${webinarId}/program-documents`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: editingDoc.id,
            ...docForm
          })
        })

        if (response.ok) {
          alert('Document updated successfully!')
          setShowDocEditor(false)
          fetchDocuments()
        } else {
          alert('Failed to update document')
        }
      } else {
        // Create new document
        const response = await fetch(`/api/webinars/${webinarId}/program-documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(docForm)
        })

        if (response.ok) {
          alert('Document created successfully!')
          setShowDocEditor(false)
          fetchDocuments()
        } else {
          alert('Failed to create document')
        }
      }
    } catch (error) {
      console.error('Failed to save document:', error)
      alert('Error saving document')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document? The AI will no longer have access to this information.')) {
      return
    }

    try {
      const response = await fetch(`/api/webinars/${webinarId}/program-documents?documentId=${docId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Document deleted successfully!')
        fetchDocuments()
      } else {
        alert('Failed to delete document')
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
      alert('Error deleting document')
    }
  }

  const toggleDocExpanded = (docId: string) => {
    const newExpanded = new Set(expandedDocs)
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId)
    } else {
      newExpanded.add(docId)
    }
    setExpandedDocs(newExpanded)
  }

  const getCategoryIcon = (category: string) => {
    const cat = categoryOptions.find(c => c.value === category)
    return cat ? cat.icon : FileText
  }

  const getCategoryColor = (category: string) => {
    const cat = categoryOptions.find(c => c.value === category)
    return cat ? cat.color : 'gray'
  }

  const filteredDocuments = filterCategory === 'all' 
    ? documents 
    : documents.filter(doc => doc.category === filterCategory)

  const activeDocsCount = documents.filter(d => d.isActive).length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bot className="w-8 h-8 text-purple-600" />
              AI Chat Assistant
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure AI to answer attendee questions after the CTA
            </p>
          </div>
          <Button
            onClick={() => setShowConfigEditor(true)}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            AI Settings
          </Button>
        </div>

        {/* AI Status Card */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  aiConfig.enabled ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Bot className={`w-6 h-6 ${aiConfig.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    AI Status: {aiConfig.enabled ? 'Active' : 'Disabled'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {aiConfig.enabled 
                      ? `Will activate ${aiConfig.activateAfterOffer ? 'after CTA/offer is shown' : 'immediately'}`
                      : 'AI assistant is currently disabled'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{activeDocsCount}</div>
                  <div className="text-gray-600">Active Docs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
                  <div className="text-gray-600">Total Docs</div>
                </div>
              </div>
            </div>

            {!aiConfig.enabled && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>AI is disabled.</strong> Click "AI Settings" to enable and configure the assistant.
                </div>
              </div>
            )}

            {aiConfig.enabled && activeDocsCount === 0 && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <strong>No active documents!</strong> Add at least 3 documents (Overview, Pricing, FAQ) for the AI to work effectively.
                </div>
              </div>
            )}

            {aiConfig.enabled && activeDocsCount > 0 && activeDocsCount < 3 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>Recommendation:</strong> Add at least 3 documents (Overview, Pricing, FAQ) for best AI performance.
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Documents Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Program Documents</h2>
                <p className="text-sm text-gray-600 mt-1">
                  These documents teach the AI about your program
                </p>
              </div>
              <Button onClick={handleAddDocument} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Document
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {/* Category Filter */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterCategory === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({documents.length})
              </button>
              {categoryOptions.map(cat => {
                const count = documents.filter(d => d.category === cat.value).length
                if (count === 0) return null
                return (
                  <button
                    key={cat.value}
                    onClick={() => setFilterCategory(cat.value)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filterCategory === cat.value
                        ? `bg-${cat.color}-600 text-white`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat.label} ({count})
                  </button>
                )
              })}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filterCategory === 'all' ? 'No documents yet' : 'No documents in this category'}
                </h3>
                <p className="text-gray-600 mb-4">
                  Add your first document to start teaching the AI about your program
                </p>
                <Button onClick={handleAddDocument}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Document
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocuments.map(doc => {
                  const Icon = getCategoryIcon(doc.category)
                  const isExpanded = expandedDocs.has(doc.id)
                  
                  return (
                    <div
                      key={doc.id}
                      className={`border rounded-lg overflow-hidden transition-all ${
                        doc.isActive ? 'border-gray-200' : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${getCategoryColor(doc.category)}-100`}>
                              <Icon className={`w-5 h-5 text-${getCategoryColor(doc.category)}-600`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                                {doc.isActive ? (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded-full flex items-center gap-1">
                                    <EyeOff className="w-3 h-3" />
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Category: {categoryOptions.find(c => c.value === doc.category)?.label || doc.category}
                              </p>
                              {isExpanded && (
                                <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                                    {doc.content}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => toggleDocExpanded(doc.id)}
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                              title={isExpanded ? 'Collapse' : 'Expand'}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleEditDocument(doc)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Document Editor Modal */}
        {showDocEditor && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {editingDoc ? 'Edit Document' : 'Add New Document'}
                </h2>
                <button
                  onClick={() => setShowDocEditor(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={docForm.title}
                    onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Program Overview, Pricing Details, FAQs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={docForm.category}
                    onChange={(e) => setDocForm({ ...docForm, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {categoryOptions.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                    <span className="text-gray-500 font-normal ml-2">
                      (This is what the AI will learn from)
                    </span>
                  </label>
                  <textarea
                    value={docForm.content}
                    onChange={(e) => setDocForm({ ...docForm, content: e.target.value })}
                    rows={15}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                    placeholder="Enter detailed information about your program. Include all facts, prices, dates, and details the AI should know..."
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Be specific and detailed. The AI can only answer questions using information from these documents.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={docForm.isActive}
                    onChange={(e) => setDocForm({ ...docForm, isActive: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Active (AI can use this document)
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowDocEditor(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveDocument}
                  disabled={saving || !docForm.title.trim() || !docForm.content.trim()}
                  className="flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingDoc ? 'Update Document' : 'Create Document'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* AI Config Editor Modal */}
        {showConfigEditor && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  AI Configuration
                </h2>
                <button
                  onClick={() => setShowConfigEditor(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Enable AI */}
                <div className="flex items-start justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Enable AI Assistant</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Allow AI to answer attendee questions during webinars
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiConfig.enabled}
                      onChange={(e) => setAIConfig({ ...aiConfig, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Assistant Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assistant Name
                    <span className="text-gray-500 font-normal ml-2">
                      (How the AI will introduce itself)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={aiConfig.assistantName}
                    onChange={(e) => setAIConfig({ ...aiConfig, assistantName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., AI Assistant, Sarah, Support Bot"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    This name will appear in chat messages and AI responses
                  </p>
                </div>

                {/* Activate After Offer */}
                <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Activate After CTA/Offer</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      AI only responds after the first offer is shown (recommended)
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiConfig.activateAfterOffer}
                      onChange={(e) => setAIConfig({ ...aiConfig, activateAfterOffer: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Auto Respond */}
                <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Auto-Respond</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Automatically post AI responses to chat (recommended)
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiConfig.autoRespond}
                      onChange={(e) => setAIConfig({ ...aiConfig, autoRespond: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Auto Like Settings */}
                <div className="flex items-start justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                       <span className="text-red-500 text-lg">❤️</span> AI Auto-Liking
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Automatically "like" user messages based on specific criteria
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiConfig.autoLikeEnabled}
                      onChange={(e) => setAIConfig({ ...aiConfig, autoLikeEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </div>

                {aiConfig.autoLikeEnabled && (
                  <div className="pl-4 border-l-2 border-yellow-200 ml-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Like Instructions
                      <span className="text-gray-500 font-normal ml-2">
                        (Tell the AI which messages deserve a heart)
                      </span>
                    </label>
                    <textarea
                      value={aiConfig.autoLikePrompt || ''}
                      onChange={(e) => setAIConfig({ ...aiConfig, autoLikePrompt: e.target.value || null })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                      placeholder="Like messages that are positive, say 'I am in', 'bought', 'purchased', 'joined', or express excitement."
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Example: "Any messages saying 'I am in' or 'registered' - like them."
                    </p>
                  </div>
                )}

                {/* Temperature */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature: {aiConfig.temperature.toFixed(1)}
                    <span className="text-gray-500 font-normal ml-2">
                      (0.0 = Very factual, 1.0 = Creative)
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={aiConfig.temperature}
                    onChange={(e) => setAIConfig({ ...aiConfig, temperature: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Factual (0.3-0.5 for sales)</span>
                    <span>Balanced (0.7 recommended)</span>
                    <span>Creative</span>
                  </div>
                </div>

                {/* Max Tokens */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Response Length: {aiConfig.maxTokens} tokens
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={aiConfig.maxTokens}
                    onChange={(e) => setAIConfig({ ...aiConfig, maxTokens: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Short (200-300)</span>
                    <span>Medium (500)</span>
                    <span>Long (800-1000)</span>
                  </div>
                </div>

                {/* System Prompt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom System Prompt (Optional)
                    <span className="text-gray-500 font-normal ml-2">
                      (Leave empty for default)
                    </span>
                  </label>
                  <textarea
                    value={aiConfig.systemPrompt || ''}
                    onChange={(e) => setAIConfig({ ...aiConfig, systemPrompt: e.target.value || null })}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                    placeholder="You are a helpful assistant for [Program Name]...&#10;&#10;Your role is to answer questions about the program ONLY..."
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowConfigEditor(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveAIConfig}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Configuration
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <Card>
          <CardBody>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Getting Started</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Add at least 3 documents: Program Overview, Pricing, and FAQs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Enable AI in settings and configure temperature (0.7 recommended)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Test by asking questions in your live webinar chat after CTA</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>AI only knows what you tell it—be specific and detailed in documents</span>
                  </li>
                </ul>
                <p className="mt-3 text-sm text-gray-600">
                  For more help, see <code className="px-2 py-1 bg-gray-100 rounded text-xs">AI_KNOWLEDGE_BASE_EXPLAINED.md</code>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  )
}
