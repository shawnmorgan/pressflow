'use client'

import {
  Palette,
  TypeIcon,
  Layers,
  ImageIcon,
  Sparkles,
  Briefcase,
  Eye,
} from '@/components/icons'

export type CanvasView =
  | 'Project'
  | 'Style'
  | 'Content'
  | 'Sitemap'
  | 'Wireframe'
  | 'Mockup'
  | 'Client View'

const TABS: { label: CanvasView; icon: typeof Palette }[] = [
  { label: 'Style', icon: Palette },
  { label: 'Content', icon: TypeIcon },
  { label: 'Sitemap', icon: Layers },
  { label: 'Wireframe', icon: ImageIcon },
  { label: 'Mockup', icon: Sparkles },
]

/**
 * Main view switcher, centered in the top navbar. Buttons are icon-only; the
 * active view expands to reveal its label with a primary fill, sliding smoothly
 * between selections. A leading Project Settings entry toggles the in-canvas
 * project view, and a trailing Client View entry links to the client portal.
 */
export function ViewTabs({
  view,
  onChange,
}: {
  view: CanvasView
  onChange: (v: CanvasView) => void
}) {
  const projectActive = view === 'Project'
  const clientActive = view === 'Client View'
  return (
    <div className="flex items-center gap-1 rounded-sm p-1">
      {/* Project settings — opens the in-canvas project view */}
      <button
        type="button"
        onClick={() => onChange('Project')}
        aria-current={projectActive ? 'page' : undefined}
        title="Project settings"
        className={`inline-flex h-8 items-center rounded-sm px-2 text-[12px] font-medium transition-colors duration-300 ease-out ${
          projectActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <Briefcase className="size-4 shrink-0" />
        <span
          className={`grid transition-all duration-300 ease-out ${
            projectActive ? 'ml-1.5 grid-cols-[1fr] opacity-100' : 'grid-cols-[0fr] opacity-0'
          }`}
        >
          <span className="overflow-hidden whitespace-nowrap">Project</span>
        </span>
      </button>

      <span className="mx-0.5 h-5 w-px bg-border" aria-hidden="true" />

      {TABS.map((t) => {
        const Icon = t.icon
        const active = t.label === view
        return (
          <button
            key={t.label}
            type="button"
            onClick={() => onChange(t.label)}
            aria-current={active ? 'page' : undefined}
            title={t.label}
            className={`inline-flex h-8 items-center rounded-sm px-2 text-[12px] font-medium transition-colors duration-300 ease-out ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="size-4 shrink-0" />
            <span
              className={`grid transition-all duration-300 ease-out ${
                active ? 'ml-1.5 grid-cols-[1fr] opacity-100' : 'grid-cols-[0fr] opacity-0'
              }`}
            >
              <span className="overflow-hidden whitespace-nowrap">{t.label}</span>
            </span>
          </button>
        )
      })}

      <span className="mx-0.5 h-5 w-px bg-border" aria-hidden="true" />

      {/* Client View — toggles the in-canvas client portal preview */}
      <button
        type="button"
        onClick={() => onChange('Client View')}
        aria-current={clientActive ? 'page' : undefined}
        title="Client View"
        className={`inline-flex h-8 items-center rounded-sm px-2 text-[12px] font-medium transition-colors duration-300 ease-out ${
          clientActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <Eye className="size-4 shrink-0" />
        <span
          className={`grid transition-all duration-300 ease-out ${
            clientActive ? 'ml-1.5 grid-cols-[1fr] opacity-100' : 'grid-cols-[0fr] opacity-0'
          }`}
        >
          <span className="overflow-hidden whitespace-nowrap">Client View</span>
        </span>
      </button>
    </div>
  )
}
