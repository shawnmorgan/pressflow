'use client'

import Link from 'next/link'
import { ArrowLeft } from '@/components/icons'
import { ContentView } from '@/components/content/content-view'
import { useContentFormLoader } from '@/lib/content-forms'

/**
 * Standalone content page — wraps the canvas ContentView in a full-page shell.
 * The real home for content is the Content canvas tab in the workspace.
 */
export default function ContentPage() {
  // No projectId available on this standalone route — load nothing.
  // TODO: resolve projectId from URL params or redirect to workspace.
  useContentFormLoader(null)

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
        <Link
          href="/editor"
          aria-label="Back to workspace"
          className="flex size-8 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-[15px] font-semibold text-foreground">Content</h1>
      </header>
      <main className="relative min-h-0 flex-1">
        <ContentView />
      </main>
    </div>
  )
}
