'use client'

import Link from 'next/link'
import { ArrowLeft } from '@/components/icons'
import { ToastProvider } from '@/components/ui/toast'
import { MockupsManager } from '@/components/mockups/mockups-manager'

export default function MockupsPage() {
  return (
    <ToastProvider>
      <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
        {/* Header — same shell as Project Details */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
          <Link
            href="/editor"
            aria-label="Back to workspace"
            className="flex size-8 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="text-[15px] font-semibold text-foreground">Mockups</h1>
          <div className="flex-1" />
          <Link
            href="/project"
            className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
          >
            Project details
          </Link>
          <a
            href="/portal/aurora"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
          >
            Open client portal
          </a>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
          <MockupsManager />
        </main>
      </div>
    </ToastProvider>
  )
}
