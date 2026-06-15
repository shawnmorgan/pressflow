'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Frame } from '@/components/canvas/frame'
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
import { supabase } from '@/lib/supabase'

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
  signedUrl?: string
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

function categoryFromFile(file: File): AssetCategory {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return 'file'
}

/* ------------------------------------------------------------------ */
/* Shared hook — all 4 frames share one data layer                    */
/* ------------------------------------------------------------------ */

function useAssets(projectId?: string) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const loadAssets = useCallback(async () => {
    if (!projectId) return
    const { data } = await supabase
      .from('assets')
      .select('id, kind, category, slot, label, original_path, mime, bytes, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (!data) { setLoading(false); return }

    const viewable = data.filter((a: any) => a.kind === 'image' || a.category === 'branding' || a.category === 'video')
    const paths = viewable.map((a: any) => a.original_path)
    let urlMap = new Map<string, string>()
    if (paths.length > 0) {
      const { data: signed } = await supabase.storage
        .from('assets')
        .createSignedUrls(paths, 3600)
      signed?.forEach((s: any) => {
        if (s.signedUrl) urlMap.set(s.path!, s.signedUrl)
      })
    }

    setAssets(
      data.map((a: any) => ({
        ...a,
        signedUrl: urlMap.get(a.original_path),
      }))
    )
    setLoading(false)
  }, [projectId])

  useEffect(() => { loadAssets() }, [loadAssets])

  useEffect(() => {
    const handler = (e: Event) => {
      const files = (e as CustomEvent).detail as FileList
      if (files?.length) uploadFiles(Array.from(files))
    }
    window.addEventListener('pressflow:upload-assets', handler)
    return () => window.removeEventListener('pressflow:upload-assets', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const uploadFiles = async (files: File[], category?: AssetCategory, slot?: string) => {
    if (!projectId || files.length === 0) return
    setUploading(true)

    for (const file of files) {
      const ext = file.name.split('.').pop() ?? ''
      const storagePath = `${projectId}/${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(storagePath, file, { contentType: file.type })

      if (uploadError) {
        console.error('Upload failed:', uploadError.message)
        continue
      }

      const cat = category ?? categoryFromFile(file)
      await supabase.from('assets').insert({
        project_id: projectId,
        kind: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
        category: cat,
        slot: slot ?? null,
        label: file.name,
        original_path: storagePath,
        mime: file.type,
        bytes: file.size,
      })
    }

    setUploading(false)
    loadAssets()
  }

  const removeAsset = async (asset: Asset) => {
    await supabase.storage.from('assets').remove([asset.original_path])
    await supabase.from('assets').delete().eq('id', asset.id)
    setAssets((prev) => prev.filter((a) => a.id !== asset.id))
  }

  const downloadAsset = async (asset: Asset) => {
    if (!asset.signedUrl) {
      const { data } = await supabase.storage.from('assets').createSignedUrl(asset.original_path, 60)
      if (data?.signedUrl) window.open(data.signedUrl, '_blank')
      return
    }
    window.open(asset.signedUrl, '_blank')
  }

  return { assets, loading, uploading, uploadFiles, removeAsset, downloadAsset }
}

/* ------------------------------------------------------------------ */
/* Main component — renders 4 separate frames                         */
/* ------------------------------------------------------------------ */

export function AssetsFrame({ projectId }: { projectId?: string }) {
  const { assets, loading, uploading, uploadFiles, removeAsset, downloadAsset } = useAssets(projectId)
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null)

  const branding = assets.filter((a) => a.category === 'branding')
  const images = assets.filter((a) => a.category === 'image')
  const videos = assets.filter((a) => a.category === 'video')
  const files = assets.filter((a) => a.category === 'file')

  const getSlotAsset = (slot: BrandingSlot) => branding.find((a) => a.slot === slot)

  return (
    <>
      {/* ── Branding Frame ── */}
      <BrandingFrame
        loading={loading}
        uploading={uploading}
        slots={BRANDING_SLOTS}
        getSlotAsset={getSlotAsset}
        uploadFiles={uploadFiles}
        removeAsset={removeAsset}
        onPreview={setDetailAsset}
      />

      {/* ── Images Frame ── */}
      <ImagesFrame
        loading={loading}
        uploading={uploading}
        images={images}
        uploadFiles={uploadFiles}
        onPreview={setDetailAsset}
      />

      {/* ── Videos Frame ── */}
      <VideosFrame
        loading={loading}
        uploading={uploading}
        videos={videos}
        uploadFiles={uploadFiles}
        onPreview={setDetailAsset}
      />

      {/* ── Files Frame ── */}
      <FilesFrame
        loading={loading}
        uploading={uploading}
        files={files}
        uploadFiles={uploadFiles}
        onPreview={setDetailAsset}
      />

      {/* Asset detail modal */}
      {detailAsset && (
        <AssetDetailModal
          asset={detailAsset}
          onClose={() => setDetailAsset(null)}
          onDownload={() => downloadAsset(detailAsset)}
          onDelete={() => { removeAsset(detailAsset); setDetailAsset(null) }}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Branding Frame                                                      */
/* ------------------------------------------------------------------ */

function BrandingFrame({
  loading,
  uploading,
  slots,
  getSlotAsset,
  uploadFiles,
  removeAsset,
  onPreview,
}: {
  loading: boolean
  uploading: boolean
  slots: typeof BRANDING_SLOTS
  getSlotAsset: (slot: BrandingSlot) => Asset | undefined
  uploadFiles: (files: File[], category?: AssetCategory, slot?: string) => Promise<void>
  removeAsset: (asset: Asset) => Promise<void>
  onPreview: (asset: Asset) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingSlot, setPendingSlot] = useState<BrandingSlot | null>(null)

  const handleUpload = (slot: BrandingSlot) => {
    setPendingSlot(slot)
    inputRef.current?.click()
  }

  return (
    <Frame title="Branding" frameId="assets-branding" width={380}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length && pendingSlot) {
            const existing = getSlotAsset(pendingSlot)
            if (existing) removeAsset(existing)
            uploadFiles(Array.from(e.target.files), 'branding', pendingSlot)
          }
          e.target.value = ''
          setPendingSlot(null)
        }}
      />
      <div className="flex flex-col gap-2 p-4">
        {loading ? (
          <p className="py-4 text-center text-[12px] text-muted-foreground">Loading...</p>
        ) : (
          slots.map(({ slot, label, hint }) => {
            const asset = getSlotAsset(slot)
            return (
              <div
                key={slot}
                className="group flex items-center gap-3 rounded-sm border border-border bg-background p-2"
              >
                {asset?.signedUrl ? (
                  <button
                    type="button"
                    onClick={() => onPreview(asset)}
                    className="flex size-12 shrink-0 items-center justify-center rounded-sm border border-border bg-white"
                  >
                    <img
                      src={asset.signedUrl}
                      alt={label}
                      className="max-h-full max-w-full object-contain p-1"
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUpload(slot)}
                    className="flex size-12 shrink-0 items-center justify-center rounded-sm border border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                  >
                    <Plus className="size-4" />
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-foreground">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{hint}</p>
                </div>
                {asset && (
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => handleUpload(slot)}
                      title="Replace"
                      className="flex size-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Upload className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAsset(asset)}
                      title="Remove"
                      className="flex size-6 items-center justify-center rounded-sm text-muted-foreground hover:text-[#d63638]"
                    >
                      <Trash className="size-3" />
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ */
/* Images Frame                                                        */
/* ------------------------------------------------------------------ */

function UploadingBar() {
  return (
    <div className="flex items-center gap-2 border-b border-primary/20 bg-primary/5 px-4 py-2">
      <div className="size-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="text-[11px] font-medium text-primary">Uploading...</span>
    </div>
  )
}

function ImagesFrame({
  loading,
  uploading,
  images,
  uploadFiles,
  onPreview,
}: {
  loading: boolean
  uploading: boolean
  images: Asset[]
  uploadFiles: (files: File[], category?: AssetCategory) => Promise<void>
  onPreview: (asset: Asset) => void
}) {
  const addImages = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = 'image/*'
    input.onchange = () => {
      if (input.files?.length) uploadFiles(Array.from(input.files), 'image')
    }
    input.click()
  }

  return (
    <Frame
      title="Images"
      frameId="assets-images"
      width={380}
      headerRight={
        <button
          type="button"
          onClick={addImages}
          title="Add images"
          className="flex size-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      }
    >
      {uploading && <UploadingBar />}
      <div className="p-4">
        {loading ? (
          <p className="py-4 text-center text-[12px] text-muted-foreground">Loading...</p>
        ) : images.length === 0 ? (
          <button
            type="button"
            onClick={addImages}
            className="flex w-full flex-col items-center gap-1.5 rounded-sm border border-dashed border-border bg-background px-3 py-6 text-center transition-colors hover:border-foreground/30"
          >
            <Upload className="size-4 text-muted-foreground" />
            <span className="text-[12px] font-medium text-foreground">Upload images</span>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {images.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => onPreview(asset)}
                className="group relative aspect-square overflow-hidden rounded-sm border border-border bg-muted transition-shadow hover:shadow-md"
              >
                {asset.signedUrl ? (
                  <img
                    src={asset.signedUrl}
                    alt={asset.label ?? ''}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center">
                    <ImageIcon className="size-5 text-muted-foreground" />
                  </span>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/20">
                  <Eye className="size-5 text-white opacity-0 drop-shadow-sm transition-opacity group-hover:opacity-100" />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ */
/* Videos Frame                                                        */
/* ------------------------------------------------------------------ */

function VideosFrame({
  loading,
  uploading,
  videos,
  uploadFiles,
  onPreview,
}: {
  loading: boolean
  uploading: boolean
  videos: Asset[]
  uploadFiles: (files: File[], category?: AssetCategory) => Promise<void>
  onPreview: (asset: Asset) => void
}) {
  const addVideos = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = 'video/*'
    input.onchange = () => {
      if (input.files?.length) uploadFiles(Array.from(input.files), 'video')
    }
    input.click()
  }

  return (
    <Frame
      title="Videos"
      frameId="assets-videos"
      width={380}
      headerRight={
        <button
          type="button"
          onClick={addVideos}
          title="Add videos"
          className="flex size-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      }
    >
      {uploading && <UploadingBar />}
      <div className="p-4">
        {loading ? (
          <p className="py-4 text-center text-[12px] text-muted-foreground">Loading...</p>
        ) : videos.length === 0 ? (
          <button
            type="button"
            onClick={addVideos}
            className="flex w-full flex-col items-center gap-1.5 rounded-sm border border-dashed border-border bg-background px-3 py-6 text-center transition-colors hover:border-foreground/30"
          >
            <Upload className="size-4 text-muted-foreground" />
            <span className="text-[12px] font-medium text-foreground">Upload videos</span>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {videos.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => onPreview(asset)}
                className="group relative aspect-video overflow-hidden rounded-sm border border-border bg-muted transition-shadow hover:shadow-md"
              >
                <span className="flex size-full items-center justify-center">
                  <Film className="size-5 text-muted-foreground" />
                </span>
                <span className="absolute bottom-1 left-1 truncate rounded-sm bg-foreground/60 px-1.5 py-0.5 text-[9px] font-medium text-white">
                  {asset.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ */
/* Files Frame                                                         */
/* ------------------------------------------------------------------ */

function FilesFrame({
  loading,
  uploading,
  files,
  uploadFiles,
  onPreview,
}: {
  loading: boolean
  uploading: boolean
  files: Asset[]
  uploadFiles: (files: File[], category?: AssetCategory) => Promise<void>
  onPreview: (asset: Asset) => void
}) {
  const addFiles = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = 'application/pdf,.doc,.docx,.zip,.txt,.csv,.xls,.xlsx'
    input.onchange = () => {
      if (input.files?.length) uploadFiles(Array.from(input.files), 'file')
    }
    input.click()
  }

  return (
    <Frame
      title="Files"
      frameId="assets-files"
      width={380}
      headerRight={
        <button
          type="button"
          onClick={addFiles}
          title="Add files"
          className="flex size-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      }
    >
      {uploading && <UploadingBar />}
      <div className="p-4">
        {loading ? (
          <p className="py-4 text-center text-[12px] text-muted-foreground">Loading...</p>
        ) : files.length === 0 ? (
          <button
            type="button"
            onClick={addFiles}
            className="flex w-full flex-col items-center gap-1.5 rounded-sm border border-dashed border-border bg-background px-3 py-6 text-center transition-colors hover:border-foreground/30"
          >
            <Upload className="size-4 text-muted-foreground" />
            <span className="text-[12px] font-medium text-foreground">Upload files</span>
          </button>
        ) : (
          <div className="flex flex-col gap-1.5">
            {files.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => onPreview(asset)}
                className="group flex items-center gap-3 rounded-sm border border-border bg-background p-2 text-left transition-colors hover:border-foreground/20"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-border bg-muted">
                  <FileText className="size-4 text-muted-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-foreground">
                    {asset.label ?? 'Untitled'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatExt(asset.mime)}{formatSize(asset.bytes) ? ` · ${formatSize(asset.bytes)}` : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ */
/* Asset detail modal                                                  */
/* ------------------------------------------------------------------ */

function AssetDetailModal({
  asset,
  onClose,
  onDownload,
  onDelete,
}: {
  asset: Asset
  onClose: () => void
  onDownload: () => void
  onDelete: () => void
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
            <video
              src={asset.signedUrl}
              controls
              className="max-h-[320px] max-w-full rounded-sm"
            />
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
              {asset.category !== 'image' && (
                <span className="capitalize">{asset.category}</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <button
              type="button"
              onClick={() => { onDelete(); onClose() }}
              className="inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[12px] font-medium text-[#d63638] transition-colors hover:bg-[#d63638]/10"
            >
              <Trash className="size-3.5" />
              Delete
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
              >
                Close
              </button>
              <button
                type="button"
                onClick={onDownload}
                className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-1.5 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Download className="size-3.5" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
