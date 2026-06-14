'use client'

import Link from 'next/link'
import { Check, User, Heading } from '@/components/icons'
import { ProjectSwitcher } from '@/components/project-switcher'
import { ViewTabs, type CanvasView } from '@/components/canvas/view-tabs'

/**
 * Top chrome bar. Carries the project switcher (left), the main view switcher
 * centered (Project Settings | Style…Mockup | Client View), and save status +
 * account chrome (right). Connections and Settings live inside the Account page.
 */
export function Topbar({
  view,
  onViewChange,
}: {
  view: CanvasView
  onViewChange: (v: CanvasView) => void
}) {
  return (
    <header className="relative flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-4">
      {/* Left — project switcher */}
      <div className="flex items-center">
        <ProjectSwitcher />
      </div>

      {/* Center — main view switcher */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <ViewTabs view={view} onChange={onViewChange} />
      </div>

      <div className="flex-1" />

      {/* Right — status & actions */}
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden items-center gap-1.5 text-[12px] text-muted-foreground md:inline-flex">
          <Check className="size-3.5 text-[#00a32a]" />
          Saved
        </span>
        <Link
          href="/project/content"
          aria-label="Content"
          className="flex size-8 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <Heading className="size-4" />
        </Link>
        <Link
          href="/account"
          aria-label="Account"
          className="flex size-8 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <User className="size-4" />
        </Link>
      </div>
    </header>
  )
}
