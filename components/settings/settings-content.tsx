'use client'

import { useState, useEffect } from 'react'
import { Check, TypeIcon, Ruler, Layers, Upload, Trash } from '@/components/icons'
import { supabase } from '@/lib/supabase'

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#646970]">
    {children}
  </span>
)

const SCALE_RATIOS = [
  { label: 'Minor third · 1.2', value: 1.2 },
  { label: 'Major third · 1.25', value: 1.25 },
  { label: 'Perfect fourth · 1.333', value: 1.333 },
  { label: 'Golden · 1.618', value: 1.618 },
]

const EXPORT_FORMATS = [
  { label: 'Full block theme (.zip)', value: 'theme' },
  { label: 'Patterns bundle (.zip)', value: 'patterns' },
  { label: 'theme.json only', value: 'json' },
]

const BUILDERS = [
  { label: 'Full Site Editing / Blocks', value: 'fse', available: true },
  { label: 'Classic / PHP templates', value: 'classic', available: false },
  { label: 'Headless (REST + Next.js)', value: 'headless', available: false },
]

export function SettingsContent({ projectId }: { projectId?: string }) {
  const [projectName, setProjectName] = useState('')

  useEffect(() => {
    if (!projectId) return
    let cancelled = false
    supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single()
      .then(({ data }) => {
        if (cancelled || !data) return
        setProjectName(data.name ?? '')
      })
    return () => { cancelled = true }
  }, [projectId])

  const [baseFont, setBaseFont] = useState(16)
  const [ratio, setRatio] = useState(1.25)
  const [spacingUnit, setSpacingUnit] = useState(4)
  const [exportFormat, setExportFormat] = useState('theme')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  return (
    <>
      {/* Project settings */}
      <section>
        <h2 className="text-[14px] font-semibold text-foreground">
          Project settings
        </h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
          Identity and build target for this project.
        </p>

        <div className="mt-4 flex flex-col gap-5 rounded-sm border border-border bg-card p-5">
          {/* Project name */}
          <label className="flex flex-col gap-1.5">
            <FieldLabel>Project name</FieldLabel>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-primary"
            />
          </label>

          {/* Target builder */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Target builder</FieldLabel>
            <div className="flex flex-col gap-2">
              {BUILDERS.map((b) => (
                <label
                  key={b.value}
                  className={`flex items-center gap-3 rounded-sm border px-3 py-2.5 text-[13px] transition-colors ${
                    b.available
                      ? 'cursor-pointer border-primary bg-primary/[0.06]'
                      : 'cursor-not-allowed border-border bg-muted/40'
                  }`}
                >
                  <span
                    className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                      b.available
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card'
                    }`}
                  >
                    {b.available && <span className="size-1.5 rounded-full bg-current" />}
                  </span>
                  <span
                    className={`flex-1 font-medium ${
                      b.available ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {b.label}
                  </span>
                  {!b.available && (
                    <span className="rounded-sm border border-border bg-card px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#646970]">
                      Coming soon
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Design system defaults */}
          <div className="flex flex-col gap-3 border-t border-border pt-5">
            <div className="flex items-center gap-2">
              <FieldLabel>Design system defaults</FieldLabel>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <TypeIcon className="size-3.5" />
                  Base font
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={baseFont}
                    min={12}
                    onChange={(e) => setBaseFont(Number(e.target.value))}
                    className="w-full rounded-sm border border-input bg-background px-2 py-1.5 text-[12px] tabular-nums text-foreground outline-none focus:border-primary"
                  />
                  <span className="text-[11px] text-muted-foreground">px</span>
                </div>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <Layers className="size-3.5" />
                  Scale ratio
                </span>
                <select
                  value={ratio}
                  onChange={(e) => setRatio(Number(e.target.value))}
                  className="w-full rounded-sm border border-input bg-background px-2 py-1.5 text-[12px] text-foreground outline-none focus:border-primary"
                >
                  {SCALE_RATIOS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <Ruler className="size-3.5" />
                  Spacing unit
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={spacingUnit}
                    min={2}
                    onChange={(e) => setSpacingUnit(Number(e.target.value))}
                    className="w-full rounded-sm border border-input bg-background px-2 py-1.5 text-[12px] tabular-nums text-foreground outline-none focus:border-primary"
                  />
                  <span className="text-[11px] text-muted-foreground">px</span>
                </div>
              </label>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Used as the starting point for new design tokens. Existing
              tokens are unchanged.
            </p>
          </div>
        </div>
      </section>

      {/* Workspace */}
      <section>
        <h2 className="text-[14px] font-semibold text-foreground">Workspace</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
          Preferences for the PressFlow app itself.
        </p>

        <div className="mt-4 flex flex-col gap-5 rounded-sm border border-border bg-card p-5">
          {/* App theme */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel>App theme</FieldLabel>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/[0.06] px-3 py-1.5 text-[12px] font-medium text-primary">
                <Check className="size-3.5" />
                Light
              </span>
              <span className="text-[11px] text-muted-foreground">
                Dark and system themes coming soon.
              </span>
            </div>
          </div>

          {/* Default export format */}
          <label className="flex flex-col gap-1.5 border-t border-border pt-5">
            <span className="flex items-center gap-1.5">
              <Upload className="size-3.5 text-muted-foreground" />
              <FieldLabel>Default export format</FieldLabel>
            </span>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="w-full rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-primary sm:max-w-xs"
            >
              {EXPORT_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <h2 className="text-[14px] font-semibold text-[#d63638]">Danger zone</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
          Irreversible actions for this project.
        </p>

        <div className="mt-4 rounded-sm border border-[#d63638]/40 bg-[#d63638]/[0.04] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-foreground">
                Delete this project
              </div>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Permanently removes{' '}
                <span className="font-medium text-foreground">{projectName}</span>,
                its tokens, pages, and connections. This cannot be undone.
              </p>
            </div>

            {!confirmingDelete ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-[#d63638] bg-card px-3 py-1.5 text-[12px] font-medium text-[#d63638] transition-colors hover:bg-[#d63638]/10"
              >
                <Trash className="size-3.5" />
                Delete project
              </button>
            ) : (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-sm border border-[#d63638] bg-[#d63638] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#b32d2e]"
                >
                  <Trash className="size-3.5" />
                  Confirm delete
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
