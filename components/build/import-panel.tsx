'use client'

import { useState, useRef } from 'react'
import { X, Upload, ArrowRight, CircleCheck } from '@/components/icons'
import { parseHtmlToSections } from '@/lib/import'
import type { Section } from '@/lib/sitemap'

type Props = {
  onClose: () => void
  onImport: (sections: Section[], mode: 'append' | 'replace') => void
}

const SAMPLE = `<header class="navbar">...</header>
<section class="hero"><h1>Build faster</h1><p>Ship a native theme.</p><a>Get started</a></section>
<section class="features"><h2>Features</h2></section>
<div class="promo-widget"><!-- custom embed --></div>
<footer class="footer">© 2026</footer>`

export function ImportPanel({ onClose, onImport }: Props) {
  const [html, setHtml] = useState('')
  const [result, setResult] = useState<{ recognized: number; opaque: number } | null>(null)
  const [pending, setPending] = useState<Section[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const analyze = (source: string) => {
    const { sections, recognized, opaque } = parseHtmlToSections(source)
    setPending(sections)
    setResult({ recognized, opaque })
  }

  const handleFileUpload = async (files: FileList) => {
    const allHtml: string[] = []
    for (const file of Array.from(files)) {
      const text = await file.text()
      allHtml.push(text)
    }
    const combined = allHtml.join('\n')
    setHtml(combined)
    analyze(combined)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Import sections"
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-sm border border-border bg-card shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold text-foreground">Import HTML</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-7 items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-3">
            {/* File upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) handleFileUpload(e.target.files)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-sm border border-dashed border-border bg-background px-3 py-5 text-center transition-colors hover:border-foreground/30"
            >
              <Upload className="size-5 text-muted-foreground" />
              <span className="text-[12px] font-medium text-foreground">
                Upload HTML files
              </span>
              <span className="text-[11px] text-muted-foreground">
                .html or .htm files
              </span>
            </button>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[11px] font-medium text-muted-foreground">or paste markup</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            {/* Paste HTML */}
            <textarea
              value={html}
              onChange={(e) => {
                setHtml(e.target.value)
                setResult(null)
              }}
              rows={8}
              spellCheck={false}
              placeholder={SAMPLE}
              className="w-full resize-none rounded-sm border border-input bg-background px-3 py-2 font-mono text-[12px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setHtml(SAMPLE)}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                Use sample
              </button>
              <button
                type="button"
                onClick={() => analyze(html)}
                disabled={!html.trim()}
                className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30 disabled:opacity-40"
              >
                Analyze
              </button>
            </div>

            {result && (
              <div className="flex flex-col gap-3 rounded-sm border border-border bg-background p-3">
                <div className="flex items-center gap-2 text-[12px] text-foreground">
                  <CircleCheck className="size-4 text-primary" />
                  Found <strong>{pending.length}</strong> blocks ·{' '}
                  <span className="text-muted-foreground">
                    {result.recognized} recognized, {result.opaque} opaque
                  </span>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onImport(pending, 'append')
                      onClose()
                    }}
                    className="rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground hover:border-foreground/30"
                  >
                    Append to page
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onImport(pending, 'replace')
                      onClose()
                    }}
                    className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary-hover"
                  >
                    Replace page
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
