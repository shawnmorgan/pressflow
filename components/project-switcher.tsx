'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronUpDown, Check, Plus, ArrowLeft } from '@/components/icons'
import Link from 'next/link'

const PROJECTS = [
  { id: 'aurora', name: 'Aurora Press', sub: 'Personal workspace', initials: 'PF' },
  { id: 'northwind', name: 'Northwind Blog', sub: 'Agency · 4 sites', initials: 'NB' },
  { id: 'studio', name: 'Studio Mori', sub: 'Client handoff', initials: 'SM' },
]

export function ProjectSwitcher() {
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState('aurora')
  const ref = useRef<HTMLDivElement>(null)
  const active = PROJECTS.find((p) => p.id === activeId) ?? PROJECTS[0]

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-sm border border-transparent px-2 py-1.5 text-left transition-colors hover:bg-muted"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-primary text-[11px] font-semibold text-primary-foreground">
          {active.initials}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-[13px] font-semibold leading-tight text-foreground">
            {active.name}
          </span>
          <span className="block truncate text-[11px] leading-tight text-muted-foreground">
            {active.sub}
          </span>
        </span>
        <ChevronUpDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[70] mt-1.5 w-64 rounded-sm border border-border bg-popover py-1 shadow-lg">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Projects
          </p>
          {PROJECTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setActiveId(p.id)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-muted"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-muted text-[11px] font-semibold text-foreground">
                {p.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-foreground">
                  {p.name}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {p.sub}
                </span>
              </span>
              {p.id === activeId && (
                <Check className="size-4 shrink-0 text-primary" />
              )}
            </button>
          ))}
          <div className="my-1 border-t border-border" />
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-sm text-muted-foreground">
              <ArrowLeft className="size-4" />
            </span>
            All Projects
          </Link>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-dashed border-border text-muted-foreground">
              <Plus className="size-4" />
            </span>
            New Project
          </button>
        </div>
      )}
    </div>
  )
}
