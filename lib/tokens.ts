export type TokenStatus = 'import' | 'default' | 'offgrid'

export const SCALE_RATIOS = [
  { label: 'Minor Third', value: 1.2 },
  { label: 'Major Third', value: 1.25 },
  { label: 'Perfect Fourth', value: 1.333 },
] as const

export const TYPE_STEPS = [
  { name: 'XXS', step: -3 },
  { name: 'XS', step: -2 },
  { name: 'S', step: -1 },
  { name: 'M', step: 0 },
  { name: 'L', step: 1 },
  { name: 'XL', step: 2 },
  { name: 'XXL', step: 3 },
  { name: 'XXXL', step: 4 },
] as const

export function computeTypeScale(base: number, ratio: number) {
  return TYPE_STEPS.map(({ name, step }) => ({
    name,
    px: Math.round(base * Math.pow(ratio, step) * 100) / 100,
  }))
}

export type SpacingStep = {
  name: string
  px: number
  status: TokenStatus
}

export const DEFAULT_SPACING: SpacingStep[] = [
  { name: '4xs', px: 2, status: 'default' },
  { name: '3xs', px: 4, status: 'default' },
  { name: '2xs', px: 6, status: 'offgrid' },
  { name: 'xs', px: 8, status: 'default' },
  { name: 'sm', px: 12, status: 'default' },
  { name: 'md', px: 16, status: 'import' },
  { name: 'lg', px: 24, status: 'import' },
  { name: 'xl', px: 32, status: 'default' },
  { name: '2xl', px: 48, status: 'default' },
  { name: '3xl', px: 64, status: 'default' },
  { name: '4xl', px: 96, status: 'default' },
  { name: '5xl', px: 128, status: 'default' },
]

export type ColorSlot = {
  name: string
  hex: string
  status: TokenStatus
}

export const DEFAULT_COLORS: ColorSlot[] = [
  { name: 'Primary', hex: '#3858e9', status: 'import' },
  { name: 'Surface', hex: '#ffffff', status: 'default' },
  { name: 'Background', hex: '#f9fafb', status: 'default' },
  { name: 'Text', hex: '#1d2327', status: 'import' },
  { name: 'Accent', hex: '#2271b1', status: 'default' },
]

export type RadiusSlot = {
  name: string
  px: number
  status: TokenStatus
}

export const DEFAULT_RADII: RadiusSlot[] = [
  { name: 'Small', px: 2, status: 'default' },
  { name: 'Medium', px: 2, status: 'default' },
  { name: 'Large', px: 2, status: 'default' },
]

export const STATUS_META: Record<
  TokenStatus,
  { label: string; dot: string; text: string }
> = {
  import: { label: 'From import', dot: '#3858e9', text: '#3858e9' },
  default: { label: 'Default', dot: '#a7aaad', text: '#646970' },
  offgrid: { label: 'Off-grid — confirm', dot: '#dba617', text: '#b26200' },
}

/* ---------- Extended tokens ---------- */

export const FONT_WEIGHTS = [400, 500, 600, 700, 800] as const
export const TYPE_SLOT_NAMES = TYPE_STEPS.map((s) => s.name)

export type HeadingDef = {
  level: string
  slot: string
  weight: number
  lineHeight: number
}

export const DEFAULT_HEADINGS: HeadingDef[] = [
  { level: 'H1', slot: 'XXXL', weight: 700, lineHeight: 1.1 },
  { level: 'H2', slot: 'XXL', weight: 700, lineHeight: 1.15 },
  { level: 'H3', slot: 'XL', weight: 600, lineHeight: 1.2 },
  { level: 'H4', slot: 'L', weight: 600, lineHeight: 1.3 },
  { level: 'H5', slot: 'M', weight: 600, lineHeight: 1.4 },
  { level: 'H6', slot: 'S', weight: 600, lineHeight: 1.45 },
]

export type BorderStyle = 'solid' | 'dashed' | 'dotted' | 'none'

