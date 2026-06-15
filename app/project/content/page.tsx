'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft } from '@/components/icons'
import { ContentView } from '@/components/content/content-view'
import { useContentFormLoader } from '@/lib/content-forms'

function ContentPageInner() {
  const params = useSearchParams()
  const projectId = params.get('project') ?? undefined
  useContentFormLoader(projectId ?? null)

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
        <Link
          href={projectId ? `/editor?project=${projectId}` : '/'}
          aria-label="Back to workspace"
          className="flex size-8 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-[15px] font-semibold text-foreground">Content</h1>
      </header>
      <main className="relative min-h-0 flex-1">
        <ContentView projectId={projectId} />
      </main>
    </div>
  )
}

export default function ContentPage() {
  return (
    <Suspense>
      <ContentPageInner />
    </Suspense>
  )
}
