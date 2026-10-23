-- ==============================================================================
-- Migration: 00008 - Deliverables, Client Feedback & Secure Storage Policies
-- FailureTech Agency Client Portal
-- ==============================================================================

-- 1. Extend Deliverables with preview links, review audit timestamps, and revision notes
ALTER TABLE public.deliverables
  ADD COLUMN IF NOT EXISTS preview_url TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revision_notes TEXT;

-- Index for deliverable reviews and status audits
CREATE INDEX IF NOT EXISTS idx_deliverables_status_due ON public.deliverables(status, due_date);
CREATE INDEX IF NOT EXISTS idx_deliverables_project_status ON public.deliverables(project_id, status);
CREATE INDEX IF NOT EXISTS idx_comments_deliverable_created ON public.comments(deliverable_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_files_deliverable_created ON public.files(deliverable_id, created_at DESC);

-- 2. Configure Private Supabase Storage Bucket for Deliverable Artifacts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deliverables',
  'deliverables',
  false, -- Strictly private: requires cryptographic signed URLs
  52428800, -- 50 MB per file limit
  ARRAY[
    'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml',
    'application/pdf', 'application/zip', 'text/plain', 'application/json',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- 3. Storage Row Level Security (RLS) on storage.objects
-- Bucket: 'deliverables' with folder path pattern: "{project_id}/{file_name}"
DROP POLICY IF EXISTS "deliverables_storage_select" ON storage.objects;
CREATE POLICY "deliverables_storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'deliverables'
    AND public.can_access_project((storage.foldername(name))[1]::uuid)
  );

DROP POLICY IF EXISTS "deliverables_storage_insert" ON storage.objects;
CREATE POLICY "deliverables_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'deliverables'
    AND public.can_access_project((storage.foldername(name))[1]::uuid)
    AND (public.is_agency_team() OR public.is_admin())
  );

DROP POLICY IF EXISTS "deliverables_storage_update" ON storage.objects;
CREATE POLICY "deliverables_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'deliverables'
    AND (public.is_admin() OR owner = auth.uid())
  )
  WITH CHECK (
    bucket_id = 'deliverables'
    AND (public.is_admin() OR owner = auth.uid())
  );

DROP POLICY IF EXISTS "deliverables_storage_delete" ON storage.objects;
CREATE POLICY "deliverables_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'deliverables'
    AND (public.is_admin() OR public.is_agency_team())
  );
