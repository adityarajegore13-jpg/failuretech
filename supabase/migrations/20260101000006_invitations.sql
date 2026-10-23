-- ==============================================================================
-- Migration: 00006 - Secure Invitations & Onboarding Flow
-- FailureTech Agency Client Portal
-- ==============================================================================

-- 1. Create Invitations Table
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

CREATE TRIGGER set_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for invitation verification
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_org_id ON public.invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);

-- Enable RLS on Invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Agency staff can view all invitations
DROP POLICY IF EXISTS "invitations_select_team" ON public.invitations;
CREATE POLICY "invitations_select_team" ON public.invitations
  FOR SELECT TO authenticated
  USING (public.is_agency_team());

-- Policy: Agency staff can create invitations
DROP POLICY IF EXISTS "invitations_insert_team" ON public.invitations;
CREATE POLICY "invitations_insert_team" ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (public.is_agency_team());

-- Policy: Agency staff can update/revoke invitations
DROP POLICY IF EXISTS "invitations_update_team" ON public.invitations;
CREATE POLICY "invitations_update_team" ON public.invitations
  FOR UPDATE TO authenticated
  USING (public.is_agency_team())
  WITH CHECK (public.is_agency_team());

-- Policy: Super Admin can delete invitations
DROP POLICY IF EXISTS "invitations_delete_admin" ON public.invitations;
CREATE POLICY "invitations_delete_admin" ON public.invitations
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- 2. Security Definer Function to Verify & Accept Invitations (Safe for unauthenticated / new users)
CREATE OR REPLACE FUNCTION public.verify_invitation(p_token TEXT)
RETURNS TABLE (
  invitation_id UUID,
  organization_id UUID,
  organization_name TEXT,
  email TEXT,
  role public.user_role,
  org_role public.org_role,
  is_valid BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv RECORD;
  v_org_name TEXT;
BEGIN
  SELECT * INTO v_inv
  FROM public.invitations
  WHERE token = p_token;

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
    RETURN QUERY SELECT v_inv.id, v_inv.organization_id, NULL::TEXT, v_inv.email, v_inv.role, v_inv.org_role, false, 'Invitation has expired. Please request a new invitation.'::TEXT;
    RETURN;
  END IF;

  SELECT name INTO v_org_name FROM public.organizations WHERE id = v_inv.organization_id;

  RETURN QUERY SELECT v_inv.id, v_inv.organization_id, v_org_name, v_inv.email, v_inv.role, v_inv.org_role, true, NULL::TEXT;
END;
$$;

-- 3. Security Definer Function to Finalize Invitation Acceptance after User Sign-Up
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token TEXT, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv RECORD;
BEGIN
  SELECT * INTO v_inv
  FROM public.invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at >= clock_timestamp();

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- 1. Ensure profile has the assigned role from invitation
  UPDATE public.profiles
  SET role = v_inv.role
  WHERE id = p_user_id;

  -- 2. Link user to organization
  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    role
  ) VALUES (
    v_inv.organization_id,
    p_user_id,
    v_inv.org_role
  )
  ON CONFLICT (organization_id, user_id)
  DO UPDATE SET role = EXCLUDED.role;

  -- 3. Mark invitation accepted
  UPDATE public.invitations
  SET status = 'accepted'
  WHERE id = v_inv.id;

  RETURN true;
END;
$$;
