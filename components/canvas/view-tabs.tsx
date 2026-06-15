'use client'

import {
  Settings,
  Palette,
  FileText,
  Layers,
  ImageIcon,
  MessageSquare,
} from '@/components/icons'

export type CanvasView =
  | 'Project'
  | 'Style'
  | 'Content'
  | 'Structure'
  | 'Mockups'
  | 'Comments'

const TABS: { key: CanvasView; label: string; icon: typeof Palette }[] = [
  { key: 'Project', label: 'Project Settings', icon: Settings },
  { key: 'Style', label: 'Style Guide', icon: Palette },
  { key: 'Content', label: 'Content', icon: FileText },
  { key: 'Structure', label: 'Structure', icon: Layers },
  { key: 'Mockups', label: 'Mockups', icon: ImageIcon },
  { key: 'Comments', label: 'Comments', icon: MessageSquare },
]

export function ViewTabs({
  view,
  onChange,
}: {
  view: CanvasView
  onChange: (v: CanvasView) => void
}) {
  return (
    <div className="flex items-center gap-1 rounded-sm p-1">
      {TABS.map((t) => {
        const Icon = t.icon
        const active = t.key === view
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            aria-current={active ? 'page' : undefined}
            title={t.label}
            className={`inline-flex h-8 items-center gap-1.5 rounded-sm px-2.5 text-[12px] font-medium transition-all ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="size-4 shrink-0" />
            <div
              className="overflow-hidden transition-all duration-200 ease-in-out"
              style={{
                display: 'grid',
                gridTemplateColumns: active ? '1fr' : '0fr',
              }}
            >
              <span className="min-w-0 overflow-hidden whitespace-nowrap">
                {t.label}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
