'use client'

import { useEffect, useMemo, useState } from 'react'
import JSZip from 'jszip'
import { X, Check, FileCode, Package, Layers } from '@/components/icons'
import { type Page } from '@/lib/sitemap'
import { type DesignSystem } from '@/lib/design-system'
import { pageMarkup, themeJson } from '@/lib/block-markup'
import { useToast } from '@/components/ui/toast'

type Props = {
  pages: Page[]
  ds: DesignSystem
  onClose: () => void
}

/**
 * Download modal — choose which files to export and download them. Replaces
 * the former full-screen export view.
 */
export function DownloadModal({ pages, ds, onClose }: Props) {
  const { showToast } = useToast()
  const themeJsonStr = useMemo(() => themeJson(ds), [ds])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const downloadThemeJson = () => {
    downloadBlob('theme.json', themeJsonStr, 'application/json')
    showToast('Downloaded theme.json')
  }

  const downloadPatterns = async () => {
    const zip = new JSZip()
    const folder = zip.folder('patterns')!
    pages.forEach((page) => {
      const slug = page.name.toLowerCase().replace(/\s+/g, '-')
      const header = `<?php\n/**\n * Title: ${page.name}\n * Slug: pressflow/${slug}\n * Categories: pressflow\n */\n?>\n`
      folder.file(`${slug}.php`, header + pageMarkup(page))
    })
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadFile('pressflow-patterns.zip', blob)
    showToast('Downloaded patterns bundle')
  }

  const downloadTheme = async () => {
    const zip = new JSZip()
    zip.file('theme.json', themeJsonStr)
    zip.file('style.css', styleCss())
    zip.file('functions.php', functionsPhp())
    const templates = zip.folder('templates')!
    templates.file(
      'index.html',
      '<!-- wp:template-part {"slug":"header"} /-->\n<!-- wp:post-content /-->\n<!-- wp:template-part {"slug":"footer"} /-->',
    )
    const parts = zip.folder('parts')!
    parts.file('header.html', '<!-- wp:site-title /-->')
    parts.file(
      'footer.html',
      '<!-- wp:paragraph --><p>Built with PressFlow</p><!-- /wp:paragraph -->',
    )
    const patterns = zip.folder('patterns')!
    pages.forEach((page) => {
      const slug = page.name.toLowerCase().replace(/\s+/g, '-')
      const header = `<?php\n/**\n * Title: ${page.name}\n * Slug: pressflow/${slug}\n * Categories: pressflow\n */\n?>\n`
      patterns.file(`${slug}.php`, header + pageMarkup(page))
    })
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadFile('pressflow-theme.zip', blob)
    showToast('Downloaded block theme')
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close download dialog"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Download"
        className="relative w-full max-w-md overflow-hidden rounded-sm border border-border bg-card shadow-lg"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-[14px] font-semibold text-foreground">Download</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex flex-col gap-4 p-5">
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Choose which files to download for your WordPress site.
          </p>
          <div className="flex flex-col gap-2.5">
            <DownloadRow
              icon={<FileCode className="size-4" />}
              title="theme.json"
              meta="Design tokens"
              onClick={downloadThemeJson}
            />
            <DownloadRow
              icon={<Package className="size-4" />}
              title="Patterns bundle"
              meta=".zip"
              onClick={downloadPatterns}
            />
            <DownloadRow
              icon={<Layers className="size-4" />}
              title="Full block theme"
              meta=".zip"
              onClick={downloadTheme}
              primary
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function DownloadRow({
  icon,
  title,
  meta,
  onClick,
  primary = false,
}: {
  icon: React.ReactNode
  title: string
  meta: string
  onClick: () => void | Promise<void>
  primary?: boolean
}) {
  const [busy, setBusy] = useState(false)
  const handle = async () => {
    setBusy(true)
    try {
      await onClick()
    } finally {
      setTimeout(() => setBusy(false), 600)
    }
  }
  return (
    <button
      type="button"
      onClick={handle}
      className={`flex items-center gap-3 rounded-sm border px-3 py-2.5 text-left transition-colors ${
        primary
          ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
          : 'border-border bg-background text-foreground hover:border-foreground/30'
      }`}
    >
      <span className={primary ? 'text-primary-foreground' : 'text-muted-foreground'}>
        {busy ? <Check className="size-4" /> : icon}
      </span>
      <span className="flex-1 text-[13px] font-medium">{title}</span>
      <span
        className={`text-[11px] ${
          primary ? 'text-primary-foreground/80' : 'text-muted-foreground'
        }`}
      >
        {busy ? 'Preparing…' : meta}
      </span>
    </button>
  )
}

/* ---------------- helpers ---------------- */

function downloadBlob(name: string, content: string, type: string) {
  downloadFile(name, new Blob([content], { type }))
}

function downloadFile(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function styleCss() {
  return `/*
Theme Name: PressFlow Export
Theme URI: https://pressflow.studio
Author: PressFlow
Description: A block theme compiled from PressFlow design tokens.
Version: 1.0.0
Requires at least: 6.5
Tested up to: 6.6
Template:
Text Domain: pressflow
*/
`
}

function functionsPhp() {
  return `<?php
function pressflow_register_pattern_category() {
  register_block_pattern_category( 'pressflow', array(
    'label' => __( 'PressFlow', 'pressflow' ),
  ) );
}
add_action( 'init', 'pressflow_register_pattern_category' );
`
}
