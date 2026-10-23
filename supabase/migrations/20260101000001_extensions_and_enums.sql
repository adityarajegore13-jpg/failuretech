-- ==============================================================================
-- Migration: 00001 - Extensions and Domain Enums
-- FailureTech Agency Client Portal
-- ==============================================================================

-- 1. Enable Core PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Domain Enums
-- Global user permission role
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM (
    'admin',        -- FailureTech Agency Executive / Super Admin
    'team_member',  -- FailureTech Agency Staff (Engineers, Architects, PMs)
    'client'        -- External Client stakeholder
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Organization member permission role
DO $$ BEGIN
  CREATE TYPE public.org_role AS ENUM (
    'owner',            -- Organization Primary Owner
    'admin',            -- Organization Administrator
    'member',           -- Standard Stakeholder
    'billing_contact'   -- Authorized Billing & Financial Contact
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Project lifecycle status
DO $$ BEGIN
  CREATE TYPE public.project_status AS ENUM (
    'discovery',
    'in_progress',
    'in_review',
    'completed',
    'on_hold',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Project milestone status
DO $$ BEGIN
  CREATE TYPE public.milestone_status AS ENUM (
    'planned',
    'in_progress',
    'in_review',
    'completed',
    'blocked'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Deliverable tracking status
DO $$ BEGIN
  CREATE TYPE public.deliverable_status AS ENUM (
    'backlog',
    'in_progress',
    'in_review',
    'approved',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Invoice billing status
DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM (
    'draft',
    'issued',
    'paid',
    'overdue',
    'void',
    'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Payment transaction status
DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'succeeded',
    'failed',
    'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- System and portal notification types
DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'project_update',
    'milestone_completed',
    'deliverable_ready',
    'new_comment',
    'invoice_issued',
    'payment_received',
    'system_alert'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
