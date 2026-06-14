'use client'

import { useState } from 'react'
import { Topbar } from '@/components/topbar'
import { type CanvasView } from '@/components/canvas/view-tabs'
import { CanvasActions } from '@/components/canvas/canvas-actions'
import { ProjectView } from '@/components/project/project-view'
import { StyleView } from '@/components/style/style-view'
import { ContentView } from '@/components/content/content-view'
import { BuildView } from '@/components/build/build-view'
import { MockupView } from '@/components/mockup/mockup-view'
import { ClientView } from '@/components/client/client-view'
import { ShareModal } from '@/components/share/share-modal'
import { CommentsPane } from '@/components/comments/comments-pane'
import { ToastProvider } from '@/components/ui/toast'
import {
  DEFAULT_DESIGN_SYSTEM,
  type DesignSystem,
} from '@/lib/design-system'
import { DEFAULT_PAGES, type Page } from '@/lib/sitemap'

export function Workspace() {
  const [view, setView] = useState<CanvasView>('Style')

  // Top-right action surfaces.
  const [shareOpen, setShareOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)

  // The rich design system — single source of truth for the Style view.
  const [ds, setDs] = useState<DesignSystem>(DEFAULT_DESIGN_SYSTEM)

  // Sitemap — pages assembled in the Build views.
  const [pages, setPages] = useState<Page[]>(DEFAULT_PAGES)

  return (
    <ToastProvider>
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <Topbar view={view} onViewChange={setView} />
      <div className="relative min-h-0 flex-1">
        {view === 'Project' && <ProjectView />}
        {view === 'Style' && <StyleView ds={ds} setDs={setDs} />}
        {view === 'Content' && <ContentView pages={pages} />}
        {view === 'Sitemap' && (
          <BuildView pages={pages} setPages={setPages} ds={ds} subView="sitemap" />
        )}
        {view === 'Wireframe' && (
          <BuildView pages={pages} setPages={setPages} ds={ds} subView="wireframe" />
        )}
        {view === 'Mockup' && <MockupView />}
        {view === 'Client View' && <ClientView />}

        {/* Floating actions — top-right, above the canvas. */}
        <div className="absolute right-4 top-4 z-[60]">
          <CanvasActions
            onShare={() => setShareOpen(true)}
            onComments={() => setCommentsOpen((v) => !v)}
            commentsActive={commentsOpen}
          />
        </div>
      </div>

      {/* Share modal */}
      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} />}

      {/* Comments slide-out */}
      {commentsOpen && <CommentsPane onClose={() => setCommentsOpen(false)} />}
    </div>
    </ToastProvider>
  )
}
