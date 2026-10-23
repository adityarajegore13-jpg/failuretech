-- ==============================================================================
-- Migration: 00003 - Performance & Foreign Key Indexes
-- FailureTech Agency Client Portal
-- ==============================================================================

-- 1. Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. Organizations Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON public.organizations(is_active);

-- 3. Organization Members Indexes
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON public.organization_members(role);
CREATE INDEX IF NOT EXISTS idx_org_members_composite ON public.organization_members(organization_id, user_id, role);

-- 4. Projects Indexes
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_org_status ON public.projects(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_delivery_date ON public.projects(target_delivery_date);

-- 5. Project Members Indexes
CREATE INDEX IF NOT EXISTS idx_proj_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_members_user_id ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_proj_members_composite ON public.project_members(project_id, user_id);

-- 6. Milestones Indexes
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON public.milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_sequence ON public.milestones(project_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_milestones_due_date ON public.milestones(due_date);

-- 7. Deliverables Indexes
CREATE INDEX IF NOT EXISTS idx_deliverables_project_id ON public.deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_milestone_id ON public.deliverables(milestone_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_assigned_to ON public.deliverables(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deliverables_status ON public.deliverables(status);
CREATE INDEX IF NOT EXISTS idx_deliverables_proj_status ON public.deliverables(project_id, status);

-- 8. Comments Indexes
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON public.comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_deliverable_id ON public.comments(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_internal ON public.comments(project_id, is_internal_only);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- 9. Files Indexes
CREATE INDEX IF NOT EXISTS idx_files_project_id ON public.files(project_id);
CREATE INDEX IF NOT EXISTS idx_files_deliverable_id ON public.files(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON public.files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_visibility ON public.files(project_id, is_public_to_client);

-- 10. Invoices Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON public.invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);

-- 11. Payment Records Indexes
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payment_records(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payment_records(status);
CREATE INDEX IF NOT EXISTS idx_payments_tx_ref ON public.payment_records(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON public.payment_records(paid_at DESC);

-- 12. Notifications Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
