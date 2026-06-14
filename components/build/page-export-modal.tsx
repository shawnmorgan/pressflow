'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, Check, Copy } from '@/components/icons'
import { type Page } from '@/lib/sitemap'
import { pageMarkup } from '@/lib/block-markup'
import { useToast } from '@/components/ui/toast'

type Props = {
  page: Page
  onClose: () => void
}

/**
 * Page export modal — shows the full page as Gutenberg block markup with a
 * copy-to-clipboard action.
 */
export function PageExportModal({ page, onClose }: Props) {
  const { showToast } = useToast()
  const [copied, setCopied] = useState(false)
  const markup = useMemo(() => pageMarkup(page), [page])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markup)
    } catch {
      /* clipboard may be unavailable in sandboxed frames */
    }
    setCopied(true)
    showToast('Copied page block markup')
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close export dialog"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Export ${page.name}`}
        className="relative flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-sm border border-border bg-card shadow-lg"
      >
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="text-[14px] font-semibold text-foreground">
              Export page
            </h2>
            <span className="truncate rounded-sm border border-border bg-background px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {page.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? 'Copied' : 'Copy block markup'}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto bg-[#1d2327] p-4">
          <pre className="text-[12px] leading-relaxed text-[#e2e4e7]">
            <code className="font-mono">{markup}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}
