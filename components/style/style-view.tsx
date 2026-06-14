'use client'

import { useRef, useState, type ReactNode } from 'react'
import { InfiniteCanvas } from '@/components/canvas/infinite-canvas'
import { Frame } from '@/components/canvas/frame'
import { Popover } from '@/components/canvas/popover'
import {
  ColorPaletteFrame,
  TypeFrame,
  LinksFrame,
  SpacingFrame,
  BorderFrame,
  ShadowsFrame,
  SectionStylesFrame,
  type EditorKey,
} from '@/components/style/style-frame'
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
    setOpenKey((prev) => (prev === key ? null : key))
  }

  const editor = openKey ? EDITORS[openKey] : null

  const frameProps = { ds, active: openKey, onOpen: open }

  return (
    <InfiniteCanvas>
      <div className="flex flex-wrap items-start gap-6 p-24 pl-32">
        <Frame title="Color Palette" width={760}>
          <ColorPaletteFrame {...frameProps} />
        </Frame>

        <Frame title="Typography" width={760}>
          <TypeFrame {...frameProps} />
        </Frame>

        <Frame title="Links & Buttons" width={760}>
          <LinksFrame {...frameProps} />
        </Frame>

        <Frame title="Spacing & Layout" width={760}>
          <SpacingFrame {...frameProps} />
        </Frame>

        <Frame title="Border Radius" width={400}>
          <BorderFrame {...frameProps} />
        </Frame>

        <Frame title="Shadows" width={500}>
          <ShadowsFrame {...frameProps} />
        </Frame>

        <Frame title="Section Styles" width={760}>
          <SectionStylesFrame {...frameProps} />
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
