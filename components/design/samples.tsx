'use client'

import { useState, type CSSProperties } from 'react'
import {
  type DesignSystem,
  type Palette,
  type ButtonVariation,
  type SectionStyle,
  resolveRole,
  radiusPx,
  fontStack,
} from '@/lib/design-system'

type BtnState = 'default' | 'hover' | 'focus'

/** Resolve a button variation to a concrete CSS style for a given state. */
export function buttonStyle(
  bv: ButtonVariation,
  p: Palette,
  ds: DesignSystem,
  state: BtnState = 'default',
): CSSProperties {
  const bgRole = state === 'default' ? bv.bgRole : bv.hoverBgRole
  const textRole = state === 'default' ? bv.textRole : bv.hoverTextRole
  const bg = resolveRole(p, bgRole)
  return {
    backgroundColor: bg,
    color: resolveRole(p, textRole),
    border: `${bv.borderWidth}px ${bv.borderStyle} ${resolveRole(p, bv.borderRole)}`,
    borderRadius: radiusPx(ds, bv.radiusKey),
    padding: `${bv.padY}px ${bv.padX}px`,
    fontWeight: bv.weight,
    fontSize: bv.fontSize,
    lineHeight: 1,
    fontFamily: fontStack(ds.fontSet.primary),
    boxShadow: state === 'focus' ? `0 0 0 3px ${resolveRole(p, bv.bgRole)}40` : undefined,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  }
}

/** A single button rendered with its variation styling; hover is interactive. */
export function ButtonSample({
  bv,
  p,
  ds,
  label,
}: {
  bv: ButtonVariation
  p: Palette
  ds: DesignSystem
  label?: string
}) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={buttonStyle(bv, p, ds, hover ? 'hover' : 'default')}
    >
      {label ?? bv.name}
    </button>
  )
}

/** Renders all three states of a button variation, labelled. */
export function ButtonStateRow({
  bv,
  p,
  ds,
  muted,
}: {
  bv: ButtonVariation
  p: Palette
  ds: DesignSystem
  muted: string
}) {
  const states: BtnState[] = ['default', 'hover', 'focus']
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[11px] font-medium" style={{ color: muted }}>
        {bv.name}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {states.map((st) => (
          <div key={st} className="flex flex-col items-start gap-1">
            <button type="button" style={buttonStyle(bv, p, ds, st)}>
              Button
            </button>
            <span className="text-[10px] capitalize" style={{ color: muted }}>
              {st}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** A section-style sample band — bg, heading, body, link, and nested button. */
export function SectionBand({
  sec,
  p,
  ds,
  size = 'md',
}: {
  sec: SectionStyle
  p: Palette
  ds: DesignSystem
  size?: 'sm' | 'md'
}) {
  const bg = resolveRole(p, sec.bgRole)
  const text = resolveRole(p, sec.textRole)
  const heading = resolveRole(p, sec.headingRole)
  const link = resolveRole(p, sec.linkRole)
  const bv =
    ds.buttonVariations.find((b) => b.id === sec.buttonVariationId) ??
    ds.buttonVariations[0]
  const fonts = ds.fontSet
  const pad = size === 'sm' ? 16 : 28

  return (
    <div style={{ backgroundColor: bg, color: text, padding: pad }}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div
            style={{
              color: heading,
              fontFamily: fontStack(fonts.heading),
              fontWeight: 700,
              fontSize: size === 'sm' ? 15 : 20,
              lineHeight: 1.2,
            }}
          >
            {sec.name} section
          </div>
          {size === 'md' && (
            <p
              className="mt-1.5 max-w-md"
              style={{
                color: text,
                fontFamily: fontStack(fonts.primary),
                fontSize: 13,
                lineHeight: 1.6,
                opacity: 0.92,
              }}
            >
              Body copy in this section style.{' '}
              <span style={{ color: link, textDecoration: 'underline' }}>
                Inline link
              </span>{' '}
              re-themes with the palette.
            </p>
          )}
        </div>
        {bv && (
          <div className="shrink-0">
            <ButtonSample bv={bv} p={p} ds={ds} label="Action" />
          </div>
        )}
      </div>
    </div>
  )
}
