'use client'

import { useEffect, useRef } from 'react'
import { Plus } from '@/components/icons'
import { INSERTABLE_TYPES, SECTION_META, type SectionType } from '@/lib/sitemap'

/**
 * The "+ Add section" affordance with an attached picker of standard section
 * types. Used between sections in both the sitemap and wireframe views.
 */
export function AddSectionDivider({
  open,
  onToggle,
  onPick,
  variant = 'line',
}: {
  open: boolean
  onToggle: () => void
  onPick: (t: SectionType) => void
  variant?: 'line' | 'block'
}) {
  return (
    <div className="relative flex items-center justify-center">
      {variant === 'line' ? (
        <div className="flex w-full items-center gap-2 opacity-50 transition-opacity hover:opacity-100">
          <div className="h-px flex-1 bg-border" />
          <TriggerButton open={open} onToggle={onToggle} />
          <div className="h-px flex-1 bg-border" />
        </div>
      ) : (
        <TriggerButton open={open} onToggle={onToggle} />
      )}
      {open && <Picker onPick={onPick} onClose={onToggle} />}
    </div>
  )
}

function TriggerButton({
  open,
  onToggle,
}: {
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="inline-flex items-center gap-1 rounded-sm border border-dashed border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
    >
      <Plus className="size-3" />
      Add section
    </button>
  )
}

function Picker({
  onPick,
  onClose,
}: {
  onPick: (t: SectionType) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute top-full z-20 mt-1.5 w-[260px] rounded-sm border border-border bg-popover p-1 shadow-lg"
      role="menu"
    >
      <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Insert a section
      </div>
      <ul className="flex flex-col">
        {INSERTABLE_TYPES.map((t) => (
          <li key={t}>
            <button
              type="button"
              onClick={() => onPick(t)}
              className="flex w-full flex-col gap-0.5 rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-muted"
            >
              <span className="text-[12px] font-medium text-foreground">
                {SECTION_META[t].label}
              </span>
              <span className="text-[11px] leading-snug text-muted-foreground">
                {SECTION_META[t].desc}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
