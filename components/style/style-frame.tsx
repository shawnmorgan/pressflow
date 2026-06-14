'use client'

import { type ReactNode } from 'react'
import { ButtonStateRow, SectionBand } from '@/components/design/samples'
import { Pencil } from '@/components/icons'
import {
  type DesignSystem,
  type ColorRoleKey,
  COLOR_ROLES,
  applyAutoDerive,
  activePalette,
  activeFontSet,
  fontStack,
  shadowValue,
  sizePx,
  sizeMin,
} from '@/lib/design-system'

export type EditorKey =
  | 'colors'
  | 'typography'
  | 'headings'
  | 'buttons'
  | 'links'
  | 'spacing'
  | 'radius'
  | 'shadows'
  | 'layout'
  | 'buttonVariations'
  | 'sectionStyles'

type OpenFn = (key: EditorKey, anchor: HTMLElement) => void

function PreviewLabel({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
      {children}
    </span>
  )
}

/** A clickable section of the stylesheet — opens its editor popover. */
function Region({
  k,
  label,
  color,
  active,
  onOpen,
  children,
}: {
  k: EditorKey
  label: string
  color: string
  active: EditorKey | null
  onOpen: OpenFn
  children: ReactNode
}) {
  const isActive = active === k
  return (
    <section
      role="button"
      tabIndex={0}
      onClick={(e) => onOpen(k, e.currentTarget)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(k, e.currentTarget)
        }
      }}
      className={`group relative cursor-pointer rounded-sm p-3 outline-none transition-shadow ${
        isActive
          ? 'shadow-[inset_0_0_0_1.5px_var(--color-primary)]'
          : 'hover:shadow-[inset_0_0_0_1.5px_var(--color-primary)]'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <PreviewLabel color={color}>{label}</PreviewLabel>
        <span
          className={`inline-flex items-center gap-1 rounded-sm border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-opacity ${
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <Pencil className="size-3" /> Edit
        </span>
      </div>
      {children}
    </section>
  )
}

