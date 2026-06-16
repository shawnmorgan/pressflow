import {
  type Page,
} from '@/lib/sitemap'
import {
  DEFAULT_DESIGN_SYSTEM,
  type DesignSystem,
} from '@/lib/design-system'
import { type FormSection } from '@/lib/content-forms'
import { type MockupKind } from '@/lib/mockups'
import { invokeEdgeFunction } from '@/lib/edge-functions'

/* =========================================================================
 * Client Portal model — the white-labeled, client-facing source of truth.
 * Reads the same canonical builder data (pages + design system) the agency
 * works in, so the portal always reflects real project state.
 * ========================================================================= */

export const PORTAL_STAGES = [
  'onboarding',
  'content',
  'design',
  'approval',
  'build',
  'live',
] as const
export type PortalStage = (typeof PORTAL_STAGES)[number]

export const STAGE_META: Record<
  PortalStage,
  { label: string; blurb: string }
> = {
  onboarding: {
    label: 'Onboarding',
    blurb: 'Tell us about your business so we can get started.',
  },
  content: {
    label: 'Content',
    blurb: 'Share the words and details for each page section.',
  },
  design: {
    label: 'Design',
    blurb: 'We translate your brand into a polished design system.',
  },
  approval: {
    label: 'Approval',
    blurb: 'Review the wireframes and mockups and give the go-ahead.',
  },
  build: {
    label: 'Build',
    blurb: 'We assemble your approved design into the live theme.',
  },
  live: { label: 'Live', blurb: 'Your site is published and ready.' },
}

export type RelevantLink = { id: string; label: string; url: string }

/** The agency identity shown to the client (white-label — never "PressFlow"). */
export type AgencyBrand = {
  name: string
  /** Short mark shown in the header chip. */
  initials: string
  /** Accent color used sparingly for branding touches. */
  accent: string
  contactEmail: string
}

/** A content form as seen by the portal client. */
export type PortalForm = {
  id: string
  kind: string
  name: string
  sections: FormSection[]
  sent: boolean
}

/** Which portal sections are visible, as toggled in project settings. */
export type PortalPermissions = {
  visibleViews: string[]
  canComment: boolean
  canEditContent: boolean
}

/** A mockup as seen by the portal client. */
export type PortalMockup = {
  id: string
  name: string
  kind: MockupKind
  pageId: string | null
  /** Signed URL for image mockups (resolved by edge function). */
  imageUrl?: string
  html?: string
  createdAt: number
}

export type ClientProject = {
  token: string
  agency: AgencyBrand
  projectName: string
  clientName: string
  /** The client's own domain — shown on mockups instead of pressflow.app. */
  domain: string
  stage: PortalStage
  calendarLink: string
  links: RelevantLink[]
  /** Rich-text HTML set in project settings → portal home content. */
  portalContent: string
  /** Share-level permissions controlling what the portal shows. */
  permissions: PortalPermissions
  pages: Page[]
  ds: DesignSystem
  /** Free-form content forms (the new model). */
  forms: PortalForm[]
  /** Mockups shared with the client. */
  mockups: PortalMockup[]
}

/* ---------- Default agency brand (fallback) ---------- */

const DEFAULT_AGENCY: AgencyBrand = {
  name: 'Your Agency',
  initials: 'YA',
  accent: '#3858e9',
  contactEmail: '',
}

/* ---------- Edge-function-backed resolution ---------- */

/**
 * Resolve a portal access token via the resolve-share edge function.
 * No secret key needed — the edge function validates the token and
 * returns the project lens. Safe to call from any server context.
 */
export async function resolveClientProject(
  token: string,
): Promise<ClientProject | null> {
  const { data, error } = await invokeEdgeFunction<any>('resolve-share', { token })

  if (error || !data) return null

  const pages: Page[] = (data.pages ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    parentId: r.parentId,
    sections: r.sections ?? [],
  }))

  const ds: DesignSystem = data.ds
    ? (data.ds as DesignSystem)
    : DEFAULT_DESIGN_SYSTEM

  const agency: AgencyBrand = {
    name: data.agency?.name ?? DEFAULT_AGENCY.name,
    initials: data.agency?.initials ?? DEFAULT_AGENCY.initials,
    accent: data.agency?.accent ?? DEFAULT_AGENCY.accent,
    contactEmail: data.agency?.contactEmail ?? DEFAULT_AGENCY.contactEmail,
  }

  const forms: PortalForm[] = (data.forms ?? [])
    .map((f: any) => ({
      id: f.id,
      kind: f.kind ?? 'content',
      name: f.name ?? 'Untitled',
      sections: f.sections ?? [],
      sent: true,
    }))
    .filter((f: PortalForm) => f.sections.length > 0)

  const permissions: PortalPermissions = {
    visibleViews: data.share?.visibleViews ?? [],
    canComment: data.share?.canComment ?? false,
    canEditContent: data.share?.canEditContent ?? false,
  }

  const mockups: PortalMockup[] = (data.mockups ?? []).map((m: any) => ({
    id: m.id,
    name: m.name ?? 'Untitled',
    kind: (m.kind as MockupKind) ?? 'html',
    pageId: m.page_id ?? null,
    imageUrl: m.image_url ?? undefined,
    html: m.html ?? undefined,
    createdAt: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
  }))

  return {
    token: data.token,
    agency,
    projectName: data.projectName ?? '',
    clientName: data.clientName ?? '',
    domain: data.domain ?? '',
    stage: (data.stage as PortalStage) ?? 'onboarding',
    calendarLink: data.calendarLink ?? '',
    links: (data.links as RelevantLink[]) ?? [],
    portalContent: data.portalContent ?? '',
    permissions,
    pages,
    ds,
    forms,
    mockups,
  }
}
