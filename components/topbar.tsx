'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Bell } from '@/components/icons'
import { ProjectSwitcher } from '@/components/project-switcher'
import { ViewTabs, type CanvasView } from '@/components/canvas/view-tabs'
import { AccountMenu } from '@/components/account-menu'

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold leading-none text-primary-foreground">
      {count > 99 ? '99+' : count}
    </span>
  )
}

export function Topbar({
  view,
  onViewChange,
  onComments,
  commentsActive,
  commentCount = 0,
  notificationCount = 0,
}: {
  view: CanvasView
  onViewChange: (v: CanvasView) => void
  onComments?: () => void
  commentsActive?: boolean
  commentCount?: number
  notificationCount?: number
}) {
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!bellOpen) return
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [bellOpen])

  return (
    <header className="relative flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-4">
      {/* Left — project switcher */}
      <ProjectSwitcher />

      <span className="h-5 w-px bg-border" aria-hidden="true" />

      {/* Center — main view switcher */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <ViewTabs view={view} onChange={onViewChange} />
      </div>

      <div className="flex-1" />

      <span className="h-5 w-px bg-border" aria-hidden="true" />

      {/* Right — comments, notifications, account */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Comments */}
        {onComments && (
          <button
            type="button"
            onClick={onComments}
            aria-label="Comments"
            title="Comments"
            aria-pressed={commentsActive || undefined}
            className={`relative flex size-8 items-center justify-center rounded-sm transition-colors ${
              commentsActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <MessageSquare className="size-4" />
            {!commentsActive && <CountBadge count={commentCount} />}
          </button>
        )}

        {/* Notification bell */}
        <div ref={bellRef} className="relative">
          <button
            type="button"
            onClick={() => setBellOpen((v) => !v)}
            aria-label="Notifications"
            title="Notifications"
            className="relative flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Bell className="size-4" />
            <CountBadge count={notificationCount} />
          </button>
          {bellOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-sm border border-border bg-card p-4 shadow-lg">
              <p className="text-center text-[12px] text-muted-foreground">No notifications yet</p>
            </div>
          )}
        </div>

        <AccountMenu />
      </div>
    </header>
  )
}
