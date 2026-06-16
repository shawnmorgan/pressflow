'use client'

import { useState } from 'react'
import { type ClientProject, type PortalForm } from '@/lib/client-portal'
import { type FormSection, type FormField, type FieldType, type SectionStatus } from '@/lib/content-forms'
import { FieldLabel, SectionIntro, StatusPill } from '@/components/portal/portal-ui'
import { Check, ChevronDown, ChevronRight, Pencil } from '@/components/icons'

export function PortalContent({
  project,
  values,
  statuses,
  onFieldChange,
  onSubmitSection,
  onReopenSection,
}: {
  project: ClientProject
  values: Record<string, Record<string, string>>
  statuses: Record<string, SectionStatus>
  onFieldChange: (sectionId: string, key: string, value: string) => void
  onSubmitSection: (sectionId: string) => void
  onReopenSection: (sectionId: string) => void
}) {
  const forms = project.forms ?? []
  const allSections = forms.flatMap((f) => f.sections)
  const submitted = allSections.filter((s) => statuses[s.id] === 'submitted').length
  const total = allSections.length

  if (forms.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <SectionIntro
          title="Content collection"
          blurb="No content forms have been shared yet. Your project team will send them when ready."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionIntro
        title="Content collection"
        blurb="Answer the questions below to help us build your site. Submit each section when it's ready."
        action={
          <StatusPill tone={submitted === total ? 'done' : 'pending'}>
            {submitted === total && <Check className="size-3" />}
            {submitted}/{total} submitted
          </StatusPill>
        }
      />

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${total ? (submitted / total) * 100 : 0}%` }}
        />
      </div>

      {forms.map((form) => (
        <div key={form.id} className="flex flex-col gap-3">
          <h2 className="text-[14px] font-semibold text-foreground">{form.name}</h2>
          {form.sections.map((section) => (
            <FormSectionCard
              key={section.id}
              section={section}
              status={statuses[section.id] ?? 'outstanding'}
              values={values[section.id] ?? {}}
              onFieldChange={(key, value) => onFieldChange(section.id, key, value)}
              onSubmit={() => onSubmitSection(section.id)}
              onReopen={() => onReopenSection(section.id)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function FormSectionCard({
  section,
  status,
  values,
  onFieldChange,
  onSubmit,
  onReopen,
}: {
  section: FormSection
  status: SectionStatus
  values: Record<string, string>
  onFieldChange: (key: string, value: string) => void
  onSubmit: () => void
  onReopen: () => void
}) {
  const submittedState = status === 'submitted'
  const [open, setOpen] = useState(!submittedState)
  const filled = section.fields.filter((f) => (values[f.id] ?? '').trim().length > 0).length

  return (
    <div className="overflow-hidden rounded-sm border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="text-muted-foreground">
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium text-foreground">{section.title}</span>
          {section.description && (
            <span className="block text-[11px] text-muted-foreground">{section.description}</span>
          )}
        </span>
        {submittedState ? (
          <StatusPill tone="done">
            <Check className="size-3" />
            Submitted
          </StatusPill>
        ) : (
          <StatusPill tone="pending">
            {filled}/{section.fields.length} filled
          </StatusPill>
        )}
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {section.fields.map((field) => (
              <PortalField
                key={field.id}
                field={field}
                value={values[field.id] ?? ''}
                disabled={submittedState}
                onChange={(v) => onFieldChange(field.id, v)}
              />
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
            {submittedState ? (
              <button
                type="button"
                onClick={onReopen}
                className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
              >
                <Pencil className="size-3.5" />
                Edit again
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-1.5 text-[12px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Submit section
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Renders the appropriate input for a FormField type. */
function PortalField({
  field,
  value,
  disabled,
  onChange,
}: {
  field: FormField
  value: string
  disabled: boolean
  onChange: (v: string) => void
}) {
  const isWide: FieldType[] = ['long', 'group']
  const wide = isWide.includes(field.type)

  return (
    <label className={`flex flex-col gap-1.5 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="flex items-baseline gap-1">
        <FieldLabel>{field.label}</FieldLabel>
        {field.required && <span className="text-[10px] text-[#d63638]">*</span>}
      </span>
      {field.help && (
        <span className="text-[11px] leading-snug text-muted-foreground">{field.help}</span>
      )}
      {field.type === 'long' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          disabled={disabled}
          className="w-full resize-y rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] leading-relaxed text-foreground outline-none focus:border-primary disabled:opacity-70"
        />
      ) : field.type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-primary disabled:opacity-70"
        >
          <option value="">Select...</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : field.type === 'multiselect' ? (
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((opt) => {
            const selected = (value ?? '').split(',').filter(Boolean).includes(opt)
            return (
              <button
                key={opt}
                type="button"
                disabled={disabled}
                onClick={() => {
                  const current = (value ?? '').split(',').filter(Boolean)
                  const next = selected ? current.filter((v) => v !== opt) : [...current, opt]
                  onChange(next.join(','))
                }}
                className={`rounded-sm border px-2.5 py-1 text-[12px] font-medium transition-colors disabled:opacity-70 ${
                  selected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-foreground hover:border-foreground/30'
                }`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      ) : (
        <input
          type={field.type === 'url' ? 'url' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-primary disabled:opacity-70"
        />
      )}
    </label>
  )
}
