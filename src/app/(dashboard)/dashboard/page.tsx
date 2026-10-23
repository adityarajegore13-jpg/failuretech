"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  TrendingUp,
  Receipt,
  ArrowUpRight,
  LifeBuoy,
  GitBranch,
  ShieldCheck,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Plus,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProjectVelocityChart } from "@/components/dashboard/project-velocity-chart";
import { FinancialBreakdownChart } from "@/components/dashboard/financial-breakdown-chart";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { DEMO_DASHBOARD_METRICS, DEMO_PORTAL_USER } from "@/lib/demo-data";

function DashboardNotice() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const notice = searchParams.get("notice");

  if (error === "unauthorized") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 shadow-lg animate-in fade-in duration-200">
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400" />
        <div className="space-y-0.5">
          <p className="font-semibold text-white">Access Clearance Notice</p>
          <p className="text-slate-300">
            Route access was restricted. Super Administrator privileges are required to view the Agency Admin Control Plane. Your session remains securely active in your client portal.
          </p>
        </div>
      </div>
    );
  }

  if (notice === "password_updated") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 shadow-lg animate-in fade-in duration-200">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
        <p className="font-medium text-slate-200">
          Your portal password has been updated successfully.
        </p>
      </div>
    );
  }

  return null;
}

export default function DashboardPage() {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Notice Banner for Route Interception / Updates */}
      <React.Suspense fallback={null}>
        <DashboardNotice />
      </React.Suspense>

      {/* Client Welcome Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0c101d] via-[#11162b] to-[#0d1424] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="purple" dot>
                Sprint 14 in Execution
              </Badge>
              <span className="text-xs text-slate-400">
                Enterprise Retainer SLA Active • 99.98% Guarantee
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {DEMO_PORTAL_USER.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Monitoring high-performance engineering deliverables, sprint milestones, and retainer burnup for{" "}
              <strong className="text-white font-semibold">{DEMO_PORTAL_USER.companyName}</strong>.
            </p>
          </div>

          {/* Quick Action Buttons in Hero */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="text-xs border-slate-700 bg-slate-900/60"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Syncing..." : "Sync Sprints"}</span>
            </Button>
            <Link href="/tickets">
              <Button size="sm" variant="glow" className="text-xs font-semibold">
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>New Ticket</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Primary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {DEMO_DASHBOARD_METRICS.map((metric) => (
          <StatCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Client Quick Operations Bar */}
      <QuickActions />

      {/* Analytical Visualizations Grid (Velocity Chart + Cashflow Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectVelocityChart />
        <FinancialBreakdownChart />
      </div>

      {/* Bottom Section: Recent Projects (2/3 width) and Upcoming Deadlines (1/3 width) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RecentProjects />
        </div>
        <div className="xl:col-span-1">
          <UpcomingDeadlines />
        </div>
      </div>

      {/* System Security & RLS Compliance Footer Pill */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            Database Access: Scoped via PostgreSQL Row Level Security to{" "}
            <strong className="text-slate-200">{DEMO_PORTAL_USER.companyName}</strong> organization ID.
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-emerald-400">● Auth Token Valid</span>
          <span className="text-slate-600">|</span>
          <span className="text-indigo-400">SSL / TLS 1.3</span>
        </div>
      </div>
    </div>
  );
}
