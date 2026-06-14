import {
  DEFAULT_PAGES,
  headingLevel,
  type Page,
  type Section,
} from '@/lib/sitemap'
import {
  DEFAULT_DESIGN_SYSTEM,
  toWorkspaceTokens,
  type DesignSystem,
} from '@/lib/design-system'
import type { WorkspaceTokens } from '@/lib/tokens'

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
  pages: Page[]
  ds: DesignSystem
  tokens: WorkspaceTokens
}

/* ---------- Content collection ---------- */

export type ContentFieldKind = 'short' | 'long'
export type ContentField = {
  key: string
  label: string
  kind: ContentFieldKind
  /** The agency's drafted starting value, pulled from the builder. */
  draft: string
}

/**
 * Derive the editable copy fields for a section from its active elements.
 * This is what the client fills in / refines during content collection.
 */
export function sectionContentFields(section: Section): ContentField[] {
  const e = section.elements
  const fields: ContentField[] = []
  if (e.eyebrow.on)
    fields.push({ key: 'eyebrow', label: 'Eyebrow', kind: 'short', draft: e.eyebrow.text })
  if (e.heading.on)
    fields.push({
      key: 'heading',
      label: `Heading (H${headingLevel(section)})`,
      kind: 'short',
      draft: e.heading.text,
    })
  if (e.subheading.on)
    fields.push({ key: 'subheading', label: 'Subheading', kind: 'short', draft: e.subheading.text })
  if (e.body.on)
    fields.push({ key: 'body', label: 'Body copy', kind: 'long', draft: e.body.text })
  e.buttons.forEach((b, i) =>
    fields.push({
      key: `button-${b.id}`,
      label: `Button ${i + 1} label`,
      kind: 'short',
      draft: b.text,
    }),
  )
  if (e.list.on)
    e.list.items.forEach((item, i) =>
      fields.push({ key: `list-${i}`, label: `List item ${i + 1}`, kind: 'short', draft: item }),
    )
  section.cards.forEach((c, i) => {
    fields.push({
      key: `card-${c.id}-title`,
      label: `Item ${i + 1} title`,
      kind: 'short',
      draft: c.title,
    })
    if (c.text)
      fields.push({
        key: `card-${c.id}-text`,
        label: `Item ${i + 1} detail`,
        kind: 'long',
        draft: c.text,
      })
  })
  return fields
}

/** Sections that actually need client copy (skip structural-only blocks). */
export function collectableSections(page: Page): Section[] {
  return page.sections.filter(
    (s) => s.type !== 'Navbar' && s.type !== 'Footer' && sectionContentFields(s).length > 0,
  )
}

/* ---------- Token registry ---------- */

const AURORA: AgencyBrand = {
  name: 'Northbeam Studio',
  initials: 'NB',
  accent: '#0f6b5c',
  contactEmail: 'hello@northbeam.studio',
}

const REGISTRY: Record<string, Omit<ClientProject, 'pages' | 'ds' | 'tokens'>> = {
  aurora: {
    token: 'aurora',
    agency: AURORA,
    projectName: 'Aurora Press',
    clientName: 'Aurora Coffee Roasters',
    domain: 'auroracoffee.com',
    stage: 'approval',
    calendarLink: 'https://cal.com/northbeam/aurora',
    links: [
      { id: 'l1', label: 'Signed proposal', url: 'https://drive.example.com/aurora-proposal' },
      { id: 'l2', label: 'Invoice #0042', url: 'https://billing.example.com/0042' },
      { id: 'l3', label: 'Shared drive', url: 'https://drive.example.com/aurora' },
      { id: 'l4', label: 'Kickoff notes', url: 'https://notes.example.com/aurora-kickoff' },
    ],
  },
}

/**
 * Resolve a portal access token to a project. Returns null for unknown tokens
 * so the route can show a friendly invalid-link screen (token-based access,
 * no client account required).
 */
export function resolveClientProject(token: string): ClientProject | null {
  const base = REGISTRY[token.toLowerCase()]
  if (!base) return null
  const ds = DEFAULT_DESIGN_SYSTEM
  return {
    ...base,
    pages: DEFAULT_PAGES,
    ds,
    tokens: toWorkspaceTokens(ds),
  }
}
