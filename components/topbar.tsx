'use client'

import { useState, useRef, useEffect } from 'react'
import { Share, MessageSquare, Bell, Undo, Redo } from '@/components/icons'
import { ProjectSwitcher } from '@/components/project-switcher'
import { ViewTabs, type CanvasView } from '@/components/canvas/view-tabs'
import { AccountMenu } from '@/components/account-menu'

export function Topbar({
  view,
  onViewChange,
  onShare,
  onComments,
  commentsActive,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  view: CanvasView
  onViewChange: (v: CanvasView) => void
  onShare?: () => void
  onComments?: () => void
  commentsActive?: boolean
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
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
      {/* Left — project switcher + undo/redo */}
      <div className="flex items-center gap-1">
        <ProjectSwitcher />
        {onUndo && (
          <>
            <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              aria-label="Undo"
              title="Undo (⌘Z)"
              className="flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
            >
              <Undo className="size-4" />
            </button>
          </>
        )}
        {onRedo && (
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo (⌘⇧Z)"
            className="flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
          >
            <Redo className="size-4" />
          </button>
        )}
      </div>

      {/* Center — main view switcher */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <ViewTabs view={view} onChange={onViewChange} />
      </div>

      <div className="flex-1" />

      {/* Right — actions */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Notification bell */}
        <div ref={bellRef} className="relative">
          <button
            type="button"
            onClick={() => setBellOpen((v) => !v)}
            aria-label="Notifications"
            title="Notifications"
            className="flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Bell className="size-4" />
          </button>
          {bellOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-sm border border-border bg-card p-4 shadow-lg">
              <p className="text-center text-[12px] text-muted-foreground">No notifications yet</p>
            </div>
          )}
        </div>

        <span className="mx-0.5 h-5 w-px bg-border" aria-hidden="true" />

        {/* Share + Comments */}
        {onShare && (
          <button
            type="button"
            onClick={onShare}
            aria-label="Share"
            title="Share"
            className="flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Share className="size-4" />
          </button>
        )}
        {onComments && (
          <button
            type="button"
            onClick={onComments}
            aria-label="Comments"
            title="Comments"
            aria-pressed={commentsActive || undefined}
            className={`flex size-8 items-center justify-center rounded-sm transition-colors ${
              commentsActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <MessageSquare className="size-4" />
          </button>
        )}

        <AccountMenu />
      </div>
    </header>
  )
}
