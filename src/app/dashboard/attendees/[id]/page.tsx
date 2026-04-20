'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import {
  ArrowLeft,
  Clock,
  MessageSquare,
  Heart,
  Eye,
  MousePointerClick,
  Users,
  TrendingUp,
  Calendar,
  Mail,
  Phone,
  Globe,
  CheckCircle,
  XCircle,
  PlayCircle,
  Activity,
  DollarSign,
  Bell,
  Tag,
  Send,
  AlertCircle,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react'

interface AttendeeProfile {
  id: string
  name: string
  email: string
  phone: string | null
  timezone: string | null
  country: string | null
  webinarTitle: string
  registeredAt: string
  scheduledAt: string | null
  attended: boolean
  joinedAt: string | null
  leftAt: string | null
  totalWatchTime: number
  engagementScore: number
  hasPurchased: boolean
  emailUnsubscribed: boolean
  emailUnsubscribedAt: string | null
  emailHistory: Array<{
    id: string
    emailType: string
    templateName: string | null
    subject: string
    to: string
    status: string
    sentAt: string | null
    openedAt: string | null
    clickedAt: string | null
    openCount: number
    clickCount: number
    abVariant: string | null
    isResend: boolean
    timingLabel: string | null
    audienceLabel: string | null
    clicks: Array<{
      url: string
      clickedAt: string
    }>
  }>
  
  // Purchases
  purchases: Array<{
    id: string
    productName: string
    amount: number
    currency: string
    orderId: string
    purchasedAt: string
  }>
  
  // SMS/Email Reminders
  reminders: Array<{
    id: string
    type: string
    channel: string
    status: string
    sentAt: string | null
    scheduledFor: string | null
    message: string | null
    emailSubject: string | null
    sentTo: string | null
    errorMessage: string | null
    timing: string
  }>
  
  // ClickFunnels Tags
  clickFunnelsTags: Array<{
    id: string
    tagName: string
    status: string
    scheduledFor: string
    appliedAt: string | null
    errorMessage: string | null
  }>
  
  // Engagement details
  chatMessages: Array<{
    id: string
    message: string
    timestamp: string
    isApproved: boolean
  }>
  
  reactions: Array<{
    id: string
    type: string
    timestamp: string
  }>
  
  ctaClicks: Array<{
    id: string
    offerTitle: string
    timestamp: string
  }>
  
  pageVisits: Array<{
    id: string
    timestamp: string
    duration: number
  }>
  
  watchSessions: Array<{
    id: string
    joinedAt: string
    leftAt: string | null
    lastSeenAt: string | null
    duration: number
    videoPosition: number
    device: string
    userAgent: string | null
    watchedMuted: boolean
    mutedDuration: number
    unmutedDuration: number
    lastMuteState: boolean | null
    videoEvents: Array<{
      id: string
      event: string
      timestamp: number
      videoPosition: number
      createdAt: string
    }>
    engagements: Array<{
      id: string
      type: string
      timestamp: number
      createdAt: string
    }>
  }>
  
  referrals: Array<{
    id: string
    name: string
    email: string
    registeredAt: string
    attended: boolean
  }>
  
  referralCode: string | null
  referredBy: string | null
  referrerName: string | null
  
  // Registration source
  registrationSource: {
    splitTest: {
      id: string
      name: string
      slug: string
    } | null
    splitTestVariant: {
      id: string
      weight: number
      leadPage: {
        id: string
        name: string
        slug: string
      } | null
    } | null
    leadPage: {
      id: string
      name: string
      slug: string
    } | null
  }
}

