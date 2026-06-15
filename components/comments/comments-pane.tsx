'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, MessageSquare, Check, Reply, Filter } from '@/components/icons'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

type DbComment = {
  id: string
  parent_id: string | null
  project_id: string
  target_type: string
  target_id: string
  author_user_id: string | null
  participant_id: string | null
  body: string
  resolved: boolean
  resolved_by: string | null
  resolved_at: string | null
  pin_view: string | null
  pin_x: number | null
  pin_y: number | null
  pin_target_id: string | null
  created_at: string
  profiles: { name: string | null } | null
}

type Comment = {
  id: string
  parentId: string | null
  author: string
  initials: string
  target: string
  body: string
  time: string
  createdAt: string
  resolved: boolean
  replies: Comment[]
}

type FilterMode = 'all' | 'open' | 'resolved'

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function toComment(c: DbComment): Comment {
  const name = c.profiles?.name ?? 'Unknown'
  return {
    id: c.id,
    parentId: c.parent_id,
    author: name,
    initials: name
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    target: c.target_type === 'general' ? 'General' : `${c.target_type} · ${c.target_id}`,
    body: c.body,
    time: formatTime(c.created_at),
    createdAt: c.created_at,
    resolved: c.resolved,
    replies: [],
  }
}

function buildThreads(flat: Comment[]): Comment[] {
  const map = new Map<string, Comment>()
  const roots: Comment[] = []
  for (const c of flat) map.set(c.id, { ...c, replies: [] })
  for (const c of flat) {
    const node = map.get(c.id)!
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies.push(node)
    } else {
      roots.push(node)
    }
  }
  // Sort roots newest first, replies oldest first
  roots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  for (const r of roots) {
    r.replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }
  return roots
}

export function CommentsPane({ onClose, projectId }: { onClose: () => void; projectId: string }) {
  const { user } = useAuth()
  const [threads, setThreads] = useState<Comment[]>([])
  const [flat, setFlat] = useState<Comment[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [replyTo, setReplyTo] = useState<string | null>(null)

  // Load user profile name once
  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setUserName(data.name ?? 'You')
      })
  }, [user])

  const rebuildThreads = useCallback((comments: Comment[]) => {
    setFlat(comments)
    setThreads(buildThreads(comments))
  }, [])

  // Load comments from DB
  useEffect(() => {
    let cancelled = false
    supabase
      .from('comments')
      .select('id, parent_id, project_id, target_type, target_id, body, resolved, resolved_by, resolved_at, pin_view, pin_x, pin_y, pin_target_id, created_at, author_user_id, participant_id, profiles(name)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return
        if (data) {
          const comments = (data as unknown as DbComment[]).map(toComment)
          rebuildThreads(comments)
        }
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [projectId, rebuildThreads])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const addComment = async (parentId?: string) => {
    const text = draft.trim()
    if (!text || !user) return

    const { data } = await supabase
      .from('comments')
      .insert({
        project_id: projectId,
        target_type: 'general',
        target_id: 'general',
        author_user_id: user.id,
        body: text,
        parent_id: parentId ?? null,
      })
      .select('id, created_at')
      .single()

    if (!data) return

    const name = userName ?? 'You'
    const newComment: Comment = {
      id: data.id,
      parentId: parentId ?? null,
      author: name,
      initials: name
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      target: 'General',
      body: text,
      time: 'Just now',
      createdAt: data.created_at,
      resolved: false,
      replies: [],
    }
    rebuildThreads([...flat, newComment])
    setDraft('')
    setReplyTo(null)
  }

  const toggleResolve = async (commentId: string) => {
    const comment = flat.find((c) => c.id === commentId)
    if (!comment) return
    const nowResolved = !comment.resolved

    await supabase
      .from('comments')
      .update({
        resolved: nowResolved,
        resolved_by: nowResolved ? user?.id ?? null : null,
        resolved_at: nowResolved ? new Date().toISOString() : null,
      })
      .eq('id', commentId)

    const updated = flat.map((c) =>
      c.id === commentId ? { ...c, resolved: nowResolved } : c
    )
    rebuildThreads(updated)
  }

  const filtered = threads.filter((t) => {
    if (filter === 'open') return !t.resolved
    if (filter === 'resolved') return t.resolved
    return true
  })

  const totalCount = threads.length

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
              {totalCount}
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

        {/* Filter bar */}
        <div className="flex items-center gap-1 border-b border-border px-5 py-2">
          <Filter className="size-3.5 text-muted-foreground" />
          {(['all', 'open', 'resolved'] as FilterMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilter(mode)}
              className={`rounded-sm px-2 py-1 text-[11px] font-medium capitalize transition-colors ${
                filter === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <p className="text-[13px] text-muted-foreground">Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <MessageSquare className="size-6 text-muted-foreground" />
              <p className="mt-2 text-[13px] text-muted-foreground">
                {filter === 'all' ? 'No comments yet' : `No ${filter} comments`}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col">
              {filtered.map((c) => (
                <li key={c.id} className="border-b border-border">
                  {/* Top-level comment */}
                  <div className="px-5 py-4">
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

                        {/* Actions row */}
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                            className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <Reply className="size-3" />
                            Reply
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleResolve(c.id)}
                            className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                              c.resolved
                                ? 'text-primary hover:bg-primary/10'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                          >
                            <Check className="size-3" />
                            {c.resolved ? 'Resolved' : 'Resolve'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {c.replies.length > 0 && (
                    <div className="border-t border-border/50 bg-muted/30">
                      {c.replies.map((r) => (
                        <div key={r.id} className="px-5 py-3 pl-14">
                          <div className="flex items-start gap-3">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground">
                              {r.initials}
                            </span>
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-[12px] font-medium text-foreground">
                                  {r.author}
                                </span>
                                <span className="shrink-0 text-[10px] text-muted-foreground">
                                  {r.time}
                                </span>
                              </div>
                              <p className="text-[12px] leading-relaxed text-foreground">{r.body}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline reply composer */}
                  {replyTo === c.id && (
                    <div className="border-t border-border/50 bg-muted/20 px-5 py-3 pl-14">
                      <textarea
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addComment(c.id)
                        }}
                        rows={2}
                        placeholder="Write a reply..."
                        className="w-full resize-none rounded-sm border border-border bg-background px-3 py-2 text-[12px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                      />
                      <div className="mt-1.5 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => { setReplyTo(null); setDraft('') }}
                          className="rounded-sm px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => addComment(c.id)}
                          disabled={!draft.trim()}
                          className="inline-flex items-center rounded-sm bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Composer (top-level) */}
        {replyTo === null && (
          <div className="border-t border-border p-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addComment()
              }}
              rows={2}
              placeholder="Add a comment..."
              className="w-full resize-none rounded-sm border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">&#8984;&#8629; to send</span>
              <button
                type="button"
                onClick={() => addComment()}
                disabled={!draft.trim()}
                className="inline-flex items-center rounded-sm bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Comment
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
