'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import {
  Download,
  Upload,
  Eye,
  EyeOff,
  Search,
  MessageSquare,
  Trash2
} from 'lucide-react'

interface ChatMessage {
  id: string
  userId: string
  message: string
  isHidden: boolean
  isApproved: boolean  // Always boolean in DB (default: false)
  isScripted: boolean
  videoTimestamp: number | null
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
  webinar: {
    id: string
    title: string
  }
  // Computed properties for easier access
  userName?: string
  webinarTitle?: string
  timestamp?: string
  isModerated?: boolean
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'visible' | 'hidden' | 'scripted'

export default function ChatModerationPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [webinarFilter, setWebinarFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [webinars, setWebinars] = useState<Array<{ id: string; title: string }>>([])
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Bulk selection state
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set())
  
  // Import progress state
  const [importStatus, setImportStatus] = useState<{
    isImporting: boolean
    progress: string
    total: number
    imported: number
    failed: number
    errors: string[]
  }>({
    isImporting: false,
    progress: '',
    total: 0,
    imported: 0,
    failed: 0,
    errors: []
  })

  useEffect(() => {
    fetchMessages()
    fetchWebinars()
  }, [])

  const fetchWebinars = async () => {
    try {
      const response = await fetch('/api/webinars')
      if (response.ok) {
        const data = await response.json()
        setWebinars(data.webinars || [])
      } else {
        console.error('Failed to fetch webinars:', response.status, response.statusText)
        // Don't show error to user, just log it and continue with empty list
        setWebinars([])
      }
    } catch (error) {
      console.error('Error fetching webinars:', error)
      // Don't show error to user, just log it and continue with empty list
      setWebinars([])
    }
  }

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (webinarFilter !== 'all') params.append('webinarId', webinarFilter)
      if (searchQuery) params.append('search', searchQuery)
      
      const response = await fetch(`/api/chat?${params}`)
      if (response.ok) {
        const data = await response.json()
        // Map the API response to include computed properties
        const mappedMessages = data.messages.map((msg: ChatMessage) => ({
          ...msg,
          userName: msg.user?.name || msg.user?.email || 'Anonymous',
          webinarTitle: msg.webinar?.title || 'Unknown Webinar',
          timestamp: msg.createdAt,
          isModerated: false // Add moderation status if needed
        }))
        setMessages(mappedMessages)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [webinarFilter, searchQuery])

  const pendingMessages = messages.filter(msg => !msg.isScripted && msg.isApproved !== true)
  const approvedMessages = messages.filter(msg => !msg.isScripted && msg.isApproved === true)
  const scriptedMessages = messages.filter(msg => msg.isScripted)
  const visibleMessages = messages.filter(msg => !msg.isHidden)
  const hiddenMessages = messages.filter(msg => msg.isHidden)

  // Debug logging - shows what we're working with
  React.useEffect(() => {
    if (messages.length > 0) {
      console.log('📊 Chat Debug Info:', {
        totalMessages: messages.length,
        pendingCount: pendingMessages.length,
        approvedCount: approvedMessages.length,
        scriptedCount: scriptedMessages.length,
        currentFilter: statusFilter,
        sampleMessages: messages.slice(0, 3).map(m => ({
          id: m.id.slice(0, 8),
          isScripted: m.isScripted,
          isApproved: m.isApproved,
          message: m.message.slice(0, 30)
        }))
      })
    }
  }, [messages, statusFilter])

  const statusOptions: Array<{ value: StatusFilter; label: string; count: number }> = [
    { value: 'all', label: 'All', count: messages.length },
    { value: 'pending', label: 'Pending', count: pendingMessages.length },
    { value: 'approved', label: 'Approved', count: approvedMessages.length },
    { value: 'scripted', label: 'Scripted', count: scriptedMessages.length },
    { value: 'visible', label: 'Visible', count: visibleMessages.length },
    { value: 'hidden', label: 'Hidden', count: hiddenMessages.length }
  ]

