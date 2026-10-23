-- ==============================================================================
-- Migration: 00009 - Realtime Notifications, File Vault & Stakeholder Dispatch
-- FailureTech Agency Client Portal
-- ==============================================================================

-- 1. Extend Files table for Categorized Vault Storage
ALTER TABLE public.files
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS description TEXT;

CREATE INDEX IF NOT EXISTS idx_files_project_category ON public.files(project_id, category);
CREATE INDEX IF NOT EXISTS idx_files_project_created ON public.files(project_id, created_at DESC);

-- 2. Enable Supabase Realtime for Notifications & Files
-- Adds tables to supabase_realtime publication for streaming table row changes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.files;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Configure Private Storage Bucket for File Vault
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vault',
  'vault',
  false, -- Strictly private: requires cryptographic signed URLs
  52428800, -- 50 MB limit
  ARRAY[
    'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif',
    'application/pdf', 'application/zip', 'application/x-zip-compressed',
    'text/plain', 'text/csv', 'application/json',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4', 'application/octet-stream'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- 4. Storage Row Level Security (RLS) on storage.objects for Bucket 'vault'
-- Path convention: "{project_id}/{category}/{filename}"
DROP POLICY IF EXISTS "vault_storage_select" ON storage.objects;
CREATE POLICY "vault_storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'vault'
    AND public.can_access_project((storage.foldername(name))[1]::uuid)
  );

DROP POLICY IF EXISTS "vault_storage_insert" ON storage.objects;
CREATE POLICY "vault_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'vault'
    AND public.can_access_project((storage.foldername(name))[1]::uuid)
  );

DROP POLICY IF EXISTS "vault_storage_update" ON storage.objects;
CREATE POLICY "vault_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'vault'
    AND (public.is_admin() OR owner = auth.uid())
  )
  WITH CHECK (
    bucket_id = 'vault'
    AND (public.is_admin() OR owner = auth.uid())
  );

DROP POLICY IF EXISTS "vault_storage_delete" ON storage.objects;
CREATE POLICY "vault_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'vault'
    AND (public.is_admin() OR owner = auth.uid() OR public.is_agency_team())
  );

-- 5. Stored Function: notify_project_stakeholders
-- Securely inserts notifications for relevant project actors (excluding sender)
CREATE OR REPLACE FUNCTION public.notify_project_stakeholders(
  p_project_id UUID,
  p_sender_id UUID,
  p_type public.notification_type,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT,
  p_target TEXT DEFAULT 'all',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_count INTEGER := 0;
  v_org_id UUID;
BEGIN
  -- Get project organization ID
  SELECT organization_id INTO v_org_id FROM public.projects WHERE id = p_project_id;
  IF v_org_id IS NULL THEN
    RETURN 0;
  END IF;

  -- 1. Notify Client Stakeholders if targeted
  IF p_target IN ('all', 'clients') THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
    SELECT DISTINCT om.user_id, p_type, p_title, p_message, p_link, p_metadata
    FROM public.organization_members om
    WHERE om.organization_id = v_org_id
      AND (p_sender_id IS NULL OR om.user_id <> p_sender_id)
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = om.user_id
          AND n.title = p_title
          AND n.created_at > (clock_timestamp() - INTERVAL '10 seconds')
      );
    GET DIAGNOSTICS v_recipient_count = ROW_COUNT;
  END IF;

  -- 2. Notify Agency Staff if targeted
  IF p_target IN ('all', 'agency') THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
    SELECT DISTINCT p.id, p_type, p_title, p_message, p_link, p_metadata
    FROM public.profiles p
    WHERE p.role IN ('admin', 'team_member')
      AND (p_sender_id IS NULL OR p.id <> p_sender_id)
      AND (
        p.role = 'admin'
        OR EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = p_project_id AND pm.user_id = p.id
        )
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = p.id
          AND n.title = p_title
          AND n.created_at > (clock_timestamp() - INTERVAL '10 seconds')
      );
  END IF;

  RETURN v_recipient_count;
