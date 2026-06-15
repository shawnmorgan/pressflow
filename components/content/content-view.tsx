'use client'

import { useState, useEffect, useRef } from 'react'
import { InfiniteCanvas } from '@/components/canvas/infinite-canvas'
import { Frame } from '@/components/canvas/frame'
import { TemplatePicker } from '@/components/content-builder/template-picker'
import { SectionCard } from '@/components/content-builder/section-card'
import { AssetsFrame } from '@/components/content/assets-frame'
import {
  addSection,
  deleteForm,
  forceSaveForm,
  renameForm,
  saveAsTemplate,
  sendToClient,
  setSectionStatus,
  useContentForms,
  type ContentForm,
  type FormSection,
} from '@/lib/content-forms'
import {
  Check,
  FileCode,
  Library,
  Pencil,
  Plus,
  Share,
  Trash,
  Upload,
  X,
  Clock,
  Download,
} from '@/components/icons'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

type ContentSubView = 'assets' | 'requests'

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#646970]">
    {children}
  </span>
)

export function ContentView({ projectId }: { projectId?: string }) {
  const forms = useContentForms()
  const [subView, setSubView] = useState<ContentSubView>('assets')
  const [addFormOpen, setAddFormOpen] = useState(false)

  return (
    <div className="relative flex h-full">
      <InfiniteCanvas
        overlay={
          /* Top-center toggle */
          <div className="pointer-events-auto absolute left-1/2 top-4 z-[55] -translate-x-1/2">
            <div className="flex items-center gap-1 rounded-sm border border-border bg-card p-1 shadow-sm">
              {(['assets', 'requests'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSubView(v)}
                  className={`rounded-sm px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    subView === v
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {v === 'assets' ? 'Assets' : 'Requests'}
                </button>
              ))}
            </div>
          </div>
        }
      >
        <div className="flex gap-8 p-24">
          {subView === 'assets' ? (
            <AssetsFrame projectId={projectId} />
          ) : (
            <>
              {/* Content form frames */}
              {forms.map((form) => (
                <ContentFormFrame key={form.id} form={form} projectId={projectId} />
              ))}

              {/* Ghost "+" frame to create new request */}
              <button
                type="button"
                onClick={() => setAddFormOpen(true)}
                className="flex h-[200px] w-[480px] shrink-0 self-start flex-col items-center justify-center gap-3 rounded-sm border-2 border-dashed border-border bg-card/50 text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                <Plus className="size-6" />
                <span className="text-[13px] font-medium">New content request</span>
              </button>
            </>
          )}
        </div>
      </InfiniteCanvas>

      {/* Add form modal */}
      {addFormOpen && projectId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4"
          onClick={() => setAddFormOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-sm border border-border bg-card p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <TemplatePicker
              projectId={projectId}
              onCreated={() => setAddFormOpen(false)}
              onClose={() => setAddFormOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Content form frame                                                   */
/* ------------------------------------------------------------------ */

function ContentFormFrame({ form, projectId }: { form: ContentForm; projectId?: string }) {
  const [editingName, setEditingName] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const { showToast } = useToast()

  const submitted = form.sections.filter((s) => s.status === 'submitted').length
  const total = form.sections.length

  return (
    <Frame
      title={form.name}
      frameId={`form-${form.id}`}
      width={680}
      headerRight={
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSavingTemplate(true)}
            aria-label="Save as template"
            title="Save as template"
            className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Library className="size-3.5" />
          </button>
        </div>
      }
    >
      {/* Progress bar — shown when form is sent to client */}
      {form.sent && total > 0 && (
        <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-2">
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.round((submitted / total) * 100)}%` }}
            />
          </div>
          <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
            {submitted}/{total} received
          </span>
        </div>
      )}

      <div className="flex flex-col gap-5 p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {editingName ? (
              <input
                autoFocus
                value={form.name}
                onChange={(e) => renameForm(form.id, e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
                className="w-full rounded-sm border border-input bg-background px-2 py-1 text-[15px] font-semibold text-foreground outline-none focus:border-primary"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="group flex items-center gap-2 text-left"
              >
                <h2 className="text-[15px] font-semibold text-foreground">{form.name}</h2>
                <Pencil className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            )}
            <p className="mt-1 text-[12px] text-muted-foreground">
              {total} section{total === 1 ? '' : 's'}
              {form.sent && ` · ${submitted}/${total} received`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (confirm('Delete this form? This cannot be undone.')) deleteForm(form.id)
            }}
            className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-[#d63638]"
            aria-label="Delete form"
          >
            <Trash className="size-3.5" />
          </button>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-3">
          {form.sections.map((s, i) => (
            <SectionWithStatus
              key={s.id}
              formId={form.id}
              section={s}
              index={i}
              count={total}
              sent={form.sent}
            />
          ))}
          <button
            type="button"
            onClick={() => addSection(form.id)}
            className="inline-flex w-fit items-center gap-1.5 rounded-sm border border-dashed border-border bg-card px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <Plus className="size-4" />
            Add section
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
          {!form.sent && (
            <button
              type="button"
              onClick={() => {
                forceSaveForm(form.id)
                setDraftSaved(true)
                setTimeout(() => setDraftSaved(false), 1800)
              }}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
            >
              {draftSaved ? <Check className="size-3.5" /> : null}
              {draftSaved ? 'Saved' : 'Save draft'}
            </button>
          )}
          {form.sent && submitted < total && (
            <button
              type="button"
              onClick={() => showToast('Reminders coming soon')}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
            >
              <Clock className="size-3.5" />
              Send reminder
            </button>
          )}
          {form.sent && submitted === total && total > 0 && (
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
            >
              <Download className="size-3.5" />
              Download PDF
            </button>
          )}
          {form.sent ? (
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-primary bg-primary/[0.06] px-3 py-2 text-[12px] font-semibold text-primary">
              <Check className="size-3.5" />
              {submitted === total && total > 0 ? 'Complete' : 'Sent to client'}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => sendToClient(form.id)}
              className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Share className="size-3.5" />
              Send to client
            </button>
          )}
        </div>

        {savingTemplate && (
          <SaveTemplateModal formId={form.id} onClose={() => setSavingTemplate(false)} projectId={projectId} />
        )}
        {exportOpen && (
          <ExportPdfModal onClose={() => setExportOpen(false)} />
        )}
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ */
/* Section with status indicators                                      */
/* ------------------------------------------------------------------ */

function SectionWithStatus({
  formId,
  section,
  index,
  count,
  sent,
}: {
  formId: string
  section: FormSection
  index: number
  count: number
  sent: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <SectionCard formId={formId} section={section} index={index} count={count} />
      {sent && (
        <div className="flex items-center justify-end gap-2 pr-1">
          {section.status === 'submitted' ? (
            <>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                <Check className="size-3" />
                Content received
              </span>
              <button
                type="button"
                onClick={() => setSectionStatus(formId, section.id, 'outstanding')}
                className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:underline"
              >
                Reopen
              </button>
            </>
          ) : (
            <>
              <span className="text-[11px] font-medium text-[#b26200]">Outstanding</span>
              <button
                type="button"
                onClick={() => setSectionStatus(formId, section.id, 'submitted')}
                className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:underline"
              >
                Mark received
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Save-as-template modal                                              */
/* ------------------------------------------------------------------ */

function SaveTemplateModal({ formId, onClose, projectId }: { formId: string; onClose: () => void; projectId?: string }) {
  const [name, setName] = useState('')
  const { user } = useAuth()
  const [accountId, setAccountId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('account_members')
      .select('account_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setAccountId(data.account_id)
      })
  }, [user])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-sm border border-border bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[15px] font-semibold text-foreground">Save as template</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
          Save this form's sections as a reusable template for future projects.
        </p>
        <label className="mt-4 flex flex-col gap-1.5">
          <Label>Template name</Label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Local service business"
            className="rounded-sm border border-input bg-background px-2.5 py-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </label>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={() => {
              saveAsTemplate(formId, name, accountId ?? undefined)
              onClose()
            }}
            className="rounded-sm bg-primary px-3.5 py-1.5 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save template
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Export PDF modal                                                     */
/* ------------------------------------------------------------------ */

function ExportPdfModal({ onClose }: { onClose: () => void }) {
  const { showToast } = useToast()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-sm border border-border bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[15px] font-semibold text-foreground">Export PDF</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
          Download this form and its collected content as a PDF document.
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              showToast('PDF export coming soon')
              onClose()
            }}
            className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-1.5 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Download className="size-3.5" />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  )
}
