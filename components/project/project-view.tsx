'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { InfiniteCanvas } from '@/components/canvas/infinite-canvas'
import { Frame } from '@/components/canvas/frame'
import {
  Calendar,
  Check,
  Copy,
  ExternalLink,
  Globe,
  Link,
  LinkIcon,
  Pencil,
  Plus,
  Server,
  Share,
  Trash,
  X,
} from '@/components/icons'
import { supabase } from '@/lib/supabase'

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#646970]">
    {children}
  </span>
)

/* Rich text editor for portal home content — user-authored content only */
function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastValue = useRef(value)

  useEffect(() => {
    if (editorRef.current && value !== lastValue.current) {
      /* Content is user-authored portal text from their own project DB row */
      editorRef.current.innerHTML = value // eslint-disable-line no-unsanitized/property
      lastValue.current = value
    }
  }, [value])

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML && value) {
      editorRef.current.innerHTML = value // eslint-disable-line no-unsanitized/property
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const format = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val) // eslint-disable-line
    editorRef.current?.focus()
  }

  return (
    <div className="overflow-hidden rounded-sm border border-input focus-within:border-primary">
      <div className="flex items-center gap-0.5 border-b border-input bg-muted/30 px-2 py-1">
        <button type="button" onMouseDown={(e) => { e.preventDefault(); format('bold') }} title="Bold" className="flex size-7 items-center justify-center rounded-sm text-[12px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground">B</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); format('italic') }} title="Italic" className="flex size-7 items-center justify-center rounded-sm text-[12px] italic text-muted-foreground hover:bg-muted hover:text-foreground">I</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); format('underline') }} title="Underline" className="flex size-7 items-center justify-center rounded-sm text-[12px] underline text-muted-foreground hover:bg-muted hover:text-foreground">U</button>
        <span className="mx-1 h-4 w-px bg-border" />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); format('insertUnorderedList') }} title="Bullet list" className="flex size-7 items-center justify-center rounded-sm text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground">&bull;</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); format('insertOrderedList') }} title="Numbered list" className="flex size-7 items-center justify-center rounded-sm text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground">1.</button>
        <span className="mx-1 h-4 w-px bg-border" />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            const url = prompt('Enter URL:')
            if (url) format('createLink', url)
          }}
          title="Add link"
          className="flex size-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LinkIcon className="size-3.5" />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          const html = editorRef.current?.innerHTML ?? ''
          lastValue.current = html
          onChange(html)
        }}
        data-placeholder={placeholder}
        className="min-h-[160px] bg-background px-3 py-2.5 text-[13px] leading-relaxed text-foreground outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
      />
    </div>
  )
}

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

type ShareKey = 'style' | 'content' | 'sitemap' | 'wireframe' | 'mockups'

const SHARE_OPTIONS: { key: ShareKey; label: string; hint: string }[] = [
  { key: 'style', label: 'Style guide', hint: 'Colors, type, components' },
  { key: 'content', label: 'Content', hint: 'Content collection forms' },
  { key: 'sitemap', label: 'Sitemap', hint: 'Page & section structure' },
  { key: 'wireframe', label: 'Wireframe', hint: 'Styled page previews' },
  { key: 'mockups', label: 'Mockups', hint: 'Design mockups' },
]

