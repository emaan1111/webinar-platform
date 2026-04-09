'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Download, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Lead {
  id: string
  data: Record<string, any>
  ip: string | null
  userAgent: string | null
  referrer: string | null
  pageUrl: string | null
  createdAt: string
}

interface PopupInfo {
  id: string
  name: string
  slug: string
  fields: Array<{ id: string; label: string; type: string }>
}

export default function PopupLeadsPage() {
  const params = useParams()
  const router = useRouter()
  const popupId = params.id as string

  const [popup, setPopup] = useState<PopupInfo | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPopup()
  }, [popupId])

  useEffect(() => {
    fetchLeads()
  }, [popupId, page])

  const fetchPopup = async () => {
    try {
      const res = await fetch(`/api/popups/${popupId}`)
      if (res.ok) {
        const data = await res.json()
        setPopup(data)
      } else {
        router.push('/dashboard/popups')
      }
    } catch {
      router.push('/dashboard/popups')
    }
  }

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/popups/${popupId}/leads?page=${page}&limit=50`)
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch (err) {
      console.error('Error fetching leads:', err)
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    if (!popup || leads.length === 0) return

    const fields = popup.fields || []
    const headers = ['#', ...fields.map(f => f.label), 'Page URL', 'Submitted At']
    const rows = leads.map((lead, idx) => [
      idx + 1 + (page - 1) * 50,
      ...fields.map(f => {
        const val = lead.data[f.id]
        return val !== undefined ? String(val) : ''
      }),
      lead.pageUrl || '',
      new Date(lead.createdAt).toLocaleString(),
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${popup.slug}-leads.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported!')
  }

  const fieldColumns = popup?.fields || []

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/popups" className="p-2 hover:bg-gray-100 rounded">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Leads: {popup?.name || '...'}
              </h1>
              <p className="text-sm text-gray-500">{total} total leads collected</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV} disabled={leads.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Leads table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No leads yet</h3>
            <p className="mt-1 text-gray-500">Leads will appear here when someone submits the popup form.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg border overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    {fieldColumns.map(f => (
                      <th key={f.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {f.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page URL</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leads.map((lead, idx) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{idx + 1 + (page - 1) * 50}</td>
                      {fieldColumns.map(f => (
                        <td key={f.id} className="px-4 py-3 text-sm text-gray-900 max-w-[200px] truncate">
                          {lead.data[f.id] !== undefined ? String(lead.data[f.id]) : '—'}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                        {lead.pageUrl || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(lead.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages} ({total} leads)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
