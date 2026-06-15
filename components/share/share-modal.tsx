'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { X, Link, Check, Copy } from '@/components/icons'
import { supabase } from '@/lib/supabase'

type ShareKey = 'style' | 'sitemap' | 'wireframe'

const SHARE_OPTIONS: { key: ShareKey; label: string; hint: string }[] = [
  { key: 'style', label: 'Style guide', hint: 'Colors, type, components' },
  { key: 'sitemap', label: 'Sitemap', hint: 'Page & section structure' },
  { key: 'wireframe', label: 'Wireframe', hint: 'Styled page previews' },
]

function getShareUrl(token: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/portal/${token}`
}

export function ShareModal({ onClose, projectId }: { onClose: () => void; projectId: string }) {
  const [selected, setSelected] = useState<Record<ShareKey, boolean>>({
    style: true,
    sitemap: true,
    wireframe: false,
  })
  const [allowComments, setAllowComments] = useState(true)
  const [copied, setCopied] = useState(false)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [shareId, setShareId] = useState<string | null>(null)

  // Load or create share on mount
  useEffect(() => {
    let cancelled = false
    async function loadOrCreate() {
      // Check for existing active share
      const { data: existing } = await supabase
        .from('shares')
        .select('id, token, visible_views, can_comment')
        .eq('project_id', projectId)
        .eq('revoked', false)
        .limit(1)
        .maybeSingle()

      if (cancelled) return

      if (existing) {
        setShareToken(existing.token)
        setShareId(existing.id)
        const views = (existing.visible_views as string[]) ?? []
        setSelected({
          style: views.includes('style'),
          sitemap: views.includes('sitemap'),
          wireframe: views.includes('wireframe'),
        })
        setAllowComments(existing.can_comment ?? true)
      }
    }
    loadOrCreate()
    return () => { cancelled = true }
  }, [projectId])

  // Debounced save for share options
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveOptions = useCallback(
    (views: Record<ShareKey, boolean>, canComment: boolean) => {
      if (!shareId) return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        const visible = Object.entries(views)
          .filter(([, v]) => v)
          .map(([k]) => k)
        supabase
          .from('shares')
          .update({ visible_views: visible, can_comment: canComment })
          .eq('id', shareId)
          .then()
      }, 800)
    },
    [shareId],
  )

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const toggle = (key: ShareKey) => {
    const next = { ...selected, [key]: !selected[key] }
    setSelected(next)
    saveOptions(next, allowComments)
  }

  const toggleComments = () => {
    const next = !allowComments
    setAllowComments(next)
    saveOptions(selected, next)
  }

  const copyLink = async () => {
    let token = shareToken

    // Create share if none exists
    if (!token) {
      token = crypto.randomUUID()
      const visible = Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => k)
      const { data } = await supabase
        .from('shares')
        .insert({
          project_id: projectId,
          token,
          visible_views: visible,
          can_comment: allowComments,
        })
        .select('id')
        .single()

      if (data) {
        setShareToken(token)
        setShareId(data.id)
      }
    }

    if (!token) return

    try {
      await navigator.clipboard.writeText(getShareUrl(token))
    } catch {
      /* clipboard may be unavailable; still show feedback */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const displayUrl = shareToken ? getShareUrl(shareToken) : getShareUrl('...')

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close share dialog"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Share"
        className="relative w-full max-w-md overflow-hidden rounded-sm border border-border bg-card shadow-lg"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-[14px] font-semibold text-foreground">Share</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex flex-col gap-5 p-5">
          {/* Copy link */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Share link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-sm border border-border bg-background px-2.5 py-2">
                <Link className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate text-[12px] text-foreground">{displayUrl}</span>
              </div>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-primary px-3 py-2 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </div>

          {/* Choose what to share */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              What to share
            </span>
            <div className="flex flex-col gap-1.5">
              {SHARE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => toggle(opt.key)}
                  className="flex items-center gap-3 rounded-sm border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-foreground/30"
                >
                  <CheckBox checked={selected[opt.key]} />
                  <span className="flex flex-col">
                    <span className="text-[13px] font-medium text-foreground">{opt.label}</span>
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
            className="flex items-center gap-3 rounded-sm border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-foreground/30"
          >
            <CheckBox checked={allowComments} />
            <span className="flex flex-col">
              <span className="text-[13px] font-medium text-foreground">Allow comments</span>
              <span className="text-[11px] text-muted-foreground">
                {allowComments
                  ? 'Viewers can leave comments'
                  : 'Viewers can view only'}
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

function CheckBox({ checked }: { checked: boolean }) {
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
