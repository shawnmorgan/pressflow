'use client'

import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Plus, GripVertical } from '@/components/icons'

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
 * per node so variable-height frames stack correctly. Frames can be dragged
 * onto one another to reparent, or onto the background to become a root.
 */
export function TreeLayout({
  items,
  nodeWidth,
  hGap = 96,
  vGap = 40,
  estimatedHeight = 420,
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

  // ---- Left-to-right tidy tree layout ----
  // "subtreeHeight" = total vertical space needed for this node's subtree
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

  const pos: Record<string, Pos> = {}

  // Place nodes left-to-right: parent at (leftX, topY centered in subtree),
  // children stacked vertically to the right.
  const place = (id: string, leftX: number, topY: number) => {
    const h = subtreeHeight(id)
    // Center node vertically within its subtree space
    pos[id] = { x: leftX, y: topY + (h - heightOf(id)) / 2 }
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

  // Lay out root nodes stacked vertically
  const roots = childrenOf(null)
  let rootY = 0
  for (const r of roots) {
    place(r.id, 0, rootY)
    rootY += subtreeHeight(r.id) + vGap
  }

  // Bounding box of the whole tree.
  let maxRight = nodeWidth
  let maxBottom = estimatedHeight
  for (const it of items) {
    const p = pos[it.id]
    if (!p) continue
    maxRight = Math.max(maxRight, p.x + nodeWidth)
    maxBottom = Math.max(maxBottom, p.y + heightOf(it.id))
  }
  const padRight = 80

  // Is `candidate` inside the subtree rooted at `rootId`? (cycle guard)
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

  // Connectors: horizontal bezier curves from parent right-center to child left-center
  const connectors: ReactNode[] = []
  for (const it of items) {
    if (it.parentId === null) continue
    const c = pos[it.id]
    const p = pos[it.parentId]
    if (!c || !p) continue
    const startX = p.x + nodeWidth
    const startY = p.y + heightOf(it.parentId) / 2
    const endX = c.x
    const endY = c.y + heightOf(it.id) / 2
    const midX = startX + (endX - startX) / 2
    connectors.push(
      <path
        key={`link-${it.id}`}
        d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
        fill="none"
        stroke="color-mix(in srgb, var(--foreground) 35%, transparent)"
        strokeWidth={2}
      />,
    )
    // Connection dots at start and end
    connectors.push(
      <circle
        key={`dot-start-${it.id}`}
        cx={startX}
        cy={startY}
        r={3}
        fill="color-mix(in srgb, var(--foreground) 35%, transparent)"
      />,
      <circle
        key={`dot-end-${it.id}`}
        cx={endX}
        cy={endY}
        r={3}
        fill="color-mix(in srgb, var(--foreground) 35%, transparent)"
      />,
    )
  }

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
    >
      <div
        className="relative"
        style={{ width: maxRight + padRight, height: maxBottom + 56 }}
      >
        {/* Connector layer */}
        <svg
          className="pointer-events-none absolute left-0 top-0 overflow-visible"
          width={maxRight + padRight}
          height={maxBottom + 56}
        >
          {connectors}
        </svg>

        {/* Nodes */}
        {items.map((it) => {
          const p = pos[it.id]
          if (!p) return null
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
              style={{ left: p.x, top: p.y, width: nodeWidth }}
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

              {/* Add-child affordance, centered on the right edge */}
              <button
                type="button"
                onClick={() => onAddChild(it.id)}
                aria-label="Add child page"
                title="Add child page"
                className="absolute top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:border-primary hover:text-primary"
                style={{ left: nodeWidth + 12 }}
              >
                <Plus className="size-4" />
              </button>
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
