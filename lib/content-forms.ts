'use client'

import { useSyncExternalStore, useEffect } from 'react'
import { DEFAULT_PAGES, sectionLabel } from '@/lib/sitemap'
import { collectableSections, sectionContentFields } from '@/lib/client-portal'
import { supabase } from '@/lib/supabase'

/* =========================================================================
 * Content forms — the agency-side, Content-Snare-style content collection
 * builder. Structure-aware (sitemap sections flow in) and template-driven
 * (site-type templates pre-load the sections that type of site needs).
 *
 * This app has no backend; canonical data lives in module-level seeds. This
 * store follows the same pattern as lib/mockups.ts with a tiny subscribe
 * layer so the builder is reactive and custom templates persist per session.
 * ========================================================================= */

export type FieldType =
  | 'short'
  | 'long'
  | 'select'
  | 'multiselect'
  | 'url'
  | 'number'
  | 'date'
  | 'file'
  | 'group'

export const FIELD_TYPE_META: Record<
  FieldType,
  { label: string; blurb: string }
> = {
  short: { label: 'Short text', blurb: 'A single line — names, titles, short copy.' },
  long: { label: 'Long / rich text', blurb: 'A paragraph or more of copy.' },
  select: { label: 'Select', blurb: 'Pick one from a list of options.' },
  multiselect: { label: 'Multi-select', blurb: 'Pick several from a list.' },
  url: { label: 'URL', blurb: 'A web address or link.' },
  number: { label: 'Number', blurb: 'A numeric value — price, quantity.' },
  date: { label: 'Date', blurb: 'A calendar date.' },
  file: { label: 'Image / file', blurb: 'Upload — lands in the asset hub.' },
  group: { label: 'Repeatable group', blurb: 'A set of fields repeated many times.' },
}

export type FormField = {
  id: string
  type: FieldType
  label: string
  required: boolean
  /** Helper text / example shown under the field. */
  help: string
  /** Options for select / multiselect. */
  options?: string[]
  /** Sub-fields for a repeatable group. */
  fields?: FormField[]
}

export type SectionOrigin = 'page' | 'site-type' | 'custom'
export type SectionStatus = 'outstanding' | 'submitted'

export type FormSection = {
  id: string
  title: string
  description: string
  origin: SectionOrigin
  status: SectionStatus
  /** For page-derived sections: where submitted content flows back to. */
  mappedPageId?: string | null
  mappedSectionId?: string | null
  fields: FormField[]
}

export type SiteType =
  | 'static'
  | 'woocommerce'
  | 'local'
  | 'blog'
  | 'portfolio'

export const SITE_TYPE_META: Record<
  SiteType,
  { label: string; blurb: string }
> = {
  static: {
    label: 'Static / Brochure',
    blurb: 'Marketing pages — home, about, services, contact.',
  },
  woocommerce: {
    label: 'WooCommerce',
    blurb: 'Online store — products, categories, shipping, payments.',
  },
  local: {
    label: 'Local Business',
    blurb: 'Hours, locations, services, and NAP details.',
  },
  blog: {
    label: 'Blog / Content',
    blurb: 'Editorial site — authors, categories, posts.',
  },
  portfolio: {
    label: 'Portfolio',
    blurb: 'Showcase work — projects, bio, services.',
  },
}

export type FormTemplate = {
  id: string
  name: string
  siteType: SiteType
  description: string
  builtIn: boolean
  /** Section blueprints (ids are regenerated when the template is applied). */
  sections: FormSection[]
}

/* ---------- id helper ---------- */

let seq = 0
function uid(prefix: string): string {
  seq += 1
  return `${prefix}-${Date.now().toString(36)}-${seq}`
}

/* ---------- field builders ---------- */

function field(
  type: FieldType,
  label: string,
  opts: Partial<Omit<FormField, 'id' | 'type' | 'label'>> = {},
): FormField {
  return {
    id: uid('fld'),
    type,
    label,
    required: opts.required ?? false,
    help: opts.help ?? '',
    options: opts.options,
    fields: opts.fields,
  }
}

