'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { History, Loader2, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react'
import { labelForField } from '@/lib/webinarSettingsFields'

/**
 * Settings version history, shared by the internal and external webinar
 * settings screens. Both kinds of webinar record the same snapshot format, so
 * the only thing that differs here is which API path to call.
 */

export type SettingsVersionScope = 'internal' | 'external'

export interface SettingsVersion {
  id: string
  comment: string | null
  source: string
  changedFields: string[]
  settings: Record<string, unknown>
  createdByEmail: string | null
  createdAt: string
}

function apiBase(scope: SettingsVersionScope, webinarId: string) {
  return scope === 'internal'
    ? `/api/webinars/${webinarId}/settings-versions`
    : `/api/external-webinars/${webinarId}/settings-versions`
}

/**
 * Render a settings value the way a host would recognise it. Long text and
 * structured values (the schedule list, linked Zoom sessions) are summarised
 * rather than dumped — the point is "what moved", not a data view.
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '(empty)'
  if (typeof value === 'boolean') return value ? 'on' : 'off'
  if (Array.isArray(value)) {
    if (value.length === 0) return 'none'
    if (value.every((v) => typeof v === 'string' || typeof v === 'number')) {
      return value.join(', ')
    }
    return `${value.length} item${value.length === 1 ? '' : 's'}`
  }
  if (typeof value === 'object') return 'updated'
  const text = String(value)
  return text.length > 80 ? `${text.slice(0, 80)}…` : text
}

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Saved',
  restore: 'Restored',
  checkpoint: 'Checkpoint',
}

const SOURCE_STYLES: Record<string, string> = {
  manual: 'bg-blue-50 text-blue-700 border-blue-200',
  restore: 'bg-amber-50 text-amber-700 border-amber-200',
  checkpoint: 'bg-gray-100 text-gray-600 border-gray-200',
}

/**
 * The comment box that sits next to a Save button. Keeping it beside Save (and
 * not in a modal) is what makes hosts actually write the note — it is the same
 * gesture as saving.
 */
export function SettingsVersionComment({
  value,
  onChange,
  disabled,
  className = '',
  compact = false,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  /** Input only, no label or helper text — for a toolbar row next to Save. */
  compact?: boolean
}) {
  if (compact) {
    return (
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        maxLength={280}
        aria-label="What are you changing? Saved with this change in the settings history."
        title="Optional note saved with this change in the settings history"
        placeholder="What changed? (optional note)"
        className={`w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 ${className}`}
      />
    )
  }

  return (
    <div className={className}>
      <label htmlFor="versionComment" className="block text-sm font-medium text-gray-700 mb-1">
        What are you changing? <span className="font-normal text-gray-400">(optional)</span>
      </label>
      <input
        id="versionComment"
        name="versionComment"
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        maxLength={280}
        placeholder="e.g. Moved just-in-time lead time to 20 min for the Ramadan push"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <p className="mt-1 text-xs text-gray-500">
        Saved with this change so the history explains itself later.
      </p>
    </div>
  )
}

export function SettingsVersionHistory({
  scope,
  webinarId,
  reloadToken,
  onRestored,
}: {
  scope: SettingsVersionScope
  webinarId: string
  /** Change this (e.g. after a save) to refetch the history. */
  reloadToken?: unknown
  onRestored?: () => void
}) {
  const [versions, setVersions] = useState<SettingsVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchVersions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(apiBase(scope, webinarId))
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load settings history')
      setVersions(Array.isArray(data.versions) ? data.versions : [])
      setNotice(data?.unavailable ? data.message || '' : '')
    } catch (err: any) {
      setError(err.message || 'Failed to load settings history')
    } finally {
      setLoading(false)
    }
  }, [scope, webinarId])

  useEffect(() => {
    fetchVersions()
  }, [fetchVersions, reloadToken])

  const handleRestore = async (version: SettingsVersion) => {
    const when = new Date(version.createdAt).toLocaleString()
    if (
      !confirm(
        `Restore the settings saved ${when}?\n\nCurrent settings are saved to the history first, so you can undo this.`
      )
    ) {
      return
    }

    setRestoringId(version.id)
    setError('')
    try {
      const res = await fetch(apiBase(scope, webinarId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: version.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to restore version')
      await fetchVersions()
      onRestored?.()
    } catch (err: any) {
      setError(err.message || 'Failed to restore version')
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <div className="space-y-3">
      {notice && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading history...
        </div>
      ) : versions.length === 0 ? (
        <p className="text-sm text-gray-500">
          No settings changes recorded yet. The next save you make will show up here.
        </p>
      ) : (
        <div className="space-y-2">
          {versions.map((version, index) => {
            // The list is newest-first, so the entry below is the state this one
            // changed from. The oldest row has nothing to compare against.
            const previous = versions[index + 1]
            const isExpanded = expandedId === version.id
            const isCurrent = index === 0

            return (
              <div
                key={version.id}
                className={`rounded-lg border p-3 ${isCurrent ? 'border-blue-200 bg-blue-50/40' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[11px] font-medium ${
                          SOURCE_STYLES[version.source] || SOURCE_STYLES.checkpoint
                        }`}
                      >
                        {SOURCE_LABELS[version.source] || version.source}
                      </span>
                      {isCurrent && (
                        <span className="rounded border border-green-200 bg-green-50 px-1.5 py-0.5 text-[11px] font-medium text-green-700">
                          Current
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(version.createdAt).toLocaleString()}
                      </span>
                      {version.createdByEmail && (
                        <span className="text-xs text-gray-500">• {version.createdByEmail}</span>
                      )}
                    </div>

                    <p
                      className={`mt-1 text-sm ${version.comment ? 'text-gray-900' : 'italic text-gray-400'}`}
                    >
                      {version.comment || 'No comment'}
                    </p>

                    {version.changedFields.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : version.id)}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                        {version.changedFields.length} setting
                        {version.changedFields.length === 1 ? '' : 's'} changed
                      </button>
                    )}

                    {isExpanded && (
                      <ul className="mt-2 space-y-1 border-l-2 border-gray-200 pl-3">
                        {version.changedFields.map((field) => (
                          <li key={field} className="text-xs text-gray-600">
                            <span className="font-medium text-gray-800">{labelForField(field)}</span>
                            {previous ? (
                              <>
                                : <span className="text-gray-500 line-through">
                                  {formatValue(previous.settings?.[field])}
                                </span>{' '}
                                → <span className="text-gray-900">{formatValue(version.settings?.[field])}</span>
                              </>
                            ) : (
                              <>: {formatValue(version.settings?.[field])}</>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleRestore(version)}
                      disabled={restoringId !== null}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {restoringId === version.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      {restoringId === version.id ? 'Restoring...' : 'Restore'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** History wrapped in a collapsed section header, for pages that are long already. */
export function SettingsVersionHistoryPanel(props: {
  scope: SettingsVersionScope
  webinarId: string
  reloadToken?: unknown
  onRestored?: () => void
  defaultOpen?: boolean
}) {
  const { defaultOpen = false, ...historyProps } = props
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
          <History className="h-4 w-4 text-gray-500" />
          Settings history
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="mt-3">
          <SettingsVersionHistory {...historyProps} />
        </div>
      )}
    </div>
  )
}
