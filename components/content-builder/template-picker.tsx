'use client'

import { useState } from 'react'
import {
  BUILT_IN_TEMPLATES,
  startForm,
  removeCustomTemplate,
  useCustomTemplates,
  type FormTemplate,
} from '@/lib/content-forms'
import { Check, Layers, Plus, Trash } from '@/components/icons'

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#646970]">
    {children}
  </span>
)

export function TemplatePicker() {
  const custom = useCustomTemplates()
  const [includeStructure, setIncludeStructure] = useState(true)
  const [selected, setSelected] = useState<FormTemplate | null>(null)

  const start = (tpl: FormTemplate) => startForm(tpl, includeStructure)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[20px] font-semibold tracking-tight text-foreground text-balance">
          Start a content collection form
        </h2>
        <p className="mt-1.5 max-w-[64ch] text-[13px] leading-relaxed text-muted-foreground">
          Pick a template for this site type. Each one is pre-loaded with the content
          sections that kind of site needs. You can customize everything before sending.
        </p>
      </div>

      {/* Structure-aware toggle */}
      <button
        type="button"
        onClick={() => setIncludeStructure((v) => !v)}
        className="flex items-start gap-3 rounded-sm border border-border bg-card p-3.5 text-left transition-colors hover:border-foreground/30"
      >
        <span
          role="checkbox"
          aria-checked={includeStructure}
          className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors ${
            includeStructure
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input bg-background'
          }`}
        >
          {includeStructure && <Check className="size-3" />}
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-[13px] font-medium text-foreground">
            Auto-add sections from the sitemap
          </span>
          <span className="text-[12px] leading-relaxed text-muted-foreground">
            Pull a content section for each page section you’re building, so the client fills
            in copy for the actual pages — alongside the template’s site-type sections.
          </span>
        </span>
      </button>

      {/* Built-in templates */}
      <div className="flex flex-col gap-2.5">
        <Label>Site-type templates</Label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BUILT_IN_TEMPLATES.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              tpl={tpl}
              active={selected?.id === tpl.id}
              onSelect={() => setSelected(tpl)}
              onStart={() => start(tpl)}
            />
          ))}
        </div>
      </div>

      {/* Custom templates */}
      {custom.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <Label>Your saved templates</Label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {custom.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                tpl={tpl}
                active={selected?.id === tpl.id}
                onSelect={() => setSelected(tpl)}
                onStart={() => start(tpl)}
                onRemove={() => removeCustomTemplate(tpl.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TemplateCard({
  tpl,
  active,
  onSelect,
  onStart,
  onRemove,
}: {
  tpl: FormTemplate
  active: boolean
  onSelect: () => void
  onStart: () => void
  onRemove?: () => void
}) {
  return (
    <div
      className={`flex flex-col rounded-sm border bg-card transition-colors ${
        active ? 'border-primary' : 'border-border hover:border-foreground/30'
      }`}
    >
      <button type="button" onClick={onSelect} className="flex flex-1 flex-col gap-2 p-3.5 text-left">
        <span className="flex size-8 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground">
          <Layers className="size-4" />
        </span>
        <span className="text-[13px] font-semibold text-foreground">{tpl.name}</span>
        <span className="text-[12px] leading-relaxed text-muted-foreground">
          {tpl.description}
        </span>
        <span className="mt-0.5 text-[11px] text-muted-foreground">
          {tpl.sections.length} section{tpl.sections.length === 1 ? '' : 's'}
          {!tpl.builtIn && ' · custom'}
        </span>
      </button>
      <div className="flex items-center gap-2 border-t border-border px-3 py-2">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="size-3.5" />
          Use template
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Delete ${tpl.name}`}
            className="flex size-7 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:border-[#d63638]/40 hover:text-[#d63638]"
          >
            <Trash className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
