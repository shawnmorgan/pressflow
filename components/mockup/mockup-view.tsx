'use client'

import { MockupsManager } from '@/components/mockups/mockups-manager'

/**
 * Mockup view (canvas tab) — the agency-side mockups holder + review surface.
 * Add finished mockups from Figma / Claude Design as an image or raw HTML,
 * review them, export HTML as block markup, and remove. Surfaces into the
 * client portal for comments and approval.
 */
export function MockupView() {
  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Bottom padding leaves room for the floating view switcher. */}
      <div className="mx-auto w-full max-w-3xl px-5 py-8 pb-28">
        <MockupsManager />
      </div>
    </div>
  )
}
