'use client'

import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Plus, GripVertical, X } from '@/components/icons'
import { useFramePositions } from '@/lib/frame-positions'

export type TreeItem = { id: string; parentId: string | null }

type Props = {
  items: TreeItem[]
  nodeWidth: number
  /** Horizontal gap between a parent's right edge and its children's left edge. */
  hGap?: number
  /** Vertical gap between sibling subtrees. */
  vGap?: number
  /** Estimated node height used before a node is measured. */
  estimatedHeight?: number
  /** Maps item id to the frameId used in Frame component. */
  frameIdForItem?: (id: string) => string
  /** Renders the frame. `handle` is a drag grip that arms reparent dragging. */
  renderNode: (id: string, handle: ReactNode) => ReactNode
  onAddChild: (parentId: string) => void
  onAddRoot: () => void
  /** Make `id` a child of `parentId` (null = root). */
  onReparent: (id: string, parentId: string | null) => void
}

type Pos = { x: number; y: number }

/**
 * Lays out page frames as a left-to-right tidy tree: each parent is centered
 * left of its children, connected by cubic bezier links. Heights are measured
 * per node so variable-height frames stack correctly.
 *
 * Frames can be freely dragged (via Frame's own drag system). Connectors and
 * add-child buttons track the actual rendered position by reading Frame offsets
 * from FramePositionsProvider.
 */
