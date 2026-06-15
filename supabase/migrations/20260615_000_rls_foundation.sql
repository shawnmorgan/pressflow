-- ============================================================
-- Migration: RLS foundation
--
-- Tracks the RLS helpers + policies already deployed to remote.
-- Idempotent: safe to re-run. Matches Supabase.md §5 exactly.
--
-- Two helpers (security definer), then one policy per table.
-- Agency path = RLS by account membership.
-- Client path = no auth.uid(); access only via security-definer
--   edge functions that validate a share token.
-- ============================================================

-- ---------- Helpers ----------

create or replace function can_access_project(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from projects pr
    join account_members m on m.account_id = pr.account_id
    where pr.id = p and m.user_id = auth.uid()
  );
$$;

create or replace function is_account_member(a uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from account_members m
    where m.account_id = a and m.user_id = auth.uid()
  );
$$;

-- ---------- Enable RLS on every table ----------

alter table profiles             enable row level security;
alter table accounts             enable row level security;
alter table account_members      enable row level security;
alter table projects             enable row level security;
alter table design_systems       enable row level security;
alter table pages                enable row level security;
alter table assets               enable row level security;
alter table content_forms        enable row level security;
alter table content_submissions  enable row level security;
alter table mockups              enable row level security;
alter table participants         enable row level security;
alter table shares               enable row level security;
alter table comments             enable row level security;
alter table approvals            enable row level security;
alter table connections          enable row level security;
alter table form_templates       enable row level security;
alter table pushes               enable row level security;

-- ---------- Policies ----------
-- Pattern: one ALL policy per table. Agency users pass; clients never do
-- (they have no auth.uid and go through edge functions instead).

-- profiles: own row only
drop policy if exists profiles_rw on profiles;
create policy profiles_rw on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- account-scoped tables: gate on is_account_member(account_id)
drop policy if exists accounts_rw on accounts;
create policy accounts_rw on accounts
  for all using (is_account_member(id)) with check (is_account_member(id));

drop policy if exists account_members_rw on account_members;
create policy account_members_rw on account_members
  for all using (is_account_member(account_id)) with check (is_account_member(account_id));

drop policy if exists projects_rw on projects;
create policy projects_rw on projects
  for all using (is_account_member(account_id)) with check (is_account_member(account_id));

drop policy if exists form_templates_rw on form_templates;
create policy form_templates_rw on form_templates
  for all using (is_account_member(account_id)) with check (is_account_member(account_id));

drop policy if exists connections_rw on connections;
create policy connections_rw on connections
  for all using (is_account_member(account_id)) with check (is_account_member(account_id));

-- project-scoped tables: gate on can_access_project(project_id)
drop policy if exists design_systems_rw on design_systems;
create policy design_systems_rw on design_systems
  for all using (can_access_project(project_id)) with check (can_access_project(project_id));

drop policy if exists pages_rw on pages;
create policy pages_rw on pages
  for all using (can_access_project(project_id)) with check (can_access_project(project_id));

drop policy if exists assets_rw on assets;
create policy assets_rw on assets
  for all using (can_access_project(project_id)) with check (can_access_project(project_id));

drop policy if exists content_forms_rw on content_forms;
create policy content_forms_rw on content_forms
  for all using (can_access_project(project_id)) with check (can_access_project(project_id));

drop policy if exists content_submissions_rw on content_submissions;
create policy content_submissions_rw on content_submissions
  for all using (can_access_project(project_id)) with check (can_access_project(project_id));

drop policy if exists mockups_rw on mockups;
create policy mockups_rw on mockups
  for all using (can_access_project(project_id)) with check (can_access_project(project_id));

drop policy if exists participants_rw on participants;
create policy participants_rw on participants
  for all using (can_access_project(project_id)) with check (can_access_project(project_id));

drop policy if exists shares_rw on shares;
create policy shares_rw on shares
  for all using (can_access_project(project_id)) with check (can_access_project(project_id));

drop policy if exists comments_rw on comments;
create policy comments_rw on comments
  for all using (can_access_project(project_id)) with check (can_access_project(project_id));

drop policy if exists approvals_rw on approvals;
create policy approvals_rw on approvals
  for all using (can_access_project(project_id)) with check (can_access_project(project_id));

drop policy if exists pushes_rw on pushes;
create policy pushes_rw on pushes
  for all using (can_access_project(project_id)) with check (can_access_project(project_id));
