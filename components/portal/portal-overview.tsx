'use client'

import {
  PORTAL_STAGES,
  STAGE_META,
  type ClientProject,
  type PortalStage,
} from '@/lib/client-portal'
import type { PortalSectionKey } from '@/components/portal/client-portal'
import { FieldLabel, SectionIntro } from '@/components/portal/portal-ui'
import {
  ArrowRight,
  Calendar,
  Check,
  ExternalLink,
  LinkIcon,
} from '@/components/icons'

type NextAction = {
  title: string
  detail: string
  target: PortalSectionKey | null
  cta: string
}

function nextActionFor(stage: PortalStage): NextAction {
  switch (stage) {
    case 'onboarding':
      return {
        title: 'Getting started',
        detail:
          'We’re gathering the details we need about your business to tailor the design. We’ll reach out if anything’s missing.',
        target: null,
        cta: '',
      }
    case 'content':
      return {
        title: 'Add your page content',
        detail: 'Fill in the copy for each section, then submit it for review.',
        target: 'content',
        cta: 'Collect content',
      }
    case 'design':
      return {
        title: 'We’re designing your site',
        detail: 'No action needed right now. We’ll let you know when it’s ready to review.',
        target: 'style',
        cta: 'View style guide',
      }
    case 'approval':
      return {
        title: 'Review & approve',
        detail: 'Look over the wireframes and mockups, leave notes, and approve.',
        target: 'mockups',
        cta: 'Review mockups',
      }
    case 'build':
      return {
        title: 'We’re building your site',
        detail: 'Your approved design is being assembled into the live theme.',
        target: null,
        cta: '',
      }
    case 'live':
      return {
        title: 'Your site is live',
        detail: 'Everything is published. Reach out any time for changes.',
        target: null,
        cta: '',
      }
  }
}

export function PortalOverview({
  project,
  onNavigate,
}: {
  project: ClientProject
  onNavigate: (key: PortalSectionKey) => void
}) {
  const stageIndex = PORTAL_STAGES.indexOf(project.stage)
  const action = nextActionFor(project.stage)

  return (
    <div className="flex flex-col gap-8">
      <SectionIntro
        title={`Welcome, ${project.clientName}`}
        blurb={`Here’s where ${project.projectName} stands and what happens next. ${project.agency.name} updates this as we go.`}
      />

      {/* Stage tracker — Domino's-style progress */}
      <section className="rounded-sm border border-border bg-card p-5">
        <FieldLabel>Project progress</FieldLabel>
        <ol className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-0">
          {PORTAL_STAGES.map((s, i) => {
            const isComplete = i < stageIndex
            const isCurrent = i === stageIndex
            return (
              <li
                key={s}
                className="flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center"
              >
                <div className="flex items-center sm:w-full">
                  {/* connector left */}
                  <span
                    className={`hidden h-0.5 flex-1 sm:block ${
                      i === 0 ? 'opacity-0' : isComplete || isCurrent ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-[12px] font-semibold ${
                      isComplete
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isCurrent
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-muted-foreground'
                    }`}
                  >
                    {isComplete ? <Check className="size-4" /> : i + 1}
                  </span>
                  {/* connector right */}
                  <span
                    className={`hidden h-0.5 flex-1 sm:block ${
                      i === PORTAL_STAGES.length - 1
                        ? 'opacity-0'
                        : isComplete
                          ? 'bg-primary'
                          : 'bg-border'
                    }`}
                  />
                </div>
                <div className="min-w-0 sm:px-1">
                  <div
                    className={`text-[12px] font-semibold ${
                      isCurrent ? 'text-primary' : isComplete ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {STAGE_META[s].label}
                  </div>
                  {isCurrent && (
                    <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                      {STAGE_META[s].blurb}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      {/* Next action */}
      <section className="rounded-sm border border-primary/30 bg-primary/[0.04] p-5">
        <FieldLabel>Your next step</FieldLabel>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">
              {action.title}
            </h2>
            <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
              {action.detail}
            </p>
          </div>
          {action.target && (
            <button
              type="button"
              onClick={() => action.target && onNavigate(action.target)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {action.cta}
              <ArrowRight className="size-3.5" />
            </button>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Schedule */}
        <section className="rounded-sm border border-border bg-card p-5">
          <FieldLabel>Schedule a call</FieldLabel>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
            Book time with the {project.agency.name} team whenever you need to
            talk things through.
          </p>
          {project.calendarLink ? (
            <a
              href={project.calendarLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
            >
              <Calendar className="size-3.5 text-muted-foreground" />
              Book a time
              <ExternalLink className="size-3.5 text-muted-foreground" />
            </a>
          ) : (
            <div className="mt-3 text-[12px] text-muted-foreground">
              No scheduling link yet.
            </div>
          )}
        </section>

        {/* Relevant links */}
        <section className="rounded-sm border border-border bg-card p-5">
          <FieldLabel>Documents &amp; links</FieldLabel>
          {project.links.length ? (
            <ul className="mt-3 flex flex-col gap-2">
              {project.links.map((l) => (
                <li key={l.id}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-sm border border-border bg-background px-3 py-2 transition-colors hover:border-foreground/30"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground">
                      <LinkIcon className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-foreground">
                      {l.label}
                    </span>
                    <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 text-[12px] text-muted-foreground">
              No documents shared yet.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
