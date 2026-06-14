'use client'

import { useEffect, useState } from 'react'
import { X, Link, Check, Copy } from '@/components/icons'

type ShareKey = 'style' | 'sitemap' | 'wireframe'

const SHARE_OPTIONS: { key: ShareKey; label: string; hint: string }[] = [
  { key: 'style', label: 'Style guide', hint: 'Colors, type, components' },
  { key: 'sitemap', label: 'Sitemap', hint: 'Page & section structure' },
  { key: 'wireframe', label: 'Wireframe', hint: 'Styled page previews' },
]

const SHARE_URL = 'https://pressflow.app/s/3f9c2a7e'

export function ShareModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<Record<ShareKey, boolean>>({
    style: true,
    sitemap: true,
    wireframe: false,
  })
  const [allowComments, setAllowComments] = useState(true)
  const [copied, setCopied] = useState(false)

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const toggle = (key: ShareKey) =>
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }))

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL)
    } catch {
      /* clipboard may be unavailable; still show feedback */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

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
                <span className="truncate text-[12px] text-foreground">{SHARE_URL}</span>
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
            onClick={() => setAllowComments((v) => !v)}
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
