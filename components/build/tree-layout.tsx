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
  /** Horizontal gap between sibling subtrees. */
  hGap?: number
  /** Vertical gap between a parent's bottom and its children's top. */
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
 * Lays out page frames as a top-down tidy tree: each parent is centered above
 * its children, connected by elbow links. Heights are measured per node so
 * variable-height frames stack correctly. Frames can be dragged onto one
 * another to reparent, or onto the background to become a root.
 */
export function TreeLayout({
  items,
  nodeWidth,
  hGap = 64,
  vGap = 72,
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

  // ---- Tidy tree layout ----
  const subtreeWidthCache = new Map<string, number>()
  const subtreeWidth = (id: string): number => {
    if (subtreeWidthCache.has(id)) return subtreeWidthCache.get(id)!
    const kids = childrenOf(id)
    let w = nodeWidth
    if (kids.length) {
      const childrenWidth =
        kids.reduce((sum, k) => sum + subtreeWidth(k.id), 0) +
        hGap * (kids.length - 1)
      w = Math.max(nodeWidth, childrenWidth)
    }
    subtreeWidthCache.set(id, w)
    return w
  }

  const pos: Record<string, Pos> = {}
  const place = (id: string, leftX: number, topY: number) => {
    const w = subtreeWidth(id)
    pos[id] = { x: leftX + (w - nodeWidth) / 2, y: topY }
    const kids = childrenOf(id)
    if (!kids.length) return
    const childrenTotal =
      kids.reduce((sum, k) => sum + subtreeWidth(k.id), 0) +
      hGap * (kids.length - 1)
    let childX = leftX + (w - childrenTotal) / 2
    const childY = topY + heightOf(id) + vGap
    for (const k of kids) {
      place(k.id, childX, childY)
      childX += subtreeWidth(k.id) + hGap
    }
  }

  const roots = childrenOf(null)
  let rootX = 0
  for (const r of roots) {
    place(r.id, rootX, 0)
    rootX += subtreeWidth(r.id) + hGap
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
  // Room for the add-child buttons / add-root row beneath the tree.
  const padBottom = 56

  // Is `candidate` inside the subtree rooted at `rootId`? (cycle guard)
  const isDescendant = (rootId: string, candidate: string): boolean => {
    if (rootId === candidate) return true
    return childrenOf(rootId).some((k) => isDescendant(k.id, candidate))
  }
  const canDrop = (targetId: string | null) => {
    if (!dragId) return false
    if (targetId === null) {
      // Dropping to root is only meaningful if not already a root.
      return items.find((i) => i.id === dragId)?.parentId !== null
    }
    if (targetId === dragId) return false
    if (isDescendant(dragId, targetId)) return false
    return items.find((i) => i.id === dragId)?.parentId !== targetId
  }

  const connectors: ReactNode[] = []
  for (const it of items) {
    if (it.parentId === null) continue
    const c = pos[it.id]
    const p = pos[it.parentId]
    if (!c || !p) continue
    const startX = p.x + nodeWidth / 2
    const startY = p.y + heightOf(it.parentId)
    const endX = c.x + nodeWidth / 2
    const endY = c.y
    const midY = startY + (endY - startY) / 2
    connectors.push(
      <path
        key={`link-${it.id}`}
        d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
        fill="none"
        stroke="color-mix(in srgb, var(--foreground) 35%, transparent)"
        strokeWidth={2}
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
        style={{ width: maxRight, height: maxBottom + padBottom }}
      >
        {/* Connector layer */}
        <svg
          className="pointer-events-none absolute left-0 top-0 overflow-visible"
          width={maxRight}
          height={maxBottom + padBottom}
        >
          {connectors}
        </svg>

        {/* Nodes */}
        {items.map((it) => {
          const p = pos[it.id]
          if (!p) return null
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

              {/* Add-child affordance, centered on the bottom edge */}
              <button
                type="button"
                onClick={() => onAddChild(it.id)}
                aria-label="Add child page"
                title="Add child page"
                style={{ top: h }}
                className="absolute left-1/2 z-10 mt-3 flex size-7 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:border-primary hover:text-primary"
              >
                <Plus className="size-4" />
              </button>
            </div>
          )
        })}

        {/* Add root page — to the right of the last root frame */}
        <button
          type="button"
          onClick={onAddRoot}
          style={{ left: rootX, top: 0, width: nodeWidth }}
          className="absolute flex h-32 items-center justify-center gap-2 rounded-sm border-2 border-dashed border-border bg-card/40 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="size-4" />
          Add page
        </button>
      </div>
    </div>
  )
}
