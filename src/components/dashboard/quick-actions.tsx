"use client";

import * as React from "react";
import Link from "next/link";
import {
  LifeBuoy,
  FileCheck2,
  Receipt,
  Calendar,
  UserPlus,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  const [feedbackSuccess, setFeedbackSuccess] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);

  const handleDownloadInvoice = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      // Simulate statement download
      alert("Statement FT-STMT-2026-OCT downloaded successfully (PDF).");
    }, 1000);
  };

  const handleQuickFeedback = () => {
    setFeedbackSuccess(true);
    setTimeout(() => setFeedbackSuccess(false), 3000);
  };

  return (
    <Card className="glass-panel border-slate-800/80 p-5 sm:p-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Client Portal Quick Actions</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Instant operations for sprint requests, billing, and team collaboration
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          FailureTech v1.0 • Client Retainer SLA Active
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Action 1: New Ticket */}
        <Link
          href="/tickets"
          className="group flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 hover:border-indigo-500/40 hover:bg-slate-900/80 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
              <LifeBuoy className="h-4 w-4" />
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
              New Ticket
            </p>
            <span className="text-[10px] text-slate-400">24-min response SLA</span>
          </div>
        </Link>

        {/* Action 2: Download Invoice */}
        <button
          onClick={handleDownloadInvoice}
          disabled={downloading}
          className="group flex flex-col justify-between text-left rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 hover:border-cyan-500/40 hover:bg-slate-900/80 hover:shadow-lg transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
              <Receipt className="h-4 w-4" />
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
              {downloading ? "Preparing PDF..." : "Latest Statement"}
            </p>
            <span className="text-[10px] text-slate-400">Oct 2026 Retainer ($18,450)</span>
          </div>
        </button>

        {/* Action 3: Quick Deliverable Feedback */}
        <button
          onClick={handleQuickFeedback}
          className="group flex flex-col justify-between text-left rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 hover:border-emerald-500/40 hover:bg-slate-900/80 hover:shadow-lg transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
              {feedbackSuccess ? <Check className="h-4 w-4 text-emerald-300" /> : <FileCheck2 className="h-4 w-4" />}
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
              {feedbackSuccess ? "Logged to Sprint!" : "Sprint Sign-Off"}
            </p>
            <span className="text-[10px] text-slate-400">Approve deliverables</span>
          </div>
        </button>

        {/* Action 4: Invite Team / Stakeholder */}
        <Link
          href="/admin"
          className="group flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 hover:border-amber-500/40 hover:bg-slate-900/80 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
              <UserPlus className="h-4 w-4" />
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
              Invite Stakeholder
            </p>
            <span className="text-[10px] text-slate-400">Generate access token</span>
          </div>
        </Link>
      </div>
    </Card>
  );
}
