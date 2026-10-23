"use client";

import { useState } from "react";
import {
  X,
  Download,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  FolderGit2,
  Calendar,
  Loader2,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { InvoiceWithDetails, UserRole } from "@/types";
import { generateInvoicePDF } from "@/lib/invoices/pdf-generator";
import { createRazorpayOrderAction, verifyPaymentAction } from "@/lib/payments/actions";
import { updateInvoiceStatusAction } from "@/lib/invoices/actions";
import { InvoiceStatus } from "@/types/database";

interface InvoiceDetailModalProps {
  invoice: InvoiceWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  userRole?: UserRole;
}

// Dynamically inject Razorpay Checkout SDK
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function InvoiceDetailModal({
  invoice,
  isOpen,
  onClose,
  onRefresh,
  userRole = "client",
}: InvoiceDetailModalProps) {
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!isOpen || !invoice) return null;

  const isAdmin = userRole === "admin";
  const isPaid = invoice.status === "paid";
  const isPayable = invoice.status === "issued" || invoice.status === "overdue";

  // Trigger Razorpay Checkout flow
  const handlePayWithRazorpay = async () => {
    setErrorMessage(null);
    setPaymentSuccess(null);
    setIsPaying(true);

    try {
      // 1. Ensure Razorpay client checkout script is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setErrorMessage("Failed to load Razorpay payment gateway script. Please check your network connection.");
        setIsPaying(false);
        return;
      }

      // 2. Request server to create verified order
      const orderRes = await createRazorpayOrderAction(invoice.id);
      if (!orderRes.success || !orderRes.data) {
        setErrorMessage(orderRes.error || "Could not initiate payment order with gateway.");
        setIsPaying(false);
        return;
      }

      const orderData = orderRes.data;

      // 3. Configure Razorpay modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "FailureTech Agency",
        description: `Invoice ${orderData.invoiceNumber}`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.customerName,
          email: orderData.customerEmail,
        },
        theme: {
          color: "#4f46e5", // indigo-600
        },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
          },
        },
        // 4. Server-Side Signature Verification handler
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await verifyPaymentAction({
              invoiceId: invoice.id,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              setPaymentSuccess(
                `Payment verified and settled! Reference: ${response.razorpay_payment_id}`
              );
              onRefresh();
            } else {
              setErrorMessage(
                verifyRes.error || "Payment verification failed. Please contact agency support."
              );
            }
          } catch (err: any) {
            setErrorMessage(err.message || "Failed to verify transaction with server.");
          } finally {
            setIsPaying(false);
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (failedRes: any) => {
        setErrorMessage(`Payment failed: ${failedRes.error?.description || "Gateway transaction declined."}`);
        setIsPaying(false);
      });

      rzp.open();
    } catch (err: any) {
      setErrorMessage(err.message || "Unexpected payment initiation error.");
      setIsPaying(false);
    }
  };

  const handleAdminStatusChange = async (newStatus: InvoiceStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await updateInvoiceStatusAction(invoice.id, newStatus);
      if (res.success) {
        onRefresh();
      } else {
        setErrorMessage(res.error || "Failed to update status.");
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = () => {
    switch (invoice.status) {
      case "paid":
        return <Badge variant="success" dot>Paid</Badge>;
      case "issued":
        return <Badge variant="warning" dot>Issued / Due</Badge>;
      case "overdue":
        return <Badge variant="danger" dot>Overdue</Badge>;
      case "draft":
        return <Badge variant="default">Draft</Badge>;
      case "void":
        return <Badge variant="default">Void</Badge>;
      default:
        return <Badge>{invoice.status}</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-white my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-base font-bold text-indigo-400">
                {invoice.invoice_number}
              </span>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-slate-500" />
              <span>{invoice.organization?.name || "Client Organization"}</span>
              {invoice.project && (
                <>
                  <span className="text-slate-600">•</span>
                  <FolderGit2 className="h-3.5 w-3.5 text-slate-500" />
                  <span>{invoice.project.title}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateInvoicePDF(invoice)}
              className="h-8 text-xs gap-1.5 border-slate-700 hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF</span>
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {paymentSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{paymentSuccess}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Invoice Summary Dates Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 p-3.5 bg-slate-950 border border-slate-800/80 rounded-lg text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Issue Date</span>
            <span className="font-medium text-white flex items-center gap-1.5 mt-0.5">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              {invoice.issue_date}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Due Date</span>
            <span className="font-medium text-white flex items-center gap-1.5 mt-0.5">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              {invoice.due_date}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Settlement</span>
            <span className="font-medium text-white mt-0.5 block">
              {isPaid
                ? invoice.paid_at
                  ? new Date(invoice.paid_at).toLocaleDateString()
                  : "Paid"
                : "Unpaid"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Total Due</span>
            <span className="font-mono font-bold text-indigo-400 text-sm mt-0.5 block">
              {invoice.currency} {Number(invoice.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mt-6">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Itemized Services
          </h3>
          <div className="border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                <tr>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {(!invoice.items || invoice.items.length === 0) ? (
                  <tr>
                    <td className="py-2.5 px-3">Sprint Retainer & Engineering Services</td>
                    <td className="py-2.5 px-3 text-right font-mono">1.00</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {invoice.currency} {Number(invoice.subtotal_amount).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">
                      {invoice.currency} {Number(invoice.subtotal_amount).toLocaleString()}
                    </td>
                  </tr>
                ) : (
                  invoice.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 text-white">{item.description}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        {Number(item.quantity).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        {invoice.currency} {Number(item.unit_price).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-white">
                        {invoice.currency} {Number(item.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="flex justify-end mt-4">
          <div className="w-full sm:w-72 space-y-2 text-xs p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono text-white">
                {invoice.currency} {Number(invoice.subtotal_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Tax ({invoice.tax_rate ?? 18}%):</span>
              <span className="font-mono text-white">
                +{invoice.currency} {Number(invoice.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            {Number(invoice.discount_amount) > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount:</span>
                <span className="font-mono">
                  -{invoice.currency} {Number(invoice.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline font-bold">
              <span className="text-white text-sm">Grand Total:</span>
              <span className="text-base font-mono text-indigo-400">
                {invoice.currency} {Number(invoice.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History / Audit Trail */}
        {invoice.payment_records && invoice.payment_records.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Payment Records (Settlement Audit)</span>
            </h3>
            <div className="space-y-2">
              {invoice.payment_records.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-mono text-indigo-400 block">{rec.transaction_reference}</span>
                    <span className="text-[11px] text-slate-400">
                      Method: {rec.payment_method.toUpperCase()} •{" "}
                      {rec.paid_at ? new Date(rec.paid_at).toLocaleString() : rec.created_at}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-semibold text-white block">
                      {rec.currency} {Number(rec.amount).toLocaleString()}
                    </span>
                    <Badge variant={rec.status === "succeeded" ? "success" : "danger"}>
                      {rec.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-800">
          {/* Admin Status Overrides */}
          {isAdmin ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Admin Status:</span>
              <select
                value={invoice.status}
                disabled={isUpdatingStatus}
                onChange={(e) => handleAdminStatusChange(e.target.value as InvoiceStatus)}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="draft">Draft</option>
                <option value="issued">Issued</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="void">Void</option>
              </select>
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>

            {isPayable && (
              <Button
                size="sm"
                onClick={handlePayWithRazorpay}
                disabled={isPaying}
                className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 font-semibold shadow-lg shadow-indigo-600/20"
              >
                {isPaying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    <span>Pay with Razorpay ({invoice.currency} {Number(invoice.total_amount).toLocaleString()})</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
