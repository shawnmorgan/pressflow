'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Check,
  Eye,
  ExternalLink,
  Heading,
  LinkIcon,
  Pencil,
  Plus,
  Sparkles,
  Trash,
  X,
} from '@/components/icons'

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#646970]">
    {children}
  </span>
)

const STAGES = [
  'onboarding',
  'content',
  'design',
  'approval',
  'build',
  'live',
] as const
type Stage = (typeof STAGES)[number]

const TARGETS = [
  { value: 'wordpress', label: 'WordPress', detail: 'Standard block theme' },
  { value: 'ollie', label: 'Ollie', detail: 'Ollie-based starter theme' },
] as const

type RelevantLink = {
  id: string
  label: string
  url: string
}

const INITIAL_LINKS: RelevantLink[] = [
  { id: 'l1', label: 'Signed contract', url: 'https://drive.example.com/contract' },
  { id: 'l2', label: 'Invoice #0042', url: 'https://billing.example.com/0042' },
  { id: 'l3', label: 'Shared drive', url: 'https://drive.example.com/aurora' },
]

export default function ProjectDetailsPage() {
  return (
    <Suspense>
      <ProjectDetailsInner />
    </Suspense>
  )
}

function ProjectDetailsInner() {
  const params = useSearchParams()
  const projectId = params.get('project') ?? ''
  const [projectName, setProjectName] = useState('Aurora Press')
  const [clientName, setClientName] = useState('Aurora Coffee Roasters')
  const [stage, setStage] = useState<Stage>('design')
  const [target, setTarget] = useState<string>('wordpress')
  const [calendarLink, setCalendarLink] = useState(
    'https://cal.com/aurorapress/intro',
  )

  const [links, setLinks] = useState<RelevantLink[]>(INITIAL_LINKS)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftLabel, setDraftLabel] = useState('')
  const [draftUrl, setDraftUrl] = useState('')
  const [adding, setAdding] = useState(false)

  const [showClientView, setShowClientView] = useState(false)

  const stageIndex = STAGES.indexOf(stage)

  const startAdd = () => {
    setAdding(true)
    setEditingId(null)
    setDraftLabel('')
    setDraftUrl('')
  }

  const startEdit = (link: RelevantLink) => {
    setEditingId(link.id)
    setAdding(false)
    setDraftLabel(link.label)
    setDraftUrl(link.url)
  }

  const cancelDraft = () => {
    setAdding(false)
    setEditingId(null)
    setDraftLabel('')
    setDraftUrl('')
  }

  const saveDraft = () => {
    const label = draftLabel.trim()
    const url = draftUrl.trim()
    if (!label || !url) return
    if (adding) {
      setLinks((prev) => [
        ...prev,
        { id: `l${Date.now()}`, label, url },
      ])
    } else if (editingId) {
      setLinks((prev) =>
        prev.map((l) => (l.id === editingId ? { ...l, label, url } : l)),
      )
    }
    cancelDraft()
  }

  const removeLink = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id))
    if (editingId === id) cancelDraft()
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
        <Link
          href={projectId ? `/editor?project=${projectId}` : '/'}
          aria-label="Back to workspace"
          className="flex size-8 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-[15px] font-semibold text-foreground">
          Project Details
        </h1>
        <div className="flex-1" />
        <Link
          href={`/project/content${projectId ? `?project=${projectId}` : ''}`}
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
        >
          <Heading className="size-3.5" />
          Content
        </Link>
        <Link
          href={`/project/mockups${projectId ? `?project=${projectId}` : ''}`}
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
        >
          <Sparkles className="size-3.5" />
          Mockups
        </Link>
        <a
          href="/portal/aurora"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
        >
          <ExternalLink className="size-3.5" />
          Open client portal
        </a>
        <button
          type="button"
          onClick={() => setShowClientView((v) => !v)}
          aria-pressed={showClientView}
          className={`inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-[12px] font-medium transition-colors ${
            showClientView
              ? 'border-primary bg-primary/[0.06] text-primary'
              : 'border-border bg-card text-foreground hover:border-foreground/30'
          }`}
        >
          <Eye className="size-3.5" />
          {showClientView ? 'Hide client view' : 'What the client sees'}
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-10 px-5 py-8">
          {/* Overview */}
          <section>
            <h2 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
              <Briefcase className="size-4 text-muted-foreground" />
              Overview
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              Identity, current stage, and build target for this project.
            </p>

            <div className="mt-4 flex flex-col gap-5 rounded-sm border border-border bg-card p-5">
              {/* Names */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <FieldLabel>Project name</FieldLabel>
                  <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-primary"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <FieldLabel>Client name</FieldLabel>
                  <input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-primary"
                  />
                </label>
              </div>

              {/* Stage */}
              <div className="flex flex-col gap-2.5 border-t border-border pt-5">
                <FieldLabel>Stage / status</FieldLabel>
                <div className="flex flex-wrap items-center gap-1.5">
                  {STAGES.map((s, i) => {
                    const isCurrent = i === stageIndex
                    const isComplete = i < stageIndex
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStage(s)}
                        aria-pressed={isCurrent}
                        className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-[12px] font-medium capitalize transition-colors ${
                          isCurrent
                            ? 'border-primary bg-primary text-primary-foreground'
                            : isComplete
                              ? 'border-primary/40 bg-primary/[0.06] text-primary'
                              : 'border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                        }`}
                      >
                        {isComplete && <Check className="size-3" />}
                        {s}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  The current stage is shown to the client so they can track
                  progress.
                </p>
              </div>

              {/* Target */}
              <div className="flex flex-col gap-2.5 border-t border-border pt-5">
                <FieldLabel>Target</FieldLabel>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {TARGETS.map((t) => {
                    const selected = target === t.value
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTarget(t.value)}
                        aria-pressed={selected}
                        className={`flex items-center gap-3 rounded-sm border px-3 py-2.5 text-left transition-colors ${
                          selected
                            ? 'border-primary bg-primary/[0.06]'
                            : 'border-border bg-card hover:border-foreground/30'
                        }`}
                      >
                        <span
                          className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-card'
                          }`}
                        >
                          {selected && (
                            <span className="size-1.5 rounded-full bg-current" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-medium text-foreground">
                            {t.label}
                          </span>
                          <span className="block text-[11px] text-muted-foreground">
                            {t.detail}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Calendar link */}
          <section>
            <h2 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
              <Calendar className="size-4 text-muted-foreground" />
              Calendar link
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              Paste your scheduling link (Calendly, Cal.com, Google). The client
              uses it to book time with you.
            </p>

            <div className="mt-4 rounded-sm border border-border bg-card p-5">
              <label className="flex flex-col gap-1.5">
                <FieldLabel>Scheduling URL</FieldLabel>
                <div className="flex items-center gap-2">
                  <input
                    value={calendarLink}
                    onChange={(e) => setCalendarLink(e.target.value)}
                    placeholder="https://cal.com/your-handle/intro"
                    className="w-full rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-primary"
                  />
                  {calendarLink.trim() && (
                    <a
                      href={calendarLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open scheduling link"
                      className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                </div>
              </label>
            </div>
          </section>

          {/* Relevant links */}
          <section>
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
                <LinkIcon className="size-4 text-muted-foreground" />
                Relevant links
              </h2>
              {!adding && (
                <button
                  type="button"
                  onClick={startAdd}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
                >
                  <Plus className="size-3.5" />
                  Add link
                </button>
              )}
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              Labeled links the client can see — contract, invoice, shared
              drive, meeting notes, and more.
            </p>

            <div className="mt-4 flex flex-col gap-2">
              {links.length === 0 && !adding && (
                <div className="rounded-sm border border-dashed border-border bg-card px-4 py-8 text-center text-[12px] text-muted-foreground">
                  No links yet. Add a contract, invoice, or shared drive.
                </div>
              )}

              {links.map((link) =>
                editingId === link.id ? (
                  <LinkEditor
                    key={link.id}
                    label={draftLabel}
                    url={draftUrl}
                    onLabel={setDraftLabel}
                    onUrl={setDraftUrl}
                    onSave={saveDraft}
                    onCancel={cancelDraft}
                  />
                ) : (
                  <div
                    key={link.id}
                    className="flex items-center justify-between gap-3 rounded-sm border border-border bg-card px-3.5 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground">
                        <LinkIcon className="size-3.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium text-foreground">
                          {link.label}
                        </div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-[11px] text-muted-foreground hover:text-primary hover:underline"
                        >
                          {link.url}
                        </a>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(link)}
                        aria-label={`Edit ${link.label}`}
                        className="flex size-7 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeLink(link.id)}
                        aria-label={`Remove ${link.label}`}
                        className="flex size-7 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:border-[#d63638]/50 hover:text-[#d63638]"
                      >
                        <Trash className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ),
              )}

              {adding && (
                <LinkEditor
                  label={draftLabel}
                  url={draftUrl}
                  onLabel={setDraftLabel}
                  onUrl={setDraftUrl}
                  onSave={saveDraft}
                  onCancel={cancelDraft}
                />
              )}
            </div>
          </section>

          {/* What the client sees */}
          <section>
            <h2 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
              <Eye className="size-4 text-muted-foreground" />
              What the client sees
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              A summary of the items visible in the client view for this
              project.
            </p>

            <div className="mt-4 rounded-sm border border-border bg-card">
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
                <span className="text-[12px] font-medium text-foreground">
                  Client view preview
                </span>
                <button
                  type="button"
                  onClick={() => setShowClientView((v) => !v)}
                  aria-pressed={showClientView}
                  className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    showClientView
                      ? 'border-primary bg-primary/[0.06] text-primary'
                      : 'border-border bg-card text-foreground hover:border-foreground/30'
                  }`}
                >
                  <Eye className="size-3" />
                  {showClientView ? 'Showing' : 'Show'}
                </button>
              </div>

              {showClientView ? (
                <div className="flex flex-col gap-5 p-5">
                  {/* Progress */}
                  <div className="flex flex-col gap-2">
                    <FieldLabel>Current stage</FieldLabel>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-sm bg-primary/[0.1] px-2 py-1 text-[12px] font-medium capitalize text-primary">
                        {stage}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Step {stageIndex + 1} of {STAGES.length}
                      </span>
                    </div>
                  </div>

                  {/* Project + client */}
                  <div className="grid grid-cols-1 gap-3 border-t border-border pt-5 sm:grid-cols-2">
                    <div>
                      <FieldLabel>Project</FieldLabel>
                      <div className="mt-1 text-[13px] text-foreground">
                        {projectName || '—'}
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Client</FieldLabel>
                      <div className="mt-1 text-[13px] text-foreground">
                        {clientName || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="border-t border-border pt-5">
                    <FieldLabel>Schedule a call</FieldLabel>
                    {calendarLink.trim() ? (
                      <a
                        href={calendarLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
                      >
                        <Calendar className="size-3.5 text-muted-foreground" />
                        Book a time
                        <ExternalLink className="size-3.5 text-muted-foreground" />
                      </a>
                    ) : (
                      <div className="mt-1 text-[12px] text-muted-foreground">
                        No scheduling link added yet.
                      </div>
                    )}
                  </div>

                  {/* Links */}
                  <div className="border-t border-border pt-5">
                    <FieldLabel>Documents &amp; links</FieldLabel>
                    {links.length ? (
                      <ul className="mt-2 flex flex-col gap-2">
                        {links.map((link) => (
                          <li key={link.id}>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between gap-3 rounded-sm border border-border bg-background px-3 py-2 text-[12px] text-foreground transition-colors hover:border-foreground/30"
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <LinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate font-medium">
                                  {link.label}
                                </span>
                              </span>
                              <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-1 text-[12px] text-muted-foreground">
                        No links shared yet.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="px-5 py-8 text-center text-[12px] text-muted-foreground">
                  Toggle the preview to see exactly what your client will see.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function LinkEditor({
  label,
  url,
  onLabel,
  onUrl,
  onSave,
  onCancel,
}: {
  label: string
  url: string
  onLabel: (v: string) => void
  onUrl: (v: string) => void
  onSave: () => void
  onCancel: () => void
}) {
  const valid = label.trim().length > 0 && url.trim().length > 0
  return (
    <div className="flex flex-col gap-3 rounded-sm border border-primary/40 bg-primary/[0.03] p-3.5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <FieldLabel>Label</FieldLabel>
          <input
            value={label}
            autoFocus
            onChange={(e) => onLabel(e.target.value)}
            placeholder="Signed contract"
            className="w-full rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <FieldLabel>URL</FieldLabel>
          <input
            value={url}
            onChange={(e) => onUrl(e.target.value)}
            placeholder="https://…"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && valid) onSave()
            }}
            className="w-full rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-primary"
          />
        </label>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
        >
          <X className="size-3.5" />
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!valid}
          className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Check className="size-3.5" />
          Save
        </button>
      </div>
    </div>
  )
}
