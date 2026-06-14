'use client'

import { useState, type ReactNode } from 'react'
import { MessageSquare } from '@/components/icons'

/** Small uppercase #646970 label used throughout the portal. */
export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#646970]">
      {children}
    </span>
  )
}

/** Section intro: heading + supporting blurb. */
export function SectionIntro({
  title,
  blurb,
  action,
}: {
  title: string
  blurb?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight text-foreground text-balance">
          {title}
        </h1>
        {blurb && (
          <p className="mt-1.5 max-w-[60ch] text-[13px] leading-relaxed text-muted-foreground">
            {blurb}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export type PillTone = 'neutral' | 'pending' | 'done' | 'accent'

const PILL_TONES: Record<PillTone, string> = {
  neutral: 'border-border bg-card text-muted-foreground',
  pending: 'border-[#dba617]/40 bg-[#dba617]/10 text-[#946800]',
  done: 'border-[#0f6b5c]/40 bg-[#0f6b5c]/10 text-[#0b5043]',
  accent: 'border-primary/40 bg-primary/10 text-primary',
}

export function StatusPill({
  tone = 'neutral',
  children,
}: {
  tone?: PillTone
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-medium ${PILL_TONES[tone]}`}
    >
      {children}
    </span>
  )
}

export type PortalComment = {
  id: string
  author: string
  body: string
  at: string
}

/**
 * A calm comment thread: existing notes plus a composer. Clients leave
 * feedback here; they never edit the design itself.
 */
export function CommentThread({
  comments,
  onAdd,
  placeholder = 'Leave a note for the team…',
  compact = false,
}: {
  comments: PortalComment[]
  onAdd: (body: string) => void
  placeholder?: string
  compact?: boolean
}) {
  const [draft, setDraft] = useState('')
  const submit = () => {
    const body = draft.trim()
    if (!body) return
    onAdd(body)
    setDraft('')
  }
  return (
    <div className="flex flex-col gap-3">
      {comments.length > 0 && (
        <ul className="flex flex-col gap-2">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-sm border border-border bg-card px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-medium text-foreground">
                  {c.author}
                </span>
                <span className="text-[10px] text-muted-foreground">{c.at}</span>
              </div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                {c.body}
              </p>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            rows={compact ? 1 : 2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
            }}
            className="w-full resize-none rounded-sm border border-input bg-background px-2.5 py-2 text-[12px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!draft.trim()}
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-2 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <MessageSquare className="size-3.5" />
          Note
        </button>
      </div>
    </div>
  )
}
