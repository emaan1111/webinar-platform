'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Heart, ThumbsUp, Trash2, AlertCircle, CheckCircle, Search, Filter } from 'lucide-react'

interface Reaction {
  id: string
  type: 'heart' | 'clap' | 'thumbsUp'
  videoTimestamp: number
  isScripted: boolean
  isHidden: boolean
  createdAt: string
  userName?: string
  user?: {
    name: string
    email: string
  }
  registration?: {
    name: string
    email: string
  }
  webinar: {
    id: string
    title: string
  }
}

  // Icon mapping for different reaction types
  const reactionIcons: Record<string, React.ReactNode> = {
    heart: <Heart className="w-5 h-5 text-red-500" />,
    clap: <ThumbsUp className="w-5 h-5 text-yellow-500" />,
    thumbsUp: <ThumbsUp className="w-5 h-5 text-blue-500" />,
  }

  const reactionLabels = {
    heart: 'Heart',
    clap: 'Clap',
    thumbsUp: 'Thumbs Up'
  }

export default function ReactionsManagementPage() {
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'scripted' | 'real'>('all')
  const [filterWebinar, setFilterWebinar] = useState<string>('all')
  const [webinars, setWebinars] = useState<Array<{ id: string; title: string }>>([])

  useEffect(() => {
    fetchReactions()
  }, [])

  const fetchReactions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reactions')
      if (response.ok) {
        const data = await response.json()
        // API returns array directly, not wrapped in {reactions: [...]}
        const reactionsArray = Array.isArray(data) ? data : (data.reactions || [])
        setReactions(reactionsArray)
        
        // Extract unique webinars
        const uniqueWebinars = Array.from(
          new Map(reactionsArray.map((r: Reaction) => [r.webinar.id, r.webinar])).values()
        )
        setWebinars(uniqueWebinars as Array<{ id: string; title: string }>)
      } else {
        setError('Failed to fetch reactions')
      }
    } catch (err) {
      setError('Error loading reactions')
      console.error('Fetch reactions error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reaction?')) {
      return
    }

    try {
      const response = await fetch(`/api/reactions/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('Reaction deleted successfully!')
        fetchReactions()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Failed to delete reaction')
      }
    } catch (err) {
      setError('Error deleting reaction')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      setError('Please select at least one reaction')
      return
    }

    if (!confirm(`Delete ${selectedIds.size} selected reaction(s)?`)) {
      return
    }

    setDeleting(true)
    setError('')

    try {
      const deletePromises = Array.from(selectedIds).map(id =>
        fetch(`/api/reactions/${id}`, { method: 'DELETE' })
      )

      const results = await Promise.all(deletePromises)
      const failedCount = results.filter(r => !r.ok).length

      if (failedCount === 0) {
        setSuccess(`Successfully deleted ${selectedIds.size} reaction(s)!`)
        setSelectedIds(new Set())
      } else {
        setError(`Failed to delete ${failedCount} reaction(s)`)
      }

      fetchReactions()
      setTimeout(() => {
        setSuccess('')
        setError('')
      }, 3000)
    } catch (err) {
      setError('Error during bulk delete')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteScripted = async () => {
    const scriptedReactions = reactions.filter(r => r.isScripted)

    if (scriptedReactions.length === 0) {
      setError('No scripted reactions found')
      setTimeout(() => setError(''), 3000)
      return
    }

    if (!confirm(`Delete all ${scriptedReactions.length} scripted/fake reactions?`)) {
      return
    }

    setDeleting(true)
    try {
      const deletePromises = scriptedReactions.map(r =>
        fetch(`/api/reactions/${r.id}`, { method: 'DELETE' })
      )

      const results = await Promise.all(deletePromises)
      const failedCount = results.filter(r => !r.ok).length

      if (failedCount === 0) {
        setSuccess(`Successfully deleted ${scriptedReactions.length} scripted reactions!`)
      } else {
        setError(`Failed to delete ${failedCount} reactions`)
      }

      fetchReactions()
      setSelectedIds(new Set())
      setTimeout(() => {
        setSuccess('')
        setError('')
      }, 3000)
    } catch (err) {
      setError('Error deleting scripted reactions')
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleSelect = (id: string) => {
    const newSelection = new Set(selectedIds)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedIds(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === filteredReactions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredReactions.map(r => r.id)))
    }
  }

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Filter reactions
  const filteredReactions = reactions.filter(reaction => {
    // Type filter
    if (filterType === 'scripted' && !reaction.isScripted) return false
    if (filterType === 'real' && reaction.isScripted) return false

    // Webinar filter
    if (filterWebinar !== 'all' && reaction.webinar.id !== filterWebinar) return false

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const userName = reaction.user?.name || reaction.registration?.name || reaction.userName || ''
      const webinarTitle = reaction.webinar.title.toLowerCase()
      return userName.toLowerCase().includes(query) || webinarTitle.includes(query)
    }

    return true
  })

  const stats = {
    total: reactions.length,
    scripted: reactions.filter(r => r.isScripted).length,
    real: reactions.filter(r => !r.isScripted).length,
    hearts: reactions.filter(r => r.type === 'heart').length,
    claps: reactions.filter(r => r.type === 'clap').length,
    thumbsUp: reactions.filter(r => r.type === 'thumbsUp').length
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500" />
              Reactions Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage all webinar reactions - view, filter, and delete
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <Button
                variant="secondary"
                onClick={handleBulkDelete}
                disabled={deleting}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Deleting...' : `Delete ${selectedIds.size} Selected`}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={handleDeleteScripted}
              disabled={deleting || stats.scripted === 0}
              className="flex items-center gap-2 bg-orange-100 text-orange-700 hover:bg-orange-200"
            >
              <Trash2 className="w-4 h-4" />
              Delete All Fake ({stats.scripted})
            </Button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500 mt-1">Total</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.scripted}</div>
              <div className="text-xs text-gray-500 mt-1">Fake</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.real}</div>
              <div className="text-xs text-gray-500 mt-1">Real</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.hearts}</div>
              <div className="text-xs text-gray-500 mt-1">Hearts</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.claps}</div>
              <div className="text-xs text-gray-500 mt-1">Claps</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.thumbsUp}</div>
              <div className="text-xs text-gray-500 mt-1">Thumbs Up</div>
            </CardBody>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by user or webinar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'scripted' | 'real')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="scripted">Fake/Scripted Only</option>
                  <option value="real">Real Only</option>
                </select>
              </div>

              {/* Webinar Filter */}
              <div>
                <select
                  value={filterWebinar}
                  onChange={(e) => setFilterWebinar(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Webinars</option>
                  {webinars.map(w => (
                    <option key={w.id} value={w.id}>{w.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Reactions List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Reactions ({filteredReactions.length})
              </h2>
              {filteredReactions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedIds.size === filteredReactions.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredReactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No reactions found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={filteredReactions.length > 0 && selectedIds.size === filteredReactions.length}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Webinar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReactions.map((reaction) => (
                      <tr key={reaction.id} className={reaction.isScripted ? 'bg-orange-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(reaction.id)}
                            onChange={() => handleToggleSelect(reaction.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {reactionIcons[reaction.type]}
                            <span className="text-sm text-gray-900">{reactionLabels[reaction.type]}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {reaction.user?.name || reaction.registration?.name || reaction.userName || 'Anonymous'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {reaction.user?.email || reaction.registration?.email || ''}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {reaction.webinar.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 font-mono">
                            {formatTimestamp(reaction.videoTimestamp)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {reaction.isScripted ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-200 text-orange-800">
                              FAKE
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-200 text-green-800">
                              REAL
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(reaction.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDelete(reaction.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete reaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  )
}
