-- Change pages.parent_id FK to ON DELETE SET NULL so deleting a parent
-- page orphans children gracefully instead of blocking the delete.
ALTER TABLE public.pages
  DROP CONSTRAINT pages_parent_id_fkey,
  ADD CONSTRAINT pages_parent_id_fkey
    FOREIGN KEY (parent_id) REFERENCES public.pages(id) ON DELETE SET NULL;
