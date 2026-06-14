/**
 * Generates supabase/seed.sql from the lib/ default data.
 * Run: npx tsx scripts/gen-seed.ts
 */
import { writeFileSync } from 'fs'
import { join } from 'path'
import { DEFAULT_DESIGN_SYSTEM } from '../lib/design-system'
import { DEFAULT_PAGES } from '../lib/sitemap'

// Fixed UUIDs for deterministic seed
const OWNER_ID = '00000000-0000-0000-0000-000000000001'
const ACCOUNT_ID = '00000000-0000-0000-0000-000000000010'
const AURORA_ID = '00000000-0000-0000-0000-000000000100'
const NORTHWIND_ID = '00000000-0000-0000-0000-000000000101'
const MORI_ID = '00000000-0000-0000-0000-000000000102'
const HARBOR_ID = '00000000-0000-0000-0000-000000000103'

// Stable UUIDs for page rows (pages.id is uuid, not text)
const PAGE_UUIDS: Record<string, string> = {}
for (const p of DEFAULT_PAGES) {
  // Deterministic: hash the slug into a UUID-shaped string
  const hex = p.slug.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) >>> 0, 0).toString(16).padStart(8, '0')
  PAGE_UUIDS[p.id] = `a0000000-0000-0000-0000-${hex.padStart(12, '0')}`
}

function esc(json: unknown): string {
  return JSON.stringify(json).replace(/'/g, "''")
}

const pageRows = DEFAULT_PAGES.map((p, i) => {
  const uuid = PAGE_UUIDS[p.id]
  const parentUuid = p.parentId ? PAGE_UUIDS[p.parentId] : null
  return `('${uuid}', '${AURORA_ID}', '${p.name}', '${p.slug}', ${parentUuid ? `'${parentUuid}'` : 'null'}, ${i}, '${esc(p.sections)}')`
})

const sql = `-- ==========================================================================
-- PressFlow seed data
-- Generated from lib/design-system.ts + lib/sitemap.ts defaults
-- ==========================================================================

-- 1. Create auth user (owner) — password: pressflow123
-- This uses Supabase's auth.users directly for seeding
insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '${OWNER_ID}',
  '00000000-0000-0000-0000-000000000000',
  'shawn@series5.studio',
  crypt('pressflow123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Shawn Morgan"}',
  'authenticated',
  'authenticated',
  now(), now(),
  '', '', '', ''
) on conflict (id) do nothing;

-- Also insert identity for email provider
insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) values (
  '${OWNER_ID}',
  '${OWNER_ID}',
  jsonb_build_object('sub', '${OWNER_ID}', 'email', 'shawn@series5.studio'),
  'email',
  '${OWNER_ID}',
  now(), now(), now()
) on conflict (provider, provider_id) do nothing;

-- 2. Profile
insert into profiles (id, email, name) values
  ('${OWNER_ID}', 'shawn@series5.studio', 'Shawn Morgan')
on conflict (id) do nothing;

-- 3. Account (Series 5)
insert into accounts (id, name, slug, white_label) values
  ('${ACCOUNT_ID}', 'Series 5', 'series5', '${esc({
    name: 'Series 5',
    initials: 'S5',
    accent: '#3858e9',
    contactEmail: 'hello@series5.studio',
  })}')
on conflict (id) do nothing;

-- 4. Account membership
insert into account_members (account_id, user_id, role) values
  ('${ACCOUNT_ID}', '${OWNER_ID}', 'owner')
on conflict (account_id, user_id) do nothing;

-- 5. Projects
insert into projects (id, account_id, name, target, stage, site_type, client_name, client_domain, calendar_link, relevant_links) values
  ('${AURORA_ID}', '${ACCOUNT_ID}', 'Aurora Press', 'ollie', 'approval', 'static', 'Aurora Coffee Roasters', 'auroracoffee.com', 'https://cal.com/series5/aurora', '${esc([
    { id: 'l1', label: 'Signed proposal', url: 'https://drive.example.com/aurora-proposal' },
    { id: 'l2', label: 'Invoice #0042', url: 'https://billing.example.com/0042' },
    { id: 'l3', label: 'Shared drive', url: 'https://drive.example.com/aurora' },
    { id: 'l4', label: 'Kickoff notes', url: 'https://notes.example.com/aurora-kickoff' },
  ])}'),
  ('${NORTHWIND_ID}', '${ACCOUNT_ID}', 'Northwind Traders', 'ollie', 'onboarding', 'static', null, null, null, '[]'),
  ('${MORI_ID}', '${ACCOUNT_ID}', 'Studio Mori', 'ollie', 'design', 'static', null, null, null, '[]'),
  ('${HARBOR_ID}', '${ACCOUNT_ID}', 'Harbor Health', 'ollie', 'content', 'static', null, null, null, '[]')
on conflict (id) do nothing;

-- 6. Design system (Aurora only — fully seeded)
insert into design_systems (project_id, tokens) values
  ('${AURORA_ID}', '${esc(DEFAULT_DESIGN_SYSTEM)}')
on conflict (project_id) do nothing;

-- 7. Pages (Aurora only — 5 pages with full sections)
insert into pages (id, project_id, name, slug, parent_id, position, sections) values
  ${pageRows.join(',\n  ')}
on conflict (id) do nothing;
`

const outPath = join(__dirname, '..', 'supabase', 'seed.sql')
writeFileSync(outPath, sql, 'utf-8')
console.log(`Wrote ${outPath}`)
