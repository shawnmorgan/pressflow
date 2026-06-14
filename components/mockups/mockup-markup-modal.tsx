'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, Check, Copy } from '@/components/icons'
import { type Mockup, htmlToBlockMarkup } from '@/lib/mockups'
import { useToast } from '@/components/ui/toast'

type Props = {
  mockup: Mockup
  onClose: () => void
}

/**
 * Export an HTML mockup as ship-able Gutenberg block markup. The output is a
 * single opaque wp:html block — preserved verbatim for WordPress, not turned
 * back into re-editable sections.
 */
export function MockupMarkupModal({ mockup, onClose }: Props) {
  const { showToast } = useToast()
  const [copied, setCopied] = useState(false)
  const markup = useMemo(
    () => htmlToBlockMarkup(mockup.html ?? ''),
    [mockup.html],
  )

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
    showToast('Copied block markup')
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
        aria-label={`Export ${mockup.name}`}
        className="relative flex max-h-[82vh] w-full max-w-2xl flex-col overflow-hidden rounded-sm border border-border bg-card shadow-lg"
      >
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="text-[14px] font-semibold text-foreground">
              Export as block markup
            </h2>
            <span className="truncate rounded-sm border border-border bg-background px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {mockup.name}
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

        {/* Opaque-markup note */}
        <div className="border-b border-border bg-[#dba617]/10 px-5 py-2.5">
          <p className="text-[12px] leading-relaxed text-[#946800]">
            Converted mockups come in as a single <span className="font-medium">opaque, ship-able</span> block.
            It renders exactly as designed and is edited later in WordPress — it is not
            broken back into re-editable sections.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-[#1d2327] p-4">
          <pre className="text-[12px] leading-relaxed text-[#e2e4e7]">
            <code className="font-mono">{markup}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}
