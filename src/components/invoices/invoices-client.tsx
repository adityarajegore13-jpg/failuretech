"use client";

import { useState } from "react";
import {
  Receipt,
  Download,
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Building2,
  Calendar,
  Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InvoiceWithDetails, UserRole } from "@/types";
import { InvoicingStats } from "@/lib/invoices/queries";
import { generateInvoicePDF } from "@/lib/invoices/pdf-generator";
import { CreateInvoiceModal } from "./create-invoice-modal";
import { InvoiceDetailModal } from "./invoice-detail-modal";

interface InvoicesClientProps {
  initialInvoices: InvoiceWithDetails[];
  stats: InvoicingStats;
  userRole?: UserRole;
  organizations: Array<{ id: string; name: string; slug: string }>;
  projects: Array<{ id: string; title: string; code: string; organization_id: string }>;
}

export function InvoicesClient({
  initialInvoices,
  stats,
  userRole = "client",
  organizations,
  projects,
}: InvoicesClientProps) {
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>(initialInvoices);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithDetails | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const isAdmin = userRole === "admin";
  const currency = stats.currency || "INR";

  // Filter invoices based on active tab and search query
  const filteredInvoices = invoices.filter((inv) => {
    // Tab filter
    if (activeTab === "issued" && inv.status !== "issued") return false;
    if (activeTab === "paid" && inv.status !== "paid") return false;
    if (activeTab === "overdue" && inv.status !== "overdue") return false;
    if (activeTab === "draft" && inv.status !== "draft") return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNumber = inv.invoice_number.toLowerCase().includes(q);
      const matchOrg = inv.organization?.name ? inv.organization.name.toLowerCase().includes(q) : false;
      const matchProject = inv.project?.title ? inv.project.title.toLowerCase().includes(q) : false;
      const matchCode = inv.project?.code ? inv.project.code.toLowerCase().includes(q) : false;
      return matchNumber || matchOrg || matchProject || matchCode;
    }

    return true;
  });

  const handleOpenDetail = (inv: InvoiceWithDetails) => {
    setSelectedInvoice(inv);
    setIsDetailOpen(true);
  };

  const handleRefresh = () => {
    // Soft reload the page to refresh server data
    window.location.reload();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="success" dot>Paid</Badge>;
      case "issued":
        return <Badge variant="warning" dot>Issued</Badge>;
      case "overdue":
        return <Badge variant="danger" dot>Overdue</Badge>;
      case "draft":
        return <Badge variant="default">Draft</Badge>;
      case "void":
        return <Badge variant="default">Void</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Receipt className="h-6 w-6 text-indigo-400" />
            Billing & Invoices
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Transparent sprint invoices, retainer balances, and verifiable Razorpay online settlements.
          </p>
        </div>

        {isAdmin && (
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 shadow-lg shadow-indigo-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Create Invoice</span>
          </Button>
        )}
      </div>

      {/* Financial Health Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900 border-slate-800">
          <span className="text-xs text-slate-400">Total Invoiced</span>
          <p className="text-2xl font-bold text-white font-mono mt-1">
            {currency} {stats.totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {invoices.length} total invoice records
          </span>
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-800">
          <span className="text-xs text-slate-400">Settled & Collected</span>
          <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">
            {currency} {stats.totalCollected.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </p>
          <span className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>{stats.paidCount} paid in full</span>
          </span>
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-800">
          <span className="text-xs text-slate-400">Outstanding Balance</span>
          <p className="text-2xl font-bold text-amber-400 font-mono mt-1">
            {currency} {stats.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stats.pendingCount} pending payment
          </span>
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-800">
          <span className="text-xs text-slate-400">Overdue Invoices</span>
          <p className="text-2xl font-bold text-red-400 font-mono mt-1">
            {stats.overdueCount}
          </p>
          <span className="text-[11px] text-red-400/80 mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>Requires settlement action</span>
          </span>
        </Card>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg overflow-x-auto text-xs">
          {[
            { id: "all", label: "All Invoices" },
            { id: "issued", label: "Issued / Due" },
            { id: "paid", label: "Paid" },
            { id: "overdue", label: "Overdue" },
            { id: "draft", label: "Drafts" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by invoice #, client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Invoices List / Table */}
      <Card className="p-0 overflow-hidden bg-slate-900 border-slate-800">
        {filteredInvoices.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Receipt className="h-10 w-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-white">No invoices found</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? "Try refining your search terms." : "No invoices match the selected status filter."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredInvoices.map((inv) => {
              const isPayable = inv.status === "issued" || inv.status === "overdue";
              return (
                <div
                  key={inv.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 hover:bg-slate-800/40 transition-colors gap-4"
                >
                  {/* Left Column: Number, Status, Organization */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-indigo-400">
                        {inv.invoice_number}
                      </span>
                      {getStatusBadge(inv.status)}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-300">
                      <span className="font-semibold text-white flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        {inv.organization?.name || "Client Organization"}
                      </span>
                      {inv.project && (
                        <span className="text-slate-400">
                          • {inv.project.title} ({inv.project.code})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        Issued: {inv.issue_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        Due: {inv.due_date}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Amount & Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="text-right sm:mr-3">
                      <span className="text-base font-mono font-bold text-white block">
                        {inv.currency} {Number(inv.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {inv.items?.length || 1} item{(inv.items?.length || 1) > 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Pay Now Button (if payable) */}
                    {isPayable && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenDetail(inv)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 gap-1 font-semibold"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Pay</span>
                      </Button>
                    )}

                    {/* View Details */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDetail(inv)}
                      className="text-xs h-8 gap-1 border-slate-700 hover:bg-slate-800"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Details</span>
                    </Button>

                    {/* Download PDF */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateInvoicePDF(inv)}
                      className="text-xs h-8 gap-1 border-slate-700 hover:bg-slate-800"
                      title="Download Vector PDF"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">PDF</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modals */}
      <CreateInvoiceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleRefresh}
        organizations={organizations}
        projects={projects}
      />

      <InvoiceDetailModal
        invoice={selectedInvoice}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedInvoice(null);
        }}
        onRefresh={handleRefresh}
        userRole={userRole}
      />
    </div>
  );
}
