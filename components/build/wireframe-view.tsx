'use client'

import { useRef, useState, type CSSProperties } from 'react'
import { X, Settings, ImageIcon, Copy } from '@/components/icons'
import { AddSectionDivider } from '@/components/build/section-inserter'
import { sectionMarkup } from '@/lib/block-markup'
import { useToast } from '@/components/ui/toast'
import {
  SOURCE_META,
  sectionLabel,
  headingLevel,
  type Page,
  type Section,
  type SectionType,
  type Card,
} from '@/lib/sitemap'
import {
  type DesignSystem,
  applyAutoDerive,
  radiusPx,
  sizePx,
} from '@/lib/design-system'

type Theme = {
  surface: string
  bg: string
  text: string
  primary: string
  accent: string
  radius: number
  btnStyle: CSSProperties
  sizes: { key: string; max: number }[]
}

type Props = {
  page: Page
  selectedSectionId: string | null
  ds: DesignSystem
  onSelectSection: (id: string) => void
  onReorder: (from: number, to: number) => void
  onRemove: (id: string) => void
  onAdd: (index: number, type: SectionType) => void
  onEditStructure: (id: string) => void
  onUpdateSection: (id: string, fn: (s: Section) => Section) => void
}

export function WireframeView({
  page,
  selectedSectionId,
  ds,
  onSelectSection,
  onReorder,
  onRemove,
  onAdd,
  onEditStructure,
  onUpdateSection,
}: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [addAt, setAddAt] = useState<number | null>(null)

  const pal = applyAutoDerive(ds.palette)
  const c = pal.colors
  const b = ds.button
  const btnRadius = radiusPx(ds, b.radiusKey)
  const theme: Theme = {
    surface: c.base,
    bg: c.tint,
    text: c.contrast,
    primary: c.brand,
    accent: c.brandAlt,
    radius: radiusPx(ds, 'xs'),
    sizes: ds.typography.sizes.map((s) => ({ key: s.key, max: s.max })),
    btnStyle: {
      backgroundColor: b.bg,
      color: b.text,
      borderRadius: btnRadius,
      padding: `${Math.max(b.padY, 8)}px ${Math.max(b.padX, 12)}px`,
      fontWeight: b.weight,
      fontSize: Math.min(b.fontSize, 14),
      borderWidth: b.borderWidth,
      borderStyle: b.borderStyle,
      borderColor: b.bg,
      lineHeight: 1,
    },
  }

  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-sm border border-border shadow-sm"
      style={{ backgroundColor: theme.surface }}
    >
      <AddSectionDivider
        open={addAt === 0}
        onToggle={() => setAddAt(addAt === 0 ? null : 0)}
        onPick={(t) => {
          onAdd(0, t)
          setAddAt(null)
        }}
        variant="block"
      />
      {page.sections.map((section, index) => (
        <div key={section.id} className="flex flex-col">
          <SectionFrame
            section={section}
            theme={theme}
            selected={section.id === selectedSectionId}
            isOver={overIndex === index && dragIndex !== index}
            onSelect={() => onSelectSection(section.id)}
            onEdit={() => onEditStructure(section.id)}
            onRemove={() => onRemove(section.id)}
            onUpdate={(fn) => onUpdateSection(section.id, fn)}
            onDragStart={() => setDragIndex(index)}
            onDragOver={() => setOverIndex(index)}
            onDrop={() => {
              if (dragIndex !== null && dragIndex !== index)
                onReorder(dragIndex, index)
              setDragIndex(null)
              setOverIndex(null)
            }}
            onDragEnd={() => {
              setDragIndex(null)
              setOverIndex(null)
            }}
          />
          <AddSectionDivider
            open={addAt === index + 1}
            onToggle={() => setAddAt(addAt === index + 1 ? null : index + 1)}
            onPick={(t) => {
              onAdd(index + 1, t)
              setAddAt(null)
            }}
            variant="block"
          />
        </div>
      ))}
      {page.sections.length === 0 && (
        <p className="py-12 text-center text-[13px] italic text-muted-foreground">
          No sections yet.
        </p>
      )}
    </div>
  )
}

