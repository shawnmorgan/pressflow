-- Add threading, resolve metadata, and pin columns to comments
alter table comments add column parent_id uuid references comments(id) on delete cascade;
alter table comments add column resolved_by uuid references profiles(id);
alter table comments add column resolved_at timestamptz;
alter table comments add column pin_x float;
alter table comments add column pin_y float;
alter table comments add column pin_view text;
alter table comments add column pin_target_id text;

-- Index for fast thread lookups
create index if not exists idx_comments_parent_id on comments(parent_id);
-- Index for pin queries by view
create index if not exists idx_comments_pin_view on comments(pin_view) where pin_view is not null;
