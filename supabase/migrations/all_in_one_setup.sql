-- ==============================================================================
-- FailureTech Agency Client Portal - Complete Database Schema & RLS Setup
-- Consolidated Production Migration (PostgreSQL / Supabase)
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- PART 1: EXTENSIONS & ENUMS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'team_member', 'client');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'member', 'billing_contact');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.project_status AS ENUM ('discovery', 'in_progress', 'in_review', 'completed', 'on_hold', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.milestone_status AS ENUM ('planned', 'in_progress', 'in_review', 'completed', 'blocked');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.deliverable_status AS ENUM ('backlog', 'in_progress', 'in_review', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('draft', 'issued', 'paid', 'overdue', 'void', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'project_update', 'milestone_completed', 'deliverable_ready',
    'new_comment', 'invoice_issued', 'payment_received', 'system_alert'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- PART 2: AUTOMATED TRIGGERS & CORE TABLES
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role public.user_role NOT NULL DEFAULT 'client',
  phone TEXT,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-sync auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role public.user_role;
BEGIN
  v_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    'client'::public.user_role
  );

  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    v_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  website TEXT,
  billing_email TEXT,
  billing_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

DROP TRIGGER IF EXISTS set_organizations_updated_at ON public.organizations;
CREATE TRIGGER set_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Organization Members
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.org_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT uq_organization_member UNIQUE (organization_id, user_id)
);

DROP TRIGGER IF EXISTS set_organization_members_updated_at ON public.organization_members;
CREATE TRIGGER set_organization_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  status public.project_status NOT NULL DEFAULT 'in_progress',
  budget_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  progress_percent SMALLINT NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  start_date DATE,
  target_delivery_date DATE,
  repository_url TEXT,
  staging_url TEXT,
  production_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT uq_organization_project_code UNIQUE (organization_id, code)
);

DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Project Members
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_role TEXT NOT NULL DEFAULT 'contributor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT uq_project_member UNIQUE (project_id, user_id)
);

-- 6. Milestones
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status public.milestone_status NOT NULL DEFAULT 'planned',
  sequence_order INTEGER NOT NULL DEFAULT 1,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

DROP TRIGGER IF EXISTS set_milestones_updated_at ON public.milestones;
CREATE TRIGGER set_milestones_updated_at
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. Deliverables
CREATE TABLE IF NOT EXISTS public.deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status public.deliverable_status NOT NULL DEFAULT 'backlog',
  acceptance_criteria TEXT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

DROP TRIGGER IF EXISTS set_deliverables_updated_at ON public.deliverables;
CREATE TRIGGER set_deliverables_updated_at
  BEFORE UPDATE ON public.deliverables
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. Comments
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES public.deliverables(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

DROP TRIGGER IF EXISTS set_comments_updated_at ON public.comments;
CREATE TRIGGER set_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. Files
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES public.deliverables(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT,
  is_public_to_client BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 10. Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  subtotal_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

DROP TRIGGER IF EXISTS set_invoices_updated_at ON public.invoices;
CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 11. Payment Records
CREATE TABLE IF NOT EXISTS public.payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  transaction_reference TEXT UNIQUE NOT NULL,
  payment_method TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status public.payment_status NOT NULL DEFAULT 'pending',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 12. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- ==============================================================================
-- PART 3: INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON public.organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_composite ON public.organization_members(organization_id, user_id, role);
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_org_status ON public.projects(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_proj_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_members_user_id ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_sequence ON public.milestones(project_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_deliverables_project_id ON public.deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_milestone_id ON public.deliverables(milestone_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_status ON public.deliverables(status);
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON public.comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_deliverable_id ON public.comments(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_files_project_id ON public.files(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payment_records(invoice_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);

-- ==============================================================================
-- PART 4: SECURITY DEFINER FUNCTIONS & RECURSION-PROOF RLS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_agency_team()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'team_member'));
$$;

CREATE OR REPLACE FUNCTION public.get_user_organization_ids(p_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT organization_id FROM public.organization_members WHERE user_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id UUID)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id UUID)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_project(p_project_id UUID)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE
  v_role public.user_role;
  v_project_org_id UUID;
BEGIN
  IF public.is_admin() THEN
    RETURN true;
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();

  IF v_role = 'team_member' THEN
    RETURN true;
  END IF;

  SELECT organization_id INTO v_project_org_id FROM public.projects WHERE id = p_project_id;
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

-- Enable RLS
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

-- Profiles Policies
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "profiles_delete_admin_only" ON public.profiles;
CREATE POLICY "profiles_delete_admin_only" ON public.profiles FOR DELETE TO authenticated USING (public.is_admin());

-- Organizations Policies
DROP POLICY IF EXISTS "organizations_select" ON public.organizations;
CREATE POLICY "organizations_select" ON public.organizations FOR SELECT TO authenticated
  USING (public.is_admin() OR public.is_agency_team() OR public.is_org_member(id));
DROP POLICY IF EXISTS "organizations_insert_admin" ON public.organizations;
CREATE POLICY "organizations_insert_admin" ON public.organizations FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "organizations_update" ON public.organizations;
CREATE POLICY "organizations_update" ON public.organizations FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.is_org_admin(id))
  WITH CHECK (public.is_admin() OR public.is_org_admin(id));
DROP POLICY IF EXISTS "organizations_delete_admin" ON public.organizations;
CREATE POLICY "organizations_delete_admin" ON public.organizations FOR DELETE TO authenticated USING (public.is_admin());

-- Organization Members Policies
DROP POLICY IF EXISTS "org_members_select" ON public.organization_members;
CREATE POLICY "org_members_select" ON public.organization_members FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.is_agency_team()
    OR user_id = auth.uid()
    OR organization_id IN (SELECT public.get_user_organization_ids(auth.uid()))
  );
DROP POLICY IF EXISTS "org_members_insert" ON public.organization_members;
CREATE POLICY "org_members_insert" ON public.organization_members FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.is_org_admin(organization_id));
DROP POLICY IF EXISTS "org_members_update" ON public.organization_members;
CREATE POLICY "org_members_update" ON public.organization_members FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.is_org_admin(organization_id))
  WITH CHECK (public.is_admin() OR public.is_org_admin(organization_id));
