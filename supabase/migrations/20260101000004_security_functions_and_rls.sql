-- ==============================================================================
-- Migration: 00004 - Non-Recursive Security Functions and RLS Policies
-- FailureTech Agency Client Portal
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SECURITY DEFINER HELPER FUNCTIONS (Prevents Infinite RLS Recursion)
-- ------------------------------------------------------------------------------

-- Get the role of the authenticated caller directly from profiles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Check if caller is FailureTech Super Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Check if caller is Agency Staff (Admin or Team Member)
CREATE OR REPLACE FUNCTION public.is_agency_team()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'team_member')
  );
$$;

-- Safely retrieve all organization IDs the specified user belongs to
CREATE OR REPLACE FUNCTION public.get_user_organization_ids(p_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = p_user_id;
$$;

-- Check if caller is member of target organization
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id AND user_id = auth.uid()
  );
$$;

-- Check if caller is an admin/owner of target organization
CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

-- Comprehensive project access checker (Admin, assigned team, or client org member)
CREATE OR REPLACE FUNCTION public.can_access_project(p_project_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_role public.user_role;
  v_project_org_id UUID;
BEGIN
  -- Agency Admins have universal visibility
  IF public.is_admin() THEN
    RETURN true;
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();

  -- Agency team members have access if assigned to project or general staff
  IF v_role = 'team_member' THEN
    IF EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = p_project_id AND user_id = auth.uid()
    ) THEN
      RETURN true;
    END IF;
    -- Optional agency-wide view: agency staff can inspect any project
    RETURN true;
  END IF;

  -- Client users: can only access projects owned by their organization
  SELECT organization_id INTO v_project_org_id
  FROM public.projects
  WHERE id = p_project_id;

  IF v_project_org_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = v_project_org_id AND user_id = auth.uid()
    ) THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. ENABLE ROW LEVEL SECURITY ACROSS ALL TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 3. PROFILES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_delete_admin_only" ON public.profiles;
CREATE POLICY "profiles_delete_admin_only" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. ORGANIZATIONS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "organizations_select" ON public.organizations;
CREATE POLICY "organizations_select" ON public.organizations
  FOR SELECT TO authenticated
  USING (public.is_admin() OR public.is_agency_team() OR public.is_org_member(id));

DROP POLICY IF EXISTS "organizations_insert_admin" ON public.organizations;
CREATE POLICY "organizations_insert_admin" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "organizations_update" ON public.organizations;
CREATE POLICY "organizations_update" ON public.organizations
  FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.is_org_admin(id))
  WITH CHECK (public.is_admin() OR public.is_org_admin(id));

DROP POLICY IF EXISTS "organizations_delete_admin" ON public.organizations;
CREATE POLICY "organizations_delete_admin" ON public.organizations
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. ORGANIZATION MEMBERS POLICIES (Recursion-proof via get_user_organization_ids)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "org_members_select" ON public.organization_members;
CREATE POLICY "org_members_select" ON public.organization_members
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.is_agency_team()
    OR user_id = auth.uid()
    OR organization_id IN (SELECT public.get_user_organization_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "org_members_insert" ON public.organization_members;
CREATE POLICY "org_members_insert" ON public.organization_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.is_org_admin(organization_id));

DROP POLICY IF EXISTS "org_members_update" ON public.organization_members;
CREATE POLICY "org_members_update" ON public.organization_members
  FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.is_org_admin(organization_id))
  WITH CHECK (public.is_admin() OR public.is_org_admin(organization_id));

DROP POLICY IF EXISTS "org_members_delete" ON public.organization_members;
CREATE POLICY "org_members_delete" ON public.organization_members
  FOR DELETE TO authenticated
  USING (public.is_admin() OR public.is_org_admin(organization_id));

-- ------------------------------------------------------------------------------
-- 6. PROJECTS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT TO authenticated
  USING (public.can_access_project(id));

DROP POLICY IF EXISTS "projects_insert" ON public.projects;
CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (public.is_agency_team());

DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE TO authenticated
  USING (public.is_agency_team())
  WITH CHECK (public.is_agency_team());

DROP POLICY IF EXISTS "projects_delete" ON public.projects;
CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. PROJECT MEMBERS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "project_members_select" ON public.project_members;
CREATE POLICY "project_members_select" ON public.project_members
  FOR SELECT TO authenticated
  USING (public.can_access_project(project_id));

DROP POLICY IF EXISTS "project_members_manage" ON public.project_members;
CREATE POLICY "project_members_manage" ON public.project_members
  FOR ALL TO authenticated
  USING (public.is_agency_team())
  WITH CHECK (public.is_agency_team());

-- ------------------------------------------------------------------------------
-- 8. MILESTONES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "milestones_select" ON public.milestones;
CREATE POLICY "milestones_select" ON public.milestones
  FOR SELECT TO authenticated
  USING (public.can_access_project(project_id));

