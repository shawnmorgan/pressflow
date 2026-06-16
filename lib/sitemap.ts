export type SectionSource = 'generated' | 'imported' | 'library' | 'opaque'

export type SectionType =
  | 'Navbar'
  | 'Hero'
  | 'TextMedia'
  | 'Feature'
  | 'Testimonial'
  | 'Pricing'
  | 'FAQ'
  | 'CTA'
  | 'Footer'
  | 'Opaque'

export type CardMedia = 'Image' | 'Icon' | 'None'

export type Card = {
  id: string
  media: CardMedia
  title: string
  text: string
  link: string
}

export type ElementState = { on: boolean; text: string }
export type ButtonEl = { id: string; text: string }

/**
 * Per-type element model. Common fields are shared; type-specific fields are
 * optional and only populated for their respective section types.
 */
export type SectionElements = {
  eyebrow: ElementState
  heading: ElementState
  subheading: ElementState
  body: ElementState
  buttons: ButtonEl[]
  image: { on: boolean }
  icon: { on: boolean }
  list: { on: boolean; items: string[] }
  /** Navbar-specific: navigation link labels */
  navLinks?: string[]
  /** TextMedia-specific: media placement */
  layout?: 'left' | 'right'
  /** Footer-specific: legal / copyright bar */
  legalBar?: ElementState
  /** Footer-specific: show social icons placeholder */
  social?: { on: boolean }
}

export type Section = {
  id: string
  type: SectionType
  source: SectionSource
  /** null = use the derived level for this section type */
  headingLevelOverride: number | null
  elements: SectionElements
  /** Card collection — repeatable items (features, testimonials, tiers, FAQ, footer columns). */
  cards: Card[]
  /** Preserved markup for imported, unrecognized sections. */
  opaqueHtml?: string
  /** Friendly label for an opaque section (e.g. its original tag). */
  opaqueLabel?: string
}

export type Page = {
  id: string
  name: string
  slug: string
  parentId: string | null
  sections: Section[]
}

/* ---------- Metadata ---------- */

export const SECTION_META: Record<
  SectionType,
  { label: string; hasCards: boolean; cardLabel: string; desc: string }
> = {
  Navbar: { label: 'Navbar', hasCards: false, cardLabel: '', desc: 'Logo + navigation links' },
  Hero: { label: 'Hero', hasCards: false, cardLabel: '', desc: 'Headline, lead copy, primary CTA' },
  TextMedia: { label: 'Text + Media', hasCards: false, cardLabel: '', desc: 'Split content beside an image or video' },
  Feature: { label: 'Feature', hasCards: true, cardLabel: 'Feature', desc: 'Grid of feature cards with icons' },
  Testimonial: { label: 'Testimonial', hasCards: true, cardLabel: 'Testimonial', desc: 'Customer quotes and reviews' },
  Pricing: { label: 'Pricing', hasCards: true, cardLabel: 'Tier', desc: 'Pricing tiers with features' },
  FAQ: { label: 'FAQ', hasCards: true, cardLabel: 'Question', desc: 'Question / answer list' },
  CTA: { label: 'CTA', hasCards: false, cardLabel: '', desc: 'Full-width call to action' },
  Footer: { label: 'Footer', hasCards: true, cardLabel: 'Column', desc: 'Footer columns, links + legal' },
  Opaque: { label: 'Opaque / Custom', hasCards: false, cardLabel: '', desc: 'Preserved imported markup' },
}

/** Section types offered in the inserter (everything except Opaque). */
export const INSERTABLE_TYPES: SectionType[] = [
  'Navbar',
  'Hero',
  'TextMedia',
  'Feature',
  'Testimonial',
  'Pricing',
  'FAQ',
  'CTA',
  'Footer',
]

export const SOURCE_META: Record<
  SectionSource,
  { label: string; dot: string; text: string }
> = {
  generated: { label: 'Generated', dot: '#3858e9', text: '#3858e9' },
  imported: { label: 'Imported', dot: '#2271b1', text: '#1d6494' },
  library: { label: 'From library', dot: '#dba617', text: '#b26200' },
  opaque: { label: 'Opaque', dot: '#646970', text: '#646970' },
}