export default function AttendeeProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<AttendeeProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [purchaseAmount, setPurchaseAmount] = useState('')
  const [purchaseCurrency, setPurchaseCurrency] = useState('USD')
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().slice(0, 16)
  )
  const [purchaseProductName, setPurchaseProductName] =
    useState('Manual Purchase')
  const [purchaseError, setPurchaseError] = useState('')
  const [savingPurchase, setSavingPurchase] = useState(false)
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null)
  const [deletingPurchaseId, setDeletingPurchaseId] = useState<string | null>(null)
  const [updatingEmailSubscription, setUpdatingEmailSubscription] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchProfile(params.id as string)
    }
  }, [params.id])

  const fetchProfile = async (id: string) => {
    try {
      console.log('[Attendee Profile Page] Fetching profile for ID:', id)
      const response = await fetch(`/api/attendees/${id}/profile`)
      console.log('[Attendee Profile Page] Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[Attendee Profile Page] Error response:', errorData)
        throw new Error(errorData.error || errorData.details || 'Failed to fetch profile')
      }
      
      const data = await response.json()
      console.log('[Attendee Profile Page] Profile loaded successfully')
      setProfile(data.profile)
    } catch (err) {
      console.error('[Attendee Profile Page] Error fetching profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to load attendee profile')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatDateTime = (dateString: string, timezone?: string | null) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
    if (timezone) {
      options.timeZone = timezone
      options.timeZoneName = 'short'
    }
    return date.toLocaleString('en-US', options)
  }

  const getEmailTypeLabel = (emailType: string) => {
    if (emailType === 'confirmation') return 'Confirmation'
    if (emailType === 'reminder') return 'Reminder'
    if (emailType === 'followup') return 'Follow-Up'
    return emailType
  }

  const getEmailTypeClasses = (emailType: string) => {
    if (emailType === 'confirmation') return 'bg-blue-100 text-blue-700'
    if (emailType === 'reminder') return 'bg-amber-100 text-amber-700'
    if (emailType === 'followup') return 'bg-purple-100 text-purple-700'
    return 'bg-gray-100 text-gray-700'
  }

  const handleAddPurchase = async () => {
    if (!profile) return

    const amountValue = parseFloat(purchaseAmount)
    if (isNaN(amountValue) || amountValue <= 0) {
      setPurchaseError('Enter a valid amount greater than zero.')
      return
    }

    const dateValue = purchaseDate ? new Date(purchaseDate) : new Date()
    if (isNaN(dateValue.getTime())) {
      setPurchaseError('Enter a valid purchase date.')
      return
    }

    setPurchaseError('')
    setSavingPurchase(true)

    try {
      const response = await fetch(`/api/attendees/${profile.id}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountValue,
          currency: purchaseCurrency || 'USD',
          productName: purchaseProductName || 'Manual Purchase',
          purchasedAt: dateValue.toISOString()
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error ||
            errorData.details ||
            'Failed to record purchase'
        )
      }

      const data = await response.json()
      const newPurchase = data.purchase
        ? {
            id: data.purchase.id,
            productName: data.purchase.productName || purchaseProductName,
            amount: data.purchase.amount ?? amountValue,
            currency: data.purchase.currency || purchaseCurrency,
            orderId: data.purchase.orderId,
            purchasedAt:
              data.purchase.purchasedAt || dateValue.toISOString()
          }
        : null

      if (newPurchase) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                hasPurchased: true,
                purchases: [newPurchase, ...(prev.purchases || [])]
              }
            : prev
        )
      }

      setShowPurchaseForm(false)
      setPurchaseAmount('')
      setPurchaseCurrency('USD')
      setPurchaseProductName('Manual Purchase')
      setEditingPurchaseId(null)
    } catch (err) {
      setPurchaseError(
        err instanceof Error ? err.message : 'Failed to record purchase'
      )
    } finally {
      setSavingPurchase(false)
    }
  }

  const startEditPurchase = (purchase: AttendeeProfile['purchases'][number]) => {
    setPurchaseError('')
    setEditingPurchaseId(purchase.id)
    setPurchaseAmount(String(purchase.amount))
    setPurchaseCurrency(purchase.currency || 'USD')
    setPurchaseProductName(purchase.productName || 'Manual Purchase')
    setPurchaseDate(new Date(purchase.purchasedAt).toISOString().slice(0, 16))
    setShowPurchaseForm(true)
  }

  const resetPurchaseForm = () => {
    setShowPurchaseForm(false)
    setEditingPurchaseId(null)
    setPurchaseError('')
    setPurchaseAmount('')
    setPurchaseCurrency('USD')
    setPurchaseDate(new Date().toISOString().slice(0, 16))
    setPurchaseProductName('Manual Purchase')
  }

  const handleSavePurchase = async () => {
    if (!profile) return

    if (editingPurchaseId) {
      const amountValue = parseFloat(purchaseAmount)
      if (isNaN(amountValue) || amountValue <= 0) {
        setPurchaseError('Enter a valid amount greater than zero.')
        return
      }

      const dateValue = purchaseDate ? new Date(purchaseDate) : new Date()
      if (isNaN(dateValue.getTime())) {
        setPurchaseError('Enter a valid purchase date.')
        return
      }

      setSavingPurchase(true)
      setPurchaseError('')

      try {
        const existingPurchase = profile.purchases.find((purchase) => purchase.id === editingPurchaseId)
        const response = await fetch(`/api/attendees/${profile.id}/purchase/${editingPurchaseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amountValue,
            currency: purchaseCurrency || 'USD',
            productName: purchaseProductName || 'Manual Purchase',
            purchasedAt: dateValue.toISOString(),
            orderId: existingPurchase?.orderId
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || errorData.details || 'Failed to update purchase')
        }

        const data = await response.json()
        const updatedPurchase = data.purchase

        setProfile((prev) =>
          prev
            ? {
                ...prev,
                purchases: prev.purchases.map((purchase) =>
                  purchase.id === editingPurchaseId
                    ? {
                        ...purchase,
                        productName: updatedPurchase.productName || purchaseProductName,
                        amount: updatedPurchase.amount ?? amountValue,
                        currency: updatedPurchase.currency || purchaseCurrency,
                        orderId: updatedPurchase.orderId || purchase.orderId,
                        purchasedAt: updatedPurchase.purchasedAt || dateValue.toISOString()
                      }
                    : purchase
                )
              }
            : prev
        )

        resetPurchaseForm()
      } catch (err) {
        setPurchaseError(err instanceof Error ? err.message : 'Failed to update purchase')
      } finally {
        setSavingPurchase(false)
      }

      return
    }

    await handleAddPurchase()
  }

  const handleDeletePurchase = async (purchaseId: string) => {
    if (!profile) return
    const confirmed = window.confirm('Delete this purchase? This cannot be undone.')
    if (!confirmed) return

    setDeletingPurchaseId(purchaseId)
    setPurchaseError('')

    try {
      const response = await fetch(`/api/attendees/${profile.id}/purchase/${purchaseId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.details || 'Failed to delete purchase')
      }

      setProfile((prev) => {
        if (!prev) return prev
        const remainingPurchases = prev.purchases.filter((purchase) => purchase.id !== purchaseId)
        return {
          ...prev,
          hasPurchased: remainingPurchases.length > 0,
          purchases: remainingPurchases
        }
      })
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : 'Failed to delete purchase')
    } finally {
      setDeletingPurchaseId(null)
    }
  }

  const handleToggleEmailSubscription = async () => {
    if (!profile) return

    setUpdatingEmailSubscription(true)
    try {
      const response = await fetch('/api/attendees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profile.id,
          emailUnsubscribed: !profile.emailUnsubscribed,
        })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update email subscription')
      }

      setProfile((prev) => prev ? {
        ...prev,
        emailUnsubscribed: data.registration.emailUnsubscribed,
        emailUnsubscribedAt: data.registration.emailUnsubscribedAt || null,
      } : prev)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update email subscription')
    } finally {
      setUpdatingEmailSubscription(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600">{error || 'Profile not found'}</p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.back()}
              variant="secondary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-sm text-gray-500">{profile.webinarTitle}</p>
              {profile.scheduledAt && (
                <p className="text-sm text-gray-500">
                  Scheduled: {formatDateTime(profile.scheduledAt, profile.timezone)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {profile.hasPurchased ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                <DollarSign className="w-4 h-4" />
                Purchase Recorded
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                <DollarSign className="w-4 h-4" />
                No Purchase Yet
              </span>
            )}
            {profile.attended ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4" />
                Attended
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800">
                <XCircle className="w-4 h-4" />
                No Show
              </span>
            )}
            <Button
              onClick={() => {
                setPurchaseError('')
                setPurchaseDate(new Date().toISOString().slice(0, 16))
                setEditingPurchaseId(null)
                setShowPurchaseForm(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Record Purchase
            </Button>
          </div>
        </div>

        {/* Purchase Status & Manual Add */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Purchase Status
              </h2>
              <p className="text-sm text-gray-600">
                {profile.hasPurchased
                  ? 'This attendee has at least one recorded purchase.'
                  : 'No purchases recorded yet. Use the button to add one.'}
              </p>
            </div>
            <Button
              onClick={() => {
                setPurchaseError('')
                setPurchaseDate(new Date().toISOString().slice(0, 16))
                setEditingPurchaseId(null)
                setShowPurchaseForm((open) => !open)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              {showPurchaseForm ? 'Close Form' : 'Add Purchase'}
            </Button>
          </div>

          {showPurchaseForm && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    placeholder="e.g. 97.00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase"
                    value={purchaseCurrency}
                    onChange={(e) => setPurchaseCurrency(e.target.value.toUpperCase())}
                    placeholder="USD"
                    maxLength={3}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Product / Offer Name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={purchaseProductName}
                    onChange={(e) => setPurchaseProductName(e.target.value)}
                    placeholder="Manual Purchase"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                  />
                </div>
              </div>

              {purchaseError && (
                <p className="text-sm text-red-600">{purchaseError}</p>
              )}

              <div className="flex items-center gap-3">
                <Button onClick={handleSavePurchase} disabled={savingPurchase}>
                  {savingPurchase ? 'Saving...' : editingPurchaseId ? 'Update Purchase' : 'Save Purchase'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={resetPurchaseForm}
                  disabled={savingPurchase}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{profile.email}</p>
              </div>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{profile.phone}</p>
                </div>
              </div>
            )}
            {profile.country && (
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Country</p>
                  <p className="text-sm font-medium text-gray-900">{profile.country}</p>
                </div>
              </div>
            )}
            {profile.timezone && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Timezone</p>
                  <p className="text-sm font-medium text-gray-900">{profile.timezone}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Email Subscription</p>
              <p className="text-sm text-gray-600">
                {profile.emailUnsubscribed
                  ? `Unsubscribed${profile.emailUnsubscribedAt ? ` on ${formatDateTime(profile.emailUnsubscribedAt)}` : ''}`
                  : 'Subscribed to webinar email updates'}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleToggleEmailSubscription}
              disabled={updatingEmailSubscription}
            >
              {updatingEmailSubscription
                ? 'Saving...'
                : profile.emailUnsubscribed
                  ? 'Resubscribe'
                  : 'Unsubscribe'}
            </Button>
          </div>
        </div>

        {/* Registration Source */}
        {(profile.registrationSource?.splitTest || profile.registrationSource?.leadPage) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-purple-600" />
              Registration Source
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.registrationSource.splitTest && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Split Test</p>
                    <p className="text-sm font-medium text-gray-900">{profile.registrationSource.splitTest.name}</p>
                    <p className="text-xs text-gray-400">/{profile.registrationSource.splitTest.slug}</p>
                  </div>
                </div>
              )}
              {profile.registrationSource.splitTestVariant && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Variant Page</p>
                    <p className="text-sm font-medium text-gray-900">
                      {profile.registrationSource.splitTestVariant.leadPage?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Weight: {profile.registrationSource.splitTestVariant.weight}%
                    </p>
                  </div>
                </div>
              )}
              {profile.registrationSource.leadPage && !profile.registrationSource.splitTest && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Lead Page</p>
                    <p className="text-sm font-medium text-gray-900">{profile.registrationSource.leadPage.name}</p>
                    <p className="text-xs text-gray-400">/{profile.registrationSource.leadPage.slug}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Total Watch Time</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatTime(profile.totalWatchTime)}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <PlayCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Sessions</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{profile.watchSessions.length}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Engagement Score</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{profile.engagementScore}%</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Chat Messages</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{profile.chatMessages.length}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-pink-50 rounded-lg">
                <Heart className="w-5 h-5 text-pink-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Reactions</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{profile.reactions.length}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Engagement Timeline
          </h2>
          <div className="space-y-4">
            {/* Registration */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Registered</p>
                <p className="text-xs text-gray-500">{formatDateTime(profile.registeredAt, profile.timezone)}</p>
              </div>
            </div>

            {/* Scheduled Session */}
            {profile.scheduledAt && (
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Scheduled Session</p>
                  <p className="text-xs text-gray-500">{formatDateTime(profile.scheduledAt, profile.timezone)}</p>
                </div>
              </div>
            )}

            {/* Watch Sessions */}
            {profile.watchSessions.map((session, index) => (
              <div key={session.id} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <PlayCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Watch Session #{index + 1} ({formatTime(session.duration)})
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(session.joinedAt)}
                    {session.leftAt && ` - ${formatDateTime(session.leftAt)}`}
                  </p>
                </div>
              </div>
            ))}

            {/* Chat Messages */}
            {profile.chatMessages.slice(0, 5).map((msg) => (
              <div key={msg.id} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Sent chat message</p>
                  <p className="text-xs text-gray-600 italic">"{msg.message}"</p>
                  <p className="text-xs text-gray-500">{formatDateTime(msg.timestamp)}</p>
                </div>
              </div>
            ))}

            {/* Reactions */}
            {profile.reactions.slice(0, 5).map((reaction) => (
              <div key={reaction.id} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-pink-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Reacted: {reaction.type}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(reaction.timestamp)}</p>
                </div>
              </div>
            ))}

            {/* CTA Clicks */}
            {profile.ctaClicks.map((click) => (
              <div key={click.id} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <MousePointerClick className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Clicked CTA: {click.offerTitle}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(click.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Sessions Section */}
        {profile.watchSessions.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PlayCircle className="w-5 h-5" />
              Watch Sessions Details ({profile.watchSessions.length} sessions)
            </h2>
            <div className="space-y-6">
              {profile.watchSessions.map((session, index) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Session #{index + 1}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      session.leftAt 
                        ? 'bg-gray-100 text-gray-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {session.leftAt ? 'Completed' : 'Active'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Joined At</p>
                      <p className="text-sm font-medium text-gray-900">{formatDateTime(session.joinedAt)}</p>
                    </div>
                    {session.leftAt && (
                      <div>
                        <p className="text-xs text-gray-500">Left At</p>
                        <p className="text-sm font-medium text-gray-900">{formatDateTime(session.leftAt)}</p>
                      </div>
                    )}
                    {session.lastSeenAt && (
                      <div>
                        <p className="text-xs text-gray-500">Last Seen</p>
                        <p className="text-sm font-medium text-gray-900">{formatDateTime(session.lastSeenAt)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500">Watch Duration</p>
                      <p className="text-sm font-medium text-gray-900">{formatTime(session.duration)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Video Position</p>
                      <p className="text-sm font-medium text-gray-900">{formatTime(session.videoPosition)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Device</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{session.device}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Started</p>
                      <p className="text-sm font-medium text-gray-900">
                        {session.watchedMuted ? '🔇 Muted' : '🔊 Unmuted'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Audio State</p>
                      <p className="text-sm font-medium text-gray-900">
                        {session.lastMuteState === null 
                          ? 'Unknown'
                          : session.lastMuteState 
                            ? '🔇 Ended Muted' 
                            : '🔊 Ended Unmuted'
                        }
                      </p>
                    </div>
                  </div>

                  {(session.mutedDuration > 0 || session.unmutedDuration > 0) && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 mb-2">Audio Tracking</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Watched Muted</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatTime(session.mutedDuration)} 
                            <span className="text-xs text-gray-500 ml-1">
                              ({session.duration > 0 ? Math.round((session.mutedDuration / session.duration) * 100) : 0}%)
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Watched Unmuted</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatTime(session.unmutedDuration)}
                            <span className="text-xs text-gray-500 ml-1">
                              ({session.duration > 0 ? Math.round((session.unmutedDuration / session.duration) * 100) : 0}%)
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {session.videoEvents.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-600 mb-2">
                        Video Events ({session.videoEvents.length})
                      </p>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {session.videoEvents.map((event) => (
                          <div key={event.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                            <span className="font-medium capitalize">{event.event}</span>
                            <span className="text-gray-500">
                              @ {formatTime(event.videoPosition)} • {new Date(event.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {session.engagements.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">
                        Engagements ({session.engagements.length})
                      </p>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {session.engagements.map((engagement) => (
                          <div key={engagement.id} className="flex items-center justify-between text-xs p-2 bg-blue-50 rounded">
                            <span className="font-medium capitalize">{engagement.type}</span>
                            <span className="text-gray-500">
                              {new Date(engagement.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {session.userAgent && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">User Agent</p>
                      <p className="text-xs text-gray-600 font-mono mt-1 break-all">{session.userAgent}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Purchases Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Purchases ({profile.purchases.length})
          </h2>
          {profile.purchases.length === 0 ? (
            <p className="text-sm text-gray-600">
              No purchases recorded yet for this attendee.
            </p>
          ) : (
            <div className="space-y-3">
              {profile.purchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{purchase.productName}</p>
                    <p className="text-xs text-gray-600 mt-1">Order ID: {purchase.orderId}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDateTime(purchase.purchasedAt)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-700">
                        {purchase.currency} {purchase.amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditPurchase(purchase)}
                        className="rounded p-2 text-blue-600 hover:bg-blue-100"
                        title="Edit purchase"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePurchase(purchase.id)}
                        disabled={deletingPurchaseId === purchase.id}
                        className="rounded p-2 text-red-600 hover:bg-red-100 disabled:opacity-50"
                        title="Delete purchase"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email History Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" />
            Email History ({profile.emailHistory.length})
          </h2>

          {profile.emailHistory.length === 0 ? (
            <p className="text-sm text-gray-600">
              No tracked confirmation, reminder, or follow-up emails have been sent to this attendee yet.
            </p>
          ) : (
            <div className="space-y-3">
              {profile.emailHistory.map((email) => (
                <div key={email.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${getEmailTypeClasses(email.emailType)}`}>
                          <Mail className="w-3.5 h-3.5" />
                          {getEmailTypeLabel(email.emailType)}
                        </span>
                        {email.timingLabel && (
                          <span className="inline-flex items-center rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700">
                            {email.timingLabel}
                          </span>
                        )}
                        {email.audienceLabel && (
                          <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                            {email.audienceLabel}
                          </span>
                        )}
                        {email.abVariant === 'B' && (
                          <span className="inline-flex items-center rounded-full bg-fuchsia-100 px-2 py-1 text-xs font-semibold text-fuchsia-700">
                            Variant B
                          </span>
                        )}
                        {email.isResend && (
                          <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">
                            Resend
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-gray-900 break-words">{email.subject}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {email.templateName || 'Email Template'}
                        {' '}• Sent to {email.to}
                        {email.sentAt ? ` • ${formatDateTime(email.sentAt)}` : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 font-medium text-gray-700 border border-gray-200">
                        <Eye className="w-3.5 h-3.5 text-green-600" />
                        {email.openCount} open{email.openCount === 1 ? '' : 's'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 font-medium text-gray-700 border border-gray-200">
                        <MousePointerClick className="w-3.5 h-3.5 text-blue-600" />
                        {email.clickCount} click{email.clickCount === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  {(email.openedAt || email.clickedAt) && (
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
                      {email.openedAt && (
                        <span>First opened: {formatDateTime(email.openedAt)}</span>
                      )}
                      {email.clickedAt && (
                        <span>Last clicked: {formatDateTime(email.clickedAt)}</span>
                      )}
                    </div>
                  )}

                  {email.clicks.length > 0 && (
                    <div className="mt-3 border-t border-gray-200 pt-3">
                      <p className="text-xs font-medium text-gray-600 mb-2">Clicked URLs</p>
                      <div className="space-y-2">
                        {email.clicks.map((click, index) => (
                          <div key={`${email.id}-${click.url}-${index}`} className="flex flex-col gap-1 rounded-md bg-white px-3 py-2 text-xs border border-gray-200">
                            <a
                              href={click.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:underline break-all"
                            >
                              {click.url}
                            </a>
                            <span className="text-gray-500">Clicked {formatDateTime(click.clickedAt)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SMS/Email Reminders Section */}
        {profile.reminders && profile.reminders.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              SMS & Email Reminders ({profile.reminders.length})
            </h2>
            <div className="space-y-3">
              {profile.reminders.map((reminder) => (
                <div key={reminder.id} className={`p-4 rounded-lg border ${
                  reminder.status === 'SENT' ? 'bg-green-50 border-green-200' :
                  reminder.status === 'FAILED' ? 'bg-red-50 border-red-200' :
                  reminder.status === 'PENDING' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Send className={`w-4 h-4 ${
                        reminder.status === 'SENT' ? 'text-green-600' :
                        reminder.status === 'FAILED' ? 'text-red-600' :
                        reminder.status === 'PENDING' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`} />
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        reminder.channel === 'SMS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {reminder.channel}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        reminder.type === 'pre_webinar' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {reminder.type === 'pre_webinar' ? 'Pre-Webinar' : 'Post-Webinar'}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        reminder.status === 'SENT' ? 'bg-green-100 text-green-700' :
                        reminder.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                        reminder.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {reminder.status}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{reminder.timing}</span>
                  </div>
                  
                  {reminder.emailSubject && (
                    <p className="text-sm font-medium text-gray-900 mb-1">Subject: {reminder.emailSubject}</p>
                  )}
                  
                  {reminder.message && (
                    <p className="text-sm text-gray-700 mb-2">{reminder.message.substring(0, 150)}{reminder.message.length > 150 ? '...' : ''}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
                    <div>
                      {reminder.sentTo && <span>Sent to: {reminder.sentTo}</span>}
                    </div>
                    <div>
                      {reminder.sentAt ? (
                        <span>Sent: {formatDateTime(reminder.sentAt)}</span>
                      ) : reminder.scheduledFor ? (
                        <span>Scheduled: {formatDateTime(reminder.scheduledFor)}</span>
                      ) : null}
                    </div>
                  </div>
                  
                  {reminder.errorMessage && (
                    <div className="mt-2 pt-2 border-t border-red-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                        <p className="text-xs text-red-700">{reminder.errorMessage}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ClickFunnels Tags Section */}
        {profile.clickFunnelsTags && profile.clickFunnelsTags.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-purple-600" />
              ClickFunnels Tags ({profile.clickFunnelsTags.length})
            </h2>
            <div className="space-y-3">
              {profile.clickFunnelsTags.map((tag) => (
                <div key={tag.id} className={`p-4 rounded-lg border ${
                  tag.status === 'SENT' ? 'bg-green-50 border-green-200' :
                  tag.status === 'FAILED' ? 'bg-red-50 border-red-200' :
                  tag.status === 'PENDING' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Tag className={`w-4 h-4 ${
                        tag.status === 'SENT' ? 'text-green-600' :
                        tag.status === 'FAILED' ? 'text-red-600' :
                        tag.status === 'PENDING' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`} />
                      <span className="text-sm font-semibold text-gray-900">{tag.tagName}</span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        tag.status === 'SENT' ? 'bg-green-100 text-green-700' :
                        tag.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                        tag.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {tag.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div>
                      {tag.appliedAt ? (
                        <span>Applied: {formatDateTime(tag.appliedAt)}</span>
                      ) : (
                        <span>Scheduled: {formatDateTime(tag.scheduledFor)}</span>
                      )}
                    </div>
                  </div>
                  
                  {tag.errorMessage && (
                    <div className="mt-2 pt-2 border-t border-red-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                        <p className="text-xs text-red-700">{tag.errorMessage}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referrals Section */}
        {(profile.referralCode || profile.referrals.length > 0 || profile.referredBy) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Referral Information
            </h2>
            <div className="space-y-4">
              {profile.referredBy && (
                <div>
                  <p className="text-sm text-gray-600">Referred by:</p>
                  <p className="text-base font-medium text-gray-900">{profile.referrerName}</p>
                </div>
              )}
              
              {profile.referralCode && (
                <div>
                  <p className="text-sm text-gray-600">Their referral code:</p>
                  <p className="text-base font-mono font-medium text-blue-600">{profile.referralCode}</p>
                </div>
              )}

              {profile.referrals.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-3">People they referred ({profile.referrals.length}):</p>
                  <div className="space-y-2">
                    {profile.referrals.map((referral) => (
                      <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{referral.name}</p>
                          <p className="text-xs text-gray-500">{referral.email}</p>
                        </div>
                        <div className="text-right">
                          {referral.attended ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3" />
                              Attended
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              <XCircle className="w-3 h-3" />
                              No Show
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
