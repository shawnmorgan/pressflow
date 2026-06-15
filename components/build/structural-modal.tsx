'use client'

import { useEffect } from 'react'
import { X, Plus, Trash } from '@/components/icons'
import {
  SECTION_META,
  SOURCE_META,
  headingLevel,
  derivedHeadingLevel,
  newCard,
  uid,
  type Section,
  type Card,
  type CardMedia,
  type ButtonEl,
} from '@/lib/sitemap'

type Props = {
  section: Section
  onClose: () => void
  onUpdate: (fn: (s: Section) => Section) => void
}

const CARD_MEDIA: CardMedia[] = ['Image', 'Icon', 'None']

export function StructuralModal({ section, onClose, onUpdate }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const meta = SECTION_META[section.type]
  const e = section.elements
  const lvl = headingLevel(section)

  /* element mutators */
  const setEl = <K extends 'eyebrow' | 'heading' | 'subheading' | 'body'>(
    key: K,
    patch: Partial<{ on: boolean; text: string }>,
  ) =>
    onUpdate((s) => ({
      ...s,
      elements: { ...s.elements, [key]: { ...s.elements[key], ...patch } },
    }))

  const toggleSimple = (key: 'image' | 'icon') =>
    onUpdate((s) => ({
      ...s,
      elements: {
        ...s.elements,
        [key]: { on: !s.elements[key].on },
      },
    }))

  const setListOn = (on: boolean) =>
    onUpdate((s) => ({
      ...s,
      elements: { ...s.elements, list: { ...s.elements.list, on } },
    }))
  const setListItem = (i: number, v: string) =>
    onUpdate((s) => {
      const items = [...s.elements.list.items]
      items[i] = v
      return { ...s, elements: { ...s.elements, list: { ...s.elements.list, items } } }
    })
  const addListItem = () =>
    onUpdate((s) => ({
      ...s,
      elements: {
        ...s.elements,
        list: { on: true, items: [...s.elements.list.items, 'New item'] },
      },
    }))
  const removeListItem = (i: number) =>
    onUpdate((s) => ({
      ...s,
      elements: {
        ...s.elements,
        list: {
          ...s.elements.list,
          items: s.elements.list.items.filter((_, idx) => idx !== i),
        },
      },
    }))

  /* button mutators */
  const setButton = (id: string, text: string) =>
    onUpdate((s) => ({
      ...s,
      elements: {
        ...s.elements,
        buttons: s.elements.buttons.map((b) => (b.id === id ? { ...b, text } : b)),
      },
    }))
  const addButton = () =>
    onUpdate((s) => ({
      ...s,
      elements: {
        ...s.elements,
        buttons: [...s.elements.buttons, { id: uid('btn'), text: 'Button' } as ButtonEl],
      },
    }))
  const removeButton = (id: string) =>
    onUpdate((s) => ({
      ...s,
      elements: {
        ...s.elements,
        buttons: s.elements.buttons.filter((b) => b.id !== id),
      },
    }))

  /* card mutators */
  const setCard = (id: string, patch: Partial<Card>) =>
    onUpdate((s) => ({
      ...s,
      cards: s.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
  const addCard = () =>
    onUpdate((s) => ({ ...s, cards: [...s.cards, newCard(meta.cardLabel)] }))
  const removeCard = (id: string) =>
    onUpdate((s) => ({ ...s, cards: s.cards.filter((c) => c.id !== id) }))
  const moveCard = (from: number, to: number) =>
    onUpdate((s) => {
      if (to < 0 || to >= s.cards.length) return s
      const cards = [...s.cards]
      const [item] = cards.splice(from, 1)
      cards.splice(to, 0, item)
      return { ...s, cards }
    })

  const setHeadingOverride = (v: string) =>
    onUpdate((s) => ({
      ...s,
      headingLevelOverride: v === 'auto' ? null : Number(v),
    }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Edit structure: ${meta.label}`}
        className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-sm border border-border bg-card shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-foreground">
                {meta.label}
              </h2>
              <span
                className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium"
                style={{ color: SOURCE_META[section.source].text }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: SOURCE_META[section.source].dot }}
                />
                {SOURCE_META[section.source].label}
              </span>
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Structure &amp; content only — styling comes from the design system.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {section.type === 'Opaque' ? (
            <OpaqueEditor
              section={section}
              onChange={(html) => onUpdate((s) => ({ ...s, opaqueHtml: html }))}
            />
          ) : (
            <div className="flex flex-col gap-5">
              {/* Heading level — shown for all types except Navbar */}
              {section.type !== 'Navbar' && (
                <div className="flex items-center justify-between rounded-sm border border-border bg-background px-3 py-2.5">
                  <div>
                    <div className="text-[12px] font-medium text-foreground">
                      Heading level
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {section.type === 'Hero' ? 'Hero heading' : 'Section heading'}{' '}
                      {'\u2192'} H{lvl}
                      {section.headingLevelOverride === null
                        ? ` (auto, derived H${derivedHeadingLevel(section.type)})`
                        : ' (overridden)'}
                    </div>
                  </div>
                  <select
                    value={section.headingLevelOverride ?? 'auto'}
                    onChange={(ev) => setHeadingOverride(ev.target.value)}
                    className="rounded-sm border border-input bg-background px-2 py-1 text-[12px] text-foreground outline-none focus:border-primary"
                  >
                    <option value="auto">Auto</option>
                    <option value="1">H1</option>
                    <option value="2">H2</option>
                    <option value="3">H3</option>
                    <option value="4">H4</option>
                  </select>
                </div>
              )}

              {/* Per-type slot editors */}
              {section.type === 'Navbar' && (
                <Group title="Navbar slots">
                  <CheckChip label="Logo" on={e.image.on} onToggle={() => toggleSimple('image')} />
                  <NavLinksEditor
                    links={e.navLinks ?? (e.list.on ? e.list.items : [])}
                    onChange={(links) => onUpdate((s) => ({
                      ...s,
                      elements: { ...s.elements, navLinks: links },
                    }))}
                  />
                  <ButtonsEditor buttons={e.buttons} onAdd={addButton} onChange={setButton} onRemove={removeButton} />
                </Group>
              )}

              {section.type === 'Hero' && (
                <Group title="Hero slots">
                  <ToggleField label="Eyebrow" on={e.eyebrow.on} onToggle={() => setEl('eyebrow', { on: !e.eyebrow.on })} value={e.eyebrow.text} onChange={(v) => setEl('eyebrow', { text: v })} placeholder="Small label above the heading" />
                  <ToggleField label={`Heading (H${lvl})`} on={e.heading.on} onToggle={() => setEl('heading', { on: !e.heading.on })} value={e.heading.text} onChange={(v) => setEl('heading', { text: v })} placeholder="Main heading" />
                  <ToggleField label="Subheading" on={e.subheading.on} onToggle={() => setEl('subheading', { on: !e.subheading.on })} value={e.subheading.text} onChange={(v) => setEl('subheading', { text: v })} placeholder="Supporting subheading" />
                  <ToggleField label="Body" on={e.body.on} onToggle={() => setEl('body', { on: !e.body.on })} value={e.body.text} onChange={(v) => setEl('body', { text: v })} placeholder="Body copy" multiline />
                  <ButtonsEditor buttons={e.buttons} onAdd={addButton} onChange={setButton} onRemove={removeButton} />
                  <CheckChip label="Media" on={e.image.on} onToggle={() => toggleSimple('image')} />
                </Group>
              )}

              {section.type === 'TextMedia' && (
                <Group title="Text + Media slots">
                  <ToggleField label="Eyebrow" on={e.eyebrow.on} onToggle={() => setEl('eyebrow', { on: !e.eyebrow.on })} value={e.eyebrow.text} onChange={(v) => setEl('eyebrow', { text: v })} placeholder="Small label" />
                  <ToggleField label={`Heading (H${lvl})`} on={e.heading.on} onToggle={() => setEl('heading', { on: !e.heading.on })} value={e.heading.text} onChange={(v) => setEl('heading', { text: v })} placeholder="Section heading" />
                  <ToggleField label="Body" on={e.body.on} onToggle={() => setEl('body', { on: !e.body.on })} value={e.body.text} onChange={(v) => setEl('body', { text: v })} placeholder="Body copy" multiline />
                  <CheckChip label="Media" on={e.image.on} onToggle={() => toggleSimple('image')} />
                  <div className="flex items-center justify-between rounded-sm border border-border px-3 py-2">
                    <span className="text-[12px] font-medium text-foreground">Layout</span>
                    <div className="inline-flex rounded-sm border border-border bg-card p-0.5">
                      {(['left', 'right'] as const).map((dir) => (
                        <button
                          key={dir}
                          type="button"
                          onClick={() => onUpdate((s) => ({ ...s, elements: { ...s.elements, layout: dir } }))}
                          className={`rounded-sm px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                            (e.layout ?? 'right') === dir
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Media {dir}
                        </button>
                      ))}
                    </div>
                  </div>
                  <CheckChip label="List" on={e.list.on} onToggle={() => setListOn(!e.list.on)} />
                  {e.list.on && <ListEditor items={e.list.items} onChange={setListItem} onAdd={addListItem} onRemove={removeListItem} />}
                  <ButtonsEditor buttons={e.buttons} onAdd={addButton} onChange={setButton} onRemove={removeButton} />
                </Group>
              )}

              {section.type === 'CTA' && (
                <Group title="CTA slots">
                  <ToggleField label={`Heading (H${lvl})`} on={e.heading.on} onToggle={() => setEl('heading', { on: !e.heading.on })} value={e.heading.text} onChange={(v) => setEl('heading', { text: v })} placeholder="CTA heading" />
                  <ToggleField label="Body" on={e.body.on} onToggle={() => setEl('body', { on: !e.body.on })} value={e.body.text} onChange={(v) => setEl('body', { text: v })} placeholder="Supporting text" multiline />
                  <ButtonsEditor buttons={e.buttons} onAdd={addButton} onChange={setButton} onRemove={removeButton} />
                </Group>
              )}

              {section.type === 'Footer' && (
                <Group title="Footer slots">
                  <CheckChip label="Logo" on={e.image.on} onToggle={() => toggleSimple('image')} />
                  <CheckChip
                    label="Social icons"
                    on={e.social?.on ?? false}
                    onToggle={() => onUpdate((s) => ({
                      ...s,
                      elements: { ...s.elements, social: { on: !(s.elements.social?.on ?? false) } },
                    }))}
                  />
                  <ToggleField
                    label="Legal bar"
                    on={e.legalBar?.on ?? false}
                    onToggle={() => onUpdate((s) => ({
                      ...s,
                      elements: { ...s.elements, legalBar: { on: !(s.elements.legalBar?.on ?? false), text: s.elements.legalBar?.text ?? '' } },
                    }))}
                    value={e.legalBar?.text ?? ''}
                    onChange={(v) => onUpdate((s) => ({
                      ...s,
                      elements: { ...s.elements, legalBar: { on: true, text: v } },
                    }))}
                    placeholder="Copyright / legal text"
                  />
                </Group>
              )}

              {/* Card-based sections: Feature, Testimonial, Pricing, FAQ, Footer */}
              {(section.type === 'Feature' || section.type === 'Testimonial' || section.type === 'Pricing' || section.type === 'FAQ') && (
                <>
                  <Group title="Section header">
                    {(section.type === 'Feature') && (
                      <ToggleField label="Eyebrow" on={e.eyebrow.on} onToggle={() => setEl('eyebrow', { on: !e.eyebrow.on })} value={e.eyebrow.text} onChange={(v) => setEl('eyebrow', { text: v })} placeholder="Small label" />
                    )}
                    <ToggleField label={`Heading (H${lvl})`} on={e.heading.on} onToggle={() => setEl('heading', { on: !e.heading.on })} value={e.heading.text} onChange={(v) => setEl('heading', { text: v })} placeholder="Section heading" />
                    {(section.type === 'Feature' || section.type === 'Testimonial' || section.type === 'Pricing') && (
                      <ToggleField label="Subheading" on={e.subheading.on} onToggle={() => setEl('subheading', { on: !e.subheading.on })} value={e.subheading.text} onChange={(v) => setEl('subheading', { text: v })} placeholder="Supporting subheading" />
                    )}
                  </Group>
                  <Group
                    title={`${meta.cardLabel}s`}
                    action={
                      <button
                        type="button"
                        onClick={addCard}
                        className="inline-flex items-center gap-1 rounded-sm border border-border bg-card px-1.5 py-0.5 text-[11px] font-medium text-foreground hover:border-foreground/30"
                      >
                        <Plus className="size-3" />
                        Add {meta.cardLabel.toLowerCase()}
                      </button>
                    }
                  >
                    <div className="flex flex-col gap-2">
                      {section.cards.map((c, i) => (
                        <CardRow
                          key={c.id}
                          card={c}
                          index={i}
                          total={section.cards.length}
                          onChange={(patch) => setCard(c.id, patch)}
                          onRemove={() => removeCard(c.id)}
                          onMove={(dir) => moveCard(i, i + dir)}
                        />
                      ))}
                    </div>
                  </Group>
                </>
              )}

              {/* Footer columns */}
              {section.type === 'Footer' && meta.hasCards && (
                <Group
                  title="Footer columns"
                  action={
                    <button
                      type="button"
                      onClick={addCard}
                      className="inline-flex items-center gap-1 rounded-sm border border-border bg-card px-1.5 py-0.5 text-[11px] font-medium text-foreground hover:border-foreground/30"
                    >
                      <Plus className="size-3" />
                      Add column
                    </button>
                  }
                >
                  <div className="flex flex-col gap-2">
                    {section.cards.map((c, i) => (
                      <CardRow
                        key={c.id}
                        card={c}
                        index={i}
                        total={section.cards.length}
                        onChange={(patch) => setCard(c.id, patch)}
                        onRemove={() => removeCard(c.id)}
                        onMove={(dir) => moveCard(i, i + dir)}
                      />
                    ))}
                  </div>
                </Group>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm bg-primary px-3.5 py-1.5 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function NavLinksEditor({ links, onChange }: { links: string[]; onChange: (links: string[]) => void }) {
  return (
    <div className="rounded-sm border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
        <span className="text-[12px] font-medium text-foreground">Navigation links</span>
        <button
          type="button"
          onClick={() => onChange([...links, 'Link'])}
          className="inline-flex items-center gap-1 rounded-sm border border-border bg-card px-1.5 py-0.5 text-[11px] font-medium text-foreground hover:border-foreground/30"
        >
          <Plus className="size-3" />
          Add
        </button>
      </div>
      <div className="flex flex-col gap-2 p-3">
        {links.length === 0 && <p className="text-[11px] italic text-muted-foreground">No links.</p>}
        {links.map((link, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={link}
              onChange={(ev) => {
                const next = [...links]
                next[i] = ev.target.value
                onChange(next)
              }}
              className="min-w-0 flex-1 rounded-sm border border-input bg-background px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:border-primary"
              placeholder="Link label"
            />
            <button
              type="button"
              aria-label="Remove link"
              onClick={() => onChange(links.filter((_, idx) => idx !== i))}
              className="flex size-7 items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-[#d63638]"
            >
              <Trash className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function ButtonsEditor({
  buttons,
  onAdd,
  onChange,
  onRemove,
}: {
  buttons: ButtonEl[]
  onAdd: () => void
  onChange: (id: string, text: string) => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="rounded-sm border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
        <span className="text-[12px] font-medium text-foreground">Buttons / CTAs</span>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-sm border border-border bg-card px-1.5 py-0.5 text-[11px] font-medium text-foreground hover:border-foreground/30"
        >
          <Plus className="size-3" />
          Add
        </button>
      </div>
      <div className="flex flex-col gap-2 p-3">
        {buttons.length === 0 && <p className="text-[11px] italic text-muted-foreground">No buttons.</p>}
        {buttons.map((b) => (
          <div key={b.id} className="flex items-center gap-2">
            <input
              value={b.text}
              onChange={(ev) => onChange(b.id, ev.target.value)}
              className="min-w-0 flex-1 rounded-sm border border-input bg-background px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:border-primary"
              placeholder="Button label"
            />
            <button
              type="button"
              aria-label="Remove button"
              onClick={() => onRemove(b.id)}
              className="flex size-7 items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-[#d63638]"
            >
              <Trash className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function ListEditor({
  items,
  onChange,
  onAdd,
  onRemove,
}: {
  items: string[]
  onChange: (i: number, v: string) => void
  onAdd: () => void
  onRemove: (i: number) => void
}) {
  return (
    <div className="rounded-sm border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
        <span className="text-[12px] font-medium text-foreground">List items</span>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-sm border border-border bg-card px-1.5 py-0.5 text-[11px] font-medium text-foreground hover:border-foreground/30"
        >
          <Plus className="size-3" />
          Add
        </button>
      </div>
      <div className="flex flex-col gap-2 p-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={item}
              onChange={(ev) => onChange(i, ev.target.value)}
              className="min-w-0 flex-1 rounded-sm border border-input bg-background px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:border-primary"
            />
            <button
              type="button"
              aria-label="Remove item"
              onClick={() => onRemove(i)}
              className="flex size-7 items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-[#d63638]"
            >
              <Trash className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function Group({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function ToggleField({
  label,
  on,
  onToggle,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string
  on: boolean
  onToggle: () => void
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
}) {
  return (
    <div className="rounded-sm border border-border">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[12px] font-medium text-foreground">{label}</span>
        <CheckChip label={on ? 'On' : 'Off'} on={on} onToggle={onToggle} />
      </div>
      {on &&
        (multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            placeholder={placeholder}
            className="block w-full resize-none border-t border-border bg-background px-3 py-2 text-[13px] leading-relaxed text-foreground outline-none focus:border-primary"
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="block w-full border-t border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none focus:border-primary"
          />
        ))}
    </div>
  )
}

function CheckChip({
  label,
  on,
  onToggle,
}: {
  label: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium transition-colors ${
        on
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-background text-muted-foreground hover:text-foreground'
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${on ? 'bg-primary' : 'bg-muted-foreground/50'}`}
      />
      {label}
    </button>
  )
}

function CardRow({
  card,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  card: Card
  index: number
  total: number
  onChange: (patch: Partial<Card>) => void
  onRemove: () => void
  onMove: (dir: number) => void
}) {
  return (
    <div className="rounded-sm border border-border bg-background p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* media variant segmented */}
          <div className="inline-flex rounded-sm border border-border bg-card p-0.5">
            {CARD_MEDIA.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onChange({ media: m })}
                aria-pressed={card.media === m}
                className={`rounded-sm px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  card.media === m
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Move up"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="flex size-6 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            {'\u2191'}
          </button>
          <button
            type="button"
            aria-label="Move down"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            className="flex size-6 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            {'\u2193'}
          </button>
          <button
            type="button"
            aria-label="Remove card"
            onClick={onRemove}
            className="flex size-6 items-center justify-center rounded-sm text-muted-foreground hover:text-[#d63638]"
          >
            <Trash className="size-3.5" />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <input
          value={card.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Title"
          className="w-full rounded-sm border border-input bg-card px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:border-primary"
        />
        <input
          value={card.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Text (optional)"
          className="w-full rounded-sm border border-input bg-card px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:border-primary"
        />
        <input
          value={card.link}
          onChange={(e) => onChange({ link: e.target.value })}
          placeholder="Link / CTA label (optional)"
          className="w-full rounded-sm border border-input bg-card px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:border-primary"
        />
      </div>
    </div>
  )
}

function OpaqueEditor({
  section,
  onChange,
}: {
  section: Section
  onChange: (html: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-sm border border-dashed border-border bg-muted/40 px-3 py-2.5">
        <p className="text-[12px] text-foreground">
          This is an <strong>opaque / custom</strong> section. Its original
          markup is preserved and rendered as-is. In-tool editing is limited to
          the raw HTML below.
        </p>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Preserved markup
        </span>
        <textarea
          value={section.opaqueHtml ?? ''}
          onChange={(e) => onChange(e.target.value)}
          rows={10}
          spellCheck={false}
          className="w-full resize-none rounded-sm border border-input bg-background px-3 py-2 font-mono text-[12px] leading-relaxed text-foreground outline-none focus:border-primary"
        />
      </label>
    </div>
  )
}
