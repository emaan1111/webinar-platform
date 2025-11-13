'use client'

import React from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { formatDate } from '@/lib/dateFormat'
import {
  Video,
  Users,
  TrendingUp,
  Calendar,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye
} from 'lucide-react'

// Type definitions moved before usage
const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  LIVE: 'bg-green-100 text-green-700',
  ENDED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700'
} as const

type DashboardWebinar = {
  id: string
  title: string
  status: keyof typeof statusColors
  scheduledAt: string
  registrations: number
  attended: number
}

// Mock data - replace with actual API calls
const stats = {
  totalWebinars: 12,
  totalAttendees: 1543,
  avgAttendance: 78,
  upcomingWebinars: 3
}

const recentWebinars: DashboardWebinar[] = [
  {
    id: '1',
    title: 'Introduction to Web Development',
    scheduledAt: '2025-11-05T14:00:00',
    status: 'SCHEDULED',
    registrations: 234,
    attended: 0
  },
  {
    id: '2',
    title: 'Advanced React Patterns',
    scheduledAt: '2025-10-28T16:00:00',
    status: 'LIVE',
    registrations: 189,
    attended: 142
  },
  {
    id: '3',
    title: 'Building with Next.js 14',
    scheduledAt: '2025-10-25T15:00:00',
    status: 'ENDED',
    registrations: 312,
    attended: 245
  }
]

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back! Here's what's happening with your webinars.
            </p>
          </div>
          <Link href="/dashboard/webinars/new">
            <Button className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Webinar
            </Button>
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Webinars"
            value={stats.totalWebinars}
            icon={<Video className="w-5 h-5" />}
            change="+2 this month"
            changeType="positive"
          />
          <StatCard
            title="Total Attendees"
            value={stats.totalAttendees}
            icon={<Users className="w-5 h-5" />}
            change="+12.5%"
            changeType="positive"
          />
          <StatCard
            title="Avg Attendance Rate"
            value={`${stats.avgAttendance}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            change="+5.2%"
            changeType="positive"
          />
          <StatCard
            title="Upcoming Webinars"
            value={stats.upcomingWebinars}
            icon={<Calendar className="w-5 h-5" />}
          />
        </div>

        {/* Recent webinars */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Webinars</h2>
              <Link href="/dashboard/webinars">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-200">
              {recentWebinars.map((webinar) => (
                <WebinarRow key={webinar.id} webinar={webinar} />
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickActionCard
            title="Schedule Webinar"
            description="Create and schedule a new webinar"
            icon={<Calendar className="w-8 h-8 text-blue-600" />}
            href="/dashboard/webinars/new"
          />
          <QuickActionCard
            title="View Analytics"
            description="Check your webinar performance"
            icon={<TrendingUp className="w-8 h-8 text-green-600" />}
            href="/dashboard/analytics"
          />
          <QuickActionCard
            title="Manage Attendees"
            description="View and export attendee data"
            icon={<Users className="w-8 h-8 text-purple-600" />}
            href="/dashboard/attendees"
          />
        </div>
      </div>
    </DashboardLayout>
  )
}

function WebinarRow({ webinar }: { webinar: DashboardWebinar }) {

  const attendanceRate = webinar.attended > 0 
    ? Math.round((webinar.attended / webinar.registrations) * 100)
    : 0

  return (
    <div className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-base font-medium text-gray-900 truncate">
            {webinar.title}
          </h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[webinar.status]}`}>
            {webinar.status}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{formatDate(webinar.scheduledAt)}</span>
          <span>•</span>
          <span>{webinar.registrations} registered</span>
          {webinar.attended > 0 && (
            <>
              <span>•</span>
              <span>{webinar.attended} attended ({attendanceRate}%)</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <Link href={`/dashboard/webinars/${webinar.id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="w-4 h-4" />
          </Button>
        </Link>
        <Link href={`/dashboard/webinars/${webinar.id}/edit`}>
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
        </Link>
        <Button variant="ghost" size="sm">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

function QuickActionCard({ title, description, icon, href }: any) {
  return (
    <Link href={href}>
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  )
}
