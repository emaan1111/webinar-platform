'use client'

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface PopoverProps {
  /** Element the panel hangs off. `null` = closed. */
  anchor: HTMLElement | null
  onClose: () => void
  align?: 'start' | 'end'
  /** Fixed panel width in px; the panel is clamped inside the viewport. */
  width?: number
  className?: string
  children: React.ReactNode
}

const GAP = 6
const MARGIN = 8

/** What receives focus when the panel opens, in order of preference. */
const FOCUS_TARGETS =
  '[data-autofocus], [role="menuitem"]:not([disabled]), [data-nav]:not([disabled]), input:not([disabled]), button:not([disabled]), a[href]'
/** What the arrow keys step through. */
const NAV_ITEMS = '[role="menuitem"]:not([disabled]), [data-nav]:not([disabled])'

/**
 * Small anchored panel rendered in a portal so it is never clipped by a
 * scrolling table container. Closes on Escape or outside click, follows its
 * anchor when the table scrolls or the window resizes, moves focus in when it
 * opens (arrow keys step through menu items) and hands focus back to the
 * anchor when it closes.
 */
export default function Popover({ anchor, onClose, align = 'start', width = 240, className = '', children }: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: 'hidden' })
  const visible = style.visibility === 'visible'

  const place = useCallback(() => {
    if (!anchor || !panelRef.current) return
    const rect = anchor.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    // The header it hangs off has scrolled out of sight - nothing sensible
    // to anchor to any more.
    if (rect.bottom < 0 || rect.top > vh || rect.right < 0 || rect.left > vw) {
      onClose()
      return
    }

    let left = align === 'end' ? rect.right - width : rect.left
    left = Math.min(Math.max(left, MARGIN), Math.max(MARGIN, vw - MARGIN - width))

    const panelHeight = panelRef.current.offsetHeight
    const spaceBelow = vh - rect.bottom - GAP - MARGIN
    const spaceAbove = rect.top - GAP - MARGIN
    const openUp = panelHeight > spaceBelow && spaceAbove > spaceBelow

    const top = openUp ? Math.max(MARGIN, rect.top - GAP - panelHeight) : rect.bottom + GAP
    const maxHeight = openUp ? spaceAbove : spaceBelow

    setStyle({
      position: 'fixed',
      top,
      left,
      width,
      maxHeight: Math.max(120, maxHeight),
      visibility: 'visible',
    })
  }, [anchor, align, width, onClose])

  useLayoutEffect(() => {
    place()
  }, [place])

  // Focus moves into the panel once it is actually visible (a hidden element
  // refuses focus, which is why a plain autoFocus never worked here), and goes
  // back to the anchor when the panel closes.
  useEffect(() => {
    if (!anchor || !visible) return
    const panel = panelRef.current
    if (!panel) return
    if (!panel.contains(document.activeElement)) {
      panel.querySelector<HTMLElement>(FOCUS_TARGETS)?.focus()
    }
    return () => {
      const active = document.activeElement
      if (!active || active === document.body || panel.contains(active)) anchor.focus()
    }
  }, [anchor, visible])

  useEffect(() => {
    if (!anchor) return
    let raf = 0
    // Follow the anchor when the table scrolls or the window resizes (a
    // phone keyboard opening counts as a resize - closing there would kill
    // the search box mid-word).
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(place)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      const panel = panelRef.current
      const target = e.target as HTMLElement | null
      if (!panel || !target || !panel.contains(target)) return
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return
      // Home/End keep their text-editing meaning inside an input.
      if (target.tagName === 'INPUT' && (e.key === 'Home' || e.key === 'End')) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(NAV_ITEMS))
      if (items.length === 0) return
      e.preventDefault()
      const current = items.indexOf(document.activeElement as HTMLElement)
      const next =
        e.key === 'Home'
          ? 0
          : e.key === 'End'
            ? items.length - 1
            : e.key === 'ArrowDown'
              ? (current + 1) % items.length
              : (current - 1 + items.length) % items.length
      items[next].focus()
    }
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node
      if (panelRef.current?.contains(target) || anchor.contains(target)) return
      onClose()
    }
    const onScroll = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return
      schedule()
    }
    // Tabbing out of the panel closes it, so keyboard users never leave a
    // menu open behind the element they moved on to.
    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as Node | null
      if (!next) return
      if (panelRef.current?.contains(next) || anchor.contains(next)) return
      onClose()
    }

    const panel = panelRef.current
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', schedule)
    panel?.addEventListener('focusout', onFocusOut)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', schedule)
      panel?.removeEventListener('focusout', onFocusOut)
    }
  }, [anchor, onClose, place])

  if (!anchor || typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={panelRef}
      style={style}
      className={`z-50 overflow-auto rounded-lg border border-gray-200 bg-white shadow-xl ring-1 ring-black/5 ${className}`}
    >
      {children}
    </div>,
    document.body
  )
}

interface MenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode
  danger?: boolean
}

export function MenuItem({ icon, danger = false, className = '', children, ...props }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors focus:outline-none focus-visible:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 ${
        danger ? 'text-red-600 hover:bg-red-50 focus-visible:bg-red-50' : 'text-gray-700 hover:bg-gray-100'
      } ${className}`}
      {...props}
    >
      {icon && <span className="w-4 h-4 shrink-0 text-gray-400 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
    </button>
  )
}

export const MenuDivider = () => <div className="my-1 border-t border-gray-100" role="separator" />