DROP POLICY IF EXISTS "milestones_insert_team" ON public.milestones;
CREATE POLICY "milestones_insert_team" ON public.milestones
  FOR INSERT TO authenticated
  WITH CHECK (public.is_agency_team());

DROP POLICY IF EXISTS "milestones_update_team" ON public.milestones;
CREATE POLICY "milestones_update_team" ON public.milestones
  FOR UPDATE TO authenticated
  USING (public.is_agency_team())
  WITH CHECK (public.is_agency_team());

DROP POLICY IF EXISTS "milestones_delete_admin" ON public.milestones;
CREATE POLICY "milestones_delete_admin" ON public.milestones
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 9. DELIVERABLES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "deliverables_select" ON public.deliverables;
CREATE POLICY "deliverables_select" ON public.deliverables
  FOR SELECT TO authenticated
  USING (public.can_access_project(project_id));

DROP POLICY IF EXISTS "deliverables_insert_team" ON public.deliverables;
CREATE POLICY "deliverables_insert_team" ON public.deliverables
  FOR INSERT TO authenticated
  WITH CHECK (public.is_agency_team());

DROP POLICY IF EXISTS "deliverables_update_team" ON public.deliverables;
CREATE POLICY "deliverables_update_team" ON public.deliverables
  FOR UPDATE TO authenticated
  USING (public.is_agency_team() OR public.can_access_project(project_id))
  WITH CHECK (public.is_agency_team() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "deliverables_delete_admin" ON public.deliverables;
CREATE POLICY "deliverables_delete_admin" ON public.deliverables
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 10. COMMENTS POLICIES (Client/Internal isolation)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "comments_select" ON public.comments;
CREATE POLICY "comments_select" ON public.comments
  FOR SELECT TO authenticated
  USING (
    public.can_access_project(project_id)
    AND (NOT is_internal_only OR public.is_agency_team())
  );

DROP POLICY IF EXISTS "comments_insert" ON public.comments;
CREATE POLICY "comments_insert" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.can_access_project(project_id)
    AND author_id = auth.uid()
    AND (NOT is_internal_only OR public.is_agency_team())
  );

DROP POLICY IF EXISTS "comments_update_author" ON public.comments;
CREATE POLICY "comments_update_author" ON public.comments
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.is_admin())
  WITH CHECK (author_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "comments_delete" ON public.comments;
CREATE POLICY "comments_delete" ON public.comments
  FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 11. FILES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "files_select" ON public.files;
CREATE POLICY "files_select" ON public.files
  FOR SELECT TO authenticated
  USING (
    public.can_access_project(project_id)
    AND (is_public_to_client OR public.is_agency_team())
  );

DROP POLICY IF EXISTS "files_insert" ON public.files;
CREATE POLICY "files_insert" ON public.files
  FOR INSERT TO authenticated
  WITH CHECK (
    public.can_access_project(project_id)
    AND uploaded_by = auth.uid()
    AND (is_public_to_client OR public.is_agency_team())
  );

DROP POLICY IF EXISTS "files_delete" ON public.files;
CREATE POLICY "files_delete" ON public.files
  FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 12. INVOICES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
CREATE POLICY "invoices_select" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.is_agency_team()
    OR organization_id IN (SELECT public.get_user_organization_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "invoices_insert_admin" ON public.invoices;
CREATE POLICY "invoices_insert_admin" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "invoices_update_admin" ON public.invoices;
CREATE POLICY "invoices_update_admin" ON public.invoices
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "invoices_delete_admin" ON public.invoices;
CREATE POLICY "invoices_delete_admin" ON public.invoices
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 13. PAYMENT RECORDS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "payment_records_select" ON public.payment_records;
CREATE POLICY "payment_records_select" ON public.payment_records
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.is_agency_team()
    OR invoice_id IN (
      SELECT id FROM public.invoices
      WHERE organization_id IN (SELECT public.get_user_organization_ids(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "payment_records_insert" ON public.payment_records;
CREATE POLICY "payment_records_insert" ON public.payment_records
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.is_agency_team()
    OR invoice_id IN (
      SELECT id FROM public.invoices
      WHERE organization_id IN (SELECT public.get_user_organization_ids(auth.uid()))
    )
  );

-- ------------------------------------------------------------------------------
-- 14. NOTIFICATIONS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "notifications_select_owner" ON public.notifications;
CREATE POLICY "notifications_select_owner" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_authorized" ON public.notifications;
CREATE POLICY "notifications_insert_authorized" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.is_agency_team() OR user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_owner" ON public.notifications;
CREATE POLICY "notifications_update_owner" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_delete_owner" ON public.notifications;
CREATE POLICY "notifications_delete_owner" ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
