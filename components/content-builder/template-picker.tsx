'use client'

import {
  BUILT_IN_TEMPLATES,
  createForm,
  removeCustomTemplate,
  useCustomTemplates,
  type FormTemplate,
} from '@/lib/content-forms'
import { Layers, Plus, Trash } from '@/components/icons'

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#646970]">
    {children}
  </span>
)

/**
 * Template picker — shown inside the "add form" modal. Lets the user start
 * blank or from a canned/custom template. NOT a full-screen gate.
 */
export function TemplatePicker({
  projectId,
  onCreated,
  onClose,
}: {
  projectId: string
  onCreated?: () => void
  onClose?: () => void
}) {
  const custom = useCustomTemplates()

  const startBlank = async () => {
    await createForm(projectId, 'Untitled form')
    onCreated?.()
  }

  const startFromTemplate = async (tpl: FormTemplate) => {
    await createForm(projectId, tpl.name, tpl.sections)
    onCreated?.()
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-[15px] font-semibold text-foreground">
          New content request
        </h3>
        <p className="mt-1 max-w-[56ch] text-[12px] leading-relaxed text-muted-foreground">
          Start blank and write your own questions, or pick a template as a starting point.
        </p>
      </div>

      {/* Start blank */}
      <button
        type="button"
        onClick={startBlank}
        className="flex items-center gap-3 rounded-sm border border-dashed border-border bg-card p-4 text-left transition-colors hover:border-foreground/30"
      >
        <span className="flex size-9 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground">
          <Plus className="size-4" />
        </span>
        <span className="flex flex-col">
          <span className="text-[13px] font-medium text-foreground">Start blank</span>
          <span className="text-[12px] text-muted-foreground">
            Write your own questions from scratch.
          </span>
        </span>
      </button>

      {/* Built-in templates */}
      <div className="flex flex-col gap-2.5">
        <Label>Templates</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {BUILT_IN_TEMPLATES.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              tpl={tpl}
              onStart={() => startFromTemplate(tpl)}
            />
          ))}
        </div>
      </div>

      {/* Custom templates */}
      {custom.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <Label>Your saved templates</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {custom.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                tpl={tpl}
                onStart={() => startFromTemplate(tpl)}
                onRemove={() => removeCustomTemplate(tpl.id)}
              />
            ))}
          </div>
        </div>
      )}

      {onClose && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

function TemplateCard({
  tpl,
  onStart,
  onRemove,
}: {
  tpl: FormTemplate
  onStart: () => void
  onRemove?: () => void
}) {
  return (
    <div className="flex flex-col rounded-sm border border-border bg-card transition-colors hover:border-foreground/30">
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <span className="flex size-8 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground">
          <Layers className="size-4" />
        </span>
        <span className="text-[13px] font-semibold text-foreground">{tpl.name}</span>
        <span className="text-[12px] leading-relaxed text-muted-foreground">
          {tpl.description}
        </span>
        <span className="mt-0.5 text-[11px] text-muted-foreground">
          {tpl.sections.length} section{tpl.sections.length === 1 ? '' : 's'}
        </span>
      </div>
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
