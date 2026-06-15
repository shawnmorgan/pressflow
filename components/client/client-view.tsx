'use client'

import { useEffect, useState } from 'react'
import { InfiniteCanvas } from '@/components/canvas/infinite-canvas'
import { Frame } from '@/components/canvas/frame'
import { Calendar, Check, ExternalLink, LinkIcon } from '@/components/icons'
import {
  PORTAL_STAGES,
  STAGE_META,
  type PortalStage,
  type RelevantLink,
  type AgencyBrand,
} from '@/lib/client-portal'
import { supabase } from '@/lib/supabase'

type ClientViewProject = {
  projectName: string
  clientName: string
  stage: PortalStage
  calendarLink: string
  links: RelevantLink[]
  agency: AgencyBrand
  shareToken: string | null
}

const DEFAULT_AGENCY: AgencyBrand = {
  name: 'Your Agency',
  initials: 'YA',
  accent: '#3858e9',
  contactEmail: '',
}

/**
 * Client View — a basic, read-only preview of the white-labeled client portal
 * placed on the canvas.
 */
export function ClientView({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<ClientViewProject | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    async function load() {
      const [projRes, shareRes] = await Promise.all([
        supabase
          .from('projects')
          .select('name, client_name, stage, calendar_link, relevant_links, accounts(name, white_label)')
          .eq('id', projectId)
          .single(),
        supabase
          .from('shares')
          .select('token')
          .eq('project_id', projectId)
          .eq('revoked', false)
          .limit(1)
          .maybeSingle(),
      ])

      if (cancelled) return

      if (projRes.data) {
        const p = projRes.data as any
        const account = p.accounts
        const wl = account?.white_label ?? {}
        setProject({
          projectName: p.name,
          clientName: p.client_name ?? '',
          stage: (p.stage as PortalStage) ?? 'onboarding',
          calendarLink: p.calendar_link ?? '',
          links: (p.relevant_links as RelevantLink[]) ?? [],
          agency: {
            name: wl.name ?? account?.name ?? DEFAULT_AGENCY.name,
            initials: wl.initials ?? (account?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()) ?? DEFAULT_AGENCY.initials,
            accent: wl.accent ?? DEFAULT_AGENCY.accent,
            contactEmail: wl.contactEmail ?? DEFAULT_AGENCY.contactEmail,
          },
          shareToken: shareRes.data?.token ?? null,
        })
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [projectId])

  if (loading) {
    return (
      <InfiniteCanvas>
        <div className="p-24 pl-72 text-[13px] text-muted-foreground">
          Loading client view...
        </div>
      </InfiniteCanvas>
    )
  }

  if (!project) {
    return (
      <InfiniteCanvas>
        <div className="p-24 pl-72 text-[13px] text-muted-foreground">
          No client portal is configured for this project yet.
        </div>
      </InfiniteCanvas>
    )
  }

  const currentIndex = PORTAL_STAGES.indexOf(project.stage)

  return (
    <InfiniteCanvas>
      <div className="flex items-start gap-10 p-24 pl-72">
        <div className="shrink-0">
          <Frame
            title="Client View"
            width={520}
            badge={
              <span className="rounded-sm border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                Preview
              </span>
            }
            headerRight={
              project.shareToken ? (
                <a
                  href={`/portal/${project.shareToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ExternalLink className="size-3" />
                  Open full portal
                </a>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  Share to generate a portal link
                </span>
              )
            }
          >
            {/* Branded header (white-label — agency, not PressFlow) */}
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <span
                className="flex size-9 items-center justify-center rounded-sm text-[13px] font-semibold text-white"
                style={{ backgroundColor: project.agency.accent }}
              >
                {project.agency.initials}
              </span>
              <div>
                <div className="text-[13px] font-semibold text-foreground">
                  {project.agency.name}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {project.projectName} · {project.clientName}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 px-5 py-5">
              {/* Stage tracker */}
              <section className="flex flex-col gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#646970]">
                  Where things are
                </span>
                <ol className="flex flex-col gap-2">
                  {PORTAL_STAGES.map((stage, i) => {
                    const done = i < currentIndex
                    const current = i === currentIndex
                    return (
                      <li key={stage} className="flex items-center gap-3">
                        <span
                          className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                            done
                              ? 'bg-primary text-primary-foreground'
                              : current
                                ? 'border-2 border-primary text-primary'
                                : 'border border-border text-muted-foreground'
                          }`}
                        >
                          {done ? <Check className="size-3" /> : i + 1}
                        </span>
                        <div className="flex flex-col">
                          <span
                            className={`text-[12px] font-medium ${
                              current ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {STAGE_META[stage].label}
                            {current && (
                              <span className="ml-2 rounded-sm bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                                Current
                              </span>
                            )}
                          </span>
                          {current && (
                            <span className="text-[11px] text-muted-foreground">
                              {STAGE_META[stage].blurb}
                            </span>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </section>

              {/* Calendar */}
              {project.calendarLink && (
                <section className="flex flex-col gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#646970]">
                    Book a time
                  </span>
                  <a
                    href={project.calendarLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-sm border border-border bg-background px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:border-foreground/30"
                  >
                    <Calendar className="size-4 text-muted-foreground" />
                    Schedule a call
                  </a>
                </section>
              )}

              {/* Relevant links */}
              {project.links.length > 0 && (
                <section className="flex flex-col gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#646970]">
                    Documents &amp; links
                  </span>
                  <ul className="flex flex-col divide-y divide-border rounded-sm border border-border">
                    {project.links.map((link) => (
                      <li key={link.id}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 text-[12px] text-foreground transition-colors hover:bg-muted"
                        >
                          <LinkIcon className="size-3.5 text-muted-foreground" />
                          <span className="flex-1">{link.label}</span>
                          <ExternalLink className="size-3 text-muted-foreground" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </Frame>
        </div>
      </div>
    </InfiniteCanvas>
  )
}
