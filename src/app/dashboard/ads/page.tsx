'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  DollarSign,
  Eye,
  MousePointer,
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  Download,
  AlertCircle,
  BarChart3,
  FileText
} from 'lucide-react'

type AdMetrics = {
  spend: string
  impressions: string
  clicks: string
  cpm: string
  cpc: string
  ctr: string
  reach: string
  date_start: string
  date_stop: string
  registrations?: number
  costPerReg?: string
}

type DateRange = 'today' | 'yesterday' | 'last_7d' | 'last_30d' | 'this_month' | 'last_month'

export default function FacebookAdsPage() {
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>('today')
  const [metrics, setMetrics] = useState<AdMetrics | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    fetchAdMetrics()
  }, [dateRange])

  const fetchAdMetrics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/ads/metrics?range=${dateRange}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch ad metrics')
      }
      
      const data = await response.json()
      setMetrics(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
      console.error('Error fetching ad metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/ads/sync', { method: 'POST' })
      if (response.ok) {
        await fetchAdMetrics()
      }
    } catch (err) {
      console.error('Sync error:', err)
    } finally {
      setSyncing(false)
    }
  }

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num)
  }

  const formatNumber = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('en-US').format(Math.round(num))
  }

  const formatPercentage = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return `${num.toFixed(2)}%`
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page header with sub-navigation */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Facebook Ads Analytics</h1>
              <p className="mt-1 text-sm text-gray-500">
                Monitor your ad performance and spending in real-time
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleSync}
                disabled={syncing}
                className="inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Button>
              <Button
                variant="secondary"
                className="inline-flex items-center gap-2"
                onClick={() => window.print()}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Sub-navigation tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { href: '/dashboard/ads', label: 'Key Metrics', icon: FileText },
                { href: '/dashboard/ads/charts', label: 'Charts & Trends', icon: BarChart3 }
              ].map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`border-b-2 py-4 px-1 text-sm font-medium inline-flex items-center gap-2 ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Date range selector */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700 mr-2">Date Range:</span>
              {[
                { value: 'today', label: 'Today' },
                { value: 'yesterday', label: 'Yesterday' },
                { value: 'last_7d', label: 'Last 7 Days' },
                { value: 'last_30d', label: 'Last 30 Days' },
                { value: 'this_month', label: 'This Month' },
                { value: 'last_month', label: 'Last Month' }
              ].map((range) => (
                <Button
                  key={range.value}
                  variant={dateRange === range.value ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setDateRange(range.value as DateRange)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading metrics</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchAdMetrics}
                className="mt-3"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && !error && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading ad metrics...</p>
            </div>
          </div>
        )}

        {/* Metrics display */}
        {!loading && !error && metrics && (
          <>
            {/* Main stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard
                title="Total Spend"
                value={formatCurrency(metrics.spend)}
                icon={<DollarSign className="w-5 h-5" />}
              />
              <StatCard
                title="Impressions"
                value={formatNumber(metrics.impressions)}
                icon={<Eye className="w-5 h-5" />}
              />
              <StatCard
                title="Clicks"
                value={formatNumber(metrics.clicks)}
                icon={<MousePointer className="w-5 h-5" />}
              />
              <StatCard
                title="Reach"
                value={formatNumber(metrics.reach)}
                icon={<TrendingUp className="w-5 h-5" />}
              />
              {metrics.registrations !== undefined && (
                <StatCard
                  title="Cost / Registration"
                  value={metrics.costPerReg ? formatCurrency(metrics.costPerReg) : '$0.00'}
                  icon={<DollarSign className="w-5 h-5" />}
                />
              )}
            </div>

            {/* Registration & Cost Per Reg Card */}
            {metrics.registrations !== undefined && (
              <Card>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Registrations</p>
                        <p className="text-sm text-gray-500 mt-1">Total webinar sign-ups</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {metrics.registrations}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Cost Per Registration</p>
                        <p className="text-sm text-gray-500 mt-1">Ad spend / registrations</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {metrics.costPerReg ? formatCurrency(metrics.costPerReg) : '$0.00'}
                        </p>
                        {metrics.registrations > 0 && parseFloat(metrics.costPerReg || '0') < 2 ? (
                          <span className="inline-flex items-center text-xs text-green-600 mt-1">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Excellent ROI
                          </span>
                        ) : parseFloat(metrics.costPerReg || '0') < 5 ? (
                          <span className="inline-flex items-center text-xs text-blue-600 mt-1">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Good ROI
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs text-orange-600 mt-1">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            Monitor closely
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Performance metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">CPM</p>
                      <p className="text-sm text-gray-500 mt-1">Cost per 1,000 impressions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(metrics.cpm)}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">CPC</p>
                      <p className="text-sm text-gray-500 mt-1">Cost per click</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(metrics.cpc)}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">CTR</p>
                      <p className="text-sm text-gray-500 mt-1">Click-through rate</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPercentage(metrics.ctr)}
                      </p>
                      {parseFloat(metrics.ctr) > 2 ? (
                        <span className="inline-flex items-center text-xs text-green-600 mt-1">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Good performance
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-orange-600 mt-1">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          Below average
                        </span>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Detailed breakdown */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Performance Breakdown</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <MetricRow
                    label="Total Ad Spend"
                    value={formatCurrency(metrics.spend)}
                    description="Total amount spent on ads"
                  />
                  <MetricRow
                    label="Impressions"
                    value={formatNumber(metrics.impressions)}
                    description="Number of times ads were shown"
                  />
                  <MetricRow
                    label="Unique Reach"
                    value={formatNumber(metrics.reach)}
                    description="Number of unique people who saw ads"
                  />
                  <MetricRow
                    label="Link Clicks"
                    value={formatNumber(metrics.clicks)}
                    description="Number of clicks on your ads"
                  />
                  <MetricRow
                    label="Cost Per Click (CPC)"
                    value={formatCurrency(metrics.cpc)}
                    description="Average cost for each click"
                  />
                  <MetricRow
                    label="Cost Per 1K Impressions (CPM)"
                    value={formatCurrency(metrics.cpm)}
                    description="Cost to reach 1,000 people"
                  />
                  <MetricRow
                    label="Click-Through Rate (CTR)"
                    value={formatPercentage(metrics.ctr)}
                    description="Percentage of people who clicked after seeing ad"
                  />
                  <MetricRow
                    label="Frequency"
                    value={(parseFloat(metrics.impressions) / parseFloat(metrics.reach)).toFixed(2)}
                    description="Average number of times each person saw your ad"
                  />
                </div>
              </CardBody>
            </Card>

            {/* ROI Calculator */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Quick ROI Calculator</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Average Order Value ($)
                    </label>
                    <input
                      type="number"
                      placeholder="100.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Conversion Rate (%)
                    </label>
                    <input
                      type="number"
                      placeholder="2.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Enter your average order value and conversion rate to calculate potential ROI
                </p>
              </CardBody>
            </Card>

            {/* Date info */}
            <div className="text-center text-sm text-gray-500">
              <Calendar className="w-4 h-4 inline-block mr-2" />
              Data from {new Date(metrics.date_start).toLocaleDateString()} to{' '}
              {new Date(metrics.date_stop).toLocaleDateString()}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

function MetricRow({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  )
}
