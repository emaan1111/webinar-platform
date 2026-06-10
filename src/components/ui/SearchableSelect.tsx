'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'

export interface SearchableSelectOption {
  value: string
  label: string
  /** Optional secondary text shown muted next to the label (e.g. a slug). */
  sublabel?: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
}

/**
 * Single-select dropdown with a built-in search box. Options are always
 * presented alphabetically by label and can be filtered by typing.
 */
export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search by name...',
  emptyMessage = 'No matches found',
  className = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Always sort alphabetically by label (case-insensitive).
  const sorted = useMemo(
    () =>
      [...options].sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
      ),
    [options]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel ? o.sublabel.toLowerCase().includes(q) : false)
    )
  }, [sorted, query])

  const selectedOption = options.find((o) => o.value === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setHighlight(0)
      // Focus the search box once the dropdown is rendered.
      const t = setTimeout(() => inputRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  const selectOption = (val: string) => {
    onChange(val)
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const opt = filtered[highlight]
      if (opt) selectOption(opt.value)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="w-full px-3 py-2 text-left bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <div className="flex items-center justify-between gap-2">
          <span className={`flex-1 min-w-0 truncate ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
            {selectedOption ? selectedOption.label : placeholder}
            {selectedOption?.sublabel && (
              <span className="text-gray-400"> {selectedOption.sublabel}</span>
            )}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setHighlight(0)
                }}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">{emptyMessage}</div>
            ) : (
              filtered.map((opt, idx) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => selectOption(opt.value)}
                  onMouseEnter={() => setHighlight(idx)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    idx === highlight ? 'bg-purple-50' : 'hover:bg-gray-50'
                  } ${opt.value === value ? 'font-medium text-purple-700' : 'text-gray-700'}`}
                >
                  <span className="flex-1 min-w-0 truncate">
                    {opt.label}
                    {opt.sublabel && <span className="text-gray-400"> {opt.sublabel}</span>}
                  </span>
                  {opt.value === value && (
                    <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
