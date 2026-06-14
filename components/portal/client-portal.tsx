'use client'

import { useState } from 'react'
import { type ClientProject, STAGE_META } from '@/lib/client-portal'
import {
  Briefcase,
  ImageIcon,
  Palette,
  Sparkles,
  TypeIcon,
} from '@/components/icons'
import { type PortalComment } from '@/components/portal/portal-ui'
import { PortalOverview } from '@/components/portal/portal-overview'
import { PortalStyleGuide } from '@/components/portal/portal-style-guide'
import { PortalContent, type ContentStatus } from '@/components/portal/portal-content'
import { PortalWireframe } from '@/components/portal/portal-wireframe'
import { PortalMockups } from '@/components/portal/portal-mockups'

export type PortalSectionKey =
  | 'overview'
  | 'style'
  | 'content'
  | 'wireframe'
  | 'mockups'

const NAV: { key: PortalSectionKey; label: string; icon: typeof Briefcase }[] = [
  { key: 'overview', label: 'Overview', icon: Briefcase },
  { key: 'style', label: 'Style Guide', icon: Palette },
  { key: 'content', label: 'Content', icon: TypeIcon },
  { key: 'wireframe', label: 'Wireframe', icon: ImageIcon },
  { key: 'mockups', label: 'Mockups', icon: Sparkles },
]

let commentSeq = 0

export function ClientPortal({ project }: { project: ClientProject }) {
  const [active, setActive] = useState<PortalSectionKey>('overview')

  // Content collection
  const [contentValues, setContentValues] = useState<
    Record<string, Record<string, string>>
  >({})
  const [contentStatuses, setContentStatuses] = useState<Record<string, ContentStatus>>({})

  // Comments (wireframe + mockups) keyed by target id
  const [comments, setComments] = useState<Record<string, PortalComment[]>>({})

  // Mockup approvals keyed by page id
  const [approvals, setApprovals] = useState<Record<string, boolean>>({})

  const addComment = (targetId: string, body: string) => {
    commentSeq += 1
    const comment: PortalComment = {
      id: `c-${commentSeq}`,
      author: project.clientName,
      body,
      at: 'Just now',
    }
    setComments((prev) => ({
      ...prev,
      [targetId]: [...(prev[targetId] ?? []), comment],
    }))
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* White-label header — agency branding, never "PressFlow" */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-5 py-3.5">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-sm text-[13px] font-bold text-white"
            style={{ backgroundColor: project.agency.accent }}
            aria-hidden="true"
          >
            {project.agency.initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-semibold leading-tight text-foreground">
              {project.agency.name}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {project.projectName} · client portal
            </div>
          </div>
          <a
            href={`mailto:${project.agency.contactEmail}`}
            className="hidden shrink-0 rounded-sm border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30 sm:inline-block"
          >
            Contact us
          </a>
        </div>

        {/* Section nav */}
        <nav className="mx-auto max-w-4xl px-3">
          <ul className="flex items-center gap-1 overflow-x-auto">
            {NAV.map((item) => {
              const Icon = item.icon
              const isActive = active === item.key
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => setActive(item.key)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-[12px] font-medium transition-colors ${
                      isActive
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="size-3.5" />
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </header>

      {/* Body */}
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-5 py-8">
          {active === 'overview' && (
            <PortalOverview project={project} onNavigate={setActive} />
          )}
          {active === 'style' && <PortalStyleGuide project={project} />}
          {active === 'content' && (
            <PortalContent
              project={project}
              values={contentValues}
              statuses={contentStatuses}
              onFieldChange={(sectionId, key, value) =>
                setContentValues((prev) => ({
                  ...prev,
                  [sectionId]: { ...(prev[sectionId] ?? {}), [key]: value },
                }))
              }
              onSubmitSection={(sectionId) =>
                setContentStatuses((prev) => ({ ...prev, [sectionId]: 'submitted' }))
              }
              onReopenSection={(sectionId) =>
                setContentStatuses((prev) => ({ ...prev, [sectionId]: 'outstanding' }))
              }
            />
          )}
          {active === 'wireframe' && (
            <PortalWireframe
              project={project}
              comments={comments}
              onAddComment={addComment}
            />
          )}
          {active === 'mockups' && (
            <PortalMockups
              project={project}
              comments={comments}
              onAddComment={addComment}
              approvals={approvals}
              onApprove={(pageId) =>
                setApprovals((prev) => ({ ...prev, [pageId]: !prev[pageId] }))
              }
            />
          )}
        </div>
      </main>

      {/* Calm footer with stage context */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-4xl flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[11px] text-muted-foreground">
            Current stage: <span className="font-medium text-foreground">{STAGE_META[project.stage].label}</span> · {STAGE_META[project.stage].blurb}
          </span>
          <span className="text-[11px] text-muted-foreground">
            A private workspace for {project.clientName}
          </span>
        </div>
      </footer>
    </div>
  )
}
