'use client'

import { useState } from 'react'
import { X, Upload, Plug, ArrowRight, CircleCheck } from '@/components/icons'
import { parseHtmlToSections, MCP_SOURCES } from '@/lib/import'
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
  const [tab, setTab] = useState<'html' | 'mcp'>('html')

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
          <h2 className="text-[15px] font-semibold text-foreground">Import sections</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-7 items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* tabs */}
        <div className="flex gap-1 border-b border-border px-3 pt-3">
          <TabButton active={tab === 'html'} onClick={() => setTab('html')} icon={<Upload className="size-3.5" />}>
            Import HTML
          </TabButton>
          <TabButton active={tab === 'mcp'} onClick={() => setTab('mcp')} icon={<Plug className="size-3.5" />}>
            Pull from MCP
          </TabButton>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === 'html' ? (
            <HtmlImport onImport={onImport} onClose={onClose} />
          ) : (
            <McpImport onImport={onImport} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-t-sm border-b-2 px-3 py-2 text-[12px] font-medium transition-colors ${
        active
          ? 'border-primary text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

function HtmlImport({
  onImport,
  onClose,
}: {
  onImport: (sections: Section[], mode: 'append' | 'replace') => void
  onClose: () => void
}) {
  const [html, setHtml] = useState('')
  const [result, setResult] = useState<{ recognized: number; opaque: number } | null>(null)
  const [pending, setPending] = useState<Section[]>([])

  const analyze = () => {
    const { sections, recognized, opaque } = parseHtmlToSections(html)
    setPending(sections)
    setResult({ recognized, opaque })
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] leading-relaxed text-muted-foreground">
        Paste HTML markup. Recognized blocks become editable sections; anything
        unrecognized is preserved as an opaque section.
      </p>
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
          onClick={analyze}
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
  )
}

function McpImport({
  onImport,
  onClose,
}: {
  onImport: (sections: Section[], mode: 'append' | 'replace') => void
  onClose: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] leading-relaxed text-muted-foreground">
        Pull a structured sitemap from a connected agent. These map directly to
        recognized, editable sections.
      </p>
      <ul className="flex flex-col gap-2">
        {MCP_SOURCES.map((src) => (
          <li
            key={src.id}
            className="flex items-center justify-between gap-3 rounded-sm border border-border bg-background p-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Plug className="size-3.5 text-primary" />
                <span className="truncate text-[13px] font-medium text-foreground">
                  {src.name}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {src.detail}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onImport(src.build(), 'replace')
                onClose()
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Pull
              <ArrowRight className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