  const filteredMessages = messages
    .filter(msg => {
      const matchesSearch = 
        msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (msg.userName?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      
      const matchesWebinar = 
        webinarFilter === 'all' ||
        msg.webinar?.id === webinarFilter
      
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'visible' && !msg.isHidden) ||
        (statusFilter === 'hidden' && msg.isHidden) ||
        (statusFilter === 'pending' && !msg.isScripted && msg.isApproved !== true) ||
        (statusFilter === 'approved' && !msg.isScripted && msg.isApproved === true) ||
        (statusFilter === 'scripted' && msg.isScripted)

      // Debug for pending filter
      if (statusFilter === 'pending' && !matchesStatus) {
        console.log('❌ Rejected by pending filter:', {
          msg: msg.message.slice(0, 30),
          isScripted: msg.isScripted,
          isApproved: msg.isApproved,
          isApprovedType: typeof msg.isApproved,
          condition: `!isScripted: ${!msg.isScripted}, isApproved !== true: ${msg.isApproved !== true}`
        })
      }

      return matchesSearch && matchesWebinar && matchesStatus
    })
    .sort((a, b) => {
      // Sort by video timestamp (ascending), then by created date
      const aTime = typeof a.videoTimestamp === 'number' ? a.videoTimestamp : Number.MAX_SAFE_INTEGER
      const bTime = typeof b.videoTimestamp === 'number' ? b.videoTimestamp : Number.MAX_SAFE_INTEGER
      
      if (aTime !== bTime) {
        return aTime - bTime
      }
      
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  
  // Pagination
  const totalPages = Math.ceil(filteredMessages.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedMessages = filteredMessages.slice(startIndex, endIndex)
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, webinarFilter, statusFilter])
  
  // Bulk selection helpers
  const toggleSelectMessage = (id: string) => {
    const newSelected = new Set(selectedMessages)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedMessages(newSelected)
  }
  
  const selectAllOnPage = () => {
    const newSelected = new Set(selectedMessages)
    paginatedMessages.forEach(msg => newSelected.add(msg.id))
    setSelectedMessages(newSelected)
  }
  
  const selectAll = () => {
    const newSelected = new Set(filteredMessages.map(msg => msg.id))
    setSelectedMessages(newSelected)
  }
  
  const deselectAll = () => {
    setSelectedMessages(new Set())
  }
  
  const bulkApprove = async () => {
    if (selectedMessages.size === 0) return
    if (!confirm(`Approve ${selectedMessages.size} message(s)?`)) return
    
    try {
      const promises = Array.from(selectedMessages).map(id => 
        fetch('/api/chat', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id,
            isApproved: true,
            isHidden: false
          })
        })
      )
      
      await Promise.all(promises)
      
