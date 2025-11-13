'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  CheckCircle,
  Video,
  PlayCircle
} from 'lucide-react'

interface Webinar {
  id: string
  title: string
}

interface Offer {
  id: string
  webinarId: string
  webinar: {
    id: string
    title: string
  }
  title: string
  description: string | null
  price: number
  ctaText: string
  ctaUrl: string
  videoTimestamp: number
  hideAfter: number | null
  countdownDuration?: number | null
  bulletPoints?: string[] | null
  originalPrice?: number | null
  discountLabel?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function OffersPage() {
  const router = useRouter()
  const [offers, setOffers] = useState<Offer[]>([])
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [previewOffer, setPreviewOffer] = useState<Offer | null>(null)
  const [selectedWebinarFilter, setSelectedWebinarFilter] = useState<string>('ALL')
  
  const [formData, setFormData] = useState({
    webinarId: '',
    title: '',
    description: '',
    price: '',
    ctaText: 'Get This Offer',
    ctaUrl: '',
    videoTimestamp: '',
    hideAfter: '',
    originalPrice: '',
    discountLabel: '',
    countdownDuration: '',
    bulletPoints: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch webinars and offers in parallel
      const [webinarsRes, offersRes] = await Promise.all([
        fetch('/api/webinars'),
        fetch('/api/offers')
      ])

      console.log('Webinars response status:', webinarsRes.status)
      console.log('Offers response status:', offersRes.status)

      if (!webinarsRes.ok) {
        const errorData = await webinarsRes.json().catch(() => ({}))
        console.error('Webinars API error:', errorData)
        throw new Error(`Failed to fetch webinars: ${errorData.error || webinarsRes.statusText}`)
      }

      if (!offersRes.ok) {
        const errorData = await offersRes.json().catch(() => ({}))
        console.error('Offers API error:', errorData)
        throw new Error(`Failed to fetch offers: ${errorData.error || offersRes.statusText}`)
      }

      const webinarsData = await webinarsRes.json()
      const offersData = await offersRes.json()

      console.log('Webinars data:', webinarsData)
      console.log('Offers data:', offersData)

      setWebinars(webinarsData.webinars || [])
      setOffers(offersData.offers || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data')
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const bulletPoints = formData.bulletPoints
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

      const payload = {
        webinarId: formData.webinarId,
        title: formData.title,
        description: formData.description || null,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        discountLabel: formData.discountLabel || null,
        countdownDuration: formData.countdownDuration ? parseInt(formData.countdownDuration) : null,
        bulletPoints,
        ctaText: formData.ctaText,
        ctaUrl: formData.ctaUrl,
        videoTimestamp: parseInt(formData.videoTimestamp),
        hideAfter: formData.hideAfter ? parseInt(formData.hideAfter) : null,
      }

      if (editingId) {
        // Update existing offer
        const response = await fetch(`/api/offers/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!response.ok) throw new Error('Failed to update offer')
        
        setSuccess('Offer updated successfully!')
      } else {
        // Create new offer
        const response = await fetch('/api/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!response.ok) throw new Error('Failed to create offer')
        
        setSuccess('Offer created successfully!')
      }

      // Refresh offers list
      await fetchData()
      
      // Reset form
      resetForm()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      webinarId: '',
      title: '',
      description: '',
      price: '',
      ctaText: 'Get This Offer',
      ctaUrl: '',
      videoTimestamp: '',
      hideAfter: '',
      originalPrice: '',
      discountLabel: '',
      countdownDuration: '',
      bulletPoints: '',
    })
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (offer: Offer) => {
    setFormData({
      webinarId: offer.webinarId,
      title: offer.title,
      description: offer.description || '',
      price: offer.price.toString(),
      ctaText: offer.ctaText,
      ctaUrl: offer.ctaUrl,
      videoTimestamp: offer.videoTimestamp.toString(),
      hideAfter: offer.hideAfter ? offer.hideAfter.toString() : '',
      originalPrice: offer.originalPrice?.toString() || '',
      discountLabel: offer.discountLabel || '',
      countdownDuration: offer.countdownDuration?.toString() || '',
      bulletPoints: offer.bulletPoints?.join('\n') || '',
    })
    setEditingId(offer.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return

    try {
      const response = await fetch(`/api/offers/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete offer')

      setSuccess('Offer deleted successfully!')
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleToggleActive = async (offer: Offer) => {
    try {
      const response = await fetch(`/api/offers/${offer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !offer.isActive })
      })

      if (!response.ok) throw new Error('Failed to update offer')

      setSuccess(`Offer ${!offer.isActive ? 'activated' : 'deactivated'}!`)
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDuplicate = async (offer: Offer) => {
    try {
        const response = await fetch('/api/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webinarId: offer.webinarId,
            title: `${offer.title} (Copy)`,
            description: offer.description,
            price: offer.price,
            ctaText: offer.ctaText,
            ctaUrl: offer.ctaUrl,
            videoTimestamp: offer.videoTimestamp,
            hideAfter: offer.hideAfter,
            originalPrice: offer.originalPrice,
            discountLabel: offer.discountLabel,
            countdownDuration: offer.countdownDuration,
            bulletPoints: offer.bulletPoints ?? [],
          })
        })

      if (!response.ok) throw new Error('Failed to duplicate offer')

      setSuccess('Offer duplicated successfully!')
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Group offers by webinar
  const offersByWebinar = offers.reduce((acc, offer) => {
    const webinarId = offer.webinar.id
    if (!acc[webinarId]) {
      acc[webinarId] = {
        webinar: offer.webinar,
        offers: []
      }
    }
    acc[webinarId].offers.push(offer)
    return acc
  }, {} as Record<string, { webinar: { id: string; title: string }; offers: Offer[] }>)

  // Filter offers
  const filteredOffers = selectedWebinarFilter === 'ALL'
    ? offers
    : offers.filter(o => o.webinarId === selectedWebinarFilter)

  // Format seconds to time string
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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
              resetForm()
              setShowForm(true)
            }}
            className="inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Offer
          </Button>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800">{success}</p>
            <button onClick={() => setSuccess('')} className="ml-auto text-green-600 hover:text-green-800">
              ×
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex flex-col gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800 mb-1">Error Loading Data</p>
                <p className="text-sm text-red-700">{error}</p>
                <div className="mt-3 text-xs text-red-600">
                  <p className="font-medium mb-1">Troubleshooting:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Check browser console (F12) for detailed error messages</li>
                    <li>Verify you are logged in</li>
                    <li>Ensure database is connected</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setError('')
                    fetchData()
                  }}
                  className="mt-3 text-sm text-red-700 hover:text-red-800 underline font-medium"
                >
                  Try Again
                </button>
              </div>
              <button onClick={() => setError('')} className="text-red-600 hover:text-red-800 text-xl leading-none">
                ×
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Offer' : 'Create New Offer'}
              </h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Webinar <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.webinarId}
                    onChange={(e) => setFormData({ ...formData, webinarId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a webinar</option>
                    {webinars.map((webinar) => (
                      <option key={webinar.id} value={webinar.id}>
                        {webinar.title}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Select which webinar this offer will appear in
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="299"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Original Price (crossed out)
                    </label>
                    <input
                      type="number"
                      value={formData.originalPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, originalPrice: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="399"
                      min="0"
                      step="0.01"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Displayed next to price if filled
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Label
                    </label>
                    <input
                      type="text"
                      value={formData.discountLabel}
                      onChange={(e) =>
                        setFormData({ ...formData, discountLabel: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="47% OFF"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Optional pill text like “47% OFF”
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Countdown Duration (seconds)
                    </label>
                    <input
                      type="number"
                      value={formData.countdownDuration}
                      onChange={(e) =>
                        setFormData({ ...formData, countdownDuration: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="180"
                      min="0"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      How long the offer countdown badge runs after it appears
                    </p>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Offer Bullets (one per line)
                  </label>
                  <textarea
                    value={formData.bulletPoints}
                    onChange={(e) => setFormData({ ...formData, bulletPoints: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Enter one bullet per line (e.g. Islamic parenting principles)"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave blank to omit the bullet list from the offer card.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CTA URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={formData.ctaUrl}
                      onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/offer"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Show At (seconds from video start) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.videoTimestamp}
                      onChange={(e) => setFormData({ ...formData, videoTimestamp: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="1800"
                      min="0"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      E.g., 1800 = 30 minutes (30 × 60 seconds)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hide After (seconds)
                    </label>
                    <input
                      type="number"
                      value={formData.hideAfter}
                      onChange={(e) => setFormData({ ...formData, hideAfter: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="600"
                      min="1"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Leave empty to show until video ends
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        {editingId ? 'Update Offer' : 'Create Offer'}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        {/* Filter */}
        {webinars.length > 0 && offers.length > 0 && (
          <Card>
            <CardBody>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">
                  Filter by Webinar:
                </label>
                <select
                  value={selectedWebinarFilter}
                  onChange={(e) => setSelectedWebinarFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Webinars</option>
                  {webinars.map((webinar) => (
                    <option key={webinar.id} value={webinar.id}>
                      {webinar.title}
                    </option>
                  ))}
                </select>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Offers Grouped by Webinar */}
        {selectedWebinarFilter === 'ALL' ? (
          <div className="space-y-6">
            {Object.values(offersByWebinar).map(({ webinar, offers: webinarOffers }) => (
              <Card key={webinar.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Video className="w-5 h-5 text-blue-600" />
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{webinar.title}</h2>
                        <p className="text-sm text-gray-500">{webinarOffers.length} offer(s)</p>
                      </div>
                    </div>
                    <Link href={`/dashboard/webinars/${webinar.id}`}>
                      <Button variant="secondary" size="sm">
                        View Webinar
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {webinarOffers
                      .sort((a, b) => a.videoTimestamp - b.videoTimestamp)
                      .map((offer) => (
                        <OfferCard
                          key={offer.id}
                          offer={offer}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onToggleActive={handleToggleActive}
                          onDuplicate={handleDuplicate}
                          onPreview={setPreviewOffer}
                          formatTime={formatTime}
                        />
                      ))}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredOffers
              .sort((a, b) => a.videoTimestamp - b.videoTimestamp)
              .map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                  onDuplicate={handleDuplicate}
                  onPreview={setPreviewOffer}
                  formatTime={formatTime}
                />
              ))}
          </div>
        )}

        {/* Empty State */}
        {offers.length === 0 && !showForm && (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No offers yet</h3>
                <p className="text-gray-600 mb-4">
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
                  <h4 className="text-2xl font-bold mb-2">{previewOffer.title}</h4>
                  {previewOffer.description && (
                    <p className="mb-4 opacity-90">{previewOffer.description}</p>
                  )}
                  <div className="mb-4">
                    <p className="text-3xl font-bold">${previewOffer.price.toFixed(2)}</p>
                  </div>
                  <button className="w-full py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2">
                    {previewOffer.ctaText}
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <p className="text-xs mt-3 opacity-75 text-center">
                    Appears at {formatTime(previewOffer.videoTimestamp)}
                    {previewOffer.hideAfter && ` • Hides after ${formatTime(previewOffer.hideAfter)}`}
                  </p>
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

// Offer Card Component
function OfferCard({
  offer,
  onEdit,
  onDelete,
  onToggleActive,
  onDuplicate,
  onPreview,
  formatTime
}: {
  offer: Offer
  onEdit: (offer: Offer) => void
  onDelete: (id: string) => void
  onToggleActive: (offer: Offer) => void
  onDuplicate: (offer: Offer) => void
  onPreview: (offer: Offer) => void
  formatTime: (seconds: number) => string
}) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{offer.title}</h3>
            {offer.description && (
              <p className="text-sm text-gray-600 mt-1">{offer.description}</p>
            )}
          </div>
          <button
            onClick={() => onToggleActive(offer)}
            className={`p-2 rounded-lg transition ${
              offer.isActive
                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
            title={offer.isActive ? 'Active' : 'Inactive'}
          >
            <Power className="w-4 h-4" />
          </button>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Price</p>
              <p className="text-sm font-bold">${offer.price.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Shows at</p>
              <p className="text-sm font-medium">{formatTime(offer.videoTimestamp)}</p>
            </div>
          </div>
        </div>

        {/* CTA Preview */}
        <div className="p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Button Preview</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-600">{offer.ctaText}</span>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onPreview(offer)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onDuplicate(offer)}
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onEdit(offer)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => onDelete(offer.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
