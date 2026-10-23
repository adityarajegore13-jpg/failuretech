-- ==============================================================================
-- Migration: 00007 - End-to-End Project Management Enhancements
-- FailureTech Agency Client Portal
-- ==============================================================================

-- 1. Add priority and archive tracking to projects
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'medium' 
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- 2. Add priority to deliverables (tasks)
ALTER TABLE public.deliverables 
  ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'medium' 
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- 3. Optimization Indexes for Project Management Queries
CREATE INDEX IF NOT EXISTS idx_projects_status_archived 
  ON public.projects(status, is_archived);

CREATE INDEX IF NOT EXISTS idx_projects_priority 
  ON public.projects(priority);

CREATE INDEX IF NOT EXISTS idx_projects_org_status 
  ON public.projects(organization_id, status, is_archived);

CREATE INDEX IF NOT EXISTS idx_deliverables_milestone_status 
  ON public.deliverables(milestone_id, status);

CREATE INDEX IF NOT EXISTS idx_deliverables_assigned_to 
  ON public.deliverables(assigned_to);

CREATE INDEX IF NOT EXISTS idx_milestones_project_seq 
  ON public.milestones(project_id, sequence_order);

-- 4. Update Project Progress Calculator Trigger (Optional automatic calculation from deliverables)
CREATE OR REPLACE FUNCTION public.calculate_project_progress(p_project_id UUID)
RETURNS SMALLINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_done INTEGER;
  v_progress SMALLINT;
BEGIN
  SELECT count(*) INTO v_total FROM public.deliverables WHERE project_id = p_project_id;
  
  IF v_total = 0 THEN
    RETURN 0;
  END IF;

  SELECT count(*) INTO v_done 
  FROM public.deliverables 
  WHERE project_id = p_project_id AND status = 'approved';

  v_progress := ROUND((v_done::FLOAT / v_total::FLOAT) * 100);
  
  UPDATE public.projects 
  SET progress_percent = v_progress, updated_at = clock_timestamp()
  WHERE id = p_project_id;

  RETURN v_progress;
END;
$$;
