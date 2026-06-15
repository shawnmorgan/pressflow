'use client'

import { type ClientProject } from '@/lib/client-portal'
import { sectionLabel, type Page, type Section } from '@/lib/sitemap'
import {
  CommentThread,
  FieldLabel,
  SectionIntro,
  type PortalComment,
} from '@/components/portal/portal-ui'

export function PortalWireframe({
  project,
  comments,
  onAddComment,
}: {
  project: ClientProject
  comments: Record<string, PortalComment[]>
  onAddComment: (targetId: string, body: string) => void
}) {
  return (
    <div className="flex flex-col gap-8">
      <SectionIntro
        title="Wireframes"
        blurb="Low-fidelity layouts showing the structure of each page before visual design. Leave notes — we’ll fold them into the mockups."
      />

      <div className="flex flex-col gap-8">
        {project.pages.map((page) => (
          <WireframePage
            key={page.id}
            page={page}
            comments={comments[`wf:${page.id}`] ?? []}
            onAddComment={(body) => onAddComment(`wf:${page.id}`, body)}
          />
        ))}
      </div>
    </div>
  )
}

function WireframePage({
  page,
  comments,
  onAddComment,
}: {
  page: Page
  comments: PortalComment[]
  onAddComment: (body: string) => void
}) {
  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
      {/* Wireframe render */}
      <div className="overflow-hidden rounded-sm border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <span className="text-[13px] font-semibold text-foreground">{page.name}</span>
          <span className="font-mono text-[11px] text-muted-foreground">{page.slug}</span>
        </div>
        <div className="flex flex-col gap-3 bg-muted/40 p-4">
          {page.sections.map((section) => (
            <WireframeSection key={section.id} section={section} />
          ))}
        </div>
      </div>

      {/* Comments */}
      <div className="flex flex-col gap-2 rounded-sm border border-border bg-card p-4">
        <FieldLabel>Notes on {page.name}</FieldLabel>
        <CommentThread comments={comments} onAdd={onAddComment} />
      </div>
    </section>
  )
}

const Bar = ({ w, h = 8 }: { w: string; h?: number }) => (
  <div className="rounded-sm bg-muted-foreground/25" style={{ width: w, height: h }} />
)

function WireframeSection({ section }: { section: Section }) {
  const e = section.elements
  const isNav = section.type === 'Navbar'
  const isFooter = section.type === 'Footer'

  return (
    <div className="rounded-sm border border-dashed border-muted-foreground/30 bg-background p-4">
      <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[#646970]">
        {sectionLabel(section)}
      </div>

      {isNav ? (
        <div className="flex items-center justify-between">
          <Bar w="80px" h={14} />
          <div className="flex items-center gap-3">
            <Bar w="40px" />
            <Bar w="40px" />
            <Bar w="40px" />
            <div className="h-6 w-16 rounded-sm bg-muted-foreground/30" />
          </div>
        </div>
      ) : isFooter ? (
        <div className="flex items-center justify-between">
          <Bar w="120px" />
          <div className="flex gap-3">
            <Bar w="36px" />
            <Bar w="36px" />
            <Bar w="36px" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2.5 py-2 text-center">
          {e.eyebrow.on && <Bar w="90px" h={6} />}
          {e.heading.on && <Bar w="60%" h={18} />}
          {e.subheading.on && <Bar w="45%" />}
          {e.body.on && (
            <div className="flex w-full max-w-[420px] flex-col items-center gap-1.5">
              <Bar w="80%" h={6} />
              <Bar w="70%" h={6} />
            </div>
          )}
          {e.image.on && (
            <div className="mt-1 h-24 w-full max-w-[440px] rounded-sm bg-muted-foreground/15" />
          )}
          {section.cards.length > 0 && (
            <div className="mt-1 grid w-full grid-cols-3 gap-3">
              {section.cards.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col items-center gap-1.5 rounded-sm bg-muted-foreground/10 p-3"
                >
                  <div className="size-6 rounded-full bg-muted-foreground/25" />
                  <Bar w="70%" h={6} />
                  <Bar w="50%" h={6} />
                </div>
              ))}
            </div>
          )}
          {e.buttons.length > 0 && (
            <div className="mt-1 flex gap-2">
              {e.buttons.map((b) => (
                <div key={b.id} className="h-7 w-20 rounded-sm bg-muted-foreground/30" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
