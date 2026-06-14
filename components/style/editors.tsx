'use client'

import {
  Label,
  NumberField,
  SelectField,
  ColorField,
  TextField,
  Toggle,
  IconButton,
  StatusPill,
} from '@/components/design/primitives'
import { Plus, Copy, Trash } from '@/components/icons'
import { SectionBand, buttonStyle } from '@/components/design/samples'
import {
  type DesignSystem,
  type Palette,
  type ColorRoleKey,
  type Gradient,
  type ButtonVariation,
  type SectionStyle,
  type RoleRef,
  COLOR_ROLES,
  SCALE_RATIOS,
  FONT_FAMILIES,
  FONT_WEIGHTS,
  buildFluidSizes,
  applyAutoDerive,
  shadowValue,
  makeId,
  BORDER_STYLES,
} from '@/lib/design-system'

type Props = { ds: DesignSystem; setDs: (d: DesignSystem) => void }

const fontOptions = FONT_FAMILIES.map((f) => ({ label: f, value: f }))
const weightOptions = FONT_WEIGHTS.map((w) => ({ label: String(w), value: w }))
const borderStyleOptions = BORDER_STYLES.map((s) => ({ label: s, value: s }))
const roleOptions: { label: string; value: RoleRef }[] = [
  { label: 'Transparent', value: 'transparent' },
  ...COLOR_ROLES.map((r) => ({ label: r.label, value: r.key as RoleRef })),
]

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-dashed border-border px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
    >
      <Plus className="size-3.5" /> {label}
    </button>
  )
}

/* ============================ COLORS ============================ */

function DeriveToggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-[10px] text-muted-foreground">Auto-derive</span>
      <Toggle checked={checked} onChange={onChange} label="Auto-derive accent and tint" />
    </span>
  )
}

