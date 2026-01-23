'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { RefreshCw, Download, DollarSign, TrendingUp, Users, Package } from 'lucide-react'

type Sale = {
  id: string
  orderId: string
  amount: number | null
  currency: string | null
  status: string | null
  email: string | null
  productName: string | null
  orderFormId: string | null
  purchasedAt: Date | null
  webinarId: string
  registrationId: string | null
  registration?: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
    attended: boolean
  } | null
}

type Stats = {
  totalSales: number
  totalRevenue: number
  averageOrderValue: number
  linkedToRegistration: number
  notLinkedToRegistration: number
}

export default function SalesPage() {
  const [loading, setLoading] = useState(true)
  const [sales, setSales] = useState<Sale[]>([])
  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    linkedToRegistration: 0,
    notLinkedToRegistration: 0
  })
  const [filter, setFilter] = useState<'all' | 'linked' | 'unlinked'>('all')

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/sales')
      if (response.ok) {
        const data = await response.json()
        setSales(data.sales)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const headers = [
      'Order ID',
      'Date',
      'Amount',
      'Currency',
      'Email',
      'Customer Name',
      'Product',
      'Status',
      'Linked to Registration',
      'Attended Webinar'
    ]

    // Helper function to escape CSV values (handles commas, quotes, and newlines)
    const escapeCSVValue = (val: string): string => {
      if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }

    const rows = filteredSales.map(sale => [
      escapeCSVValue(sale.orderId),
      escapeCSVValue(sale.purchasedAt ? new Date(sale.purchasedAt).toLocaleString() : ''),
      sale.amount?.toFixed(2) || '0.00',
      sale.currency || 'USD',
      escapeCSVValue(sale.email || ''),
      escapeCSVValue(sale.registration 
        ? `${sale.registration.firstName || ''} ${sale.registration.lastName || ''}`.trim()
        : 'N/A'),
      escapeCSVValue(sale.productName || ''),
      escapeCSVValue(sale.status || ''),
      sale.registrationId ? 'Yes' : 'No',
      sale.registration?.attended ? 'Yes' : 'No'
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const filteredSales = sales.filter(sale => {
    if (filter === 'linked') return sale.registrationId !== null
    if (filter === 'unlinked') return sale.registrationId === null
    return true
  })

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
            <p className="mt-1 text-sm text-gray-500">
              All orders received from ClickFunnels
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={exportToCSV}
              disabled={sales.length === 0}
              className="inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              variant="secondary"
              onClick={fetchSales}
              disabled={loading}
              className="inline-flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {stats.totalSales}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    ${stats.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    ${stats.averageOrderValue.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Linked to Reg</p>
                  <p className="mt-2 text-3xl font-bold text-green-900">
                    {stats.linkedToRegistration}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Not Linked</p>
                  <p className="mt-2 text-3xl font-bold text-orange-900">
                    {stats.notLinkedToRegistration}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Sales ({stats.totalSales})
          </button>
          <button
            onClick={() => setFilter('linked')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === 'linked'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Linked to Registration ({stats.linkedToRegistration})
          </button>
          <button
            onClick={() => setFilter('unlinked')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === 'unlinked'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Not Linked ({stats.notLinkedToRegistration})
          </button>
        </div>

        {/* Sales Table */}
        <Card>
          <CardBody>
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="mt-4 text-gray-600">Loading sales...</p>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto" />
                <p className="mt-4 text-gray-600">No sales found</p>
                <p className="mt-2 text-sm text-gray-500">
                  Sales from ClickFunnels will appear here automatically
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attended
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {sale.orderId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sale.purchasedAt
                            ? new Date(sale.purchasedAt).toLocaleString()
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          ${sale.amount?.toFixed(2) || '0.00'} {sale.currency || 'USD'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.email || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.registration
                            ? `${sale.registration.firstName || ''} ${sale.registration.lastName || ''}`.trim() || 'N/A'
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {sale.productName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              sale.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : sale.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {sale.status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {sale.registrationId ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Linked
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                              Not Linked
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sale.registration?.attended ? (
                            <span className="text-green-600 font-medium">Yes</span>
                          ) : sale.registrationId ? (
                            <span className="text-gray-400">No</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Footer Info */}
        {sales.length > 0 && (
          <div className="text-sm text-gray-500 text-center">
            Showing {filteredSales.length} of {sales.length} sales
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
