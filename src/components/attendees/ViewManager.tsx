'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { X, Save, Plus, Eye, Edit2, Trash2 } from 'lucide-react'

export interface ColumnConfig {
  key: string
  label: string
  enabled: boolean
  category: 'basic' | 'location' | 'engagement' | 'device' | 'replay' | 'consents' | 'sales'
}

export interface CustomView {
  id: string
  name: string
  columns: ColumnConfig[]
  isDefault?: boolean
}

interface ViewManagerProps {
  views: CustomView[]
  activeView: CustomView
  onViewChange: (view: CustomView) => void
  onSaveView: (view: CustomView) => void
  onDeleteView: (viewId: string) => void
  onCreateView: () => void
}

export const defaultColumns: ColumnConfig[] = [
  // Basic Info
  { key: 'name', label: 'Name', enabled: true, category: 'basic' },
  { key: 'email', label: 'Email', enabled: true, category: 'basic' },
  { key: 'phone', label: 'Phone', enabled: false, category: 'basic' },
  { key: 'webinarTitle', label: 'Webinar', enabled: true, category: 'basic' },
  { key: 'registeredAt', label: 'Registered', enabled: true, category: 'basic' },
  { key: 'scheduledAt', label: 'Scheduled At', enabled: false, category: 'basic' },
  { key: 'webinarStatus', label: 'Webinar Status', enabled: true, category: 'basic' },
  { key: 'attended', label: 'Attended', enabled: true, category: 'basic' },
  
  // Location
  { key: 'country', label: 'Country', enabled: true, category: 'location' },
  { key: 'timezone', label: 'Timezone', enabled: false, category: 'location' },
  
  // Engagement
  { key: 'engagementScore', label: 'Engagement Score', enabled: false, category: 'engagement' },
  { key: 'totalWatchTime', label: 'Total Watch Time', enabled: false, category: 'engagement' },
  { key: 'lastWatchedPosition', label: 'Last Watched Position', enabled: false, category: 'engagement' },
  { key: 'totalEngagements', label: 'Total Engagements', enabled: false, category: 'engagement' },
  { key: 'sessionCount', label: 'Session Count', enabled: false, category: 'engagement' },
  { key: 'joinedAt', label: 'Joined At', enabled: false, category: 'engagement' },
  { key: 'leftAt', label: 'Left At', enabled: false, category: 'engagement' },
  { key: 'viewedOffer', label: 'Saw Offer', enabled: false, category: 'engagement' },
  { key: 'clickedOffer', label: 'Clicked Offer', enabled: false, category: 'engagement' },
  { key: 'watchedMostlyMuted', label: 'Watched Muted/Unmuted', enabled: false, category: 'engagement' },
  { key: 'totalMutedTime', label: 'Muted Duration', enabled: false, category: 'engagement' },
  { key: 'totalUnmutedTime', label: 'Unmuted Duration', enabled: false, category: 'engagement' },
  
  // Device Info
  { key: 'registrationDevice', label: 'Registration Device', enabled: false, category: 'device' },
  { key: 'lastSessionDevice', label: 'Last Session Device', enabled: false, category: 'device' },
  { key: 'lastSessionBrowser', label: 'Browser', enabled: false, category: 'device' },
  { key: 'lastSessionOS', label: 'Operating System', enabled: false, category: 'device' },
  
  // Replay Analytics
  { key: 'watchedReplay', label: 'Watched Replay', enabled: false, category: 'replay' },
  { key: 'replayWatchTime', label: 'Replay Watch Time', enabled: false, category: 'replay' },
  { key: 'replayDevice', label: 'Replay Device', enabled: false, category: 'replay' },
  { key: 'replayClickedCTA', label: 'Clicked CTA in Replay', enabled: false, category: 'replay' },
  
  // Consents
  { key: 'gdprConsent', label: 'GDPR Consent', enabled: false, category: 'consents' },
  { key: 'privacyConsent', label: 'Privacy Consent', enabled: false, category: 'consents' },
  { key: 'marketingConsent', label: 'Marketing Consent', enabled: false, category: 'consents' },
  
  // Sales
  { key: 'hasPurchased', label: 'Purchased', enabled: true, category: 'sales' },
  { key: 'purchaseCount', label: 'Purchase Count', enabled: false, category: 'sales' },
  { key: 'lastPurchaseAt', label: 'Last Purchase', enabled: false, category: 'sales' },
  { key: 'lastPurchaseAmount', label: 'Last Purchase Amount', enabled: false, category: 'sales' },
  { key: 'totalPurchaseAmount', label: 'Total Purchase Amount', enabled: false, category: 'sales' }
]

