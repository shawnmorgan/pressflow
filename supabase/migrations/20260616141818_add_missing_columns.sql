-- ============================================================
-- Migration: add missing columns
--
-- 1. Add portal_content to projects (code writes to it but column never existed)
-- 2. Add created_at to content_forms (code orders by it)
-- ============================================================

-- 1. Portal home content — rich text authored by agency in project settings
ALTER TABLE projects ADD COLUMN IF NOT EXISTS portal_content text DEFAULT '';

-- 2. Created timestamp for content forms ordering
ALTER TABLE content_forms ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
