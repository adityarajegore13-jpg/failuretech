import { jsPDF } from "jspdf";
import { InvoiceWithDetails } from "@/types";

/**
 * Generates an agency-grade PDF invoice using jsPDF.
 * Creates an exact, crisp vector layout with branding, itemization, and tax details.
 */
export function generateInvoicePDF(invoice: InvoiceWithDetails) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // --- BRAND HEADER BAR ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 36, "F");

  // Accent line
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.rect(0, 35, pageWidth, 1.5, "F");

  // Agency Brand
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("FAILURETECH AGENCY", margin, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("High-Performance Engineering & Digital Client Hub", margin, 23);
  doc.text("support@failuretech.dev | https://failuretech.dev", margin, 28);

  // Invoice Number Title (Right side header)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("INVOICE", pageWidth - margin, 16, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(129, 140, 248); // indigo-400
  doc.text(invoice.invoice_number, pageWidth - margin, 23, { align: "right" });

  // Status Badge
  let badgeColor = [245, 158, 11]; // amber-500 (Issued / Pending)
  let badgeText = "PAYMENT DUE";

  if (invoice.status === "paid") {
    badgeColor = [16, 185, 129]; // emerald-500
    badgeText = "PAID - THANK YOU";
  } else if (invoice.status === "overdue") {
    badgeColor = [239, 68, 68]; // red-500
    badgeText = "OVERDUE";
  } else if (invoice.status === "draft") {
    badgeColor = [100, 116, 139]; // slate-500
    badgeText = "DRAFT INVOICE";
  }

  doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.roundedRect(pageWidth - margin - 35, 26, 35, 6, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(badgeText, pageWidth - margin - 17.5, 30.2, { align: "center" });

  // --- BILLING METADATA SECTION ---
  let y = 48;

  // Left Column: Client Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("BILLED TO:", margin, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  const clientName = invoice.organization?.name || "Client Organization";
  doc.text(clientName, margin, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  if (invoice.project) {
    doc.text(`Project: ${invoice.project.title} (${invoice.project.code})`, margin, y + 11);
  } else {
    doc.text("Retainer / Advisory Services", margin, y + 11);
  }

  // Right Column: Dates & Payment Terms
  const rightColX = pageWidth - margin - 60;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("INVOICE DETAILS:", rightColX, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Issue Date: ${invoice.issue_date}`, rightColX, y + 5);
  doc.text(`Due Date: ${invoice.due_date}`, rightColX, y + 10);
  doc.text(`Currency: ${invoice.currency}`, rightColX, y + 15);

  // --- LINE ITEMS TABLE ---
  y = 75;

  // Table Header
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(margin, y, contentWidth, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("#", margin + 3, y + 5.5);
  doc.text("DESCRIPTION", margin + 12, y + 5.5);
  doc.text("QTY", margin + 105, y + 5.5, { align: "right" });
  doc.text("UNIT PRICE", margin + 138, y + 5.5, { align: "right" });
  doc.text("AMOUNT", margin + contentWidth - 3, y + 5.5, { align: "right" });

  y += 8;

  // Table Body
  const items = invoice.items || [];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  if (items.length === 0) {
    doc.setTextColor(100, 116, 139);
    doc.text("General Engineering & Milestone Retainer", margin + 12, y + 6);
    doc.text("1.00", margin + 105, y + 6, { align: "right" });
    doc.text(`${invoice.currency} ${Number(invoice.subtotal_amount).toFixed(2)}`, margin + 138, y + 6, { align: "right" });
    doc.text(`${invoice.currency} ${Number(invoice.subtotal_amount).toFixed(2)}`, margin + contentWidth - 3, y + 6, { align: "right" });
    y += 10;
  } else {
    items.forEach((item, index) => {
      // Row zebra background
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(margin, y, contentWidth, 8, "F");
      }

      doc.setTextColor(71, 85, 105);
      doc.text(String(index + 1), margin + 3, y + 5.5);
      doc.text(item.description, margin + 12, y + 5.5);
      doc.text(Number(item.quantity).toFixed(2), margin + 105, y + 5.5, { align: "right" });
      doc.text(`${invoice.currency} ${Number(item.unit_price).toFixed(2)}`, margin + 138, y + 5.5, { align: "right" });
      doc.text(`${invoice.currency} ${Number(item.amount).toFixed(2)}`, margin + contentWidth - 3, y + 5.5, { align: "right" });

      // Subtle bottom line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, y + 8, margin + contentWidth, y + 8);

      y += 8;
    });
  }

  // --- FINANCIAL TOTALS SUMMARY (Right aligned box) ---
  y += 6;
  const summaryX = pageWidth - margin - 70;
  const summaryWidth = 70;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  // Subtotal
  doc.text("Subtotal:", summaryX, y);
  doc.text(`${invoice.currency} ${Number(invoice.subtotal_amount).toFixed(2)}`, pageWidth - margin, y, { align: "right" });
  y += 5.5;

  // Tax
  const taxRate = Number(invoice.tax_rate ?? 18);
  doc.text(`Tax / GST (${taxRate}%):`, summaryX, y);
  doc.text(`${invoice.currency} ${Number(invoice.tax_amount).toFixed(2)}`, pageWidth - margin, y, { align: "right" });
  y += 5.5;

  // Discount
  if (Number(invoice.discount_amount) > 0) {
    doc.text("Discount:", summaryX, y);
    doc.text(`-${invoice.currency} ${Number(invoice.discount_amount).toFixed(2)}`, pageWidth - margin, y, { align: "right" });
    y += 5.5;
  }

  // Grand Total Box
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(summaryX - 4, y, summaryWidth + 4, 9, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("Total Due:", summaryX, y + 6.2);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text(`${invoice.currency} ${Number(invoice.total_amount).toFixed(2)}`, pageWidth - margin, y + 6.2, { align: "right" });

  y += 18;

  // --- PAYMENT DETAILS & AUDIT SECTION ---
  if (invoice.status === "paid") {
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "F");
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "D");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(6, 95, 70); // emerald-800
    doc.text("PAYMENT RECEIPT CONFIRMATION", margin + 4, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(4, 120, 87);
    const paidDate = invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString() : "Confirmed";
    const paymentRec = invoice.payment_records?.[0];
    const txnRef = paymentRec?.transaction_reference || invoice.razorpay_order_id || "Direct Gateway Transaction";
    doc.text(`Settlement Status: Fully Settled on ${paidDate}`, margin + 4, y + 11);
    doc.text(`Gateway Reference: ${txnRef} (Razorpay Verified)`, margin + 4, y + 15);
    y += 24;
  } else {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "F");
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "D");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text("PAYMENT INSTRUCTIONS", margin + 4, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text("1. Online Checkout: Pay instantly via Razorpay UPI / Credit Card in the FailureTech Portal.", margin + 4, y + 11);
    doc.text(`2. Due Date: Please settle before ${invoice.due_date} to prevent sprint delays.`, margin + 4, y + 15);
    y += 24;
  }

  // Notes
  if (invoice.notes || invoice.client_notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("NOTES & TERMS:", margin, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const noteText = invoice.client_notes || invoice.notes || "";
    doc.text(noteText, margin, y + 4.5, { maxWidth: contentWidth });
  }

  // --- FOOTER ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "FailureTech Agency Client Portal • Automated Accounting System • Generated on " +
      new Date().toLocaleDateString(),
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  // Trigger browser download
  doc.save(`Invoice-${invoice.invoice_number}.pdf`);
}
