import { createClient } from "@/lib/supabase/server";
import { InvoiceWithDetails } from "@/types";

export interface InvoiceFilters {
  status?: string;
  organizationId?: string;
  projectId?: string;
  search?: string;
}

export interface InvoicingStats {
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  overdueCount: number;
  paidCount: number;
  pendingCount: number;
  currency: string;
}

/**
 * Fetches invoices for the authenticated user based on role and organization access.
 */
export async function getInvoices(filters?: InvoiceFilters): Promise<InvoiceWithDetails[]> {
  const supabase = await createClient();

  let query = supabase
    .from("invoices")
    .select(`
      *,
      organization:organizations(id, name, slug),
      project:projects(id, title, code),
      items:invoice_items(*),
      payment_records(*)
    `)
    .order("issue_date", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status as any);
  }

  if (filters?.organizationId) {
    query = query.eq("organization_id", filters.organizationId);
  }

  if (filters?.projectId) {
    query = query.eq("project_id", filters.projectId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }

  let invoices = (data || []) as unknown as InvoiceWithDetails[];

  // Apply client search filter if provided
  if (filters?.search && filters.search.trim()) {
    const s = filters.search.toLowerCase().trim();
    invoices = invoices.filter(
      (inv) =>
        inv.invoice_number.toLowerCase().includes(s) ||
        (inv.organization?.name && inv.organization.name.toLowerCase().includes(s)) ||
        (inv.project?.title && inv.project.title.toLowerCase().includes(s)) ||
        (typeof inv.notes === "string" && inv.notes.toLowerCase().includes(s))
    );
  }

  return invoices;
}

/**
 * Fetches a single invoice with full details (items, organization, project, payment records).
 */
export async function getInvoiceById(id: string): Promise<InvoiceWithDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select(`
      *,
      organization:organizations(id, name, slug),
      project:projects(id, title, code),
      items:invoice_items(*),
      payment_records(*)
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Error fetching invoice by ID:", error);
    return null;
  }

  return data as unknown as InvoiceWithDetails;
}

/**
 * Calculates financial statistics across visible invoices.
 */
export async function getInvoiceStats(): Promise<InvoicingStats> {
  const invoices = await getInvoices();

  let totalInvoiced = 0;
  let totalCollected = 0;
  let totalOutstanding = 0;
  let overdueCount = 0;
  let paidCount = 0;
  let pendingCount = 0;
  const currency = invoices[0]?.currency || "USD";

  const today = new Date().toISOString().split("T")[0];

  for (const inv of invoices) {
    const total = Number(inv.total_amount) || 0;
    totalInvoiced += total;

    if (inv.status === "paid") {
      totalCollected += total;
      paidCount++;
    } else if (inv.status === "overdue" || (inv.status === "issued" && inv.due_date < today)) {
      totalOutstanding += total;
      overdueCount++;
    } else if (inv.status === "issued" || inv.status === "draft") {
      totalOutstanding += total;
      pendingCount++;
    }
  }

  return {
    totalInvoiced,
    totalCollected,
    totalOutstanding,
    overdueCount,
    paidCount,
    pendingCount,
    currency,
  };
}

/**
 * Fetches organizations available for invoice assignment (Admins).
 */
export async function getOrganizationsForInvoicing() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching organizations for invoicing:", error);
    return [];
  }

  return data || [];
}

/**
 * Fetches projects for invoice assignment.
 */
export async function getProjectsForInvoicing(organizationId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("projects")
    .select("id, title, code, organization_id")
    .order("title", { ascending: true });

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching projects for invoicing:", error);
    return [];
  }

  return data || [];
}
