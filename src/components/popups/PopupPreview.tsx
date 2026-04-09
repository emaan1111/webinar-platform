'use client'

import { X } from 'lucide-react'
import type { PopupField, PopupStyles } from './PopupBuilderCore'

const COUNTRY_CODES = [
  { code: '+1', country: 'US' }, { code: '+44', country: 'UK' }, { code: '+91', country: 'IN' },
  { code: '+61', country: 'AU' }, { code: '+49', country: 'DE' }, { code: '+33', country: 'FR' },
  { code: '+81', country: 'JP' }, { code: '+86', country: 'CN' }, { code: '+55', country: 'BR' },
  { code: '+234', country: 'NG' }, { code: '+27', country: 'ZA' }, { code: '+971', country: 'UAE' },
  { code: '+966', country: 'SA' }, { code: '+92', country: 'PK' }, { code: '+880', country: 'BD' },
  { code: '+62', country: 'ID' }, { code: '+52', country: 'MX' }, { code: '+39', country: 'IT' },
  { code: '+34', country: 'ES' }, { code: '+82', country: 'KR' },
]

interface PopupPreviewProps {
  fields: PopupField[]
  styles: PopupStyles
  name: string
  submitText: string
  useCustomHtml?: boolean
  customHtml?: string
  onClose?: () => void
  inline?: boolean
}

export default function PopupPreview({
  fields, styles, name, submitText, useCustomHtml, customHtml, onClose, inline
}: PopupPreviewProps) {

  if (useCustomHtml && customHtml) {
    return (
      <div
        style={{
          borderRadius: `${styles.borderRadius}px`,
          fontFamily: styles.fontFamily,
          background: styles.popupBg,
          overflow: 'hidden',
          boxShadow: inline ? 'none' : '0 25px 50px -12px rgba(0,0,0,0.25)',
        }}
      >
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-10 p-1 bg-white/80 rounded-full hover:bg-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <div dangerouslySetInnerHTML={{ __html: customHtml }} />
      </div>
    )
  }

  const radius = `${styles.borderRadius}px`

  return (
    <div
      style={{
        borderRadius: radius,
        fontFamily: styles.fontFamily,
        background: styles.popupBg,
        overflow: 'hidden',
        boxShadow: inline ? 'none' : '0 25px 50px -12px rgba(0,0,0,0.25)',
        width: '100%',
        maxWidth: inline ? '100%' : '480px',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: styles.headerBg,
          color: styles.headerTextColor,
          padding: '16px 20px',
          fontSize: `${styles.headerFontSize}px`,
          fontWeight: 700,
          position: 'relative',
        }}
      >
        {name}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
            style={{ color: styles.headerTextColor }}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ background: styles.bodyBg, padding: '20px' }}>
        <div className="flex flex-wrap gap-3">
          {fields.map(field => (
            <div
              key={field.id}
              style={{ width: field.width === 'half' ? 'calc(50% - 6px)' : '100%' }}
            >
              <label
                style={{
                  color: styles.labelColor,
                  fontSize: `${styles.labelFontSize}px`,
                  fontWeight: 500,
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                {field.label}
                {field.required && <span style={{ color: '#ef4444' }}> *</span>}
              </label>

              {field.type === 'phone' ? (
                <div className="flex gap-1">
                  <select
                    style={{
                      background: styles.inputBg,
                      border: `1px solid ${styles.inputBorderColor}`,
                      borderRadius: '6px',
                      padding: '8px 4px',
                      fontSize: `${styles.inputFontSize}px`,
                      color: styles.inputTextColor,
                      width: '90px',
                    }}
                    disabled
                  >
                    {COUNTRY_CODES.map(cc => (
                      <option key={cc.code} value={cc.code}>
                        {cc.code} {cc.country}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder={field.placeholder || 'Phone number'}
                    disabled
                    style={{
                      flex: 1,
                      background: styles.inputBg,
                      border: `1px solid ${styles.inputBorderColor}`,
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: `${styles.inputFontSize}px`,
                      color: styles.inputTextColor,
                    }}
                  />
                </div>
              ) : field.type === 'textarea' ? (
                <textarea
                  placeholder={field.placeholder}
                  rows={3}
                  disabled
                  style={{
                    width: '100%',
                    background: styles.inputBg,
                    border: `1px solid ${styles.inputBorderColor}`,
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: `${styles.inputFontSize}px`,
                    color: styles.inputTextColor,
                    resize: 'vertical',
                  }}
                />
              ) : field.type === 'select' ? (
                <select
                  disabled
                  style={{
                    width: '100%',
                    background: styles.inputBg,
                    border: `1px solid ${styles.inputBorderColor}`,
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: `${styles.inputFontSize}px`,
                    color: styles.inputTextColor,
                  }}
                >
                  <option value="">{field.placeholder || 'Select...'}</option>
                  {field.options.split(',').map((opt, i) => (
                    <option key={i} value={opt.trim()}>{opt.trim()}</option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" disabled className="rounded" />
                  <span style={{ fontSize: `${styles.inputFontSize}px`, color: styles.inputTextColor }}>
                    {field.placeholder || field.label}
                  </span>
                </label>
              ) : field.type === 'date' ? (
                <input
                  type="date"
                  disabled
                  style={{
                    width: '100%',
                    background: styles.inputBg,
                    border: `1px solid ${styles.inputBorderColor}`,
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: `${styles.inputFontSize}px`,
                    color: styles.inputTextColor,
                  }}
                />
              ) : (
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  disabled
                  style={{
                    width: '100%',
                    background: styles.inputBg,
                    border: `1px solid ${styles.inputBorderColor}`,
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: `${styles.inputFontSize}px`,
                    color: styles.inputTextColor,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Submit button */}
        <button
          disabled
          style={{
            width: '100%',
            marginTop: '16px',
            background: styles.buttonBg,
            color: styles.buttonTextColor,
            fontSize: `${styles.buttonFontSize}px`,
            fontWeight: 600,
            padding: '12px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {submitText}
        </button>
      </div>
    </div>
  )
}
