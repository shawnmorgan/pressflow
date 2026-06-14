/**
 * Ollie-target emitter — produces a style variation + block-style JSONs
 * that layer onto the Ollie FSE base theme.
 *
 * Output structure (all written to scratch/ollie-emit/):
 *   styles/pressflow.json              — comprehensive style variation
 *   styles/blocks/button/<name>.json   — per-ButtonVariation block styles
 *   styles/blocks/group/<name>.json    — per-SectionStyle block styles
 */

import {
  type DesignSystem,
  type ColorRoleKey,
  type RoleRef,
  type Heading,
  type ButtonVariation,
  type SectionStyle,
  applyAutoDerive,
  fontStack,
  radiusPx,
  shadowValue,
} from './design-system'

/* ========================================================================= */
/* Step 2 — Role→slug mapping for Ollie's color conventions                  */
/* ========================================================================= */

const OLLIE_ROLE_SLUG: Record<ColorRoleKey, string> = {
  brand: 'primary',
  brandAccent: 'primary-accent',
  brandAlt: 'primary-alt',
  altAccent: 'primary-alt-accent',
  contrast: 'main',
  contrastAccent: 'main-accent',
  base: 'base',
  baseAccent: 'secondary',
  tint: 'tertiary',
  borderLight: 'border-light',
  borderDark: 'border-dark',
}

/** Map a RoleRef to the Ollie color slug. */
function ollieSlug(role: RoleRef): string | null {
  if (role === 'transparent') return null
  return OLLIE_ROLE_SLUG[role]
}

/** WP theme.json color variable reference format. */
function colorRef(role: RoleRef): string {
  if (role === 'transparent') return 'transparent'
  return `var:preset|color|${OLLIE_ROLE_SLUG[role]}`
}

/** Font size preset reference. */
function sizeRef(slug: string): string {
  return `var:preset|font-size|${slug}`
}

/** Font family preset reference. */
function familyRef(slug: string): string {
  return `var:preset|font-family|${slug}`
}

/* ========================================================================= */
/* Step 3 — Style variation emitter                                          */
/* ========================================================================= */

function pxToRem(px: number): string {
  return `${(px / 16).toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}rem`
}

/** Build heading element styles (h1–h6) from the DS headings array. */
function headingElements(ds: DesignSystem): Record<string, unknown> {
  const elements: Record<string, unknown> = {
    heading: {
      typography: {
        fontFamily: familyRef('heading'),
      },
    },
  }

  for (const h of ds.headings) {
    const tag = h.level.toLowerCase() // "H1" → "h1"
    const size = ds.typography.sizes.find((s) => s.key === h.sizeKey)
    const entry: Record<string, unknown> = {
      typography: {
        fontWeight: String(h.weight),
        lineHeight: String(h.lineHeight),
        ...(h.letterSpacing !== 0 && {
          letterSpacing: `${h.letterSpacing}em`,
        }),
        ...(size && { fontSize: sizeRef(size.slug) }),
      },
    }
    if (h.colorRole) {
      entry.color = { text: colorRef(h.colorRole) }
    }
    elements[tag] = entry
  }

  return elements
}

/** Build the comprehensive Ollie style variation JSON. */
export function ollieStyleVariation(ds: DesignSystem): string {
  const pal = applyAutoDerive(ds.palette)
  const c = pal.colors
  const fonts = ds.fontSet

  // --- settings.color.palette ---
  const palette = (Object.keys(OLLIE_ROLE_SLUG) as ColorRoleKey[]).map(
    (role) => ({
      slug: OLLIE_ROLE_SLUG[role],
      name: OLLIE_ROLE_SLUG[role]
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      color: c[role],
    }),
  )

  // --- settings.typography.fontSizes (native fluid) ---
  const fontSizes = ds.typography.sizes.map((s) => ({
    slug: s.slug,
    name: s.name,
    size: pxToRem(s.max),
    fluid: {
      min: pxToRem(s.min),
      max: pxToRem(s.max),
    },
  }))

  // --- settings.typography.fontFamilies ---
  const fontFamilies = [
    { slug: 'primary', name: 'Primary', fontFamily: fontStack(fonts.primary) },
    { slug: 'heading', name: 'Heading', fontFamily: fontStack(fonts.heading) },
    ...(fonts.condensed
      ? [
          {
            slug: 'condensed',
            name: 'Condensed',
            fontFamily: fontStack(fonts.condensed),
          },
        ]
      : []),
    ...(fonts.mono
      ? [
          {
            slug: 'mono',
            name: 'Monospace',
            fontFamily: fontStack(fonts.mono),
          },
        ]
      : []),
  ]

  // --- settings.spacing.spacingSizes ---
  const spacingSizes = ds.spacing.map((s) => ({
    slug: s.key,
    name: s.name,
    size: `clamp(${pxToRem(s.min)}, ${(s.min / 16).toFixed(2)}rem + ${s.preferredVw}vw, ${pxToRem(s.max)})`,
  }))

  // --- settings.color.gradients ---
  const gradients = ds.gradients.map((g) => ({
    slug: g.id,
    name: g.name,
    gradient: `linear-gradient(${g.angle}deg, ${g.from} 0%, ${g.to} 100%)`,
  }))

  // --- settings.color.duotone ---
  const duotone = ds.duotones.map((d) => ({
    slug: d.id,
    name: d.name,
    colors: [d.shadow, d.highlight],
  }))

  // --- settings.shadow ---
  const shadow = {
    presets: ds.shadows.map((s) => ({
      slug: s.key,
      name: s.name,
      shadow: shadowValue(s),
    })),
  }

  // --- Button element styles ---
  const buttonRadius = radiusPx(ds, ds.button.radiusKey)
  const buttonElement: Record<string, unknown> = {
    border: {
      radius: `${buttonRadius}px`,
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
  }

  // --- Link element styles ---
  const linkElement = {
    color: { text: ds.link.color },
    ':hover': { color: { text: ds.link.hoverColor } },
    typography: {
      textDecoration: ds.link.underline ? 'underline' : 'none',
    },
  }

  // --- Assemble ---
  const obj = {
    $schema: 'https://schemas.wp.org/trunk/theme.json',
    version: 3,
    title: 'PressFlow',
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
        fluid: true,
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
        background: colorRef('base'),
        text: colorRef('contrast'),
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
        fontFamily: familyRef('primary'),
        fontSize: sizeRef('medium'),
      },
      elements: {
        ...headingElements(ds),
        button: buttonElement,
        link: linkElement,
      },
    },
  }

  return JSON.stringify(obj, null, 2)
}

