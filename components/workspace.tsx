'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
import { type Page } from '@/lib/sitemap'
import { supabase } from '@/lib/supabase'

type DbPage = {
  id: string
  project_id: string
  name: string
  slug: string
  parent_id: string | null
  position: number
  sections: unknown[]
}

function dbPageToPage(row: DbPage): Page {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parent_id,
    sections: row.sections as Page['sections'],
  }
}

export function Workspace({ projectId }: { projectId: string }) {
  const [view, setView] = useState<CanvasView>('Style')
  const [shareOpen, setShareOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)

  const [ds, setDs] = useState<DesignSystem>(DEFAULT_DESIGN_SYSTEM)
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)

  // Load DS + pages from Supabase on mount / project change
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function load() {
      const [dsRes, pagesRes] = await Promise.all([
        supabase
          .from('design_systems')
          .select('tokens')
          .eq('project_id', projectId)
          .single(),
        supabase
          .from('pages')
          .select('*')
          .eq('project_id', projectId)
          .order('position'),
      ])

      if (cancelled) return

      if (dsRes.data?.tokens) {
        setDs(dsRes.data.tokens as DesignSystem)
      }

      if (pagesRes.data) {
        setPages(pagesRes.data.map((r: DbPage) => dbPageToPage(r)))
      }

      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [projectId])

  // Debounced save for design system
  const dsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveDs = useCallback(
    (newDs: DesignSystem) => {
      setDs(newDs)
      if (dsTimerRef.current) clearTimeout(dsTimerRef.current)
      dsTimerRef.current = setTimeout(() => {
        supabase
          .from('design_systems')
          .update({ tokens: newDs as unknown as Record<string, unknown>, updated_at: new Date().toISOString() })
          .eq('project_id', projectId)
          .then()
      }, 800)
    },
    [projectId],
  )

  // Debounced save for pages
  const pagesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savePages = useCallback(
    (newPages: Page[]) => {
      setPages(newPages)
      if (pagesTimerRef.current) clearTimeout(pagesTimerRef.current)
      pagesTimerRef.current = setTimeout(() => {
        // Update each page's sections individually
        for (const p of newPages) {
          supabase
            .from('pages')
            .update({ sections: p.sections as unknown as Record<string, unknown>[], updated_at: new Date().toISOString() })
            .eq('id', p.id)
            .then()
        }
      }, 800)
    },
    [],
  )

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <span className="text-[13px] text-muted-foreground">
          Loading project...
        </span>
      </div>
    )
  }

  return (
    <ToastProvider>
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <Topbar view={view} onViewChange={setView} />
      <div className="relative min-h-0 flex-1">
        {view === 'Project' && <ProjectView />}
        {view === 'Style' && <StyleView ds={ds} setDs={saveDs} />}
        {view === 'Content' && <ContentView pages={pages} />}
        {view === 'Sitemap' && (
          <BuildView pages={pages} setPages={savePages} ds={ds} subView="sitemap" />
        )}
        {view === 'Wireframe' && (
          <BuildView pages={pages} setPages={savePages} ds={ds} subView="wireframe" />
        )}
        {view === 'Mockup' && <MockupView />}
        {view === 'Client View' && <ClientView />}

        <div className="absolute right-4 top-4 z-[60]">
          <CanvasActions
            onShare={() => setShareOpen(true)}
            onComments={() => setCommentsOpen((v) => !v)}
            commentsActive={commentsOpen}
          />
        </div>
      </div>

      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} />}
      {commentsOpen && <CommentsPane onClose={() => setCommentsOpen(false)} />}
    </div>
    </ToastProvider>
  )
}
