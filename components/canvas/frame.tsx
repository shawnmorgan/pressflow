'use client'

import { type ReactNode } from 'react'

/**
 * A titled frame placed in canvas space — a labeled card with a header strip.
 * Used for stylesheet / page / export frames on the infinite canvas.
 */
export function Frame({
  title,
  badge,
  width,
  headerRight,
  children,
  onTitleClick,
  active = false,
}: {
  title: string
  badge?: ReactNode
  width: number
  headerRight?: ReactNode
  children: ReactNode
  onTitleClick?: () => void
  active?: boolean
}) {
  return (
    <div
      className={`flex flex-col rounded-sm border bg-card shadow-sm transition-shadow ${
        active ? 'border-primary shadow-md' : 'border-border'
      }`}
      style={{ width }}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
        <button
          type="button"
          onClick={onTitleClick}
          className="flex items-center gap-2 text-left"
        >
          <span className="text-[13px] font-semibold text-foreground">
            {title}
          </span>
          {badge}
        </button>
        {headerRight}
      </div>
      <div data-frame-content className="min-h-0 flex-1">{children}</div>
    </div>
  )
}
