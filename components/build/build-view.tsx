'use client'

import { useMemo, useState } from 'react'
import {
  type Page,
  type Section,
  type SectionType,
  newSection,
} from '@/lib/sitemap'
import type { DesignSystem } from '@/lib/design-system'
import { InfiniteCanvas } from '@/components/canvas/infinite-canvas'
import { Frame } from '@/components/canvas/frame'
import { TreeLayout } from '@/components/build/tree-layout'
import { PageTree } from '@/components/build/page-tree'
import { SitemapView } from '@/components/build/sitemap-view'
import { WireframeView } from '@/components/build/wireframe-view'
import { StructuralModal } from '@/components/build/structural-modal'
import { ImportPanel } from '@/components/build/import-panel'
import { PageExportModal } from '@/components/build/page-export-modal'
import { Layers, Upload } from '@/components/icons'

type SubView = 'sitemap' | 'wireframe'

type Props = {
  pages: Page[]
  setPages: (fn: (prev: Page[]) => Page[]) => void
  ds: DesignSystem
  subView: SubView
}

const FRAME_WIDTH = 640

export function BuildView({ pages, setPages, ds, subView }: Props) {
  const [activePageId, setActivePageId] = useState<string>(
    () => pages[0]?.id ?? '',
  )
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const view = subView
  const [editing, setEditing] = useState<{ pageId: string; sectionId: string } | null>(null)
  const [navCollapsed, setNavCollapsed] = useState(true)
  const [importOpen, setImportOpen] = useState(false)
  const [exportingPageId, setExportingPageId] = useState<string | null>(null)

  const exportingPage = useMemo(
    () => pages.find((p) => p.id === exportingPageId) ?? null,
    [exportingPageId, pages],
  )

  const editingSection = useMemo(() => {
    if (!editing) return undefined
    return pages
      .find((p) => p.id === editing.pageId)
      ?.sections.find((s) => s.id === editing.sectionId)
  }, [editing, pages])

  /* ---------- Page mutations ---------- */

  const updatePage = (id: string, fn: (p: Page) => Page) =>
    setPages((prev) => prev.map((p) => (p.id === id ? fn(p) : p)))

  const addPage = (parentId: string | null) => {
    const n = pages.filter((p) => p.parentId === parentId).length + 1
    const id = `pg-${Math.random().toString(36).slice(2, 8)}`
    const parent = parentId ? pages.find((p) => p.id === parentId) : null
    const slug = parent
      ? `${parent.slug.replace(/\/$/, '')}/page-${n}`
      : `/page-${n}`
    setPages((prev) => [
      ...prev,
      {
        id,
        name: `New page ${n}`,
        slug,
        parentId,
        sections: [
          newSection('Navbar', 'generated'),
          newSection('Hero', 'generated'),
          newSection('Footer', 'generated'),
        ],
      },
    ])
    setActivePageId(id)
    setSelectedSectionId(null)
  }

  const removePage = (id: string) => {
    const fallback = pages.find((p) => p.id !== id && p.parentId !== id)
    setPages((prev) => prev.filter((p) => p.id !== id && p.parentId !== id))
    if (activePageId === id) {
      setActivePageId(fallback?.id ?? '')
      setSelectedSectionId(null)
    }
  }

  const renamePage = (id: string, name: string) =>
    updatePage(id, (p) => ({ ...p, name }))

  const reparentPage = (id: string, parentId: string | null) => {
    if (id === parentId) return
    // Guard against cycles: a page cannot become a child of its descendant.
    const isDescendant = (rootId: string, candidate: string): boolean => {
      if (rootId === candidate) return true
      return pages
        .filter((p) => p.parentId === rootId)
        .some((c) => isDescendant(c.id, candidate))
    }
    if (parentId && isDescendant(id, parentId)) return
    updatePage(id, (p) => ({ ...p, parentId }))
  }

  const reorderPages = (parentId: string | null, from: number, to: number) => {
    setPages((prev) => {
      const moved = prev.filter((p) => p.parentId === parentId)
      const [item] = moved.splice(from, 1)
      moved.splice(to, 0, item)
      const result: Page[] = []
      let injected = false
      for (const p of prev) {
        if (p.parentId === parentId) {
          if (!injected) {
            result.push(...moved)
            injected = true
          }
        } else {
          result.push(p)
        }
      }
      return result
    })
  }

  /* ---------- Section mutations (page-scoped) ---------- */

  const updateSection = (
    pageId: string,
    sectionId: string,
    fn: (s: Section) => Section,
  ) =>
    updatePage(pageId, (p) => ({
      ...p,
      sections: p.sections.map((s) => (s.id === sectionId ? fn(s) : s)),
    }))

  const reorderSections = (pageId: string, from: number, to: number) =>
    updatePage(pageId, (p) => {
      const next = [...p.sections]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return { ...p, sections: next }
    })

  const removeSection = (pageId: string, sectionId: string) => {
    updatePage(pageId, (p) => ({
      ...p,
      sections: p.sections.filter((s) => s.id !== sectionId),
    }))
    if (selectedSectionId === sectionId) setSelectedSectionId(null)
  }

  const addSection = (pageId: string, index: number, type: SectionType) => {
    const section = newSection(type, 'generated')
    updatePage(pageId, (p) => {
      const next = [...p.sections]
      next.splice(index, 0, section)
      return { ...p, sections: next }
    })
    setActivePageId(pageId)
    setSelectedSectionId(section.id)
  }

  const importSections = (sections: Section[], mode: 'append' | 'replace') => {
    const target = pages.find((p) => p.id === activePageId)
    if (!target) return
    updatePage(target.id, (p) => ({
      ...p,
      sections: mode === 'replace' ? sections : [...p.sections, ...sections],
    }))
    setImportOpen(false)
    setSelectedSectionId(null)
  }

  /* ---------- Empty state ---------- */

  if (!pages.length) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex max-w-md flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground">
            <Layers className="size-5" />
          </span>
          <h2 className="mt-4 text-[15px] font-semibold text-foreground">
            No pages yet
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Add a new page to start building your sitemap, or import sections
            from an HTML file.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => addPage(null)}
              className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Add new page
            </button>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-2 text-[13px] font-medium text-foreground transition-colors hover:border-foreground/30"
            >
              <Upload className="size-3.5" />
              Import
            </button>
          </div>
        </div>
        {importOpen && (
          <ImportPanel
            onClose={() => setImportOpen(false)}
            onImport={(sections) => {
              const id = `pg-${Math.random().toString(36).slice(2, 8)}`
              setPages(() => [
                { id, name: 'Home', slug: '/', parentId: null, sections },
              ])
              setActivePageId(id)
              setImportOpen(false)
            }}
          />
        )}
      </div>
    )
  }

  return (
    <>
      <InfiniteCanvas
        overlay={
          <>
            {/* Contextual controls — left vertical stack */}
            <div className="pointer-events-auto absolute bottom-16 left-4 top-4 flex w-60 flex-col gap-2">
              {/* Import — contextual to the sitemap/wireframe views */}
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                aria-label="Import"
                title="Import"
                className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                <Upload className="size-4" />
              </button>

              {/* Pages navigator — collapsed by default */}
              {navCollapsed ? (
                <button
                  type="button"
                  onClick={() => setNavCollapsed(false)}
                  aria-label="Expand pages"
                  title="Pages"
                  className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  <Layers className="size-4" />
                </button>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border border-border bg-card shadow-sm">
                  <PageTree
                    pages={pages}
                    activePageId={activePageId}
                    selectedSectionId={selectedSectionId}
                    onSelectPage={(id) => {
                      setActivePageId(id)
                      setSelectedSectionId(null)
                    }}
                    onSelectSection={(pageId, sectionId) => {
                      setActivePageId(pageId)
                      setSelectedSectionId(sectionId)
                    }}
                    onAddPage={addPage}
                    onRemovePage={removePage}
                    onRenamePage={renamePage}
                    onReorderPages={reorderPages}
                    onRemoveSection={removeSection}
                    onCollapse={() => setNavCollapsed(true)}
                  />
                </div>
              )}
            </div>
          </>
        }
      >
        {/* Pages laid out as a tidy tree of frames */}
        <TreeLayout
          items={pages.map((p) => ({ id: p.id, parentId: p.parentId }))}
          nodeWidth={FRAME_WIDTH}
          onAddChild={(parentId) => addPage(parentId)}
          onAddRoot={() => addPage(null)}
          onReparent={reparentPage}
          renderNode={(id, handle) => {
            const page = pages.find((p) => p.id === id)
            if (!page) return null
            const isActive = page.id === activePageId
            return (
              <Frame
                title={page.name}
                width={FRAME_WIDTH}
                active={isActive}
                onTitleClick={() => {
                  setActivePageId(page.id)
                  setSelectedSectionId(null)
                }}
                badge={
                  <span className="rounded-sm border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                    {page.slug}
                  </span>
                }
                headerRight={
                  <div className="flex items-center gap-1">
                    {view === 'wireframe' && (
                      <button
                        type="button"
                        onClick={() => setExportingPageId(page.id)}
                        className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-1.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                      >
                        <Upload className="size-3" />
                        Export
                      </button>
                    )}
                    {handle}
                  </div>
                }
              >
                <div
                  className="px-5 py-5"
                  style={{ backgroundColor: 'var(--muted)' }}
                >
                  {view === 'sitemap' ? (
                    <SitemapView
                      page={page}
                      selectedSectionId={selectedSectionId}
                      onSelectSection={(sid) => {
                        setActivePageId(page.id)
                        setSelectedSectionId(sid)
                      }}
                      onReorder={(from, to) => reorderSections(page.id, from, to)}
                      onRemove={(sid) => removeSection(page.id, sid)}
                      onAdd={(index, type) => addSection(page.id, index, type)}
                      onEditStructure={(sid) =>
                        setEditing({ pageId: page.id, sectionId: sid })
                      }
                    />
                  ) : (
                    <WireframeView
                      page={page}
                      selectedSectionId={selectedSectionId}
                      ds={ds}
                      onSelectSection={(sid) => {
                        setActivePageId(page.id)
                        setSelectedSectionId(sid)
                      }}
                      onReorder={(from, to) => reorderSections(page.id, from, to)}
                      onRemove={(sid) => removeSection(page.id, sid)}
                      onAdd={(index, type) => addSection(page.id, index, type)}
                      onEditStructure={(sid) =>
                        setEditing({ pageId: page.id, sectionId: sid })
                      }
                      onUpdateSection={(sid, fn) => updateSection(page.id, sid, fn)}
                    />
                  )}
                </div>
              </Frame>
            )
          }}
        />
      </InfiniteCanvas>

      {/* Structural modal */}
      {editing && editingSection && (
        <StructuralModal
          section={editingSection}
          onClose={() => setEditing(null)}
          onUpdate={(fn) => updateSection(editing.pageId, editing.sectionId, fn)}
        />
      )}

      {/* Import panel */}
      {importOpen && (
        <ImportPanel onClose={() => setImportOpen(false)} onImport={importSections} />
      )}

      {/* Page export modal */}
      {exportingPage && (
        <PageExportModal
          page={exportingPage}
          onClose={() => setExportingPageId(null)}
        />
      )}
    </>
  )
}
