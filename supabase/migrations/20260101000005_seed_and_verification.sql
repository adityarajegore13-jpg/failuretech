-- ==============================================================================
-- Migration: 00005 - Seed Data & RLS Verification Suite
-- FailureTech Agency Client Portal
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEED ORGANIZATIONS
-- ------------------------------------------------------------------------------
INSERT INTO public.organizations (
  id,
  name,
  slug,
  website,
  billing_email,
  billing_address
) VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    'FailureTech HQ (Agency Core)',
    'failuretech-hq',
    'https://failuretech.agency',
    'billing@failuretech.agency',
    '{"street": "100 Innovation Way", "city": "San Francisco", "state": "CA", "zip": "94105", "country": "USA"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Acme Global Enterprises',
    'acme-global',
    'https://acmeglobal.example.com',
    'accounts@acmeglobal.example.com',
    '{"street": "450 Technology Pkwy", "city": "New York", "state": "NY", "zip": "10001", "country": "USA"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. SEED DEMO PROJECTS
-- ------------------------------------------------------------------------------
INSERT INTO public.projects (
  id,
  organization_id,
  title,
  code,
  description,
  status,
  budget_total,
  currency,
  progress_percent,
  start_date,
  target_delivery_date,
  repository_url,
  staging_url
) VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000002',
    'Fintech Core Banking API & Mobile Portal',
    'FT-PRJ-01',
    'High-security banking ledger integration, Next.js 16 portal, and biometric SDK.',
    'in_progress',
    65000.00,
    'USD',
    78,
    '2026-08-01',
    '2026-11-15',
    'https://github.com/failuretech/acme-fintech-core',
    'https://staging-fintech.acmeglobal.internal'
  ),
  (
    '11111111-1111-1111-1111-111111111112',
    '00000000-0000-0000-0000-000000000002',
    'AI Document Extraction & Summarization Engine',
    'FT-PRJ-02',
    'Multimodal LLM parsing pipeline with vector search and automated document audit.',
    'in_review',
    42000.00,
    'USD',
    94,
    '2026-07-15',
    '2026-10-30',
    'https://github.com/failuretech/acme-ai-pipeline',
    'https://staging-ai.acmeglobal.internal'
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. SEED MILESTONES
-- ------------------------------------------------------------------------------
INSERT INTO public.milestones (
  id,
  project_id,
  title,
  description,
  status,
  sequence_order,
  due_date
) VALUES 
  (
    '22222222-2222-2222-2222-222222222221',
    '11111111-1111-1111-1111-111111111111',
    'Milestone 1: Core Architecture & Data Ingestion Schema',
    'PostgreSQL schemas, Supabase SSR auth, and ledger schema isolation.',
    'completed',
    1,
    '2026-08-30'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Milestone 2: Payment Webhooks & Transaction Engine',
    'Stripe & ACH reconciliation microservices deployed to staging.',
    'in_progress',
    2,
    '2026-10-25'
  ),
  (
    '22222222-2222-2222-2222-222222222223',
    '11111111-1111-1111-1111-111111111111',
    'Milestone 3: Mobile Client SDK & Security Hardening',
    'Biometric authentication, certificate pinning, and end-to-end testing.',
    'planned',
    3,
    '2026-11-15'
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. SEED DELIVERABLES
-- ------------------------------------------------------------------------------
INSERT INTO public.deliverables (
  id,
  project_id,
  milestone_id,
  title,
  description,
  status,
  acceptance_criteria,
  due_date
) VALUES 
  (
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Idempotent Webhook Receiver for Stripe Events',
    'Process payment events with at-least-once delivery guarantees and signature verification.',
    'in_review',
    'Must pass simulated replay attack test and respond within 150ms with 200 OK.',
    '2026-10-24'
  ),
  (
    '33333333-3333-3333-3333-333333333332',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Audit Trail Logging to Secure S3 Cold Storage',
    'Cryptographically signed daily batch exports of transaction audit logs.',
    'in_progress',
    'SHA-256 integrity verification hash must be logged in database table.',
    '2026-10-28'
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. SEED INVOICES & PAYMENTS
-- ------------------------------------------------------------------------------
INSERT INTO public.invoices (
  id,
  organization_id,
  project_id,
  invoice_number,
  status,
  subtotal_amount,
  tax_amount,
  total_amount,
  currency,
  issue_date,
  due_date,
  notes
) VALUES 
  (
    '44444444-4444-4444-4444-444444444441',
    '00000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'INV-FT-2026-088',
    'issued',
    14000.00,
    1000.00,
    15000.00,
    'USD',
    '2026-10-15',
    '2026-11-01',
    'Monthly Development Retainer & Milestone 2 Deliverables'
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. VERIFICATION SUITE: RLS AUDIT QUERIES
-- ------------------------------------------------------------------------------
-- The following SQL blocks demonstrate how to verify RLS permissions in Supabase SQL Editor:

/*
-- Test 1: Verify Table Row Counts as Superuser (postgres/service_role)
SELECT
  'organizations' AS table_name, count(*) FROM public.organizations
UNION ALL
SELECT 'projects', count(*) FROM public.projects
UNION ALL
SELECT 'milestones', count(*) FROM public.milestones
UNION ALL
SELECT 'deliverables', count(*) FROM public.deliverables
UNION ALL
SELECT 'invoices', count(*) FROM public.invoices;

-- Test 2: Verify Non-Recursive Function Execution
SELECT
  public.is_admin() AS current_user_is_admin,
  public.is_agency_team() AS current_user_is_agency,
  count(*) AS user_orgs_count
FROM public.get_user_organization_ids(auth.uid());

-- Test 3: Check Active RLS Policies on all 12 Tables
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
*/
