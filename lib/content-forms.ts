'use client'

import { useSyncExternalStore, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/* =========================================================================
 * Content forms — free-form, Content-Snare-style question sets.
 *
 * A content form is an arbitrary set of questions the agency writes for the
 * client: "What services do you offer?", "Upload your logo," etc. Answers
 * are stored structured and read by an agent (via MCP, later) to build the
 * sitemap/wireframe. The app never maps answers to sections itself.
 *
 * Multiple forms per project. Templates are optional starting points.
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
  file: { label: 'Image / file', blurb: 'Upload a file (wired later).' },
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

export type SectionStatus = 'outstanding' | 'submitted'

export type FormSection = {
  id: string
  title: string
  description: string
  status: SectionStatus
  fields: FormField[]
}

export type FormTemplate = {
  id: string
  name: string
  description: string
  builtIn: boolean
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
  fields: FormField[],
  description = '',
): FormSection {
  return {
    id: uid('sec'),
    title,
    description,
    status: 'outstanding',
    fields,
  }
}

/* ---------- built-in templates (optional starting points) ---------- */

const BUSINESS_BASICS_TEMPLATE: FormTemplate = {
  id: 'builtin-business',
  name: 'Business basics',
  description: 'Core business info — name, services, audience, brand voice.',
  builtIn: true,
  sections: [
    section('About the business', [
      field('short', 'Business name', { required: true }),
      field('long', 'What does the business do?', {
        required: true,
        help: 'Describe it in a few sentences, as if explaining to a stranger.',
      }),
      field('short', 'Tagline or slogan', { help: 'If you have one already.' }),
      field('url', 'Current website', { help: 'If there is an existing site.' }),
    ], 'The basics we need to get started.'),
    section('Services & offerings', [
      field('group', 'Service', {
        required: true,
        help: 'Add each service or product category.',
        fields: [
          field('short', 'Service name', { required: true }),
          field('long', 'Description'),
          field('short', 'Starting price', { help: 'Optional — e.g. "from $99"' }),
        ],
      }),
    ], 'What you offer your customers.'),
    section('Target audience', [
      field('long', 'Who is your ideal customer?', { required: true }),
      field('long', 'What problems do you solve for them?'),
      field('multiselect', 'Customer type', {
        options: ['B2B', 'B2C', 'Both', 'Non-profit'],
      }),
    ], 'Help us understand who the site is for.'),
    section('Brand & voice', [
      field('long', 'How should the site feel?', {
        help: 'e.g. Professional but approachable, bold and playful, minimal and clean.',
      }),
      field('file', 'Logo files', { help: 'Upload your logo in any format.' }),
      field('file', 'Brand guidelines', { help: 'If you have a brand guide or style sheet.' }),
      field('multiselect', 'Competitors or sites you admire', {
        help: 'Add URLs of sites whose style you like.',
        options: [],
      }),
    ], 'Tone, look, and existing brand assets.'),
  ],
}

const ECOMMERCE_TEMPLATE: FormTemplate = {
  id: 'builtin-ecommerce',
  name: 'E-commerce',
  description: 'Product catalog, shipping, payments, and store policies.',
  builtIn: true,
  sections: [
    section('Products', [
      field('group', 'Product', {
        required: true,
        help: 'Add each product you want to launch with.',
        fields: [
          field('short', 'Product name', { required: true }),
          field('number', 'Price', { required: true }),
          field('short', 'SKU'),
          field('long', 'Description'),
          field('file', 'Product images'),
        ],
      }),
    ], 'The catalog of products for your store.'),
    section('Categories', [
      field('group', 'Category', {
        fields: [
          field('short', 'Category name', { required: true }),
          field('long', 'Description'),
        ],
      }),
    ], 'How products are organized.'),
    section('Shipping & returns', [
      field('long', 'Shipping policy', { required: true }),
      field('long', 'Returns & refunds policy', { required: true }),
      field('multiselect', 'Regions you ship to', {
        options: ['Domestic', 'North America', 'Europe', 'Worldwide'],
      }),
    ], 'Fulfillment details shown at checkout.'),
    section('Payment info', [
      field('multiselect', 'Accepted payment methods', {
        options: ['Credit card', 'PayPal', 'Apple Pay', 'Google Pay', 'Bank transfer'],
      }),
      field('short', 'Currency', { help: 'e.g. USD, EUR' }),
    ], 'How customers pay.'),
  ],
}

const PORTFOLIO_TEMPLATE: FormTemplate = {
  id: 'builtin-portfolio',
  name: 'Portfolio / creative',
  description: 'Projects, bio, services — for creatives and agencies.',
  builtIn: true,
  sections: [
    section('Projects', [
      field('group', 'Project', {
        required: true,
        fields: [
          field('short', 'Project title', { required: true }),
          field('short', 'Client'),
          field('number', 'Year'),
          field('long', 'Summary'),
          field('file', 'Project images'),
          field('url', 'Live link'),
        ],
      }),
    ], 'The work you want to showcase.'),
    section('About / Bio', [
      field('long', 'Bio', { required: true }),
      field('file', 'Portrait'),
    ], 'Your story.'),
    section('Services', [
      field('long', 'What services do you offer?', { required: true }),
      field('long', 'What is your process like?'),
    ], 'What clients can hire you for.'),
  ],
}

export const BUILT_IN_TEMPLATES: FormTemplate[] = [
  BUSINESS_BASICS_TEMPLATE,
  ECOMMERCE_TEMPLATE,
  PORTFOLIO_TEMPLATE,
]

/* =========================================================================
 * Store — supports multiple forms per project
 * ========================================================================= */

export type ContentForm = {
  id: string          // DB id (or local uid before first save)
  projectId: string
  name: string
  sections: FormSection[]
  sent: boolean
  sentAt?: number
}

let forms: ContentForm[] = []
let loadedProjectId: string | null = null
let customTemplates: FormTemplate[] = []
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getForms() {
  return forms
}
function getTemplates() {
  return customTemplates
}
const SERVER_FORMS: ContentForm[] = []
const SERVER_TEMPLATES: FormTemplate[] = []

/* ---------- DB persistence ---------- */

const saveTimers = new Map<string, ReturnType<typeof setTimeout>>()

function debounceSaveForm(formId: string) {
  const form = forms.find((f) => f.id === formId)
  if (!form) return
  if (saveTimers.has(formId)) clearTimeout(saveTimers.get(formId)!)
  saveTimers.set(
    formId,
    setTimeout(() => {
      supabase
        .from('content_forms')
        .update({
          name: form.name,
          sections: form.sections as unknown as Record<string, unknown>[],
          sent: form.sent,
          sent_at: form.sentAt ? new Date(form.sentAt).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', formId)
        .then()
      saveTimers.delete(formId)
    }, 800),
  )
}

/** Load all content forms for a project from DB. */
export async function loadForms(projectId: string): Promise<ContentForm[]> {
  const { data } = await supabase
    .from('content_forms')
    .select('id, name, sections, sent, sent_at')
    .eq('project_id', projectId)
    .eq('kind', 'content')
    .order('created_at', { ascending: true })

  loadedProjectId = projectId
  forms = (data ?? []).map((row: any) => ({
    id: row.id,
    projectId,
    name: row.name ?? 'Untitled',
    sections: (row.sections as FormSection[]) ?? [],
    sent: row.sent ?? false,
    sentAt: row.sent_at ? new Date(row.sent_at).getTime() : undefined,
  }))
  emit()
  return forms
}

/** Load custom templates for an account from DB. */
export async function loadCustomTemplates(accountId: string): Promise<FormTemplate[]> {
  const { data } = await supabase
    .from('form_templates')
    .select('id, name, description, sections')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false })

  if (data) {
    customTemplates = data.map((t: any) => ({
      id: t.id,
      name: t.name,
      description: t.description ?? '',
      builtIn: false,
      sections: (t.sections as FormSection[]) ?? [],
    }))
    emit()
  }
  return customTemplates
}

/** Deep-clone a section list, regenerating every id. */
function cloneSections(sections: FormSection[]): FormSection[] {
  return sections.map((s) => ({
    ...s,
    id: uid('sec'),
    status: 'outstanding' as const,
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

/** Create a new content form (blank or from template). */
export async function createForm(
  projectId: string,
  name: string,
  templateSections?: FormSection[],
): Promise<ContentForm> {
  const sections = templateSections ? cloneSections(templateSections) : []
  const localId = uid('form')

  const form: ContentForm = {
    id: localId,
    projectId,
    name: name || 'Untitled',
    sections,
    sent: false,
  }

  // Optimistic — add to store immediately
  forms = [...forms, form]
  emit()

  // Persist
  const { data } = await supabase
    .from('content_forms')
    .insert({
      project_id: projectId,
      kind: 'content',
      name: form.name,
      sections: sections as unknown as Record<string, unknown>[],
      sent: false,
    })
    .select('id')
    .single()

  if (data) {
    // Update local id to DB id
    forms = forms.map((f) => (f.id === localId ? { ...f, id: data.id } : f))
    emit()
    form.id = data.id
  }

  return form
}

/** Delete a content form. */
export async function deleteForm(formId: string) {
  forms = forms.filter((f) => f.id !== formId)
  emit()
  await supabase.from('content_forms').delete().eq('id', formId)
}

function mutateForm(formId: string, fn: (form: ContentForm) => ContentForm) {
  forms = forms.map((f) => (f.id === formId ? fn(f) : f))
  emit()
  debounceSaveForm(formId)
}

export function renameForm(formId: string, name: string) {
  mutateForm(formId, (f) => ({ ...f, name }))
}

export function addSection(formId: string) {
  mutateForm(formId, (f) => ({
    ...f,
    sections: [
      ...f.sections,
      section('Untitled section', [field('short', 'New question')]),
    ],
  }))
}

export function updateSection(formId: string, sectionId: string, patch: Partial<FormSection>) {
  mutateForm(formId, (f) => ({
    ...f,
    sections: f.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)),
  }))
}

export function removeSection(formId: string, sectionId: string) {
  mutateForm(formId, (f) => ({ ...f, sections: f.sections.filter((s) => s.id !== sectionId) }))
}

export function moveSection(formId: string, sectionId: string, dir: -1 | 1) {
  mutateForm(formId, (f) => {
    const i = f.sections.findIndex((s) => s.id === sectionId)
    const j = i + dir
    if (i < 0 || j < 0 || j >= f.sections.length) return f
    const next = [...f.sections]
    ;[next[i], next[j]] = [next[j], next[i]]
    return { ...f, sections: next }
  })
}

export function setSectionStatus(formId: string, sectionId: string, status: SectionStatus) {
  updateSection(formId, sectionId, { status })
}

export function addField(formId: string, sectionId: string, type: FieldType) {
  mutateForm(formId, (f) => ({
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
  formId: string,
  sectionId: string,
  fieldId: string,
  patch: Partial<FormField>,
) {
  mutateForm(formId, (f) => ({
    ...f,
    sections: f.sections.map((s) =>
      s.id === sectionId
        ? { ...s, fields: s.fields.map((fl) => (fl.id === fieldId ? { ...fl, ...patch } : fl)) }
        : s,
    ),
  }))
}

export function removeField(formId: string, sectionId: string, fieldId: string) {
  mutateForm(formId, (f) => ({
    ...f,
    sections: f.sections.map((s) =>
      s.id === sectionId ? { ...s, fields: s.fields.filter((fl) => fl.id !== fieldId) } : s,
    ),
  }))
}

export function moveField(formId: string, sectionId: string, fieldId: string, dir: -1 | 1) {
  mutateForm(formId, (f) => ({
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

export function sendToClient(formId: string) {
  mutateForm(formId, (f) => ({ ...f, sent: true, sentAt: Date.now() }))
}

function defaultLabel(type: FieldType): string {
  return FIELD_TYPE_META[type].label
}

export async function saveAsTemplate(formId: string, name: string, accountId?: string) {
  const form = forms.find((f) => f.id === formId)
  if (!form) return
  const sections = cloneSections(form.sections)
  const tpl: FormTemplate = {
    id: uid('tpl'),
    name: name.trim() || 'Custom template',
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

export function useContentForms(): ContentForm[] {
  return useSyncExternalStore(subscribe, getForms, () => SERVER_FORMS)
}
export function useCustomTemplates(): FormTemplate[] {
  return useSyncExternalStore(subscribe, getTemplates, () => SERVER_TEMPLATES)
}

/** Load forms from DB when projectId changes. */
export function useContentFormLoader(projectId: string | null) {
  useEffect(() => {
    if (!projectId) return
    if (loadedProjectId === projectId && forms.length > 0) return
    loadForms(projectId)
  }, [projectId])
}
