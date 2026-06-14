'use client'

import { useState } from 'react'
import { X, Settings, Layers } from '@/components/icons'
import { AddSectionDivider } from '@/components/build/section-inserter'
import {
  SOURCE_META,
  elementSummary,
  sectionLabel,
  headingNote,
  type Page,
  type Section,
  type SectionType,
} from '@/lib/sitemap'

type Props = {
  page: Page
  selectedSectionId: string | null
  onSelectSection: (id: string) => void
  onReorder: (from: number, to: number) => void
  onRemove: (id: string) => void
  onAdd: (index: number, type: SectionType) => void
  onEditStructure: (id: string) => void
}

export function SitemapView({
  page,
  selectedSectionId,
  onSelectSection,
  onReorder,
  onRemove,
  onAdd,
  onEditStructure,
}: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [addAt, setAddAt] = useState<number | null>(null)

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-2 py-2">
      <AddSectionDivider
        open={addAt === 0}
        onToggle={() => setAddAt(addAt === 0 ? null : 0)}
        onPick={(t) => {
          onAdd(0, t)
          setAddAt(null)
        }}
      />
      {page.sections.map((section, index) => (
        <div key={section.id} className="flex flex-col gap-2">
          <StructuralBox
            section={section}
            selected={section.id === selectedSectionId}
            isOver={overIndex === index && dragIndex !== index}
            onSelect={() => onSelectSection(section.id)}
            onEdit={() => onEditStructure(section.id)}
            onRemove={() => onRemove(section.id)}
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
          />
        </div>
      ))}
      {page.sections.length === 0 && (
        <p className="py-8 text-center text-[13px] italic text-muted-foreground">
          This page has no sections yet. Add one above.
        </p>
      )}
    </div>
  )
}

function StructuralBox({
  section,
  selected,
  isOver,
  onSelect,
  onEdit,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  section: Section
  selected: boolean
  isOver: boolean
  onSelect: () => void
  onEdit: () => void
  onRemove: () => void
  onDragStart: () => void
  onDragOver: () => void
  onDrop: () => void
  onDragEnd: () => void
}) {
  const meta = SOURCE_META[section.source]
  const summary = elementSummary(section)
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
      onDoubleClick={onEdit}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onEdit()
        }
      }}
      className={`group cursor-pointer rounded-sm border bg-card transition-shadow ${
        selected
          ? 'border-primary ring-1 ring-primary'
          : 'border-border hover:border-foreground/30'
      } ${isOver ? 'ring-2 ring-primary' : ''}`}
    >
      {/* header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <DragDots />
          <Layers className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-[12px] font-semibold text-foreground">
            {sectionLabel(section)}
          </span>
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-medium"
            style={{ color: meta.text }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: meta.dot }}
            />
            {meta.label}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-1.5 py-1 text-[11px] font-medium text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
          >
            <Settings className="size-3" />
            Edit structure
          </button>
          <button
            type="button"
            aria-label={`Remove ${sectionLabel(section)}`}
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="flex size-6 items-center justify-center rounded-sm text-muted-foreground opacity-0 transition-opacity hover:text-[#d63638] group-hover:opacity-100"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* structural body */}
      <div className="flex flex-col gap-2 px-3 py-2.5">
        <div className="text-[11px] text-muted-foreground">
          {headingNote(section)}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {summary.map((s) => (
            <span
              key={s}
              className="rounded-sm border border-dashed border-border bg-muted/40 px-1.5 py-0.5 text-[11px] text-foreground"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function DragDots() {
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 grid-cols-2 gap-0.5 text-muted-foreground"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="size-0.5 rounded-full bg-current" />
      ))}
    </span>
  )
}
