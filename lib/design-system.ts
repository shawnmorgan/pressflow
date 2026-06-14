import {
  type TokenStatus,
  type WorkspaceTokens,
  type ColorSlot,
  type SpacingStep,
  type RadiusSlot,
  DEFAULT_EXTENDED,
  type BorderStyle,
} from '@/lib/tokens'

/* =========================================================================
 * PressFlow Design System — the rich, Ollie-grade source of truth for the
 * Design stage. Build/Export still consume the legacy WorkspaceTokens shape,
 * so `toWorkspaceTokens()` derives it from this model.
 * ========================================================================= */

export function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

export const BORDER_STYLES: BorderStyle[] = ['solid', 'dashed', 'dotted', 'none']

/* ---------- Color utilities ---------- */

function clampByte(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)))
}
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const v =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  const int = parseInt(v, 16)
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
}
function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((c) => clampByte(c).toString(16).padStart(2, '0'))
      .join('')
  )
}
function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return rgbToHex(
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t,
  )
}
export function lighten(hex: string, amount: number): string {
  return mix(hex, '#ffffff', amount)
}
export function darken(hex: string, amount: number): string {
  return mix(hex, '#000000', amount)
}
/** Translucent rgba from a hex + alpha (0–1). */
export function alpha(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

/* ---------- Colors: 11-slot role-based palette ---------- */

export type ColorRoleKey =
  | 'brand'
  | 'brandAccent'
  | 'brandAlt'
  | 'altAccent'
  | 'contrast'
  | 'contrastAccent'
  | 'base'
  | 'baseAccent'
  | 'tint'
  | 'borderLight'
  | 'borderDark'

export type RoleRef = ColorRoleKey | 'transparent'

export const COLOR_ROLES: {
  key: ColorRoleKey
  label: string
  group: string
  isBrand?: 'brand' | 'alt'
}[] = [
  { key: 'brand', label: 'Brand', group: 'Brand', isBrand: 'brand' },
  { key: 'brandAccent', label: 'Brand Accent', group: 'Brand' },
  { key: 'brandAlt', label: 'Brand Alt', group: 'Brand Alt', isBrand: 'alt' },
  { key: 'altAccent', label: 'Alt Accent', group: 'Brand Alt' },
  { key: 'contrast', label: 'Contrast', group: 'Contrast' },
  { key: 'contrastAccent', label: 'Contrast Accent', group: 'Contrast' },
  { key: 'base', label: 'Base', group: 'Base' },
  { key: 'baseAccent', label: 'Base Accent', group: 'Base' },
  { key: 'tint', label: 'Tint', group: 'Surface' },
  { key: 'borderLight', label: 'Border Light', group: 'Borders' },
  { key: 'borderDark', label: 'Border Dark', group: 'Borders' },
]

export type Palette = {
  id: string
  name: string
  colors: Record<ColorRoleKey, string>
  autoDeriveBrand: boolean
  autoDeriveAlt: boolean
}

function palette(
  id: string,
  name: string,
  brand: string,
  alt: string,
  contrast: string,
): Palette {
  return {
    id,
    name,
    colors: {
      brand,
      brandAccent: lighten(brand, 0.82),
      brandAlt: alt,
      altAccent: lighten(alt, 0.82),
      contrast,
      contrastAccent: lighten(contrast, 0.32),
      base: '#ffffff',
      baseAccent: '#646970',
      tint: '#f6f7f9',
      borderLight: '#e4e6ea',
      borderDark: '#c3c4c7',
    },
    autoDeriveBrand: true,
    autoDeriveAlt: true,
  }
}

export const DEFAULT_PALETTES: Palette[] = [
  palette('pal-royal', 'Royal', '#3858e9', '#2271b1', '#1d2327'),
  palette('pal-slate', 'Slate', '#3f5170', '#5a7184', '#171a1f'),
  palette('pal-evergreen', 'Evergreen', '#2f6b4f', '#3858e9', '#16231c'),
]

/** Re-derive accent/tint companions for brand colors that have auto-derive on. */
export function applyAutoDerive(p: Palette): Palette {
  const colors = { ...p.colors }
  if (p.autoDeriveBrand) colors.brandAccent = lighten(colors.brand, 0.82)
  if (p.autoDeriveAlt) colors.altAccent = lighten(colors.brandAlt, 0.82)
  return { ...p, colors }
}

/* ---------- Gradients & Duotones (color extras) ---------- */

export type Gradient = {
  id: string
  name: string
  from: string
  to: string
  angle: number
}
export const DEFAULT_GRADIENTS: Gradient[] = [
  { id: 'grad-brand', name: 'Brand', from: '#3858e9', to: '#2271b1', angle: 135 },
  { id: 'grad-dusk', name: 'Dusk', from: '#3858e9', to: '#1d2327', angle: 160 },
]

export type Duotone = {
  id: string
  name: string
  shadow: string
  highlight: string
}
export const DEFAULT_DUOTONES: Duotone[] = [
  { id: 'duo-brand', name: 'Brand', shadow: '#1d2327', highlight: '#3858e9' },
  { id: 'duo-mono', name: 'Mono', shadow: '#1d2327', highlight: '#f6f7f9' },
]

/* ---------- Typography ---------- */

export const SCALE_RATIOS = [
  { label: 'Minor Third', value: 1.2 },
  { label: 'Major Third', value: 1.25 },
  { label: 'Perfect Fourth', value: 1.333 },
] as const

export const FONT_FAMILIES = [
  'Inter',
  'Geist',
  'system-ui',
  'Georgia',
  'Times New Roman',
  'Playfair Display',
  'Arial',
  'Helvetica Neue',
  'Roboto Condensed',
  'Archivo',
  'Courier New',
  'JetBrains Mono',
] as const

export type FluidSize = {
  key: string
  name: string
  slug: string
  min: number
  max: number
}

const FLUID_SIZE_DEFS: { key: string; name: string; slug: string; step: number }[] =
  [
    { key: 'xs', name: 'X-Small', slug: 'x-small', step: -2 },
    { key: 's', name: 'Small', slug: 'small', step: -1 },
    { key: 'm', name: 'Medium', slug: 'medium', step: 0 },
    { key: 'l', name: 'Large', slug: 'large', step: 1 },
    { key: 'xl', name: 'X-Large', slug: 'x-large', step: 2 },
    { key: 'xxl', name: 'XX-Large', slug: 'xx-large', step: 3 },
    { key: 'xxxl', name: 'XXX-Large', slug: 'xxx-large', step: 4 },
  ]

export function buildFluidSizes(base: number, ratio: number): FluidSize[] {
  return FLUID_SIZE_DEFS.map((d) => {
    const max = Math.round(base * Math.pow(ratio, d.step) * 100) / 100
    const min =
      d.step <= 0 ? max : Math.round(max * (1 - Math.min(0.3, d.step * 0.07)) * 100) / 100
    return { key: d.key, name: d.name, slug: d.slug, min, max }
  })
}

export type FontRoleSet = {
  id: string
  name: string
  primary: string
  heading: string
  condensed: string
  expanded: string
  mono: string
}

export const DEFAULT_FONT_SETS: FontRoleSet[] = [
  {
    id: 'font-modern',
    name: 'Modern',
    primary: 'Inter',
    heading: 'Inter',
    condensed: 'Roboto Condensed',
    expanded: '',
    mono: 'JetBrains Mono',
  },
  {
    id: 'font-editorial',
    name: 'Editorial',
    primary: 'Georgia',
    heading: 'Playfair Display',
    condensed: 'Archivo',
    expanded: '',
    mono: 'Courier New',
  },
  {
    id: 'font-grotesk',
    name: 'Grotesk',
    primary: 'Geist',
    heading: 'Archivo',
    condensed: 'Roboto Condensed',
    expanded: '',
    mono: 'JetBrains Mono',
  },
]

export type Typography = {
  base: number
  ratio: number
  sizes: FluidSize[]
}

/* ---------- Headings ---------- */

export type Heading = {
  level: string
  sizeKey: string
  weight: number
  lineHeight: number
  letterSpacing: number
  colorRole?: ColorRoleKey
}

export const FONT_WEIGHTS = [300, 400, 500, 600, 700, 800] as const

export const DEFAULT_HEADINGS: Heading[] = [
  { level: 'H1', sizeKey: 'xxxl', weight: 700, lineHeight: 1.1, letterSpacing: -0.02 },
  { level: 'H2', sizeKey: 'xxl', weight: 700, lineHeight: 1.15, letterSpacing: -0.01 },
  { level: 'H3', sizeKey: 'xl', weight: 600, lineHeight: 1.2, letterSpacing: 0 },
  { level: 'H4', sizeKey: 'l', weight: 600, lineHeight: 1.3, letterSpacing: 0 },
  { level: 'H5', sizeKey: 'm', weight: 600, lineHeight: 1.4, letterSpacing: 0 },
  { level: 'H6', sizeKey: 's', weight: 600, lineHeight: 1.45, letterSpacing: 0.04 },
]

/* ---------- Spacing (fluid) ---------- */

export type SpacingFluid = {
  key: string
  name: string
  min: number
  preferredVw: number
  max: number
  status: TokenStatus
}

export const DEFAULT_SPACING: SpacingFluid[] = [
  { key: 'sm', name: 'Small', min: 12, preferredVw: 1, max: 16, status: 'default' },
  { key: 'md', name: 'Medium', min: 18, preferredVw: 1.5, max: 24, status: 'default' },
  { key: 'lg', name: 'Large', min: 24, preferredVw: 2, max: 32, status: 'import' },
  { key: 'xl', name: 'X-Large', min: 32, preferredVw: 3, max: 48, status: 'import' },
  { key: '2xl', name: '2X-Large', min: 44, preferredVw: 4, max: 64, status: 'default' },
  { key: '3xl', name: '3X-Large', min: 60, preferredVw: 6, max: 96, status: 'offgrid' },
  { key: '4xl', name: '4X-Large', min: 80, preferredVw: 8, max: 128, status: 'default' },
]

export type RootPadding = { top: number; right: number; bottom: number; left: number }

/* ---------- Layout ---------- */

export type LayoutWidths = { contentSize: number; wideSize: number }

/* ---------- Border radius scale ---------- */

export type RadiusStep = { key: string; name: string; px: number }

export const DEFAULT_RADII: RadiusStep[] = [
  { key: 'xs', name: 'XS', px: 2 },
  { key: 'sm', name: 'SM', px: 4 },
  { key: 'md', name: 'MD', px: 6 },
  { key: 'lg', name: 'LG', px: 10 },
  { key: 'xl', name: 'XL', px: 16 },
  { key: '2xl', name: '2XL', px: 24 },
  { key: 'full', name: 'Full', px: 9999 },
]

/* ---------- Shadows ---------- */

export type ShadowTone = 'light' | 'dark'
export type ShadowDef = {
  key: string
  name: string
  y: number
  blur: number
  spread: number
  opacity: number
  tone: ShadowTone
}

export const DEFAULT_SHADOWS: ShadowDef[] = [
  { key: 'sm', name: 'Small', y: 1, blur: 2, spread: 0, opacity: 0.08, tone: 'light' },
  { key: 'md', name: 'Medium', y: 4, blur: 12, spread: -2, opacity: 0.12, tone: 'light' },
  { key: 'lg', name: 'Large', y: 12, blur: 32, spread: -4, opacity: 0.18, tone: 'light' },
  { key: 'xl', name: 'Extra Large', y: 24, blur: 56, spread: -8, opacity: 0.24, tone: 'dark' },
]

export function shadowValue(s: ShadowDef): string {
  const base = s.tone === 'dark' ? '15, 23, 42' : '17, 24, 39'
  const op = s.tone === 'dark' ? s.opacity + 0.12 : s.opacity
  return `0 ${s.y}px ${s.blur}px ${s.spread}px rgba(${base}, ${op})`
}

/* ---------- Buttons & Links (foundation) ---------- */

export type ButtonDefault = {
  bg: string
  text: string
  radiusKey: string
  borderWidth: number
  borderStyle: BorderStyle
  padX: number
  padY: number
  weight: number
  fontSize: number
  hoverBg: string
  hoverText: string
  focusBg: string
  focusText: string
}

export const DEFAULT_BUTTON: ButtonDefault = {
  bg: '#3858e9',
  text: '#ffffff',
  radiusKey: 'xs',
  borderWidth: 1,
  borderStyle: 'solid',
  padX: 20,
  padY: 11,
  weight: 600,
  fontSize: 15,
  hoverBg: '#1d35b4',
  hoverText: '#ffffff',
  focusBg: '#1d35b4',
  focusText: '#ffffff',
}

export type LinkStyle = { color: string; hoverColor: string; underline: boolean }
export const DEFAULT_LINK: LinkStyle = {
  color: '#3858e9',
  hoverColor: '#1d35b4',
  underline: true,
}

/* ---------- Variations: token-referenced buttons ---------- */

export type ButtonVariation = {
  id: string
  name: string
  bgRole: RoleRef
  textRole: RoleRef
  borderRole: RoleRef
  borderWidth: number
  borderStyle: BorderStyle
  radiusKey: string
  padX: number
  padY: number
  weight: number
  fontSize: number
  hoverBgRole: RoleRef
  hoverTextRole: RoleRef
}

export const DEFAULT_BUTTON_VARIATIONS: ButtonVariation[] = [
  {
    id: 'bv-primary',
    name: 'Primary',
    bgRole: 'brand',
    textRole: 'base',
    borderRole: 'brand',
    borderWidth: 1,
    borderStyle: 'solid',
    radiusKey: 'xs',
    padX: 20,
    padY: 11,
    weight: 600,
    fontSize: 15,
    hoverBgRole: 'brandAlt',
    hoverTextRole: 'base',
  },
  {
    id: 'bv-secondary',
    name: 'Secondary',
    bgRole: 'tint',
    textRole: 'contrast',
    borderRole: 'borderDark',
    borderWidth: 1,
    borderStyle: 'solid',
    radiusKey: 'xs',
    padX: 20,
    padY: 11,
    weight: 600,
    fontSize: 15,
    hoverBgRole: 'baseAccent',
    hoverTextRole: 'base',
  },
  {
    id: 'bv-outline',
    name: 'Outline',
    bgRole: 'transparent',
    textRole: 'brand',
    borderRole: 'brand',
    borderWidth: 1,
    borderStyle: 'solid',
    radiusKey: 'xs',
    padX: 20,
    padY: 11,
    weight: 600,
    fontSize: 15,
    hoverBgRole: 'brand',
    hoverTextRole: 'base',
  },
  {
    id: 'bv-dark',
    name: 'Dark',
    bgRole: 'contrast',
    textRole: 'base',
    borderRole: 'contrast',
    borderWidth: 1,
    borderStyle: 'solid',
    radiusKey: 'xs',
    padX: 20,
    padY: 11,
    weight: 600,
    fontSize: 15,
    hoverBgRole: 'contrastAccent',
    hoverTextRole: 'base',
  },
  {
    id: 'bv-light',
    name: 'Light',
    bgRole: 'base',
    textRole: 'contrast',
    borderRole: 'borderLight',
    borderWidth: 1,
    borderStyle: 'solid',
    radiusKey: 'xs',
    padX: 20,
    padY: 11,
    weight: 600,
    fontSize: 15,
    hoverBgRole: 'tint',
    hoverTextRole: 'contrast',
  },
]

/* ---------- Variations: section styles ---------- */

export type SectionStyle = {
  id: string
  name: string
  bgRole: RoleRef
  textRole: RoleRef
  headingRole: RoleRef
  linkRole: RoleRef
  linkHoverRole: RoleRef
  buttonVariationId: string
}

export const DEFAULT_SECTION_STYLES: SectionStyle[] = [
  {
    id: 'ss-default',
    name: 'Default',
    bgRole: 'base',
    textRole: 'contrast',
    headingRole: 'contrast',
    linkRole: 'brand',
    linkHoverRole: 'brandAlt',
    buttonVariationId: 'bv-primary',
  },
  {
    id: 'ss-dark',
    name: 'Dark',
    bgRole: 'contrast',
    textRole: 'base',
    headingRole: 'base',
    linkRole: 'brandAccent',
    linkHoverRole: 'base',
    buttonVariationId: 'bv-outline',
  },
  {
    id: 'ss-accent',
    name: 'Accent',
    bgRole: 'brand',
    textRole: 'base',
    headingRole: 'base',
    linkRole: 'base',
    linkHoverRole: 'brandAccent',
    buttonVariationId: 'bv-light',
  },
  {
    id: 'ss-muted',
    name: 'Muted',
    bgRole: 'tint',
    textRole: 'contrast',
    headingRole: 'contrast',
    linkRole: 'brand',
    linkHoverRole: 'brandAlt',
    buttonVariationId: 'bv-secondary',
  },
]

/* ---------- The full design system ---------- */

export type DesignSystem = {
  palettes: Palette[]
  activePaletteId: string
  colorStatus: Record<ColorRoleKey, TokenStatus>
  gradients: Gradient[]
  duotones: Duotone[]

  typography: Typography
  fontSets: FontRoleSet[]
  activeFontSetId: string

  headings: Heading[]

  spacing: SpacingFluid[]
  blockGap: number
  rootPadding: RootPadding

  layout: LayoutWidths

  radii: RadiusStep[]
  shadows: ShadowDef[]

  button: ButtonDefault
  link: LinkStyle

  buttonVariations: ButtonVariation[]
  sectionStyles: SectionStyle[]
}

const DEFAULT_COLOR_STATUS: Record<ColorRoleKey, TokenStatus> = {
  brand: 'import',
  brandAccent: 'default',
  brandAlt: 'import',
  altAccent: 'default',
  contrast: 'import',
  contrastAccent: 'default',
  base: 'default',
  baseAccent: 'default',
  tint: 'default',
  borderLight: 'default',
  borderDark: 'default',
}

export const DEFAULT_DESIGN_SYSTEM: DesignSystem = {
  palettes: DEFAULT_PALETTES,
  activePaletteId: 'pal-royal',
  colorStatus: DEFAULT_COLOR_STATUS,
  gradients: DEFAULT_GRADIENTS,
  duotones: DEFAULT_DUOTONES,

  typography: { base: 18, ratio: 1.25, sizes: buildFluidSizes(18, 1.25) },
  fontSets: DEFAULT_FONT_SETS,
  activeFontSetId: 'font-modern',

  headings: DEFAULT_HEADINGS,

  spacing: DEFAULT_SPACING,
  blockGap: 28,
  rootPadding: { top: 0, right: 24, bottom: 0, left: 24 },

  layout: { contentSize: 740, wideSize: 1260 },

  radii: DEFAULT_RADII,
  shadows: DEFAULT_SHADOWS,

  button: DEFAULT_BUTTON,
  link: DEFAULT_LINK,

  buttonVariations: DEFAULT_BUTTON_VARIATIONS,
  sectionStyles: DEFAULT_SECTION_STYLES,
}

/* ---------- Resolvers ---------- */

export function activePalette(ds: DesignSystem): Palette {
  return ds.palettes.find((p) => p.id === ds.activePaletteId) ?? ds.palettes[0]
}
export function activeFontSet(ds: DesignSystem): FontRoleSet {
  return ds.fontSets.find((f) => f.id === ds.activeFontSetId) ?? ds.fontSets[0]
}
export function resolveRole(p: Palette, role: RoleRef): string {
  if (role === 'transparent') return 'transparent'
  return p.colors[role]
}
export function radiusPx(ds: DesignSystem, key: string): number {
  return ds.radii.find((r) => r.key === key)?.px ?? 2
}
export function sizePx(ds: DesignSystem, key: string): number {
  return ds.typography.sizes.find((s) => s.key === key)?.max ?? ds.typography.base
}
export function sizeMin(ds: DesignSystem, key: string): number {
  return ds.typography.sizes.find((s) => s.key === key)?.min ?? ds.typography.base
}
export function fontStack(family: string): string {
  if (!family) return 'inherit'
  if (family === 'Inter') return "'Inter', system-ui, sans-serif"
  if (family === 'Geist') return "'Geist', system-ui, sans-serif"
  if (family === 'JetBrains Mono' || family === 'Courier New')
    return `'${family}', monospace`
  return `'${family}', sans-serif`
}
/** CSS clamp() for a fluid value, min/max in px, preferred in vw. */
export function clampCss(min: number, preferredVw: number, max: number): string {
  const preferred = `${(min / 16).toFixed(2)}rem + ${preferredVw}vw`
  return `clamp(${(min / 16).toFixed(3)}rem, ${preferred}, ${(max / 16).toFixed(3)}rem)`
}

/* ---------- Legacy adapter (keeps Build/Export working) ---------- */

export function toWorkspaceTokens(ds: DesignSystem): WorkspaceTokens {
  const p = applyAutoDerive(activePalette(ds))
  const colors: ColorSlot[] = [
    { name: 'Primary', hex: p.colors.brand, status: ds.colorStatus.brand },
    { name: 'Surface', hex: p.colors.base, status: ds.colorStatus.base },
    { name: 'Background', hex: p.colors.tint, status: ds.colorStatus.tint },
    { name: 'Text', hex: p.colors.contrast, status: ds.colorStatus.contrast },
    { name: 'Accent', hex: p.colors.brandAccent, status: ds.colorStatus.brandAccent },
  ]
  const spacing: SpacingStep[] = ds.spacing.map((s) => ({
    name: s.name,
    px: s.max,
    status: s.status,
  }))
  const radii: RadiusSlot[] = [
    { name: 'Small', px: radiusPx(ds, 'sm'), status: 'default' },
    { name: 'Medium', px: radiusPx(ds, 'md'), status: 'default' },
    { name: 'Large', px: radiusPx(ds, 'lg'), status: 'default' },
  ]
  return {
    typography: { base: ds.typography.base, ratio: ds.typography.ratio },
    spacing,
    colors,
    radii,
    ext: {
      ...DEFAULT_EXTENDED,
      blockGap: ds.blockGap,
      rootPadding: ds.rootPadding,
      layout: ds.layout,
      button: {
        ...DEFAULT_EXTENDED.button,
        bg: ds.button.bg,
        text: ds.button.text,
        radius: radiusPx(ds, ds.button.radiusKey),
        borderWidth: ds.button.borderWidth,
        borderStyle: ds.button.borderStyle,
        padX: ds.button.padX,
        padY: ds.button.padY,
        weight: ds.button.weight,
        fontSize: ds.button.fontSize,
        hoverBg: ds.button.hoverBg,
        hoverText: ds.button.hoverText,
        focusBg: ds.button.focusBg,
        focusText: ds.button.focusText,
      },
      link: { ...ds.link },
    },
  }
}
