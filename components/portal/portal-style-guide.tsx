'use client'

import { type CSSProperties } from 'react'
import { type ClientProject } from '@/lib/client-portal'
import {
  COLOR_ROLES,
  activePalette,
  activeFontSet,
  applyAutoDerive,
  fontStack,
  radiusPx,
  resolveRole,
  sizePx,
} from '@/lib/design-system'
import { FieldLabel, SectionIntro, StatusPill } from '@/components/portal/portal-ui'

export function PortalStyleGuide({ project }: { project: ClientProject }) {
  const ds = project.ds
  const palette = applyAutoDerive(activePalette(ds))
  const fonts = activeFontSet(ds)

  return (
    <div className="flex flex-col gap-8">
      <SectionIntro
        title="Style guide"
        blurb="The design system the team is building for your brand. This is a read-only reference — leave any notes in the mockups."
        action={<StatusPill tone="accent">Read only</StatusPill>}
      />

      {/* Colors */}
      <section className="rounded-sm border border-border bg-card p-5">
        <FieldLabel>Color palette</FieldLabel>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {COLOR_ROLES.map((role) => {
            const hex = palette.colors[role.key]
            return (
              <div
                key={role.key}
                className="overflow-hidden rounded-sm border border-border"
              >
                <div className="h-16 w-full" style={{ backgroundColor: hex }} />
                <div className="px-2.5 py-2">
                  <div className="text-[12px] font-medium text-foreground">
                    {role.label}
                  </div>
                  <div className="font-mono text-[11px] uppercase text-muted-foreground">
                    {hex}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Typography */}
      <section className="rounded-sm border border-border bg-card p-5">
        <FieldLabel>Typography</FieldLabel>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-sm border border-border bg-background px-3 py-2.5">
            <div className="text-[11px] text-muted-foreground">Headings</div>
            <div
              className="mt-0.5 text-[18px] text-foreground"
              style={{ fontFamily: fontStack(fonts.heading) }}
            >
              {fonts.heading}
            </div>
          </div>
          <div className="rounded-sm border border-border bg-background px-3 py-2.5">
            <div className="text-[11px] text-muted-foreground">Body</div>
            <div
              className="mt-0.5 text-[18px] text-foreground"
              style={{ fontFamily: fontStack(fonts.primary) }}
            >
              {fonts.primary}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5">
          {ds.headings.map((h) => (
            <div key={h.level} className="flex items-baseline gap-4">
              <span className="w-8 shrink-0 font-mono text-[11px] text-muted-foreground">
                {h.level}
              </span>
              <span
                className="truncate text-foreground"
                style={{
                  fontFamily: fontStack(fonts.heading),
                  fontSize: Math.min(sizePx(ds, h.sizeKey), 40),
                  fontWeight: h.weight,
                  lineHeight: h.lineHeight,
                  letterSpacing: `${h.letterSpacing}em`,
                }}
              >
                The quick brown fox
              </span>
            </div>
          ))}
          <p
            className="border-t border-border pt-3 text-foreground"
            style={{
              fontFamily: fontStack(fonts.primary),
              fontSize: ds.typography.base,
              lineHeight: 1.6,
            }}
          >
            Body copy sets the tone for the whole site. It should be comfortable
            to read at length, with balanced spacing and a clear hierarchy that
            guides visitors through your story.
          </p>
        </div>
      </section>

      {/* Components — buttons */}
      <section className="rounded-sm border border-border bg-card p-5">
        <FieldLabel>Buttons</FieldLabel>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {ds.buttonVariations.map((bv) => {
            const style: CSSProperties = {
              backgroundColor: resolveRole(palette, bv.bgRole),
              color: resolveRole(palette, bv.textRole),
              border: `${bv.borderWidth}px ${bv.borderStyle} ${resolveRole(palette, bv.borderRole)}`,
              borderRadius: radiusPx(ds, bv.radiusKey),
              padding: `${bv.padY}px ${bv.padX}px`,
              fontWeight: bv.weight,
              fontSize: bv.fontSize,
              fontFamily: fontStack(fonts.primary),
            }
            return (
              <div key={bv.id} className="flex flex-col items-start gap-1.5">
                <span style={style}>{bv.name}</span>
                <span className="text-[10px] text-muted-foreground">{bv.name}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Components — radii & section styles */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="rounded-sm border border-border bg-card p-5">
          <FieldLabel>Corner radius</FieldLabel>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            {ds.radii
              .filter((r) => r.px < 9999)
              .map((r) => (
                <div key={r.key} className="flex flex-col items-center gap-1.5">
                  <div
                    className="size-12 border border-primary/40 bg-primary/10"
                    style={{ borderRadius: r.px }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {r.name}
                  </span>
                </div>
              ))}
          </div>
        </section>

        <section className="rounded-sm border border-border bg-card p-5">
          <FieldLabel>Section styles</FieldLabel>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {ds.sectionStyles.map((ss) => (
              <div
                key={ss.id}
                className="flex flex-col gap-2 rounded-sm border border-border p-3"
                style={{
                  backgroundColor: resolveRole(palette, ss.bgRole),
                  color: resolveRole(palette, ss.textRole),
                }}
              >
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: resolveRole(palette, ss.headingRole) }}
                >
                  {ss.name}
                </span>
                <span className="text-[11px] opacity-80">Sample text on this surface.</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
