import {
  type Page,
  type Section,
  type Card,
  headingLevel,
  SECTION_META,
} from '@/lib/sitemap'
import { type WorkspaceTokens, computeTypeScale } from '@/lib/tokens'

/**
 * Generates Gutenberg block markup (comment-delimited HTML) for a single
 * section from its element + card model. Intentionally readable rather than
 * minified so the Export preview reads like real WordPress output.
 */
export function sectionMarkup(section: Section): string {
  const { type, elements: e } = section
  const lines: string[] = []
  const open = (s: string) => lines.push(s)

  // Opaque sections are emitted as a preserved custom HTML block.
  if (type === 'Opaque') {
    open(`<!-- wp:html -->`)
    open(section.opaqueHtml?.trim() || '<div><!-- imported markup --></div>')
    open(`<!-- /wp:html -->`)
    return lines.join('\n')
  }

  const heading = (level: number, text: string) => {
    if (!text) return
    open(`  <!-- wp:heading {"level":${level}} -->`)
    open(`  <h${level} class="wp-block-heading">${escapeHtml(text)}</h${level}>`)
    open(`  <!-- /wp:heading -->`)
  }
  const paragraph = (text: string, style?: string) => {
    if (!text) return
    const attr = style ? ` {"className":"is-style-${style}"}` : ''
    const cls = style ? ` class="is-style-${style}"` : ''
    open(`  <!-- wp:paragraph${attr} -->`)
    open(`  <p${cls}>${escapeHtml(text)}</p>`)
    open(`  <!-- /wp:paragraph -->`)
  }
  const buttons = (items: { text: string }[]) => {
    const valid = items.filter((b) => b.text)
    if (!valid.length) return
    open(`  <!-- wp:buttons -->`)
    open(`  <div class="wp-block-buttons">`)
    for (const b of valid) {
      open(`    <!-- wp:button -->`)
      open(
        `    <div class="wp-block-button"><a class="wp-block-button__link wp-element-button">${escapeHtml(
          b.text,
        )}</a></div>`,
      )
      open(`    <!-- /wp:button -->`)
    }
    open(`  </div>`)
    open(`  <!-- /wp:buttons -->`)
  }
  const list = (items: string[]) => {
    if (!items.length) return
    open(`  <!-- wp:list -->`)
    open(`  <ul class="wp-block-list">`)
    for (const i of items) open(`    <!-- wp:list-item --><li>${escapeHtml(i)}</li><!-- /wp:list-item -->`)
    open(`  </ul>`)
    open(`  <!-- /wp:list -->`)
  }
  const image = () => {
    open(`  <!-- wp:image -->`)
    open(`  <figure class="wp-block-image"><img alt="" /></figure>`)
    open(`  <!-- /wp:image -->`)
  }
  const cardGrid = (cards: Card[]) => {
    if (!cards.length) return
    open(`  <!-- wp:columns -->`)
    open(`  <div class="wp-block-columns">`)
    for (const c of cards) {
      open(`    <!-- wp:column -->`)
      open(`    <div class="wp-block-column">`)
      if (c.media === 'Image') image()
      if (c.media === 'Icon')
        open(`      <!-- wp:image {"className":"is-style-icon"} --><figure class="wp-block-image is-style-icon"><img alt="" /></figure><!-- /wp:image -->`)
      if (c.title) {
        open(`      <!-- wp:heading {"level":3} -->`)
        open(`      <h3 class="wp-block-heading">${escapeHtml(c.title)}</h3>`)
        open(`      <!-- /wp:heading -->`)
      }
      if (c.text) open(`      <!-- wp:paragraph --><p>${escapeHtml(c.text)}</p><!-- /wp:paragraph -->`)
      if (c.link)
        open(
          `      <!-- wp:buttons --><div class="wp-block-buttons"><!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link wp-element-button">${escapeHtml(
            c.link,
          )}</a></div><!-- /wp:button --></div><!-- /wp:buttons -->`,
        )
      open(`    </div>`)
      open(`    <!-- /wp:column -->`)
    }
    open(`  </div>`)
    open(`  <!-- /wp:columns -->`)
  }

  const tag = type === 'Navbar' ? 'header' : type === 'Footer' ? 'footer' : 'section'
  const align = type === 'Hero' || type === 'CTABand' ? 'full' : 'wide'
  const variation =
    type === 'CTABand' ? ' "className":"is-style-accent"' : ''
  open(`<!-- wp:group {"align":"${align}","tagName":"${tag}"${variation ? ',' + variation : ''}} -->`)
  open(`<${tag} class="wp-block-group align${align}">`)

  const level = headingLevel(section)
  if (e.eyebrow.on) paragraph(e.eyebrow.text, 'eyebrow')
  if (e.heading.on) heading(level, e.heading.text)
  if (e.subheading.on) paragraph(e.subheading.text, 'subheading')
  if (e.image.on && (type === 'Hero' || type === 'FeatureMedia')) image()
  if (e.body.on) paragraph(e.body.text)
  if (e.list.on) list(e.list.items)
  if (SECTION_META[type].hasCards) cardGrid(section.cards)
  if (e.buttons.length) buttons(e.buttons)

  open(`</${tag}>`)
  open(`<!-- /wp:group -->`)
  return lines.join('\n')
}

/** Full block markup for a page — sections joined with blank lines. */
export function pageMarkup(page: Page): string {
  return page.sections.map(sectionMarkup).join('\n\n')
}

/**
 * Builds a theme.json settings object string from the workspace design tokens,
 * mirroring the structure WordPress expects.
 */
export function themeJson(tokens: WorkspaceTokens): string {
  const scale = computeTypeScale(tokens.typography.base, tokens.typography.ratio)
  const palette = tokens.colors.map((c) => ({
    slug: c.name.toLowerCase().replace(/\s+/g, '-'),
    name: c.name,
    color: c.hex,
  }))
  const fontSizes = scale.map((s) => ({
    slug: s.name.toLowerCase(),
    name: s.name,
    size: `${s.px}px`,
  }))

  const obj = {
    $schema: 'https://schemas.wp.org/trunk/theme.json',
    version: 3,
    settings: {
      layout: {
        contentSize: `${tokens.ext.layout.contentSize}px`,
        wideSize: `${tokens.ext.layout.wideSize}px`,
      },
      color: { palette },
      typography: {
        fontFamilies: [
          {
            slug: 'sans',
            name: 'Sans',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
        ],
        fontSizes,
      },
      spacing: {
        spacingSizes: tokens.spacing.map((s) => ({
          slug: s.name.toLowerCase(),
          name: s.name,
          size: `${s.px}px`,
        })),
        blockGap: `${tokens.ext.blockGap}px`,
      },
    },
    styles: {
      color: {
        background: tokens.colors.find((c) => c.name === 'Surface')?.hex ?? '#ffffff',
        text: tokens.colors.find((c) => c.name === 'Text')?.hex ?? '#1d2327',
      },
      elements: {
        button: {
          border: { radius: `${tokens.ext.button.radius}px` },
          color: {
            background: tokens.ext.button.bg,
            text: tokens.ext.button.text,
          },
        },
        link: { color: { text: tokens.ext.link.color } },
      },
    },
  }
  return JSON.stringify(obj, null, 2)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
