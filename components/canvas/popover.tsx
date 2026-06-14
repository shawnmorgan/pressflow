'use client'

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

type Side = 'right' | 'left' | 'bottom' | 'top'

/**
 * An anchored, portal-based popover. Anchors to the trigger's live screen
 * rect (read on open + on scroll/resize), so it stays correct even when the
 * trigger lives inside a CSS-transformed (panned/zoomed) canvas.
 */
export function Popover({
  open,
  onClose,
  anchorRef,
  side = 'right',
  title,
  width = 320,
  children,
}: {
  open: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement | null>
  side?: Side
  title?: string
  width?: number
  children: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const anchor = anchorRef.current
      const panel = panelRef.current
      if (!anchor) return
      const r = anchor.getBoundingClientRect()
      const ph = panel?.offsetHeight ?? 300
      const pw = panel?.offsetWidth ?? width
      const gap = 10
      let top = r.top
      let left = r.right + gap

      if (side === 'right') left = r.right + gap
      if (side === 'left') left = r.left - pw - gap
      if (side === 'bottom') {
        top = r.bottom + gap
        left = r.left
      }
      if (side === 'top') {
        top = r.top - ph - gap
        left = r.left
      }

      // Clamp to viewport.
      const vw = window.innerWidth
      const vh = window.innerHeight
      if (left + pw > vw - 8) left = Math.max(8, vw - pw - 8)
      if (left < 8) left = 8
      if (top + ph > vh - 8) top = Math.max(8, vh - ph - 8)
      if (top < 8) top = 8

      setPos({ top, left })
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, side, width, anchorRef])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t)) return
      if (anchorRef.current?.contains(t)) return
      onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open, onClose, anchorRef])

  if (!open || !mounted) return null

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={title}
      className="fixed z-[100] flex max-h-[80vh] flex-col overflow-hidden rounded-sm border border-border bg-card shadow-lg"
      style={{
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        width,
        visibility: pos ? 'visible' : 'hidden',
      }}
    >
      {title && (
        <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
          <span className="text-[12px] font-semibold text-foreground">
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
    </div>,
    document.body,
  )
}
