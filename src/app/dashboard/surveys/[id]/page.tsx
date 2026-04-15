'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

interface Question {
  id: string
  section: string
  question: string
  type: string
  options: string // JSON
  maxSelect: number
  position: number
}

interface Survey {
  id: string
  title: string
  slug: string
  description: string | null
  thankYouTitle: string
  thankYouBody: string | null
  primaryColor: string
  isActive: boolean
  questions: Question[]
  _count: { responses: number }
}

export default function SurveyEditorPage() {
  const params = useParams()
  const router = useRouter()
  const surveyId = params.id as string

  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'questions' | 'settings' | 'thankyou'>('questions')

  // Settings form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#1a5c3a')
  const [thankYouTitle, setThankYouTitle] = useState('')
  const [thankYouBody, setThankYouBody] = useState('')

  // New question form
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [newSection, setNewSection] = useState('')
  const [newQuestion, setNewQuestion] = useState('')
  const [newType, setNewType] = useState('single')
  const [newMaxSelect, setNewMaxSelect] = useState(1)
  const [newOptions, setNewOptions] = useState<string[]>(['', ''])

  // Edit question
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editSection, setEditSection] = useState('')
  const [editQuestion, setEditQuestion] = useState('')
  const [editType, setEditType] = useState('single')
  const [editMaxSelect, setEditMaxSelect] = useState(1)
  const [editOptions, setEditOptions] = useState<string[]>([])

  const fetchSurvey = useCallback(async () => {
    const res = await fetch(`/api/surveys/${surveyId}`)
    if (res.ok) {
      const data = await res.json()
      const s = data.survey
      setSurvey(s)
      setTitle(s.title)
      setDescription(s.description || '')
      setPrimaryColor(s.primaryColor)
      setThankYouTitle(s.thankYouTitle)
      setThankYouBody(s.thankYouBody || '')
    }
    setLoading(false)
  }, [surveyId])

  useEffect(() => { fetchSurvey() }, [fetchSurvey])

  const saveSettings = async () => {
    setSaving(true)
    await fetch(`/api/surveys/${surveyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, primaryColor }),
    })
    setSaving(false)
    fetchSurvey()
  }

  const saveThankYou = async () => {
    setSaving(true)
    await fetch(`/api/surveys/${surveyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thankYouTitle, thankYouBody }),
    })
    setSaving(false)
    fetchSurvey()
  }

  const addQuestion = async () => {
    const opts = newOptions.filter((o) => o.trim())
    if (!newQuestion.trim() || opts.length < 2) return
    setSaving(true)
    await fetch(`/api/surveys/${surveyId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: newSection || 'General',
        question: newQuestion,
        type: newType,
        options: opts,
        maxSelect: newType === 'multi' ? newMaxSelect : 1,
      }),
    })
    setShowAddQuestion(false)
    setNewSection('')
    setNewQuestion('')
    setNewType('single')
    setNewMaxSelect(1)
    setNewOptions(['', ''])
    setSaving(false)
    fetchSurvey()
  }

  const deleteQuestion = async (qId: string) => {
    if (!confirm('Delete this question?')) return
    await fetch(`/api/surveys/${surveyId}/questions/${qId}`, { method: 'DELETE' })
    fetchSurvey()
  }

  const startEdit = (q: Question) => {
    setEditingId(q.id)
    setEditSection(q.section)
    setEditQuestion(q.question)
    setEditType(q.type)
    setEditMaxSelect(q.maxSelect)
    setEditOptions(JSON.parse(q.options))
  }

  const saveEdit = async () => {
    if (!editingId) return
    const opts = editOptions.filter((o) => o.trim())
    if (!editQuestion.trim() || opts.length < 2) return
    setSaving(true)
    await fetch(`/api/surveys/${surveyId}/questions/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: editSection || 'General',
        question: editQuestion,
        type: editType,
        options: opts,
        maxSelect: editType === 'multi' ? editMaxSelect : 1,
      }),
    })
    setEditingId(null)
    setSaving(false)
    fetchSurvey()
  }

  const moveQuestion = async (qId: string, direction: 'up' | 'down') => {
    if (!survey) return
    const qs = [...survey.questions].sort((a, b) => a.position - b.position)
    const idx = qs.findIndex((q) => q.id === qId)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === qs.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const updates = [
      { id: qs[idx].id, position: qs[swapIdx].position },
      { id: qs[swapIdx].id, position: qs[idx].position },
    ]

    await fetch(`/api/surveys/${surveyId}/questions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: updates }),
    })
    fetchSurvey()
  }

  if (loading) {
    return <DashboardLayout><div className="p-8 text-gray-500">Loading...</div></DashboardLayout>
  }

  if (!survey) {
    return <DashboardLayout><div className="p-8 text-red-600">Survey not found</div></DashboardLayout>
  }

  const sortedQuestions = [...survey.questions].sort((a, b) => a.position - b.position)

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/dashboard/surveys" className="text-gray-400 hover:text-gray-600">← Surveys</Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
            <p className="text-sm text-gray-500">{survey._count.responses} responses • /survey/{survey.slug}</p>
          </div>
          <Link href={`/dashboard/surveys/${surveyId}/stats`} className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 text-sm">
            View Stats
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {(['questions', 'settings', 'thankyou'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab === t ? 'border-green-700 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t === 'questions' ? `Questions (${sortedQuestions.length})` : t === 'settings' ? 'Settings' : 'Thank You Page'}
            </button>
          ))}
        </div>

        {/* Questions Tab */}
        {tab === 'questions' && (
          <div className="space-y-4">
            {sortedQuestions.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-lg border border-gray-200 p-5">
                {editingId === q.id ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                        <input value={editSection} onChange={(e) => setEditSection(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select value={editType} onChange={(e) => setEditType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                          <option value="single">Single choice</option>
                          <option value="multi">Multiple choice</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                      <textarea value={editQuestion} onChange={(e) => setEditQuestion(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    {editType === 'multi' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max selections</label>
                        <input type="number" min={1} value={editMaxSelect} onChange={(e) => setEditMaxSelect(parseInt(e.target.value) || 1)} className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                      {editOptions.map((opt, i) => (
                        <div key={i} className="flex gap-2 mb-2">
                          <input value={opt} onChange={(e) => { const o = [...editOptions]; o[i] = e.target.value; setEditOptions(o) }} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                          <button onClick={() => setEditOptions(editOptions.filter((_, j) => j !== i))} className="text-red-500 text-sm px-2">✕</button>
                        </div>
                      ))}
                      <button onClick={() => setEditOptions([...editOptions, ''])} className="text-sm text-green-700 hover:underline">+ Add option</button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} disabled={saving} className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{q.section}</span>
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">{q.type === 'multi' ? `Multi (max ${q.maxSelect})` : 'Single'}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-2">{q.question}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(JSON.parse(q.options) as string[]).map((opt, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-gray-600">{opt}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <button onClick={() => moveQuestion(q.id, 'up')} disabled={idx === 0} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30" title="Move up">↑</button>
                        <button onClick={() => moveQuestion(q.id, 'down')} disabled={idx === sortedQuestions.length - 1} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30" title="Move down">↓</button>
                        <button onClick={() => startEdit(q)} className="p-1.5 text-gray-400 hover:text-blue-600" title="Edit">✎</button>
                        <button onClick={() => deleteQuestion(q.id)} className="p-1.5 text-gray-400 hover:text-red-600" title="Delete">🗑</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add Question */}
            {showAddQuestion ? (
              <div className="bg-white rounded-lg border-2 border-dashed border-green-300 p-5 space-y-4">
                <h3 className="font-semibold text-gray-900">Add Question</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                    <input value={newSection} onChange={(e) => setNewSection(e.target.value)} placeholder="e.g. About Your Family" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <option value="single">Single choice</option>
                      <option value="multi">Multiple choice</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                  <textarea value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                {newType === 'multi' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max selections</label>
                    <input type="number" min={1} value={newMaxSelect} onChange={(e) => setNewMaxSelect(parseInt(e.target.value) || 1)} className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                  {newOptions.map((opt, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input value={opt} onChange={(e) => { const o = [...newOptions]; o[i] = e.target.value; setNewOptions(o) }} placeholder={`Option ${i + 1}`} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      {newOptions.length > 2 && <button onClick={() => setNewOptions(newOptions.filter((_, j) => j !== i))} className="text-red-500 text-sm px-2">✕</button>}
                    </div>
                  ))}
                  <button onClick={() => setNewOptions([...newOptions, ''])} className="text-sm text-green-700 hover:underline">+ Add option</button>
                </div>
                <div className="flex gap-2">
                  <button onClick={addQuestion} disabled={saving} className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800 disabled:opacity-50">
                    {saving ? 'Adding...' : 'Add Question'}
                  </button>
                  <button onClick={() => setShowAddQuestion(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddQuestion(true)}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-green-400 hover:text-green-700 transition-colors"
              >
                + Add Question
              </button>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Survey Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-10 rounded border border-gray-300 cursor-pointer" />
                <input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <button onClick={saveSettings} disabled={saving} className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}

        {/* Thank You Tab */}
        {tab === 'thankyou' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thank You Title</label>
              <input value={thankYouTitle} onChange={(e) => setThankYouTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thank You Body (HTML supported)</label>
              <textarea value={thankYouBody} onChange={(e) => setThankYouBody(e.target.value)} rows={8} className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm" />
            </div>
            {/* Preview */}
            <div className="border border-gray-200 rounded-lg p-8 bg-gray-50">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Preview</p>
              <div className="text-center">
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤲</div>
                <h2 className="text-2xl font-semibold mb-3" style={{ color: primaryColor }}>{thankYouTitle || 'Thank you!'}</h2>
                {thankYouBody && <div className="text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: thankYouBody }} />}
              </div>
            </div>
            <button onClick={saveThankYou} disabled={saving} className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Thank You Page'}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
