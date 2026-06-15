'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AccountMenu } from '@/components/account-menu'
import {
  Plus,
  Plug,
  Sparkles,
  FileCode,
  Layers,
  Clock,
  ChevronRight,
  X,
  Check,
  Trash,
} from '@/components/icons'
import { type ProjectSummary } from '@/lib/projects'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { DEFAULT_DESIGN_SYSTEM } from '@/lib/design-system'

type StartingPoint = 'import' | 'mcp' | 'defaults'

const START_OPTIONS: {
  id: StartingPoint
  title: string
  desc: string
  icon: typeof Sparkles
}[] = [
  {
    id: 'import',
    title: 'Import design',
    desc: 'From a DESIGN.md, v0, or Claude Design handoff.',
    icon: FileCode,
  },
  {
    id: 'mcp',
    title: 'Connect via MCP',
    desc: 'Pull a sitemap or tokens from a connected agent.',
    icon: Plug,
  },
  {
    id: 'defaults',
    title: 'Start from defaults',
    desc: 'Begin with the PressFlow base design system.',
    icon: Layers,
  },
]

export function ProjectsDashboard() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ProjectSummary | null>(null)
  const [loadingProjects, setLoadingProjects] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase
        .from('projects')
        .select('id, name, target, stage, updated_at')
        .order('updated_at', { ascending: false })

      if (cancelled) return
      if (data) {
        setProjects(
          data.map((p) => ({
            id: p.id,
            name: p.name,
            target: `${p.target === 'ollie' ? 'Ollie' : p.target} · ${p.stage}`,
            lastEdited: formatRelative(p.updated_at),
            palette: [],
            initials: p.name
              .split(' ')
              .map((w: string) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase(),
          })),
        )
      }
      setLoadingProjects(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-sm bg-primary text-[12px] font-bold text-primary-foreground">
            P
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            PressFlow
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <AccountMenu />
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-5 py-8">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-[20px] font-semibold tracking-tight text-foreground">
                Projects
              </h1>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {projects.length} project{projects.length === 1 ? '' : 's'} ·
                Bring your own AI, unlimited projects.
              </p>
            </div>
            {projects.length > 0 && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="size-4" />
                New project
              </button>
            )}
          </div>

          {loadingProjects ? (
            <div className="mt-10 flex items-center justify-center py-16">
              <span className="text-[13px] text-muted-foreground">Loading projects...</span>
            </div>
          ) : projects.length === 0 ? (
            <EmptyState onCreate={() => setModalOpen(true)} />
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* New project card */}
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="group flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-border bg-card p-5 text-center transition-colors hover:border-primary hover:bg-primary/5"
              >
                <span className="flex size-10 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary">
                  <Plus className="size-5" />
                </span>
                <span className="text-[13px] font-medium text-foreground">
                  New project
                </span>
                <span className="text-[12px] leading-relaxed text-muted-foreground">
                  Import a design, connect via MCP, or start from defaults.
                </span>
              </button>

              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} onDelete={() => setDeleteTarget(p)} />
              ))}
            </div>
          )}
        </div>
      </main>

      {modalOpen && <NewProjectModal onClose={() => setModalOpen(false)} />}
      {deleteTarget && (
        <DeleteProjectModal
          project={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={(id) => {
            setProjects((prev) => prev.filter((p) => p.id !== id))
            setDeleteTarget(null)
          }}
        />
      )}
    </div>
  )
}