function section(
  title: string,
  origin: SectionOrigin,
  fields: FormField[],
  description = '',
): FormSection {
  return {
    id: uid('sec'),
    title,
    description,
    origin,
    status: 'outstanding',
    fields,
  }
}

/* ---------- structure-aware seeding ---------- */

/**
 * Convert the project's sitemap sections into form sections so the agency
 * collects content for the pages they're actually building. Submitted copy
 * maps back to the wireframe slot via mappedPageId / mappedSectionId.
 */
export function structureSections(): FormSection[] {
  const out: FormSection[] = []
  for (const page of DEFAULT_PAGES) {
    for (const sec of collectableSections(page)) {
      const label = sectionLabel(sec)
      const fields = sectionContentFields(sec).map((f) =>
        field(f.kind === 'long' ? 'long' : 'short', f.label, {
          help: f.draft ? `Draft: ${truncate(f.draft, 80)}` : '',
        }),
      )
      if (fields.length === 0) continue
      out.push({
        id: uid('sec'),
        title: `${page.name} · ${label}`,
        description: `Content for the ${label} section on ${page.name}.`,
        origin: 'page',
        status: 'outstanding',
        mappedPageId: page.id,
        mappedSectionId: sec.id,
        fields,
      })
    }
  }
  return out
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s
}

/* ---------- site-type template blueprints ---------- */

function siteTypeSections(type: SiteType): FormSection[] {
  switch (type) {
    case 'woocommerce':
      return [
        section(
          'Products',
          'site-type',
          [
            field('group', 'Product', {
              required: true,
              help: 'Add each product you want to launch with.',
              fields: [
                field('short', 'Product name', { required: true }),
                field('number', 'Price', { required: true }),
                field('short', 'SKU'),
                field('long', 'Description'),
                field('file', 'Product images', { help: 'Uploads land in the asset hub.' }),
              ],
            }),
          ],
          'The catalog of products for your store.',
        ),
        section(
          'Categories',
          'site-type',
          [
            field('group', 'Category', {
              fields: [
                field('short', 'Category name', { required: true }),
                field('long', 'Description'),
              ],
            }),
          ],
          'How products are organized.',
        ),
        section(
          'Shipping & returns',
          'site-type',
          [
            field('long', 'Shipping policy', { required: true }),
            field('long', 'Returns & refunds policy', { required: true }),
            field('multiselect', 'Regions you ship to', {
              options: ['Domestic', 'North America', 'Europe', 'Worldwide'],
            }),
          ],
          'Fulfillment details shown at checkout.',
        ),
        section(
          'Payment info',
          'site-type',
          [
            field('multiselect', 'Accepted payment methods', {
              options: ['Credit card', 'PayPal', 'Apple Pay', 'Google Pay', 'Bank transfer'],
            }),
            field('short', 'Currency', { help: 'e.g. USD, EUR' }),
            field('short', 'Tax / VAT number'),
          ],
          'How customers pay.',
        ),
      ]
    case 'local':
      return [
        section(
          'Business details (NAP)',
          'site-type',
          [
            field('short', 'Business name', { required: true }),
            field('short', 'Primary address', { required: true }),
            field('short', 'Primary phone', { required: true }),
            field('url', 'Website'),
          ],
          'Name, address, phone — kept consistent across the web.',
        ),
        section(
          'Hours',
          'site-type',
          [
            field('long', 'Opening hours', {
              required: true,
              help: 'e.g. Mon–Fri 9–5, Sat 10–2, Sun closed.',
            }),
            field('short', 'Holiday / seasonal notes'),
          ],
          'When you’re open.',
        ),
        section(
          'Locations',
          'site-type',
          [
            field('group', 'Location', {
              fields: [
                field('short', 'Location name', { required: true }),
                field('short', 'Address', { required: true }),
                field('short', 'Phone'),
                field('short', 'Hours'),
              ],
            }),
          ],
          'Each storefront or service area.',
        ),
        section(
          'Services',
          'site-type',
          [
            field('group', 'Service', {
              fields: [
                field('short', 'Service name', { required: true }),
                field('long', 'Description'),
                field('short', 'Starting price'),
              ],
            }),
          ],
          'What you offer.',
        ),
      ]
    case 'blog':
      return [
        section(
          'Authors',
          'site-type',
          [
            field('group', 'Author', {
              fields: [
                field('short', 'Name', { required: true }),
                field('long', 'Bio'),
                field('file', 'Headshot', { help: 'Uploads land in the asset hub.' }),
                field('url', 'Social link'),
              ],
            }),
          ],
          'The people writing for the site.',
        ),
        section(
          'Categories',
          'site-type',
          [
            field('multiselect', 'Content categories', {
              help: 'Add the topics you’ll publish under.',
              options: ['News', 'Guides', 'Opinion', 'Interviews', 'Case studies'],
            }),
          ],
          'How posts are grouped.',
        ),
        section(
          'Launch posts',
          'site-type',
          [
            field('group', 'Post', {
              fields: [
                field('short', 'Title', { required: true }),
                field('long', 'Excerpt'),
                field('long', 'Body'),
                field('date', 'Publish date'),
              ],
            }),
          ],
          'Posts to seed the blog at launch.',
        ),
      ]
    case 'portfolio':
      return [
        section(
          'Projects',
          'site-type',
          [
            field('group', 'Project', {
              required: true,
              fields: [
                field('short', 'Project title', { required: true }),
                field('short', 'Client'),
                field('number', 'Year'),
                field('long', 'Summary'),
                field('file', 'Project images', { help: 'Uploads land in the asset hub.' }),
                field('url', 'Live link'),
              ],
            }),
          ],
          'The work you want to showcase.',
        ),
        section(
          'About / Bio',
          'site-type',
          [
            field('long', 'Bio', { required: true }),
            field('file', 'Portrait', { help: 'Uploads land in the asset hub.' }),
          ],
          'Your story.',
        ),
        section(
          'Services',
          'site-type',
          [
            field('multiselect', 'Services offered', {
              options: ['Branding', 'Web design', 'Photography', 'Illustration', 'Strategy'],
            }),
          ],
          'What clients can hire you for.',
        ),
      ]
    case 'static':
    default:
      return [
        section(
          'Business basics',
          'site-type',
          [
            field('short', 'Business name', { required: true }),
            field('long', 'One-line description', {
              required: true,
              help: 'How you’d describe the business in a sentence.',
            }),
            field('short', 'Contact email'),
            field('short', 'Contact phone'),
          ],
          'Core details used across the site.',
        ),
      ]
  }
}

