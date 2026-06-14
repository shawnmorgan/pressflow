'use client'

import { useRef, useState } from 'react'
import {
  FileCode,
  Copy,
  ImageIcon,
  Plus,
  Trash,
  Upload,
  X,
} from '@/components/icons'
import { MockupMarkupModal } from '@/components/mockups/mockup-markup-modal'
import {
  addMockup,
  removeMockup,
  useMockups,
  type Mockup,
  type MockupKind,
} from '@/lib/mockups'
import { DEFAULT_PAGES } from '@/lib/sitemap'

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#646970]">
    {children}
  </span>
)

const PAGE_OPTIONS = DEFAULT_PAGES.map((p) => ({ id: p.id, name: p.name, slug: p.slug }))
const pageName = (id: string | null) =>
  id ? PAGE_OPTIONS.find((p) => p.id === id)?.name ?? null : null

/**
 * Mockups management surface — add finished mockups (image or raw HTML) from
 * Figma / Claude Design, review them in a gallery, export HTML as block markup,
 * and remove. A holder + review surface, not a design editor. Rendered both on
 * the Mockups canvas tab and the standalone project route.
 */
export function MockupsManager() {
  const mockups = useMockups()
  const [exporting, setExporting] = useState<Mockup | null>(null)

  return (
    <>
      <div className="mb-6">
        <h2 className="text-[20px] font-semibold tracking-tight text-foreground text-balance">
          High-fidelity mockups
        </h2>
        <p className="mt-1.5 max-w-[64ch] text-[13px] leading-relaxed text-muted-foreground">
          Hold finished mockups from Figma or Claude Design — as an image or raw HTML.
          They surface in the client portal for comments and approval. This is a holder
          and review surface, not a design editor.
        </p>
      </div>

      <AddMockupForm />

      {/* Gallery */}
      <div className="mt-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <FieldLabel>Added mockups</FieldLabel>
          <span className="text-[11px] text-muted-foreground">{mockups.length} total</span>
        </div>

        {mockups.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border bg-card px-5 py-12 text-center">
            <p className="text-[13px] text-muted-foreground">
              No mockups yet. Add one above to share it with the client.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {mockups.map((m) => (
              <MockupCard
                key={m.id}
                mockup={m}
                onRemove={() => removeMockup(m.id)}
                onExport={() => setExporting(m)}
              />
            ))}
          </ul>
        )}
      </div>

      {exporting && (
        <MockupMarkupModal mockup={exporting} onClose={() => setExporting(null)} />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Add form                                                            */
/* ------------------------------------------------------------------ */

function AddMockupForm() {
  const [kind, setKind] = useState<MockupKind>('image')
  const [name, setName] = useState('')
  const [pageId, setPageId] = useState<string>('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [html, setHtml] = useState('')
  const [error, setError] = useState<string | null>(null)
  const imageInput = useRef<HTMLInputElement>(null)
  const htmlInput = useRef<HTMLInputElement>(null)

  const reset = () => {
    setName('')
    setPageId('')
    setImageUrl(null)
    setHtml('')
    setError(null)
  }

  const readImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setImageUrl(typeof reader.result === 'string' ? reader.result : null)
      if (!name) setName(file.name.replace(/\.[^.]+$/, ''))
    }
    reader.readAsDataURL(file)
  }

  const readHtmlFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      setHtml(typeof reader.result === 'string' ? reader.result : '')
      if (!name) setName(file.name.replace(/\.[^.]+$/, ''))
    }
    reader.readAsText(file)
  }

  const canAdd =
    name.trim().length > 0 &&
    (kind === 'image' ? !!imageUrl : html.trim().length > 0)

  const add = () => {
    if (!canAdd) return
    addMockup({
      name: name.trim(),
      kind,
      pageId: pageId || null,
      imageUrl: kind === 'image' ? imageUrl ?? undefined : undefined,
      html: kind === 'html' ? html : undefined,
    })
    reset()
  }

  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <div className="flex flex-col gap-4">
        {/* Kind toggle */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Mockup type</FieldLabel>
          <div className="inline-flex w-fit rounded-sm border border-border p-0.5">
            <KindTab
              active={kind === 'image'}
              onClick={() => setKind('image')}
              icon={<ImageIcon className="size-3.5" />}
              label="Image"
            />
            <KindTab
              active={kind === 'html'}
              onClick={() => setKind('html')}
              icon={<FileCode className="size-3.5" />}
              label="HTML"
            />
          </div>
        </div>

        {/* Name + page association */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <FieldLabel>Name</FieldLabel>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Homepage — v2"
              className="rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <FieldLabel>Associated page (optional)</FieldLabel>
            <select
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              className="rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-primary"
            >
              <option value="">No page</option>
              {PAGE_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.slug})
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Source input */}
        {kind === 'image' ? (
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Image</FieldLabel>
            {imageUrl ? (
              <div className="flex items-center gap-3 rounded-sm border border-border bg-background p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl || '/placeholder.svg'}
                  alt="Selected mockup preview"
                  className="h-16 w-24 rounded-sm border border-border object-cover"
                />
                <span className="flex-1 truncate text-[12px] text-muted-foreground">
                  Image ready to add
                </span>
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Remove selected image"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageInput.current?.click()}
                className="flex items-center justify-center gap-2 rounded-sm border border-dashed border-border bg-background px-4 py-8 text-[12px] font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                <Upload className="size-4" />
                Upload an image (PNG, JPG, WebP)
              </button>
            )}
            <input
              ref={imageInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) readImage(file)
                e.target.value = ''
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <FieldLabel>HTML</FieldLabel>
              <button
                type="button"
                onClick={() => htmlInput.current?.click()}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Upload className="size-3.5" />
                Upload .html
              </button>
            </div>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="Paste the mockup HTML here…"
              rows={6}
              className="w-full resize-y rounded-sm border border-input bg-background px-2.5 py-2 font-mono text-[12px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            <input
              ref={htmlInput}
              type="file"
              accept=".html,text/html"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) readHtmlFile(file)
                e.target.value = ''
              }}
            />
          </div>
        )}

        {error && <p className="text-[12px] text-[#d63638]">{error}</p>}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={add}
            disabled={!canAdd}
            className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="size-4" />
            Add mockup
          </button>
        </div>
      </div>
    </div>
  )
}

function KindTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[12px] font-medium transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Gallery card                                                        */
/* ------------------------------------------------------------------ */

function MockupCard({
  mockup,
  onRemove,
  onExport,
}: {
  mockup: Mockup
  onRemove: () => void
  onExport: () => void
}) {
  const associated = pageName(mockup.pageId)
  return (
    <li className="overflow-hidden rounded-sm border border-border bg-card">
      {/* Preview */}
      <div className="border-b border-border bg-muted/40">
        {mockup.kind === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mockup.imageUrl || '/placeholder.svg'}
            alt={`${mockup.name} mockup`}
            className="max-h-[420px] w-full object-cover object-top"
          />
        ) : (
          <iframe
            title={`${mockup.name} preview`}
            srcDoc={mockup.html}
            sandbox=""
            className="h-[360px] w-full bg-white"
          />
        )}
      </div>

      {/* Meta + actions */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-foreground">
            {mockup.name}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {mockup.kind === 'image' ? (
                <ImageIcon className="size-3" />
              ) : (
                <FileCode className="size-3" />
              )}
              {mockup.kind}
            </span>
            {associated && (
              <span className="rounded-sm border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {associated}
              </span>
            )}
          </div>
        </div>

        {mockup.kind === 'html' && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
          >
            <Copy className="size-3.5" />
            Export as block markup
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${mockup.name}`}
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:border-[#d63638]/40 hover:text-[#d63638]"
        >
          <Trash className="size-3.5" />
          Remove
        </button>
      </div>
    </li>
  )
}
