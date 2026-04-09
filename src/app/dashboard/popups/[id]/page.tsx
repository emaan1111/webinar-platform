'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import PopupBuilderCore from '@/components/popups/PopupBuilderCore'
import toast from 'react-hot-toast'

export default function EditPopupPage() {
  const router = useRouter()
  const params = useParams()
  const popupId = params.id as string
  const [popupData, setPopupData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchPopup = async () => {
      try {
        const res = await fetch(`/api/popups/${popupId}`)
        if (!res.ok) throw new Error('Not found')
        const data = await res.json()
        setPopupData(data)
      } catch {
        toast.error('Popup not found')
        router.push('/dashboard/popups')
      } finally {
        setLoading(false)
      }
    }
    fetchPopup()
  }, [popupId, router])

  const handleSave = useCallback(async (data: any) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/popups/${popupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update popup')
      }

      toast.success('Popup updated!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }, [popupId])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PopupBuilderCore
        initialData={popupData}
        onSave={handleSave}
        saving={saving}
        isEdit
      />
    </DashboardLayout>
  )
}
