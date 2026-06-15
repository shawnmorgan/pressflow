'use client'

import { type ClientProject } from '@/lib/client-portal'
import { FieldLabel, SectionIntro, StatusPill } from '@/components/portal/portal-ui'
import { Check } from '@/components/icons'

export type OnboardingField = {
  key: string
  label: string
  placeholder: string
  kind: 'short' | 'long'
  hint?: string
}

export type OnboardingGroup = {
  title: string
  fields: OnboardingField[]
}

export const ONBOARDING_GROUPS: OnboardingGroup[] = [
  {
    title: 'Business details (NAPW)',
    fields: [
      { key: 'name', label: 'Business name', placeholder: 'Aurora Coffee Roasters', kind: 'short' },
      {
        key: 'address',
        label: 'Address',
        placeholder: '123 Harbor St, Portland, OR',
        kind: 'short',
      },
      { key: 'phone', label: 'Phone', placeholder: '(503) 555-0142', kind: 'short' },
      { key: 'website', label: 'Current website', placeholder: 'https://…', kind: 'short' },
    ],
  },
]

const ALL_KEYS = ONBOARDING_GROUPS.flatMap((g) => g.fields.map((f) => f.key))

export function PortalOnboarding({
  project,
  values,
  onChange,
  submitted,
  onSubmit,
}: {
  project: ClientProject
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  submitted: boolean
  onSubmit: () => void
}) {
  const filled = ALL_KEYS.filter((k) => (values[k] ?? '').trim().length > 0).length
  const total = ALL_KEYS.length
  const complete = filled === total

  return (
    <div className="flex flex-col gap-8">
      <SectionIntro
        title="Onboarding"
        blurb="A quick discovery questionnaire so the team understands your business before design begins."
        action={
          submitted ? (
            <StatusPill tone="done">
              <Check className="size-3" />
              Submitted
            </StatusPill>
          ) : (
            <StatusPill tone="pending">
              {filled}/{total} answered
            </StatusPill>
          )
        }
      />

      <div className="flex flex-col gap-6">
        {ONBOARDING_GROUPS.map((group) => (
          <section key={group.title} className="rounded-sm border border-border bg-card p-5">
            <h2 className="text-[13px] font-semibold text-foreground">
              {group.title}
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {group.fields.map((field) => (
                <label
                  key={field.key}
                  className={`flex flex-col gap-1.5 ${field.kind === 'long' ? 'sm:col-span-2' : ''}`}
                >
                  <FieldLabel>{field.label}</FieldLabel>
                  {field.kind === 'long' ? (
                    <textarea
                      value={values[field.key] ?? ''}
                      onChange={(e) => onChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      disabled={submitted}
                      className="w-full resize-y rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:border-primary disabled:opacity-70"
                    />
                  ) : (
                    <input
                      value={values[field.key] ?? ''}
                      onChange={(e) => onChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      disabled={submitted}
                      className="w-full rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary disabled:opacity-70"
                    />
                  )}
                  {field.hint && (
                    <span className="text-[11px] text-muted-foreground">{field.hint}</span>
                  )}
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 rounded-sm border border-border bg-card px-5 py-4">
        <p className="text-[12px] text-muted-foreground">
          {submitted
            ? `Thanks — ${project.agency.name} has your details and will be in touch.`
            : 'You can save as you go. Submit when you’re ready for us to review.'}
        </p>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitted || !complete}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-primary px-4 py-2 text-[12px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitted ? 'Submitted' : 'Submit onboarding'}
        </button>
      </div>
    </div>
  )
}
