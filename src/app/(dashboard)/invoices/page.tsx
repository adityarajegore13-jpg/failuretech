import { Metadata } from "next";
import { InvoicesClient } from "@/components/invoices/invoices-client";
import {
  getInvoices,
  getInvoiceStats,
  getOrganizationsForInvoicing,
  getProjectsForInvoicing,
} from "@/lib/invoices/queries";
import { createClient } from "@/lib/supabase/server";
import { InvoiceWithDetails, UserRole } from "@/types";

export const instant = false;

export const metadata: Metadata = {
  title: "Billing & Invoices | FailureTech Portal",
  description:
    "Review itemized sprint retainers, milestone invoices, and settle online securely via Razorpay.",
};

// Fallback demo invoices if fresh database has no seed records
const DEMO_INVOICES: InvoiceWithDetails[] = [
  {
    id: "demo-inv-1",
    invoice_number: "INV-FT-2026-1042",
    organization_id: "demo-org-1",
    project_id: "demo-proj-1",
    status: "issued",
    subtotal_amount: 50000,
    tax_rate: 18,
    tax_amount: 9000,
    discount_amount: 0,
    total_amount: 59000,
    currency: "INR",
    issue_date: "2026-10-15",
    due_date: "2026-10-30",
    paid_at: null,
    notes: "Sprint 3 Milestone Retainer",
    client_notes: "Payment due within Net 15 via Razorpay Online Checkout.",
    razorpay_order_id: null,
    pdf_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    organization: {
      id: "demo-org-1",
      name: "Acme HyperScale Systems",
      slug: "acme-hyperscale",
    },
    project: {
      id: "demo-proj-1",
      title: "Cloud Edge Modernization",
      code: "CEM",
    },
    items: [
      {
        id: "demo-item-1",
        invoice_id: "demo-inv-1",
        description: "Sprint 3 Frontend Architecture & Dashboard Polish",
        quantity: 1,
        unit_price: 30000,
        amount: 30000,
        created_at: new Date().toISOString(),
      },
      {
        id: "demo-item-2",
        invoice_id: "demo-inv-1",
        description: "Supabase RLS Security Hardening & Storage Integration",
        quantity: 1,
        unit_price: 20000,
        amount: 20000,
        created_at: new Date().toISOString(),
      },
    ],
    payment_records: [],
  },
  {
    id: "demo-inv-2",
    invoice_number: "INV-FT-2026-0985",
    organization_id: "demo-org-1",
    project_id: "demo-proj-1",
    status: "paid",
    subtotal_amount: 75000,
    tax_rate: 18,
    tax_amount: 13500,
    discount_amount: 3500,
    total_amount: 85000,
    currency: "INR",
    issue_date: "2026-09-15",
    due_date: "2026-09-30",
    paid_at: "2026-09-28T14:30:00Z",
    notes: "Sprint 2 Architecture Blueprint & Vector Pipeline",
    client_notes: "Settled via Razorpay UPI.",
    razorpay_order_id: "order_DBJOWzybf0sJbb",
    pdf_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    organization: {
      id: "demo-org-1",
      name: "Acme HyperScale Systems",
      slug: "acme-hyperscale",
    },
    project: {
      id: "demo-proj-1",
      title: "Cloud Edge Modernization",
      code: "CEM",
    },
    items: [
      {
        id: "demo-item-3",
        invoice_id: "demo-inv-2",
        description: "System Design Blueprint & API Microservices Design",
        quantity: 1,
        unit_price: 45000,
        amount: 45000,
        created_at: new Date().toISOString(),
      },
      {
        id: "demo-item-4",
        invoice_id: "demo-inv-2",
        description: "Cloud Database Provisioning & High-Availability Clustering",
        quantity: 1,
        unit_price: 30000,
        amount: 30000,
        created_at: new Date().toISOString(),
      },
    ],
    payment_records: [
      {
        id: "pay-rec-1",
        invoice_id: "demo-inv-2",
        transaction_reference: "pay_NLs82JdK9192kL",
        payment_method: "razorpay",
        amount: 85000,
        currency: "INR",
        status: "succeeded",
        metadata: {},
        razorpay_order_id: "order_DBJOWzybf0sJbb",
        razorpay_payment_id: "pay_NLs82JdK9192kL",
        paid_at: "2026-09-28T14:30:00Z",
        created_at: "2026-09-28T14:30:00Z",
      },
    ],
  },
];

export default async function InvoicesPage() {
  const supabase = await createClient();

  // Determine current user role
  let userRole: UserRole = "admin"; // Default fallback to admin for demo
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role) {
        userRole = profile.role as UserRole;
      }
    }
  } catch {
    // Graceful fallback for unauthenticated previews
  }

  // Fetch real database records
  let invoices = await getInvoices();
  let stats = await getInvoiceStats();
  const organizations = await getOrganizationsForInvoicing();
  const projects = await getProjectsForInvoicing();

  // If no database invoices exist yet, provide realistic demo data
  if (invoices.length === 0) {
    invoices = DEMO_INVOICES;
    stats = {
      totalInvoiced: 144000,
      totalCollected: 85000,
      totalOutstanding: 59000,
      overdueCount: 0,
      paidCount: 1,
      pendingCount: 1,
      currency: "INR",
    };
  }

  return (
    <InvoicesClient
      initialInvoices={invoices}
      stats={stats}
      userRole={userRole}
      organizations={organizations}
      projects={projects}
    />
  );
}
