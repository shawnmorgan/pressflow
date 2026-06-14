'use client'

import { useState } from 'react'
import {
  collectableSections,
  sectionContentFields,
  type ClientProject,
} from '@/lib/client-portal'
import { sectionLabel, type Section } from '@/lib/sitemap'
import { FieldLabel, SectionIntro, StatusPill } from '@/components/portal/portal-ui'
import { Check, ChevronDown, ChevronRight, Pencil } from '@/components/icons'

export type ContentStatus = 'outstanding' | 'submitted'

export function PortalContent({
  project,
  values,
  statuses,
  onFieldChange,
  onSubmitSection,
  onReopenSection,
}: {
  project: ClientProject
  values: Record<string, Record<string, string>>
  statuses: Record<string, ContentStatus>
  onFieldChange: (sectionId: string, key: string, value: string) => void
  onSubmitSection: (sectionId: string) => void
  onReopenSection: (sectionId: string) => void
}) {
  const sectionsByPage = project.pages
    .map((p) => ({ page: p, sections: collectableSections(p) }))
    .filter((g) => g.sections.length > 0)

  const allSections = sectionsByPage.flatMap((g) => g.sections)
  const submitted = allSections.filter((s) => statuses[s.id] === 'submitted').length
  const total = allSections.length

  return (
    <div className="flex flex-col gap-8">
      <SectionIntro
        title="Content collection"
        blurb="Add or refine the copy for each section. Submit a section when it’s ready — we’ll take it from there."
        action={
          <StatusPill tone={submitted === total ? 'done' : 'pending'}>
            {submitted === total && <Check className="size-3" />}
            {submitted}/{total} submitted
          </StatusPill>
        }
      />

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${total ? (submitted / total) * 100 : 0}%` }}
        />
      </div>

      {sectionsByPage.map((group) => (
        <section key={group.page.id} className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-[14px] font-semibold text-foreground">
              {group.page.name}
            </h2>
            <span className="font-mono text-[11px] text-muted-foreground">
              {group.page.slug}
            </span>
          </div>
          {group.sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              status={statuses[section.id] ?? 'outstanding'}
              values={values[section.id] ?? {}}
              onFieldChange={(key, value) => onFieldChange(section.id, key, value)}
              onSubmit={() => onSubmitSection(section.id)}
              onReopen={() => onReopenSection(section.id)}
            />
          ))}
        </section>
      ))}
    </div>
  )
}

function SectionCard({
  section,
  status,
  values,
  onFieldChange,
  onSubmit,
  onReopen,
}: {
  section: Section
  status: ContentStatus
  values: Record<string, string>
  onFieldChange: (key: string, value: string) => void
  onSubmit: () => void
  onReopen: () => void
}) {
  const fields = sectionContentFields(section)
  const submittedState = status === 'submitted'
  const [open, setOpen] = useState(!submittedState)

  const valueFor = (key: string, draft: string) =>
    values[key] !== undefined ? values[key] : draft
  const filled = fields.filter((f) => valueFor(f.key, f.draft).trim().length > 0).length

  return (
    <div className="overflow-hidden rounded-sm border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="text-muted-foreground">
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </span>
        <span className="flex-1 text-[13px] font-medium text-foreground">
          {sectionLabel(section)}
        </span>
        {submittedState ? (
          <StatusPill tone="done">
            <Check className="size-3" />
            Submitted
          </StatusPill>
        ) : (
          <StatusPill tone="pending">
            {filled}/{fields.length} filled
          </StatusPill>
        )}
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <label
                key={field.key}
                className={`flex flex-col gap-1.5 ${field.kind === 'long' ? 'sm:col-span-2' : ''}`}
              >
                <FieldLabel>{field.label}</FieldLabel>
                {field.kind === 'long' ? (
                  <textarea
                    value={valueFor(field.key, field.draft)}
                    onChange={(e) => onFieldChange(field.key, e.target.value)}
                    rows={3}
                    disabled={submittedState}
                    className="w-full resize-y rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] leading-relaxed text-foreground outline-none focus:border-primary disabled:opacity-70"
                  />
                ) : (
                  <input
                    value={valueFor(field.key, field.draft)}
                    onChange={(e) => onFieldChange(field.key, e.target.value)}
                    disabled={submittedState}
                    className="w-full rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-primary disabled:opacity-70"
                  />
                )}
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
            {submittedState ? (
              <button
                type="button"
                onClick={onReopen}
                className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
              >
                <Pencil className="size-3.5" />
                Edit again
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-1.5 text-[12px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Submit section
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
