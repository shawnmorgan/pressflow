'use client'

import { useEffect, useState } from 'react'
import { X, MessageSquare } from '@/components/icons'

type Comment = {
  id: string
  author: string
  initials: string
  target: string
  body: string
  time: string
  resolved?: boolean
}

const SAMPLE_COMMENTS: Comment[] = [
  {
    id: 'c1',
    author: 'Dana Whitfield',
    initials: 'DW',
    target: 'Style · Colors',
    body: 'Can we push the primary a touch darker for AA contrast on buttons?',
    time: '2h ago',
  },
  {
    id: 'c2',
    author: 'Marcus Lee',
    initials: 'ML',
    target: 'Home · Hero',
    body: 'Love this layout. Subheading copy still placeholder though.',
    time: '4h ago',
  },
  {
    id: 'c3',
    author: 'Priya Nair',
    initials: 'PN',
    target: 'Sitemap · Services',
    body: 'Should Pricing live under Services or be top-level?',
    time: 'Yesterday',
    resolved: true,
  },
]

export function CommentsPane({ onClose }: { onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>(SAMPLE_COMMENTS)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const addComment = () => {
    const text = draft.trim()
    if (!text) return
    setComments((prev) => [
      {
        id: `c-${Math.random().toString(36).slice(2, 8)}`,
        author: 'You',
        initials: 'YO',
        target: 'General',
        body: text,
        time: 'Just now',
      },
      ...prev,
    ])
    setDraft('')
  }

  return (
    <div className="fixed inset-0 z-[80]">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close comments"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/20"
      />

      {/* Slide-out pane */}
      <aside
        role="dialog"
        aria-label="Comments"
        className="absolute right-0 top-0 flex h-full w-[360px] max-w-[90vw] flex-col border-l border-border bg-card shadow-lg"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4 text-muted-foreground" />
            <h2 className="text-[14px] font-semibold text-foreground">Comments</h2>
            <span className="rounded-sm border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
              {comments.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {comments.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <MessageSquare className="size-6 text-muted-foreground" />
              <p className="mt-2 text-[13px] text-muted-foreground">No comments yet</p>
            </div>
          ) : (
            <ul className="flex flex-col">
              {comments.map((c) => (
                <li key={c.id} className="border-b border-border px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                      {c.initials}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-medium text-foreground">
                          {c.author}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{c.time}</span>
                      </div>
                      <span className="inline-flex w-fit items-center rounded-sm border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {c.target}
                      </span>
                      <p className="text-[13px] leading-relaxed text-foreground">{c.body}</p>
                      {c.resolved && (
                        <span className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                          Resolved
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-border p-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addComment()
            }}
            rows={2}
            placeholder="Add a comment…"
            className="w-full resize-none rounded-sm border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">⌘↵ to send</span>
            <button
              type="button"
              onClick={addComment}
              disabled={!draft.trim()}
              className="inline-flex items-center rounded-sm bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Comment
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}
