'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

interface OptionStat {
  label: string
  count: number
  percentage: number
}

interface QuestionStat {
  id: string
  section: string
  question: string
  type: string
  totalAnswered: number
  options: OptionStat[]
}

export default function SurveyStatsPage() {
  const params = useParams()
  const surveyId = params.id as string

  const [loading, setLoading] = useState(true)
  const [totalResponses, setTotalResponses] = useState(0)
  const [questionStats, setQuestionStats] = useState<QuestionStat[]>([])
  const [dailyCounts, setDailyCounts] = useState<Record<string, number>>({})
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [surveyTitle, setSurveyTitle] = useState('')
  const [resetting, setResetting] = useState(false)
  const [filters, setFilters] = useState<Record<string, string>>({})

  const fetchStats = useCallback(async () => {
    setLoading(true)
    const qs = new URLSearchParams()
    if (from) qs.set('from', from)
    if (to) qs.set('to', to)
    if (Object.keys(filters).length > 0) qs.set('filters', JSON.stringify(filters))

    const res = await fetch(`/api/surveys/${surveyId}/stats?${qs}`)
    if (res.ok) {
      const data = await res.json()
      setTotalResponses(data.totalResponses)
      setQuestionStats(data.questionStats)
      setDailyCounts(data.dailyCounts)
    }

    // Also fetch title
    const sRes = await fetch(`/api/surveys/${surveyId}`)
    if (sRes.ok) {
      const sData = await sRes.json()
      setSurveyTitle(sData.survey.title)
    }

    setLoading(false)
  }, [surveyId, from, to, filters])

  const resetResponses = async () => {
    if (!confirm(`Are you sure you want to delete ALL responses for this survey? This cannot be undone.`)) return
    setResetting(true)
    await fetch(`/api/surveys/${surveyId}/stats`, { method: 'DELETE' })
    setResetting(false)
    fetchStats()
  }

  useEffect(() => { fetchStats() }, [fetchStats])

  const toggleFilter = (questionId: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev }
      if (next[questionId] === value) {
        delete next[questionId]
      } else {
        next[questionId] = value
      }
      return next
    })
  }

  // Find top answer per question
  const getTopAnswer = (q: QuestionStat) => {
    if (q.options.length === 0) return null
    return q.options.reduce((a, b) => (a.count > b.count ? a : b))
  }

  // Group stats by section
  const sections = new Map<string, QuestionStat[]>()
  for (const q of questionStats) {
    const list = sections.get(q.section) || []
    list.push(q)
    sections.set(q.section, list)
  }

  const sectionColors: Record<string, string> = {
    "How You're Feeling Right Now": '#8b6914',
    "Your Children's Spiritual Development": '#1a5c3a',
    "What You're Seeing In Your Children": '#5c3a1a',
    'The Guilt Question': '#6b2d3e',
    'What You Need Most': '#2d4a6b',
    'About Your Family': '#4a4a4a',
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/dashboard/surveys" className="text-gray-400 hover:text-gray-600">← Surveys</Link>
              <span className="text-gray-300">/</span>
              <Link href={`/dashboard/surveys/${surveyId}`} className="text-gray-400 hover:text-gray-600">{surveyTitle || 'Edit'}</Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Survey Results</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/api/surveys/${surveyId}/export`}
              className={`px-4 py-2 text-sm bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 ${totalResponses === 0 ? 'opacity-40 pointer-events-none' : ''}`}
            >
              Export CSV
            </a>
            <button
              onClick={resetResponses}
              disabled={resetting || totalResponses === 0}
              className="px-4 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {resetting ? 'Resetting...' : 'Reset All Responses'}
            </button>
          </div>
        </div>

        {/* Overview Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Total Responses</p>
            <p className="text-3xl font-bold text-gray-900">{totalResponses}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Questions</p>
            <p className="text-3xl font-bold text-gray-900">{questionStats.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Completion Rate</p>
            <p className="text-3xl font-bold text-gray-900">
              {totalResponses > 0 && questionStats.length > 0
                ? Math.round((questionStats[questionStats.length - 1]?.totalAnswered / totalResponses) * 100)
                : 0}%
            </p>
          </div>
        </div>

        {/* Date filter */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          {(from || to) && (
            <button onClick={() => { setFrom(''); setTo('') }} className="text-sm text-gray-500 hover:text-gray-700 pb-1">Clear</button>
          )}
        </div>

        {/* Active Filters */}
        {Object.keys(filters).length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Active Filters ({totalResponses} matching)</p>
              <button onClick={() => setFilters({})} className="text-xs text-blue-600 hover:text-blue-800 underline">Clear all</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([qId, val]) => {
                const q = questionStats.find((qs) => qs.id === qId)
                return (
                  <button
                    key={qId}
                    onClick={() => toggleFilter(qId, val)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-full text-xs text-blue-800 hover:bg-blue-100"
                  >
                    <span className="font-medium truncate max-w-[150px]">{q?.question?.slice(0, 30) || qId}</span>
                    <span className="text-blue-400">:</span>
                    <span className="truncate max-w-[150px]">{val}</span>
                    <span className="text-blue-400 ml-1">&times;</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Daily Trend */}
        {Object.keys(dailyCounts).length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-5 mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Responses Over Time</h3>
            <div className="flex items-end gap-1" style={{ height: '120px' }}>
              {(() => {
                const entries = Object.entries(dailyCounts).sort(([a], [b]) => a.localeCompare(b))
                const maxVal = Math.max(...entries.map(([, v]) => v), 1)
                return entries.map(([day, count]) => (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1" title={`${day}: ${count}`}>
                    <span className="text-[10px] text-gray-400">{count}</span>
                    <div
                      className="w-full rounded-t"
                      style={{
                        height: `${Math.max((count / maxVal) * 100, 4)}%`,
                        background: '#1a5c3a',
                        minHeight: '4px',
                      }}
                    />
                    <span className="text-[9px] text-gray-400 -rotate-45 origin-top-left whitespace-nowrap mt-1">
                      {day.slice(5)}
                    </span>
                  </div>
                ))
              })()}
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading stats...</p>
        ) : (
          /* Question Stats */
          <div className="space-y-6">
            {Array.from(sections.entries()).map(([section, qs]) => (
              <div key={section}>
                <h2
                  className="text-sm font-bold uppercase tracking-widest mb-4"
                  style={{ color: sectionColors[section] || '#555' }}
                >
                  {section}
                </h2>
                <div className="space-y-4">
                  {qs.map((q) => {
                    const top = getTopAnswer(q)
                    return (
                      <div key={q.id} className="bg-white rounded-lg border border-gray-200 p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{q.question}</p>
                            <p className="text-xs text-gray-400 mt-1">{q.totalAnswered} responses • {q.type === 'multi' ? 'Multiple choice' : 'Single choice'}</p>
                          </div>
                          {top && top.count > 0 && (
                            <div className="ml-4 text-right flex-shrink-0">
                              <p className="text-2xl font-bold text-green-700">{top.percentage}%</p>
                              <p className="text-[11px] text-gray-400 max-w-[200px] truncate">Top: {top.label}</p>
                            </div>
                          )}
                        </div>

                        {/* Bar chart */}
                        <div className="space-y-2">
                          {q.options.map((opt) => {
                            const isFiltered = filters[q.id] === opt.label
                            return (
                            <div
                              key={opt.label}
                              onClick={() => toggleFilter(q.id, opt.label)}
                              className={`cursor-pointer rounded-lg px-2 py-1.5 -mx-2 transition-all ${
                                isFiltered ? 'bg-blue-50 ring-1 ring-blue-300' : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className={`truncate max-w-[70%] ${isFiltered ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                                  {isFiltered && '✓ '}{opt.label}
                                </span>
                                <span className="text-gray-400 flex-shrink-0 ml-2">{opt.count} ({opt.percentage}%)</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div
                                  className="h-2.5 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${opt.percentage}%`,
                                    background: isFiltered ? '#2563eb' : (sectionColors[q.section] || '#1a5c3a'),
                                    minWidth: opt.count > 0 ? '8px' : '0',
                                  }}
                                />
                              </div>
                            </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
