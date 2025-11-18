'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  Calendar,
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BarChart3,
  FileText
} from 'lucide-react'

type DailyMetrics = {
  date: string
  spend: number
  impressions: number
  clicks: number
  cpm: number
  cpc: number
  ctr: number
  reach: number
  results: number
  costPerResult: number
  registrations: number
  costPerReg: number
}

export default function FacebookAdsChartsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<DailyMetrics[]>([])
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [useMockData, setUseMockData] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    // Set default date range (last 7 days for faster loading)
    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)
    
    setDateRange({
      from: sevenDaysAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    })
  }, [])

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchMetrics()
    }
  }, [dateRange, useMockData])

  const fetchMetrics = async () => {
    setLoading(true)
    setError(null)
    setWarning(null)
    
    try {
      console.log('🔄 Fetching charts data...', dateRange, useMockData ? '(MOCK)' : '(REAL)')
      
      // Use mock endpoint if toggle is on
      const endpoint = useMockData ? '/api/ads/charts-mock' : '/api/ads/charts'
      
      // Add 45 second timeout for the fetch
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 45000)
      
      const response = await fetch(
        `${endpoint}?from=${dateRange.from}&to=${dateRange.to}`,
        { signal: controller.signal }
      )
      
      clearTimeout(timeoutId)
      
      console.log('📡 Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error:', errorData)
        throw new Error(errorData.error || `Failed to fetch metrics (${response.status})`)
      }
      
      const data = await response.json()
      console.log('✅ Received metrics:', data.metrics?.length || 0, 'days')
      console.log('📊 Sample data:', data.metrics?.slice(0, 2))
      setMetrics(data.metrics || [])
      setWarning(data.warning || null)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Try selecting a shorter date range (e.g., last 7 days).')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
      }
      console.error('❌ Error fetching metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateTrend = (data: number[]) => {
    if (data.length < 2) return { value: 0, isPositive: true }
    const recent = data.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, data.length)
    const previous = data.slice(0, -7).reduce((a, b) => a + b, 0) / Math.max(1, data.length - 7)
    const change = previous > 0 ? ((recent - previous) / previous) * 100 : 0
    return { value: Math.abs(change), isPositive: change >= 0 }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const getMaxValue = (data: number[]) => Math.max(...data, 1)

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page header with sub-navigation */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Facebook Ads - Charts & Trends</h1>
              <p className="mt-1 text-sm text-gray-500">
                Visualize your ad performance metrics over time
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant={useMockData ? "primary" : "secondary"}
                onClick={() => setUseMockData(!useMockData)}
                className="inline-flex items-center gap-2"
                title={useMockData ? "Using mock data" : "Using Facebook API"}
              >
                {useMockData ? '🎲 Mock Data' : '📊 Real Data'}
              </Button>
              <Button
                variant="secondary"
                onClick={fetchMetrics}
                disabled={loading}
                className="inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="primary"
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

        {warning && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">Using sample data</p>
              <p className="text-sm text-amber-800 mt-1">{warning}</p>
            </div>
          </div>
        )}

        {/* Date range filter */}
        <Card>
          <CardBody>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Date Range:</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const today = new Date()
                  const sevenDaysAgo = new Date(today)
                  sevenDaysAgo.setDate(today.getDate() - 7)
                  setDateRange({
                    from: sevenDaysAgo.toISOString().split('T')[0],
                    to: today.toISOString().split('T')[0]
                  })
                }}
              >
                Last 7 Days
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const today = new Date()
                  const thirtyDaysAgo = new Date(today)
                  thirtyDaysAgo.setDate(today.getDate() - 30)
                  setDateRange({
                    from: thirtyDaysAgo.toISOString().split('T')[0],
                    to: today.toISOString().split('T')[0]
                  })
                }}
              >
                Last 30 Days
              </Button>
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
                onClick={fetchMetrics}
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
              <p className="mt-4 text-gray-600">Loading charts...</p>
            </div>
          </div>
        )}

        {/* Charts */}
        {!loading && !error && metrics.length > 0 && (
          <>
            {/* Ad Spend Chart */}
            <ChartCard
              title="Ad Spend"
              subtitle="Daily advertising expenditure"
              data={metrics.map(m => m.spend)}
              labels={metrics.map(m => new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))}
              color="blue"
              valueFormatter={formatCurrency}
              trend={calculateTrend(metrics.map(m => m.spend))}
            />

            {/* Impressions & Reach Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Impressions"
                subtitle="Total ad impressions over time"
                data={metrics.map(m => m.impressions)}
                labels={metrics.map(m => new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))}
                color="purple"
                trend={calculateTrend(metrics.map(m => m.impressions))}
              />
              <ChartCard
                title="Reach"
                subtitle="Unique people reached"
                data={metrics.map(m => m.reach)}
                labels={metrics.map(m => new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))}
                color="orange"
                trend={calculateTrend(metrics.map(m => m.reach))}
              />
            </div>

            {/* Clicks & CTR Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Clicks"
                subtitle="Total link clicks"
                data={metrics.map(m => m.clicks)}
                labels={metrics.map(m => new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))}
                color="green"
                trend={calculateTrend(metrics.map(m => m.clicks))}
              />
              <ChartCard
                title="Click-Through Rate (CTR)"
                subtitle="Percentage of impressions that resulted in clicks"
                data={metrics.map(m => m.ctr)}
                labels={metrics.map(m => new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))}
                color="teal"
                valueFormatter={(val) => `${val.toFixed(2)}%`}
                trend={calculateTrend(metrics.map(m => m.ctr))}
              />
            </div>

            {/* Results & Cost Per Result */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Facebook Results"
                subtitle="Total results from Facebook ads"
                data={metrics.map(m => m.results)}
                labels={metrics.map(m => new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))}
                color="cyan"
                trend={calculateTrend(metrics.map(m => m.results))}
              />
              <ChartCard
                title="Cost Per Result"
                subtitle="Average cost for each Facebook result"
                data={metrics.map(m => m.costPerResult)}
                labels={metrics.map(m => new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))}
                color="violet"
                valueFormatter={formatCurrency}
                trend={calculateTrend(metrics.map(m => m.costPerResult))}
                invertTrend={true}
              />
            </div>

            {/* Cost Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Cost Per Click (CPC)"
                subtitle="Average cost for each click"
                data={metrics.map(m => m.cpc)}
                labels={metrics.map(m => new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))}
                color="indigo"
                valueFormatter={formatCurrency}
                trend={calculateTrend(metrics.map(m => m.cpc))}
                invertTrend={true}
              />
              <ChartCard
                title="Cost Per 1,000 Impressions (CPM)"
                subtitle="Cost to reach 1,000 people"
                data={metrics.map(m => m.cpm)}
                labels={metrics.map(m => new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))}
                color="pink"
                valueFormatter={formatCurrency}
                trend={calculateTrend(metrics.map(m => m.cpm))}
                invertTrend={true}
              />
            </div>

            {/* Registrations & Cost Per Registration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Registrations"
                subtitle="Daily webinar sign-ups"
                data={metrics.map(m => m.registrations)}
                labels={metrics.map(m => new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))}
                color="emerald"
                trend={calculateTrend(metrics.map(m => m.registrations))}
              />
              <ChartCard
                title="Cost Per Registration"
                subtitle="Ad spend per webinar sign-up"
                data={metrics.map(m => m.costPerReg)}
                labels={metrics.map(m => new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))}
                color="red"
                valueFormatter={formatCurrency}
                trend={calculateTrend(metrics.map(m => m.costPerReg))}
                invertTrend={true}
              />
            </div>
          </>
        )}

        {/* Empty state */}
        {!loading && !error && metrics.length === 0 && (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
                <p className="text-gray-500 mb-2">
                  Unable to fetch metrics from Facebook Ads API.
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  This could be due to network connectivity issues, an expired access token, or Facebook API rate limiting.
                </p>
                <div className="space-y-3">
                  <Button onClick={fetchMetrics} variant="primary">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Connection
                  </Button>
                  <div className="text-xs text-gray-400">
                    <p>Troubleshooting tips:</p>
                    <ul className="mt-2 space-y-1 text-left max-w-md mx-auto">
                      <li>• Check your internet connection</li>
                      <li>• Verify Facebook access token is valid</li>
                      <li>• Try again in a few minutes (rate limiting)</li>
                      <li>• Check the Overview tab for current metrics</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

type ChartCardProps = {
  title: string
  subtitle: string
  data: number[]
  labels: string[]
  color: 'blue' | 'purple' | 'orange' | 'green' | 'teal' | 'indigo' | 'pink' | 'emerald' | 'red' | 'cyan' | 'violet'
  valueFormatter?: (value: number) => string
  trend?: { value: number; isPositive: boolean }
  invertTrend?: boolean
}

function ChartCard({ 
  title, 
  subtitle, 
  data, 
  labels, 
  color, 
  valueFormatter = (val) => val.toLocaleString(),
  trend,
  invertTrend = false
}: ChartCardProps) {
  const maxValue = Math.max(...data, 1)
  const minValue = Math.min(...data, 0)
  const range = maxValue - minValue || 1

  // Debug logging
  console.log(`📊 ChartCard "${title}":`, {
    dataPoints: data.length,
    maxValue,
    minValue,
    range,
    sampleData: data.slice(0, 3)
  })

  const textColorClasses = {
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    orange: 'text-orange-500',
    green: 'text-green-500',
    teal: 'text-teal-500',
    indigo: 'text-indigo-500',
    pink: 'text-pink-500',
    emerald: 'text-emerald-500',
    red: 'text-red-500',
    cyan: 'text-cyan-500',
    violet: 'text-violet-500'
  }
  const dotColorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    green: 'bg-green-500',
    teal: 'bg-teal-500',
    indigo: 'bg-indigo-500',
    pink: 'bg-pink-500',
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
    cyan: 'bg-cyan-500',
    violet: 'bg-violet-500'
  }

  const latestValue = data[data.length - 1] || 0
  const showTrend = trend && trend.value > 0
  const trendIsPositive = invertTrend ? !trend?.isPositive : trend?.isPositive
  const normalizedPoints = data.map((value, index) => {
    const x = data.length === 1 ? 50 : (index / Math.max(data.length - 1, 1)) * 100
    const y = 100 - ((value - minValue) / range) * 100
    return { x, y }
  })
  const linePath = normalizedPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x},${point.y}`)
    .join(' ')
  const areaPath = normalizedPoints.length
    ? `M ${normalizedPoints[0].x},100 L ${normalizedPoints.map(p => `${p.x},${p.y}`).join(' L ')} L ${normalizedPoints[normalizedPoints.length - 1].x},100 Z`
    : ''
  const gradientId = `chart-gradient-${title.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{valueFormatter(latestValue)}</p>
            {showTrend && (
              <div className={`flex items-center gap-1 mt-1 ${trendIsPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trendIsPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">{trend.value.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardBody>
        {/* Line Chart */}
        <div className="space-y-2">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="relative h-48">
              <svg
                className={`absolute inset-0 w-full h-full ${textColorClasses[color]}`}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id={gradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Subtle grid */}
                {[0, 25, 50, 75, 100].map((percent) => (
                  <line
                    key={percent}
                    x1="0"
                    x2="100"
                    y1={percent}
                    y2={percent}
                    stroke="#e5e7eb"
                    strokeWidth="0.5"
                  />
                ))}

                {/* Area under line */}
                {areaPath && (
                  <path
                    d={areaPath}
                    fill={`url(#${gradientId})`}
                    stroke="none"
                  />
                )}

                {/* Trend line */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}
              </svg>

              {/* Data points */}
              {normalizedPoints.map((point, index) => (
                <div
                  key={index}
                  className="absolute group"
                  style={{
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div
                    className={`${dotColorClasses[color]} w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm`}
                  />
                  <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 -translate-y-1 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                    {labels[index]}: {valueFormatter(data[index])}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-1">
            {labels.map((label, index) => (
              <div key={index} className="flex-1 text-center">
                {index % 3 === 0 && (
                  <span className="text-xs text-gray-500">{label}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