function getShareUrl(token: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/portal/${token}`
}

type WpConnection = { id: string; label: string; url: string } | null

/**
 * Project view — the agency-side project overview placed on the canvas as
 * frames: "Project Details", "WordPress", "Portal Home Content", and
 * "Client Portal".
 */
export function ProjectView({ projectId }: { projectId: string }) {
  const [projectName, setProjectName] = useState('')
  const [clientName, setClientName] = useState('')
  const [stage, setStage] = useState<Stage>('onboarding')
  const [target, setTarget] = useState<string>('ollie')
  const [calendarLink, setCalendarLink] = useState('')

  const [links, setLinks] = useState<RelevantLink[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftLabel, setDraftLabel] = useState('')
  const [draftUrl, setDraftUrl] = useState('')
  const [adding, setAdding] = useState(false)

  // Portal home content
  const [portalContent, setPortalContent] = useState('')

  // WordPress connection (project-level)
  const [wpConn, setWpConn] = useState<WpConnection>(null)
  const [wpUrl, setWpUrl] = useState('')
  const [wpSaving, setWpSaving] = useState(false)

  // Client portal share
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [shareId, setShareId] = useState<string | null>(null)
  const [shareViews, setShareViews] = useState<Record<ShareKey, boolean>>({
    style: true,
    content: false,
    sitemap: true,
    wireframe: false,
    mockups: false,
  })
  const [allowComments, setAllowComments] = useState(true)
  const [linkCopied, setLinkCopied] = useState(false)

  const [loading, setLoading] = useState(true)

  // Load project from DB
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function load() {
      const [projectRes, wpRes, shareRes] = await Promise.all([
        supabase
          .from('projects')
          .select('name, client_name, stage, target, calendar_link, relevant_links, portal_content, account_id')
          .eq('id', projectId)
          .single(),
        supabase
          .from('connections')
          .select('id, label, config')
          .eq('kind', 'wordpress-project')
          .eq('config->>project_id', projectId)
          .maybeSingle(),
        supabase
          .from('shares')
          .select('id, token, visible_views, can_comment')
          .eq('project_id', projectId)
          .eq('revoked', false)
          .limit(1)
          .maybeSingle(),
      ])

      if (cancelled) return

      if (projectRes.data) {
        const d = projectRes.data
        setProjectName(d.name ?? '')
        setClientName(d.client_name ?? '')
        setStage((d.stage as Stage) ?? 'onboarding')
        setTarget(d.target ?? 'ollie')
        setCalendarLink(d.calendar_link ?? '')
        setLinks((d.relevant_links as RelevantLink[]) ?? [])
        setPortalContent((d.portal_content as string) ?? '')
      }

      if (wpRes.data) {
        const cfg = wpRes.data.config as Record<string, string> | null
        setWpConn({
          id: wpRes.data.id,
          label: wpRes.data.label ?? '',
          url: cfg?.url ?? '',
        })
      }

      if (shareRes.data) {
        setShareToken(shareRes.data.token)
        setShareId(shareRes.data.id)
        const views = (shareRes.data.visible_views as string[]) ?? []
        setShareViews({
          style: views.includes('style'),
          content: views.includes('content'),
          sitemap: views.includes('sitemap'),
          wireframe: views.includes('wireframe'),
          mockups: views.includes('mockups'),
        })
        setAllowComments(shareRes.data.can_comment ?? true)
      }

      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [projectId])

  // Debounced save
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const save = useCallback(
    (patch: Record<string, unknown>) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        supabase
          .from('projects')
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq('id', projectId)
          .then()
      }, 800)
    },
    [projectId],
  )

  const handleProjectName = (v: string) => { setProjectName(v); save({ name: v }) }
  const handleClientName = (v: string) => { setClientName(v); save({ client_name: v }) }
  const handleStage = (s: Stage) => { setStage(s); save({ stage: s }) }
  const handleTarget = (t: string) => { setTarget(t); save({ target: t }) }
  const handleCalendarLink = (v: string) => { setCalendarLink(v); save({ calendar_link: v }) }
  const handlePortalContent = (v: string) => { setPortalContent(v); save({ portal_content: v }) }

  const saveLinks = useCallback(
    (newLinks: RelevantLink[]) => {
      setLinks(newLinks)
      save({ relevant_links: newLinks })
    },
    [save],
  )

  const stageIndex = STAGES.indexOf(stage)

  const startAdd = () => { setAdding(true); setEditingId(null); setDraftLabel(''); setDraftUrl('') }
  const startEdit = (link: RelevantLink) => { setEditingId(link.id); setAdding(false); setDraftLabel(link.label); setDraftUrl(link.url) }
  const cancelDraft = () => { setAdding(false); setEditingId(null); setDraftLabel(''); setDraftUrl('') }

  const saveDraft = () => {
    const label = draftLabel.trim()
    const url = draftUrl.trim()
    if (!label || !url) return
    if (adding) {
      saveLinks([...links, { id: `l${Date.now()}`, label, url }])
    } else if (editingId) {
      saveLinks(links.map((l) => l.id === editingId ? { ...l, label, url } : l))
    }
    cancelDraft()
  }

  const removeLink = (id: string) => {
    saveLinks(links.filter((l) => l.id !== id))
    if (editingId === id) cancelDraft()
  }

  // WordPress connect/disconnect
  const connectWp = async () => {
    if (!wpUrl.trim()) return
    setWpSaving(true)
    const label = wpUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
    const { data } = await supabase
      .from('connections')
      .insert({
        account_id: (await supabase.from('projects').select('account_id').eq('id', projectId).single()).data?.account_id,
        kind: 'wordpress-project',
        label,
        config: { url: wpUrl.trim(), project_id: projectId },
      })
      .select('id')
      .single()
    if (data) setWpConn({ id: data.id, label, url: wpUrl.trim() })
    setWpSaving(false)
    setWpUrl('')
  }

  const disconnectWp = async () => {
    if (!wpConn) return
    await supabase.from('connections').delete().eq('id', wpConn.id)
    setWpConn(null)
  }

  // Share helpers
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveShareOptions = useCallback(
    (views: Record<ShareKey, boolean>, canComment: boolean) => {
      if (!shareId) return
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current)
      shareTimerRef.current = setTimeout(() => {
        const visible = Object.entries(views).filter(([, v]) => v).map(([k]) => k)
        supabase.from('shares').update({ visible_views: visible, can_comment: canComment }).eq('id', shareId).then()
      }, 800)
    },
    [shareId],
  )

  const toggleShareView = (key: ShareKey) => {
    const next = { ...shareViews, [key]: !shareViews[key] }
    setShareViews(next)
    saveShareOptions(next, allowComments)
  }

  const toggleComments = () => {
    const next = !allowComments
    setAllowComments(next)
    saveShareOptions(shareViews, next)
  }

  const copyPortalLink = async () => {
    let token = shareToken
    if (!token) {
      token = crypto.randomUUID()
      const visible = Object.entries(shareViews).filter(([, v]) => v).map(([k]) => k)
      const { data } = await supabase
        .from('shares')
        .insert({ project_id: projectId, token, visible_views: visible, can_comment: allowComments })
        .select('id')
        .single()
      if (data) { setShareToken(token); setShareId(data.id) }
    }
    if (!token) return
    try { await navigator.clipboard.writeText(getShareUrl(token)) } catch { /* noop */ }
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 1800)
  }

  const displayUrl = shareToken ? getShareUrl(shareToken) : getShareUrl('...')

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-[13px] text-muted-foreground">Loading project...</span>
      </div>
    )
  }

  return (
    <InfiniteCanvas>
      <div className="flex flex-wrap items-start gap-10 p-24 pl-72">
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
                    onChange={(e) => handleProjectName(e.target.value)}
                    className="w-full rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-primary"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <FieldLabel>Client name</FieldLabel>
                  <input
                    value={clientName}
                    onChange={(e) => handleClientName(e.target.value)}
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
                        onClick={() => handleStage(s)}
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
                  The current stage is shown to the client so they can track progress.
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
                        onClick={() => handleTarget(t.value)}
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
                          {selected && <span className="size-1.5 rounded-full bg-current" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-medium text-foreground">{t.label}</span>
                          <span className="block text-[11px] text-muted-foreground">{t.detail}</span>
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
                    onChange={(e) => handleCalendarLink(e.target.value)}
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

        {/* Frame 2 — WordPress */}
        <div className="shrink-0">
          <Frame title="WordPress" width={420}>
            <div className="flex flex-col gap-4 p-5">
              <p className="text-[12px] leading-relaxed text-muted-foreground">
                Connect a WordPress site for this project. Auth is handed off
                securely — PressFlow never stores raw site credentials.
              </p>

              {wpConn ? (
                <div className="flex items-center gap-3 rounded-sm border border-border bg-card p-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-border bg-muted text-muted-foreground">
                    <Server className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-semibold text-foreground">
                        {wpConn.label || wpConn.url || 'WordPress site'}
                      </span>
                      <StatusDot connected />
                    </div>
                    {wpConn.url && (
                      <span className="text-[11px] text-muted-foreground">{wpConn.url}</span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {wpConn.url && (
                      <a
                        href={`${wpConn.url.replace(/\/$/, '')}/wp-admin`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
                      >
                        Admin
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={disconnectWp}
                      className="rounded-sm border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={wpUrl}
                    onChange={(e) => setWpUrl(e.target.value)}
                    placeholder="https://yoursite.com"
                    className="w-full rounded-sm border border-input bg-background px-2.5 py-2 text-[12px] text-foreground outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={connectWp}
                    disabled={wpSaving || !wpUrl.trim()}
                    className="shrink-0 rounded-sm bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {wpSaving ? 'Saving...' : 'Authorize'}
                  </button>
                </div>
              )}
            </div>
          </Frame>
        </div>

        {/* Frame 3 — Portal Home Content */}
        <div className="shrink-0">
          <Frame title="Portal Home Content" width={420}>
            <div className="flex flex-col gap-3 p-5">
              <p className="text-[12px] leading-relaxed text-muted-foreground">
                Write a message your client will see on their portal home page.
                This is a great place for welcome text, project context, or
                next-step instructions.
              </p>
              <RichTextEditor
                value={portalContent}
                onChange={handlePortalContent}
                placeholder="Welcome to your project portal! Here you can review progress, upload assets, and provide feedback..."
              />
              <p className="text-[11px] text-muted-foreground">
                Shown on the Overview tab of the client portal.
              </p>
            </div>
          </Frame>
        </div>

        {/* Frame 4 — Client Portal */}
        <div className="shrink-0">
          <Frame title="Client Portal" width={420}>
            <div className="flex flex-col gap-5 p-5">
              {/* Share link */}
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Portal link</FieldLabel>
                <div className="flex items-center gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-sm border border-border bg-background px-2.5 py-2">
                    <Link className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate text-[12px] text-foreground">{displayUrl}</span>
                  </div>
                  <button
                    type="button"
                    onClick={copyPortalLink}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-primary px-3 py-2 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {linkCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {linkCopied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                {shareToken && (
                  <a
                    href={getShareUrl(shareToken)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline"
                  >
                    <ExternalLink className="size-3.5" />
                    View client portal
                  </a>
                )}
              </div>

              {/* What to share */}
              <div className="flex flex-col gap-2 border-t border-border pt-5">
                <FieldLabel>Visible views</FieldLabel>
                <div className="flex flex-col gap-1.5">
                  {SHARE_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => toggleShareView(opt.key)}
                      className="flex items-center gap-3 rounded-sm border border-border bg-background px-3 py-2 text-left transition-colors hover:border-foreground/30"
                    >
                      <ShareCheckBox checked={shareViews[opt.key]} />
                      <span className="flex flex-col">
                        <span className="text-[12px] font-medium text-foreground">{opt.label}</span>
                        <span className="text-[11px] text-muted-foreground">{opt.hint}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comments toggle */}
              <button
                type="button"
                onClick={toggleComments}
                className="flex items-center gap-3 rounded-sm border border-border bg-background px-3 py-2 text-left transition-colors hover:border-foreground/30"
              >
                <ShareCheckBox checked={allowComments} />
                <span className="flex flex-col">
                  <span className="text-[12px] font-medium text-foreground">Allow comments</span>
                  <span className="text-[11px] text-muted-foreground">
                    {allowComments ? 'Viewers can leave comments' : 'Viewers can view only'}
                  </span>
                </span>
              </button>
            </div>
          </Frame>
        </div>
      </div>
    </InfiniteCanvas>
  )
}

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span
      className={`size-2 rounded-full ${connected ? 'bg-[#00a32a]' : 'bg-muted-foreground/60'}`}
    />
  )
}

function ShareCheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-4 shrink-0 items-center justify-center rounded-[2px] border transition-colors ${
        checked
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-transparent'
      }`}
    >
      <Check className="size-3" />
    </span>
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