/* ---------- built-in templates ---------- */

export function buildTemplate(type: SiteType): FormTemplate {
  return {
    id: `builtin-${type}`,
    name: SITE_TYPE_META[type].label,
    siteType: type,
    description: SITE_TYPE_META[type].blurb,
    builtIn: true,
    sections: siteTypeSections(type),
  }
}

export const BUILT_IN_TEMPLATES: FormTemplate[] = (
  Object.keys(SITE_TYPE_META) as SiteType[]
).map(buildTemplate)

/* =========================================================================
 * Store
 * ========================================================================= */

export type ContentForm = {
  templateId: string | null
  siteType: SiteType
  includesStructure: boolean
  sections: FormSection[]
  sent: boolean
  sentAt?: number
}

let currentForm: ContentForm | null = null
let currentFormDbId: string | null = null
let currentProjectId: string | null = null
let customTemplates: FormTemplate[] = []
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getForm() {
  return currentForm
}
function getTemplates() {
  return customTemplates
}
const SERVER_FORM = null
const SERVER_TEMPLATES: FormTemplate[] = []

/* ---------- DB persistence ---------- */

let saveTimer: ReturnType<typeof setTimeout> | null = null

function debounceSave() {
  if (!currentForm || !currentFormDbId) return
  if (saveTimer) clearTimeout(saveTimer)
  const id = currentFormDbId
  const form = currentForm
  saveTimer = setTimeout(() => {
    supabase
      .from('content_forms')
      .update({
        sections: form.sections as unknown as Record<string, unknown>[],
        sent: form.sent,
        sent_at: form.sentAt ? new Date(form.sentAt).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .then()
  }, 800)
}

/** Load an existing content form from DB, or return null. */
export async function loadForm(projectId: string): Promise<ContentForm | null> {
  const { data } = await supabase
    .from('content_forms')
    .select('id, template_id, site_type, includes_structure, sections, sent, sent_at')
    .eq('project_id', projectId)
    .eq('kind', 'content')
    .limit(1)
    .maybeSingle()

  if (!data) return null

  currentFormDbId = data.id
  currentProjectId = projectId
  const form: ContentForm = {
    templateId: data.template_id,
    siteType: (data.site_type as SiteType) ?? 'static',
    includesStructure: data.includes_structure ?? true,
    sections: (data.sections as FormSection[]) ?? [],
    sent: data.sent ?? false,
    sentAt: data.sent_at ? new Date(data.sent_at).getTime() : undefined,
  }
  currentForm = form
  emit()
  return form
}

/** Load custom templates for an account from DB. */
export async function loadCustomTemplates(accountId: string): Promise<FormTemplate[]> {
  const { data } = await supabase
    .from('form_templates')
    .select('id, name, site_type, description, sections')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false })

  if (data) {
    customTemplates = data.map((t: any) => ({
      id: t.id,
      name: t.name,
      siteType: t.site_type as SiteType,
      description: t.description ?? '',
      builtIn: false,
      sections: (t.sections as FormSection[]) ?? [],
    }))
    emit()
  }
  return customTemplates
}

