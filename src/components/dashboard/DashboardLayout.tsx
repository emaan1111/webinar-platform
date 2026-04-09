'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Video,
  Users,
  BarChart3,
  MessageSquare,
  Gift,
  Settings,
  LogOut,
  Menu,
  X,
  Layout,
  FileText,
  Image,
  DollarSign,
  FileBarChart,
  ShoppingCart,
  Heart,
  Tag,
  UserPlus,
  ClipboardList,
  LayoutList,
  GitFork,
  Calendar,
  ExternalLink,
  BookOpen,
  PanelTop
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Webinars', href: '/dashboard/webinars', icon: Video },
  { name: 'External Webinars', href: '/dashboard/external-webinars', icon: ExternalLink },
  { name: 'Events', href: '/dashboard/events', icon: Calendar },
  { name: 'Lead Pages', href: '/dashboard/lead-pages', icon: LayoutList },
  { name: 'Content Pages', href: '/dashboard/content-pages', icon: BookOpen },
  { name: 'Split Tests', href: '/dashboard/split-tests', icon: GitFork },
  { name: 'Registration Pages', href: '/dashboard/registration-pages', icon: Layout },
  { name: 'Forms', href: '/dashboard/forms', icon: ClipboardList },
  { name: 'Popup Forms', href: '/dashboard/popups', icon: PanelTop },
  { name: 'Templates', href: '/dashboard/templates', icon: FileText },
  { name: 'Images', href: '/dashboard/images', icon: Image },
  { name: 'Attendees', href: '/dashboard/attendees', icon: Users },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Referrals', href: '/dashboard/referrals', icon: UserPlus },
  { name: 'Reports', href: '/dashboard/reports', icon: FileBarChart },
  { name: 'Sales', href: '/dashboard/sales', icon: ShoppingCart },
  { name: 'Facebook Ads', href: '/dashboard/ads', icon: DollarSign },
  { name: 'Chat Moderation', href: '/dashboard/chat', icon: MessageSquare },
  { name: 'Reactions', href: '/dashboard/reactions', icon: Heart },
  { name: 'Offers & Bonuses', href: '/dashboard/offers', icon: Gift },
  { name: 'ClickFunnels Tags', href: '/dashboard/clickfunnels/tag-queue', icon: Tag },
  { name: 'User Management', href: '/dashboard/users', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingChatCount, setPendingChatCount] = useState(0)
  const [formSubmissionCount, setFormSubmissionCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  
  // Fetch counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Chat count
        const chatRes = await fetch('/api/chat/pending-count')
        if (chatRes.ok) {
          const data = await chatRes.json()
          setPendingChatCount(data.count)
        }

        // Form stats
        const formRes = await fetch('/api/forms/stats')
        if (formRes.ok) {
          const data = await formRes.json()
          setFormSubmissionCount(data.count)
        }
      } catch (error) {
        console.error('Error fetching dashboard counts:', error)
      }
    }

    if (session) {
      fetchCounts()
      // Poll every 30 seconds
      const interval = setInterval(fetchCounts, 30000)
      return () => clearInterval(interval)
    }
  }, [session])
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])
  
  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  // Don't render dashboard if not authenticated
  if (status === 'unauthenticated') {
    return null
  }
  
  // Get user initials for avatar
  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 1).toUpperCase()
  }
  
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }
  
  const userName = session?.user?.name || 'User'
  const userEmail = session?.user?.email || 'user@example.com'
  const userInitials = getUserInitials(session?.user?.name)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white">
            <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900">Webinar Platform</h1>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="px-4 py-6 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                    {item.name === 'Chat Moderation' && pendingChatCount > 0 && (
                      <span className="ml-auto flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                    {item.name === 'Forms' && formSubmissionCount > 0 && (
                      <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {formSubmissionCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="flex h-16 items-center px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Webinar Platform</h1>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {item.name === 'Chat Moderation' && pendingChatCount > 0 && (
                     <span className="flex h-2.5 w-2.5 relative">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                     </span>
                  )}
                  {item.name === 'Forms' && formSubmissionCount > 0 && (
                     <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                       {formSubmissionCount}
                     </span>
                  )}
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <div className="sticky top-0 z-10 flex h-16 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-gray-500 lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex flex-1 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
                  {userInitials}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500">{userEmail}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
