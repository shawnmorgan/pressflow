'use client'

import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useCanvasScale } from '@/components/canvas/infinite-canvas'
import { useFramePositions } from '@/lib/frame-positions'

/**
 * A titled frame placed in canvas space — a labeled card with a header strip.
 * Used for stylesheet / page / export frames on the infinite canvas.
 *
 * The titlebar is a drag handle: click-and-hold to reposition the frame on the
 * canvas. The offset is persisted in a workspace-level context keyed by
 * `frameId` (falls back to `title`) so positions survive view switches.
 */
export function Frame({
  title,
  frameId,
  badge,
  width,
  headerRight,
  children,
  onTitleClick,
  active = false,
}: {
  title: string
  frameId?: string
  badge?: ReactNode
  width: number
  headerRight?: ReactNode
  children: ReactNode
  onTitleClick?: () => void
  active?: boolean
}) {
  const id = frameId ?? title
  const positions = useFramePositions()
  const scale = useCanvasScale()
  const scaleRef = useRef(scale)
  scaleRef.current = scale

  const [offset, setOffset] = useState(() => positions.get(id))
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{
    startX: number
    startY: number
    origX: number
    origY: number
  } | null>(null)
  const movedRef = useRef(false)

  // Sync offset back to the persistent store whenever it changes
  useEffect(() => {
    positions.set(id, offset)
  }, [id, offset, positions])

  const onHeaderDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      const target = e.target as HTMLElement
      if (target.closest('button, a, input, select, textarea')) return

      e.preventDefault()
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: offset.x,
        origY: offset.y,
      }
      movedRef.current = false
      setDragging(true)
    },
    [offset],
  )

  useEffect(() => {
    if (!dragging) return

    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      if (!movedRef.current && Math.abs(dx) + Math.abs(dy) > 3) {
        movedRef.current = true
      }
      setOffset({
        x: dragRef.current.origX + dx / scaleRef.current,
        y: dragRef.current.origY + dy / scaleRef.current,
      })
    }

    const onUp = () => {
      dragRef.current = null
      setDragging(false)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging])

  const handleTitleClick = () => {
    if (!movedRef.current && onTitleClick) onTitleClick()
  }

  const hasOffset = offset.x !== 0 || offset.y !== 0

  return (
    <div
      className={`flex flex-col rounded-sm border bg-card shadow-sm transition-shadow ${
        active ? 'border-primary shadow-md' : 'border-border'
      }`}
      style={{
        width,
        transform: hasOffset ? `translate(${offset.x}px, ${offset.y}px)` : undefined,
        zIndex: dragging ? 100 : undefined,
        position: 'relative',
      }}
    >
      <div
        data-frame-header
        className={`flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2 ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={onHeaderDown}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={handleTitleClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleTitleClick()
          }}
          className="flex items-center gap-2 text-left"
        >
          <span className="text-[13px] font-semibold text-foreground">
            {title}
          </span>
          {badge}
        </div>
        {headerRight}
      </div>
      <div data-frame-content className="min-h-0 flex-1">{children}</div>
    </div>
  )
}