DROP POLICY IF EXISTS "org_members_delete" ON public.organization_members;
CREATE POLICY "org_members_delete" ON public.organization_members FOR DELETE TO authenticated
  USING (public.is_admin() OR public.is_org_admin(organization_id));

-- Projects Policies
DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects FOR SELECT TO authenticated USING (public.can_access_project(id));
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
CREATE POLICY "projects_insert" ON public.projects FOR INSERT TO authenticated WITH CHECK (public.is_agency_team());
DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_update" ON public.projects FOR UPDATE TO authenticated USING (public.is_agency_team()) WITH CHECK (public.is_agency_team());
DROP POLICY IF EXISTS "projects_delete" ON public.projects;
CREATE POLICY "projects_delete" ON public.projects FOR DELETE TO authenticated USING (public.is_admin());

-- Project Members Policies
DROP POLICY IF EXISTS "project_members_select" ON public.project_members;
CREATE POLICY "project_members_select" ON public.project_members FOR SELECT TO authenticated USING (public.can_access_project(project_id));
DROP POLICY IF EXISTS "project_members_manage" ON public.project_members;
CREATE POLICY "project_members_manage" ON public.project_members FOR ALL TO authenticated USING (public.is_agency_team()) WITH CHECK (public.is_agency_team());

-- Milestones Policies
DROP POLICY IF EXISTS "milestones_select" ON public.milestones;
CREATE POLICY "milestones_select" ON public.milestones FOR SELECT TO authenticated USING (public.can_access_project(project_id));
DROP POLICY IF EXISTS "milestones_insert_team" ON public.milestones;
CREATE POLICY "milestones_insert_team" ON public.milestones FOR INSERT TO authenticated WITH CHECK (public.is_agency_team());
DROP POLICY IF EXISTS "milestones_update_team" ON public.milestones;
CREATE POLICY "milestones_update_team" ON public.milestones FOR UPDATE TO authenticated USING (public.is_agency_team()) WITH CHECK (public.is_agency_team());
DROP POLICY IF EXISTS "milestones_delete_admin" ON public.milestones;
CREATE POLICY "milestones_delete_admin" ON public.milestones FOR DELETE TO authenticated USING (public.is_admin());

-- Deliverables Policies
DROP POLICY IF EXISTS "deliverables_select" ON public.deliverables;
CREATE POLICY "deliverables_select" ON public.deliverables FOR SELECT TO authenticated USING (public.can_access_project(project_id));
DROP POLICY IF EXISTS "deliverables_insert_team" ON public.deliverables;
CREATE POLICY "deliverables_insert_team" ON public.deliverables FOR INSERT TO authenticated WITH CHECK (public.is_agency_team());
DROP POLICY IF EXISTS "deliverables_update_team" ON public.deliverables;
CREATE POLICY "deliverables_update_team" ON public.deliverables FOR UPDATE TO authenticated USING (public.is_agency_team() OR public.can_access_project(project_id)) WITH CHECK (public.is_agency_team() OR public.can_access_project(project_id));
DROP POLICY IF EXISTS "deliverables_delete_admin" ON public.deliverables;
CREATE POLICY "deliverables_delete_admin" ON public.deliverables FOR DELETE TO authenticated USING (public.is_admin());

