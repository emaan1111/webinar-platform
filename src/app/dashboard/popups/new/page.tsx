'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import PopupBuilderCore from '@/components/popups/PopupBuilderCore'
import toast from 'react-hot-toast'

export default function NewPopupPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const handleSave = useCallback(async (data: any) => {
    setSaving(true)
    try {
      const res = await fetch('/api/popups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create popup')
      }

      const popup = await res.json()
      toast.success('Popup created!')
      router.push(`/dashboard/popups/${popup.id}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }, [router])

  return (
    <DashboardLayout>
      <PopupBuilderCore onSave={handleSave} saving={saving} />
    </DashboardLayout>
  )
}
