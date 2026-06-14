'use client'

import { useSyncExternalStore } from 'react'

/* =========================================================================
 * Mockups store — the agency-curated holder of high-fidelity mockups that
 * come from Figma / Claude Design as either an IMAGE or raw HTML.
 *
 * This app has no backend; canonical data lives in module-level seeds (see
 * DEFAULT_PAGES / DEFAULT_DESIGN_SYSTEM). This store follows the same model
 * with a tiny subscribe layer so mockups added on the agency Mockups page
 * surface live in the white-labeled Client Portal within a session.
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

const SEED: Mockup[] = [
  {
    id: 'mk-seed-home',
    name: 'Homepage — v2 (Figma)',
    kind: 'image',
    pageId: 'home',
    imageUrl: '/mockups/aurora-home.png',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'mk-seed-cta',
    name: 'Newsletter CTA (Claude Design)',
    kind: 'html',
    pageId: null,
    html: `<section style="font-family:Inter,system-ui,sans-serif;background:#0f6b5c;color:#fff;padding:56px 32px;text-align:center;">
  <p style="text-transform:uppercase;letter-spacing:.12em;font-size:12px;font-weight:700;opacity:.8;margin:0 0 12px;">Stay in the loop</p>
  <h2 style="font-size:32px;font-weight:700;margin:0 0 12px;">Fresh roasts, every Friday</h2>
  <p style="font-size:16px;opacity:.9;max-width:42ch;margin:0 auto 24px;line-height:1.6;">Join the Aurora list for early access to new single-origin beans and brewing notes.</p>
  <span style="display:inline-block;background:#fff;color:#0f6b5c;font-weight:600;padding:12px 22px;border-radius:4px;">Subscribe</span>
</section>`,
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
  },
]

let mockups: Mockup[] = [...SEED]
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

/* Server snapshot is the stable seed (store mutations are client-only). */
const SERVER_SNAPSHOT = SEED
function getServerSnapshot() {
  return SERVER_SNAPSHOT
}

let seq = 0
function nextId() {
  seq += 1
  return `mk-${Date.now()}-${seq}`
}

export function addMockup(input: Omit<Mockup, 'id' | 'createdAt'>) {
  const mockup: Mockup = { ...input, id: nextId(), createdAt: Date.now() }
  mockups = [mockup, ...mockups]
  emit()
  return mockup
}

export function removeMockup(id: string) {
  mockups = mockups.filter((m) => m.id !== id)
  emit()
}

/** Subscribe to the live mockups list (sorted newest-first). */
export function useMockups(): Mockup[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
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