      // Update local state
      setMessages(messages.map(msg => 
        selectedMessages.has(msg.id) ? { ...msg, isApproved: true, isHidden: false, isModerated: true } : msg
      ))
      setSelectedMessages(new Set())
    } catch (error) {
      console.error('Error bulk approving:', error)
      alert('Failed to approve some messages')
    }
  }
  
  const bulkReject = async () => {
    if (selectedMessages.size === 0) return
    if (!confirm(`Reject ${selectedMessages.size} message(s)?`)) return
    
    try {
      const promises = Array.from(selectedMessages).map(id => 
        fetch('/api/chat', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id,
            isApproved: false,
            isHidden: true
          })
        })
      )
      
      await Promise.all(promises)
      
      // Update local state
      setMessages(messages.map(msg => 
        selectedMessages.has(msg.id) ? { ...msg, isApproved: false, isHidden: true, isModerated: true } : msg
      ))
      setSelectedMessages(new Set())
    } catch (error) {
      console.error('Error bulk rejecting:', error)
      alert('Failed to reject some messages')
    }
  }

  const bulkDelete = async () => {
    if (selectedMessages.size === 0) return
    if (!confirm(`⚠️ PERMANENTLY DELETE ${selectedMessages.size} message(s)?\n\nThis action cannot be undone!`)) return
    
    try {
      const promises = Array.from(selectedMessages).map(id => 
        fetch(`/api/chat/${id}`, {
          method: 'DELETE'
        })
      )
      
      await Promise.all(promises)
      
      // Remove deleted messages from state
      setMessages(messages.filter(msg => !selectedMessages.has(msg.id)))
      setSelectedMessages(new Set())
      alert(`Successfully deleted ${selectedMessages.size} message(s)`)
    } catch (error) {
      console.error('Error bulk deleting:', error)
      alert('Failed to delete some messages')
    }
  }

  const deleteAllFiltered = async () => {
    if (filteredMessages.length === 0) return
    
    const confirmText = `⚠️ PERMANENTLY DELETE ALL ${filteredMessages.length} FILTERED MESSAGE(S)?\n\nCurrent filter: ${statusFilter}\nThis will delete ALL messages currently visible in the list.\n\nThis action CANNOT be undone!`
    
    if (!confirm(confirmText)) return
    
    try {
      const promises = filteredMessages.map(msg => 
        fetch(`/api/chat/${msg.id}`, {
          method: 'DELETE'
        })
      )
      
      await Promise.all(promises)
      
      // Remove deleted messages from state
      const deletedIds = new Set(filteredMessages.map(m => m.id))
      setMessages(messages.filter(msg => !deletedIds.has(msg.id)))
      alert(`Successfully deleted ${filteredMessages.length} message(s)`)
    } catch (error) {
      console.error('Error deleting all:', error)
      alert('Failed to delete some messages')
    }
  }

  const handleToggleVisibility = async (id: string) => {
    const message = messages.find(msg => msg.id === id)
    if (!message) return

    try {
      const response = await fetch('/api/chat', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          isHidden: !message.isHidden
        })
      })

      if (response.ok) {
        setMessages(messages.map(msg => 
          msg.id === id ? { ...msg, isHidden: !msg.isHidden, isModerated: true } : msg
        ))
      } else {
        alert('Failed to update message visibility')
      }
    } catch (error) {
      console.error('Error toggling visibility:', error)
      alert('Failed to update message visibility')
    }
  }

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this message?')) {
      return
    }

    try {
      const response = await fetch(`/api/chat/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessages(messages.filter(msg => msg.id !== id))
      } else {
        alert('Failed to delete message')
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Failed to delete message')
    }
  }

  const handleApproveMessage = async (id: string, approve: boolean) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          isApproved: approve,
          isHidden: !approve // If approved, unhide; if rejected, hide
        })
      })

      if (response.ok) {
        setMessages(messages.map(msg => 
          msg.id === id ? { ...msg, isApproved: approve, isHidden: !approve, isModerated: true } : msg
        ))
      } else {
        alert('Failed to update message')
      }
    } catch (error) {
      console.error('Error approving/rejecting message:', error)
      alert('Failed to update message')
    }
  }

  const handleExportJSON = () => {
    const exportData = filteredMessages.map(msg => ({
      user: msg.userName,
      message: msg.message,
      timestamp: msg.timestamp,
      webinar: msg.webinarTitle,
      status: msg.isHidden ? 'hidden' : 'visible'
    }))

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-log-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  const handleExportTXT = () => {
    const txtContent = filteredMessages.map(msg => 
      `[${new Date(msg.timestamp || msg.createdAt).toLocaleString()}] ${msg.userName || 'Anonymous'}: ${msg.message}`
    ).join('\n')

    const blob = new Blob([txtContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-log-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset import status
    setImportStatus({
      isImporting: true,
      progress: 'Reading file...',
      total: 0,
      imported: 0,
      failed: 0,
      errors: []
    })

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string
        
        // Check if webinar is selected
        if (!webinarFilter || webinarFilter === 'all') {
          setImportStatus({
            isImporting: false,
            progress: 'Failed: No webinar selected',
            total: 0,
            imported: 0,
            failed: 0,
            errors: ['Please select a webinar from the filter dropdown before importing']
          })
          return
        }

        setImportStatus(prev => ({ ...prev, progress: 'Parsing file...' }))
        
        let messagesToImport: any[] = []
        
        // Check if it's CSV or JSON
        if (file.name.endsWith('.csv')) {
          // Parse CSV format: Hour,Minute,Second,Name,Role,Message,Mode
          const lines = content.split('\n').filter(line => line.trim())
          const headers = lines[0].split(',')
          
          if (!headers.includes('Message') || !headers.includes('Name')) {
            setImportStatus({
              isImporting: false,
              progress: 'Failed: Invalid CSV format',
              total: 0,
              imported: 0,
              failed: 0,
              errors: ['Invalid CSV format. Expected columns: Hour,Minute,Second,Name,Role,Message,Mode']
            })
            return
          }

          // Convert CSV to chat messages
          messagesToImport = lines.slice(1).map((line, index) => {
            const values = line.split(',')
            return {
              hour: values[0],
              minute: values[1],
              second: values[2],
              name: values[3],
              role: values[4],
              message: values[5],
              mode: values[6]
            }
          }).filter(msg => msg.message && msg.name)

          if (messagesToImport.length === 0) {
            setImportStatus({
              isImporting: false,
              progress: 'Failed: No valid messages',
              total: 0,
              imported: 0,
              failed: 0,
              errors: ['No valid messages found in CSV file']
            })
            return
          }

          setImportStatus(prev => ({ 
            ...prev, 
            progress: `Found ${messagesToImport.length} messages, importing...`,
            total: messagesToImport.length
          }))

          // Send to API
          const response = await fetch('/api/chat/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              webinarId: webinarFilter,
              messages: messagesToImport
            })
          })

          if (response.ok) {
            const data = await response.json()
            setImportStatus({
              isImporting: false,
              progress: 'Import completed successfully!',
              total: messagesToImport.length,
              imported: data.imported || messagesToImport.length,
              failed: data.failed || 0,
              errors: data.errors || []
            })
            fetchMessages() // Refresh the list
          } else {
            const error = await response.json()
            setImportStatus({
              isImporting: false,
              progress: 'Import failed',
              total: messagesToImport.length,
              imported: 0,
              failed: messagesToImport.length,
              errors: [error.error || 'Unknown error', error.details || ''].filter(Boolean)
            })
          }
        } else if (file.name.endsWith('.json')) {
          // Parse JSON format
          messagesToImport = JSON.parse(content)
          
          if (!Array.isArray(messagesToImport) || messagesToImport.length === 0) {
            setImportStatus({
              isImporting: false,
              progress: 'Failed: Invalid JSON format',
              total: 0,
              imported: 0,
              failed: 0,
              errors: ['Invalid JSON format. Expected an array of messages']
            })
            return
          }

          setImportStatus(prev => ({ 
            ...prev, 
            progress: `Found ${messagesToImport.length} messages, importing...`,
            total: messagesToImport.length
          }))

          // Send to API
          const response = await fetch('/api/chat/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              webinarId: webinarFilter,
              messages: messagesToImport
            })
          })

          if (response.ok) {
            const data = await response.json()
            setImportStatus({
              isImporting: false,
              progress: 'Import completed successfully!',
              total: messagesToImport.length,
              imported: data.imported || messagesToImport.length,
              failed: data.failed || 0,
              errors: data.errors || []
            })
            fetchMessages() // Refresh the list
          } else {
            const error = await response.json()
            setImportStatus({
              isImporting: false,
              progress: 'Import failed',
              total: messagesToImport.length,
              imported: 0,
              failed: messagesToImport.length,
              errors: [error.error || 'Unknown error', error.details || ''].filter(Boolean)
            })
          }
        } else {
          setImportStatus({
            isImporting: false,
            progress: 'Failed: Unsupported file format',
            total: 0,
            imported: 0,
            failed: 0,
            errors: ['Unsupported file format. Please use .csv or .json files']
          })
        }
      } catch (error) {
        console.error('Import error:', error)
        setImportStatus({
          isImporting: false,
          progress: 'Import failed with error',
          total: 0,
          imported: 0,
          failed: 0,
          errors: [error instanceof Error ? error.message : 'Error importing file. Please check the format and try again.']
        })
      } finally {
        // Reset file input
        e.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chat Moderation</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor and moderate webinar chat messages
            </p>
          </div>
          <div className="flex gap-2">
            <input
              id="import-chat"
              type="file"
              accept=".json,.csv"
              onChange={handleImport}
              className="hidden"
              ref={(input) => {
                if (input) {
                  (window as any).chatFileInput = input
                }
              }}
            />
            <Button 
              variant="secondary" 
              onClick={() => document.getElementById('import-chat')?.click()}
              className="inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Button
              variant="secondary"
              onClick={handleExportTXT}
              className="inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export TXT
            </Button>
            <Button
              onClick={handleExportJSON}
              className="inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </Button>
            {filteredMessages.length > 0 && (
              <Button
                variant="danger"
                onClick={deleteAllFiltered}
                className="inline-flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete All ({filteredMessages.length})
              </Button>
            )}
          </div>
        </div>

        {/* Import Status Panel */}
        {(importStatus.isImporting || importStatus.progress) && (
          <Card>
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Import Status</h3>
                  {!importStatus.isImporting && (
                    <button
                      onClick={() => setImportStatus({
                        isImporting: false,
                        progress: '',
                        total: 0,
                        imported: 0,
                        failed: 0,
                        errors: []
                      })}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                {/* Progress Message */}
                <div className={`flex items-center gap-2 ${
                  importStatus.isImporting ? 'text-blue-600' :
                  importStatus.imported > 0 ? 'text-green-600' :
                  importStatus.errors.length > 0 ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {importStatus.isImporting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  )}
                  <span className="font-medium">{importStatus.progress}</span>
                </div>

                {/* Statistics */}
                {importStatus.total > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-2xl font-bold text-gray-900">{importStatus.total}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-sm text-green-600">Imported</p>
                      <p className="text-2xl font-bold text-green-600">{importStatus.imported}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-sm text-red-600">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{importStatus.failed}</p>
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                {importStatus.total > 0 && !importStatus.isImporting && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        importStatus.imported === importStatus.total ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${(importStatus.imported / importStatus.total) * 100}%` }}
                    />
                  </div>
                )}

                {/* Error Messages */}
                {importStatus.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-800 mb-2">
                      {importStatus.errors.length} error{importStatus.errors.length > 1 ? 's' : ''} occurred:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {importStatus.errors.slice(0, 5).map((error, index) => (
                        <li key={index} className="text-sm text-red-700">{error}</li>
                      ))}
                      {importStatus.errors.length > 5 && (
                        <li className="text-sm text-red-600 font-medium">
                          ...and {importStatus.errors.length - 5} more errors
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Success Message */}
                {!importStatus.isImporting && importStatus.imported > 0 && importStatus.failed === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      ✓ Successfully imported {importStatus.imported} message{importStatus.imported > 1 ? 's' : ''}!
                    </p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardBody>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search messages or users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Webinar Filter */}
                <select
                  value={webinarFilter}
                  onChange={(e) => setWebinarFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Webinars</option>
                  {webinars.map(webinar => (
                    <option key={webinar.id} value={webinar.id}>{webinar.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Filter by status</p>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatusFilter(option.value)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                        statusFilter === option.value
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {option.label} ({option.count})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Bulk Actions */}
        {selectedMessages.size > 0 && (
          <Card>
            <CardBody>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    {selectedMessages.size} message(s) selected
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={deselectAll}
                  >
                    Deselect All
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={bulkApprove}
                  >
                    Approve Selected
                  </Button>
                  <Button
                    variant="danger"
                    onClick={bulkReject}
                  >
                    Reject Selected
                  </Button>
                  <Button
                    variant="danger"
                    onClick={bulkDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <Card>
            <CardBody>
              <h3 className="text-sm font-medium text-gray-600">Total Messages</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{messages.length}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h3 className="text-sm font-medium text-gray-600">Visible</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {messages.filter(m => !m.isHidden).length}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h3 className="text-sm font-medium text-gray-600">Hidden</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {messages.filter(m => m.isHidden).length}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h3 className="text-sm font-medium text-gray-600">Moderated</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {messages.filter(m => m.isModerated).length}
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Selection Controls */}
        {filteredMessages.length > 0 && (
          <Card>
            <CardBody>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={selectAllOnPage}
                  >
                    Select All on Page ({paginatedMessages.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={selectAll}
                  >
                    Select All ({filteredMessages.length})
                  </Button>
                  {selectedMessages.size > 0 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={deselectAll}
                    >
                      Deselect All
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Items per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="px-2 py-1 border border-gray-300 rounded"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Messages List */}
        <div className="space-y-4">
          {paginatedMessages.map((message) => (
            <Card key={message.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedMessages.has(message.id)}
                      onChange={() => toggleSelectMessage(message.id)}
                      className="mt-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                      {message.userName ? message.userName.charAt(0).toUpperCase() : '?'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900">{message.userName || 'Anonymous'}</h3>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp || message.createdAt).toLocaleString()}
                        </span>
                        {message.isScripted ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Scripted
                          </span>
                        ) : message.isApproved ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                        {message.isHidden && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${message.isHidden ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                        {message.message}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>Webinar: {message.webinarTitle}</span>
                        {typeof message.videoTimestamp === 'number' && (
                          <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                            <i className="fas fa-clock" />
                            {Math.floor(message.videoTimestamp / 60)}:{(message.videoTimestamp % 60).toString().padStart(2, '0')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {!message.isApproved && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleApproveMessage(message.id, true)}
                        title="Approve this message for display"
                      >
                        Approve
                      </Button>
                    )}
                    {message.isApproved && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleApproveMessage(message.id, false)}
                        title="Reject this message"
                      >
                        Reject
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleToggleVisibility(message.id)}
                      title={message.isHidden ? "Show this message" : "Hide this message"}
                    >
                      {message.isHidden ? (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          Show
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Hide
                        </>
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="danger"
                      onClick={() => handleDeleteMessage(message.id)}
                      title="Permanently delete this message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}

          {filteredMessages.length === 0 && (
            <Card>
              <CardBody>
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
                  <p className="text-gray-600">Try adjusting your search or filters</p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Pagination */}
        {filteredMessages.length > 0 && totalPages > 1 && (
          <Card>
            <CardBody>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredMessages.length)} of {filteredMessages.length} messages
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600 px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
