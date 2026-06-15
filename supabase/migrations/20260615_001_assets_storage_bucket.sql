-- Create the private assets bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assets',
  'assets',
  false,
  52428800, -- 50 MB
  ARRAY[
    'image/jpeg','image/png','image/gif','image/webp','image/svg+xml',
    'application/pdf',
    'video/mp4','video/quicktime',
    'application/zip',
    'text/plain','text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: path convention is {project_id}/{filename}
-- Users can upload to projects they belong to
CREATE POLICY "assets_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'assets'
    AND public.can_access_project((storage.foldername(name))[1]::uuid)
  );

-- Users can read from projects they belong to
CREATE POLICY "assets_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'assets'
    AND public.can_access_project((storage.foldername(name))[1]::uuid)
  );

-- Users can delete from projects they belong to
CREATE POLICY "assets_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'assets'
    AND public.can_access_project((storage.foldername(name))[1]::uuid)
  );
