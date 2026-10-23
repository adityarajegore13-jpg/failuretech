"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CreateInvoiceInput } from "@/types";
import { InvoiceStatus } from "@/types/database";

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Creates a new invoice with line items, tax, and calculated totals.
 * Restricted strictly to Agency Admins.
 */
export async function createInvoiceAction(
  input: CreateInvoiceInput
): Promise<ActionResponse<{ invoiceId: string; invoiceNumber: string }>> {
  try {
    const supabase = await createClient();

    // 1. Verify user authentication and admin authorization
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required to perform this action." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return {
        success: false,
        error: "Forbidden: Only Agency Admins are authorized to create invoices.",
      };
    }

    // 2. Validate input fields & line items
    if (!input.organization_id) {
      return { success: false, error: "Client organization is required." };
    }

    if (!input.due_date) {
      return { success: false, error: "Due date is required." };
    }

    if (!input.items || input.items.length === 0) {
      return { success: false, error: "An invoice must contain at least one line item." };
    }

    for (const [idx, item] of input.items.entries()) {
      if (!item.description || !item.description.trim()) {
        return { success: false, error: `Line item #${idx + 1} is missing a description.` };
      }
      if (item.quantity <= 0) {
        return { success: false, error: `Line item #${idx + 1} must have a quantity > 0.` };
      }
      if (item.unit_price < 0) {
        return { success: false, error: `Line item #${idx + 1} cannot have a negative unit price.` };
      }
    }

    // 3. Compute accurate financial totals
    const taxRate = Number(input.tax_rate ?? 18);
    const discountAmount = Number(input.discount_amount ?? 0);

    let subtotalAmount = 0;
    const computedItems = input.items.map((item) => {
      const lineTotal = Number(item.quantity) * Number(item.unit_price);
      subtotalAmount += lineTotal;
      return {
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        amount: Math.round(lineTotal * 100) / 100,
      };
    });

    const taxAmount = Math.round(subtotalAmount * (taxRate / 100) * 100) / 100;
    const totalAmount = Math.max(
      0,
      Math.round((subtotalAmount + taxAmount - discountAmount) * 100) / 100
    );

    // 4. Generate unique invoice number if not provided
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = input.invoice_number?.trim() || `INV-FT-${year}-${randomSuffix}`;
    const issueDate = input.issue_date || new Date().toISOString().split("T")[0];
    const status: InvoiceStatus = input.status || "issued";

    // 5. Insert invoice record
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        organization_id: input.organization_id,
        project_id: input.project_id || null,
        invoice_number: invoiceNumber,
        status,
        subtotal_amount: subtotalAmount,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        currency: input.currency?.toUpperCase() || "INR",
        issue_date: issueDate,
        due_date: input.due_date,
        notes: input.notes?.trim() || null,
        client_notes: input.client_notes?.trim() || null,
      })
      .select("id, invoice_number")
      .single();

    if (invoiceError || !invoice) {
      console.error("Failed to insert invoice:", invoiceError);
      return { success: false, error: invoiceError?.message || "Failed to create invoice." };
    }

    // 6. Insert line items
    const itemsToInsert = computedItems.map((item) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.amount,
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(itemsToInsert);

    if (itemsError) {
      console.error("Failed to insert invoice items:", itemsError);
      // Optional: rollback or clean up orphan invoice
      await supabase.from("invoices").delete().eq("id", invoice.id);
      return { success: false, error: "Failed to persist invoice line items." };
    }

    // 7. Dispatch notification to client organization members if issued
    if (status === "issued") {
      const { data: clientMembers } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", input.organization_id);

      if (clientMembers && clientMembers.length > 0) {
        const notifications = clientMembers.map((m) => ({
          user_id: m.user_id,
          type: "invoice_issued" as const,
          title: `New Invoice Issued: ${invoice.invoice_number}`,
          message: `An invoice for ${input.currency || "INR"} ${totalAmount.toLocaleString()} has been issued with due date ${input.due_date}.`,
          link: "/invoices",
          metadata: { invoice_id: invoice.id },
        }));

        await supabase.from("notifications").insert(notifications);
      }
    }

    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
      },
    };
  } catch (err: any) {
    console.error("Unhandled error in createInvoiceAction:", err);
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

/**
 * Updates an invoice status (issued, void, overdue, draft).
 * Restricted to Agency Admins.
 */
export async function updateInvoiceStatusAction(
  invoiceId: string,
  newStatus: InvoiceStatus
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return { success: false, error: "Forbidden: Only Admins can modify invoice statuses." };
    }

    const updatePayload: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === "paid") {
      updatePayload.paid_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("invoices")
      .update(updatePayload)
      .eq("id", invoiceId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update invoice status." };
  }
}

/**
 * Deletes an invoice (only permitted for draft or void invoices).
 */
export async function deleteInvoiceAction(invoiceId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return { success: false, error: "Forbidden: Only Admins can delete invoices." };
    }

    // Verify invoice status
    const { data: invoice } = await supabase
      .from("invoices")
      .select("status, invoice_number")
      .eq("id", invoiceId)
      .single();

    if (!invoice) {
      return { success: false, error: "Invoice not found." };
    }

    if (invoice.status === "paid") {
      return { success: false, error: "Cannot delete an invoice that has already been paid." };
    }

    const { error } = await supabase.from("invoices").delete().eq("id", invoiceId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete invoice." };
  }
}