END;
$$;

-- 6. Automated PostgreSQL Triggers for Status Changes & Stakeholder Feedback

-- A. Deliverables Review & Sign-Off Trigger
CREATE OR REPLACE FUNCTION public.trg_deliverable_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Submitted for Client Review
  IF NEW.status = 'in_review' AND (OLD.status IS NULL OR OLD.status <> 'in_review') THEN
    PERFORM public.notify_project_stakeholders(
      NEW.project_id,
      auth.uid(),
      'deliverable_ready',
      'Deliverable Ready for Review: ' || NEW.title,
      'Agency team submitted "' || NEW.title || '" for client review and stakeholder sign-off.',
      '/projects/' || NEW.project_id,
      'clients',
      jsonb_build_object('deliverable_id', NEW.id, 'status', NEW.status)
    );
  END IF;

  -- Client Approved & Signed Off
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    PERFORM public.notify_project_stakeholders(
      NEW.project_id,
      auth.uid(),
      'milestone_completed',
      'Deliverable Approved: ' || NEW.title,
      'Client stakeholder approved and signed off on deliverable "' || NEW.title || '".',
      '/projects/' || NEW.project_id,
      'agency',
      jsonb_build_object('deliverable_id', NEW.id, 'status', NEW.status)
    );
  END IF;

  -- Client Revision Requested
  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status <> 'rejected') THEN
    PERFORM public.notify_project_stakeholders(
      NEW.project_id,
      auth.uid(),
      'project_update',
      'Revisions Requested: ' || NEW.title,
      'Client requested changes on "' || NEW.title || '". Notes: ' || COALESCE(NEW.revision_notes, 'See deliverable details.'),
      '/projects/' || NEW.project_id,
      'agency',
      jsonb_build_object('deliverable_id', NEW.id, 'status', NEW.status)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deliverable_notifications ON public.deliverables;
CREATE TRIGGER trg_deliverable_notifications
  AFTER UPDATE OF status ON public.deliverables
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_deliverable_notifications();

-- B. Milestone Lifecycle Trigger
CREATE OR REPLACE FUNCTION public.trg_milestone_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status <> OLD.status THEN
    PERFORM public.notify_project_stakeholders(
      NEW.project_id,
      auth.uid(),
      CASE WHEN NEW.status = 'completed' THEN 'milestone_completed'::public.notification_type ELSE 'project_update'::public.notification_type END,
      'Milestone Status: ' || NEW.title,
      'Milestone "' || NEW.title || '" transitioned to ' || UPPER(NEW.status::text) || '.',
      '/projects/' || NEW.project_id,
      'all',
      jsonb_build_object('milestone_id', NEW.id, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_milestone_notifications ON public.milestones;
CREATE TRIGGER trg_milestone_notifications
  AFTER UPDATE OF status ON public.milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_milestone_notifications();

-- C. Feedback Comments Trigger
CREATE OR REPLACE FUNCTION public.trg_comment_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_internal_only THEN
    -- Internal note: alert agency staff only
    PERFORM public.notify_project_stakeholders(
      NEW.project_id,
      auth.uid(),
      'new_comment',
      'New Internal Agency Note',
      substring(NEW.content from 1 for 120),
      '/projects/' || NEW.project_id,
      'agency',
      jsonb_build_object('comment_id', NEW.id, 'is_internal', true)
    );
  ELSE
    -- Public feedback: alert all stakeholders
    PERFORM public.notify_project_stakeholders(
      NEW.project_id,
      auth.uid(),
      'new_comment',
      'New Feedback Comment',
      substring(NEW.content from 1 for 120),
      '/projects/' || NEW.project_id,
      'all',
      jsonb_build_object('comment_id', NEW.id, 'is_internal', false)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_notifications ON public.comments;
CREATE TRIGGER trg_comment_notifications
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_comment_notifications();