export default function ViewManager({
  views,
  activeView,
  onViewChange,
  onSaveView,
  onDeleteView,
  onCreateView
}: ViewManagerProps) {
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [editingView, setEditingView] = useState<CustomView | null>(null)
  const [showViewDropdown, setShowViewDropdown] = useState(false)

  const handleToggleColumn = (columnKey: string) => {
    if (!editingView) return
    
    const updatedColumns = editingView.columns.map(col =>
      col.key === columnKey ? { ...col, enabled: !col.enabled } : col
    )
    
    setEditingView({ ...editingView, columns: updatedColumns })
  }

  const handleSaveView = () => {
    if (editingView) {
      onSaveView(editingView)
      setEditingView(null)
      setShowColumnSelector(false)
    }
  }

  const handleEditView = (view: CustomView) => {
    setEditingView(JSON.parse(JSON.stringify(view))) // Deep clone
    setShowColumnSelector(true)
    setShowViewDropdown(false)
  }

  const categories = [
    { key: 'basic', label: 'Basic Information' },
    { key: 'location', label: 'Location' },
    { key: 'engagement', label: 'Engagement & Watch Time' },
    { key: 'device', label: 'Device Information' },
    { key: 'replay', label: 'Replay Analytics' },
    { key: 'consents', label: 'Consents' },
    { key: 'sales', label: 'Sales & Purchases' }
  ]

  return (
    <div className="flex items-center gap-2">
      {/* View Selector */}
      <div className="relative">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowViewDropdown(!showViewDropdown)}
        >
          <Eye className="w-4 h-4 mr-2" />
          {activeView.name}
        </Button>

        {showViewDropdown && (
          <div className="absolute z-10 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-2 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-600 uppercase px-2">Saved Views</p>
            </div>
            <div className="py-1 max-h-96 overflow-y-auto">
              {views.map(view => (
                <div
                  key={view.id}
                  className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 group"
                >
                  <button
                    onClick={() => {
                      onViewChange(view)
                      setShowViewDropdown(false)
                    }}
                    className="flex-1 text-left text-sm text-gray-700 hover:text-gray-900"
                  >
                    {view.name}
                    {view.isDefault && (
                      <span className="ml-2 text-xs text-blue-600">(Default)</span>
                    )}
                  </button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditView(view)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Edit view"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {!view.isDefault && (
                      <button
                        onClick={() => {
                          onDeleteView(view.id)
                          setShowViewDropdown(false)
                        }}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete view"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-gray-200">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onCreateView()
                  setShowViewDropdown(false)
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New View
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Columns Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setEditingView(JSON.parse(JSON.stringify(activeView)))
          setShowColumnSelector(true)
        }}
      >
        <Edit2 className="w-4 h-4 mr-2" />
        Edit Columns
      </Button>

      {/* Column Selector Modal */}
      {showColumnSelector && editingView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Customize View</h2>
                <p className="text-sm text-gray-500 mt-1">Select which columns to display</p>
              </div>
              <button
                onClick={() => {
                  setShowColumnSelector(false)
                  setEditingView(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* View Name */}
            <div className="p-6 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View Name
              </label>
              <input
                type="text"
                value={editingView.name}
                onChange={(e) => setEditingView({ ...editingView, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="My Custom View"
              />
            </div>

            {/* Columns by Category */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {categories.map(category => {
                  const categoryColumns = editingView.columns.filter(col => col.category === category.key)
                  
                  return (
                    <div key={category.key}>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        {category.label}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {categoryColumns.map(column => (
                          <label
                            key={column.key}
                            className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={column.enabled}
                              onChange={() => handleToggleColumn(column.key)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{column.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-500">
                {editingView.columns.filter(c => c.enabled).length} columns selected
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowColumnSelector(false)
                    setEditingView(null)
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveView}>
                  <Save className="w-4 h-4 mr-2" />
                  Save View
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
