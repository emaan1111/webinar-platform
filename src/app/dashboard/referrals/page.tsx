'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Card, CardBody } from '@/components/ui/Card'
import {
  Users,
  TrendingUp,
  ShoppingCart,
  Eye,
  Calendar,
  Filter as FilterIcon,
  Search,
  ChevronRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ReferrerStats {
  referrerId: string
  referrerName: string
  referrerEmail: string
  referralCode: string
  totalReferred: number
  attended: number
  purchased: number
  uniqueViews: number
}

interface AnalyticsSummary {
  activeReferrers: number
  totalReferred: number
  totalAttended: number
  totalPurchased: number
  uniqueViews: number
  regRate: string
  attendanceRate: string
  salesRate: string
}

export default function ReferralAnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [referrers, setReferrers] = useState<ReferrerStats[]>([])
  const [filteredReferrers, setFilteredReferrers] = useState<ReferrerStats[]>([])
  const [webinarId, setWebinarId] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [webinars, setWebinars] = useState<Array<{ id: string; title: string }>>([])

  useEffect(() => {
    fetchWebinars()
    fetchAnalytics()
  }, [webinarId, startDate, endDate])

  useEffect(() => {
    filterReferrers()
  }, [searchQuery, referrers])

  const fetchWebinars = async () => {
    try {
      const response = await fetch('/api/webinars')
      if (response.ok) {
        const data = await response.json()
        setWebinars(data.webinars || [])
      }
    } catch (error) {
      console.error('Error fetching webinars:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (webinarId !== 'all') params.append('webinarId', webinarId)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/referrals/analytics?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSummary(data.summary)
        setReferrers(data.referrers || [])
        setFilteredReferrers(data.referrers || [])
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterReferrers = () => {
    if (!searchQuery.trim()) {
      setFilteredReferrers(referrers)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = referrers.filter(r =>
      r.referrerName.toLowerCase().includes(query) ||
      r.referrerEmail.toLowerCase().includes(query) ||
      r.referralCode.toLowerCase().includes(query)
    )
    setFilteredReferrers(filtered)
  }

  const handleViewDetails = (referralCode: string) => {
    router.push(`/dashboard/referrals/${referralCode}`)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600" />
            Referral Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track referral performance and identify top referrers
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardBody>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <FilterIcon className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-700">Filters</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Webinar
                  </label>
                  <select
                    value={webinarId}
                    onChange={(e) => setWebinarId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Webinars</option>
                    {webinars.map(w => (
                      <option key={w.id} value={w.id}>{w.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Name, email, code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Summary Stats */}
        {!loading && summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Referrers</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.activeReferrers}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Referred</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalReferred}</p>
                    <p className="text-xs text-gray-500">{summary.attendanceRate}% attended</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Purchased</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalPurchased}</p>
                    <p className="text-xs text-gray-500">{summary.salesRate}% conversion</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Eye className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Unique Views</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.uniqueViews}</p>
                    <p className="text-xs text-gray-500">{summary.regRate}% registered</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Referrers List */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Top Referrers ({filteredReferrers.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referrer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referred
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attended
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchased
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        Loading referrers...
                      </td>
                    </tr>
                  )}

                  {!loading && filteredReferrers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No referrers found
                      </td>
                    </tr>
                  )}

                  {!loading && filteredReferrers.map((referrer) => (
                    <tr key={referrer.referralCode} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{referrer.referrerName}</p>
                          <p className="text-sm text-gray-500">{referrer.referrerEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-mono bg-purple-100 text-purple-800 rounded">
                          {referrer.referralCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-semibold text-gray-900">{referrer.totalReferred}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-900">{referrer.attended}</span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({referrer.totalReferred > 0 ? Math.round((referrer.attended / referrer.totalReferred) * 100) : 0}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-900">{referrer.purchased}</span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({referrer.totalReferred > 0 ? Math.round((referrer.purchased / referrer.totalReferred) * 100) : 0}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-900">{referrer.uniqueViews}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleViewDetails(referrer.referralCode)}
                          className="text-purple-600 hover:text-purple-900 text-sm font-medium inline-flex items-center gap-1"
                        >
                          View Details
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  )
}
