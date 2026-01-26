'use client'

import React, { useState } from 'react'
import { Calendar, X, ChevronDown } from 'lucide-react'

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onClear: () => void
  label?: string
  placeholder?: string
}

type PresetKey = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom'

interface DatePreset {
  label: string
  getValue: () => { start: string; end: string }
}

const getDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const datePresets: Record<PresetKey, DatePreset> = {
  today: {
    label: 'Today',
    getValue: () => {
      const today = new Date()
      return { start: getDateString(today), end: getDateString(today) }
    }
  },
  yesterday: {
    label: 'Yesterday',
    getValue: () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return { start: getDateString(yesterday), end: getDateString(yesterday) }
    }
  },
  last7days: {
    label: 'Last 7 Days',
    getValue: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 6)
      return { start: getDateString(start), end: getDateString(end) }
    }
  },
  last30days: {
    label: 'Last 30 Days',
    getValue: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 29)
      return { start: getDateString(start), end: getDateString(end) }
    }
  },
  custom: {
    label: 'Custom Range',
    getValue: () => ({ start: '', end: '' })
  }
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
  label,
  placeholder = 'Select date range'
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>('custom')
  const hasValue = startDate || endDate

  const handlePresetClick = (presetKey: PresetKey) => {
    setSelectedPreset(presetKey)
    if (presetKey === 'custom') {
      setIsOpen(false)
      return
    }
    
    const { start, end } = datePresets[presetKey].getValue()
    onStartDateChange(start)
    onEndDateChange(end)
    setIsOpen(false)
  }

  const handleCustomDateChange = () => {
    setSelectedPreset('custom')
  }

  const getDisplayText = () => {
    if (!hasValue) return placeholder
    
    // Check if current dates match a preset
    for (const [key, preset] of Object.entries(datePresets)) {
      if (key === 'custom') continue
      const { start, end } = preset.getValue()
      if (start === startDate && end === endDate) {
        return preset.label
      }
    }
    
    // Custom range display
    if (startDate && endDate) {
      return `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    } else if (startDate) {
      return `From ${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    } else if (endDate) {
      return `Until ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    return placeholder
  }

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className={`text-sm truncate ${hasValue ? 'text-gray-900' : 'text-gray-500'}`}>
            {getDisplayText()}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {hasValue && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClear()
                setSelectedPreset('custom')
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              title="Clear dates"
              aria-label="Clear dates"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              {/* Presets */}
              <div className="p-2 border-b border-gray-200">
                <div className="text-xs font-medium text-gray-500 px-2 py-1">Quick Select</div>
                {(Object.keys(datePresets) as PresetKey[])
                  .filter(key => key !== 'custom')
                  .map((key) => (
                    <button
                      key={key}
                      onClick={() => handlePresetClick(key)}
                      className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-blue-50 transition-colors ${
                        selectedPreset === key ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {datePresets[key].label}
                    </button>
                  ))
                }
              </div>

              {/* Custom Range */}
              <div className="p-3">
                <div className="text-xs font-medium text-gray-500 mb-2">Custom Range</div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        onStartDateChange(e.target.value)
                        handleCustomDateChange()
                      }}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        onEndDateChange(e.target.value)
                        handleCustomDateChange()
                      }}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
