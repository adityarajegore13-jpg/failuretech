"use client";

import * as React from "react";
import Link from "next/link";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  ArrowRight,
  ShieldCheck,
  Check,
  FileCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DEMO_UPCOMING_DEADLINES,
  DEMO_PENDING_APPROVALS,
  UpcomingDeadlineItem,
  PendingApprovalItem,
} from "@/lib/demo-data";

const URGENCY_CONFIG = {
  today: {
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    text: "Due Today",
    dot: "bg-rose-400 animate-pulse",
  },
  upcoming: {
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    text: "In 2 Days",
    dot: "bg-amber-400",
  },
  overdue: {
    badge: "bg-rose-600/20 text-rose-400 border-rose-500/40 font-bold",
    text: "Overdue",
    dot: "bg-rose-500 ring-2 ring-rose-500/50",
  },
  next_week: {
    badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    text: "Next Week",
    dot: "bg-indigo-400",
  },
};

export function UpcomingDeadlines() {
  const [activeTab, setActiveTab] = React.useState<"deadlines" | "approvals">("deadlines");
  const [approvedItems, setApprovedItems] = React.useState<string[]>([]);

  const handleApprove = (id: string) => {
    setApprovedItems((prev) => [...prev, id]);
  };

  return (
    <Card className="glass-panel border-slate-800/80 p-5 sm:p-6 shadow-xl">
      {/* Header with Switcher Tabs */}
      <CardHeader className="p-0 pb-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <CardTitle className="text-base font-bold text-white">
              Upcoming Deadlines & Approvals
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-400 mt-0.5">
            Milestones approaching SLA delivery & stakeholder sign-off queue
          </CardDescription>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/60 p-0.5 text-xs">
          <button
            onClick={() => setActiveTab("deadlines")}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              activeTab === "deadlines"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Deadlines ({DEMO_UPCOMING_DEADLINES.length})
          </button>
          <button
            onClick={() => setActiveTab("approvals")}
            className={`rounded-md px-3 py-1 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "approvals"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Approvals</span>
            <span className="rounded-full bg-cyan-500/30 px-1.5 py-0.2 text-[10px] font-bold text-cyan-200">
              {DEMO_PENDING_APPROVALS.length - approvedItems.length}
            </span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-4">
        {/* Tab 1: Upcoming Milestones & Deadlines */}
        {activeTab === "deadlines" && (
          <div className="space-y-3">
            {DEMO_UPCOMING_DEADLINES.map((item) => {
              const urgency = URGENCY_CONFIG[item.urgency];

              return (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border p-3.5 transition-all ${
                    item.urgency === "overdue"
                      ? "border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10"
                      : "border-slate-800/80 bg-slate-900/40 hover:border-slate-700/80 hover:bg-slate-900/70"
                  }`}
                >
                  {/* Left Column: Title & Project */}
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
                        {item.projectCode}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${urgency.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${urgency.dot}`} />
                        {urgency.text}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        {item.dueDate}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-200 truncate">
                      {item.title}
                    </h4>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="text-slate-400">Assignee:</span>
                      <span className="text-slate-300 font-medium">{item.assignee.name}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400">{item.projectTitle}</span>
                    </div>
                  </div>

                  {/* Right Column: Quick Status / Details Button */}
                  <div className="shrink-0 flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <Link
                      href="/tickets"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:border-indigo-500/40 hover:text-white transition-colors"
                    >
                      <span>Help Desk</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Stakeholder Approvals Queue */}
        {activeTab === "approvals" && (
          <div className="space-y-3">
            {DEMO_PENDING_APPROVALS.length === approvedItems.length ? (
              <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                <p className="font-semibold text-white">All Clear! Zero Pending Approvals</p>
                <p className="text-[11px] text-slate-500">
                  You have reviewed and signed off on all sprint deliverables.
                </p>
              </div>
            ) : (
              DEMO_PENDING_APPROVALS.map((item) => {
                const isApproved = approvedItems.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-3.5 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                      isApproved
                        ? "border-emerald-500/30 bg-emerald-500/5 opacity-70"
                        : "border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-mono text-indigo-300 border border-indigo-500/20">
                          {item.deliverableType.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-amber-400 font-medium">
                          Due: {item.dueDate}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-slate-200">
                        {item.title}
                      </h4>

                      <p className="text-[11px] text-slate-400">
                        Submitted by <span className="text-slate-300 font-medium">{item.submittedBy}</span> • {item.submittedAt}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {isApproved ? (
                        <div className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                          <Check className="h-3.5 w-3.5" />
                          <span>Approved & Signed</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="glow"
                          onClick={() => handleApprove(item.id)}
                          className="text-xs font-semibold"
                        >
                          <FileCheck className="h-3.5 w-3.5 mr-1" />
                          <span>Approve & Sign Off</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