export type ButtonStyle = {
  bg: string
  text: string
  radius: number
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

export const DEFAULT_BUTTON: ButtonStyle = {
  bg: '#3858e9',
  text: '#ffffff',
  radius: 2,
  borderWidth: 1,
  borderStyle: 'solid',
  padX: 16,
  padY: 10,
  weight: 600,
  fontSize: 14,
  hoverBg: '#1d35b4',
  hoverText: '#ffffff',
  focusBg: '#1d35b4',
  focusText: '#ffffff',
}

export type LinkStyle = {
  color: string
  hoverColor: string
  underline: boolean
}

export const DEFAULT_LINK: LinkStyle = {
  color: '#3858e9',
  hoverColor: '#1d35b4',
  underline: true,
}

export type RootPadding = {
  top: number
  right: number
  bottom: number
  left: number
}

export type LayoutWidths = { contentSize: number; wideSize: number }

export const DEFAULT_LAYOUT: LayoutWidths = { contentSize: 620, wideSize: 1000 }

export type ShadowPreset = { name: string; value: string }

export const DEFAULT_SHADOWS: ShadowPreset[] = [
  { name: 'Small', value: '0 1px 2px rgba(0,0,0,0.08)' },
  { name: 'Medium', value: '0 4px 12px rgba(0,0,0,0.12)' },
  { name: 'Large', value: '0 12px 32px rgba(0,0,0,0.18)' },
]

export const ASPECT_RATIOS = ['16:9', '4:3', '1:1', '3:2'] as const

export type ImageSettings = {
  radius: number
  aspect: string
  duotone: boolean
  shadow: string
  highlight: string
}

export const DEFAULT_IMAGE: ImageSettings = {
  radius: 2,
  aspect: '16:9',
  duotone: false,
  shadow: '#1d2327',
  highlight: '#3858e9',
}

export type GradientPreset = {
  name: string
  from: string
  to: string
  angle: number
}

export const DEFAULT_GRADIENTS: GradientPreset[] = [
  { name: 'Brand', from: '#3858e9', to: '#2271b1', angle: 135 },
  { name: 'Warm', from: '#dba617', to: '#b26200', angle: 135 },
  { name: 'Slate', from: '#1d2327', to: '#646970', angle: 135 },
]

/* ---------- Block style variations ---------- */

export const SHADOW_OPTIONS = ['None', 'Small', 'Medium', 'Large'] as const

// A core/button block style variation.
export type ButtonVariation = {
  id: string
  name: string
  bg: string
  text: string
  borderColor: string
  borderWidth: number
  borderStyle: BorderStyle
  radius: number
  padX: number
  padY: number
  weight: number
  fontSize: number
  hoverBg: string
  hoverText: string
  focusBg: string
  focusText: string
}

export const DEFAULT_BUTTON_VARIATIONS: ButtonVariation[] = [
  {
    id: 'btn-primary',
    name: 'Primary',
    bg: '#3858e9',
    text: '#ffffff',
    borderColor: '#3858e9',
    borderWidth: 1,
    borderStyle: 'solid',
    radius: 2,
    padX: 16,
    padY: 10,
    weight: 600,
    fontSize: 14,
    hoverBg: '#1d35b4',
    hoverText: '#ffffff',
    focusBg: '#1d35b4',
    focusText: '#ffffff',
  },
  {
    id: 'btn-secondary',
    name: 'Secondary',
    bg: '#f0f0f1',
    text: '#1d2327',
    borderColor: '#c3c4c7',
    borderWidth: 1,
    borderStyle: 'solid',
    radius: 2,
    padX: 16,
    padY: 10,
    weight: 600,
    fontSize: 14,
    hoverBg: '#e0e0e0',
    hoverText: '#1d2327',
    focusBg: '#e0e0e0',
    focusText: '#1d2327',
  },
  {
    id: 'btn-outline',
    name: 'Outline',
    bg: 'transparent',
    text: '#3858e9',
    borderColor: '#3858e9',
    borderWidth: 1,
    borderStyle: 'solid',
    radius: 2,
    padX: 16,
    padY: 10,
    weight: 600,
    fontSize: 14,
    hoverBg: '#3858e9',
    hoverText: '#ffffff',
    focusBg: '#3858e9',
    focusText: '#ffffff',
  },
]

// A core/image block style variation.
export type ImageVariation = {
  id: string
  name: string
  radius: number
  borderWidth: number
  borderColor: string
  aspect: string
  duotone: boolean
  shadow: string
  highlight: string
}

export const DEFAULT_IMAGE_VARIATIONS: ImageVariation[] = [
  { id: 'img-default', name: 'Default', radius: 2, borderWidth: 0, borderColor: '#e0e0e0', aspect: '16:9', duotone: false, shadow: '#1d2327', highlight: '#3858e9' },
  { id: 'img-rounded', name: 'Rounded', radius: 16, borderWidth: 0, borderColor: '#e0e0e0', aspect: '1:1', duotone: false, shadow: '#1d2327', highlight: '#3858e9' },
  { id: 'img-framed', name: 'Framed', radius: 2, borderWidth: 6, borderColor: '#1d2327', aspect: '4:3', duotone: false, shadow: '#1d2327', highlight: '#3858e9' },
  { id: 'img-duotone', name: 'Duotone', radius: 2, borderWidth: 0, borderColor: '#e0e0e0', aspect: '16:9', duotone: true, shadow: '#1d2327', highlight: '#3858e9' },
]

// A Group block style variation — a reusable section type.
export type SectionVariation = {
  id: string
  name: string
  slug: string
  bg: string
  text: string
  headingColor: string
  linkColor: string
  linkHoverColor: string
  buttonVariationId: string
  borderWidth: number
  borderColor: string
  borderStyle: BorderStyle
  shadow: string // one of SHADOW_OPTIONS
  padding: number
}

export const DEFAULT_SECTION_VARIATIONS: SectionVariation[] = [
  {
    id: 'sec-default',
    name: 'Default',
    slug: 'default',
    bg: '#ffffff',
    text: '#1d2327',
    headingColor: '#1d2327',
    linkColor: '#3858e9',
    linkHoverColor: '#1d35b4',
    buttonVariationId: 'btn-primary',
    borderWidth: 0,
    borderColor: '#e0e0e0',
    borderStyle: 'solid',
    shadow: 'None',
    padding: 48,
  },
  {
    id: 'sec-dark',
    name: 'Dark',
    slug: 'dark',
    bg: '#1d2327',
    text: '#dcdcde',
    headingColor: '#ffffff',
    linkColor: '#aab8f9',
    linkHoverColor: '#ffffff',
    buttonVariationId: 'btn-outline',
    borderWidth: 0,
    borderColor: '#3c434a',
    borderStyle: 'solid',
    shadow: 'None',
    padding: 64,
  },
  {
    id: 'sec-accent',
    name: 'Accent',
    slug: 'accent',
    bg: '#3858e9',
    text: '#e6ebfd',
    headingColor: '#ffffff',
    linkColor: '#ffffff',
    linkHoverColor: '#e0e0e0',
    buttonVariationId: 'btn-secondary',
    borderWidth: 0,
    borderColor: '#1d35b4',
    borderStyle: 'solid',
    shadow: 'Medium',
    padding: 64,
  },
  {
    id: 'sec-muted',
    name: 'Muted',
    slug: 'muted',
    bg: '#f0f0f1',
    text: '#3c434a',
    headingColor: '#1d2327',
    linkColor: '#3858e9',
    linkHoverColor: '#1d35b4',
    buttonVariationId: 'btn-primary',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'solid',
    shadow: 'None',
    padding: 48,
  },
]

export function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

export type ExtendedTokens = {
  headings: HeadingDef[]
  button: ButtonStyle
  link: LinkStyle
  blockGap: number
  rootPadding: RootPadding
  layout: LayoutWidths
  shadows: ShadowPreset[]
  image: ImageSettings
  gradients: GradientPreset[]
  sectionVariations: SectionVariation[]
  buttonVariations: ButtonVariation[]
  imageVariations: ImageVariation[]
}

export const DEFAULT_EXTENDED: ExtendedTokens = {
  headings: DEFAULT_HEADINGS,
  button: DEFAULT_BUTTON,
  link: DEFAULT_LINK,
  blockGap: 24,
  rootPadding: { top: 0, right: 16, bottom: 0, left: 16 },
  layout: DEFAULT_LAYOUT,
  shadows: DEFAULT_SHADOWS,
  image: DEFAULT_IMAGE,
  gradients: DEFAULT_GRADIENTS,
  sectionVariations: DEFAULT_SECTION_VARIATIONS,
  buttonVariations: DEFAULT_BUTTON_VARIATIONS,
  imageVariations: DEFAULT_IMAGE_VARIATIONS,
}

// Resolve a shadow preset name to its CSS box-shadow value.
export function resolveShadow(name: string, presets: ShadowPreset[]): string {
  if (name === 'None') return 'none'
  return presets.find((p) => p.name === name)?.value ?? 'none'
}

export type WorkspaceTokens = {
  typography: { base: number; ratio: number }
  spacing: SpacingStep[]
  colors: ColorSlot[]
  radii: RadiusSlot[]
  ext: ExtendedTokens
}

export function aspectToRatio(aspect: string): number {
  const [w, h] = aspect.split(':').map(Number)
  return w && h ? w / h : 16 / 9
}

export function slotToPx(
  slot: string,
  scale: { name: string; px: number }[],
): number {
  return scale.find((s) => s.name === slot)?.px ?? 16
}
