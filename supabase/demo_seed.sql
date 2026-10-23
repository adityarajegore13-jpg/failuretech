-- ==============================================================================
-- FailureTech Agency Client Portal - Comprehensive Demonstration Seed Data
-- Safe Demo Data without Real Personal Information
-- File: supabase/demo_seed.sql
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. ORGANIZATIONS (Multi-Tenant Workspaces)
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
    'https://failuretech.dev',
    'billing@failuretech.dev',
    '{"city": "Bengaluru", "state": "Karnataka", "country": "India", "street": "4th Floor, Tech Innovation Hub", "postal_code": "560001"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Acme HyperScale Systems',
    'acme-hyperscale',
    'https://acmehyperscale.internal',
    'finance@acmehyperscale.internal',
    '{"city": "Mumbai", "state": "Maharashtra", "country": "India", "street": "Tower B, Cyber City", "postal_code": "400051"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'NovaBio Dynamics Inc.',
    'novabio-dynamics',
    'https://novabio.example.com',
    'accounts@novabio.example.com',
    '{"city": "Hyderabad", "state": "Telangana", "country": "India", "street": "Genome Valley BioPark", "postal_code": "500078"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  website = EXCLUDED.website;

-- ------------------------------------------------------------------------------
-- 2. PROJECTS (Client Projects)
-- ------------------------------------------------------------------------------
INSERT INTO public.projects (
  id,
  organization_id,
  title,
  code,
  description,
  status,
  priority,
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
    'Cloud Edge Modernization & Ledger Pipeline',
    'CEM',
    'Distributed high-throughput transaction ledger, automated reconciliation, and edge caching API.',
    'in_progress',
    'high',
    150000.00,
    'INR',
    78,
    '2026-08-01',
    '2026-11-30',
    'https://github.com/failuretech-demo/acme-ledger-pipeline',
    'https://staging-cem.failuretech.dev'
  ),
  (
    '11111111-1111-1111-1111-111111111112',
    '00000000-0000-0000-0000-000000000002',
    'AI Multimodal Document Intelligence Engine',
    'MDI',
    'Autonomous PDF parsing, table extraction, and vector semantic clustering with Next.js dashboard.',
    'in_review',
    'urgent',
    95000.00,
    'INR',
    92,
    '2026-07-15',
    '2026-10-31',
    'https://github.com/failuretech-demo/acme-document-ai',
    'https://staging-mdi.failuretech.dev'
  ),
  (
    '11111111-1111-1111-1111-111111111113',
    '00000000-0000-0000-0000-000000000003',
    'Genomic Sequencing Cloud Analytics Workspace',
    'GSA',
    'HIPAA-compliant high-performance bioinformatics visualizer and cohort analysis engine.',
    'discovery',
    'medium',
    120000.00,
    'INR',
    25,
    '2026-10-01',
    '2026-12-20',
    'https://github.com/failuretech-demo/novabio-genomic-suite',
    'https://staging-genomics.failuretech.dev'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  progress_percent = EXCLUDED.progress_percent;

-- ------------------------------------------------------------------------------
-- 3. MILESTONES (Sprints & Delivery Phases)
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
    'Sprint 1: Schema Isolation & Event Streaming Architecture',
    'PostgreSQL tables, Row Level Security policies, and event stream architecture.',
    'completed',
    1,
    '2026-08-31'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Sprint 2: Payment Webhooks & Transaction Verification',
    'Razorpay server order creation, webhook verification, and HMAC signing.',
    'completed',
    2,
    '2026-09-30'
  ),
  (
    '22222222-2222-2222-2222-222222222223',
    '11111111-1111-1111-1111-111111111111',
    'Sprint 3: Client Dashboard & Secure File Vault Hardening',
    'Role-based views, private storage signed URLs, and audit log tracking.',
    'in_progress',
    3,
    '2026-11-15'
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. DELIVERABLES (Actionable Work Units)
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
    'Idempotent Razorpay Webhook Endpoint Implementation',
    'Validates x-razorpay-signature header against raw body text and updates payment records atomically.',
    'approved',
    'Must handle duplicate payloads without double billing and respond within 200ms.',
    '2026-09-28'
  ),
  (
    '33333333-3333-3333-3333-333333333332',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222223',
    'Encrypted Project File Vault with Signed URLs',
    'Private Supabase Storage bucket with 1-hour HMAC temporary download links.',
    'in_review',
    'Direct public URL access must be rejected with 403 Forbidden.',
    '2026-11-10'
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. PROJECT FILE VAULT (Assets & Specifications)
-- ------------------------------------------------------------------------------
INSERT INTO public.files (
  id,
  project_id,
  file_name,
  storage_path,
  file_size_bytes,
  mime_type,
  category,
  description,
  is_public_to_client
) VALUES 
  (
    '55555555-5555-5555-5555-555555555551',
    '11111111-1111-1111-1111-111111111111',
    'FailureTech-System-Architecture-Spec-v2.pdf',
    '11111111-1111-1111-1111-111111111111/architecture-v2.pdf',
    4285100,
    'application/pdf',
    'specifications',
    'Comprehensive distributed architecture diagram, data flow specifications, and database schema.',
    true
  ),
  (
    '55555555-5555-5555-5555-555555555552',
    '11111111-1111-1111-1111-111111111111',
    'Internal-Security-Penetration-Audit.pdf',
    '11111111-1111-1111-1111-111111111111/security-audit-oct.pdf',
    2150300,
    'application/pdf',
    'deliverables',
    'Agency internal static and dynamic security penetration report with automated scan results.',
    false
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. INVOICES, LINE ITEMS & VERIFIED PAYMENT RECORDS
-- ------------------------------------------------------------------------------
INSERT INTO public.invoices (
  id,
  organization_id,
  project_id,
  invoice_number,
  status,
  subtotal_amount,
  tax_rate,
  tax_amount,
  discount_amount,
  total_amount,
  currency,
  issue_date,
  due_date,
  paid_at,
  notes,
  client_notes
) VALUES 
  (
    '44444444-4444-4444-4444-444444444441',
    '00000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'INV-FT-2026-1042',
    'issued',
    50000.00,
    18.00,
    9000.00,
    0.00,
    59000.00,
    'INR',
    '2026-10-15',
    '2026-11-05',
    null,
    'Sprint 3 Milestone Retainer and Frontend Polish',
    'Payment due within Net 15 days via online Razorpay Checkout or RTGS wire.'
  ),
  (
    '44444444-4444-4444-4444-444444444442',
    '00000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'INV-FT-2026-0985',
    'paid',
    75000.00,
    18.00,
    13500.00,
    3500.00,
    85000.00,
    'INR',
    '2026-09-15',
    '2026-09-30',
    '2026-09-28 14:30:00+05:30',
    'Sprint 2 Core Banking API Architecture & Webhook Implementation',
    'Settled in full via Razorpay Online Payment Gateway.'
  )
ON CONFLICT (id) DO NOTHING;

-- Line items for INV-FT-2026-1042
INSERT INTO public.invoice_items (
  invoice_id,
  description,
  quantity,
  unit_price,
  amount
) VALUES 
  (
    '44444444-4444-4444-4444-444444444441',
    'Sprint 3 Frontend Architecture & Dashboard Polish',
    1.00,
    30000.00,
    30000.00
  ),
  (
    '44444444-4444-4444-4444-444444444441',
    'Supabase RLS Security Hardening & Storage Integration',
    1.00,
    20000.00,
    20000.00
  ),
  -- Line items for INV-FT-2026-0985
  (
    '44444444-4444-4444-4444-444444444442',
    'System Design Blueprint & API Microservices Design',
    1.00,
    45000.00,
    45000.00
  ),
  (
    '44444444-4444-4444-4444-444444444442',
    'Cloud Database Provisioning & High-Availability Clustering',
    1.00,
    30000.00,
    30000.00
  );

-- Payment record for INV-FT-2026-0985
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
  '44444444-4444-4444-4444-444444444442',
  'pay_NLs82JdK9192kL',
  'razorpay',
  85000.00,
  'INR',
  'succeeded',
  '{"payment_method": "upi", "vpa": "acme.finance@okhdfcbank", "bank": "HDFC", "fee": 1700}'::jsonb,
  'order_DBJOWzybf0sJbb',
  'pay_NLs82JdK9192kL',
  '2026-09-28 14:30:00+05:30'
)
ON CONFLICT (transaction_reference) DO NOTHING;

COMMIT;

-- ------------------------------------------------------------------------------
-- HELPER SCRIPT FOR COLLEGE DEMONSTRATION USER ONBOARDING
-- ------------------------------------------------------------------------------
-- After signing up your demo accounts via the portal UI (/signup):
-- Run this snippet in Supabase SQL Editor to map your demo user IDs to their roles:
/*
-- 1. Promote Admin User
UPDATE public.profiles
SET role = 'admin', full_name = 'Kunal (Lead Agency Architect)'
WHERE email = 'admin@failuretech.dev';

-- 2. Link Admin to Agency Core Organization
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT '00000000-0000-0000-0000-000000000001', id, 'owner'
FROM public.profiles WHERE email = 'admin@failuretech.dev'
ON CONFLICT DO NOTHING;

-- 3. Configure Client User
UPDATE public.profiles
SET role = 'client', full_name = 'Alex Morgan (VP of Technology)'
WHERE email = 'client@acme.internal';

-- 4. Link Client User to Acme HyperScale Systems
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT '00000000-0000-0000-0000-000000000002', id, 'member'
FROM public.profiles WHERE email = 'client@acme.internal'
ON CONFLICT DO NOTHING;
*/
