import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Razorpay Webhook Endpoint for FailureTech Agency Client Portal.
 *
 * CRITICAL SECURITY ASSURANCES:
 * 1. Signature Verification: Validates `x-razorpay-signature` against the RAW request body
 *    using HMAC-SHA256 with RAZORPAY_WEBHOOK_SECRET.
 * 2. Zero-Trust Processing: Updates payments and invoices server-side regardless of client browser state.
 * 3. Idempotent Execution: Uses `record_verified_razorpay_payment` to safely handle duplicate webhook deliveries.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Read raw text body before any parsing to preserve cryptographic signature exactness
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      console.warn("Razorpay Webhook: Missing 'x-razorpay-signature' header.");
      return NextResponse.json(
        { error: "Missing x-razorpay-signature header" },
        { status: 400 }
      );
    }

    // 2. Cryptographic signature check against RAZORPAY_WEBHOOK_SECRET
    const isValid = verifyWebhookSignature({ rawBody, signature });
    if (!isValid) {
      console.error("Razorpay Webhook SECURITY ALERT: Invalid webhook signature received!");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    // 3. Parse JSON event payload
    const eventPayload = JSON.parse(rawBody);
    const eventType = eventPayload.event;
    console.log(`Razorpay Webhook: Verified event received: "${eventType}"`);

    const adminClient = createAdminClient();

    // 4. Handle 'payment.captured' or 'order.paid'
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const payment = eventPayload.payload?.payment?.entity;
      if (!payment) {
        return NextResponse.json({ error: "Missing payment entity in payload" }, { status: 400 });
      }

      const paymentId = payment.id;
      const orderId = payment.order_id;
      const amount = (Number(payment.amount) || 0) / 100; // convert from minor currency units (paisa)
      const currency = payment.currency || "INR";

      // Look up invoice either via payment notes or razorpay_order_id
      let invoiceId = payment.notes?.invoice_id;

      if (!invoiceId && orderId) {
        const { data: inv } = await (adminClient.from("invoices") as any)
          .select("id")
          .eq("razorpay_order_id", orderId)
          .maybeSingle();

        if (inv && (inv as any).id) {
          invoiceId = (inv as any).id;
        }
      }

      if (!invoiceId) {
        console.warn(`Razorpay Webhook: Could not correlate payment ${paymentId} to any local invoice.`);
        return NextResponse.json({ received: true, note: "Invoice not found for payment" });
      }

      // Idempotently record payment and transition invoice status
      const { data: rpcResult, error: rpcError } = await (adminClient.rpc as any)(
        "record_verified_razorpay_payment",
        {
          p_invoice_id: invoiceId,
          p_payment_id: paymentId,
          p_order_id: orderId || "",
          p_amount: amount,
          p_currency: currency,
          p_metadata: {
            webhook_event_id: eventPayload.id,
            webhook_event: eventType,
            received_at: new Date().toISOString(),
            payment_method: payment.method || "razorpay",
            email: payment.email || null,
            contact: payment.contact || null,
          },
        }
      );

      if (rpcError) {
        console.error("Razorpay Webhook: Error executing payment procedure:", rpcError);
        return NextResponse.json({ error: rpcError.message }, { status: 500 });
      }

      console.log(`Razorpay Webhook: Payment ${paymentId} successfully processed for invoice ${invoiceId}. Result:`, rpcResult);
      return NextResponse.json({ received: true, status: "success", result: rpcResult });
    }

    // 5. Handle 'payment.failed'
    if (eventType === "payment.failed") {
      const payment = eventPayload.payload?.payment?.entity;
      if (payment) {
        console.warn(`Razorpay Webhook: Payment ${payment.id} failed: ${payment.error_description}`);

        const invoiceId = payment.notes?.invoice_id;
        if (invoiceId) {
          // Log failed payment attempt in payment_records for audit trail
          await (adminClient.from("payment_records") as any).insert({
            invoice_id: invoiceId,
            transaction_reference: payment.id,
            payment_method: payment.method || "razorpay",
            amount: (Number(payment.amount) || 0) / 100,
            currency: payment.currency || "INR",
            status: "failed",
            metadata: {
              error_code: payment.error_code,
              error_description: payment.error_description,
              error_reason: payment.error_reason,
            },
          });
        }
      }
      return NextResponse.json({ received: true, status: "payment_failure_logged" });
    }

    // Acknowledge other event types (e.g. refund.processed, etc.)
    return NextResponse.json({ received: true, event: eventType });
  } catch (err: any) {
    console.error("Razorpay Webhook: Unhandled processing error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
