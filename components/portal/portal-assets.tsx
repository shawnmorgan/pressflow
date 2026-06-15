'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Check,
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
/* Inline toast                                                        */
/* ------------------------------------------------------------------ */

type ToastType = 'success' | 'error'

function usePortalToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((message: string, type: ToastType = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast({ message, type })
    timerRef.current = setTimeout(() => setToast(null), 3500)
  }, [])

  return { toast, show }
}

function PortalToast({ message, type }: { message: string; type: ToastType }) {
  return (
    <div
      style={{ animation: 'portalToastIn 0.25s ease-out' }}
      className={`fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-sm border px-4 py-2.5 shadow-lg ${
        type === 'success'
          ? 'border-primary/20 bg-primary/10 text-primary'
          : 'border-[#d63638]/20 bg-[#d63638]/10 text-[#d63638]'
      }`}
    >
      <style>{`@keyframes portalToastIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
      <div className="flex items-center gap-2">
        {type === 'success' ? (
          <Check className="size-4 shrink-0" />
        ) : (
          <X className="size-4 shrink-0" />
        )}
        <span className="text-[13px] font-medium">{message}</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function PortalAssets({ token }: { token: string }) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null)
  const [pendingSlot, setPendingSlot] = useState<BrandingSlot | null>(null)
  const brandingInputRef = useRef<HTMLInputElement>(null)
  const { toast, show: showToast } = usePortalToast()

  const loadAssets = useCallback(async () => {
    const res = await fetch(`/api/portal/assets?token=${token}`)
    if (!res.ok) { setLoading(false); return }
    const { assets: data } = await res.json()
    setAssets(data ?? [])
    setLoading(false)
  }, [token])

  useEffect(() => { loadAssets() }, [loadAssets])

  const uploadFile = async (file: File, category?: string, slot?: string): Promise<boolean> => {
    const formData = new FormData()
    formData.append('token', token)
    formData.append('file', file)
    if (category) formData.append('category', category)
    if (slot) formData.append('slot', slot)

    try {
      const res = await fetch('/api/portal/assets', { method: 'POST', body: formData })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Upload failed' }))
        showToast(body.error || 'Upload failed', 'error')
        return false
      }
      return true
    } catch {
      showToast('Network error — please try again', 'error')
      return false
    }
  }

  const uploadFiles = async (files: File[], category?: string) => {
    if (files.length === 0) return
    setUploading(true)
    setUploadProgress({ current: 0, total: files.length })
    let successCount = 0

    for (let i = 0; i < files.length; i++) {
      setUploadProgress({ current: i + 1, total: files.length })
      const ok = await uploadFile(files[i], category)
      if (ok) successCount++
    }

    setUploading(false)
    setUploadProgress(null)
    await loadAssets()

    if (successCount > 0) {
      showToast(
        successCount === 1
          ? `${files[0].name} uploaded`
          : `${successCount} file${successCount === 1 ? '' : 's'} uploaded`,
        'success',
      )
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
        onChange={async (e) => {
          if (e.target.files?.length && pendingSlot) {
            setUploading(true)
            const ok = await uploadFile(e.target.files[0], 'branding', pendingSlot)
            setUploading(false)
            if (ok) {
              await loadAssets()
              showToast(`${pendingSlot === 'logo' ? 'Logo' : pendingSlot === 'logo-variation' ? 'Logo variation' : 'Site icon'} uploaded`, 'success')
            }
          }
          e.target.value = ''
          setPendingSlot(null)
        }}
      />

      <div
        className="relative flex flex-col gap-8"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files.length) uploadFiles(Array.from(e.dataTransfer.files))
        }}
      >
        {/* Drag-over indicator */}
        {dragOver && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-sm border-2 border-dashed border-primary bg-primary/10">
            <div className="flex flex-col items-center gap-2">
              <Upload className="size-8 text-primary" />
              <span className="text-[13px] font-semibold text-primary">
                Drop files to upload
              </span>
            </div>
          </div>
        )}

        {/* Upload progress bar */}
        {uploading && uploadProgress && (
          <div className="rounded-sm border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-[13px] font-medium text-foreground">
                  Uploading{uploadProgress.total > 1 ? ` ${uploadProgress.current}/${uploadProgress.total}` : ''}...
                </span>
              </div>
            </div>
            {uploadProgress.total > 1 && (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%` }}
                />
              </div>
            )}
          </div>
        )}

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
                      disabled={uploading}
                      className="rounded-sm border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30 disabled:opacity-50"
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

      {/* Toast notification */}
      {toast && <PortalToast message={toast.message} type={toast.type} />}
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
