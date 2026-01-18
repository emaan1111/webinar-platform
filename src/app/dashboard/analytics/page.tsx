'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { 
  Download, 
  Users, 
  Eye, 
  MousePointer, 
  MessageSquare, 
  Heart,
  Clock,
  TrendingUp,
  Loader2,
  RotateCcw,
  CheckCircle
} from 'lucide-react'

interface WebinarOption {
  id: string
  title: string
  createdAt: string
}

interface AnalyticsData {
  overview: {
    totalRegistrations: number
    totalPastRegistrations: number
    totalAttended: number
    attendanceRate: number
    noShows: number
    noShowRate: number
    avgWatchTime: number
    completionRate: number
  }
  offers: {
    sawOffer: number
    clickedOffer: number
    converted: number
    offerViewRate: number
    offerClickRate: number
    conversionRate: number
  }
  joinTiming: {
    onTime: number
    earlyLate: number
    late: number
    scheduleDistribution?: Array<{
        time: string
        count: number
    }>
  }
  engagement: {
    total: number
    chatMessages: number
    reactions: number
    questions: number
    offerClicks: number
    byMinute: Array<{
      minute: number
      chat: number
      reactions: number
      viewers?: number
    }>
  }
  funnel: {
    registrationPageVisits: number
    countdownPageVisits: number
    webinarPageVisits: number
    thankYouPageVisits: number
    registrationPages?: Array<{
      pageId: string | null
      pageName: string
      variantGroup: string | null
      views: number
      uniqueViews: number
      registrations: number
      conversionRate: number
      avgTimeOnPage: number
    }>
    embedViews?: {
      total: number
      inline: number
      popup: number
      uniqueVisitors: number
      uniqueInlineVisitors: number
      uniquePopupVisitors: number
    }
  }
}

