import {
  type Page,
  type Section,
  type Card,
  headingLevel,
  SECTION_META,
} from '@/lib/sitemap'
import {
  type DesignSystem,
  applyAutoDerive,
  fontStack,
  radiusPx,
  shadowValue,
  clampCss,
} from '@/lib/design-system'

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
  const align = type === 'Hero' || type === 'CTA' ? 'full' : 'wide'
  const variation =
    type === 'CTA' ? ' "className":"is-style-accent"' : ''
  open(`<!-- wp:group {"align":"${align}","tagName":"${tag}"${variation ? ',' + variation : ''}} -->`)
  open(`<${tag} class="wp-block-group align${align}">`)

  const level = headingLevel(section)
  if (e.eyebrow.on) paragraph(e.eyebrow.text, 'eyebrow')
  if (e.heading.on) heading(level, e.heading.text)
  if (e.subheading.on) paragraph(e.subheading.text, 'subheading')
  if (e.image.on && (type === 'Hero' || type === 'TextMedia')) image()
  if (e.body.on) paragraph(e.body.text)
  if (e.list.on) list(e.list.items)
  if (SECTION_META[type]?.hasCards) cardGrid(section.cards)
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
 * Builds a theme.json settings object from the rich DesignSystem,
 * mirroring the structure WordPress expects.
 */
export function themeJson(ds: DesignSystem): string {
  const pal = applyAutoDerive(ds.palette)
  const c = pal.colors
  const fonts = ds.fontSet

  // Curated semantic palette — never a 50-900 ramp.
  const palette = [
    { slug: 'brand', name: 'Brand', color: c.brand },
    { slug: 'brand-accent', name: 'Brand Accent', color: c.brandAccent },
    { slug: 'brand-alt', name: 'Brand Alt', color: c.brandAlt },
    { slug: 'alt-accent', name: 'Alt Accent', color: c.altAccent },
    { slug: 'contrast', name: 'Contrast', color: c.contrast },
    { slug: 'contrast-accent', name: 'Contrast Accent', color: c.contrastAccent },
    { slug: 'base', name: 'Base', color: c.base },
    { slug: 'base-accent', name: 'Base Accent', color: c.baseAccent },
    { slug: 'tint', name: 'Tint', color: c.tint },
    { slug: 'border-light', name: 'Border Light', color: c.borderLight },
    { slug: 'border-dark', name: 'Border Dark', color: c.borderDark },
  ]

  // Fluid font sizes via clamp().
  const fontSizes = ds.typography.sizes.map((s) => ({
    slug: s.slug,
    name: s.name,
    size: clampCss(s.min, (s.min / 16) + ((s.max - s.min) / 14), s.max),
  }))

  // Font families from the font set roles.
  const fontFamilies = [
    { slug: 'primary', name: 'Primary', fontFamily: fontStack(fonts.primary) },
    { slug: 'heading', name: 'Heading', fontFamily: fontStack(fonts.heading) },
    ...(fonts.mono
      ? [{ slug: 'mono', name: 'Monospace', fontFamily: fontStack(fonts.mono) }]
      : []),
  ]

  // Fluid spacing via clamp().
  const spacingSizes = ds.spacing.map((s) => ({
    slug: s.key,
    name: s.name,
    size: clampCss(s.min, s.preferredVw, s.max),
  }))

  // Gradients.
  const gradients = ds.gradients.map((g) => ({
    slug: g.id,
    name: g.name,
    gradient: `linear-gradient(${g.angle}deg, ${g.from} 0%, ${g.to} 100%)`,
  }))

  // Duotones.
  const duotone = ds.duotones.map((d) => ({
    slug: d.id,
    name: d.name,
    colors: [d.shadow, d.highlight],
  }))

  // Shadows.
  const shadow = {
    presets: ds.shadows.map((s) => ({
      slug: s.key,
      name: s.name,
      shadow: shadowValue(s),
    })),
  }

  const obj = {
    $schema: 'https://schemas.wp.org/trunk/theme.json',
    version: 3,
    settings: {
      layout: {
        contentSize: `${ds.layout.contentSize}px`,
        wideSize: `${ds.layout.wideSize}px`,
      },
      color: {
        palette,
        gradients,
        duotone,
      },
      typography: {
        fontFamilies,
        fontSizes,
      },
      spacing: {
        spacingSizes,
        blockGap: true,
      },
      shadow,
    },
    styles: {
      color: {
        background: c.base,
        text: c.contrast,
      },
      spacing: {
        blockGap: `${ds.blockGap}px`,
        padding: {
          top: `${ds.rootPadding.top}px`,
          right: `${ds.rootPadding.right}px`,
          bottom: `${ds.rootPadding.bottom}px`,
          left: `${ds.rootPadding.left}px`,
        },
      },
      typography: {
        fontFamily: `var(--wp--preset--font-family--primary)`,
        fontSize: `var(--wp--preset--font-size--medium)`,
      },
      elements: {
        button: {
          border: {
            radius: `${radiusPx(ds, ds.button.radiusKey)}px`,
            width: `${ds.button.borderWidth}px`,
            style: ds.button.borderStyle,
            color: ds.button.bg,
          },
          color: {
            background: ds.button.bg,
            text: ds.button.text,
          },
          typography: {
            fontWeight: String(ds.button.weight),
            fontSize: `${ds.button.fontSize}px`,
          },
          spacing: {
            padding: {
              top: `${ds.button.padY}px`,
              right: `${ds.button.padX}px`,
              bottom: `${ds.button.padY}px`,
              left: `${ds.button.padX}px`,
            },
          },
          ':hover': {
            color: {
              background: ds.button.hoverBg,
              text: ds.button.hoverText,
            },
          },
          ':focus': {
            color: {
              background: ds.button.focusBg,
              text: ds.button.focusText,
            },
          },
        },
        link: {
          color: { text: ds.link.color },
          ':hover': { color: { text: ds.link.hoverColor } },
          typography: {
            textDecoration: ds.link.underline ? 'underline' : 'none',
          },
        },
        heading: {
          typography: {
            fontFamily: `var(--wp--preset--font-family--heading)`,
          },
        },
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
