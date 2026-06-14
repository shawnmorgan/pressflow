'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  addSection,
  resetForm,
  saveAsTemplate,
  sendToClient,
  setSectionStatus,
  useContentForm,
  SITE_TYPE_META,
  type ContentForm,
  type FormSection,
} from '@/lib/content-forms'
import { TemplatePicker } from '@/components/content-builder/template-picker'
import { SectionCard } from '@/components/content-builder/section-card'
import {
  ArrowLeft,
  Check,
  Layers,
  Plus,
  Share,
  X,
} from '@/components/icons'

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#646970]">
    {children}
  </span>
)

export default function ContentPage() {
  const form = useContentForm()

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      {/* Header — same shell as Project Details / Mockups */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
        <Link
          href="/editor"
          aria-label="Back to workspace"
          className="flex size-8 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-[15px] font-semibold text-foreground">Content</h1>
        <div className="flex-1" />
        <Link
          href="/project"
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
        >
          Project details
        </Link>
        <Link
          href="/project/mockups"
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
        >
          Mockups
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
        {form ? <Builder form={form} /> : <TemplatePicker />}
      </main>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Builder                                                             */
/* ------------------------------------------------------------------ */

function Builder({ form }: { form: ContentForm }) {
  const [saving, setSaving] = useState(false)

  const submitted = form.sections.filter((s) => s.status === 'submitted').length
  const total = form.sections.length
  const pageCount = form.sections.filter((s) => s.origin === 'page').length
  const siteTypeCount = form.sections.filter((s) => s.origin === 'site-type').length

  return (
    <div className="flex flex-col gap-6">
      {/* Title row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[20px] font-semibold tracking-tight text-foreground text-balance">
            Content collection form
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-card px-1.5 py-0.5 font-medium">
              <Layers className="size-3" />
              {SITE_TYPE_META[form.siteType].label}
            </span>
            <span>
              {pageCount} from sitemap · {siteTypeCount} site-type
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm('Start over? This clears the current form.')) resetForm()
          }}
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <X className="size-3.5" />
          Start over
        </button>
      </div>

      {/* Tracking */}
      <TrackPanel sections={form.sections} sent={form.sent} submitted={submitted} total={total} />

      {/* Sections */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label>Sections</Label>
          <span className="text-[11px] text-muted-foreground">{total} total</span>
        </div>
        {form.sections.map((s, i) => (
          <SectionWithStatus key={s.id} section={s} index={i} count={total} sent={form.sent} />
        ))}
        <button
          type="button"
          onClick={addSection}
          className="inline-flex w-fit items-center gap-1.5 rounded-sm border border-dashed border-border bg-card px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <Plus className="size-4" />
          Add section
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setSaving(true)}
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
        >
          <Layers className="size-3.5" />
          Save as template
        </button>
        {form.sent ? (
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-primary bg-primary/[0.06] px-3 py-2 text-[12px] font-semibold text-primary">
            <Check className="size-3.5" />
            Sent to client
          </span>
        ) : (
          <button
            type="button"
            onClick={sendToClient}
            className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Share className="size-3.5" />
            Send to client
          </button>
        )}
      </div>

      {saving && <SaveTemplateModal onClose={() => setSaving(false)} />}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Section wrapper with collection status                              */
/* ------------------------------------------------------------------ */

function SectionWithStatus({
  section,
  index,
  count,
  sent,
}: {
  section: FormSection
  index: number
  count: number
  sent: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <SectionCard section={section} index={index} count={count} />
      {sent && (
        <div className="flex items-center justify-end gap-2 pr-1">
          {section.status === 'submitted' ? (
            <>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                <Check className="size-3" />
                Content received
              </span>
              <button
                type="button"
                onClick={() => setSectionStatus(section.id, 'outstanding')}
                className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:underline"
              >
                Reopen
              </button>
            </>
          ) : (
            <>
              <span className="text-[11px] font-medium text-[#b26200]">Outstanding</span>
              <button
                type="button"
                onClick={() => setSectionStatus(section.id, 'submitted')}
                className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:underline"
              >
                Mark received
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tracking panel                                                      */
/* ------------------------------------------------------------------ */

function TrackPanel({
  sections,
  sent,
  submitted,
  total,
}: {
  sections: FormSection[]
  sent: boolean
  submitted: number
  total: number
}) {
  if (!sent) {
    return (
      <div className="rounded-sm border border-dashed border-border bg-card px-4 py-3">
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Build out the sections below, then{' '}
          <span className="font-medium text-foreground">Send to client</span> to start
          collecting. You’ll track submitted vs outstanding sections here.
        </p>
      </div>
    )
  }
  const pct = total ? Math.round((submitted / total) * 100) : 0
  return (
    <div className="flex flex-col gap-2.5 rounded-sm border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <Label>Collection status</Label>
        <span className="text-[12px] font-medium text-foreground">
          {submitted}/{total} sections received
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        {sections.filter((s) => s.status === 'outstanding').length} section
        {sections.filter((s) => s.status === 'outstanding').length === 1 ? '' : 's'} still
        outstanding. Submitted page content flows into the matching wireframe slots; site-type
        content is stored on the project for the build.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Save-as-template modal                                              */
/* ------------------------------------------------------------------ */

function SaveTemplateModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-sm border border-border bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[15px] font-semibold text-foreground">Save as template</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
          Save these site-type sections as a reusable, account-level template. Sitemap-derived
          sections are re-seeded per project, so they aren’t saved.
        </p>
        <label className="mt-4 flex flex-col gap-1.5">
          <Label>Template name</Label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Local service business"
            className="rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </label>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={() => {
              saveAsTemplate(name)
              onClose()
            }}
            className="rounded-sm bg-primary px-3.5 py-1.5 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save template
          </button>
        </div>
      </div>
    </div>
  )
}
