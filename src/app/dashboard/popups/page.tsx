'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Plus, Eye, Code, Trash2, ToggleLeft, ToggleRight, Users, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'

interface PopupItem {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  createdAt: string
  _count: { leads: number }
}

export default function PopupsPage() {
  const [popups, setPopups] = useState<PopupItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchPopups()
  }, [])

  const fetchPopups = async () => {
    try {
      const res = await fetch('/api/popups')
      if (res.ok) {
        const data = await res.json()
        setPopups(data)
      }
    } catch (err) {
      console.error('Error fetching popups:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/popups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (res.ok) {
        setPopups(prev => prev.map(p => p.id === id ? { ...p, isActive: !isActive } : p))
        toast.success(`Popup ${!isActive ? 'activated' : 'deactivated'}`)
      }
    } catch (err) {
      toast.error('Failed to update popup')
    }
  }

  const deletePopup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this popup and all its leads?')) return
    try {
      const res = await fetch(`/api/popups/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPopups(prev => prev.filter(p => p.id !== id))
        toast.success('Popup deleted')
      }
    } catch (err) {
      toast.error('Failed to delete popup')
    }
  }

  const copyEmbedCode = (slug: string) => {
    const origin = window.location.origin
    const code = `<script src="${origin}/popup-embed.js" data-popup="${slug}"></script>`
    navigator.clipboard.writeText(code)
    toast.success('Embed code copied to clipboard!')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Popup Forms</h1>
            <p className="text-gray-500 mt-1">Create embeddable popup forms to collect leads</p>
          </div>
          <Button onClick={() => router.push('/dashboard/popups/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Popup
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : popups.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Code className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No popups yet</h3>
            <p className="mt-1 text-gray-500">Create your first popup form and embed it anywhere.</p>
            <div className="mt-6">
              <Button onClick={() => router.push('/dashboard/popups/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Popup
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leads</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {popups.map((popup) => (
                  <tr key={popup.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{popup.name}</div>
                      {popup.description && (
                        <div className="text-sm text-gray-500">{popup.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/popups/${popup.id}/leads`}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        <Users className="w-4 h-4" />
                        {popup._count.leads}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(popup.id, popup.isActive)}
                        className="flex items-center gap-1"
                      >
                        {popup.isActive ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-green-600" />
                            <span className="text-sm text-green-600">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-400">Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(popup.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/popups/${popup.id}`)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 rounded"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => copyEmbedCode(popup.slug)}
                          className="p-1.5 text-gray-500 hover:text-green-600 rounded"
                          title="Copy Embed Code"
                        >
                          <Code className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deletePopup(popup.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
