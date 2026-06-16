'use client'

import { useSyncExternalStore, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { insertRow, deleteRow } from '@/lib/persistence'

/* =========================================================================
 * Mockups store — the agency-curated holder of high-fidelity mockups that
 * come from Figma / Claude Design as either an IMAGE or raw HTML.
 *
 * Image mockups are stored via the spec path:
 *   File → Storage bucket → assets row → mockups.image_asset_id
 * On load, a signed URL is resolved from the asset's original_path.
 *
 * Data is loaded from and persisted to the Supabase `mockups` table.
 * Uses useSyncExternalStore for reactive updates.
 * ========================================================================= */

export type MockupKind = 'image' | 'html'

export type Mockup = {
  id: string
  /** Friendly name shown in the gallery and client portal. */
  name: string
  kind: MockupKind
  /** Optional association to a sitemap page id. */
  pageId: string | null
  /** FK to assets.id — set for image mockups. */
  imageAssetId?: string
  /** Runtime-resolved signed URL for image mockups (not persisted). */
  imageUrl?: string
  /** Raw HTML document/fragment for html mockups. */
  html?: string
  createdAt: number
}

let mockups: Mockup[] = []
let loadedProjectId: string | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return mockups
}

const SERVER_SNAPSHOT: Mockup[] = []
function getServerSnapshot() {
  return SERVER_SNAPSHOT
}

export async function loadMockups(projectId: string) {
  const { data } = await supabase
    .from('mockups')
    .select('id, name, kind, page_id, html, image_asset_id, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (!data) return

  // Resolve signed URLs for image mockups
  const assetIds = data
    .filter((m: any) => m.kind === 'image' && m.image_asset_id)
    .map((m: any) => m.image_asset_id)

  let assetPaths: Record<string, string> = {}
  if (assetIds.length > 0) {
    const { data: assets } = await supabase
      .from('assets')
      .select('id, original_path')
      .in('id', assetIds)

    if (assets) {
      for (const a of assets) {
        assetPaths[a.id] = a.original_path
      }
    }
  }

  // Batch-create signed URLs
  const signedUrls: Record<string, string> = {}
  const pathsToSign = Object.entries(assetPaths)
  if (pathsToSign.length > 0) {
    const { data: signed } = await supabase.storage
      .from('assets')
      .createSignedUrls(
        pathsToSign.map(([, path]) => path),
        3600,
      )
    if (signed) {
      for (let i = 0; i < pathsToSign.length; i++) {
        const [assetId] = pathsToSign[i]
        if (signed[i]?.signedUrl) {
          signedUrls[assetId] = signed[i].signedUrl!
        }
      }
    }
  }

  loadedProjectId = projectId
  mockups = data.map((m: any) => ({
    id: m.id,
    name: m.name,
    kind: m.kind as MockupKind,
    pageId: m.page_id,
    imageAssetId: m.image_asset_id ?? undefined,
    imageUrl: m.image_asset_id ? signedUrls[m.image_asset_id] : undefined,
    html: m.html ?? undefined,
    createdAt: new Date(m.created_at).getTime(),
  }))
  emit()
}

/**
 * Add a mockup. For image kind, pass the File — it will be uploaded to
 * Storage and linked via an assets row → mockups.image_asset_id.
 */
export async function addMockup(
  input: {
    name: string
    kind: MockupKind
    pageId: string | null
    html?: string
    imageFile?: File
  },
  projectId?: string,
): Promise<Mockup | null> {
  const pid = projectId ?? loadedProjectId
  if (!pid) return null

  let imageAssetId: string | null = null
  let imageUrl: string | undefined

  // Image mockups: upload → asset row → image_asset_id
  if (input.kind === 'image' && input.imageFile) {
    const file = input.imageFile
    const assetId = crypto.randomUUID()
    const ext = file.name.split('.').pop() || 'png'
    const storagePath = `${pid}/${assetId}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('assets')
      .upload(storagePath, file)
    if (uploadErr) return null

    const { error: assetErr } = await insertRow('assets', {
      id: assetId,
      project_id: pid,
      kind: 'image',
      label: input.name,
      original_path: storagePath,
      mime: file.type,
      bytes: file.size,
      category: 'image',
    })
    if (assetErr) {
      // Clean up the uploaded file on asset insert failure
      await supabase.storage.from('assets').remove([storagePath])
      return null
    }

    imageAssetId = assetId

    // Signed URL for immediate display
    const { data: urlData } = await supabase.storage
      .from('assets')
      .createSignedUrl(storagePath, 3600)
    imageUrl = urlData?.signedUrl
  }

  // Insert mockup row via persistence primitive
  const { data, error } = await insertRow('mockups', {
    project_id: pid,
    name: input.name,
    kind: input.kind,
    page_id: input.pageId,
    image_asset_id: imageAssetId,
    html: input.html ?? null,
  })

  if (error || !data) return null

  const mockup: Mockup = {
    id: data.id,
    name: input.name,
    kind: input.kind,
    pageId: input.pageId,
    imageAssetId: imageAssetId ?? undefined,
    imageUrl,
    html: input.html,
    createdAt: new Date(data.created_at).getTime(),
  }
  mockups = [mockup, ...mockups]
  emit()
  return mockup
}

/**
 * Remove a mockup. For image mockups, also cleans up the asset row
 * and the Storage file (no orphans).
 */
export async function removeMockup(id: string) {
  const mockup = mockups.find((m) => m.id === id)
  mockups = mockups.filter((m) => m.id !== id)
  emit()

  // Delete the mockup row
  await deleteRow('mockups', id)

  // Clean up the linked asset + storage file
  if (mockup?.imageAssetId) {
    const { data: asset } = await supabase
      .from('assets')
      .select('original_path')
      .eq('id', mockup.imageAssetId)
      .single()

    if (asset?.original_path) {
      await supabase.storage.from('assets').remove([asset.original_path])
    }
    await deleteRow('assets', mockup.imageAssetId)
  }
}

/** Subscribe to the live mockups list (sorted newest-first). */
export function useMockups(): Mockup[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** Load mockups when projectId changes. */
export function useMockupsLoader(projectId: string | null) {
  useEffect(() => {
    if (!projectId) return
    if (loadedProjectId === projectId) return
    loadMockups(projectId)
  }, [projectId])
}

/**
 * Convert an HTML mockup into ship-able Gutenberg block markup. Converted
 * mockups arrive as a single opaque wp:html block — preserved verbatim and
 * edited later in WordPress, NOT re-editable as structured sections.
 */
export function htmlToBlockMarkup(html: string): string {
  const trimmed = html.trim()
  return ['<!-- wp:html -->', trimmed, '<!-- /wp:html -->'].join('\n')
}
