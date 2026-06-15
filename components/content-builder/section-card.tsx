'use client'

import { useState } from 'react'
import {
  FIELD_TYPE_META,
  addField,
  moveField,
  moveSection,
  removeField,
  removeSection,
  updateField,
  updateSection,
  type FieldType,
  type FormField,
  type FormSection,
} from '@/lib/content-forms'
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Pencil,
  Plus,
  Trash,
  Check,
  GripVertical,
} from '@/components/icons'

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#646970]">
    {children}
  </span>
)

const FIELD_TYPES = Object.keys(FIELD_TYPE_META) as FieldType[]

export function SectionCard({
  formId,
  section,
  index,
  count,
}: {
  formId: string
  section: FormSection
  index: number
  count: number
}) {
  const [open, setOpen] = useState(true)
  const [editingTitle, setEditingTitle] = useState(false)
  const requiredCount = section.fields.filter((f) => f.required).length

  return (
    <div className="rounded-sm border border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex size-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={open ? 'Collapse section' : 'Expand section'}
        >
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>

        <div className="min-w-0 flex-1">
          {editingTitle ? (
            <input
              autoFocus
              value={section.title}
              onChange={(e) => updateSection(formId, section.id, { title: e.target.value })}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
              className="w-full rounded-sm border border-input bg-background px-2 py-1 text-[13px] font-medium text-foreground outline-none focus:border-primary"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingTitle(true)}
              className="group flex items-center gap-1.5 text-left"
            >
              <span className="truncate text-[13px] font-medium text-foreground">
                {section.title}
              </span>
              <Pencil className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
        </div>

        <span className="hidden shrink-0 text-[11px] text-muted-foreground md:inline">
          {section.fields.length} field{section.fields.length === 1 ? '' : 's'}
          {requiredCount > 0 && ` · ${requiredCount} required`}
        </span>

        {/* Reorder */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => moveSection(formId, section.id, -1)}
            disabled={index === 0}
            aria-label="Move section up"
            className="flex size-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
          >
            <ChevronsUpDown className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => moveSection(formId, section.id, 1)}
            disabled={index === count - 1}
            aria-label="Move section down"
            className="flex size-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
          >
            <ChevronsDownUp className="size-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => removeSection(formId, section.id)}
          aria-label="Remove section"
          className="flex size-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-[#d63638]"
        >
          <Trash className="size-3.5" />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-3 px-3 py-3">
          {/* Description */}
          <label className="flex flex-col gap-1">
            <Label>Section note (shown to client)</Label>
            <input
              value={section.description}
              onChange={(e) => updateSection(formId, section.id, { description: e.target.value })}
              placeholder="Add a short instruction for this section..."
              className="w-full rounded-sm border border-input bg-background px-2.5 py-1.5 text-[12px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </label>

          {/* Fields */}
          <div className="flex flex-col gap-2">
            {section.fields.map((f) => (
              <FieldRow key={f.id} formId={formId} sectionId={section.id} field={f} />
            ))}
          </div>

          {/* Add field */}
          <AddFieldMenu formId={formId} sectionId={section.id} />
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Field row                                                           */
/* ------------------------------------------------------------------ */

function FieldRow({ formId, sectionId, field }: { formId: string; sectionId: string; field: FormField }) {
  const [open, setOpen] = useState(false)
  const isGroup = field.type === 'group'
  const hasOptions = field.type === 'select' || field.type === 'multiselect'

  return (
    <div className="rounded-sm border border-border bg-background">
      <div className="flex items-center gap-2 px-2.5 py-2">
        <GripVertical className="size-3.5 shrink-0 text-muted-foreground/50" />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <span className="truncate text-[13px] text-foreground">
            {field.label || 'Untitled field'}
            {field.required && <span className="ml-1 text-[#d63638]">*</span>}
          </span>
        </button>
        <span className="shrink-0 rounded-sm border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {FIELD_TYPE_META[field.type].label}
        </span>
        <button
          type="button"
          onClick={() => moveField(formId, sectionId, field.id, -1)}
          aria-label="Move field up"
          className="flex size-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronsUpDown className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => moveField(formId, sectionId, field.id, 1)}
          aria-label="Move field down"
          className="flex size-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronsDownUp className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Edit field"
          className="flex size-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {open ? <ChevronDown className="size-4" /> : <Pencil className="size-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => removeField(formId, sectionId, field.id)}
          aria-label="Remove field"
          className="flex size-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-[#d63638]"
        >
          <Trash className="size-3.5" />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-3 border-t border-border px-2.5 py-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <Label>Label</Label>
              <input
                value={field.label}
                onChange={(e) => updateField(formId, sectionId, field.id, { label: e.target.value })}
                className="rounded-sm border border-input bg-background px-2.5 py-1.5 text-[12px] text-foreground outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1">
              <Label>Field type</Label>
              <select
                value={field.type}
                onChange={(e) =>
                  updateField(formId, sectionId, field.id, {
                    type: e.target.value as FieldType,
                    options:
                      e.target.value === 'select' || e.target.value === 'multiselect'
                        ? field.options ?? ['Option 1', 'Option 2']
                        : undefined,
                    fields:
                      e.target.value === 'group'
                        ? field.fields ?? []
                        : undefined,
                  })
                }
                className="rounded-sm border border-input bg-background px-2.5 py-1.5 text-[12px] text-foreground outline-none focus:border-primary"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {FIELD_TYPE_META[t].label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <Label>Helper text / example</Label>
            <input
              value={field.help}
              onChange={(e) => updateField(formId, sectionId, field.id, { help: e.target.value })}
              placeholder="e.g. Keep it under 60 characters"
              className="rounded-sm border border-input bg-background px-2.5 py-1.5 text-[12px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </label>

          {hasOptions && (
            <OptionsEditor
              options={field.options ?? []}
              onChange={(options) => updateField(formId, sectionId, field.id, { options })}
            />
          )}

          {isGroup && (
            <SubFieldsEditor
              fields={field.fields ?? []}
              onChange={(fields) => updateField(formId, sectionId, field.id, { fields })}
            />
          )}

          <label className="flex items-center gap-2">
            <button
              type="button"
              role="checkbox"
              aria-checked={field.required}
              onClick={() => updateField(formId, sectionId, field.id, { required: !field.required })}
              className={`flex size-4 items-center justify-center rounded-sm border transition-colors ${
                field.required
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background'
              }`}
            >
              {field.required && <Check className="size-3" />}
            </button>
            <span className="text-[12px] text-foreground">Required field</span>
          </label>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Options editor (select / multiselect)                               */
/* ------------------------------------------------------------------ */

function OptionsEditor({
  options,
  onChange,
}: {
  options: string[]
  onChange: (options: string[]) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>Options</Label>
      <div className="flex flex-col gap-1.5">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={opt}
              onChange={(e) => {
                const next = [...options]
                next[i] = e.target.value
                onChange(next)
              }}
              className="flex-1 rounded-sm border border-input bg-background px-2.5 py-1.5 text-[12px] text-foreground outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => onChange(options.filter((_, j) => j !== i))}
              aria-label="Remove option"
              className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-[#d63638]"
            >
              <Trash className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...options, `Option ${options.length + 1}`])}
        className="inline-flex w-fit items-center gap-1 text-[11px] font-medium text-primary transition-opacity hover:opacity-80"
      >
        <Plus className="size-3.5" />
        Add option
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sub-fields editor (repeatable group)                                */
/* ------------------------------------------------------------------ */

function SubFieldsEditor({
  fields,
  onChange,
}: {
  fields: FormField[]
  onChange: (fields: FormField[]) => void
}) {
  let seq = 0
  const newId = () => `sub-${Date.now().toString(36)}-${seq++}`
  const SUB_TYPES = FIELD_TYPES.filter((t) => t !== 'group')

  return (
    <div className="flex flex-col gap-2 rounded-sm border border-dashed border-border bg-muted/30 p-2.5">
      <Label>Repeating fields</Label>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        The client can add this set of fields as many times as needed.
      </p>
      <div className="flex flex-col gap-1.5">
        {fields.map((sf) => (
          <div key={sf.id} className="flex items-center gap-2">
            <input
              value={sf.label}
              onChange={(e) =>
                onChange(fields.map((f) => (f.id === sf.id ? { ...f, label: e.target.value } : f)))
              }
              className="flex-1 rounded-sm border border-input bg-background px-2.5 py-1.5 text-[12px] text-foreground outline-none focus:border-primary"
            />
            <select
              value={sf.type}
              onChange={(e) =>
                onChange(
                  fields.map((f) =>
                    f.id === sf.id ? { ...f, type: e.target.value as FieldType } : f,
                  ),
                )
              }
              className="rounded-sm border border-input bg-background px-2 py-1.5 text-[12px] text-foreground outline-none focus:border-primary"
            >
              {SUB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {FIELD_TYPE_META[t].label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onChange(fields.filter((f) => f.id !== sf.id))}
              aria-label="Remove repeating field"
              className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-[#d63638]"
            >
              <Trash className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...fields, { id: newId(), type: 'short', label: 'New field', required: false, help: '' }])}
        className="inline-flex w-fit items-center gap-1 text-[11px] font-medium text-primary transition-opacity hover:opacity-80"
      >
        <Plus className="size-3.5" />
        Add repeating field
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Add field menu                                                      */
/* ------------------------------------------------------------------ */

function AddFieldMenu({ formId, sectionId }: { formId: string; sectionId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-sm border border-dashed border-border bg-background px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
      >
        <Plus className="size-3.5" />
        Add field
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-60 overflow-hidden rounded-sm border border-border bg-card shadow-md">
            {FIELD_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  addField(formId, sectionId, t)
                  setOpen(false)
                }}
                className="flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors hover:bg-muted"
              >
                <span className="text-[12px] font-medium text-foreground">
                  {FIELD_TYPE_META[t].label}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {FIELD_TYPE_META[t].blurb}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
