'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Undo, Redo } from '@/components/icons'
import { ProjectSwitcher } from '@/components/project-switcher'
import { ViewTabs, type CanvasView } from '@/components/canvas/view-tabs'
import { AccountMenu } from '@/components/account-menu'

export function Topbar({
  view,
  onViewChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  notificationCount = 0,
}: {
  view: CanvasView
  onViewChange: (v: CanvasView) => void
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
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

      {/* Center — main view switcher (including Comments) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <ViewTabs view={view} onChange={onViewChange} />
      </div>

      <div className="flex-1" />

      <span className="h-5 w-px bg-border" aria-hidden="true" />

      {/* Right — undo/redo, notifications, account */}
      <div className="flex shrink-0 items-center gap-1">
        {/* Undo / Redo */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
          title="Undo (Cmd+Z)"
          className="flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
        >
          <Undo className="size-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
          title="Redo (Cmd+Shift+Z)"
          className="flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
        >
          <Redo className="size-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

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
            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold leading-none text-primary-foreground">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
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