/**
 * Derived heading level per section type. Hero leads the page (H1), standard
 * sections are H2, and card titles render as H3 inside those sections.
 */
export function derivedHeadingLevel(type: SectionType): number {
  if (type === 'Hero') return 1
  return 2
}

export function headingLevel(section: Section): number {
  return section.headingLevelOverride ?? derivedHeadingLevel(section.type)
}

export function headingNote(section: Section): string {
  const level = headingLevel(section)
  const role = section.type === 'Hero' ? 'Hero heading' : 'Section heading'
  return `${role} \u2192 H${level}`
}

let counter = 100
export function uid(prefix = 'id'): string {
  counter += 1
  return `${prefix}-${counter}`
}

/* ---------- Element + card builders ---------- */

function el(on: boolean, text: string): ElementState {
  return { on, text }
}
function card(media: CardMedia, title: string, text: string, link = ''): Card {
  return { id: uid('card'), media, title, text, link }
}
function emptyElements(): SectionElements {
  return {
    eyebrow: el(false, ''),
    heading: el(false, ''),
    subheading: el(false, ''),
    body: el(false, ''),
    buttons: [],
    image: { on: false },
    icon: { on: false },
    list: { on: false, items: [] },
  }
}

/**
 * Per-type template: which elements are on by default, seeded content, and any
 * starter cards. New sections feel real rather than empty.
 */
function template(type: SectionType): { elements: SectionElements; cards: Card[] } {
  const e = emptyElements()
  switch (type) {
    case 'Navbar':
      e.navLinks = ['Features', 'Pricing', 'About', 'Contact']
      e.buttons = [{ id: uid('btn'), text: 'Get started' }]
      e.image = { on: true } // logo
      return { elements: e, cards: [] }
    case 'Hero':
      e.eyebrow = el(true, 'Introducing PressFlow')
      e.heading = el(true, 'Publishing, reimagined for teams')
      e.subheading = el(true, 'Ship faster with a native block theme')
      e.body = el(
        true,
        'Define your tokens once and let PressFlow compile a production-ready WordPress theme.',
      )
      e.buttons = [
        { id: uid('btn'), text: 'Get started' },
        { id: uid('btn'), text: 'Book a demo' },
      ]
      e.image = { on: true }
      return { elements: e, cards: [] }
    case 'TextMedia':
      e.eyebrow = el(true, 'Workflow')
      e.heading = el(true, 'From sitemap to shipped theme')
      e.body = el(
        true,
        'Build your structure in the sitemap view, then refine the styled wireframe before exporting.',
      )
      e.list = {
        on: true,
        items: ['Structural + styled views', 'Inline content editing', 'MCP + HTML import'],
      }
      e.buttons = [{ id: uid('btn'), text: 'Learn more' }]
      e.image = { on: true }
      e.layout = 'right'
      return { elements: e, cards: [] }
    case 'Feature':
      e.eyebrow = el(true, 'Capabilities')
      e.heading = el(true, 'Everything you need to launch')
      e.subheading = el(true, 'A complete, token-driven toolkit')
      return {
        elements: e,
        cards: [
          card('Icon', 'Design tokens', 'One locked global style, compiled to theme.json.'),
          card('Icon', 'Reusable sections', 'Assemble pages from structured blocks.'),
          card('Icon', 'Clean export', 'Ship native WordPress block markup.'),
        ],
      }
    case 'Testimonial':
      e.heading = el(true, 'Loved by editorial teams')
      e.subheading = el(true, 'What our customers say')
      return {
        elements: e,
        cards: [
          card('Image', 'Dana Okafor', '"PressFlow cut our theme build time in half."'),
          card('Image', 'Liam Reyes', '"The export is genuinely clean block markup."'),
        ],
      }
    case 'Pricing':
      e.heading = el(true, 'Simple, transparent pricing')
      e.subheading = el(true, 'Plans that scale with you')
      return {
        elements: e,
        cards: [
          card('None', 'Starter', '$0 / mo', 'Choose Starter'),
          card('None', 'Pro', '$39 / mo', 'Choose Pro'),
          card('None', 'Team', '$99 / mo', 'Choose Team'),
        ],
      }
    case 'FAQ':
      e.heading = el(true, 'Frequently asked questions')
      return {
        elements: e,
        cards: [
          card('None', 'How does import work?', 'Paste HTML or pull from a connected MCP source.'),
          card('None', 'Is the output editable?', 'Yes — recognized sections are fully editable.'),
          card('None', 'Can I bring my own AI?', 'Yes. Your tokens, your inference, flat price.'),
        ],
      }
    case 'CTA':
      e.heading = el(true, 'Ready to build your theme?')
      e.body = el(true, 'Turn your sitemap into a native WordPress theme today.')
      e.buttons = [{ id: uid('btn'), text: 'Start building' }]
      return { elements: e, cards: [] }
    case 'Footer':
      e.body = el(true, '\u00a9 PressFlow. All rights reserved.')
      e.legalBar = el(true, '\u00a9 PressFlow. All rights reserved.')
      e.image = { on: true } // logo
      e.social = { on: true }
      return {
        elements: e,
        cards: [
          card('None', 'Product', 'Features\nPricing\nChangelog'),
          card('None', 'Company', 'About\nBlog\nCareers'),
          card('None', 'Legal', 'Privacy\nTerms\nStatus'),
        ],
      }
    case 'Opaque':
    default:
      e.body = el(true, 'Imported markup preserved as-is.')
      return { elements: e, cards: [] }
  }
}

