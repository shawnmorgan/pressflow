-- Add category and slot columns to assets for structured sections
alter table assets add column category text not null default 'image';
alter table assets add column slot text;

-- category: 'branding' | 'image' | 'video' | 'file'
-- slot: 'logo' | 'logo-variation' | 'site-icon' (only for category='branding')

create index if not exists idx_assets_category on assets(project_id, category);