-- Comments Policies
DROP POLICY IF EXISTS "comments_select" ON public.comments;
CREATE POLICY "comments_select" ON public.comments FOR SELECT TO authenticated USING (public.can_access_project(project_id) AND (NOT is_internal_only OR public.is_agency_team()));
DROP POLICY IF EXISTS "comments_insert" ON public.comments;
CREATE POLICY "comments_insert" ON public.comments FOR INSERT TO authenticated WITH CHECK (public.can_access_project(project_id) AND author_id = auth.uid() AND (NOT is_internal_only OR public.is_agency_team()));
DROP POLICY IF EXISTS "comments_update_author" ON public.comments;
CREATE POLICY "comments_update_author" ON public.comments FOR UPDATE TO authenticated USING (author_id = auth.uid() OR public.is_admin()) WITH CHECK (author_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "comments_delete" ON public.comments;
CREATE POLICY "comments_delete" ON public.comments FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.is_admin());

-- Files Policies
DROP POLICY IF EXISTS "files_select" ON public.files;
CREATE POLICY "files_select" ON public.files FOR SELECT TO authenticated USING (public.can_access_project(project_id) AND (is_public_to_client OR public.is_agency_team()));
DROP POLICY IF EXISTS "files_insert" ON public.files;
CREATE POLICY "files_insert" ON public.files FOR INSERT TO authenticated WITH CHECK (public.can_access_project(project_id) AND uploaded_by = auth.uid() AND (is_public_to_client OR public.is_agency_team()));
DROP POLICY IF EXISTS "files_delete" ON public.files;
CREATE POLICY "files_delete" ON public.files FOR DELETE TO authenticated USING (uploaded_by = auth.uid() OR public.is_admin());

-- Invoices Policies
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
CREATE POLICY "invoices_select" ON public.invoices FOR SELECT TO authenticated
  USING (public.is_admin() OR public.is_agency_team() OR organization_id IN (SELECT public.get_user_organization_ids(auth.uid())));
DROP POLICY IF EXISTS "invoices_insert_admin" ON public.invoices;
CREATE POLICY "invoices_insert_admin" ON public.invoices FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "invoices_update_admin" ON public.invoices;
CREATE POLICY "invoices_update_admin" ON public.invoices FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "invoices_delete_admin" ON public.invoices;
CREATE POLICY "invoices_delete_admin" ON public.invoices FOR DELETE TO authenticated USING (public.is_admin());

-- Payment Records Policies
DROP POLICY IF EXISTS "payment_records_select" ON public.payment_records;
CREATE POLICY "payment_records_select" ON public.payment_records FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.is_agency_team()
    OR invoice_id IN (
      SELECT id FROM public.invoices WHERE organization_id IN (SELECT public.get_user_organization_ids(auth.uid()))
    )
  );
DROP POLICY IF EXISTS "payment_records_insert" ON public.payment_records;
CREATE POLICY "payment_records_insert" ON public.payment_records FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.is_agency_team()
    OR invoice_id IN (
      SELECT id FROM public.invoices WHERE organization_id IN (SELECT public.get_user_organization_ids(auth.uid()))
    )
  );

