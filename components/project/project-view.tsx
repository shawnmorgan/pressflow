'use client'

import { useState } from 'react'
import { InfiniteCanvas } from '@/components/canvas/infinite-canvas'
import { Frame } from '@/components/canvas/frame'
import { ONBOARDING_GROUPS } from '@/components/portal/portal-onboarding'
import {
  Calendar,
  Check,
  ExternalLink,
  LinkIcon,
  Pencil,
  Plus,
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

type RelevantLink = { id: string; label: string; url: string }

const INITIAL_LINKS: RelevantLink[] = [
  { id: 'l1', label: 'Signed contract', url: 'https://drive.example.com/contract' },
  { id: 'l2', label: 'Invoice #0042', url: 'https://billing.example.com/0042' },
  { id: 'l3', label: 'Shared drive', url: 'https://drive.example.com/aurora' },
]

/**
 * Project view — the agency-side project overview placed on the canvas as two
 * frames: "Project Details" (identity, stage, target, calendar, links) and
 * "Onboarding" (the discovery questionnaire).
 */
export function ProjectView() {
  const [projectName, setProjectName] = useState('Aurora Press')
  const [clientName, setClientName] = useState('Aurora Coffee Roasters')
  const [stage, setStage] = useState<Stage>('design')
  const [target, setTarget] = useState<string>('wordpress')
  const [calendarLink, setCalendarLink] = useState('https://cal.com/aurorapress/intro')

  const [links, setLinks] = useState<RelevantLink[]>(INITIAL_LINKS)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftLabel, setDraftLabel] = useState('')
  const [draftUrl, setDraftUrl] = useState('')
  const [adding, setAdding] = useState(false)

  const [onboarding, setOnboarding] = useState<Record<string, string>>({})

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
      setLinks((prev) => [...prev, { id: `l${Date.now()}`, label, url }])
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
    <InfiniteCanvas>
      <div className="flex items-start gap-10 p-24 pl-72">
        {/* Frame 1 — Project Details */}
        <div className="shrink-0">
          <Frame title="Project Details" width={520}>
            <div className="flex flex-col gap-5 p-5">
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

              {/* Calendar link */}
              <div className="flex flex-col gap-1.5 border-t border-border pt-5">
                <FieldLabel>Calendar link</FieldLabel>
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
                      <Calendar className="size-4" />
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  The client uses this scheduling link to book time with you.
                </p>
              </div>

              {/* Relevant links */}
              <div className="flex flex-col gap-2.5 border-t border-border pt-5">
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel>Relevant links</FieldLabel>
                  {!adding && (
                    <button
                      type="button"
                      onClick={startAdd}
                      className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-foreground/30"
                    >
                      <Plus className="size-3" />
                      Add link
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {links.length === 0 && !adding && (
                    <div className="rounded-sm border border-dashed border-border bg-card px-4 py-6 text-center text-[12px] text-muted-foreground">
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
              </div>
            </div>
          </Frame>
        </div>

        {/* Frame 2 — Onboarding */}
        <div className="shrink-0">
          <Frame title="Onboarding" width={520}>
            <div className="flex flex-col gap-5 p-5">
              <p className="text-[12px] leading-relaxed text-muted-foreground">
                Discovery details collected from the client before design begins.
              </p>
              {ONBOARDING_GROUPS.map((group) => (
                <div
                  key={group.title}
                  className="flex flex-col gap-3 border-t border-border pt-5 first:border-t-0 first:pt-0"
                >
                  <h3 className="text-[13px] font-semibold text-foreground">
                    {group.title}
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {group.fields.map((field) => (
                      <label
                        key={field.key}
                        className={`flex flex-col gap-1.5 ${field.kind === 'long' ? 'sm:col-span-2' : ''}`}
                      >
                        <FieldLabel>{field.label}</FieldLabel>
                        {field.kind === 'long' ? (
                          <textarea
                            value={onboarding[field.key] ?? ''}
                            onChange={(e) =>
                              setOnboarding((prev) => ({
                                ...prev,
                                [field.key]: e.target.value,
                              }))
                            }
                            placeholder={field.placeholder}
                            rows={3}
                            className="w-full resize-y rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                          />
                        ) : (
                          <input
                            value={onboarding[field.key] ?? ''}
                            onChange={(e) =>
                              setOnboarding((prev) => ({
                                ...prev,
                                [field.key]: e.target.value,
                              }))
                            }
                            placeholder={field.placeholder}
                            className="w-full rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                          />
                        )}
                        {field.hint && (
                          <span className="text-[11px] text-muted-foreground">
                            {field.hint}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Frame>
        </div>
      </div>
    </InfiniteCanvas>
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