export function newSection(
  type: SectionType,
  source: SectionSource = 'generated',
): Section {
  const { elements, cards } = template(type)
  return {
    id: uid('sec'),
    type,
    source,
    headingLevelOverride: null,
    elements,
    cards,
  }
}

export function newCard(cardLabel: string): Card {
  return card('Icon', `New ${cardLabel.toLowerCase()}`, 'Describe this item.')
}

export function opaqueSection(label: string, html: string): Section {
  const e = emptyElements()
  e.body = el(true, 'This block was imported and is preserved as raw markup.')
  return {
    id: uid('sec'),
    type: 'Opaque',
    source: 'opaque',
    headingLevelOverride: null,
    elements: e,
    cards: [],
    opaqueHtml: html,
    opaqueLabel: label,
  }
}

/**
 * Migrate a section from legacy type names to current names.
 * Handles DB records that may have old type values.
 */
export function migrateSection(section: Section): Section {
  const typeMap: Record<string, SectionType> = {
    FeatureMedia: 'TextMedia',
    FeatureGrid: 'Feature',
    CTABand: 'CTA',
    Testimonials: 'Testimonial',
    LogoRow: 'Feature', // LogoRow absorbed into Feature
  }
  const newType = typeMap[section.type as string]
  if (newType) {
    return { ...section, type: newType }
  }
  return section
}

/**
 * Migrate a page's sections from legacy types.
 */
export function migratePage(page: Page): Page {
  const migrated = page.sections.map(migrateSection)
  if (migrated.some((s, i) => s !== page.sections[i])) {
    return { ...page, sections: migrated }
  }
  return page
}

/* ---------- Default sitemap ---------- */

function seed(
  types: { type: SectionType; source: SectionSource }[],
): Section[] {
  return types.map(({ type, source }) => newSection(type, source))
}

const homeId = crypto.randomUUID()
const aboutId = crypto.randomUUID()
const servicesId = crypto.randomUUID()
const pricingId = crypto.randomUUID()
const contactId = crypto.randomUUID()

export const DEFAULT_PAGES: Page[] = [
  {
    id: homeId,
    name: 'Home',
    slug: '/',
    parentId: null,
    sections: seed([
      { type: 'Navbar', source: 'generated' },
      { type: 'Hero', source: 'generated' },
      { type: 'Feature', source: 'generated' },
      { type: 'CTA', source: 'generated' },
      { type: 'Footer', source: 'generated' },
    ]),
  },
  {
    id: aboutId,
    name: 'About',
    slug: '/about',
    parentId: null,
    sections: seed([
      { type: 'Navbar', source: 'generated' },
      { type: 'Hero', source: 'imported' },
      { type: 'TextMedia', source: 'imported' },
      { type: 'Testimonial', source: 'library' },
      { type: 'Footer', source: 'generated' },
    ]),
  },
  {
    id: servicesId,
    name: 'Services',
    slug: '/services',
    parentId: null,
    sections: seed([
      { type: 'Navbar', source: 'generated' },
      { type: 'Hero', source: 'generated' },
      { type: 'Feature', source: 'generated' },
      { type: 'CTA', source: 'generated' },
      { type: 'Footer', source: 'generated' },
    ]),
  },
  {
    id: pricingId,
    name: 'Pricing',
    slug: '/services/pricing',
    parentId: servicesId,
    sections: seed([
      { type: 'Navbar', source: 'generated' },
      { type: 'Pricing', source: 'generated' },
      { type: 'FAQ', source: 'library' },
      { type: 'Footer', source: 'generated' },
    ]),
  },
  {
    id: contactId,
    name: 'Contact',
    slug: '/contact',
    parentId: null,
    sections: seed([
      { type: 'Navbar', source: 'generated' },
      { type: 'Hero', source: 'generated' },
      { type: 'Footer', source: 'generated' },
    ]),
  },
]

