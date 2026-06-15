'use client'

import { useSyncExternalStore, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/* =========================================================================
 * Mockups store — the agency-curated holder of high-fidelity mockups that
 * come from Figma / Claude Design as either an IMAGE or raw HTML.
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
  /** Data URL (or public path) for image mockups. */
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
    .select('id, name, kind, page_id, html, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (data) {
    loadedProjectId = projectId
    mockups = data.map((m: any) => ({
      id: m.id,
      name: m.name,
      kind: m.kind as MockupKind,
      pageId: m.page_id,
      html: m.html ?? undefined,
      createdAt: new Date(m.created_at).getTime(),
    }))
    emit()
  }
}

export async function addMockup(
  input: Omit<Mockup, 'id' | 'createdAt'>,
  projectId?: string,
): Promise<Mockup | null> {
  const pid = projectId ?? loadedProjectId
  if (!pid) return null

  const { data } = await supabase
    .from('mockups')
    .insert({
      project_id: pid,
      name: input.name,
      kind: input.kind,
      page_id: input.pageId,
      html: input.html ?? null,
    })
    .select('id, created_at')
    .single()

  if (!data) return null

  const mockup: Mockup = {
    ...input,
    id: data.id,
    createdAt: new Date(data.created_at).getTime(),
  }
  mockups = [mockup, ...mockups]
  emit()
  return mockup
}

export async function removeMockup(id: string) {
  mockups = mockups.filter((m) => m.id !== id)
  emit()
  await supabase.from('mockups').delete().eq('id', id)
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
