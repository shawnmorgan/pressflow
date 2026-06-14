'use client'

import { InfiniteCanvas } from '@/components/canvas/infinite-canvas'
import { Frame } from '@/components/canvas/frame'
import { TypeIcon } from '@/components/icons'
import { type Page } from '@/lib/sitemap'

/**
 * Content view — a canvas surface for drafting the copy that fills each page's
 * sections. Pages are listed as frames so writers can work alongside the
 * sitemap/wireframe structure.
 */
export function ContentView({ pages }: { pages: Page[] }) {
  return (
    <InfiniteCanvas>
      <div className="flex items-start gap-10 p-24 pl-72">
        {pages.map((page) => (
          <div key={page.id} className="shrink-0">
            <Frame
              title={page.name}
              width={420}
              badge={
                <span className="rounded-sm border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                  {page.slug}
                </span>
              }
            >
              <div className="flex flex-col divide-y divide-border">
                {page.sections.length === 0 ? (
                  <div className="px-4 py-6 text-[12px] text-muted-foreground">
                    No sections yet. Add structure in the Sitemap view.
                  </div>
                ) : (
                  page.sections.map((section) => (
                    <div key={section.id} className="px-4 py-3">
                      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        <TypeIcon className="size-3" />
                        {section.type}
                      </div>
                      <p className="text-[13px] leading-relaxed text-foreground">
                        {section.elements.heading?.text ||
                          section.elements.subheading?.text ||
                          section.elements.body?.text ||
                          'Draft copy for this section…'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Frame>
          </div>
        ))}
      </div>
    </InfiniteCanvas>
  )
}