/** Deep-clone a section list, regenerating every id so applied templates are independent. */
function cloneSections(sections: FormSection[]): FormSection[] {
  return sections.map((s) => ({
    ...s,
    id: uid('sec'),
    status: 'outstanding',
    fields: cloneFields(s.fields),
  }))
}
function cloneFields(fields: FormField[]): FormField[] {
  return fields.map((f) => ({
    ...f,
    id: uid('fld'),
    options: f.options ? [...f.options] : undefined,
    fields: f.fields ? cloneFields(f.fields) : undefined,
  }))
}

/* ---------- mutations ---------- */

export async function startForm(
  template: FormTemplate,
  includeStructure: boolean,
  projectId?: string,
) {
  const structure = includeStructure ? structureSections() : []
  currentForm = {
    templateId: template.id,
    siteType: template.siteType,
    includesStructure: includeStructure,
    sections: [...structure, ...cloneSections(template.sections)],
    sent: false,
  }
  emit()

  if (projectId) {
    currentProjectId = projectId
    // Check if form already exists for this project
    const { data: existing } = await supabase
      .from('content_forms')
      .select('id')
      .eq('project_id', projectId)
      .eq('kind', 'content')
      .maybeSingle()

    if (existing) {
      // Update existing
      currentFormDbId = existing.id
      await supabase
        .from('content_forms')
        .update({
          template_id: template.id,
          site_type: template.siteType,
          includes_structure: includeStructure,
          sections: currentForm.sections as unknown as Record<string, unknown>[],
          sent: false,
          sent_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      // Insert new
      const { data } = await supabase
        .from('content_forms')
        .insert({
          project_id: projectId,
          kind: 'content',
          template_id: template.id,
          site_type: template.siteType,
          includes_structure: includeStructure,
          sections: currentForm.sections as unknown as Record<string, unknown>[],
          sent: false,
        })
        .select('id')
        .single()
      if (data) {
        currentFormDbId = data.id
      }
    }
  }
}

export function resetForm() {
  currentForm = null
  emit()
}

function mutate(fn: (form: ContentForm) => ContentForm) {
  if (!currentForm) return
  currentForm = fn(currentForm)
  emit()
  debounceSave()
}

export function addSection() {
  mutate((f) => ({
    ...f,
    sections: [
      ...f.sections,
      section('Untitled section', 'custom', [field('short', 'New field')]),
    ],
  }))
}

export function updateSection(id: string, patch: Partial<FormSection>) {
  mutate((f) => ({
    ...f,
    sections: f.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  }))
}

export function removeSection(id: string) {
  mutate((f) => ({ ...f, sections: f.sections.filter((s) => s.id !== id) }))
}

export function moveSection(id: string, dir: -1 | 1) {
  mutate((f) => {
    const i = f.sections.findIndex((s) => s.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= f.sections.length) return f
    const next = [...f.sections]
    ;[next[i], next[j]] = [next[j], next[i]]
    return { ...f, sections: next }
  })
}

export function setSectionStatus(id: string, status: SectionStatus) {
  updateSection(id, { status })
}

export function addField(sectionId: string, type: FieldType) {
  mutate((f) => ({
    ...f,
    sections: f.sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            fields: [
              ...s.fields,
              field(type, defaultLabel(type), {
                fields: type === 'group' ? [field('short', 'Field')] : undefined,
                options:
                  type === 'select' || type === 'multiselect'
                    ? ['Option 1', 'Option 2']
                    : undefined,
              }),
            ],
          }
        : s,
    ),
  }))
}

