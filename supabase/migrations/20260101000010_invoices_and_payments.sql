-- ==============================================================================
-- FailureTech Agency Client Portal - Invoices, Line Items & Payments Migration
-- Migration: 20260101000010_invoices_and_payments.sql
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