-- Notifications Policies
DROP POLICY IF EXISTS "notifications_select_owner" ON public.notifications;
CREATE POLICY "notifications_select_owner" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "notifications_insert_authorized" ON public.notifications;
CREATE POLICY "notifications_insert_authorized" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.is_agency_team() OR user_id = auth.uid());
DROP POLICY IF EXISTS "notifications_update_owner" ON public.notifications;
CREATE POLICY "notifications_update_owner" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- 13. Invitations
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'client',
  org_role public.org_role NOT NULL DEFAULT 'member',
  token TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (clock_timestamp() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

DROP TRIGGER IF EXISTS set_invitations_updated_at ON public.invitations;
CREATE TRIGGER set_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invitations_select_team" ON public.invitations;
CREATE POLICY "invitations_select_team" ON public.invitations FOR SELECT TO authenticated USING (public.is_agency_team());
DROP POLICY IF EXISTS "invitations_insert_team" ON public.invitations;
CREATE POLICY "invitations_insert_team" ON public.invitations FOR INSERT TO authenticated WITH CHECK (public.is_agency_team());
DROP POLICY IF EXISTS "invitations_update_team" ON public.invitations;
CREATE POLICY "invitations_update_team" ON public.invitations FOR UPDATE TO authenticated USING (public.is_agency_team()) WITH CHECK (public.is_agency_team());
DROP POLICY IF EXISTS "invitations_delete_admin" ON public.invitations;
CREATE POLICY "invitations_delete_admin" ON public.invitations FOR DELETE TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.verify_invitation(p_token TEXT)
RETURNS TABLE (
  invitation_id UUID, organization_id UUID, organization_name TEXT,
  email TEXT, role public.user_role, org_role public.org_role,
  is_valid BOOLEAN, error_message TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_inv RECORD; v_org_name TEXT;
BEGIN
  SELECT * INTO v_inv FROM public.invitations WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::public.user_role, NULL::public.org_role, false, 'Invalid invitation token.'::TEXT;
    RETURN;
  END IF;
  IF v_inv.status != 'pending' THEN
    RETURN QUERY SELECT v_inv.id, v_inv.organization_id, NULL::TEXT, v_inv.email, v_inv.role, v_inv.org_role, false, ('Invitation has already been ' || v_inv.status || '.')::TEXT;
    RETURN;
  END IF;
  IF v_inv.expires_at < clock_timestamp() THEN
    UPDATE public.invitations SET status = 'expired' WHERE id = v_inv.id;
    RETURN QUERY SELECT v_inv.id, v_inv.organization_id, NULL::TEXT, v_inv.email, v_inv.role, v_inv.org_role, false, 'Invitation has expired.'::TEXT;
    RETURN;
  END IF;
  SELECT name INTO v_org_name FROM public.organizations WHERE id = v_inv.organization_id;
  RETURN QUERY SELECT v_inv.id, v_inv.organization_id, v_org_name, v_inv.email, v_inv.role, v_inv.org_role, true, NULL::TEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_invitation(p_token TEXT, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_inv RECORD;
BEGIN
  SELECT * INTO v_inv FROM public.invitations WHERE token = p_token AND status = 'pending' AND expires_at >= clock_timestamp();
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE public.profiles SET role = v_inv.role WHERE id = p_user_id;
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_inv.organization_id, p_user_id, v_inv.org_role)
  ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role;
  UPDATE public.invitations SET status = 'accepted' WHERE id = v_inv.id;
  RETURN true;
END;
$$;

-- ------------------------------------------------------------------------------
-- 10. PROJECT MANAGEMENT ENHANCEMENTS (Priority, Archival, Indexes)
-- ------------------------------------------------------------------------------
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'medium' 
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.deliverables 
  ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'medium' 
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

CREATE INDEX IF NOT EXISTS idx_projects_status_archived ON public.projects(status, is_archived);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON public.projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_org_status ON public.projects(organization_id, status, is_archived);
CREATE INDEX IF NOT EXISTS idx_deliverables_milestone_status ON public.deliverables(milestone_id, status);
CREATE INDEX IF NOT EXISTS idx_deliverables_assigned_to ON public.deliverables(assigned_to);
CREATE INDEX IF NOT EXISTS idx_milestones_project_seq ON public.milestones(project_id, sequence_order);

-- ------------------------------------------------------------------------------
-- 11. DELIVERABLES PREVIEWS, FEEDBACK AUDIT & SECURE STORAGE POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.deliverables
  ADD COLUMN IF NOT EXISTS preview_url TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revision_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_deliverables_status_due ON public.deliverables(status, due_date);
CREATE INDEX IF NOT EXISTS idx_deliverables_project_status ON public.deliverables(project_id, status);
CREATE INDEX IF NOT EXISTS idx_comments_deliverable_created ON public.comments(deliverable_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_files_deliverable_created ON public.files(deliverable_id, created_at DESC);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deliverables',
  'deliverables',
  false,
  52428800,
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
-- ==============================================================================
-- 19. Realtime Notifications, File Vault & Auto-Triggers
-- ==============================================================================

-- A. Files table category and description
ALTER TABLE public.files
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS description TEXT;

CREATE INDEX IF NOT EXISTS idx_files_project_category ON public.files(project_id, category);
CREATE INDEX IF NOT EXISTS idx_files_project_created ON public.files(project_id, created_at DESC);

-- B. Supabase Realtime Publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.files;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- C. Private Storage Bucket: vault
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vault',
  'vault',
  false,
  52428800,
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

-- D. Storage Policies for Bucket 'vault'
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

-- E. Stakeholder notification dispatcher
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
  SELECT organization_id INTO v_org_id FROM public.projects WHERE id = p_project_id;
  IF v_org_id IS NULL THEN
    RETURN 0;
  END IF;

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

-- F. Deliverables Review Trigger
CREATE OR REPLACE FUNCTION public.trg_deliverable_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

-- G. Milestone Lifecycle Trigger
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

-- H. Feedback Comments Trigger
CREATE OR REPLACE FUNCTION public.trg_comment_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_internal_only THEN
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

-- ==============================================================================
-- 15. Invoices & Razorpay Payment Integration (Migration 10)
-- ==============================================================================

-- 1. Extend invoices table with financial & payment gateway fields
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS client_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_invoices_razorpay_order_id ON public.invoices(razorpay_order_id);

-- 2. Create invoice_items table for granular line item billing
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- 3. Extend payment_records table with explicit Razorpay reference keys
ALTER TABLE public.payment_records
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

CREATE INDEX IF NOT EXISTS idx_payment_records_razorpay_payment_id ON public.payment_records(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_razorpay_order_id ON public.payment_records(razorpay_order_id);

-- 4. Helper Function: Check user access to invoice without RLS recursion
CREATE OR REPLACE FUNCTION public.can_access_invoice(p_invoice_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.invoices inv
    WHERE inv.id = p_invoice_id
      AND (
        public.is_admin()
        OR public.is_agency_team()
        OR inv.organization_id IN (SELECT public.get_user_organization_ids(auth.uid()))
      )
  );
$$;

-- 5. Enable RLS on invoice_items
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoice_items_select" ON public.invoice_items;
CREATE POLICY "invoice_items_select" ON public.invoice_items
  FOR SELECT TO authenticated
  USING (public.can_access_invoice(invoice_id));

DROP POLICY IF EXISTS "invoice_items_insert_admin" ON public.invoice_items;
CREATE POLICY "invoice_items_insert_admin" ON public.invoice_items
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "invoice_items_update_admin" ON public.invoice_items;
CREATE POLICY "invoice_items_update_admin" ON public.invoice_items
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "invoice_items_delete_admin" ON public.invoice_items;
CREATE POLICY "invoice_items_delete_admin" ON public.invoice_items
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- 6. Atomic Stored Procedure: Record Verified Razorpay Payment (Idempotent)
CREATE OR REPLACE FUNCTION public.record_verified_razorpay_payment(
  p_invoice_id UUID,
  p_payment_id TEXT,
  p_order_id TEXT,
  p_amount NUMERIC,
  p_currency TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice RECORD;
  v_existing_payment RECORD;
BEGIN
  -- 1. Check idempotency: check if payment record already exists and succeeded
  SELECT * INTO v_existing_payment 
  FROM public.payment_records 
  WHERE transaction_reference = p_payment_id;

  IF FOUND AND v_existing_payment.status = 'succeeded' THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'invoice_id', p_invoice_id,
      'payment_id', p_payment_id
    );
  END IF;

  -- 2. Fetch parent invoice
  SELECT * INTO v_invoice 
  FROM public.invoices 
  WHERE id = p_invoice_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice with ID % not found', p_invoice_id;
  END IF;

  -- 3. Upsert payment record
  INSERT INTO public.payment_records (
    invoice_id,
    transaction_reference,
    payment_method,
    amount,
    currency,
    status,
    metadata,
    razorpay_order_id,
    razorpay_payment_id,
    paid_at
  ) VALUES (
    p_invoice_id,
    p_payment_id,
    'razorpay',
    p_amount,
    p_currency,
    'succeeded',
    p_metadata,
    p_order_id,
    p_payment_id,
    clock_timestamp()
  )
  ON CONFLICT (transaction_reference) DO UPDATE SET
    status = 'succeeded',
    metadata = EXCLUDED.metadata,
    paid_at = clock_timestamp();

  -- 4. Atomically transition invoice status to paid
  UPDATE public.invoices
  SET 
    status = 'paid',
    paid_at = clock_timestamp(),
    updated_at = clock_timestamp()
  WHERE id = p_invoice_id;

  -- 5. Dispatch notification to agency admins
  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  SELECT 
    p.id,
    'payment_received'::public.notification_type,
    'Payment Received (' || v_invoice.currency || ' ' || p_amount::text || ')',
    'Invoice ' || v_invoice.invoice_number || ' has been paid via Razorpay.',
    '/invoices',
    jsonb_build_object('invoice_id', p_invoice_id, 'payment_id', p_payment_id)
  FROM public.profiles p
  WHERE p.role = 'admin';

  RETURN jsonb_build_object(
    'success', true,
    'invoice_id', p_invoice_id,
    'payment_id', p_payment_id,
    'status', 'paid'
  );
END;
$$;

COMMIT;

