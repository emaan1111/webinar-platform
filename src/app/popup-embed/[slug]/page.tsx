'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

const COUNTRY_CODES = [
  { code: '+1', country: 'US' }, { code: '+44', country: 'UK' }, { code: '+91', country: 'IN' },
  { code: '+61', country: 'AU' }, { code: '+49', country: 'DE' }, { code: '+33', country: 'FR' },
  { code: '+81', country: 'JP' }, { code: '+86', country: 'CN' }, { code: '+55', country: 'BR' },
  { code: '+234', country: 'NG' }, { code: '+27', country: 'ZA' }, { code: '+971', country: 'UAE' },
  { code: '+966', country: 'SA' }, { code: '+92', country: 'PK' }, { code: '+880', country: 'BD' },
  { code: '+62', country: 'ID' }, { code: '+52', country: 'MX' }, { code: '+39', country: 'IT' },
  { code: '+34', country: 'ES' }, { code: '+82', country: 'KR' },
]

const ALL_TIMEZONES: string[] =
  typeof Intl !== 'undefined' && typeof (Intl as any).supportedValuesOf === 'function'
    ? (Intl as any).supportedValuesOf('timeZone')
    : ['America/New_York', 'Europe/London', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Australia/Sydney']

function detectTz(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York' } catch { return 'America/New_York' }
}

interface ScheduleOption { id: string; label: string; isJIT: boolean }

interface PopupConfig {
  id: string
  slug: string
  name: string
  fields: Array<{
    id: string
    type: string
    label: string
    placeholder: string
    required: boolean
    options: string
    width: 'full' | 'half'
    content?: string
    align?: 'left' | 'center' | 'right'
  }>
  styles: {
    popupBg: string
    headerBg: string
    headerTextColor: string
    bodyBg: string
    labelColor: string
    inputBg: string
    inputBorderColor: string
    inputTextColor: string
    buttonBg: string
    buttonTextColor: string
    buttonHoverBg: string
    fontFamily: string
    headerFontSize: string
    labelFontSize: string
    inputFontSize: string
    buttonFontSize: string
    borderRadius: string
  }
  submitText: string
  successMessage: string
  redirectUrl: string | null
  useCustomHtml: boolean
  customHtml: string | null
  externalWebinarId?: string | null
}

export default function PopupEmbedPage() {
  const params = useParams()
  const slug = params.slug as string
  const [config, setConfig] = useState<PopupConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState<Record<string, any>>({})
  // Webinar registration popup state (when config.externalWebinarId is set)
  const [schedules, setSchedules] = useState<ScheduleOption[]>([])
  const [userTimezone, setUserTimezone] = useState<string>(detectTz())
  const [selectedSchedule, setSelectedSchedule] = useState('')
  const [webinarThankYouUrl, setWebinarThankYouUrl] = useState<string | null>(null)

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch(`/api/popups/embed/${slug}`)
        if (!res.ok) throw new Error('Popup not found')
        const data = await res.json()
        setConfig(data)
        // Initialize form data
        const initial: Record<string, any> = {}
        data.fields?.forEach((f: any) => {
          if (['image', 'heading', 'paragraph'].includes(f.type)) return // content elements, not inputs
          initial[f.id] = f.type === 'checkbox' ? false : ''
          if (f.type === 'phone') {
            initial[f.id + '_code'] = '+1'
          }
        })
        setFormData(initial)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [slug])

  // For webinar popups: fetch this webinar's times in the visitor's timezone (re-fetch on tz change).
  useEffect(() => {
    const ext = config?.externalWebinarId
    if (!ext) return
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch(`/api/external-webinars/${ext}/schedules?timezone=${encodeURIComponent(userTimezone)}`)
        if (!r.ok) return
        const d = await r.json()
        if (cancelled) return
        setSchedules(d.schedules || [])
        setWebinarThankYouUrl(d.thankYouUrl || null)
        if ((d.schedules || []).length === 1) setSelectedSchedule(d.schedules[0].id)
      } catch {}
    })()
    return () => { cancelled = true }
  }, [config?.externalWebinarId, userTimezone])

  const doRedirect = (url: string) => {
    if (typeof window === 'undefined') return
    if (window.parent !== window) window.parent.postMessage({ type: 'popupRedirect', url }, '*')
    try { if (window.top) window.top.location.href = url; else window.location.href = url } catch { window.location.href = url }
  }

  const handleClose = () => {
    if (window.parent !== window) {
      window.parent.postMessage('closePopupModal', '*')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!config) return
    setFormError('')
    setSubmitting(true)

    // ─── Webinar registration popup ───
    if (config.externalWebinarId) {
      try {
        const emailField = config.fields.find(f => f.type === 'email')
        const phoneField = config.fields.find(f => f.type === 'phone')
        const nameField = config.fields.find(f => f.type === 'text') ||
          config.fields.find(f => /name/i.test(f.id) || /name/i.test(f.label))
        const name = (nameField ? formData[nameField.id] : '') || ''
        const email = (emailField ? formData[emailField.id] : '') || ''
        const phone = phoneField ? (formData[phoneField.id] || '') : ''
        const phoneCode = phoneField ? (formData[phoneField.id + '_code'] || '+1') : undefined
        const scheduleToUse = selectedSchedule || schedules[0]?.id

        if (!name || !email) { setFormError('Name and email are required'); setSubmitting(false); return }
        if (!scheduleToUse) { setFormError('Please select a time'); setSubmitting(false); return }

        const res = await fetch(`/api/external-webinars/${config.externalWebinarId}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name, email,
            phone: phone || undefined,
            phoneCountryCode: phone ? phoneCode : undefined,
            scheduleId: scheduleToUse,
            timezone: userTimezone,
          }),
        })
        const result = await res.json()
        if (!res.ok) { setFormError(result.error || 'Registration failed'); setSubmitting(false); return }

        const regId = result.registration?.id
        const sel = schedules.find(s => s.id === scheduleToUse)
        if (sel?.isJIT && regId) {
          doRedirect(`${window.location.origin}/countdown-external/${config.externalWebinarId}?reg=${encodeURIComponent(regId)}`)
          return
        }
        if (webinarThankYouUrl) {
          let target = webinarThankYouUrl
          try {
            const u = new URL(webinarThankYouUrl)
            if (regId) u.searchParams.set('reg', regId)
            if (sel?.label) u.searchParams.set('t', sel.label)
            if (name) u.searchParams.set('name', name)
            target = u.toString()
          } catch {}
          doRedirect(target)
          return
        }
        setSuccess(true)
        setSubmitting(false)
        return
      } catch {
        setFormError('Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }
    }

    // Merge phone codes with phone numbers
    const submitData: Record<string, any> = {}
    config.fields.forEach(field => {
      if (['image', 'heading', 'paragraph'].includes(field.type)) return // content elements, not data
      if (field.type === 'phone') {
        submitData[field.id] = (formData[field.id + '_code'] || '+1') + ' ' + (formData[field.id] || '')
      } else {
        submitData[field.id] = formData[field.id]
      }
    })

    try {
      const res = await fetch('/api/popups/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          popupSlug: slug,
          data: submitData,
          pageUrl: document.referrer || window.location.href
        })
      })
      const result = await res.json()
      if (result.success) {
        if (result.redirectUrl) {
          // Redirect parent window
          if (window.parent !== window) {
            window.parent.postMessage({ type: 'popupRedirect', url: result.redirectUrl }, '*')
          }
          window.location.href = result.redirectUrl
          return
        }
        setSuccess(true)
      } else {
        setFormError(result.error || 'Submission failed')
      }
    } catch {
      setFormError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const updateField = (id: string, value: any) => {
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-3 text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md text-center">
          <p className="text-red-600 font-semibold">Form not found</p>
          <p className="text-gray-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  const s = config.styles || {} as PopupConfig['styles']
  const radius = s.borderRadius || '12'

  // Custom HTML mode
  if (config.useCustomHtml && config.customHtml) {
    return (
      <>
        <style jsx global>{`
          body { margin: 0; padding: 0; background: transparent !important; }
        `}</style>
        <form onSubmit={handleSubmit}>
          <div dangerouslySetInnerHTML={{ __html: config.customHtml }} />
        </form>
      </>
    )
  }

  // Success state
  if (success) {
    return (
      <>
        <style jsx global>{`
          body { margin: 0; padding: 0; background: transparent !important; }
        `}</style>
        <div 
          className="rounded-2xl overflow-hidden shadow-2xl"
          style={{ 
            background: s.popupBg || '#fff', 
            fontFamily: s.fontFamily || 'Inter, system-ui, sans-serif',
            borderRadius: `${radius}px`
          }}
        >
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-600">{config.successMessage}</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style jsx global>{`
        body { margin: 0; padding: 0; background: transparent !important; }
      `}</style>
      <div 
        className="rounded-2xl overflow-hidden shadow-2xl"
        style={{ 
          background: s.popupBg || '#fff', 
          fontFamily: s.fontFamily || 'Inter, system-ui, sans-serif',
          borderRadius: `${radius}px`
        }}
      >
        {/* Header */}
        <div 
          className="relative px-6 py-4"
          style={{ background: s.headerBg || '#4f46e5' }}
        >
          {/* Decorative circles */}
          <div className="absolute top-[-40px] right-[-40px] w-40 h-40 bg-white opacity-10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-40px] left-[-40px] w-32 h-32 bg-blue-400 opacity-20 rounded-full blur-2xl" />
          
          <h3 
            className="font-bold relative z-10"
            style={{ 
              color: s.headerTextColor || '#fff', 
              fontSize: `${s.headerFontSize || 20}px` 
            }}
          >
            {config.name}
          </h3>
          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors z-10"
            style={{ color: s.headerTextColor || '#fff' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6" style={{ background: s.bodyBg || '#fff' }}>
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {formError}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {config.fields.map(field => {
              const w = field.width === 'half' ? 'calc(50% - 6px)' : '100%'
              const ta = (field.align || 'left') as 'left' | 'center' | 'right'

              if (field.type === 'webinarTimes') {
                const inputStyle = {
                  width: '100%', padding: '10px 14px', borderRadius: '10px',
                  background: s.inputBg || '#fff', border: `1px solid ${s.inputBorderColor || '#d1d5db'}`,
                  color: s.inputTextColor || '#111827', fontSize: `${s.inputFontSize || 14}px`,
                } as React.CSSProperties
                const lblStyle = { color: s.labelColor || '#374151', fontSize: `${s.labelFontSize || 14}px` }
                return (
                  <div key={field.id} style={{ width: '100%' }} className="space-y-3">
                    <div>
                      <label className="block mb-1 font-medium" style={lblStyle}>Your Timezone</label>
                      <select value={userTimezone} onChange={e => setUserTimezone(e.target.value)} style={inputStyle}>
                        {!ALL_TIMEZONES.includes(userTimezone) && <option value={userTimezone}>{userTimezone.replace(/_/g, ' ')}</option>}
                        {ALL_TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 font-medium" style={lblStyle}>
                        {field.label || 'Select a Time'} <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select value={selectedSchedule} onChange={e => setSelectedSchedule(e.target.value)} required style={inputStyle}>
                        <option value="">{schedules.length ? 'Choose a time…' : 'Loading times…'}</option>
                        {schedules.map(sc => <option key={sc.id} value={sc.id}>{sc.label}</option>)}
                      </select>
                    </div>
                  </div>
                )
              }
              if (field.type === 'image') {
                return field.content ? (
                  <div key={field.id} style={{ width: w, textAlign: ta }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={field.content} alt="" style={{ maxWidth: '100%', borderRadius: '8px', display: 'inline-block' }} />
                  </div>
                ) : null
              }
              if (field.type === 'heading') {
                return (
                  <div key={field.id} style={{ width: w }}>
                    <div style={{ textAlign: ta, color: s.labelColor || '#111827', fontWeight: 700, fontSize: `${Math.max(16, Number(s.headerFontSize || 20) - 2)}px` }}>
                      {field.content}
                    </div>
                  </div>
                )
              }
              if (field.type === 'paragraph') {
                return (
                  <div key={field.id} style={{ width: w }}>
                    <div style={{ textAlign: ta, color: s.labelColor || '#374151', fontSize: `${s.labelFontSize || 14}px`, whiteSpace: 'pre-wrap', opacity: 0.9 }}>
                      {field.content}
                    </div>
                  </div>
                )
              }

              return (
              <div
                key={field.id}
                style={{ width: w }}
              >
                {field.type !== 'checkbox' && (
                  <label
                    className="block mb-1 font-medium"
                    style={{
                      color: s.labelColor || '#374151',
                      fontSize: `${s.labelFontSize || 14}px`
                    }}
                  >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                )}

                {field.type === 'phone' ? (
                  <div className="flex gap-2">
                    <select
                      value={formData[field.id + '_code'] || '+1'}
                      onChange={e => updateField(field.id + '_code', e.target.value)}
                      className="rounded-lg transition-all focus:ring-2 focus:ring-indigo-200"
                      style={{
                        width: '95px',
                        padding: '10px 8px',
                        background: s.inputBg || '#fff',
                        border: `1px solid ${s.inputBorderColor || '#d1d5db'}`,
                        color: s.inputTextColor || '#111827',
                        fontSize: `${s.inputFontSize || 14}px`,
                      }}
                    >
                      {COUNTRY_CODES.map(cc => (
                        <option key={cc.code} value={cc.code}>{cc.code} {cc.country}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      placeholder={field.placeholder || 'Phone number'}
                      value={formData[field.id] || ''}
                      onChange={e => updateField(field.id, e.target.value)}
                      required={field.required}
                      className="flex-1 rounded-lg transition-all focus:ring-2 focus:ring-indigo-200"
                      style={{
                        padding: '10px 14px',
                        background: s.inputBg || '#fff',
                        border: `1px solid ${s.inputBorderColor || '#d1d5db'}`,
                        color: s.inputTextColor || '#111827',
                        fontSize: `${s.inputFontSize || 14}px`,
                      }}
                    />
                  </div>
                ) : field.type === 'textarea' ? (
                  <textarea
                    placeholder={field.placeholder}
                    value={formData[field.id] || ''}
                    onChange={e => updateField(field.id, e.target.value)}
                    required={field.required}
                    rows={3}
                    className="w-full rounded-lg transition-all focus:ring-2 focus:ring-indigo-200 resize-y"
                    style={{
                      padding: '10px 14px',
                      background: s.inputBg || '#fff',
                      border: `1px solid ${s.inputBorderColor || '#d1d5db'}`,
                      color: s.inputTextColor || '#111827',
                      fontSize: `${s.inputFontSize || 14}px`,
                    }}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={formData[field.id] || ''}
                    onChange={e => updateField(field.id, e.target.value)}
                    required={field.required}
                    className="w-full rounded-lg transition-all focus:ring-2 focus:ring-indigo-200"
                    style={{
                      padding: '10px 14px',
                      background: s.inputBg || '#fff',
                      border: `1px solid ${s.inputBorderColor || '#d1d5db'}`,
                      color: s.inputTextColor || '#111827',
                      fontSize: `${s.inputFontSize || 14}px`,
                    }}
                  >
                    <option value="">{field.placeholder || 'Select...'}</option>
                    {field.options?.split(',').map((opt, i) => (
                      <option key={i} value={opt.trim()}>{opt.trim()}</option>
                    ))}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData[field.id] || false}
                      onChange={e => updateField(field.id, e.target.checked)}
                      className="w-5 h-5 rounded text-indigo-600"
                    />
                    <span style={{ 
                      color: s.inputTextColor || '#111827', 
                      fontSize: `${s.inputFontSize || 14}px` 
                    }}>
                      {field.placeholder || field.label}
                    </span>
                  </label>
                ) : field.type === 'date' ? (
                  <input
                    type="date"
                    value={formData[field.id] || ''}
                    onChange={e => updateField(field.id, e.target.value)}
                    required={field.required}
                    className="w-full rounded-lg transition-all focus:ring-2 focus:ring-indigo-200"
                    style={{
                      padding: '10px 14px',
                      background: s.inputBg || '#fff',
                      border: `1px solid ${s.inputBorderColor || '#d1d5db'}`,
                      color: s.inputTextColor || '#111827',
                      fontSize: `${s.inputFontSize || 14}px`,
                    }}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    placeholder={field.placeholder}
                    value={formData[field.id] || ''}
                    onChange={e => updateField(field.id, e.target.value)}
                    required={field.required}
                    className="w-full rounded-lg transition-all focus:ring-2 focus:ring-indigo-200"
                    style={{
                      padding: '10px 14px',
                      background: s.inputBg || '#fff',
                      border: `1px solid ${s.inputBorderColor || '#d1d5db'}`,
                      color: s.inputTextColor || '#111827',
                      fontSize: `${s.inputFontSize || 14}px`,
                    }}
                  />
                )}
              </div>
              )
            })}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-5 font-semibold transition-all hover:translate-y-[-2px] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            style={{
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              background: s.buttonBg || '#4f46e5',
              color: s.buttonTextColor || '#fff',
              fontSize: `${s.buttonFontSize || 16}px`,
              boxShadow: `0 4px 14px ${s.buttonBg || '#4f46e5'}66`,
            }}
          >
            {submitting ? 'Submitting...' : config.submitText}
          </button>
        </form>
      </div>
    </>
  )
}