export function ColorsEditor({ ds, setDs }: Props) {
  const pal = ds.palette

  function patchPalette(mut: (p: Palette) => Palette) {
    setDs({ ...ds, palette: applyAutoDerive(mut(ds.palette)) })
  }
  function setColor(key: ColorRoleKey, hex: string) {
    patchPalette((p) => ({ ...p, colors: { ...p.colors, [key]: hex } }))
  }

  const groups = [
    { title: 'Brand', keys: ['brand', 'brandAccent'] as ColorRoleKey[] },
    { title: 'Brand Alt', keys: ['brandAlt', 'altAccent'] as ColorRoleKey[] },
    { title: 'Contrast', keys: ['contrast', 'contrastAccent'] as ColorRoleKey[] },
    { title: 'Base', keys: ['base', 'baseAccent'] as ColorRoleKey[] },
    { title: 'Surface & Borders', keys: ['tint', 'borderLight', 'borderDark'] as ColorRoleKey[] },
  ]

  return (
    <div className="flex flex-col gap-4">
      {groups.map((g) => (
        <div key={g.title}>
          <div className="mb-2 flex items-center justify-between">
            <Label>{g.title}</Label>
            {g.title === 'Brand' && (
              <DeriveToggle
                checked={pal.autoDeriveBrand}
                onChange={(v) => patchPalette((p) => ({ ...p, autoDeriveBrand: v }))}
              />
            )}
            {g.title === 'Brand Alt' && (
              <DeriveToggle
                checked={pal.autoDeriveAlt}
                onChange={(v) => patchPalette((p) => ({ ...p, autoDeriveAlt: v }))}
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {g.keys.map((key) => {
              const role = COLOR_ROLES.find((r) => r.key === key)!
              const derived =
                (key === 'brandAccent' && pal.autoDeriveBrand) ||
                (key === 'altAccent' && pal.autoDeriveAlt)
              return (
                <div key={key} className={derived ? 'opacity-70' : ''}>
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-foreground">{role.label}</span>
                    <StatusPill status={ds.colorStatus[key]} />
                  </div>
                  <ColorField label="" value={pal.colors[key]} onChange={(v) => setColor(key, v)} />
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <p className="rounded-sm border border-border bg-muted/40 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground">
        Curated palette — WordPress default colors are off.
      </p>

      <GradientsSubCard ds={ds} setDs={setDs} />
      <DuotonesSubCard ds={ds} setDs={setDs} />
    </div>
  )
}

function GradientsSubCard({ ds, setDs }: Props) {
  function setGradients(g: Gradient[]) {
    setDs({ ...ds, gradients: g })
  }
  return (
    <details className="rounded-sm border border-border">
      <summary className="cursor-pointer px-3 py-2 text-[12px] font-medium text-foreground">
        Gradients ({ds.gradients.length}/5)
      </summary>
      <div className="flex flex-col gap-3 border-t border-border px-3 py-3">
        {ds.gradients.map((g, i) => (
          <div key={g.id} className="flex items-center gap-2">
            <span
              className="h-8 w-12 shrink-0 rounded-sm border border-border"
              style={{ backgroundImage: `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})` }}
            />
            <TextField
              value={g.name}
              onChange={(v) =>
                setGradients(ds.gradients.map((x, j) => (j === i ? { ...x, name: v } : x)))
              }
            />
            <input
              type="color"
              value={g.from}
              aria-label="Gradient from"
              onChange={(e) =>
                setGradients(ds.gradients.map((x, j) => (j === i ? { ...x, from: e.target.value } : x)))
              }
              className="size-7 shrink-0 cursor-pointer rounded-sm border border-border"
            />
            <input
              type="color"
              value={g.to}
              aria-label="Gradient to"
              onChange={(e) =>
                setGradients(ds.gradients.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)))
              }
              className="size-7 shrink-0 cursor-pointer rounded-sm border border-border"
            />
            <IconButton
              label="Remove gradient"
              danger
              onClick={() => setGradients(ds.gradients.filter((_, j) => j !== i))}
            >
              <Trash className="size-3.5" />
            </IconButton>
          </div>
        ))}
        {ds.gradients.length < 5 && (
          <AddButton
            label="Add gradient"
            onClick={() =>
              setGradients([
                ...ds.gradients,
                { id: makeId('grad'), name: 'Gradient', from: '#3858e9', to: '#1d2327', angle: 135 },
              ])
            }
          />
        )}
      </div>
    </details>
  )
}

function DuotonesSubCard({ ds, setDs }: Props) {
  return (
    <details className="rounded-sm border border-border">
      <summary className="cursor-pointer px-3 py-2 text-[12px] font-medium text-foreground">
        Duotone ({ds.duotones.length})
      </summary>
      <div className="flex flex-col gap-3 border-t border-border px-3 py-3">
        {ds.duotones.map((d, i) => (
          <div key={d.id} className="flex items-center gap-2">
            <span
              className="h-8 w-12 shrink-0 rounded-sm border border-border"
              style={{ backgroundImage: `linear-gradient(135deg, ${d.shadow}, ${d.highlight})` }}
            />
            <TextField
              value={d.name}
              onChange={(v) =>
                setDs({ ...ds, duotones: ds.duotones.map((x, j) => (j === i ? { ...x, name: v } : x)) })
              }
            />
            <input
              type="color"
              value={d.shadow}
              aria-label="Duotone shadow"
              onChange={(e) =>
                setDs({
                  ...ds,
                  duotones: ds.duotones.map((x, j) => (j === i ? { ...x, shadow: e.target.value } : x)),
                })
              }
              className="size-7 shrink-0 cursor-pointer rounded-sm border border-border"
            />
            <input
              type="color"
              value={d.highlight}
              aria-label="Duotone highlight"
              onChange={(e) =>
                setDs({
                  ...ds,
                  duotones: ds.duotones.map((x, j) => (j === i ? { ...x, highlight: e.target.value } : x)),
                })
              }
              className="size-7 shrink-0 cursor-pointer rounded-sm border border-border"
            />
          </div>
        ))}
      </div>
    </details>
  )
}

/* ============================ TYPOGRAPHY ============================ */

export function TypographyEditor({ ds, setDs }: Props) {
  const fonts = ds.fontSet

  function regen(base: number, ratio: number) {
    setDs({ ...ds, typography: { base, ratio, sizes: buildFluidSizes(base, ratio) } })
  }
  function setSize(i: number, field: 'min' | 'max', v: number) {
    setDs({
      ...ds,
      typography: {
        ...ds.typography,
        sizes: ds.typography.sizes.map((s, j) => (j === i ? { ...s, [field]: v } : s)),
      },
    })
  }
  function setFont(field: keyof typeof fonts, v: string) {
    setDs({ ...ds, fontSet: { ...fonts, [field]: v } })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <NumberField label="Base size" value={ds.typography.base} min={10} onChange={(v) => regen(v, ds.typography.ratio)} />
        <SelectField
          label="Scale ratio"
          value={ds.typography.ratio}
          options={SCALE_RATIOS.map((r) => ({ label: r.label, value: r.value }))}
          onChange={(v) => regen(ds.typography.base, v)}
        />
      </div>

      <div>
        <Label>Fluid sizes (clamp min → max)</Label>
        <div className="mt-2 flex flex-col gap-2">
          {ds.typography.sizes.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-[11px] font-medium text-foreground">{s.name}</span>
              <div className="flex flex-1 items-center gap-1.5">
                <input
                  type="number"
                  value={s.min}
                  aria-label={`${s.name} min`}
                  onChange={(e) => setSize(i, 'min', Number(e.target.value))}
                  className="w-full rounded-sm border border-input bg-background px-2 py-1 text-[12px] tabular-nums text-foreground outline-none focus:border-primary"
                />
                <span className="text-[10px] text-muted-foreground">→</span>
                <input
                  type="number"
                  value={s.max}
                  aria-label={`${s.name} max`}
                  onChange={(e) => setSize(i, 'max', Number(e.target.value))}
                  className="w-full rounded-sm border border-input bg-background px-2 py-1 text-[12px] tabular-nums text-foreground outline-none focus:border-primary"
                />
                <span className="text-[10px] text-muted-foreground">px</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Font-family roles</Label>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <SelectField label="Primary (body)" value={fonts.primary} options={fontOptions} onChange={(v) => setFont('primary', v)} />
          <SelectField label="Display / Heading" value={fonts.heading} options={fontOptions} onChange={(v) => setFont('heading', v)} />
          <SelectField label="Condensed" value={fonts.condensed} options={[{ label: 'None', value: '' }, ...fontOptions]} onChange={(v) => setFont('condensed', v)} />
          <SelectField label="Expanded" value={fonts.expanded} options={[{ label: 'None', value: '' }, ...fontOptions]} onChange={(v) => setFont('expanded', v)} />
          <SelectField label="Monospace" value={fonts.mono} options={fontOptions} onChange={(v) => setFont('mono', v)} />
        </div>
      </div>
    </div>
  )
}

/* ============================ HEADINGS ============================ */

export function HeadingsEditor({ ds, setDs }: Props) {
  const sizeOptions = ds.typography.sizes.map((s) => ({ label: s.name, value: s.key }))
  const colorOptions = [
    { label: 'Inherit', value: '' },
    ...COLOR_ROLES.map((r) => ({ label: r.label, value: r.key })),
  ]
  function patch(i: number, field: string, v: number | string) {
    setDs({
      ...ds,
      headings: ds.headings.map((h, j) =>
        j === i ? { ...h, [field]: field === 'colorRole' && v === '' ? undefined : v } : h,
      ),
    })
  }
  return (
    <div className="flex flex-col gap-3">
      {ds.headings.map((h, i) => (
        <div key={h.level} className="rounded-sm border border-border p-2.5">
          <div className="mb-2 text-[11px] font-semibold text-foreground">{h.level}</div>
          <div className="grid grid-cols-2 gap-2.5">
            <SelectField label="Size" value={h.sizeKey} options={sizeOptions} onChange={(v) => patch(i, 'sizeKey', v)} />
            <SelectField label="Weight" value={h.weight} options={weightOptions} onChange={(v) => patch(i, 'weight', v)} />
            <NumberField label="Line height" value={h.lineHeight} suffix="" onChange={(v) => patch(i, 'lineHeight', v)} />
            <NumberField label="Letter spacing" value={h.letterSpacing} suffix="em" onChange={(v) => patch(i, 'letterSpacing', v)} />
            <div className="col-span-2">
              <SelectField label="Color" value={h.colorRole ?? ''} options={colorOptions} onChange={(v) => patch(i, 'colorRole', v)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ============================ SPACING ============================ */

export function SpacingEditor({ ds, setDs }: Props) {
  function setStep(i: number, field: 'min' | 'preferredVw' | 'max', v: number) {
    setDs({ ...ds, spacing: ds.spacing.map((s, j) => (j === i ? { ...s, [field]: v } : s)) })
  }
  function confirmStep(i: number) {
    setDs({ ...ds, spacing: ds.spacing.map((s, j) => (j === i ? { ...s, status: 'default' } : s)) })
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="w-16 shrink-0">Step</span>
          <span className="flex-1 text-center">min · vw · max</span>
        </div>
        {ds.spacing.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className="flex w-16 shrink-0 flex-col">
              <span className="text-[11px] font-medium text-foreground">{s.name}</span>
              <StatusPill status={s.status} onConfirm={() => confirmStep(i)} />
            </div>
            <div className="flex flex-1 items-center gap-1">
              <input type="number" value={s.min} aria-label={`${s.name} min`} onChange={(e) => setStep(i, 'min', Number(e.target.value))} className="w-full rounded-sm border border-input bg-background px-1.5 py-1 text-[12px] tabular-nums text-foreground outline-none focus:border-primary" />
              <input type="number" value={s.preferredVw} aria-label={`${s.name} preferred vw`} step={0.1} onChange={(e) => setStep(i, 'preferredVw', Number(e.target.value))} className="w-full rounded-sm border border-input bg-background px-1.5 py-1 text-[12px] tabular-nums text-foreground outline-none focus:border-primary" />
              <input type="number" value={s.max} aria-label={`${s.name} max`} onChange={(e) => setStep(i, 'max', Number(e.target.value))} className="w-full rounded-sm border border-input bg-background px-1.5 py-1 text-[12px] tabular-nums text-foreground outline-none focus:border-primary" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumberField label="Block gap" value={ds.blockGap} onChange={(v) => setDs({ ...ds, blockGap: v })} />
      </div>

      <div>
        <Label>Root padding</Label>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <NumberField
              key={side}
              label={side[0].toUpperCase()}
              value={ds.rootPadding[side]}
              suffix=""
              onChange={(v) => setDs({ ...ds, rootPadding: { ...ds.rootPadding, [side]: v } })}
            />
          ))}
        </div>
      </div>

      <p className="rounded-sm border border-border bg-muted/40 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground">
        Fluid/responsive by default — matches modern FSE themes.
      </p>
    </div>
  )
}

/* ============================ LAYOUT WIDTHS ============================ */

export function LayoutEditor({ ds, setDs }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-4">
        <NumberField label="Content width" value={ds.layout.contentSize} onChange={(v) => setDs({ ...ds, layout: { ...ds.layout, contentSize: v } })} />
        <NumberField label="Wide width" value={ds.layout.wideSize} onChange={(v) => setDs({ ...ds, layout: { ...ds.layout, wideSize: v } })} />
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Aim for ~45–75 characters per line for comfortable reading.
      </p>
    </div>
  )
}

/* ============================ BORDER RADIUS ============================ */

export function RadiusEditor({ ds, setDs }: Props) {
  return (
    <div className="flex flex-col gap-2.5">
      {ds.radii.map((r, i) => (
        <div key={r.key} className="flex items-center gap-3">
          <span className="size-9 shrink-0 border border-border bg-muted" style={{ borderRadius: Math.min(r.px, 18) }} />
          <span className="w-10 shrink-0 text-[12px] font-medium text-foreground">{r.name}</span>
          <input
            type="number"
            value={r.px}
            aria-label={`${r.name} radius`}
            onChange={(e) =>
              setDs({ ...ds, radii: ds.radii.map((x, j) => (j === i ? { ...x, px: Number(e.target.value) } : x)) })
            }
            className="w-24 rounded-sm border border-input bg-background px-2 py-1 text-[12px] tabular-nums text-foreground outline-none focus:border-primary"
          />
          <span className="text-[11px] text-muted-foreground">px</span>
        </div>
      ))}
    </div>
  )
}

/* ============================ SHADOWS ============================ */

export function ShadowsEditor({ ds, setDs }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {ds.shadows.map((s, i) => (
        <div key={s.key} className="flex flex-col items-center gap-2 rounded-sm border border-border p-3">
          <span className="size-12 rounded-sm bg-card" style={{ boxShadow: shadowValue(s) }} />
          <span className="text-[11px] font-medium text-foreground">{s.name}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">{s.tone === 'dark' ? 'Dark' : 'Light'}</span>
            <Toggle
              checked={s.tone === 'dark'}
              label={`${s.name} dark tone`}
              onChange={(v) =>
                setDs({ ...ds, shadows: ds.shadows.map((x, j) => (j === i ? { ...x, tone: v ? 'dark' : 'light' } : x)) })
              }
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ============================ BUTTONS (default) ============================ */

export function ButtonsEditor({ ds, setDs }: Props) {
  const b = ds.button
  const radiusOptions = ds.radii.map((r) => ({ label: r.name, value: r.key }))
  function set<K extends keyof typeof b>(field: K, v: (typeof b)[K]) {
    setDs({ ...ds, button: { ...b, [field]: v } })
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <ColorField label="Background" value={b.bg} onChange={(v) => set('bg', v)} />
        <ColorField label="Text" value={b.text} onChange={(v) => set('text', v)} />
        <SelectField label="Radius" value={b.radiusKey} options={radiusOptions} onChange={(v) => set('radiusKey', v)} />
        <SelectField label="Border style" value={b.borderStyle} options={borderStyleOptions} onChange={(v) => set('borderStyle', v)} />
        <NumberField label="Border width" value={b.borderWidth} suffix="px" onChange={(v) => set('borderWidth', v)} />
        <NumberField label="Font size" value={b.fontSize} suffix="px" onChange={(v) => set('fontSize', v)} />
        <NumberField label="Padding X" value={b.padX} onChange={(v) => set('padX', v)} />
        <NumberField label="Padding Y" value={b.padY} onChange={(v) => set('padY', v)} />
        <SelectField label="Font weight" value={b.weight} options={weightOptions} onChange={(v) => set('weight', v)} />
      </div>
      <div className="border-t border-border pt-3">
        <Label>States</Label>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <ColorField label="Hover bg" value={b.hoverBg} onChange={(v) => set('hoverBg', v)} />
          <ColorField label="Hover text" value={b.hoverText} onChange={(v) => set('hoverText', v)} />
          <ColorField label="Focus bg" value={b.focusBg} onChange={(v) => set('focusBg', v)} />
          <ColorField label="Focus text" value={b.focusText} onChange={(v) => set('focusText', v)} />
        </div>
      </div>
    </div>
  )
}

/* ============================ LINKS ============================ */

export function LinksEditor({ ds, setDs }: Props) {
  const l = ds.link
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <ColorField label="Color" value={l.color} onChange={(v) => setDs({ ...ds, link: { ...l, color: v } })} />
        <ColorField label="Hover color" value={l.hoverColor} onChange={(v) => setDs({ ...ds, link: { ...l, hoverColor: v } })} />
      </div>
      <label className="flex items-center justify-between">
        <span className="text-[12px] text-foreground">Underline links</span>
        <Toggle checked={l.underline} label="Underline links" onChange={(v) => setDs({ ...ds, link: { ...l, underline: v } })} />
      </label>
    </div>
  )
}

/* ====================== BUTTON VARIATIONS ====================== */

function ButtonStatePreview({ bv, ds }: { bv: ButtonVariation; ds: DesignSystem }) {
  const p = applyAutoDerive(ds.palette)
  return (
    <div className="flex flex-wrap items-end gap-x-5 gap-y-2 rounded-sm border border-border bg-muted/30 px-3 py-3">
      {(['default', 'hover'] as const).map((state) => (
        <div key={state} className="flex flex-col items-start gap-1">
          <span style={buttonStyle(bv, p, ds, state)}>{bv.name}</span>
          <span className="text-[10px] capitalize text-muted-foreground">{state}</span>
        </div>
      ))}
    </div>
  )
}

export function ButtonVariationsEditor({ ds, setDs }: Props) {
  const radiusOptions = ds.radii.map((r) => ({ label: r.name, value: r.key }))

  function patch(id: string, mut: (b: ButtonVariation) => ButtonVariation) {
    setDs({ ...ds, buttonVariations: ds.buttonVariations.map((b) => (b.id === id ? mut(b) : b)) })
  }
  function add() {
    const nb: ButtonVariation = { ...ds.buttonVariations[0], id: makeId('bv'), name: 'New button' }
    setDs({ ...ds, buttonVariations: [...ds.buttonVariations, nb] })
  }
  function duplicate(b: ButtonVariation) {
    setDs({ ...ds, buttonVariations: [...ds.buttonVariations, { ...b, id: makeId('bv'), name: `${b.name} copy` }] })
  }
  function remove(id: string) {
    if (ds.buttonVariations.length <= 1) return
    setDs({ ...ds, buttonVariations: ds.buttonVariations.filter((b) => b.id !== id) })
  }

  return (
    <div className="flex flex-col gap-3">
      {ds.buttonVariations.map((b) => (
        <div key={b.id} className="rounded-sm border border-border p-3">
          <div className="mb-3 flex items-center gap-2">
            <TextField value={b.name} onChange={(v) => patch(b.id, (x) => ({ ...x, name: v }))} />
            <IconButton label="Duplicate button" onClick={() => duplicate(b)}>
              <Copy className="size-3.5" />
            </IconButton>
            <IconButton label="Remove button" danger disabled={ds.buttonVariations.length <= 1} onClick={() => remove(b.id)}>
              <Trash className="size-3.5" />
            </IconButton>
          </div>
          <ButtonStatePreview bv={b} ds={ds} />
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <SelectField label="Background" value={b.bgRole} options={roleOptions} onChange={(v) => patch(b.id, (x) => ({ ...x, bgRole: v }))} />
            <SelectField label="Text" value={b.textRole} options={roleOptions} onChange={(v) => patch(b.id, (x) => ({ ...x, textRole: v }))} />
            <SelectField label="Border" value={b.borderRole} options={roleOptions} onChange={(v) => patch(b.id, (x) => ({ ...x, borderRole: v }))} />
            <SelectField label="Radius" value={b.radiusKey} options={radiusOptions} onChange={(v) => patch(b.id, (x) => ({ ...x, radiusKey: v }))} />
            <SelectField label="Hover bg" value={b.hoverBgRole} options={roleOptions} onChange={(v) => patch(b.id, (x) => ({ ...x, hoverBgRole: v }))} />
            <SelectField label="Hover text" value={b.hoverTextRole} options={roleOptions} onChange={(v) => patch(b.id, (x) => ({ ...x, hoverTextRole: v }))} />
            <SelectField label="Border style" value={b.borderStyle} options={borderStyleOptions} onChange={(v) => patch(b.id, (x) => ({ ...x, borderStyle: v }))} />
            <NumberField label="Border width" value={b.borderWidth} onChange={(v) => patch(b.id, (x) => ({ ...x, borderWidth: v }))} />
          </div>
        </div>
      ))}
      <AddButton label="Add button variation" onClick={add} />
    </div>
  )
}

/* ====================== SECTION STYLES ====================== */

export function SectionStylesEditor({ ds, setDs }: Props) {
  const p = applyAutoDerive(ds.palette)
  const buttonOptions = ds.buttonVariations.map((b) => ({ label: b.name, value: b.id }))

  function patch(id: string, mut: (s: SectionStyle) => SectionStyle) {
    setDs({ ...ds, sectionStyles: ds.sectionStyles.map((s) => (s.id === id ? mut(s) : s)) })
  }
  function add() {
    const ns: SectionStyle = { ...ds.sectionStyles[0], id: makeId('ss'), name: 'New section' }
    setDs({ ...ds, sectionStyles: [...ds.sectionStyles, ns] })
  }
  function duplicate(s: SectionStyle) {
    setDs({ ...ds, sectionStyles: [...ds.sectionStyles, { ...s, id: makeId('ss'), name: `${s.name} copy` }] })
  }
  function remove(id: string) {
    if (ds.sectionStyles.length <= 1) return
    setDs({ ...ds, sectionStyles: ds.sectionStyles.filter((s) => s.id !== id) })
  }

  return (
    <div className="flex flex-col gap-3">
      {ds.sectionStyles.map((s) => (
        <div key={s.id} className="rounded-sm border border-border">
          <div className="overflow-hidden rounded-t-sm border-b border-border">
            <SectionBand sec={s} p={p} ds={ds} size="sm" />
          </div>
          <div className="p-3">
            <div className="mb-3 flex items-center gap-2">
              <TextField value={s.name} onChange={(v) => patch(s.id, (x) => ({ ...x, name: v }))} />
              <IconButton label="Duplicate section" onClick={() => duplicate(s)}>
                <Copy className="size-3.5" />
              </IconButton>
              <IconButton label="Remove section" danger disabled={ds.sectionStyles.length <= 1} onClick={() => remove(s.id)}>
                <Trash className="size-3.5" />
              </IconButton>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <SelectField label="Background" value={s.bgRole} options={roleOptions} onChange={(v) => patch(s.id, (x) => ({ ...x, bgRole: v }))} />
              <SelectField label="Text" value={s.textRole} options={roleOptions} onChange={(v) => patch(s.id, (x) => ({ ...x, textRole: v }))} />
              <SelectField label="Heading" value={s.headingRole} options={roleOptions} onChange={(v) => patch(s.id, (x) => ({ ...x, headingRole: v }))} />
              <SelectField label="Link" value={s.linkRole} options={roleOptions} onChange={(v) => patch(s.id, (x) => ({ ...x, linkRole: v }))} />
              <SelectField label="Link hover" value={s.linkHoverRole} options={roleOptions} onChange={(v) => patch(s.id, (x) => ({ ...x, linkHoverRole: v }))} />
              <SelectField label="Button" value={s.buttonVariationId} options={buttonOptions} onChange={(v) => patch(s.id, (x) => ({ ...x, buttonVariationId: v }))} />
            </div>
          </div>
        </div>
      ))}
      <AddButton label="Add section style" onClick={add} />
    </div>
  )
}
