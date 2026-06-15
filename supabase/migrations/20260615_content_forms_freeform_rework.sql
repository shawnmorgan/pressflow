-- ============================================================
-- Migration: content_forms free-form rework
--
-- 1. Drop unique(project_id, kind) — allow N content forms per project
-- 2. Add name column to content_forms
-- 3. Drop obsolete columns: site_type, includes_structure, template_id
-- 4. Drop site_type from form_templates (templates are no longer type-keyed)
-- ============================================================

-- 1. Drop the unique constraint that blocks multiple forms per project
ALTER TABLE content_forms DROP CONSTRAINT content_forms_project_id_kind_key;

-- 2. Add name column
ALTER TABLE content_forms ADD COLUMN name text NOT NULL DEFAULT 'Untitled';

-- 3. Drop obsolete columns from content_forms
ALTER TABLE content_forms DROP COLUMN IF EXISTS site_type;
ALTER TABLE content_forms DROP COLUMN IF EXISTS includes_structure;
ALTER TABLE content_forms DROP COLUMN IF EXISTS template_id;

-- 4. Drop site_type from form_templates
ALTER TABLE form_templates DROP COLUMN IF EXISTS site_type;
