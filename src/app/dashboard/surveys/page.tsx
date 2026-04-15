'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

interface Survey {
  id: string
  title: string
  slug: string
  isActive: boolean
  createdAt: string
  _count: { questions: number; responses: number }
}

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const fetchSurveys = async () => {
    const res = await fetch('/api/surveys')
    if (res.ok) {
      const data = await res.json()
      setSurveys(data.surveys)
    }
    setLoading(false)
  }

  useEffect(() => { fetchSurveys() }, [])

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    const res = await fetch('/api/surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    })
    if (res.ok) {
      setNewTitle('')
      fetchSurveys()
    }
    setCreating(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this survey and all its responses?')) return
    await fetch(`/api/surveys/${id}`, { method: 'DELETE' })
    fetchSurveys()
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetch(`/api/surveys/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    fetchSurveys()
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Surveys</h1>
        </div>

        {/* Create */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Create New Survey</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Survey title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newTitle.trim()}
              className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : surveys.length === 0 ? (
          <p className="text-gray-500">No surveys yet. Create one above.</p>
        ) : (
          <div className="space-y-4">
            {surveys.map((s) => (
              <div key={s.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{s.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      {s._count.questions} questions • {s._count.responses} responses
                    </p>
                    <p className="text-xs text-gray-400">
                      Public link: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{baseUrl}/survey/{s.slug}</code>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggle(s.id, s.isActive)} className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">
                      {s.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <Link href={`/dashboard/surveys/${s.id}`} className="text-sm px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
                      Edit
                    </Link>
                    <Link href={`/dashboard/surveys/${s.id}/stats`} className="text-sm px-3 py-1.5 bg-green-700 text-white rounded-lg hover:bg-green-800">
                      Stats
                    </Link>
                    <button onClick={() => handleDelete(s.id)} className="text-sm px-3 py-1.5 text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
