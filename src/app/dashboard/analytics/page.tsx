'use client'

import React, { useState } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Download, Calendar, TrendingUp, Users, Eye, MessageSquare } from 'lucide-react'

// Mock data for charts
const registrationData = [
  { date: 'Jan', registrations: 65, attendees: 45 },
  { date: 'Feb', registrations: 85, attendees: 68 },
  { date: 'Mar', registrations: 120, attendees: 95 },
  { date: 'Apr', registrations: 150, attendees: 120 },
  { date: 'May', registrations: 180, attendees: 155 },
  { date: 'Jun', registrations: 210, attendees: 180 },
]

const attendanceData = [
  { webinar: 'React Patterns', attended: 120, noShow: 30 },
  { webinar: 'Next.js Deep Dive', attended: 95, noShow: 15 },
  { webinar: 'TypeScript Tips', attended: 150, noShow: 25 },
  { webinar: 'AI Integration', attended: 200, noShow: 40 },
]

const engagementData = [
  { name: 'Chat Messages', value: 450, color: '#3b82f6' },
  { name: 'Questions', value: 120, color: '#10b981' },
  { name: 'Polls', value: 80, color: '#f59e0b' },
  { name: 'Reactions', value: 350, color: '#8b5cf6' },
]

const peakViewingData = [
  { time: '9 AM', viewers: 20 },
  { time: '10 AM', viewers: 45 },
  { time: '11 AM', viewers: 80 },
  { time: '12 PM', viewers: 120 },
  { time: '1 PM', viewers: 95 },
  { time: '2 PM', viewers: 150 },
  { time: '3 PM', viewers: 200 },
  { time: '4 PM', viewers: 180 },
  { time: '5 PM', viewers: 140 },
  { time: '6 PM', viewers: 90 },
]

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d')

  const handleExportReport = () => {
    const report = {
      dateRange,
      totalRegistrations: registrationData.reduce((sum, d) => sum + d.registrations, 0),
      totalAttendees: registrationData.reduce((sum, d) => sum + d.attendees, 0),
      engagementBreakdown: engagementData,
      webinarPerformance: attendanceData,
      peakTimes: peakViewingData,
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  const totalRegistrations = registrationData.reduce((sum, d) => sum + d.registrations, 0)
  const totalAttendees = registrationData.reduce((sum, d) => sum + d.attendees, 0)
  const attendanceRate = ((totalAttendees / totalRegistrations) * 100).toFixed(1)
  const totalEngagement = engagementData.reduce((sum, d) => sum + d.value, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track your webinar performance and engagement
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Button onClick={handleExportReport} className="inline-flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Total Registrations</h3>
                  <p className="text-2xl font-bold text-gray-900">{totalRegistrations}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +12.5% from last period
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Total Attendees</h3>
                  <p className="text-2xl font-bold text-gray-900">{totalAttendees}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +8.3% from last period
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Attendance Rate</h3>
                  <p className="text-2xl font-bold text-gray-900">{attendanceRate}%</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +5.2% from last period
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Total Engagement</h3>
                  <p className="text-2xl font-bold text-gray-900">{totalEngagement}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +18.7% from last period
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Registration Trends */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-gray-900">Registration & Attendance Trends</h2>
            <p className="text-sm text-gray-500">Track how your audience grows over time</p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={registrationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="registrations" stroke="#3b82f6" strokeWidth={2} name="Registrations" />
                <Line type="monotone" dataKey="attendees" stroke="#10b981" strokeWidth={2} name="Attendees" />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Attendance by Webinar */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-gray-900">Attendance by Webinar</h2>
            <p className="text-sm text-gray-500">See which webinars have the best attendance</p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="webinar" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="attended" fill="#10b981" name="Attended" />
                <Bar dataKey="noShow" fill="#ef4444" name="No Show" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement Breakdown */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900">Engagement Breakdown</h2>
              <p className="text-sm text-gray-500">How attendees interact during webinars</p>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={engagementData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {engagementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {engagementData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Peak Viewing Times */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900">Peak Viewing Times</h2>
              <p className="text-sm text-gray-500">When your audience is most active</p>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakViewingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="viewers" fill="#8b5cf6" name="Viewers" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
