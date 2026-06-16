-- ============================================================
-- Migration: baseline CREATE TABLES
--
-- Creates all 17 public tables in their pre-ALTER state.
-- Subsequent migrations (RLS, storage, ALTERs) layer on top.
-- Dependency order respected: referenced tables first.
--
-- Also includes the rls_auto_enable event trigger (auto-enables
-- RLS on any new table created in the public schema).
-- ============================================================

-- ---------- Event trigger: auto-enable RLS on new tables ----------

create or replace function rls_auto_enable()
returns event_trigger language plpgsql security definer
set search_path = 'pg_catalog' as $$
declare
  cmd record;
begin
  for cmd in
    select *
    from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table','partitioned table')
  loop
    if cmd.schema_name is not null
       and cmd.schema_name in ('public')
       and cmd.schema_name not in ('pg_catalog','information_schema')
       and cmd.schema_name not like 'pg_toast%'
       and cmd.schema_name not like 'pg_temp%'
    then
      begin
        execute format('alter table if exists %s enable row level security', cmd.object_identity);
        raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      exception
        when others then
          raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      end;
    else
      raise log 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
    end if;
  end loop;
end;
$$;

create event trigger ensure_rls on ddl_command_end
  execute function rls_auto_enable();

-- ---------- 1. profiles ----------

create table profiles (
  id         uuid primary key references auth.users(id),
  email      text not null,
  name       text,
  created_at timestamptz default now()
);

-- ---------- 2. accounts ----------

create table accounts (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  white_label jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ---------- 3. account_members ----------

create table account_members (
  account_id uuid not null references accounts(id),
  user_id    uuid not null references profiles(id),
  role       text not null default 'owner',
  created_at timestamptz default now(),
  primary key (account_id, user_id)
);

-- ---------- 4. form_templates ----------
-- NOTE: site_type is dropped by the freeform_rework migration

create table form_templates (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid references accounts(id),
  name        text not null,
  site_type   text,
  description text default '',
  sections    jsonb not null default '[]'::jsonb,
  created_at  timestamptz default now()
);

-- ---------- 5. projects ----------
-- NOTE: portal_content is added by 20260616_add_missing_columns

create table projects (
  id                   uuid primary key default gen_random_uuid(),
  account_id           uuid references accounts(id),
  name                 text not null,
  target               text not null default 'ollie',
  stage                text not null default 'onboarding',
  site_type            text default 'static',
  client_name          text,
  client_domain        text,
  calendar_link        text,
  relevant_links       jsonb not null default '[]'::jsonb,
  white_label_override jsonb,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- ---------- 6. design_systems ----------

create table design_systems (
  project_id uuid primary key references projects(id),
  tokens     jsonb not null,
  emitted    jsonb,
  updated_at timestamptz default now()
);

-- ---------- 7. pages ----------

create table pages (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  name       text not null,
  slug       text not null,
  parent_id  uuid references pages(id),
  position   integer not null default 0,
  sections   jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

-- ---------- 8. participants ----------

create table participants (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects(id),
  name         text not null,
  email        text,
  invited      boolean not null default false,
  created_at   timestamptz default now(),
  last_seen_at timestamptz
);

-- ---------- 9. assets ----------
-- NOTE: category, slot are added by 003_assets_categories

create table assets (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid references projects(id),
  kind           text not null,
  label          text,
  original_path  text not null,
  optimized_path text,
  mime           text,
  bytes          integer,
  width          integer,
  height         integer,
  uploaded_by    uuid references participants(id),
  created_at     timestamptz default now()
);

-- ---------- 10. content_forms ----------
-- NOTE: site_type, includes_structure, template_id, and UNIQUE(project_id,kind)
--       are dropped by the freeform_rework migration.
--       name is added by freeform_rework; created_at by add_missing_columns.

create table content_forms (
  id                 uuid primary key default gen_random_uuid(),
  project_id         uuid references projects(id),
  kind               text not null default 'content',
  site_type          text,
  includes_structure boolean default false,
  template_id        uuid,
  sections           jsonb not null default '[]'::jsonb,
  sent               boolean not null default false,
  sent_at            timestamptz,
  updated_at         timestamptz default now(),
  unique (project_id, kind)
);

-- ---------- 11. content_submissions ----------

create table content_submissions (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid references projects(id),
  form_section_id     text not null,
  "values"            jsonb not null default '{}'::jsonb,
  status              text not null default 'outstanding',
  last_participant_id uuid references participants(id),
  updated_at          timestamptz default now()
);

-- ---------- 12. mockups ----------

create table mockups (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid references projects(id),
  name           text not null,
  kind           text not null,
  page_id        uuid references pages(id),
  image_asset_id uuid references assets(id),
  html           text,
  created_at     timestamptz default now()
);

-- ---------- 13. shares ----------

create table shares (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid references projects(id),
  token            text not null unique,
  participant_id   uuid references participants(id),
  visible_views    jsonb not null default '[]'::jsonb,
  can_comment      boolean not null default true,
  can_edit_content boolean not null default true,
  revoked          boolean not null default false,
  created_at       timestamptz default now()
);

-- ---------- 14. comments ----------
-- NOTE: parent_id, resolved_by/at, pin_* are added by
--       002_comments_threads_pins

create table comments (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid references projects(id),
  target_type    text not null,
  target_id      text not null,
  participant_id uuid references participants(id),
  author_user_id uuid references profiles(id),
  body           text not null,
  resolved       boolean not null default false,
  created_at     timestamptz default now()
);

-- ---------- 15. approvals ----------

create table approvals (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid references projects(id),
  target_type    text not null,
  target_id      text not null,
  participant_id uuid references participants(id),
  status         text not null,
  note           text,
  created_at     timestamptz default now()
);

-- ---------- 16. connections ----------

create table connections (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id),
  project_id uuid references projects(id),
  kind       text not null,
  label      text,
  config     jsonb not null default '{}'::jsonb,
  secret_ref text,
  created_at timestamptz default now()
);

-- ---------- 17. pushes ----------

create table pushes (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references projects(id),
  connection_id uuid references connections(id),
  status        text not null default 'queued',
  summary       jsonb,
  error         text,
  created_at    timestamptz default now(),
  finished_at   timestamptz
);
