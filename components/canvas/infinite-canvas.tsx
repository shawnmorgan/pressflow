'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Plus, Minus } from '@/components/icons'

type Transform = { x: number; y: number; scale: number }

const MIN_SCALE = 0.25
const MAX_SCALE = 2

/**
 * Infinite dot-grid canvas surface. Supports:
 * - background drag-to-pan (or space + drag anywhere)
 * - ctrl/cmd + wheel to zoom toward the cursor; plain wheel pans
 * - zoom controls + reset, with a live zoom % readout
 * Children are placed in transformed canvas space.
 */
export function InfiniteCanvas({
  children,
  overlay,
}: {
  children: ReactNode
  /** Non-transformed floating layer (view controls). Fills the canvas; use
   *  absolutely-positioned, pointer-events-auto children inside. */
  overlay?: ReactNode
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [t, setT] = useState<Transform>({ x: 80, y: 80, scale: 1 })
  const [panning, setPanning] = useState(false)
  const [spaceDown, setSpaceDown] = useState(false)
  const pan = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(
    null,
  )

  const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s))

  const zoomBy = useCallback(
    (factor: number, cx?: number, cy?: number) => {
      setT((prev) => {
        const scale = clampScale(prev.scale * factor)
        const rect = wrapRef.current?.getBoundingClientRect()
        if (!rect) return { ...prev, scale }
        // Zoom toward a focal point (default: viewport center).
        const fx = (cx ?? rect.width / 2) - rect.left * 0
        const fy = (cy ?? rect.height / 2) - rect.top * 0
        const px = (fx - prev.x) / prev.scale
        const py = (fy - prev.y) / prev.scale
        return {
          scale,
          x: fx - px * scale,
          y: fy - py * scale,
        }
      })
    },
    [],
  )

  // Wheel: ctrl/cmd = zoom, otherwise pan.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const rect = el.getBoundingClientRect()
        zoomBy(
          e.deltaY < 0 ? 1.1 : 0.9,
          e.clientX - rect.left,
          e.clientY - rect.top,
        )
      } else {
        e.preventDefault()
        setT((prev) => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomBy])

  // Space to enable grab-pan anywhere.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTyping(e.target)) {
        e.preventDefault()
        setSpaceDown(true)
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceDown(false)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const startPan = (e: React.MouseEvent) => {
    // Pan when dragging the background, or anywhere while holding space.
    const onBackground = e.target === e.currentTarget
    if (!onBackground && !spaceDown) return
    pan.current = { sx: e.clientX, sy: e.clientY, ox: t.x, oy: t.y }
    setPanning(true)
  }

  useEffect(() => {
    if (!panning) return
    const move = (e: MouseEvent) => {
      if (!pan.current) return
      setT((prev) => ({
        ...prev,
        x: pan.current!.ox + (e.clientX - pan.current!.sx),
        y: pan.current!.oy + (e.clientY - pan.current!.sy),
      }))
    }
    const up = () => {
      pan.current = null
      setPanning(false)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [panning])

  // Keep the dot grid a fixed size so it doesn't scale when zooming.
  const gridSize = 24
  const cursor = spaceDown || panning ? 'grabbing' : 'default'

  return (
    <div
      ref={wrapRef}
      onMouseDown={startPan}
      className="relative h-full w-full overflow-hidden bg-canvas"
      style={{
        cursor,
        backgroundImage:
          'radial-gradient(circle, var(--dot-color, rgba(0,0,0,0.10)) 1px, transparent 1px)',
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundPosition: `${t.x}px ${t.y}px`,
      }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`,
        }}
      >
        {children}
      </div>

      {/* Non-transformed floating overlay layer for view controls. */}
      {overlay && (
        <div className="pointer-events-none absolute inset-0 z-50">{overlay}</div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-4 z-50 flex items-center gap-1 rounded-sm border border-border bg-card p-1 shadow-sm">
        <button
          type="button"
          onClick={() => zoomBy(0.9)}
          aria-label="Zoom out"
          className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Minus className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setT({ x: 80, y: 80, scale: 1 })}
          className="min-w-[3rem] rounded-sm px-2 py-1 text-center text-[12px] font-medium tabular-nums text-foreground transition-colors hover:bg-muted"
        >
          {Math.round(t.scale * 100)}%
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1.1)}
          aria-label="Zoom in"
          className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  )
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable
  )
}