function ProjectCard({ project, onDelete }: { project: ProjectSummary; onDelete: () => void }) {
  return (
    <Link
      href={`/editor?project=${project.id}`}
      className="group relative flex min-h-[180px] flex-col rounded-sm border border-border bg-card p-5 transition-colors hover:border-foreground/30"
    >
      <div className="flex items-start justify-between">
        <span className="flex size-10 items-center justify-center rounded-sm bg-muted text-[13px] font-semibold text-foreground">
          {project.initials}
        </span>
        <ChevronRight className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
      </div>

      <h2 className="mt-4 text-[15px] font-semibold text-foreground">
        {project.name}
      </h2>
      <p className="mt-0.5 text-[12px] text-muted-foreground">{project.target}</p>

      {/* Palette preview */}
      <div className="mt-4 flex items-center gap-1">
        {project.palette.map((hex, i) => (
          <span
            key={i}
            className="size-5 rounded-sm border border-border"
            style={{ backgroundColor: hex }}
            title={hex}
          />
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between pt-4">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="size-3.5" />
          {project.lastEdited}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete()
          }}
          aria-label={`Delete ${project.name}`}
          className="flex size-7 items-center justify-center rounded-sm text-red-500 opacity-0 transition-all hover:bg-red-500/10 group-hover:opacity-100"
        >
          <Trash className="size-4" />
        </button>
      </div>
    </Link>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mt-10 flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-card px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-sm border border-border bg-background text-primary">
        <Sparkles className="size-6" />
      </span>
      <h2 className="mt-4 text-[16px] font-semibold text-foreground">
        Create your first project
      </h2>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
        Turn a design system into a native WordPress block theme. Import a
        design, connect a site via MCP, or start from the PressFlow defaults.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-1.5 rounded-sm bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Plus className="size-4" />
        New project
      </button>
    </div>
  )
}

function NewProjectModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [choice, setChoice] = useState<StartingPoint | null>(null)
  const [creating, setCreating] = useState(false)

  const create = async () => {
    if (!choice || !user || creating) return
    setCreating(true)

    // Get account_id for current user
    const { data: membership } = await supabase
      .from('account_members')
      .select('account_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!membership) {
      setCreating(false)
      return
    }

    // Insert project
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        account_id: membership.account_id,
        name: name.trim(),
        target: 'ollie',
        stage: 'onboarding',
      })
      .select('id')
      .single()

    if (error || !project) {
      setCreating(false)
      return
    }

    // Insert default design system
    await supabase
      .from('design_systems')
      .insert({
        project_id: project.id,
        tokens: DEFAULT_DESIGN_SYSTEM as unknown as Record<string, unknown>,
      })

    router.push(`/editor?project=${project.id}`)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New project"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-sm border border-border bg-card shadow-xl"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-[14px] font-semibold text-foreground">
            New project
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 border-b border-border px-5 py-2.5">
          <StepDot active={step >= 1} done={step > 1} label="Name" n={1} />
          <span className="h-px flex-1 bg-border" />
          <StepDot active={step >= 2} done={false} label="Start" n={2} />
        </div>

        {/* Step body */}
        <div className="px-5 py-5">
          {step === 1 ? (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#646970]">
                Project name
              </label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim()) setStep(2)
                }}
                placeholder="e.g. Aurora Press"
                className="rounded-sm border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none transition-colors focus:border-primary"
              />
              <p className="text-[11px] text-muted-foreground">
                You can rename this later in Settings.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#646970]">
                Choose a starting point
              </p>
              {START_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const selected = choice === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setChoice(opt.id)}
                    className={`flex items-start gap-3 rounded-sm border p-3 text-left transition-colors ${
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-background hover:border-foreground/30'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-sm border ${
                        selected
                          ? 'border-primary text-primary'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-foreground">
                        {opt.title}
                      </span>
                      <span className="block text-[12px] leading-relaxed text-muted-foreground">
                        {opt.desc}
                      </span>
                    </span>
                    {selected && (
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3.5">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-sm px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!name.trim()}
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
                <ChevronRight className="size-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-sm px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!choice || creating}
                onClick={create}
                className="rounded-sm bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create project'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function DeleteProjectModal({
  project,
  onClose,
  onDeleted,
}: {
  project: ProjectSummary
  onClose: () => void
  onDeleted: (id: string) => void
}) {
  const [confirmName, setConfirmName] = useState('')
  const [deleting, setDeleting] = useState(false)

  const canDelete = confirmName === project.name

  async function handleDelete() {
    if (!canDelete) return
    setDeleting(true)
    const { error } = await supabase.from('projects').delete().eq('id', project.id)
    if (!error) {
      onDeleted(project.id)
    }
    setDeleting(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Delete project"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-sm border border-border bg-card shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-[14px] font-semibold text-red-500">
            Delete project
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-[13px] leading-relaxed text-foreground">
            This will permanently delete <strong>{project.name}</strong> and all
            of its data. This action cannot be undone.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[#646970]">
              Type &ldquo;{project.name}&rdquo; to confirm
            </label>
            <input
              autoFocus
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canDelete) handleDelete()
              }}
              placeholder={project.name}
              className="rounded-sm border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none transition-colors focus:border-red-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canDelete || deleting}
            onClick={handleDelete}
            className="rounded-sm bg-red-600 px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete project'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StepDot({
  active,
  done,
  label,
  n,
}: {
  active: boolean
  done: boolean
  label: string
  n: number
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`flex size-5 items-center justify-center rounded-full text-[10px] font-semibold ${
          active
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {done ? <Check className="size-3" /> : n}
      </span>
      <span
        className={`text-[11px] font-medium ${
          active ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
    </span>
  )
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}
