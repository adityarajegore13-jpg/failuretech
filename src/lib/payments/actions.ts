"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createRazorpayOrder,
  verifyPaymentSignature,
} from "@/lib/payments/razorpay";

export interface CreateOrderResult {
  orderId: string;
  amount: number; // in minor currency units (paisa)
  currency: string;
  keyId: string;
  invoiceNumber: string;
  customerName?: string;
  customerEmail?: string;
}

/**
 * Creates a server-side verified Razorpay Order for an unpaid invoice.
 * Security Checks:
 * - User must be authenticated and authorized for this invoice's organization.
 * - Invoice must be payable (status 'issued' or 'overdue').
 * - Prevents double orders or payments on already-paid invoices.
 */
export async function createRazorpayOrderAction(
  invoiceId: string
): Promise<{ success: boolean; data?: CreateOrderResult; error?: string }> {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Please log in to proceed with payment." };
    }

    // 2. Fetch invoice with organization access verification
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        id,
        invoice_number,
        status,
        total_amount,
        currency,
        organization_id,
        razorpay_order_id,
        organization:organizations(id, name)
      `)
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return { success: false, error: "Invoice not found or access denied." };
    }

    // 3. Ensure invoice is payable
    if (invoice.status === "paid") {
      return { success: false, error: "This invoice has already been fully paid." };
    }

    if (invoice.status === "void" || invoice.status === "draft") {
      return {
        success: false,
        error: `Cannot pay an invoice with status "${invoice.status}".`,
      };
    }

    const totalAmount = Number(invoice.total_amount);
    if (totalAmount <= 0) {
      return { success: false, error: "Invoice total must be greater than zero." };
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    if (!keyId) {
      return {
        success: false,
        error: "Payment gateway key is not configured. Please contact agency support.",
      };
    }

    // Amount in paisa (1 INR = 100 paisa)
    const amountInPaisa = Math.round(totalAmount * 100);
    const currency = invoice.currency || "INR";

    // 4. Create Order on Razorpay via server
    const order = await createRazorpayOrder({
      amountInPaisa,
      currency,
      receipt: invoice.invoice_number,
      notes: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        organization_id: invoice.organization_id,
      },
    });

    // 5. Store razorpay_order_id on invoice
    const adminClient = createAdminClient();
    await (adminClient.from("invoices") as any)
      .update({
        razorpay_order_id: order.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice.id);

    // Get current user profile details for pre-filling checkout
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    return {
      success: true,
      data: {
        orderId: order.id,
        amount: Number(order.amount),
        currency: order.currency,
        keyId,
        invoiceNumber: invoice.invoice_number,
        customerName: profile?.full_name || user.email?.split("@")[0] || "Client",
        customerEmail: user.email || profile?.email || "",
      },
    };
  } catch (err: any) {
    console.error("Error creating Razorpay order:", err);
    return {
      success: false,
      error: err.message || "Failed to initiate payment gateway order.",
    };
  }
}

export interface VerifyPaymentInput {
  invoiceId: string;
  orderId: string;
  paymentId: string;
  signature: string;
}

/**
 * Verifies Razorpay checkout signature and records payment idempotently.
 *
 * CRITICAL SECURITY ARCHITECTURE:
 * - NEVER trusts browser payment success alone.
 * - Enforces cryptographically verified HMAC-SHA256 signature against RAZORPAY_KEY_SECRET.
 * - Idempotently records payment record and marks invoice as 'paid' via atomic database procedure.
 */
export async function verifyPaymentAction({
  invoiceId,
  orderId,
  paymentId,
  signature,
}: VerifyPaymentInput): Promise<{ success: boolean; error?: string; alreadyProcessed?: boolean }> {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required to verify payment." };
    }

    // 2. Validate input fields
    if (!invoiceId || !orderId || !paymentId || !signature) {
      return { success: false, error: "Missing required payment verification parameters." };
    }

    // 3. Cryptographic Signature Verification
    const isValidSignature = verifyPaymentSignature({
      orderId,
      paymentId,
      signature,
    });

    if (!isValidSignature) {
      console.error(`SECURITY ALERT: Invalid Razorpay signature attempt for invoice ${invoiceId}!`);
      return {
        success: false,
        error: "Payment signature verification failed. Untrusted payment attempt rejected.",
      };
    }

    // 4. Fetch invoice amount & currency
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, total_amount, currency")
      .eq("id", invoiceId)
      .single();

    if (!invoice) {
      return { success: false, error: "Invoice record not found." };
    }

    // 5. Execute atomic database procedure to record payment and mark invoice paid
    const adminClient = createAdminClient();
    const { data: result, error: rpcError } = await (adminClient.rpc as any)(
      "record_verified_razorpay_payment",
      {
        p_invoice_id: invoice.id,
        p_payment_id: paymentId,
        p_order_id: orderId,
        p_amount: Number(invoice.total_amount),
        p_currency: invoice.currency || "INR",
        p_metadata: {
          client_verified_at: new Date().toISOString(),
          payment_id: paymentId,
          order_id: orderId,
          verified_by_user_id: user.id,
        },
      }
    );

    if (rpcError) {
      console.error("Error executing record_verified_razorpay_payment RPC:", rpcError);
      return { success: false, error: rpcError.message || "Failed to record payment in database." };
    }

    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    return {
      success: true,
      alreadyProcessed: (result as any)?.already_processed || false,
    };
  } catch (err: any) {
    console.error("Unhandled error in verifyPaymentAction:", err);
    return { success: false, error: err.message || "Payment verification failed." };
  }
}
