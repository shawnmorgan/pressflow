export type SectionSource = 'generated' | 'imported' | 'library' | 'opaque'

export type SectionType =
  | 'Navbar'
  | 'Hero'
  | 'LogoRow'
  | 'FeatureGrid'
  | 'FeatureMedia'
  | 'Testimonials'
  | 'Pricing'
  | 'FAQ'
  | 'CTABand'
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
 * The full element set a section can contain. Each is independently toggleable
 * so the structural modal can add/remove primitives without touching layout.
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
}

export type Section = {
  id: string
  type: SectionType
  source: SectionSource
  /** null = use the derived level for this section type */
  headingLevelOverride: number | null
  elements: SectionElements
  /** Card collection — only populated for card-based section types. */
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
  LogoRow: { label: 'Logo Row', hasCards: true, cardLabel: 'Logo', desc: 'Row of partner / client logos' },
  FeatureGrid: { label: 'Feature Grid', hasCards: true, cardLabel: 'Feature', desc: 'Grid of feature cards' },
  FeatureMedia: { label: 'Feature (Content + Media)', hasCards: false, cardLabel: '', desc: 'Split content beside an image' },
  Testimonials: { label: 'Testimonials', hasCards: true, cardLabel: 'Testimonial', desc: 'Customer quotes' },
  Pricing: { label: 'Pricing', hasCards: true, cardLabel: 'Plan', desc: 'Pricing tiers' },
  FAQ: { label: 'FAQ', hasCards: true, cardLabel: 'Question', desc: 'Question / answer list' },
  CTABand: { label: 'CTA Band', hasCards: false, cardLabel: '', desc: 'Full-width call to action' },
  Footer: { label: 'Footer', hasCards: false, cardLabel: '', desc: 'Links + fine print' },
  Opaque: { label: 'Opaque / Custom', hasCards: false, cardLabel: '', desc: 'Preserved imported markup' },
}

/** Section types offered in the inserter (everything except Opaque). */
export const INSERTABLE_TYPES: SectionType[] = [
  'Navbar',
  'Hero',
  'LogoRow',
  'FeatureGrid',
  'FeatureMedia',
  'Testimonials',
  'Pricing',
  'FAQ',
  'CTABand',
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
      e.list = { on: true, items: ['Features', 'Pricing', 'About', 'Contact'] }
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
    case 'LogoRow':
      e.heading = el(true, 'Trusted by modern publishers')
      return {
        elements: e,
        cards: [
          card('Image', 'Acme', ''),
          card('Image', 'Globex', ''),
          card('Image', 'Initech', ''),
          card('Image', 'Umbra', ''),
          card('Image', 'Stark', ''),
        ],
      }
    case 'FeatureGrid':
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
    case 'FeatureMedia':
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
      return { elements: e, cards: [] }
    case 'Testimonials':
      e.heading = el(true, 'Loved by editorial teams')
      e.subheading = el(true, 'What our customers say')
      return {
        elements: e,
        cards: [
          card('Image', 'Dana Okafor', '“PressFlow cut our theme build time in half.”'),
          card('Image', 'Liam Reyes', '“The export is genuinely clean block markup.”'),
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
    case 'CTABand':
      e.heading = el(true, 'Ready to build your theme?')
      e.body = el(true, 'Turn your sitemap into a native WordPress theme today.')
      e.buttons = [{ id: uid('btn'), text: 'Start building' }]
      return { elements: e, cards: [] }
    case 'Footer':
      e.body = el(true, '© PressFlow. All rights reserved.')
      e.list = { on: true, items: ['Privacy', 'Terms', 'Status', 'Contact'] }
      e.image = { on: true } // logo
      return { elements: e, cards: [] }
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

/* ---------- Default sitemap ---------- */

function seed(
  types: { type: SectionType; source: SectionSource }[],
): Section[] {
  return types.map(({ type, source }) => newSection(type, source))
}

const homeId = uid('pg')
const aboutId = uid('pg')
const servicesId = uid('pg')
const pricingId = uid('pg')
const contactId = uid('pg')

export const DEFAULT_PAGES: Page[] = [
  {
    id: homeId,
    name: 'Home',
    slug: '/',
    parentId: null,
    sections: seed([
      { type: 'Navbar', source: 'generated' },
      { type: 'Hero', source: 'generated' },
      { type: 'LogoRow', source: 'library' },
      { type: 'FeatureGrid', source: 'generated' },
      { type: 'CTABand', source: 'generated' },
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
      { type: 'FeatureMedia', source: 'imported' },
      { type: 'Testimonials', source: 'library' },
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
      { type: 'FeatureGrid', source: 'generated' },
      { type: 'CTABand', source: 'generated' },
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

/** A compact list of the active element labels in a section. */
export function elementSummary(section: Section): string[] {
  if (section.type === 'Opaque') return ['Raw markup']
  const e = section.elements
  const out: string[] = []
  if (e.eyebrow.on) out.push('Eyebrow')
  if (e.heading.on) out.push(`H${headingLevel(section)}`)
  if (e.subheading.on) out.push('Subheading')
  if (e.body.on) out.push('Body')
  if (e.buttons.length) out.push(`${e.buttons.length} button${e.buttons.length > 1 ? 's' : ''}`)
  if (e.image.on) out.push('Image')
  if (e.icon.on) out.push('Icon')
  if (e.list.on) out.push(`List (${e.list.items.length})`)
  if (SECTION_META[section.type].hasCards)
    out.push(`${section.cards.length} ${SECTION_META[section.type].cardLabel.toLowerCase()}s`)
  return out
}

export function sectionLabel(section: Section): string {
  if (section.type === 'Opaque' && section.opaqueLabel)
    return `Opaque \u00b7 ${section.opaqueLabel}`
  return SECTION_META[section.type].label
}
