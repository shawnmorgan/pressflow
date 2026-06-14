'use client'

import { type ClientProject } from '@/lib/client-portal'
import { useMockups, type Mockup } from '@/lib/mockups'
import {
  CommentThread,
  FieldLabel,
  SectionIntro,
  StatusPill,
  type PortalComment,
} from '@/components/portal/portal-ui'
import { Check } from '@/components/icons'

export function PortalMockups({
  project,
  comments,
  onAddComment,
  approvals,
  onApprove,
}: {
  project: ClientProject
  comments: Record<string, PortalComment[]>
  onAddComment: (targetId: string, body: string) => void
  approvals: Record<string, boolean>
  onApprove: (mockupId: string) => void
}) {
  const mockups = useMockups()
  const pageNameOf = (pageId: string | null) =>
    pageId ? project.pages.find((p) => p.id === pageId)?.name ?? null : null
  const approvedCount = mockups.filter((m) => approvals[m.id]).length

  return (
    <div className="flex flex-col gap-8">
      <SectionIntro
        title="Mockups"
        blurb="High-fidelity designs of your site. Take a look, leave any notes, and approve each one when you’re happy with it."
        action={
          mockups.length > 0 ? (
            <StatusPill tone={approvedCount === mockups.length ? 'done' : 'pending'}>
              {approvedCount === mockups.length && <Check className="size-3" />}
              {approvedCount}/{mockups.length} approved
            </StatusPill>
          ) : undefined
        }
      />

      {mockups.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-card px-5 py-12 text-center">
          <p className="text-[13px] text-muted-foreground">
            Your mockups will appear here as soon as the team shares them.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {mockups.map((mockup) => (
            <MockupReview
              key={mockup.id}
              mockup={mockup}
              domain={project.domain}
              pageName={pageNameOf(mockup.pageId)}
              comments={comments[`mk:${mockup.id}`] ?? []}
              onAddComment={(body) => onAddComment(`mk:${mockup.id}`, body)}
              approved={!!approvals[mockup.id]}
              onApprove={() => onApprove(mockup.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MockupReview({
  mockup,
  domain,
  pageName,
  comments,
  onAddComment,
  approved,
  onApprove,
}: {
  mockup: Mockup
  domain: string
  pageName: string | null
  comments: PortalComment[]
  onAddComment: (body: string) => void
  approved: boolean
  onApprove: () => void
}) {
  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
      <div className="overflow-hidden rounded-sm border border-border bg-card">
        {/* Browser chrome — client's own domain (white-label) */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-3 py-2">
          <span className="size-2.5 rounded-full bg-muted-foreground/40" />
          <span className="size-2.5 rounded-full bg-muted-foreground/40" />
          <span className="size-2.5 rounded-full bg-muted-foreground/40" />
          <span className="ml-2 truncate rounded-sm bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
            {domain}
          </span>
          {approved && (
            <span className="ml-auto">
              <StatusPill tone="done">
                <Check className="size-3" />
                Approved
              </StatusPill>
            </span>
          )}
        </div>
        {mockup.kind === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mockup.imageUrl || '/placeholder.svg'}
            alt={`${mockup.name} mockup`}
            className="max-h-[560px] w-full object-cover object-top"
          />
        ) : (
          <iframe
            title={`${mockup.name} preview`}
            srcDoc={mockup.html}
            sandbox=""
            className="h-[520px] w-full bg-white"
          />
        )}
      </div>

      {/* Comments + approve */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-[14px] font-semibold text-foreground">{mockup.name}</h2>
          {pageName && (
            <span className="text-[11px] text-muted-foreground">For the {pageName} page</span>
          )}
        </div>
        <div className="flex flex-col gap-2 rounded-sm border border-border bg-card p-4">
          <FieldLabel>Your notes</FieldLabel>
          <CommentThread comments={comments} onAdd={onAddComment} />
        </div>
        <button
          type="button"
          onClick={onApprove}
          className={`inline-flex items-center justify-center gap-1.5 rounded-sm px-3.5 py-2.5 text-[12px] font-semibold transition-colors ${
            approved
              ? 'border border-[#0f6b5c]/40 bg-[#0f6b5c]/10 text-[#0b5043]'
              : 'bg-primary text-primary-foreground hover:opacity-90'
          }`}
        >
          <Check className="size-4" />
          {approved ? 'Approved' : 'Approve this mockup'}
        </button>
      </div>
    </section>
  )
}
