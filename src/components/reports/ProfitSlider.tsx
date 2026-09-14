'use client'

import React, { useState } from 'react'
import { SliderScale } from '@/lib/reports/profitModel'

export type SliderSource = 'report' | 'assumption'

interface ProfitSliderProps {
  id: string
  label: string
  value: number
  scale: SliderScale
  onChange: (value: number) => void
  /** Digits shown in the number box; the stored value keeps full precision. */
  decimals?: number
  prefix?: string
  suffix?: string
  /** Where the starting value came from, shown as a small badge. */
  source?: SliderSource
  /** The other scenario's value, when the two differ. */
  compareValue?: number
  compareLabel?: string
  /** Paints the track amber for the "what if" scenario. */
  tone?: 'primary' | 'alt'
  /** Turns the number red - used when a rate goes over 100%. */
  invalid?: boolean
  disabled?: boolean
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

const trim = (n: number, decimals: number) => {
  const rounded = Number(n.toFixed(decimals))
  return Number.isFinite(rounded) ? rounded : 0
}

/**
 * One dial on the Profit Planner: a label, a typable number, and a range
 * input that fills as it travels.
 *
 * The number box keeps its own draft string while it has focus so that typing
 * "0.0" or clearing the field to start over is not fought by a re-render
 * rewriting the value under the caret. Everything else reads the scenario.
 */
export default function ProfitSlider({
  id,
  label,
  value,
  scale,
  onChange,
  decimals = 0,
  prefix,
  suffix,
  source,
  compareValue,
  compareLabel,
  tone = 'primary',
  invalid = false,
  disabled = false,
}: ProfitSliderProps) {
  const [draft, setDraft] = useState<string | null>(null)

  const shown = draft ?? String(trim(value, decimals))
  const filled = clamp(((value - scale.min) / (scale.max - scale.min)) * 100, 0, 100)
  const differs =
    typeof compareValue === 'number' &&
    Math.abs(compareValue - value) > Math.pow(10, -(decimals + 1))

  const commit = (raw: string) => {
    setDraft(raw)
    if (raw === '' || Number.isNaN(Number(raw))) return
    onChange(Math.max(scale.min, Number(raw)))
  }

  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          {label}
          {source === 'report' && (
            <span
              className="rounded bg-emerald-50 px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-emerald-700"
              title="Measured by the report for the filters above"
            >
              Live
            </span>
          )}
          {source === 'assumption' && (
            <span
              className="rounded bg-gray-100 px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-gray-500"
              title="Not tracked in your reports - this one is your assumption"
            >
              Assumed
            </span>
          )}
          {differs && (
            <span className="rounded bg-gray-100 px-1.5 py-px text-[10px] font-normal text-gray-500">
              {compareLabel} {trim(compareValue as number, decimals).toLocaleString('en-US')}
            </span>
          )}
        </label>
        <div
          className={`flex shrink-0 items-baseline gap-0.5 rounded-md px-2 py-0.5 ${
            invalid ? 'bg-red-50' : 'bg-gray-100'
          }`}
        >
          {prefix && <span className="text-[11px] text-gray-500">{prefix}</span>}
          <input
            type="number"
            inputMode="decimal"
            value={shown}
            step={scale.step}
            disabled={disabled}
            onChange={e => commit(e.target.value)}
            onFocus={e => setDraft(e.target.value)}
            onBlur={() => setDraft(null)}
            aria-label={label}
            className={`w-[68px] border-0 bg-transparent p-0 text-right text-sm font-semibold tabular-nums focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
              invalid ? 'text-red-600' : 'text-gray-900'
            }`}
          />
          {suffix && <span className="text-[11px] text-gray-500">{suffix}</span>}
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={scale.min}
        max={scale.max}
        step={scale.step}
        value={clamp(value, scale.min, scale.max)}
        disabled={disabled}
        onChange={e => {
          setDraft(null)
          onChange(Number(e.target.value))
        }}
        style={{ '--p': `${filled}%` } as React.CSSProperties}
        className={`rp-slider ${tone === 'alt' ? 'rp-slider-alt' : ''} ${
          disabled ? 'opacity-40' : ''
        }`}
      />
    </div>
  )
}