/* ========================================================================= */
/* Step 4 — Block-style emitters (button variations + section styles)        */
/* ========================================================================= */

function kebab(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Per-ButtonVariation block style for core/button. */
export function buttonBlockStyle(
  bv: ButtonVariation,
  ds: DesignSystem,
): { filename: string; json: string } {
  const radius = radiusPx(ds, bv.radiusKey)

  const obj: Record<string, unknown> = {
    $schema: 'https://schemas.wp.org/trunk/theme.json',
    version: 3,
    title: bv.name,
    slug: `is-style-${kebab(bv.name)}`,
    blockTypes: ['core/button'],
    styles: {
      border: {
        radius: `${radius}px`,
        width: `${bv.borderWidth}px`,
        style: bv.borderStyle,
        color: colorRef(bv.borderRole),
      },
      color: {
        background: colorRef(bv.bgRole),
        text: colorRef(bv.textRole),
      },
      typography: {
        fontWeight: String(bv.weight),
        fontSize: `${bv.fontSize}px`,
      },
      spacing: {
        padding: {
          top: `${bv.padY}px`,
          right: `${bv.padX}px`,
          bottom: `${bv.padY}px`,
          left: `${bv.padX}px`,
        },
      },
      ':hover': {
        color: {
          background: colorRef(bv.hoverBgRole),
          text: colorRef(bv.hoverTextRole),
        },
      },
    },
  }

  return {
    filename: `${kebab(bv.name)}.json`,
    json: JSON.stringify(obj, null, 2),
  }
}

/** Per-SectionStyle block style for core/group. */
export function sectionBlockStyle(
  ss: SectionStyle,
  ds: DesignSystem,
): { filename: string; json: string } {
  const linkedButton = ds.buttonVariations.find(
    (bv) => bv.id === ss.buttonVariationId,
  )

  const styles: Record<string, unknown> = {
    color: {
      background: colorRef(ss.bgRole),
      text: colorRef(ss.textRole),
    },
    elements: {
      heading: {
        color: { text: colorRef(ss.headingRole) },
      },
      link: {
        color: { text: colorRef(ss.linkRole) },
        ':hover': { color: { text: colorRef(ss.linkHoverRole) } },
      },
    },
  }

  // If a linked button variation exists, nest its styles in elements.button
  if (linkedButton) {
    const radius = radiusPx(ds, linkedButton.radiusKey)
    ;(styles.elements as Record<string, unknown>).button = {
      border: {
        radius: `${radius}px`,
        width: `${linkedButton.borderWidth}px`,
        style: linkedButton.borderStyle,
        color: colorRef(linkedButton.borderRole),
      },
      color: {
        background: colorRef(linkedButton.bgRole),
        text: colorRef(linkedButton.textRole),
      },
      ':hover': {
        color: {
          background: colorRef(linkedButton.hoverBgRole),
          text: colorRef(linkedButton.hoverTextRole),
        },
      },
    }
  }

  const obj = {
    $schema: 'https://schemas.wp.org/trunk/theme.json',
    version: 3,
    title: ss.name,
    slug: `is-style-${kebab(ss.name)}`,
    blockTypes: ['core/group'],
    styles,
  }

  return {
    filename: `${kebab(ss.name)}.json`,
    json: JSON.stringify(obj, null, 2),
  }
}