/* ---------- Element inventory (for structural views) ---------- */

/** Per-type summary of active elements in a section. */
export function elementSummary(section: Section): string[] {
  if (section.type === 'Opaque') return ['Raw markup']
  const e = section.elements
  const out: string[] = []

  switch (section.type) {
    case 'Navbar':
      if (e.image?.on) out.push('Logo')
      if (e.navLinks?.length) out.push(`${e.navLinks.length} links`)
      else if (e.list?.on) out.push(`${e.list.items.length} links`)
      if (e.buttons.length) out.push(`${e.buttons.length} button${e.buttons.length > 1 ? 's' : ''}`)
      break
    case 'Hero':
      if (e.eyebrow.on) out.push('Eyebrow')
      if (e.heading.on) out.push('H1')
      if (e.subheading.on) out.push('Subheading')
      if (e.body.on) out.push('Body')
      if (e.buttons.length) out.push(`${e.buttons.length} button${e.buttons.length > 1 ? 's' : ''}`)
      if (e.image?.on) out.push('Media')
      break
    case 'TextMedia':
      if (e.heading.on) out.push(`H${headingLevel(section)}`)
      if (e.body.on) out.push('Body')
      if (e.image?.on) out.push('Media')
      if (e.layout) out.push(`Layout: ${e.layout}`)
      if (e.list?.on) out.push(`List (${e.list.items.length})`)
      if (e.buttons.length) out.push(`${e.buttons.length} button${e.buttons.length > 1 ? 's' : ''}`)
      break
    case 'Feature':
      if (e.eyebrow.on) out.push('Eyebrow')
      if (e.heading.on) out.push(`H${headingLevel(section)}`)
      if (e.subheading.on) out.push('Subheading')
      out.push(`${section.cards.length} feature${section.cards.length !== 1 ? 's' : ''}`)
      break
    case 'Testimonial':
      if (e.heading.on) out.push(`H${headingLevel(section)}`)
      out.push(`${section.cards.length} testimonial${section.cards.length !== 1 ? 's' : ''}`)
      break
    case 'Pricing':
      if (e.heading.on) out.push(`H${headingLevel(section)}`)
      if (e.subheading.on) out.push('Subheading')
      out.push(`${section.cards.length} tier${section.cards.length !== 1 ? 's' : ''}`)
      break
    case 'FAQ':
      if (e.heading.on) out.push(`H${headingLevel(section)}`)
      out.push(`${section.cards.length} question${section.cards.length !== 1 ? 's' : ''}`)
      break
    case 'CTA':
      if (e.heading.on) out.push(`H${headingLevel(section)}`)
      if (e.body.on) out.push('Body')
      if (e.buttons.length) out.push(`${e.buttons.length} button${e.buttons.length > 1 ? 's' : ''}`)
      break
    case 'Footer':
      if (e.image?.on) out.push('Logo')
      out.push(`${section.cards.length} column${section.cards.length !== 1 ? 's' : ''}`)
      if (e.legalBar?.on) out.push('Legal bar')
      if (e.social?.on) out.push('Social')
      break
  }
  return out
}

export function sectionLabel(section: Section): string {
  if (section.type === 'Opaque' && section.opaqueLabel)
    return `Opaque \u00b7 ${section.opaqueLabel}`
  return SECTION_META[section.type]?.label ?? section.type
}