export function StyleFrame({
  ds,
  active,
  onOpen,
}: {
  ds: DesignSystem
  active: EditorKey | null
  onOpen: OpenFn
}) {
  const pal = applyAutoDerive(activePalette(ds))
  const fonts = activeFontSet(ds)
  const c = pal.colors

  const surface = c.base
  const text = c.contrast
  const muted = c.baseAccent
  const hairline = c.borderLight

  const bodyFont = fontStack(fonts.primary)
  const headFont = fontStack(fonts.heading)

  return (
    <div style={{ backgroundColor: surface }}>
      <div
        className="flex flex-col gap-2 px-5 py-5"
        style={{ fontFamily: bodyFont, color: text }}
      >
        {/* Palette by role */}
        <Region k="colors" label="Palette · by role" color={muted} active={active} onOpen={onOpen}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            {COLOR_ROLES.map((role) => (
              <div key={role.key} className="flex items-center gap-2.5">
                <span
                  className="size-9 shrink-0 rounded-sm"
                  style={{
                    backgroundColor: c[role.key as ColorRoleKey],
                    boxShadow: `inset 0 0 0 1px ${hairline}`,
                  }}
                />
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium" style={{ color: text }}>
                    {role.label}
                  </div>
                  <div className="text-[11px] uppercase tabular-nums" style={{ color: muted }}>
                    {c[role.key as ColorRoleKey]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Region>

        {/* Fluid type ramp */}
        <Region k="typography" label="Fluid type scale" color={muted} active={active} onOpen={onOpen}>
          <div className="flex flex-col gap-3">
            {ds.typography.sizes.map((s) => (
              <div key={s.key} className="flex items-baseline gap-4">
                <span className="w-24 shrink-0 text-[11px]" style={{ color: muted }}>
                  {s.name}
                </span>
                <span
                  className="min-w-0 truncate"
                  style={{ fontFamily: bodyFont, fontSize: Math.min(s.max, 46), color: text, lineHeight: 1.1 }}
                >
                  Grumpy wizards
                </span>
                <span className="ml-auto shrink-0 text-[10px] tabular-nums" style={{ color: muted }}>
                  {sizeMin(ds, s.key)}–{sizePx(ds, s.key)}px
                </span>
              </div>
            ))}
          </div>
        </Region>

        {/* Heading ramp */}
        <Region k="headings" label="Headings" color={muted} active={active} onOpen={onOpen}>
          <div className="flex flex-col gap-3">
            {ds.headings.map((h) => {
              const px = Math.min(sizePx(ds, h.sizeKey), 50)
              const color = h.colorRole ? c[h.colorRole] : text
              return (
                <div key={h.level} className="flex items-baseline gap-3">
                  <span className="w-8 shrink-0 text-[11px]" style={{ color: muted }}>
                    {h.level}
                  </span>
                  <span
                    className="min-w-0 truncate"
                    style={{
                      fontFamily: headFont,
                      fontSize: px,
                      fontWeight: h.weight,
                      lineHeight: h.lineHeight,
                      letterSpacing: `${h.letterSpacing}em`,
                      color,
                    }}
                  >
                    The spectacle before us was indeed sublime
                  </span>
                </div>
              )
            })}
          </div>
        </Region>

        {/* Buttons: variations × states */}
        <Region k="buttons" label="Buttons · variations × states" color={muted} active={active} onOpen={onOpen}>
          <div className="flex flex-col gap-5">
            {ds.buttonVariations.map((bv) => (
              <ButtonStateRow key={bv.id} bv={bv} p={pal} ds={ds} muted={muted} />
            ))}
          </div>
        </Region>

        {/* Links */}
        <Region k="links" label="Links" color={muted} active={active} onOpen={onOpen}>
          <p className="text-[15px] leading-relaxed" style={{ fontFamily: bodyFont, color: text }}>
            Body text with an{' '}
            <span
              style={{
                color: ds.link.color,
                textDecoration: ds.link.underline ? 'underline' : 'none',
                textUnderlineOffset: 2,
              }}
            >
              inline link
            </span>{' '}
            alongside its{' '}
            <span style={{ color: ds.link.hoverColor, textDecoration: ds.link.underline ? 'underline' : 'none' }}>
              hover tone
            </span>
            .
          </p>
        </Region>

        {/* Spacing */}
        <Region k="spacing" label="Spacing scale" color={muted} active={active} onOpen={onOpen}>
          <div className="flex flex-col gap-2">
            {ds.spacing.map((s) => (
              <div key={s.key} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-[11px]" style={{ color: muted }}>
                  {s.name}
                </span>
                <span className="h-3 rounded-sm" style={{ width: Math.min(s.max, 240), backgroundColor: c.brand }} />
                <span className="text-[10px] tabular-nums" style={{ color: muted }}>
                  {s.min}–{s.max}px
                </span>
              </div>
            ))}
          </div>
        </Region>

        {/* Radius */}
        <Region k="radius" label="Border radius" color={muted} active={active} onOpen={onOpen}>
          <div className="flex flex-wrap gap-4">
            {ds.radii.map((r) => (
              <div key={r.key} className="flex flex-col items-center gap-1.5">
                <span
                  className="size-12"
                  style={{ backgroundColor: c.tint, border: `1px solid ${hairline}`, borderRadius: Math.min(r.px, 24) }}
                />
                <span className="text-[10px] font-medium" style={{ color: text }}>
                  {r.name}
                </span>
                <span className="text-[10px] tabular-nums" style={{ color: muted }}>
                  {r.px > 100 ? '∞' : `${r.px}px`}
                </span>
              </div>
            ))}
          </div>
        </Region>

        {/* Shadows */}
        <Region k="shadows" label="Shadows" color={muted} active={active} onOpen={onOpen}>
          <div className="flex flex-wrap gap-6">
            {ds.shadows.map((s) => (
              <div key={s.key} className="flex flex-col items-center gap-2">
                <span className="size-16 rounded-sm" style={{ backgroundColor: surface, boxShadow: shadowValue(s) }} />
                <span className="text-[10px] font-medium" style={{ color: text }}>
                  {s.name}
                </span>
                <span className="text-[10px] capitalize" style={{ color: muted }}>
                  {s.tone}
                </span>
              </div>
            ))}
          </div>
        </Region>

        {/* Layout widths */}
        <Region k="layout" label="Layout widths" color={muted} active={active} onOpen={onOpen}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-[11px]" style={{ color: muted }}>
                Content
              </span>
              <div className="h-2.5 flex-1" style={{ backgroundColor: hairline }}>
                <div
                  className="h-full"
                  style={{ width: `${(ds.layout.contentSize / ds.layout.wideSize) * 100}%`, backgroundColor: c.brand }}
                />
              </div>
              <span className="w-14 shrink-0 text-right text-[10px] tabular-nums" style={{ color: muted }}>
                {ds.layout.contentSize}px
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-[11px]" style={{ color: muted }}>
                Wide
              </span>
              <div className="h-2.5 flex-1" style={{ backgroundColor: c.brandAlt }} />
              <span className="w-14 shrink-0 text-right text-[10px] tabular-nums" style={{ color: muted }}>
                {ds.layout.wideSize}px
              </span>
            </div>
          </div>
        </Region>

        {/* Button variations */}
        <Region k="buttonVariations" label="Button variations" color={muted} active={active} onOpen={onOpen}>
          <div className="flex flex-wrap gap-3">
            {ds.buttonVariations.map((bv) => (
              <span key={bv.id} className="text-[11px]" style={{ color: muted }}>
                {bv.name}
                {bv.id !== ds.buttonVariations[ds.buttonVariations.length - 1].id ? ' ·' : ''}
              </span>
            ))}
          </div>
        </Region>

        {/* Section styles */}
        <Region k="sectionStyles" label="Section styles" color={muted} active={active} onOpen={onOpen}>
          <div
            className="flex flex-col overflow-hidden rounded-sm"
            style={{ border: `1px solid ${hairline}`, gap: 1, backgroundColor: hairline }}
          >
            {ds.sectionStyles.map((sec) => (
              <SectionBand key={sec.id} sec={sec} p={pal} ds={ds} size="md" />
            ))}
          </div>
        </Region>
      </div>
    </div>
  )
}
