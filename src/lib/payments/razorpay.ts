import crypto from "crypto";
import Razorpay from "razorpay";

/**
 * Server-only Razorpay Gateway Module for FailureTech Agency Client Portal.
 *
 * CRITICAL SECURITY ASSURANCES:
 * 1. This file must only be executed in server contexts (Server Actions / Route Handlers).
 * 2. RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET are strictly kept server-side.
 * 3. All signature verification uses cryptographically secure HMAC-SHA256 with constant-time equality checks.
 */

export function getRazorpayClient() {
  if (typeof window !== "undefined") {
    throw new Error("FATAL: Razorpay client initialization attempted in browser context.");
  }

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not configured.");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export interface CreateOrderParams {
  amountInPaisa: number; // e.g. 15000.00 -> 1500000
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

/**
 * Creates an authorized Razorpay Order on the server.
 */
export async function createRazorpayOrder({
  amountInPaisa,
  currency = "INR",
  receipt,
  notes = {},
}: CreateOrderParams) {
  const razorpay = getRazorpayClient();

  const options = {
    amount: Math.round(amountInPaisa),
    currency: currency.toUpperCase(),
    receipt: receipt.slice(0, 40), // Razorpay limits receipts to 40 characters
    notes: {
      ...notes,
      platform: "FailureTech Agency Portal",
    },
  };

  const order = await razorpay.orders.create(options);
  return order;
}

/**
 * Verifies Razorpay checkout signature:
 * signature = HMAC_SHA256(order_id + "|" + payment_id, RAZORPAY_KEY_SECRET)
 */
export function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error("RAZORPAY_KEY_SECRET is not configured on the server.");
  }

  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const payload = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  try {
    const expectedBuf = Buffer.from(expectedSignature, "utf-8");
    const receivedBuf = Buffer.from(signature, "utf-8");

    if (expectedBuf.length !== receivedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

/**
 * Verifies Razorpay Webhook signature:
 * signature = HMAC_SHA256(raw_request_body, RAZORPAY_WEBHOOK_SECRET)
 * against header 'x-razorpay-signature'
 */
export function verifyWebhookSignature({
  rawBody,
  signature,
}: {
  rawBody: string;
  signature: string;
}): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured on the server.");
  }

  if (!rawBody || !signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  try {
    const expectedBuf = Buffer.from(expectedSignature, "utf-8");
    const receivedBuf = Buffer.from(signature, "utf-8");

    if (expectedBuf.length !== receivedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}
