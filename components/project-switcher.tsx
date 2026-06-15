'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronUpDown, Check, Plus, ArrowLeft } from '@/components/icons'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type ProjectItem = {
  id: string
  name: string
  sub: string
  initials: string
}

export function ProjectSwitcher() {
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const ref = useRef<HTMLDivElement>(null)
  const params = useSearchParams()
  const activeId = params.get('project') ?? ''

  const active = projects.find((p) => p.id === activeId) ?? projects[0]

  // Load projects from DB
  useEffect(() => {
    let cancelled = false
    supabase
      .from('projects')
      .select('id, name, target, stage')
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (cancelled || !data) return
        setProjects(
          data.map((p) => ({
            id: p.id,
            name: p.name,
            sub: `${p.target === 'ollie' ? 'Ollie' : p.target} · ${p.stage}`,
            initials: p.name
              .split(' ')
              .map((w: string) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase(),
          })),
        )
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!active) {
    return (
      <div className="flex items-center gap-2.5 px-2 py-1.5">
        <span className="flex size-7 shrink-0 animate-pulse items-center justify-center rounded-sm bg-muted" />
        <span className="hidden h-4 w-24 animate-pulse rounded-sm bg-muted sm:block" />
      </div>
    )
  }

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
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/editor?project=${p.id}`}
              onClick={() => setOpen(false)}
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
            </Link>
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
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-dashed border-border text-muted-foreground">
              <Plus className="size-4" />
            </span>
            New Project
          </Link>
        </div>
      )}
    </div>
  )
}
