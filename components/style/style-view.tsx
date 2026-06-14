'use client'

import { useRef, useState, type ReactNode } from 'react'
import { InfiniteCanvas } from '@/components/canvas/infinite-canvas'
import { Frame } from '@/components/canvas/frame'
import { Popover } from '@/components/canvas/popover'
import { StyleFrame, type EditorKey } from '@/components/style/style-frame'
import {
  ColorsEditor,
  TypographyEditor,
  HeadingsEditor,
  ButtonsEditor,
  LinksEditor,
  SpacingEditor,
  RadiusEditor,
  ShadowsEditor,
  LayoutEditor,
  ButtonVariationsEditor,
  SectionStylesEditor,
} from '@/components/style/editors'
import { type DesignSystem } from '@/lib/design-system'

type Props = { ds: DesignSystem; setDs: (d: DesignSystem) => void }

const EDITORS: Record<
  EditorKey,
  { title: string; width: number; render: (p: Props) => ReactNode }
> = {
  colors: { title: 'Colors', width: 360, render: (p) => <ColorsEditor {...p} /> },
  typography: { title: 'Typography', width: 360, render: (p) => <TypographyEditor {...p} /> },
  headings: { title: 'Headings', width: 340, render: (p) => <HeadingsEditor {...p} /> },
  buttons: { title: 'Buttons', width: 360, render: (p) => <ButtonsEditor {...p} /> },
  links: { title: 'Links', width: 320, render: (p) => <LinksEditor {...p} /> },
  spacing: { title: 'Spacing', width: 360, render: (p) => <SpacingEditor {...p} /> },
  radius: { title: 'Border radius', width: 320, render: (p) => <RadiusEditor {...p} /> },
  shadows: { title: 'Shadows', width: 340, render: (p) => <ShadowsEditor {...p} /> },
  layout: { title: 'Layout widths', width: 320, render: (p) => <LayoutEditor {...p} /> },
  buttonVariations: { title: 'Button variations', width: 380, render: (p) => <ButtonVariationsEditor {...p} /> },
  sectionStyles: { title: 'Section styles', width: 380, render: (p) => <SectionStylesEditor {...p} /> },
}

export function StyleView({ ds, setDs }: Props) {
  const anchorRef = useRef<HTMLElement | null>(null)
  const [openKey, setOpenKey] = useState<EditorKey | null>(null)

  const open = (key: EditorKey, el: HTMLElement) => {
    anchorRef.current = el
    // Toggle off if the same region is clicked again.
    setOpenKey((prev) => (prev === key ? null : key))
  }

  const editor = openKey ? EDITORS[openKey] : null

  return (
    <InfiniteCanvas>
      <div className="p-24 pl-32">
        <Frame
          title="Global Style"
          width={760}
          badge={
            <span className="rounded-sm border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              Live · one locked style
            </span>
          }
        >
          <StyleFrame ds={ds} active={openKey} onOpen={open} />
        </Frame>
      </div>

      {editor && (
        <Popover
          open
          anchorRef={anchorRef}
          side="right"
          title={editor.title}
          width={editor.width}
          onClose={() => setOpenKey(null)}
        >
          {editor.render({ ds, setDs })}
        </Popover>
      )}
    </InfiniteCanvas>
  )
}