export function TreeLayout({
  items,
  nodeWidth,
  hGap = 96,
  vGap = 40,
  estimatedHeight = 420,
  frameIdForItem,
  renderNode,
  onAddChild,
  onAddRoot,
  onReparent,
}: Props) {
  const [heights, setHeights] = useState<Record<string, number>>({})
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropId, setDropId] = useState<string | null | undefined>(undefined)
  const [armedId, setArmedId] = useState<string | null>(null)
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const positions = useFramePositions()
  // Force re-render when frames move so connectors update
  const [, setTick] = useState(0)
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)

  // Measure node heights after layout; reflow when they change.
  useLayoutEffect(() => {
    const next: Record<string, number> = {}
    let changed = false
    for (const it of items) {
      const el = nodeRefs.current[it.id]
      if (el) {
        const h = el.offsetHeight
        next[it.id] = h
        if (heights[it.id] !== h) changed = true
      }
    }
    if (changed || Object.keys(next).length !== Object.keys(heights).length) {
      setHeights(next)
    }
  })

  const heightOf = (id: string) => heights[id] ?? estimatedHeight
  const childrenOf = (id: string | null) =>
    items.filter((n) => n.parentId === id)

  // Get the frame drag offset for an item
  const getOffset = (id: string): Pos => {
    const fid = frameIdForItem ? frameIdForItem(id) : id
    return positions.get(fid)
  }

  // ---- Left-to-right tidy tree layout ----
  const subtreeHeightCache = new Map<string, number>()
  const subtreeHeight = (id: string): number => {
    if (subtreeHeightCache.has(id)) return subtreeHeightCache.get(id)!
    const kids = childrenOf(id)
    let h = heightOf(id)
    if (kids.length) {
      const childrenHeight =
        kids.reduce((sum, k) => sum + subtreeHeight(k.id), 0) +
        vGap * (kids.length - 1)
      h = Math.max(heightOf(id), childrenHeight)
    }
    subtreeHeightCache.set(id, h)
    return h
  }

  // Base positions from tree algorithm (before frame drag offsets)
  const basePos: Record<string, Pos> = {}

  const place = (id: string, leftX: number, topY: number) => {
    const h = subtreeHeight(id)
    basePos[id] = { x: leftX, y: topY + (h - heightOf(id)) / 2 }
    const kids = childrenOf(id)
    if (!kids.length) return
    const childrenTotal =
      kids.reduce((sum, k) => sum + subtreeHeight(k.id), 0) +
      vGap * (kids.length - 1)
    const childX = leftX + nodeWidth + hGap
    let childY = topY + (h - childrenTotal) / 2
    for (const k of kids) {
      place(k.id, childX, childY)
      childY += subtreeHeight(k.id) + vGap
    }
  }

  const roots = childrenOf(null)
  let rootY = 0
  for (const r of roots) {
    place(r.id, 0, rootY)
    rootY += subtreeHeight(r.id) + vGap
  }

  // Actual rendered positions = base + frame drag offset
  const actualPos = (id: string): Pos => {
    const bp = basePos[id]
    if (!bp) return { x: 0, y: 0 }
    const off = getOffset(id)
    return { x: bp.x + off.x, y: bp.y + off.y }
  }

  // Bounding box
  let maxRight = nodeWidth
  let maxBottom = estimatedHeight
  for (const it of items) {
    const ap = actualPos(it.id)
    maxRight = Math.max(maxRight, ap.x + nodeWidth)
    maxBottom = Math.max(maxBottom, ap.y + heightOf(it.id))
  }
  // Also account for base positions for the add-root button
  for (const it of items) {
    const bp = basePos[it.id]
    if (!bp) continue
    maxRight = Math.max(maxRight, bp.x + nodeWidth)
    maxBottom = Math.max(maxBottom, bp.y + heightOf(it.id))
  }
  const padRight = 120

  const isDescendant = (rootId: string, candidate: string): boolean => {
    if (rootId === candidate) return true
    return childrenOf(rootId).some((k) => isDescendant(k.id, candidate))
  }
  const canDrop = (targetId: string | null) => {
    if (!dragId) return false
    if (targetId === null) {
      return items.find((i) => i.id === dragId)?.parentId !== null
    }
    if (targetId === dragId) return false
    if (isDescendant(dragId, targetId)) return false
    return items.find((i) => i.id === dragId)?.parentId !== targetId
  }

  // Connection anchor dots on every node using ACTUAL positions
  const dotColor = 'color-mix(in srgb, var(--foreground) 25%, transparent)'
  const dotColorActive = 'color-mix(in srgb, var(--foreground) 45%, transparent)'
  const anchorDots: ReactNode[] = []
  const hasChildrenSet = new Set<string>()
  const hasParentSet = new Set<string>()
  for (const it of items) {
    if (it.parentId) {
      hasParentSet.add(it.id)
      hasChildrenSet.add(it.parentId)
    }
  }

  for (const it of items) {
    const ap = actualPos(it.id)
    const h = heightOf(it.id)
    anchorDots.push(
      <circle
        key={`anchor-l-${it.id}`}
        cx={ap.x}
        cy={ap.y + h / 2}
        r={hasParentSet.has(it.id) ? 4 : 3}
        fill={hasParentSet.has(it.id) ? dotColorActive : dotColor}
      />,
      <circle
        key={`anchor-r-${it.id}`}
        cx={ap.x + nodeWidth}
        cy={ap.y + h / 2}
        r={hasChildrenSet.has(it.id) ? 4 : 3}
        fill={hasChildrenSet.has(it.id) ? dotColorActive : dotColor}
      />,
      <circle
        key={`anchor-b-${it.id}`}
        cx={ap.x + nodeWidth / 2}
        cy={ap.y + h}
        r={3}
        fill={dotColor}
      />,
    )
  }

  // Connectors using ACTUAL positions — store data for hit-area + delete overlay
  type LinkData = { childId: string; d: string; mx: number; my: number }
  const links: LinkData[] = []
  for (const it of items) {
    if (it.parentId === null) continue
    const cPos = actualPos(it.id)
    const pPos = actualPos(it.parentId)
    const startX = pPos.x + nodeWidth
    const startY = pPos.y + heightOf(it.parentId) / 2
    const endX = cPos.x
    const endY = cPos.y + heightOf(it.id) / 2
    const cpX = startX + (endX - startX) / 2
    links.push({
      childId: it.id,
      d: `M ${startX} ${startY} C ${cpX} ${startY}, ${cpX} ${endY}, ${endX} ${endY}`,
      mx: (startX + endX) / 2,
      my: (startY + endY) / 2,
    })
  }

  // Listen for frame moves to re-render connectors
  const onFrameMove = () => setTick((n) => n + 1)

  return (
    <div
      className="relative p-24 pl-72"
      onDragOver={(e) => {
        if (canDrop(null)) {
          e.preventDefault()
          setDropId(null)
        }
      }}
      onDrop={(e) => {
        if (canDrop(null)) {
          e.preventDefault()
          if (dragId) onReparent(dragId, null)
        }
        setDragId(null)
        setDropId(undefined)
      }}
      onMouseMove={onFrameMove}
    >
      <div
        className="relative"
        style={{ width: maxRight + padRight, height: maxBottom + 56 }}
      >
        {/* Connector layer */}
        <svg
          className="absolute left-0 top-0 overflow-visible"
          width={maxRight + padRight}
          height={maxBottom + 56}
        >
          {links.map((link) => (
            <g key={`link-${link.childId}`}>
              <path
                d={link.d}
                fill="none"
                stroke={
                  hoveredLink === link.childId
                    ? 'var(--destructive)'
                    : 'color-mix(in srgb, var(--foreground) 35%, transparent)'
                }
                strokeWidth={2}
                className="pointer-events-none transition-colors"
              />
              <path
                d={link.d}
                fill="none"
                stroke="transparent"
                strokeWidth={18}
                className="cursor-pointer"
                style={{ pointerEvents: 'stroke' }}
                onMouseEnter={() => setHoveredLink(link.childId)}
                onMouseLeave={() => setHoveredLink(null)}
              />
            </g>
          ))}
          <g className="pointer-events-none">{anchorDots}</g>
        </svg>

        {/* Delete-link button — HTML overlay at connector midpoint */}
        {hoveredLink != null && (() => {
          const link = links.find((l) => l.childId === hoveredLink)
          if (!link) return null
          return (
            <button
              type="button"
              onClick={() => {
                onReparent(hoveredLink, null)
                setHoveredLink(null)
              }}
              onMouseEnter={() => setHoveredLink(hoveredLink)}
              onMouseLeave={() => setHoveredLink(null)}
              aria-label="Remove link"
              title="Remove link between pages"
              className="absolute z-20 flex size-6 items-center justify-center rounded-full border border-destructive/40 bg-card text-destructive shadow-sm transition-colors hover:bg-destructive hover:text-white"
              style={{
                left: link.mx,
                top: link.my,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <X className="size-3.5" />
            </button>
          )
        })()}

        {/* Nodes — positioned at BASE positions; Frame applies its own drag offset via transform */}
        {items.map((it) => {
          const bp = basePos[it.id]
          if (!bp) return null
          const ap = actualPos(it.id)
          const off = getOffset(it.id)
          const h = heightOf(it.id)
          const isDropTarget = dropId === it.id && canDrop(it.id)
          const handle = (
            <button
              type="button"
              aria-label="Drag to reparent"
              title="Drag to move under another page"
              onMouseDown={() => setArmedId(it.id)}
              onMouseUp={() => setArmedId(null)}
              className="flex size-6 cursor-grab items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
            >
              <GripVertical className="size-4" />
            </button>
          )
          return (
            <div
              key={it.id}
              ref={(el) => {
                nodeRefs.current[it.id] = el
              }}
              draggable={armedId === it.id}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move'
                setDragId(it.id)
              }}
              onDragEnd={() => {
                setDragId(null)
                setArmedId(null)
                setDropId(undefined)
              }}
              className="absolute"
              style={{ left: bp.x, top: bp.y, width: nodeWidth }}
              onDragOver={(e) => {
                if (canDrop(it.id)) {
                  e.preventDefault()
                  e.stopPropagation()
                  setDropId(it.id)
                }
              }}
              onDragLeave={() => {
                setDropId((cur) => (cur === it.id ? undefined : cur))
              }}
              onDrop={(e) => {
                if (canDrop(it.id)) {
                  e.preventDefault()
                  e.stopPropagation()
                  if (dragId) onReparent(dragId, it.id)
                }
                setDragId(null)
                setDropId(undefined)
              }}
            >
              {/* Reparent drop highlight */}
              {isDropTarget && (
                <div className="pointer-events-none absolute -inset-1 z-10 rounded-sm border-2 border-dashed border-primary" />
              )}

              {renderNode(it.id, handle)}

              {/* Connection handles — follow frame drag offset */}
              <div
                className="pointer-events-auto absolute top-0 left-0"
                style={{
                  width: 0,
                  height: 0,
                  transform: `translate(${off.x}px, ${off.y}px)`,
                }}
              >
                {/* Right: add child page */}
                <button
                  type="button"
                  onClick={() => onAddChild(it.id)}
                  aria-label="Add child page"
                  title="Add child page"
                  className="absolute z-10 flex size-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:border-primary hover:text-primary"
                  style={{
                    left: nodeWidth + 12,
                    top: h / 2,
                    transform: 'translateY(-50%)',
                  }}
                >
                  <Plus className="size-4" />
                </button>
                {/* Left: add sibling page */}
                <button
                  type="button"
                  onClick={() => it.parentId ? onAddChild(it.parentId) : onAddRoot()}
                  aria-label="Add sibling page"
                  title="Add sibling page"
                  className="absolute z-10 flex size-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:border-primary hover:text-primary"
                  style={{
                    left: -12,
                    top: h / 2,
                    transform: 'translate(-100%, -50%)',
                  }}
                >
                  <Plus className="size-4" />
                </button>
                {/* Bottom: add sibling page */}
                <button
                  type="button"
                  onClick={() => it.parentId ? onAddChild(it.parentId) : onAddRoot()}
                  aria-label="Add sibling page below"
                  title="Add sibling page below"
                  className="absolute z-10 flex size-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:border-primary hover:text-primary"
                  style={{
                    left: nodeWidth / 2,
                    top: h + 12,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          )
        })}

        {/* Add root page — below the last root frame */}
        <button
          type="button"
          onClick={onAddRoot}
          style={{ left: 0, top: rootY, width: nodeWidth }}
          className="absolute flex h-32 items-center justify-center gap-2 rounded-sm border-2 border-dashed border-border bg-card/40 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="size-4" />
          Add page
        </button>
      </div>
    </div>
  )
}