export function updateField(
  sectionId: string,
  fieldId: string,
  patch: Partial<FormField>,
) {
  mutate((f) => ({
    ...f,
    sections: f.sections.map((s) =>
      s.id === sectionId
        ? { ...s, fields: s.fields.map((fl) => (fl.id === fieldId ? { ...fl, ...patch } : fl)) }
        : s,
    ),
  }))
}

export function removeField(sectionId: string, fieldId: string) {
  mutate((f) => ({
    ...f,
    sections: f.sections.map((s) =>
      s.id === sectionId ? { ...s, fields: s.fields.filter((fl) => fl.id !== fieldId) } : s,
    ),
  }))
}

export function moveField(sectionId: string, fieldId: string, dir: -1 | 1) {
  mutate((f) => ({
    ...f,
    sections: f.sections.map((s) => {
      if (s.id !== sectionId) return s
      const i = s.fields.findIndex((fl) => fl.id === fieldId)
      const j = i + dir
      if (i < 0 || j < 0 || j >= s.fields.length) return s
      const next = [...s.fields]
      ;[next[i], next[j]] = [next[j], next[i]]
      return { ...s, fields: next }
    }),
  }))
}

export function sendToClient() {
  mutate((f) => ({ ...f, sent: true, sentAt: Date.now() }))
}

function defaultLabel(type: FieldType): string {
  return FIELD_TYPE_META[type].label
}

export async function saveAsTemplate(name: string, accountId?: string) {
  if (!currentForm) return
  const sections = cloneSections(currentForm.sections.filter((s) => s.origin !== 'page'))
  const tpl: FormTemplate = {
    id: uid('tpl'),
    name: name.trim() || 'Custom template',
    siteType: currentForm.siteType,
    description: 'Custom template',
    builtIn: false,
    sections,
  }

  if (accountId) {
    const { data } = await supabase
      .from('form_templates')
      .insert({
        account_id: accountId,
        name: tpl.name,
        site_type: tpl.siteType,
        description: tpl.description,
        sections: sections as unknown as Record<string, unknown>[],
      })
      .select('id')
      .single()
    if (data) {
      tpl.id = data.id
    }
  }

  customTemplates = [tpl, ...customTemplates]
  emit()
}

export async function removeCustomTemplate(id: string) {
  customTemplates = customTemplates.filter((t) => t.id !== id)
  emit()
  await supabase.from('form_templates').delete().eq('id', id)
}

/* ---------- hooks ---------- */

export function useContentForm(): ContentForm | null {
  return useSyncExternalStore(subscribe, getForm, () => SERVER_FORM)
}
export function useCustomTemplates(): FormTemplate[] {
  return useSyncExternalStore(subscribe, getTemplates, () => SERVER_TEMPLATES)
}

/** Load form from DB when projectId changes. */
export function useContentFormLoader(projectId: string | null) {
  useEffect(() => {
    if (!projectId) return
    // Only load if we haven't already loaded for this project
    if (currentProjectId === projectId && currentForm) return
    loadForm(projectId)
  }, [projectId])
}
