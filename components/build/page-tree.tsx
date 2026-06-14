'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Plus,
  Layers,
  X,
} from '@/components/icons'
import {
  SOURCE_META,
  sectionLabel,
  type Page,
  type Section,
} from '@/lib/sitemap'

type Props = {
  pages: Page[]
  activePageId: string
  selectedSectionId: string | null
  onSelectPage: (id: string) => void
  onSelectSection: (pageId: string, sectionId: string) => void
  onAddPage: (parentId: string | null) => void
  onRemovePage: (id: string) => void
  onRenamePage: (id: string, name: string) => void
  onReorderPages: (parentId: string | null, from: number, to: number) => void
  onRemoveSection: (pageId: string, sectionId: string) => void
  onCollapse: () => void
}

export function PageTree({
  pages,
  activePageId,
  selectedSectionId,
  onSelectPage,
  onSelectSection,
  onAddPage,
  onRemovePage,
  onRenamePage,
  onReorderPages,
  onRemoveSection,
  onCollapse,
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(pages.map((p) => [p.id, p.parentId === null])),
  )
  const toggle = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  const allCollapsed = pages.every((p) => !expanded[p.id])
  const toggleAll = () =>
    setExpanded(
      Object.fromEntries(pages.map((p) => [p.id, allCollapsed])),
    )

  const roots = pages.filter((p) => p.parentId === null)
  const childrenOf = (id: string) => pages.filter((p) => p.parentId === id)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 pb-2.5 pt-3.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Pages
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onAddPage(null)}
            className="inline-flex items-center gap-1 rounded-sm border border-border bg-card px-1.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-foreground/30"
          >
            <Plus className="size-3" />
            Page
          </button>
          <button
            type="button"
            onClick={toggleAll}
            aria-label={allCollapsed ? 'Expand all pages' : 'Collapse all pages'}
            title={allCollapsed ? 'Expand all pages' : 'Collapse all pages'}
            className="flex size-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {allCollapsed ? (
              <ChevronsUpDown className="size-4" />
            ) : (
              <ChevronsDownUp className="size-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse panel"
            className="flex size-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="size-4 rotate-180" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1.5 pb-4">
        <ul className="flex flex-col gap-0.5">
          {roots.map((page, index) => (
            <PageNode
              key={page.id}
              page={page}
              depth={0}
              index={index}
              siblingCount={roots.length}
              children={childrenOf(page.id)}
              childrenOf={childrenOf}
              expanded={expanded}
              toggle={toggle}
              activePageId={activePageId}
              selectedSectionId={selectedSectionId}
              pageCount={pages.length}
              onSelectPage={onSelectPage}
              onSelectSection={onSelectSection}
              onAddPage={onAddPage}
              onRemovePage={onRemovePage}
              onRenamePage={onRenamePage}
              onReorderPages={onReorderPages}
              onRemoveSection={onRemoveSection}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}

type NodeProps = {
  page: Page
  depth: number
  index: number
  siblingCount: number
  children: Page[]
  childrenOf: (id: string) => Page[]
  expanded: Record<string, boolean>
  toggle: (id: string) => void
  activePageId: string
  selectedSectionId: string | null
  pageCount: number
  onSelectPage: (id: string) => void
  onSelectSection: (pageId: string, sectionId: string) => void
  onAddPage: (parentId: string | null) => void
  onRemovePage: (id: string) => void
  onRenamePage: (id: string, name: string) => void
  onReorderPages: (parentId: string | null, from: number, to: number) => void
  onRemoveSection: (pageId: string, sectionId: string) => void
}

function PageNode(props: NodeProps) {
  const {
    page,
    depth,
    index,
    children,
    childrenOf,
    expanded,
    toggle,
    activePageId,
    selectedSectionId,
    pageCount,
    onSelectPage,
    onSelectSection,
    onAddPage,
    onRemovePage,
    onRenamePage,
    onReorderPages,
    onRemoveSection,
  } = props
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(page.name)
  const [dragOver, setDragOver] = useState(false)

  const isActive = page.id === activePageId
  const isOpen = expanded[page.id]
  const hasKids = children.length > 0

  const commit = () => {
    const v = draft.trim()
    if (v) onRenamePage(page.id, v)
    else setDraft(page.name)
    setEditing(false)
  }

  return (
    <li>
      <div
        draggable={!editing}
        onDragStart={(e) =>
          e.dataTransfer.setData('text/page', String(index))
        }
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const from = Number(e.dataTransfer.getData('text/page'))
          if (!Number.isNaN(from) && from !== index)
            onReorderPages(page.parentId, from, index)
        }}
        style={{ paddingLeft: depth * 12 }}
        className={`group flex items-center gap-1 rounded-sm border px-1.5 py-1.5 ${
          isActive
            ? 'border-primary/30 bg-primary/5'
            : 'border-transparent hover:bg-muted'
        } ${dragOver ? 'border-t-2 border-t-primary' : ''}`}
      >
        <button
          type="button"
          aria-label={isOpen ? 'Collapse' : 'Expand'}
          onClick={() => toggle(page.id)}
          className="flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
        >
          {isOpen ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </button>

        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                setDraft(page.name)
                setEditing(false)
              }
            }}
            className="min-w-0 flex-1 rounded-sm border border-primary bg-background px-1.5 py-0.5 text-[13px] text-foreground outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => onSelectPage(page.id)}
            onDoubleClick={() => {
              setDraft(page.name)
              setEditing(true)
            }}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <Layers
              className={`size-3.5 shrink-0 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-foreground">
                {page.name}
              </span>
              <span className="block truncate text-[11px] tabular-nums text-muted-foreground">
                {page.slug}
              </span>
            </span>
            <span className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
              {page.sections.length}
            </span>
          </button>
        )}

        {!editing && (
          <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              aria-label={`Add child page under ${page.name}`}
              title="Add child page"
              onClick={() => {
                onAddPage(page.id)
                if (!expanded[page.id]) toggle(page.id)
              }}
              className="flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
            >
              <Plus className="size-3.5" />
            </button>
            {pageCount > 1 && (
              <button
                type="button"
                aria-label={`Remove ${page.name}`}
                onClick={() => onRemovePage(page.id)}
                className="flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:text-[#d63638]"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {isOpen && (
        <>
          {page.sections.length > 0 && (
            <ul
              className="mt-0.5 flex flex-col gap-0.5 border-l border-border pl-2"
              style={{ marginLeft: 12 + depth * 12 }}
            >
              {page.sections.map((section) => (
                <SectionRow
                  key={section.id}
                  section={section}
                  selected={isActive && section.id === selectedSectionId}
                  onSelect={() => onSelectSection(page.id, section.id)}
                  onRemove={() => onRemoveSection(page.id, section.id)}
                />
              ))}
            </ul>
          )}
          {hasKids && (
            <ul className="mt-0.5 flex flex-col gap-0.5">
              {children.map((child, i) => (
                <PageNode
                  {...props}
                  key={child.id}
                  page={child}
                  depth={depth + 1}
                  index={i}
                  siblingCount={children.length}
                  children={childrenOf(child.id)}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </li>
  )
}

function SectionRow({
  section,
  selected,
  onSelect,
  onRemove,
}: {
  section: Section
  selected: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  const meta = SOURCE_META[section.source]
  return (
    <li>
      <div
        className={`group flex items-center gap-2 rounded-sm border px-2 py-1.5 ${
          selected
            ? 'border-primary/30 bg-primary/5'
            : 'border-transparent hover:bg-muted'
        }`}
      >
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: meta.dot }}
          />
          <span className="min-w-0 flex-1 truncate text-[12px] text-foreground">
            {sectionLabel(section)}
          </span>
        </button>
        <button
          type="button"
          aria-label={`Remove ${sectionLabel(section)}`}
          onClick={onRemove}
          className="flex size-5 items-center justify-center rounded-sm text-muted-foreground opacity-0 transition-opacity hover:text-[#d63638] group-hover:opacity-100"
        >
          <X className="size-3" />
        </button>
      </div>
    </li>
  )
}
