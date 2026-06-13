'use client'

import { useState, useRef, useCallback } from 'react'
import {
  GripVertical, Plus, Trash2, ChevronDown, ChevronUp, Eye, Code2,
  Type, Mail, Phone, Calendar, Hash, AlignLeft, List, ToggleLeft,
  Save, ArrowLeft, Palette, Settings2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import PopupPreview from './PopupPreview'
import EmbedCodeModal from './EmbedCodeModal'
import Link from 'next/link'

// ─── Field type definitions ───
const FIELD_TYPES = [
  { type: 'text', label: 'Text', icon: Type },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone (with country code)', icon: Phone },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'textarea', label: 'Text Area', icon: AlignLeft },
  { type: 'select', label: 'Dropdown', icon: List },
  { type: 'checkbox', label: 'Checkbox', icon: ToggleLeft },
]

const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
  { code: '+91', country: 'IN' },
  { code: '+61', country: 'AU' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
  { code: '+81', country: 'JP' },
  { code: '+86', country: 'CN' },
  { code: '+55', country: 'BR' },
  { code: '+234', country: 'NG' },
  { code: '+27', country: 'ZA' },
  { code: '+971', country: 'UAE' },
  { code: '+966', country: 'SA' },
  { code: '+92', country: 'PK' },
  { code: '+880', country: 'BD' },
  { code: '+62', country: 'ID' },
  { code: '+52', country: 'MX' },
  { code: '+39', country: 'IT' },
  { code: '+34', country: 'ES' },
  { code: '+82', country: 'KR' },
]

const FONT_OPTIONS = [
  'Inter', 'Arial', 'Helvetica', 'Georgia', 'Times New Roman',
  'Verdana', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins'
]

export interface PopupField {
  id: string
  type: string
  label: string
  placeholder: string
  required: boolean
  options: string // comma-separated for select
  width: 'full' | 'half'
  position: number
}

export interface PopupStyles {
  popupBg: string
  headerBg: string
  headerTextColor: string
  bodyBg: string
  labelColor: string
  inputBg: string
  inputBorderColor: string
  inputTextColor: string
  buttonBg: string
  buttonTextColor: string
  buttonHoverBg: string
  fontFamily: string
  headerFontSize: string
  labelFontSize: string
  inputFontSize: string
  buttonFontSize: string
  borderRadius: string
  overlayBg: string
}

const DEFAULT_STYLES: PopupStyles = {
  popupBg: '#ffffff',
  headerBg: '#4f46e5',
  headerTextColor: '#ffffff',
  bodyBg: '#ffffff',
  labelColor: '#374151',
  inputBg: '#ffffff',
  inputBorderColor: '#d1d5db',
  inputTextColor: '#111827',
  buttonBg: '#4f46e5',
  buttonTextColor: '#ffffff',
  buttonHoverBg: '#4338ca',
  fontFamily: 'Inter',
  headerFontSize: '20',
  labelFontSize: '14',
  inputFontSize: '14',
  buttonFontSize: '16',
  borderRadius: '12',
  overlayBg: 'rgba(0,0,0,0.5)',
}

interface PopupBuilderCoreProps {
  initialData?: any
  onSave: (data: any) => Promise<void>
  saving: boolean
  isEdit?: boolean
}

export default function PopupBuilderCore({ initialData, onSave, saving, isEdit }: PopupBuilderCoreProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [submitText, setSubmitText] = useState(initialData?.submitText || 'Submit')
  const [successMessage, setSuccessMessage] = useState(initialData?.successMessage || 'Thank you for your submission!')
  const [redirectUrl, setRedirectUrl] = useState(initialData?.redirectUrl || '')
  const [webhookUrl, setWebhookUrl] = useState(initialData?.webhookUrl || '')
  const [useCustomHtml, setUseCustomHtml] = useState(initialData?.useCustomHtml || false)
  const [customHtml, setCustomHtml] = useState(initialData?.customHtml || '')

  const [fields, setFields] = useState<PopupField[]>(() => {
    if (initialData?.fields && Array.isArray(initialData.fields)) {
      return initialData.fields.map((f: any, i: number) => ({
        id: f.id || `field_${Date.now()}_${i}`,
        type: f.type || 'text',
        label: f.label || '',
        placeholder: f.placeholder || '',
        required: f.required ?? false,
        options: f.options || '',
        width: f.width || 'full',
        position: f.position ?? i,
      }))
    }
    return [
      { id: 'field_name', type: 'text', label: 'Full Name', placeholder: 'Enter your name', required: true, options: '', width: 'full' as const, position: 0 },
      { id: 'field_email', type: 'email', label: 'Email', placeholder: 'Enter your email', required: true, options: '', width: 'full' as const, position: 1 },
    ]
  })

  const [styles, setStyles] = useState<PopupStyles>(() => {
    if (initialData?.styles && typeof initialData.styles === 'object') {
      return { ...DEFAULT_STYLES, ...initialData.styles }
    }
    return DEFAULT_STYLES
  })

  const [activeTab, setActiveTab] = useState<'fields' | 'style' | 'settings' | 'html'>('fields')
  const [showPreview, setShowPreview] = useState(false)
  const [showEmbedCode, setShowEmbedCode] = useState(false)
  const [expandedField, setExpandedField] = useState<string | null>(null)
  const dragField = useRef<number | null>(null)
  const dragOverField = useRef<number | null>(null)

  // ─── Drag and drop ───
  const handleDragStart = (index: number) => {
    dragField.current = index
  }

  const handleDragEnter = (index: number) => {
    dragOverField.current = index
  }

  const handleDragEnd = () => {
    if (dragField.current === null || dragOverField.current === null) return
    const reordered = [...fields]
    const [removed] = reordered.splice(dragField.current, 1)
    reordered.splice(dragOverField.current, 0, removed)
    setFields(reordered.map((f, i) => ({ ...f, position: i })))
    dragField.current = null
    dragOverField.current = null
  }

  const addField = (type: string) => {
    const typeLabel = FIELD_TYPES.find(t => t.type === type)?.label || type
    const newField: PopupField = {
      id: `field_${Date.now()}`,
      type,
      label: typeLabel,
      placeholder: `Enter ${typeLabel.toLowerCase()}`,
      required: false,
      options: type === 'select' ? 'Option 1, Option 2, Option 3' : '',
      width: 'full',
      position: fields.length,
    }
    setFields([...fields, newField])
    setExpandedField(newField.id)
  }

  const updateField = (id: string, updates: Partial<PopupField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id).map((f, i) => ({ ...f, position: i })))
  }

  const updateStyle = (key: keyof PopupStyles, value: string) => {
    setStyles(s => ({ ...s, [key]: value }))
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a popup name')
      return
    }
    if (!useCustomHtml && fields.length === 0) {
      alert('Please add at least one field')
      return
    }
    await onSave({
      name,
      description,
      fields,
      styles,
      customHtml: useCustomHtml ? customHtml : null,
      useCustomHtml,
      submitText,
      successMessage,
      redirectUrl: redirectUrl || null,
      webhookUrl: webhookUrl.trim() || null,
    })
  }

  // ─── Generate field name map for custom HTML ───
  const fieldNameMap = fields.map(f => ({
    fieldId: f.id,
    label: f.label,
    htmlName: `data-field="${f.id}"`,
  }))

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/popups" className="p-2 hover:bg-gray-100 rounded">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Popup' : 'Create Popup'}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          {isEdit && initialData?.slug && (
            <Button variant="outline" onClick={() => setShowEmbedCode(true)}>
              <Code2 className="w-4 h-4 mr-2" />
              Embed Code
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel: Builder */}
        <div className="lg:col-span-2 space-y-4">
          {/* Popup name & description */}
          <div className="bg-white rounded-lg border p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Popup Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Newsletter Signup"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional description..."
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg border">
            <div className="flex border-b">
              {(['fields', 'style', 'settings', 'html'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-3 text-sm font-medium capitalize ${
                    activeTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'html' ? 'Custom HTML' : tab}
                </button>
              ))}
            </div>

            <div className="p-4">
              {/* ─── Fields Tab ─── */}
              {activeTab === 'fields' && (
                <div className="space-y-3">
                  <div className="text-sm text-gray-500 mb-2">
                    Drag fields to reorder. Click to expand and edit.
                  </div>

                  {/* Field list */}
                  {fields.map((field, index) => {
                    const TypeIcon = FIELD_TYPES.find(t => t.type === field.type)?.icon || Type
                    const isExpanded = expandedField === field.id

                    return (
                      <div
                        key={field.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={e => e.preventDefault()}
                        className="border rounded-lg bg-gray-50 hover:bg-white transition-colors"
                      >
                        {/* Field header */}
                        <div
                          className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
                          onClick={() => setExpandedField(isExpanded ? null : field.id)}
                        >
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                          <TypeIcon className="w-4 h-4 text-gray-500" />
                          <span className="flex-1 text-sm font-medium text-gray-700">{field.label}</span>
                          {field.required && (
                            <span className="text-xs text-red-500 font-medium">Required</span>
                          )}
                          <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">{field.type}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>

                        {/* Expanded field settings */}
                        {isExpanded && (
                          <div className="border-t px-3 py-3 space-y-3 bg-white rounded-b-lg">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={e => updateField(field.id, { label: e.target.value })}
                                  className="w-full border rounded px-2 py-1.5 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Placeholder</label>
                                <input
                                  type="text"
                                  value={field.placeholder}
                                  onChange={e => updateField(field.id, { placeholder: e.target.value })}
                                  className="w-full border rounded px-2 py-1.5 text-sm"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Field ID</label>
                                <input
                                  type="text"
                                  value={field.id}
                                  onChange={e => {
                                    const newId = e.target.value.replace(/[^a-zA-Z0-9_]/g, '')
                                    if (newId && !fields.some(f => f.id === newId && f.id !== field.id)) {
                                      const updated = fields.map(f => f.id === field.id ? { ...f, id: newId } : f)
                                      setFields(updated)
                                      setExpandedField(newId)
                                    }
                                  }}
                                  className="w-full border rounded px-2 py-1.5 text-sm font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Width</label>
                                <select
                                  value={field.width}
                                  onChange={e => updateField(field.id, { width: e.target.value as 'full' | 'half' })}
                                  className="w-full border rounded px-2 py-1.5 text-sm"
                                >
                                  <option value="full">Full Width</option>
                                  <option value="half">Half Width</option>
                                </select>
                              </div>
                            </div>

                            {field.type === 'select' && (
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Options (comma-separated)</label>
                                <input
                                  type="text"
                                  value={field.options}
                                  onChange={e => updateField(field.id, { options: e.target.value })}
                                  className="w-full border rounded px-2 py-1.5 text-sm"
                                  placeholder="Option 1, Option 2, Option 3"
                                />
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={e => updateField(field.id, { required: e.target.checked })}
                                  className="rounded text-blue-600"
                                />
                                <span className="text-sm text-gray-600">Required field</span>
                              </label>
                              <button
                                onClick={() => removeField(field.id)}
                                className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Add field buttons */}
                  <div className="pt-2">
                    <div className="text-xs font-medium text-gray-500 mb-2 uppercase">Add Field</div>
                    <div className="grid grid-cols-4 gap-2">
                      {FIELD_TYPES.map(ft => {
                        const Icon = ft.icon
                        return (
                          <button
                            key={ft.type}
                            onClick={() => addField(ft.type)}
                            className="flex flex-col items-center gap-1 p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm"
                          >
                            <Icon className="w-4 h-4 text-gray-500" />
                            <span className="text-xs text-gray-600">{ft.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Style Tab ─── */}
              {activeTab === 'style' && (
                <div className="space-y-6">
                  {/* Colors section */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Palette className="w-4 h-4" /> Colors
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'popupBg', label: 'Popup Background' },
                        { key: 'headerBg', label: 'Header Background' },
                        { key: 'headerTextColor', label: 'Header Text' },
                        { key: 'bodyBg', label: 'Body Background' },
                        { key: 'labelColor', label: 'Label Color' },
                        { key: 'inputBg', label: 'Input Background' },
                        { key: 'inputBorderColor', label: 'Input Border' },
                        { key: 'inputTextColor', label: 'Input Text' },
                        { key: 'buttonBg', label: 'Button Background' },
                        { key: 'buttonTextColor', label: 'Button Text' },
                        { key: 'buttonHoverBg', label: 'Button Hover' },
                      ].map(item => (
                        <div key={item.key} className="flex items-center gap-2">
                          <input
                            type="color"
                            value={styles[item.key as keyof PopupStyles]}
                            onChange={e => updateStyle(item.key as keyof PopupStyles, e.target.value)}
                            className="w-8 h-8 rounded border cursor-pointer"
                          />
                          <div className="flex-1">
                            <span className="text-xs text-gray-600">{item.label}</span>
                            <input
                              type="text"
                              value={styles[item.key as keyof PopupStyles]}
                              onChange={e => updateStyle(item.key as keyof PopupStyles, e.target.value)}
                              className="w-full border rounded px-2 py-1 text-xs font-mono mt-0.5"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Overlay */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Overlay Background</label>
                    <input
                      type="text"
                      value={styles.overlayBg}
                      onChange={e => updateStyle('overlayBg', e.target.value)}
                      className="w-full border rounded px-2 py-1.5 text-sm font-mono"
                      placeholder="rgba(0,0,0,0.5)"
                    />
                  </div>

                  {/* Font section */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Type className="w-4 h-4" /> Typography
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Font Family</label>
                        <select
                          value={styles.fontFamily}
                          onChange={e => updateStyle('fontFamily', e.target.value)}
                          className="w-full border rounded px-2 py-1.5 text-sm"
                        >
                          {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { key: 'headerFontSize', label: 'Header Font Size (px)' },
                          { key: 'labelFontSize', label: 'Label Font Size (px)' },
                          { key: 'inputFontSize', label: 'Input Font Size (px)' },
                          { key: 'buttonFontSize', label: 'Button Font Size (px)' },
                        ].map(item => (
                          <div key={item.key}>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{item.label}</label>
                            <input
                              type="number"
                              value={styles[item.key as keyof PopupStyles]}
                              onChange={e => updateStyle(item.key as keyof PopupStyles, e.target.value)}
                              className="w-full border rounded px-2 py-1.5 text-sm"
                              min="8"
                              max="48"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Border radius */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius (px)</label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={styles.borderRadius}
                      onChange={e => updateStyle('borderRadius', e.target.value)}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{styles.borderRadius}px</span>
                  </div>
                </div>
              )}

              {/* ─── Settings Tab ─── */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Submit Button Text</label>
                    <input
                      type="text"
                      value={submitText}
                      onChange={e => setSubmitText(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Success Message</label>
                    <textarea
                      value={successMessage}
                      onChange={e => setSuccessMessage(e.target.value)}
                      rows={2}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URL (after submit)</label>
                    <input
                      type="url"
                      value={redirectUrl}
                      onChange={e => setRedirectUrl(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="https://example.com/thank-you (leave empty for no redirect)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL (send leads to another app)</label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={e => setWebhookUrl(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="https://hooks.zapier.com/... (leave empty to disable)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Each new lead is sent as a POST request with a JSON payload containing all form fields
                      keyed by field label, plus a lowercase <code className="bg-gray-100 px-1 rounded">email</code> key.
                      Checkbox fields are sent as <code className="bg-gray-100 px-1 rounded">true</code> or{' '}
                      <code className="bg-gray-100 px-1 rounded">false</code>.
                    </p>
                  </div>
                </div>
              )}

              {/* ─── Custom HTML Tab ─── */}
              {activeTab === 'html' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCustomHtml}
                        onChange={e => setUseCustomHtml(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-700">Use Custom HTML</span>
                    </label>
                  </div>

                  {useCustomHtml && (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                        <p className="font-semibold mb-1">Field Names Reference</p>
                        <p className="mb-2">
                          Use these attributes in your HTML input elements so the popup knows which field each input maps to:
                        </p>
                        <div className="bg-white rounded p-2 font-mono text-xs space-y-1">
                          {fields.map(f => (
                            <div key={f.id}>
                              <code className="text-blue-700">&lt;input data-field=&quot;{f.id}&quot; /&gt;</code>
                              <span className="text-gray-500 ml-2">← {f.label} ({f.type})</span>
                            </div>
                          ))}
                          <div className="border-t pt-1 mt-1">
                            <code className="text-green-700">&lt;button type=&quot;submit&quot;&gt;Submit&lt;/button&gt;</code>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Custom HTML</label>
                        <textarea
                          value={customHtml}
                          onChange={e => setCustomHtml(e.target.value)}
                          rows={16}
                          className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                          placeholder={`<div style="padding: 24px;">\n  <h2>Join Our Newsletter</h2>\n  <input data-field="field_name" placeholder="Your Name" />\n  <input data-field="field_email" type="email" placeholder="Email" />\n  <button type="submit">Sign Up</button>\n</div>`}
                        />
                      </div>
                    </>
                  )}

                  {!useCustomHtml && (
                    <div className="text-sm text-gray-500">
                      Enable custom HTML to provide your own popup design. Use the field names from the Fields tab in your HTML inputs.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right panel: Live Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <div className="bg-white rounded-lg border p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Live Preview</h3>
              <div className="border rounded-lg overflow-hidden bg-gray-100 min-h-[400px] flex items-center justify-center p-4">
                <PopupPreview
                  fields={fields}
                  styles={styles}
                  name={name || 'My Popup'}
                  submitText={submitText}
                  useCustomHtml={useCustomHtml}
                  customHtml={customHtml}
                  inline
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Preview Modal */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: styles.overlayBg }}
          onClick={() => setShowPreview(false)}
        >
          <div onClick={e => e.stopPropagation()} className="max-w-lg w-full mx-4">
            <PopupPreview
              fields={fields}
              styles={styles}
              name={name || 'My Popup'}
              submitText={submitText}
              useCustomHtml={useCustomHtml}
              customHtml={customHtml}
              onClose={() => setShowPreview(false)}
            />
          </div>
        </div>
      )}

      {/* Embed Code Modal */}
      {showEmbedCode && initialData?.slug && (
        <EmbedCodeModal
          slug={initialData.slug}
          onClose={() => setShowEmbedCode(false)}
        />
      )}
    </div>
  )
}
