"use client";

import { useState } from "react";
import { Plus, Trash2, X, AlertCircle, Receipt, Loader2, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createInvoiceAction } from "@/lib/invoices/actions";
import { CreateInvoiceInput, CreateInvoiceLineItemInput } from "@/types";

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizations: Array<{ id: string; name: string; slug: string }>;
  projects: Array<{ id: string; title: string; code: string; organization_id: string }>;
}

export function CreateInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
  organizations,
  projects,
}: CreateInvoiceModalProps) {
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15); // Net 15
    return d.toISOString().split("T")[0];
  });
  const [taxRate, setTaxRate] = useState(18);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [status, setStatus] = useState<"issued" | "draft">("issued");

  const [items, setItems] = useState<CreateInvoiceLineItemInput[]>([
    {
      description: "Sprint Engineering Retainer & Milestone Delivery",
      quantity: 1,
      unit_price: 50000,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter projects by chosen organization
  const availableProjects = selectedOrgId
    ? projects.filter((p) => p.organization_id === selectedOrgId)
    : projects;

  // Line item manipulation
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { description: "", quantity: 1, unit_price: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (
    index: number,
    field: keyof CreateInvoiceLineItemInput,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Financial calculations
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0
  );
  const taxAmount = Math.round(subtotal * (Number(taxRate) / 100) * 100) / 100;
  const total = Math.max(0, Math.round((subtotal + taxAmount - Number(discountAmount)) * 100) / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedOrgId) {
      setError("Please select a client organization.");
      return;
    }

    if (!dueDate) {
      setError("Please provide a valid due date.");
      return;
    }

    const invalidItem = items.find((i) => !i.description.trim() || Number(i.quantity) <= 0);
    if (invalidItem) {
      setError("All line items must have a description and a quantity greater than zero.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateInvoiceInput = {
        organization_id: selectedOrgId,
        project_id: selectedProjectId || null,
        currency,
        issue_date: issueDate,
        due_date: dueDate,
        tax_rate: Number(taxRate),
        discount_amount: Number(discountAmount),
        notes: notes.trim() || null,
        client_notes: clientNotes.trim() || null,
        status,
        items,
      };

      const res = await createInvoiceAction(payload);

      if (!res.success) {
        setError(res.error || "Failed to create invoice.");
        setIsSubmitting(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-white my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Create New Invoice</h2>
              <p className="text-xs text-slate-400">
                Generate an itemized invoice for client review and Razorpay settlement.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          {/* Client & Project Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Client Organization <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedOrgId}
                onChange={(e) => {
                  setSelectedOrgId(e.target.value);
                  setSelectedProjectId("");
                }}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select an organization...</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.slug})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Associated Project (Optional)
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">General Retainer / No Project</option>
                {availableProjects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.title} ({proj.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Due Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="INR">INR (₹ - Razorpay Standard)</option>
                <option value="USD">USD ($ - International)</option>
              </select>
            </div>
          </div>

          {/* Line Items Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-200">
                Line Items Breakdown <span className="text-red-400">*</span>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="h-7 text-xs gap-1 border-slate-700 hover:bg-slate-800"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Item</span>
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => {
                const lineTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
                return (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-slate-950 border border-slate-800/80 rounded-lg"
                  >
                    <div className="flex-1 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Item description (e.g. Sprint 2 Front-end deliverable)"
                        value={item.description}
                        onChange={(e) => handleUpdateItem(index, "description", e.target.value)}
                        required
                        className="w-full bg-transparent border-0 px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                      <div className="w-20">
                        <input
                          type="number"
                          placeholder="Qty"
                          min="0.1"
                          step="0.1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(index, "quantity", parseFloat(e.target.value) || 0)
                          }
                          required
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          placeholder="Unit Price"
                          min="0"
                          step="1"
                          value={item.unit_price}
                          onChange={(e) =>
                            handleUpdateItem(index, "unit_price", parseFloat(e.target.value) || 0)
                          }
                          required
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="w-24 text-right font-mono text-xs text-slate-300 font-semibold">
                        {currency} {lineTotal.toLocaleString()}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length <= 1}
                        className="p-1 text-slate-500 hover:text-red-400 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                        title="Remove line item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tax, Discount & Totals Computation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-800">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tax / GST Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Discount Amount ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Notes / Terms (Visible on PDF)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Payment due via Razorpay or bank transfer within Net 15 days."
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Calculations Card */}
            <Card className="p-4 bg-slate-950 border-slate-800 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 pb-2 border-b border-slate-800">
                <Calculator className="h-4 w-4 text-indigo-400" />
                <span>Financial Summary</span>
              </div>

              <div className="space-y-2 py-3 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-white">
                    {currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Tax ({taxRate}%):</span>
                  <span className="font-mono text-white">
                    +{currency} {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount:</span>
                    <span className="font-mono">
                      -{currency} {discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">Total Amount:</span>
                  <span className="text-lg font-mono font-bold text-indigo-400">
                    {currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <label className="text-xs text-slate-400">Initial Status:</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="issued"
                      checked={status === "issued"}
                      onChange={() => setStatus("issued")}
                      className="accent-indigo-500"
                    />
                    <span>Issue Immediately</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="draft"
                      checked={status === "draft"}
                      onChange={() => setStatus("draft")}
                      className="accent-indigo-500"
                    />
                    <span>Save as Draft</span>
                  </label>
                </div>
              </div>
            </Card>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-500 gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4" />
                  <span>{status === "issued" ? "Create & Issue Invoice" : "Save as Draft"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
