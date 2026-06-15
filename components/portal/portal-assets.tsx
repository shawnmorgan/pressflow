'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Download,
  Eye,
  Film,
  FileText,
  ImageIcon,
  Palette,
  Plus,
  Trash,
  Upload,
  X,
} from '@/components/icons'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type AssetCategory = 'branding' | 'image' | 'video' | 'file'

type Asset = {
  id: string
  kind: string
  category: AssetCategory
  slot: string | null
  label: string | null
  original_path: string
  mime: string | null
  bytes: number | null
  created_at: string
  signedUrl: string | null
}

type BrandingSlot = 'logo' | 'logo-variation' | 'site-icon'

const BRANDING_SLOTS: { slot: BrandingSlot; label: string; hint: string }[] = [
  { slot: 'logo', label: 'Logo', hint: 'Primary logo' },
  { slot: 'logo-variation', label: 'Logo Variation', hint: 'Alt or horizontal mark' },
  { slot: 'site-icon', label: 'Site Icon', hint: 'Favicon / app icon' },
]

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function formatExt(mime: string | null) {
  if (!mime) return ''
  return mime.split('/')[1]?.toUpperCase() ?? ''
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function PortalAssets({ token }: { token: string }) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null)
  const [pendingSlot, setPendingSlot] = useState<BrandingSlot | null>(null)
  const brandingInputRef = useRef<HTMLInputElement>(null)

  const loadAssets = useCallback(async () => {
    const res = await fetch(`/api/portal/assets?token=${token}`)
    if (!res.ok) { setLoading(false); return }
    const { assets: data } = await res.json()
    setAssets(data ?? [])
    setLoading(false)
  }, [token])

  useEffect(() => { loadAssets() }, [loadAssets])

  const uploadFile = async (file: File, category?: string, slot?: string) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('token', token)
    formData.append('file', file)
    if (category) formData.append('category', category)
    if (slot) formData.append('slot', slot)

    await fetch('/api/portal/assets', { method: 'POST', body: formData })
    setUploading(false)
    loadAssets()
  }

  const uploadFiles = async (files: File[], category?: string) => {
    for (const file of files) {
      await uploadFile(file, category)
    }
  }

  const handleBrandingUpload = (slot: BrandingSlot) => {
    setPendingSlot(slot)
    brandingInputRef.current?.click()
  }

  const getSlotAsset = (slot: BrandingSlot) =>
    assets.filter((a) => a.category === 'branding').find((a) => a.slot === slot)

  const branding = assets.filter((a) => a.category === 'branding')
  const images = assets.filter((a) => a.category === 'image')
  const videos = assets.filter((a) => a.category === 'video')
  const files = assets.filter((a) => a.category === 'file')

  if (loading) {
    return <p className="py-8 text-center text-[13px] text-muted-foreground">Loading assets...</p>
  }

  return (
    <>
      {/* Hidden branding input */}
      <input
        ref={brandingInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length && pendingSlot) {
            uploadFile(e.target.files[0], 'branding', pendingSlot)
          }
          e.target.value = ''
          setPendingSlot(null)
        }}
      />

      <div className="flex flex-col gap-8">
        {/* Intro */}
        <div>
          <h2 className="text-[18px] font-semibold text-foreground">Assets</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Upload your logos, images, videos, and files. Your agency will use these to build your site.
          </p>
        </div>

        {/* Branding */}
        <section>
          <SectionHeader icon={Palette} title="Branding" />
          <div className="mt-3 flex flex-col gap-3">
            {BRANDING_SLOTS.map(({ slot, label, hint }) => {
              const asset = getSlotAsset(slot)
              return (
                <div
                  key={slot}
                  className="flex items-center gap-4 rounded-sm border border-border bg-card p-3"
                >
                  {asset?.signedUrl ? (
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-sm border border-border bg-white p-1">
                      <img
                        src={asset.signedUrl}
                        alt={label}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBrandingUpload(slot)}
                      disabled={uploading}
                      className="flex size-16 shrink-0 items-center justify-center rounded-sm border border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-50"
                    >
                      <Plus className="size-5" />
                    </button>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-foreground">{label}</p>
                    <p className="text-[12px] text-muted-foreground">{hint}</p>
                  </div>
                  {asset && (
                    <button
                      type="button"
                      onClick={() => handleBrandingUpload(slot)}
                      className="rounded-sm border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
                    >
                      Replace
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Images */}
        <section>
          <SectionHeader icon={ImageIcon} title="Images" count={images.length}>
            <UploadButton
              label="Upload images"
              accept="image/*"
              multiple
              uploading={uploading}
              onFiles={(files) => uploadFiles(files, 'image')}
            />
          </SectionHeader>
          {images.length === 0 ? (
            <p className="mt-3 text-center text-[13px] text-muted-foreground">No images yet</p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setDetailAsset(asset)}
                  className="group relative aspect-square overflow-hidden rounded-sm border border-border bg-muted transition-shadow hover:shadow-md"
                >
                  {asset.signedUrl ? (
                    <img src={asset.signedUrl} alt={asset.label ?? ''} className="size-full object-cover" />
                  ) : (
                    <span className="flex size-full items-center justify-center">
                      <ImageIcon className="size-6 text-muted-foreground" />
                    </span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/20">
                    <Eye className="size-5 text-white opacity-0 drop-shadow-sm transition-opacity group-hover:opacity-100" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Videos */}
        <section>
          <SectionHeader icon={Film} title="Videos" count={videos.length}>
            <UploadButton
              label="Upload videos"
              accept="video/*"
              multiple
              uploading={uploading}
              onFiles={(files) => uploadFiles(files, 'video')}
            />
          </SectionHeader>
          {videos.length === 0 ? (
            <p className="mt-3 text-center text-[13px] text-muted-foreground">No videos yet</p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {videos.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setDetailAsset(asset)}
                  className="group relative aspect-video overflow-hidden rounded-sm border border-border bg-muted transition-shadow hover:shadow-md"
                >
                  <span className="flex size-full items-center justify-center">
                    <Film className="size-6 text-muted-foreground" />
                  </span>
                  <span className="absolute bottom-1 left-1 truncate rounded-sm bg-foreground/60 px-2 py-0.5 text-[10px] font-medium text-white">
                    {asset.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Files */}
        <section>
          <SectionHeader icon={FileText} title="Files" count={files.length}>
            <UploadButton
              label="Upload files"
              accept="application/pdf,.doc,.docx,.zip,.txt,.csv,.xls,.xlsx"
              multiple
              uploading={uploading}
              onFiles={(files) => uploadFiles(files, 'file')}
            />
          </SectionHeader>
          {files.length === 0 ? (
            <p className="mt-3 text-center text-[13px] text-muted-foreground">No files yet</p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {files.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setDetailAsset(asset)}
                  className="flex items-center gap-3 rounded-sm border border-border bg-card p-3 text-left transition-colors hover:border-foreground/20"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-border bg-muted">
                    <FileText className="size-5 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-foreground">
                      {asset.label ?? 'Untitled'}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {formatExt(asset.mime)}{formatSize(asset.bytes) ? ` · ${formatSize(asset.bytes)}` : ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Detail modal */}
      {detailAsset && (
        <AssetDetailModal
          asset={detailAsset}
          onClose={() => setDetailAsset(null)}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function SectionHeader({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: typeof ImageIcon
  title: string
  count?: number
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
        {count !== undefined && count > 0 && (
          <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function UploadButton({
  label,
  accept,
  multiple,
  uploading,
  onFiles,
}: {
  label: string
  accept: string
  multiple?: boolean
  uploading: boolean
  onFiles: (files: File[]) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(Array.from(e.target.files))
          e.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30 disabled:opacity-50"
      >
        <Upload className="size-3.5" />
        {uploading ? 'Uploading...' : label}
      </button>
    </>
  )
}

function AssetDetailModal({
  asset,
  onClose,
}: {
  asset: Asset
  onClose: () => void
}) {
  const isImage = asset.kind === 'image' || asset.category === 'branding'
  const isVideo = asset.category === 'video'

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-sm border border-border bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {isImage && asset.signedUrl && (
          <div className="flex items-center justify-center border-b border-border bg-muted/30 p-6">
            <img
              src={asset.signedUrl}
              alt={asset.label ?? ''}
              className="max-h-[320px] max-w-full rounded-sm object-contain"
            />
          </div>
        )}
        {isVideo && asset.signedUrl && (
          <div className="flex items-center justify-center border-b border-border bg-muted/30 p-4">
            <video src={asset.signedUrl} controls className="max-h-[320px] max-w-full rounded-sm" />
          </div>
        )}
        {!isImage && !isVideo && (
          <div className="flex items-center justify-center border-b border-border bg-muted/30 py-12">
            <FileText className="size-12 text-muted-foreground/40" />
          </div>
        )}

        <div className="flex flex-col gap-3 p-5">
          <div>
            <h3 className="text-[14px] font-semibold text-foreground">
              {asset.label ?? 'Untitled'}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
              {asset.mime && (
                <span className="rounded-sm border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium uppercase">
                  {formatExt(asset.mime)}
                </span>
              )}
              {formatSize(asset.bytes) && <span>{formatSize(asset.bytes)}</span>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
            >
              Close
            </button>
            {asset.signedUrl && (
              <a
                href={asset.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-1.5 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Download className="size-3.5" />
                Download
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