function SectionFrame({
  section,
  theme,
  selected,
  isOver,
  onSelect,
  onEdit,
  onRemove,
  onUpdate,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  section: Section
  theme: Theme
  selected: boolean
  isOver: boolean
  onSelect: () => void
  onEdit: () => void
  onRemove: () => void
  onUpdate: (fn: (s: Section) => Section) => void
  onDragStart: () => void
  onDragOver: () => void
  onDrop: () => void
  onDragEnd: () => void
}) {
  const meta = SOURCE_META[section.source]
  const { showToast } = useToast()
  const copyMarkup = async () => {
    try {
      await navigator.clipboard.writeText(sectionMarkup(section))
    } catch {
      /* clipboard may be unavailable in sandboxed frames */
    }
    showToast('Copied section block markup')
  }
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver()
      }}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      className={`group/section relative ${
        selected ? 'ring-2 ring-inset ring-primary' : ''
      } ${isOver ? 'ring-2 ring-inset ring-primary/50' : ''}`}
    >
      {/* hover toolbar */}
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover/section:opacity-100">
        <span
          className="inline-flex items-center gap-1 rounded-sm border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium"
          style={{ color: meta.text }}
        >
          <span className="size-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
          {sectionLabel(section)}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="inline-flex items-center gap-1 rounded-sm border border-border bg-card px-1.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Settings className="size-3" />
          Edit structure
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            copyMarkup()
          }}
          className="inline-flex items-center gap-1 rounded-sm border border-border bg-card px-1.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Copy className="size-3" />
          Copy
        </button>
        <button
          type="button"
          aria-label="Remove section"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="flex size-6 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:text-[#d63638]"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <SectionRender section={section} theme={theme} onUpdate={onUpdate} />
    </div>
  )
}

/* ---------- Inline editable ---------- */

function Editable({
  value,
  onCommit,
  className,
  style,
  placeholder,
}: {
  value: string
  onCommit: (v: string) => void
  className?: string
  style?: CSSProperties
  placeholder?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      tabIndex={0}
      data-placeholder={placeholder}
      onClick={(e) => e.stopPropagation()}
      onBlur={(e) => {
        const t = e.currentTarget.textContent ?? ''
        if (t !== value) onCommit(t)
      }}
      className={`cursor-text rounded-sm outline-none transition-shadow focus:ring-1 focus:ring-primary/60 ${
        !value ? 'min-w-[40px] before:text-current/40 before:content-[attr(data-placeholder)]' : ''
      } ${className ?? ''}`}
      style={style}
    >
      {value}
    </div>
  )
}

/* ---------- Per-type renderers ---------- */

function levelPx(level: number, sizes: { key: string; max: number }[]): number {
  const key = level === 1 ? 'xxxl' : level === 2 ? 'xl' : level === 3 ? 'l' : 'm'
  return sizes.find((s) => s.key === key)?.max ?? 16
}

function sizeByKey(key: string, sizes: { key: string; max: number }[]): number {
  return sizes.find((s) => s.key === key)?.max ?? 16
}

