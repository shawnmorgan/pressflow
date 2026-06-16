'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Topbar } from '@/components/topbar'
import { type CanvasView } from '@/components/canvas/view-tabs'
import { ProjectView } from '@/components/project/project-view'
import { StyleView } from '@/components/style/style-view'
import { ContentView } from '@/components/content/content-view'
import { BuildView } from '@/components/build/build-view'
import { MockupView } from '@/components/mockup/mockup-view'
import { CommentsPane } from '@/components/comments/comments-pane'
import { ToastProvider, useToast } from '@/components/ui/toast'
import {
  DEFAULT_DESIGN_SYSTEM,
  type DesignSystem,
} from '@/lib/design-system'
import { type Page, migratePage } from '@/lib/sitemap'
import { supabase } from '@/lib/supabase'
import { useMockupsLoader } from '@/lib/mockups'
import { useContentFormLoader } from '@/lib/content-forms'
import { useUndoRedo } from '@/lib/undo-redo'
import { FramePositionsProvider } from '@/lib/frame-positions'

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
  return (
    <ToastProvider>
      <FramePositionsProvider>
        <WorkspaceInner projectId={projectId} />
      </FramePositionsProvider>
    </ToastProvider>
  )
}

function WorkspaceInner({ projectId }: { projectId: string }) {
  const { showToast } = useToast()
  const [view, setView] = useState<CanvasView>('Project')
  const [loading, setLoading] = useState(true)

  const {
    state: ds,
    setState: setDsUndo,
    reset: resetDs,
    undo: undoDs,
    redo: redoDs,
    canUndo: canUndoDs,
    canRedo: canRedoDs,
  } = useUndoRedo<DesignSystem>(DEFAULT_DESIGN_SYSTEM)

  const {
    state: pages,
    setState: setPagesUndo,
    reset: resetPages,
    undo: undoPages,
    redo: redoPages,
    canUndo: canUndoPages,
    canRedo: canRedoPages,
  } = useUndoRedo<Page[]>([])

  // Load mockups and content form for this project
  useMockupsLoader(projectId)
  useContentFormLoader(projectId)

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
        resetDs(dsRes.data.tokens as DesignSystem)
      }

      if (pagesRes.data) {
        resetPages(pagesRes.data.map((r: DbPage) => migratePage(dbPageToPage(r))))
      }

      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
      if (dsTimerRef.current) clearTimeout(dsTimerRef.current)
      if (pagesTimerRef.current) clearTimeout(pagesTimerRef.current)
    }
  }, [projectId, resetDs, resetPages])

  // Debounced persist for design system
  const dsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!loadedRef.current) {
      if (!loading) loadedRef.current = true
      return
    }
    if (dsTimerRef.current) clearTimeout(dsTimerRef.current)
    dsTimerRef.current = setTimeout(() => {
      supabase
        .from('design_systems')
        .update({ tokens: ds as unknown as Record<string, unknown>, updated_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .then(() => showToast('Saved'))
    }, 800)
  }, [ds, projectId, loading, showToast])

  // Debounced persist for pages — full sync (insert/update/delete)
  const pagesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pagesLoadedRef = useRef(false)
  const dbPageIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!pagesLoadedRef.current) {
      if (!loading) {
        pagesLoadedRef.current = true
        dbPageIdsRef.current = new Set(pages.map((p) => p.id))
      }
      return
    }
    if (pagesTimerRef.current) clearTimeout(pagesTimerRef.current)
    pagesTimerRef.current = setTimeout(async () => {
      const now = new Date().toISOString()
      const currentIds = new Set(pages.map((p) => p.id))
      const prevIds = dbPageIdsRef.current

      // Delete removed pages
      const deleted = [...prevIds].filter((id) => !currentIds.has(id))
      if (deleted.length > 0) {
        await supabase.from('pages').delete().in('id', deleted)
      }

      // Upsert all current pages (handles both new and updated)
      if (pages.length > 0) {
        await supabase.from('pages').upsert(
          pages.map((p, i) => ({
            id: p.id,
            project_id: projectId,
            name: p.name,
            slug: p.slug,
            parent_id: p.parentId,
            position: i,
            sections: p.sections as unknown as Record<string, unknown>[],
            updated_at: now,
          })),
          { onConflict: 'id' },
        )
      }

      dbPageIdsRef.current = currentIds
      showToast('Saved')
    }, 800)
  }, [pages, projectId, loading, showToast])

  // Undo/redo — pick the right stack based on current view
  const canUndo = view === 'Style' ? canUndoDs : view === 'Structure' ? canUndoPages : false
  const canRedo = view === 'Style' ? canRedoDs : view === 'Structure' ? canRedoPages : false

  const handleUndo = useCallback(() => {
    if (view === 'Style') undoDs()
    else if (view === 'Structure') undoPages()
  }, [view, undoDs, undoPages])

  const handleRedo = useCallback(() => {
    if (view === 'Style') redoDs()
    else if (view === 'Structure') redoPages()
  }, [view, redoDs, redoPages])

  // Keyboard shortcuts: Cmd+Z / Cmd+Shift+Z
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      e.preventDefault()
      if (e.shiftKey) handleRedo()
      else handleUndo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleUndo, handleRedo])

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
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <Topbar
        view={view}
        onViewChange={setView}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />
      <div className="relative min-h-0 flex-1">
        {view === 'Project' && <ProjectView projectId={projectId} />}
        {view === 'Style' && <StyleView ds={ds} setDs={setDsUndo} />}
        {view === 'Content' && <ContentView projectId={projectId} />}
        {view === 'Structure' && (
          <BuildView pages={pages} setPages={setPagesUndo} ds={ds} />
        )}
        {view === 'Mockups' && <MockupView />}
        {view === 'Comments' && <CommentsPane onClose={() => setView('Project')} projectId={projectId} />}
      </div>
    </div>
  )
}
