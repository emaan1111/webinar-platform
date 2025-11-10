'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  DollarSign,
  ExternalLink,
  Power,
  Copy,
  Loader2,
  AlertCircle,
  Video,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface Webinar {
  id: string
  title: string
}

interface Offer {
  id: string
  webinarId: string
  title: string
  description: string | null
  price: number
  ctaText: string
  ctaUrl: string
  videoTimestamp: number // seconds
  hideAfter: number | null // seconds
  isActive: boolean
  createdAt: string
  updatedAt: string
  webinar: {
    id: string
    title: string
  }
}

// Helper to format seconds to MM:SS
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Helper to convert MM:SS to seconds
const parseTimeToSeconds = (timeStr: string): number => {
  const parts = timeStr.split(':')
  if (parts.length === 2) {
    const mins = parseInt(parts[0]) || 0
    const secs = parseInt(parts[1]) || 0
    return (mins * 60) + secs
  }
  return parseInt(timeStr) || 0
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [previewOffer, setPreviewOffer] = useState<Offer | null>(null)
  const [selectedWebinarFilter, setSelectedWebinarFilter] = useState<string>('all')
  const [expandedWebinars, setExpandedWebinars] = useState<Set<string>>(new Set())
  
  const [formData, setFormData] = useState({
    webinarId: '',
    title: '',
    description: '',
    price: '',
    ctaText: 'Get This Offer',
    ctaUrl: '',
    videoTimestamp: '', // MM:SS format
    hideAfter: '', // MM:SS format
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch webinars
      const webinarsRes = await fetch('/api/webinars')
      if (!webinarsRes.ok) throw new Error('Failed to fetch webinars')
      const webinarsData = await webinarsRes.json()
      setWebinars(webinarsData.webinars || [])
      
      // Fetch offers
      const offersRes = await fetch('/api/offers')
      if (!offersRes.ok) throw new Error('Failed to fetch offers')
      const offersData = await offersRes.json()
      setOffers(offersData.offers || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.webinarId) {
      setError('Please select a webinar')
      return
    }

    setSaving(true)
    setError('')

    try {
      const payload = {
        webinarId: formData.webinarId,
        title: formData.title,
        description: formData.description || null,
        price: parseFloat(formData.price),
        ctaText: formData.ctaText,
        ctaUrl: formData.ctaUrl,
        videoTimestamp: parseTimeToSeconds(formData.videoTimestamp),
        hideAfter: formData.hideAfter ? parseTimeToSeconds(formData.hideAfter) : null,
      }

      if (editingId) {
        // Update existing offer
        const response = await fetch('/api/offers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload })
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to update offer')
        }

        const data = await response.json()
        setOffers(offers.map(o => o.id === editingId ? data.offer : o))
      } else {
        // Create new offer
        const response = await fetch('/api/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to create offer')
        }

        const data = await response.json()
        setOffers([...offers, data.offer])
      }

      // Reset form
      setFormData({
        webinarId: '',
        title: '',
        description: '',
        price: '',
        ctaText: 'Get This Offer',
        ctaUrl: '',
        videoTimestamp: '',
        hideAfter: '',
      })
      setShowForm(false)
      setEditingId(null)
    } catch (err: any) {
      setError(err.message)
      console.error('Submit error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (offer: Offer) => {
    setFormData({
      webinarId: offer.webinarId,
      title: offer.title,
      description: offer.description || '',
      price: offer.price.toString(),
      ctaText: offer.ctaText,
      ctaUrl: offer.ctaUrl,
      videoTimestamp: formatTime(offer.videoTimestamp),
      hideAfter: offer.hideAfter ? formatTime(offer.hideAfter) : '',
    })
    setEditingId(offer.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return

    try {
      const response = await fetch(`/api/offers?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete offer')
      }

      setOffers(offers.filter(o => o.id !== id))
    } catch (err: any) {
      setError(err.message)
      console.error('Delete error:', err)
    }
  }

  const handleToggleActive = async (offer: Offer) => {
    try {
      const response = await fetch('/api/offers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: offer.id,
          isActive: !offer.isActive
        })
      })

      if (!response.ok) throw new Error('Failed to update offer')

      const data = await response.json()
      setOffers(offers.map(o => o.id === offer.id ? data.offer : o))
    } catch (err: any) {
      setError(err.message)
      console.error('Toggle error:', err)
    }
  }

  const handleDuplicate = (offer: Offer) => {
    setFormData({
      webinarId: offer.webinarId,
      title: `${offer.title} (Copy)`,
      description: offer.description || '',
      price: offer.price.toString(),
      ctaText: offer.ctaText,
      ctaUrl: offer.ctaUrl,
      videoTimestamp: formatTime(offer.videoTimestamp),
      hideAfter: offer.hideAfter ? formatTime(offer.hideAfter) : '',
    })
    setEditingId(null)
    setShowForm(true)
  }

  const toggleWebinarExpansion = (webinarId: string) => {
    const newExpanded = new Set(expandedWebinars)
    if (newExpanded.has(webinarId)) {
      newExpanded.delete(webinarId)
    } else {
      newExpanded.add(webinarId)
    }
    setExpandedWebinars(newExpanded)
  }

  // Group offers by webinar
  const offersByWebinar = offers.reduce((acc, offer) => {
    if (!acc[offer.webinarId]) {
      acc[offer.webinarId] = []
    }
    acc[offer.webinarId].push(offer)
    return acc
  }, {} as Record<string, Offer[]>)

  // Filter offers
  const filteredWebinarIds = selectedWebinarFilter === 'all' 
    ? Object.keys(offersByWebinar)
    : [selectedWebinarFilter]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Offer Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create timed offers that appear during your webinars
            </p>
          </div>
          <Button
            onClick={() => {
              setShowForm(true)
              setEditingId(null)
              setFormData({
                webinarId: '',
                title: '',
                description: '',
                price: '',
                ctaText: 'Get This Offer',
                ctaUrl: '',
                videoTimestamp: '',
                hideAfter: '',
              })
            }}
            className="inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Offer
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Filter */}
        {webinars.length > 1 && (
          <Card>
            <CardBody>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Filter by Webinar:</label>
                <select
                  value={selectedWebinarFilter}
                  onChange={(e) => setSelectedWebinarFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Webinars</option>
                  {webinars.map(w => (
                    <option key={w.id} value={w.id}>{w.title}</option>
                  ))}
                </select>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Form Modal */}
        {showForm && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Offer' : 'Create New Offer'}
              </h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Webinar <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.webinarId}
                      onChange={(e) => setFormData({ ...formData, webinarId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={editingId !== null}
                    >
                      <option value="">Select a webinar</option>
                      {webinars.map(w => (
                        <option key={w.id} value={w.id}>{w.title}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">The webinar this offer belongs to</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Offer Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Special Course Bundle"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe your offer..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="299.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CTA Button Text <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.ctaText}
                      onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Get This Offer"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CTA URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.ctaUrl}
                    onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/checkout"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Where users go when they click the button</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Show At (MM:SS) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.videoTimestamp}
                      onChange={(e) => setFormData({ ...formData, videoTimestamp: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="15:30"
                      pattern="[0-9]+:[0-5][0-9]"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">Time in video when offer appears (e.g., 15:30)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hide After (MM:SS)
                    </label>
                    <input
                      type="text"
                      value={formData.hideAfter}
                      onChange={(e) => setFormData({ ...formData, hideAfter: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="5:00"
                      pattern="[0-9]+:[0-5][0-9]"
                    />
                    <p className="mt-1 text-xs text-gray-500">Duration to display (leave empty to show until end)</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>{editingId ? 'Update Offer' : 'Create Offer'}</>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowForm(false)
                      setEditingId(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        {/* Offers List Grouped by Webinar */}
        {filteredWebinarIds.length > 0 ? (
          <div className="space-y-6">
            {filteredWebinarIds.map(webinarId => {
              const webinar = webinars.find(w => w.id === webinarId)
              const webinarOffers = offersByWebinar[webinarId] || []
              const isExpanded = expandedWebinars.has(webinarId)

              return (
                <Card key={webinarId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Video className="w-5 h-5 text-gray-600" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {webinar?.title || 'Unknown Webinar'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {webinarOffers.length} {webinarOffers.length === 1 ? 'offer' : 'offers'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleWebinarExpansion(webinarId)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardBody>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {webinarOffers
                          .sort((a, b) => a.videoTimestamp - b.videoTimestamp)
                          .map((offer) => (
                          <div key={offer.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-base font-semibold text-gray-900">{offer.title}</h4>
                                {offer.description && (
                                  <p className="text-sm text-gray-600 mt-1">{offer.description}</p>
                                )}
                              </div>
                              <button
                                onClick={() => handleToggleActive(offer)}
                                className={`p-2 rounded-lg transition-colors ${
                                  offer.isActive
                                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                                title={offer.isActive ? 'Active' : 'Inactive'}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Price & Timing */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-gray-900">${offer.price.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">
                                  {formatTime(offer.videoTimestamp)}
                                  {offer.hideAfter && ` (${formatTime(offer.hideAfter)})`}
                                </span>
                              </div>
                            </div>

                            {/* CTA Preview */}
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-gray-500">CTA Button</p>
                                <ExternalLink className="w-3 h-3 text-gray-400" />
                              </div>
                              <div className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium text-center">
                                {offer.ctaText}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2 border-t border-gray-200">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setPreviewOffer(offer)}
                                className="flex-1"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Preview
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleDuplicate(offer)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleEdit(offer)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDelete(offer.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  )}
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No offers yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first offer to present during webinars
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Offer
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Preview Modal */}
        {previewOffer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">Offer Preview</h3>
              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm opacity-90">
                      Appears at {formatTime(previewOffer.videoTimestamp)}
                    </span>
                  </div>
                  <h4 className="text-2xl font-bold mb-2">{previewOffer.title}</h4>
                  {previewOffer.description && (
                    <p className="mb-4 opacity-90">{previewOffer.description}</p>
                  )}
                  <div className="mb-4">
                    <p className="text-3xl font-bold">${previewOffer.price.toFixed(2)}</p>
                  </div>
                  <button className="w-full py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition">
                    {previewOffer.ctaText}
                  </button>
                  {previewOffer.hideAfter && (
                    <p className="text-xs opacity-75 mt-2 text-center">
                      Disappears after {formatTime(previewOffer.hideAfter)}
                    </p>
                  )}
                </div>
                <Button onClick={() => setPreviewOffer(null)} variant="secondary" className="w-full">
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