function SectionRender({
  section,
  theme,
  onUpdate,
}: {
  section: Section
  theme: Theme
  onUpdate: (fn: (s: Section) => Section) => void
}) {
  const e = section.elements
  const lvl = headingLevel(section)
  const baseSize = sizeByKey('m', theme.sizes)

  const setText = (
    key: 'eyebrow' | 'heading' | 'subheading' | 'body',
    v: string,
  ) =>
    onUpdate((s) => ({
      ...s,
      elements: { ...s.elements, [key]: { ...s.elements[key], text: v } },
    }))
  const setButton = (id: string, v: string) =>
    onUpdate((s) => ({
      ...s,
      elements: {
        ...s.elements,
        buttons: s.elements.buttons.map((b) => (b.id === id ? { ...b, text: v } : b)),
      },
    }))
  const setListItem = (i: number, v: string) =>
    onUpdate((s) => {
      const items = [...s.elements.list.items]
      items[i] = v
      return { ...s, elements: { ...s.elements, list: { ...s.elements.list, items } } }
    })
  const setCard = (id: string, patch: Partial<Card>) =>
    onUpdate((s) => ({
      ...s,
      cards: s.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))

  /* shared pieces */
  const Eyebrow = e.eyebrow.on ? (
    <Editable
      value={e.eyebrow.text}
      onCommit={(v) => setText('eyebrow', v)}
      placeholder="Eyebrow"
      className="text-[11px] font-semibold uppercase tracking-wider"
      style={{ color: theme.primary }}
    />
  ) : null
  const Heading = e.heading.on ? (
    <Editable
      value={e.heading.text}
      onCommit={(v) => setText('heading', v)}
      placeholder="Heading"
      className="font-bold leading-tight tracking-tight"
      style={{ color: theme.text, fontSize: Math.min(levelPx(lvl, theme.sizes), 46) }}
    />
  ) : null
  const Subheading = e.subheading.on ? (
    <Editable
      value={e.subheading.text}
      onCommit={(v) => setText('subheading', v)}
      placeholder="Subheading"
      className="font-medium"
      style={{ color: theme.text, opacity: 0.7, fontSize: Math.min(sizeByKey('l', theme.sizes), 20) }}
    />
  ) : null
  const Body = e.body.on ? (
    <Editable
      value={e.body.text}
      onCommit={(v) => setText('body', v)}
      placeholder="Body copy"
      className="leading-relaxed"
      style={{ color: theme.text, opacity: 0.85, fontSize: baseSize }}
    />
  ) : null
  const Buttons =
    e.buttons.length > 0 ? (
      <div className="flex flex-wrap items-center gap-2">
        {e.buttons.map((btn, i) => (
          <Editable
            key={btn.id}
            value={btn.text}
            onCommit={(v) => setButton(btn.id, v)}
            placeholder="Button"
            style={
              i === 0
                ? theme.btnStyle
                : {
                    ...theme.btnStyle,
                    backgroundColor: 'transparent',
                    color: theme.text,
                    borderWidth: 1,
                    borderColor: theme.text,
                  }
            }
          />
        ))}
      </div>
    ) : null
  const List = e.list.on ? (
    <ul className="flex flex-col gap-1.5">
      {e.list.items.map((item, i) => (
        <li key={i} className="flex items-center gap-2" style={{ color: theme.text }}>
          <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: theme.primary }} />
          <Editable
            value={item}
            onCommit={(v) => setListItem(i, v)}
            style={{ fontSize: baseSize, opacity: 0.85 }}
          />
        </li>
      ))}
    </ul>
  ) : null
  const ImageBox = (h = 200) => (
    <div
      className="flex w-full items-center justify-center"
      style={{
        height: h,
        backgroundColor: theme.text,
        opacity: 0.06,
        borderRadius: theme.radius,
      }}
    >
      <ImageIcon className="size-7" style={{ color: theme.text, opacity: 0.5 }} />
    </div>
  )

  const pad = 'px-8 py-10'

  switch (section.type) {
    case 'Navbar': {
      const links = e.navLinks ?? (e.list.on ? e.list.items : [])
      return (
        <nav
          className="flex items-center justify-between gap-4 px-8 py-4"
          style={{ borderBottom: `1px solid ${theme.text}14` }}
        >
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-sm" style={{ backgroundColor: theme.primary }} />
            <span className="text-[14px] font-bold" style={{ color: theme.text }}>
              Brand
            </span>
          </div>
          {links.length > 0 && (
            <div className="hidden items-center gap-5 sm:flex">
              {links.map((item, i) => (
                <Editable
                  key={i}
                  value={item}
                  onCommit={(v) => {
                    if (e.navLinks) {
                      onUpdate((s) => {
                        const nl = [...(s.elements.navLinks ?? [])]
                        nl[i] = v
                        return { ...s, elements: { ...s.elements, navLinks: nl } }
                      })
                    } else {
                      setListItem(i, v)
                    }
                  }}
                  className="text-[13px]"
                  style={{ color: theme.text, opacity: 0.8 }}
                />
              ))}
            </div>
          )}
          {Buttons}
        </nav>
      )
    }

    case 'Hero':
      return (
        <header className={`flex flex-col items-center gap-4 text-center ${pad}`}>
          {Eyebrow}
          {Heading}
          {Subheading}
          <div className="max-w-xl">{Body}</div>
          {Buttons}
          {e.image.on && <div className="mt-4 w-full">{ImageBox(260)}</div>}
        </header>
      )

    case 'Feature':
      return (
        <section className={`flex flex-col gap-7 ${pad}`}>
          <div className="flex flex-col items-center gap-2 text-center">
            {Eyebrow}
            {Heading}
            {Subheading}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {section.cards.map((c) => (
              <div
                key={c.id}
                className="flex flex-col gap-2 p-4"
                style={{ border: `1px solid ${theme.text}14`, borderRadius: theme.radius }}
              >
                {c.media === 'Icon' && (
                  <div
                    className="flex size-9 items-center justify-center rounded-sm"
                    style={{ backgroundColor: theme.primary, opacity: 0.15 }}
                  >
                    <div className="size-4 rounded-sm" style={{ backgroundColor: theme.primary }} />
                  </div>
                )}
                {c.media === 'Image' && (
                  <div
                    className="h-20 w-full"
                    style={{ backgroundColor: theme.text, opacity: 0.06, borderRadius: theme.radius }}
                  />
                )}
                <Editable
                  value={c.title}
                  onCommit={(v) => setCard(c.id, { title: v })}
                  className="font-semibold"
                  style={{ color: theme.text, fontSize: Math.min(levelPx(3, theme.sizes), 18) }}
                />
                <Editable
                  value={c.text}
                  onCommit={(v) => setCard(c.id, { text: v })}
                  className="leading-relaxed"
                  style={{ color: theme.text, opacity: 0.75, fontSize: baseSize - 1 }}
                />
              </div>
            ))}
          </div>
        </section>
      )

    case 'TextMedia':
      return (
        <section className={`grid items-center gap-8 sm:grid-cols-2 ${pad}`}>
          <div className="flex flex-col gap-3">
            {Eyebrow}
            {Heading}
            {Body}
            {List}
            {Buttons}
          </div>
          <div>{e.image.on ? ImageBox(240) : ImageBox(240)}</div>
        </section>
      )

    case 'Testimonial':
      return (
        <section className={`flex flex-col gap-7 ${pad}`}>
          <div className="flex flex-col items-center gap-2 text-center">
            {Heading}
            {Subheading}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {section.cards.map((c) => (
              <figure
                key={c.id}
                className="flex flex-col gap-3 p-5"
                style={{ borderLeft: `3px solid ${theme.primary}`, backgroundColor: `${theme.text}06`, borderRadius: theme.radius }}
              >
                <Editable
                  value={c.text}
                  onCommit={(v) => setCard(c.id, { text: v })}
                  className="leading-relaxed"
                  style={{ color: theme.text, fontSize: baseSize }}
                />
                <figcaption className="flex items-center gap-2">
                  {c.media !== 'None' && (
                    <div className="size-8 rounded-full" style={{ backgroundColor: theme.text, opacity: 0.15 }} />
                  )}
                  <Editable
                    value={c.title}
                    onCommit={(v) => setCard(c.id, { title: v })}
                    className="text-[13px] font-semibold"
                    style={{ color: theme.text }}
                  />
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )

    case 'Pricing':
      return (
        <section className={`flex flex-col gap-7 ${pad}`}>
          <div className="flex flex-col items-center gap-2 text-center">
            {Heading}
            {Subheading}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {section.cards.map((c, i) => (
              <div
                key={c.id}
                className="flex flex-col items-center gap-3 p-5 text-center"
                style={{
                  border: `1px solid ${i === 1 ? theme.primary : `${theme.text}14`}`,
                  borderRadius: theme.radius,
                }}
              >
                <Editable
                  value={c.title}
                  onCommit={(v) => setCard(c.id, { title: v })}
                  className="text-[13px] font-semibold uppercase tracking-wide"
                  style={{ color: theme.text, opacity: 0.7 }}
                />
                <Editable
                  value={c.text}
                  onCommit={(v) => setCard(c.id, { text: v })}
                  className="font-bold"
                  style={{ color: theme.text, fontSize: Math.min(levelPx(2, theme.sizes), 30) }}
                />
                {c.link && (
                  <Editable
                    value={c.link}
                    onCommit={(v) => setCard(c.id, { link: v })}
                    className="w-full text-center"
                    style={{ ...theme.btnStyle, padding: '8px 12px' }}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )

    case 'FAQ':
      return (
        <section className={`mx-auto flex w-full max-w-2xl flex-col gap-5 ${pad}`}>
          <div className="text-center">{Heading}</div>
          <div className="flex flex-col">
            {section.cards.map((c) => (
              <div key={c.id} className="flex flex-col gap-1.5 py-3" style={{ borderTop: `1px solid ${theme.text}14` }}>
                <Editable
                  value={c.title}
                  onCommit={(v) => setCard(c.id, { title: v })}
                  className="font-semibold"
                  style={{ color: theme.text, fontSize: baseSize }}
                />
                <Editable
                  value={c.text}
                  onCommit={(v) => setCard(c.id, { text: v })}
                  className="leading-relaxed"
                  style={{ color: theme.text, opacity: 0.75, fontSize: baseSize - 1 }}
                />
              </div>
            ))}
          </div>
        </section>
      )

    case 'CTA':
      return (
        <section
          className={`flex flex-col items-center gap-4 text-center ${pad}`}
          style={{ backgroundColor: theme.primary }}
        >
          {e.heading.on && (
            <Editable
              value={e.heading.text}
              onCommit={(v) => setText('heading', v)}
              placeholder="Heading"
              className="font-bold leading-tight"
              style={{ color: '#ffffff', fontSize: Math.min(levelPx(lvl, theme.sizes), 36) }}
            />
          )}
          {e.body.on && (
            <Editable
              value={e.body.text}
              onCommit={(v) => setText('body', v)}
              placeholder="Body"
              className="max-w-xl leading-relaxed"
              style={{ color: '#ffffff', opacity: 0.9, fontSize: baseSize }}
            />
          )}
          {e.buttons.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {e.buttons.map((btn) => (
                <Editable
                  key={btn.id}
                  value={btn.text}
                  onCommit={(v) => setButton(btn.id, v)}
                  placeholder="Button"
                  style={{
                    backgroundColor: '#ffffff',
                    color: theme.primary,
                    borderRadius: theme.radius,
                    padding: '10px 18px',
                    fontWeight: 600,
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                />
              ))}
            </div>
          )}
        </section>
      )

    case 'Footer':
      return (
        <footer
          className="flex flex-col gap-6 px-8 py-8"
          style={{ borderTop: `1px solid ${theme.text}14` }}
        >
          <div className="grid gap-6 sm:grid-cols-[1fr_repeat(auto-fit,minmax(0,1fr))]" style={{ gridTemplateColumns: `1fr ${section.cards.map(() => '1fr').join(' ')}` }}>
            <div className="flex flex-col gap-2">
              {e.image?.on && (
                <div className="flex items-center gap-2">
                  <div className="size-5 rounded-sm" style={{ backgroundColor: theme.primary }} />
                  <span className="text-[13px] font-bold" style={{ color: theme.text }}>Brand</span>
                </div>
              )}
              {Body}
            </div>
            {section.cards.map((col) => (
              <div key={col.id} className="flex flex-col gap-2">
                <Editable
                  value={col.title}
                  onCommit={(v) => setCard(col.id, { title: v })}
                  className="text-[12px] font-semibold uppercase tracking-wide"
                  style={{ color: theme.text, opacity: 0.6 }}
                />
                {col.text.split('\n').map((link, i) => (
                  <span key={i} className="text-[13px]" style={{ color: theme.text, opacity: 0.8 }}>
                    {link}
                  </span>
                ))}
              </div>
            ))}
          </div>
          {e.legalBar?.on && (
            <div className="border-t pt-4" style={{ borderColor: `${theme.text}14` }}>
              <Editable
                value={e.legalBar.text}
                onCommit={(v) => onUpdate((s) => ({
                  ...s,
                  elements: { ...s.elements, legalBar: { on: true, text: v } },
                }))}
                className="text-[11px]"
                style={{ color: theme.text, opacity: 0.5 }}
              />
            </div>
          )}
        </footer>
      )

    case 'Opaque':
    default:
      return (
        <section className="relative p-6" style={{ backgroundColor: `${theme.text}05` }}>
          <span className="absolute left-2 top-2 rounded-sm border border-dashed border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Opaque / custom markup
          </span>
          <div
            className="mt-6 overflow-hidden text-[13px] leading-relaxed"
            style={{ color: theme.text }}
            dangerouslySetInnerHTML={{
              __html:
                section.opaqueHtml ||
                '<div style="opacity:.6">Imported markup preserved as-is.</div>',
            }}
          />
        </section>
      )
  }
}