export default function AnalyticsPage() {
  const [webinars, setWebinars] = useState<WebinarOption[]>([])
  const [selectedWebinars, setSelectedWebinars] = useState<string[]>([])
  const [timeFrame, setTimeFrame] = useState<string>('all')
  const [showWebinarDropdown, setShowWebinarDropdown] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resetting, setResetting] = useState(false)

  // Fetch webinars list
  useEffect(() => {
    const fetchWebinars = async () => {
      try {
        const response = await fetch('/api/webinars')
        const data = await response.json()
        if (data.webinars && data.webinars.length > 0) {
          setWebinars(data.webinars)
          // Select all webinars by default
          setSelectedWebinars(['all'])
        }
      } catch (err) {
        console.error('Failed to fetch webinars:', err)
      }
    }
    fetchWebinars()
  }, [])

  // Filter webinars by time frame
  const getFilteredWebinarIds = () => {
    if (selectedWebinars.includes('all')) {
      return webinars.map(w => w.id)
    }
    return selectedWebinars
  }

  // Fetch and aggregate analytics data
  useEffect(() => {
    const webinarIds = getFilteredWebinarIds()
    if (webinarIds.length === 0) return

    const fetchAnalytics = async () => {
      setLoading(true)
      setError('')
      try {
        // Use the aggregate API endpoint for better performance
        const queryParams = new URLSearchParams({
          webinarIds: webinarIds.join(','),
          timeFrame: timeFrame
        })
        
        const response = await fetch(`/api/analytics/aggregate?${queryParams}`)
        const aggregateResult = await response.json()
        
        if (!aggregateResult.success) {
          throw new Error(aggregateResult.error || 'Failed to fetch analytics')
        }
        
        // Use the pre-aggregated data from the API
        const results = [aggregateResult]
        
        // Check for errors
        const errorResult = results.find(r => !r.success)
        if (errorResult) {
          throw new Error(errorResult.error || 'Failed to fetch analytics')
        }
        
        // Aggregate data from all webinars
        const aggregated: AnalyticsData = {
          overview: {
            totalRegistrations: 0,
            totalPastRegistrations: 0,
            totalAttended: 0,
            attendanceRate: 0,
            noShows: 0,
            noShowRate: 0,
            avgWatchTime: 0,
            completionRate: 0
          },
          offers: {
            sawOffer: 0,
            clickedOffer: 0,
            converted: 0,
            offerViewRate: 0,
            offerClickRate: 0,
            conversionRate: 0
          },
          joinTiming: {
            onTime: 0,
            earlyLate: 0,
            late: 0
          },
          engagement: {
            total: 0,
            chatMessages: 0,
            reactions: 0,
            questions: 0,
            offerClicks: 0,
            byMinute: []
          },
          funnel: {
            registrationPageVisits: 0,
            countdownPageVisits: 0,
            webinarPageVisits: 0,
            thankYouPageVisits: 0,
            registrationPages: []
          }
        }

        let totalWatchTimeSum = 0
        let totalWebinarsWithData = 0
        const registrationPagesMap = new Map<string, {
          pageId: string | null
          pageName: string
          variantGroup: string | null
          views: number
          uniqueViews: number
          registrations: number
          totalTimeOnPage: number
          count: number
        }>()

        results.forEach(result => {
          const data = result.analytics
          
          // Sum overview metrics
          aggregated.overview.totalRegistrations += data.overview.totalRegistrations
          aggregated.overview.totalPastRegistrations += data.overview.totalPastRegistrations
          aggregated.overview.totalAttended += data.overview.totalAttended
          aggregated.overview.noShows += data.overview.noShows
          
          if (data.overview.totalAttended > 0) {
            totalWatchTimeSum += data.overview.avgWatchTime * data.overview.totalAttended
            totalWebinarsWithData++
          }
          
          // Sum offer metrics
          aggregated.offers.sawOffer += data.offers.sawOffer
          aggregated.offers.clickedOffer += data.offers.clickedOffer
          aggregated.offers.converted += data.offers.converted
          
          // Sum join timing
          aggregated.joinTiming.onTime += data.joinTiming.onTime
          aggregated.joinTiming.earlyLate += data.joinTiming.earlyLate
          aggregated.joinTiming.late += data.joinTiming.late
          
          // Merge Schedule Distribution
          if (data.joinTiming.scheduleDistribution) {
              if (!aggregated.joinTiming.scheduleDistribution) aggregated.joinTiming.scheduleDistribution = [];
              
              data.joinTiming.scheduleDistribution.forEach((item: any) => {
                  const existing = aggregated.joinTiming.scheduleDistribution!.find(d => d.time === item.time);
                  if (existing) {
                      existing.count += item.count;
                  } else {
                      aggregated.joinTiming.scheduleDistribution!.push({ ...item });
                  }
              });
          }
          
          // Sum engagement
          aggregated.engagement.total += data.engagement.total
          aggregated.engagement.chatMessages += data.engagement.chatMessages
          aggregated.engagement.reactions += data.engagement.reactions
          aggregated.engagement.questions += data.engagement.questions
          aggregated.engagement.offerClicks += data.engagement.offerClicks
          
          // Merge engagement by minute data
          data.engagement.byMinute.forEach((item: any) => {
            const existing = aggregated.engagement.byMinute.find(e => e.minute === item.minute)
            if (existing) {
              existing.chat += item.chat
              existing.reactions += item.reactions
              existing.viewers = (existing.viewers || 0) + (item.viewers || 0)
            } else {
              aggregated.engagement.byMinute.push({ ...item })
            }
          })
          
          // Sum funnel metrics
          aggregated.funnel.registrationPageVisits += data.funnel.registrationPageVisits
          aggregated.funnel.countdownPageVisits += data.funnel.countdownPageVisits
          aggregated.funnel.webinarPageVisits += data.funnel.webinarPageVisits
          aggregated.funnel.thankYouPageVisits += data.funnel.thankYouPageVisits
          
          // Aggregate embed views
          if (data.funnel.embedViews) {
            if (!aggregated.funnel.embedViews) {
              aggregated.funnel.embedViews = {
                total: 0,
                inline: 0,
                popup: 0,
                uniqueVisitors: 0,
                uniqueInlineVisitors: 0,
                uniquePopupVisitors: 0,
              }
            }
            aggregated.funnel.embedViews.total += data.funnel.embedViews.total
            aggregated.funnel.embedViews.inline += data.funnel.embedViews.inline
            aggregated.funnel.embedViews.popup += data.funnel.embedViews.popup
            aggregated.funnel.embedViews.uniqueVisitors += data.funnel.embedViews.uniqueVisitors
            aggregated.funnel.embedViews.uniqueInlineVisitors += data.funnel.embedViews.uniqueInlineVisitors
            aggregated.funnel.embedViews.uniquePopupVisitors += data.funnel.embedViews.uniquePopupVisitors
          }
          
          // Aggregate registration pages data
          if (data.funnel.registrationPages && data.funnel.registrationPages.length > 0) {
            data.funnel.registrationPages.forEach((page: any) => {
              const key = `${page.pageId || 'default'}-${page.variantGroup || 'none'}`
              const existing = registrationPagesMap.get(key)
              
              if (existing) {
                existing.views += page.views
                existing.uniqueViews += page.uniqueViews
                existing.registrations += page.registrations
                existing.totalTimeOnPage += page.avgTimeOnPage * page.views
                existing.count += page.views
              } else {
                registrationPagesMap.set(key, {
                  pageId: page.pageId,
                  pageName: page.pageName,
                  variantGroup: page.variantGroup,
                  views: page.views,
                  uniqueViews: page.uniqueViews,
                  registrations: page.registrations,
                  totalTimeOnPage: page.avgTimeOnPage * page.views,
                  count: page.views
                })
              }
            })
          }
        })

        // Convert registration pages map to array with calculated averages
        aggregated.funnel.registrationPages = Array.from(registrationPagesMap.values()).map(page => ({
          pageId: page.pageId,
          pageName: page.pageName,
          variantGroup: page.variantGroup,
          views: page.views,
          uniqueViews: page.uniqueViews,
          registrations: page.registrations,
          conversionRate: page.uniqueViews > 0 
            ? Math.round((page.registrations / page.uniqueViews) * 1000) / 10 
            : 0,
          avgTimeOnPage: Math.round(page.count > 0 ? page.totalTimeOnPage / page.count : 0)
        }))

        // Calculate averages and rates
        aggregated.overview.attendanceRate = aggregated.overview.totalPastRegistrations > 0
          ? (aggregated.overview.totalAttended / aggregated.overview.totalPastRegistrations) * 100
          : 0
        
        aggregated.overview.noShowRate = aggregated.overview.totalPastRegistrations > 0
          ? (aggregated.overview.noShows / aggregated.overview.totalPastRegistrations) * 100
          : 0
        
        aggregated.overview.avgWatchTime = aggregated.overview.totalAttended > 0
          ? totalWatchTimeSum / aggregated.overview.totalAttended
          : 0
        
        // Calculate completion rate (average of all webinars)
        const completionRates = results.map(r => r.analytics.overview.completionRate)
        aggregated.overview.completionRate = completionRates.length > 0
          ? completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length
          : 0
        
        aggregated.offers.offerViewRate = aggregated.overview.totalAttended > 0
          ? (aggregated.offers.sawOffer / aggregated.overview.totalAttended) * 100
          : 0
        
        aggregated.offers.offerClickRate = aggregated.offers.sawOffer > 0
          ? (aggregated.offers.clickedOffer / aggregated.offers.sawOffer) * 100
          : 0
        
        aggregated.offers.conversionRate = aggregated.offers.clickedOffer > 0
          ? (aggregated.offers.converted / aggregated.offers.clickedOffer) * 100
          : 0

        // Sort engagement by minute
        aggregated.engagement.byMinute.sort((a, b) => a.minute - b.minute)
        
        setAnalyticsData(aggregated)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
        console.error('Analytics error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [selectedWebinars, timeFrame, webinars])

  const handleWebinarToggle = (webinarId: string) => {
    if (webinarId === 'all') {
      // Toggle 'all' - if currently selected, deselect and select first webinar
      setSelectedWebinars(prev => {
        if (prev.includes('all')) {
          // Uncheck 'all' - select first webinar instead
          return webinars.length > 0 ? [webinars[0].id] : []
        } else {
          // Check 'all'
          return ['all']
        }
      })
    } else {
      setSelectedWebinars(prev => {
        // Remove 'all' if selecting individual webinars
        const filtered = prev.filter(id => id !== 'all')
        
        if (filtered.includes(webinarId)) {
          // Remove webinar
          const newSelection = filtered.filter(id => id !== webinarId)
          return newSelection.length === 0 ? ['all'] : newSelection
        } else {
          // Add webinar
          return [...filtered, webinarId]
        }
      })
    }
    // Don't close dropdown - allow multiple selections
  }

  const handleExportReport = () => {
    if (!analyticsData) return

    const selectedWebinarTitles = selectedWebinars.includes('all')
      ? 'All Webinars'
      : selectedWebinars.map(id => webinars.find(w => w.id === id)?.title).filter(Boolean).join(', ')

    const report = {
      webinars: selectedWebinarTitles,
      timeFrame,
      date: new Date().toISOString(),
      ...analyticsData
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const dateStr = new Date().toISOString().split('T')[0]
    a.download = `analytics-${selectedWebinars.includes('all') ? 'all' : 'selected'}-${dateStr}.json`
    a.click()
  }

  const handleResetStats = async () => {
    if (selectedWebinars.includes('all')) {
      alert('Please select a specific webinar to reset stats. You cannot reset stats for all webinars at once.')
      return
    }

    if (selectedWebinars.length > 1) {
      alert('Please select only one webinar to reset stats.')
      return
    }

    if (selectedWebinars.length === 0) {
      alert('Please select a webinar to reset stats.')
      return
    }

    const webinarId = selectedWebinars[0]
    const webinar = webinars.find(w => w.id === webinarId)
    
    const confirmed = window.confirm(
      `Are you sure you want to reset all analytics data for "${webinar?.title}"?\n\n` +
      'This will delete:\n' +
      '• All analytics events\n' +
      '• Registration attendance data\n' +
      '• Page view history\n\n' +
      'This action cannot be undone!'
    )

    if (!confirmed) return

    setResetting(true)
    try {
      const response = await fetch('/api/analytics/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webinarId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset analytics')
      }

      alert('Analytics reset successfully!')
      
      // Reload analytics data
      window.location.reload()
    } catch (err) {
      console.error('Reset error:', err)
      alert(err instanceof Error ? err.message : 'Failed to reset analytics')
    } finally {
      setResetting(false)
    }
  }

  const getSelectedWebinarLabel = () => {
    if (selectedWebinars.includes('all')) {
      return `All Webinars (${webinars.length})`
    }
    if (selectedWebinars.length === 0) {
      return 'Select Webinars'
    }
    if (selectedWebinars.length === 1) {
      return webinars.find(w => w.id === selectedWebinars[0])?.title || 'Select Webinars'
    }
    return `${selectedWebinars.length} Webinars Selected`
  }

  // Calculate unique views (registration page visits)
  const uniqueViews = analyticsData?.funnel.registrationPageVisits || 0
  const totalRegs = analyticsData?.overview.totalRegistrations || 0
  const conversionRate = uniqueViews > 0 ? ((totalRegs / uniqueViews) * 100).toFixed(1) : '0.0'

  // Prepare engagement timeline data (join/leave)
  const engagementTimeline = (analyticsData?.engagement.byMinute || []).sort((a, b) => a.minute - b.minute)
  
  // Prepare viewers retention chart
  const viewersData = engagementTimeline.map((item) => ({
    minute: `${item.minute}m`,
    viewers: item.viewers || 0
  }))

  const joinLeaveData = engagementTimeline.map((item) => ({
    minute: `${item.minute}m`,
    engagement: item.chat + item.reactions
  }))

  // Prepare reaction activity chart
  const reactionData = engagementTimeline.map((item) => ({
    minute: `${item.minute}m`,
    reactions: item.reactions
  }))

  // Prepare chat activity chart
  const chatData = engagementTimeline.map((item) => ({
    minute: `${item.minute}m`,
    messages: item.chat
  }))

  if (loading && !analyticsData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading analytics...</p>
          </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Real-time tracking and performance metrics
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Time Frame Selector */}
            <select
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              disabled={loading}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>

            {/* Webinar Multi-Select Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowWebinarDropdown(!showWebinarDropdown)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:bg-gray-50 transition-colors inline-flex items-center gap-2 min-w-[200px] justify-between"
                disabled={loading}
              >
                <span className="truncate">{getSelectedWebinarLabel()}</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${showWebinarDropdown ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showWebinarDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                  <div className="p-2">
                    <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedWebinars.includes('all')}
                        onChange={() => handleWebinarToggle('all')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-900">All Webinars ({webinars.length})</span>
                    </label>
                    
                    <div className="border-t border-gray-200 my-2"></div>
                    
                    {webinars.map((webinar) => (
                      <label 
                        key={webinar.id} 
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedWebinars.includes(webinar.id) || selectedWebinars.includes('all')}
                          onChange={() => handleWebinarToggle(webinar.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 truncate flex-1">{webinar.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button 
              onClick={handleExportReport} 
              className="inline-flex items-center gap-2"
              disabled={!analyticsData}
            >
              <Download className="w-4 h-4" />
              Export
            </Button>

            <Button 
              onClick={handleResetStats} 
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700"
              disabled={!analyticsData || resetting || selectedWebinars.includes('all') || selectedWebinars.length !== 1}
              title={
                selectedWebinars.includes('all') 
                  ? 'Select a specific webinar to reset stats' 
                  : selectedWebinars.length !== 1 
                    ? 'Select exactly one webinar to reset stats'
                    : 'Reset all analytics data for this webinar'
              }
            >
              {resetting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Reset Stats
            </Button>
          </div>
        </div>

        {error && (
          <Card>
            <CardBody>
              <div className="text-center py-8 text-red-600">
                <p>{error}</p>
              </div>
            </CardBody>
          </Card>
        )}

        {analyticsData && (
          <>
            {/* Row 1: Registrations & Conversion */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardBody>
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Eye className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-600">Unique Views</h3>
                      <p className="text-2xl font-bold text-gray-900">{uniqueViews}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Registration page visitors
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-600">Registrations</h3>
                      <p className="text-2xl font-bold text-gray-900">{totalRegs}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {conversionRate}% conversion rate
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-600">Attendees</h3>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalAttended}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {analyticsData.overview.attendanceRate.toFixed(1)}% attendance rate
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-600">Real Attendance %</h3>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.attendanceRate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {analyticsData.overview.totalPastRegistrations} past webinars only
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Row 2: Funnel Analytics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">              <Card>
                <CardBody>
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-600">Full Funnel</h3>
                      <p className="text-2xl font-bold text-gray-900">{uniqueViews > 0 ? ((analyticsData.overview.totalAttended / uniqueViews) * 100).toFixed(1) : '0.0'}%</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Views → Attendees
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Row 2: Offer Performance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card>
                <CardBody>
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Eye className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-600">Saw Offer</h3>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.offers.sawOffer}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {analyticsData.offers.offerViewRate.toFixed(1)}% of attendees
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <MousePointer className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-600">Clicked Offer</h3>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.offers.clickedOffer}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {analyticsData.offers.offerClickRate.toFixed(1)}% click rate
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-600">Converted</h3>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.offers.converted}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {analyticsData.offers.conversionRate.toFixed(1)}% conversion
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Registration Pages Breakdown */}
            {analyticsData.funnel.registrationPages && analyticsData.funnel.registrationPages.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-gray-900">Registration Pages Performance</h2>
                  <p className="text-sm text-gray-500">Views and unique visitors for each registration page</p>
                </CardHeader>
                <CardBody>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Registration Page</th>
                          {analyticsData.funnel.registrationPages.some(p => p.variantGroup) && (
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Variant</th>
                          )}
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Views</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Unique Views</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Registrations</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">% Registered</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Avg Time (sec)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.funnel.registrationPages.map((page, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-900">{page.pageName}</td>
                            {analyticsData.funnel.registrationPages!.some(p => p.variantGroup) && (
                              <td className="py-3 px-4">
                                {page.variantGroup && (
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    page.variantGroup === 'A' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    Variant {page.variantGroup}
                                  </span>
                                )}
                              </td>
                            )}
                            <td className="py-3 px-4 text-sm text-right text-gray-900 font-medium">{page.views}</td>
                            <td className="py-3 px-4 text-sm text-right text-gray-700">{page.uniqueViews}</td>
                            <td className="py-3 px-4 text-sm text-right text-gray-900 font-medium">{page.registrations}</td>
                            <td className="py-3 px-4 text-sm text-right">
                              <span className={`font-semibold ${
                                page.conversionRate >= 30 ? 'text-green-600' : 
                                page.conversionRate >= 15 ? 'text-yellow-600' : 
                                'text-red-600'
                              }`}>
                                {page.conversionRate}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-gray-700">{page.avgTimeOnPage}s</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Embed Form Views */}
            {analyticsData.funnel.embedViews && analyticsData.funnel.embedViews.total > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-gray-900">Embed Form Performance</h2>
                  <p className="text-sm text-gray-500">Embedded registration form views & conversion</p>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Eye className="w-5 h-5 text-blue-500" />
                        <h3 className="text-sm font-medium text-gray-600">Total Embed Views</h3>
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{analyticsData.funnel.embedViews.total}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {analyticsData.funnel.embedViews.uniqueVisitors} unique visitors
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-purple-500" />
                        <h3 className="text-sm font-medium text-gray-600">Inline Forms</h3>
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{analyticsData.funnel.embedViews.inline}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {analyticsData.funnel.embedViews.uniqueInlineVisitors} unique
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-sm font-medium text-gray-600">Popup Forms</h3>
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{analyticsData.funnel.embedViews.popup}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {analyticsData.funnel.embedViews.uniquePopupVisitors} unique
                      </p>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900 mb-1">Embed Conversion Rate</h4>
                        <p className="text-2xl font-bold text-blue-900">
                          {analyticsData.funnel.embedViews.uniqueVisitors > 0 
                            ? ((totalRegs / analyticsData.funnel.embedViews.uniqueVisitors) * 100).toFixed(1)
                            : '0.0'}%
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          {totalRegs} registrations from {analyticsData.funnel.embedViews.uniqueVisitors} unique embed visitors
                        </p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Schedule Preference Graph */}
            {analyticsData.joinTiming.scheduleDistribution && analyticsData.joinTiming.scheduleDistribution.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-gray-900">Preferred Schedule Times</h2>
                  <p className="text-sm text-gray-500">Distribution of scheduled times (Attendee's Local Time)</p>
                </CardHeader>
                <CardBody>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.joinTiming.scheduleDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          tickFormatter={(val: string) => parseInt(val).toString() + 'h'}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip 
                          cursor={{ fill: '#f3f4f6' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="#8b5cf6" 
                          name="Registrations" 
                          radius={[4, 4, 0, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Watch Engagement Graph */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-gray-900">Watch Engagement</h2>
                <p className="text-sm text-gray-500">Concurrent viewers by minute timestamp</p>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={viewersData}>
                    <defs>
                      <linearGradient id="colorViewers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="minute" />
                    <YAxis allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area 
                      type="monotone" 
                      dataKey="viewers" 
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorViewers)"
                      name="Active Viewers"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-gray-900">Engagement Interactions</h2>
                <p className="text-sm text-gray-500">Chat messages and reactions over time</p>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={joinLeaveData}>
                    <defs>
                      <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="minute" />
                    <YAxis allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area 
                      type="monotone"
                      dataKey="engagement"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorEngagement)"
                      name="Total Interactions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Reaction Activity */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Reaction Activity
                  </h2>
                  <p className="text-sm text-gray-500">When viewers reacted most</p>
                </CardHeader>
                <CardBody>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reactionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="minute" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="reactions" fill="#ef4444" name="Reactions" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">{analyticsData.engagement.reactions}</span> total reactions during webinar
                    </p>
                  </div>
                </CardBody>
              </Card>

              {/* Chat Activity */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                    Chat Activity
                  </h2>
                  <p className="text-sm text-gray-500">When viewers chatted most</p>
                </CardHeader>
                <CardBody>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chatData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="minute" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="messages" fill="#3b82f6" name="Messages" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">{analyticsData.engagement.chatMessages}</span> total chat messages sent
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardBody>
                  <div className="text-center">
                    <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h3 className="text-sm font-medium text-gray-600">Avg Watch Time</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {Math.floor(analyticsData.overview.avgWatchTime / 60)}m {analyticsData.overview.avgWatchTime % 60}s
                    </p>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="text-center">
                    <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="text-sm font-medium text-gray-600">Completion Rate</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {analyticsData.overview.completionRate.toFixed(1)}%
                    </p>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="text-center">
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="text-sm font-medium text-gray-600">No Shows</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {analyticsData.overview.noShows}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {analyticsData.overview.noShowRate.toFixed(1)}% of registrations
                    </p>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="text-center">
                    <MessageSquare className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <h3 className="text-sm font-medium text-gray-600">Total Engagement</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {analyticsData.engagement.total}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
