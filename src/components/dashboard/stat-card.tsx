"use client";

import * as React from "react";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { DashboardMetric } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const ICON_MAP = {
  FolderKanban,
  CheckCircle2,
  Clock,
  Receipt,
  AlertTriangle,
};

const THEME_STYLES = {
  indigo: {
    border: "border-indigo-500/30 hover:border-indigo-500/50",
    bg: "from-indigo-950/20 via-slate-900/60 to-slate-950",
    glow: "bg-indigo-500/10",
    iconBox: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30 shadow-indigo-500/10",
    badge: "text-indigo-300 bg-indigo-500/10 border-indigo-500/20",
    valueText: "text-white",
    indicator: "bg-indigo-400",
  },
  emerald: {
    border: "border-emerald-500/30 hover:border-emerald-500/50",
    bg: "from-emerald-950/20 via-slate-900/60 to-slate-950",
    glow: "bg-emerald-500/10",
    iconBox: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/10",
    badge: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    valueText: "text-white",
    indicator: "bg-emerald-400",
  },
  amber: {
    border: "border-amber-500/30 hover:border-amber-500/50",
    bg: "from-amber-950/20 via-slate-900/60 to-slate-950",
    glow: "bg-amber-500/10",
    iconBox: "text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-amber-500/10",
    badge: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    valueText: "text-white",
    indicator: "bg-amber-400",
  },
  cyan: {
    border: "border-cyan-500/30 hover:border-cyan-500/50",
    bg: "from-cyan-950/20 via-slate-900/60 to-slate-950",
    glow: "bg-cyan-500/10",
    iconBox: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30 shadow-cyan-500/10",
    badge: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
    valueText: "text-white",
    indicator: "bg-cyan-400",
  },
  rose: {
    border: "border-rose-500/40 hover:border-rose-500/60",
    bg: "from-rose-950/20 via-slate-900/60 to-slate-950",
    glow: "bg-rose-500/15",
    iconBox: "text-rose-400 bg-rose-500/10 border-rose-500/30 shadow-rose-500/20",
    badge: "text-rose-300 bg-rose-500/10 border-rose-500/30",
    valueText: "text-white",
    indicator: "bg-rose-400",
  },
};

interface StatCardProps {
  metric: DashboardMetric;
  isLoading?: boolean;
}

export function StatCard({ metric, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <Card className="glass-panel border-slate-800 p-5 space-y-3 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 bg-slate-800 rounded" />
          <div className="h-8 w-8 bg-slate-800 rounded-lg" />
        </div>
        <div className="h-8 w-16 bg-slate-800 rounded mt-2" />
        <div className="h-3 w-32 bg-slate-800 rounded" />
      </Card>
    );
  }

  const theme = THEME_STYLES[metric.colorTheme] || THEME_STYLES.indigo;
  const Icon = ICON_MAP[metric.iconName] || FolderKanban;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300",
        "bg-gradient-to-b shadow-xl hover:-translate-y-0.5",
        theme.border,
        theme.bg
      )}
      role="region"
      aria-label={`${metric.title}: ${metric.value}`}
    >
      {/* Ambient background light */}
      <div
        className={cn(
          "pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-60",
          theme.glow
        )}
      />

      {/* Top Row: Title + Icon */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("h-1.5 w-1.5 rounded-full", theme.indicator)} />
          <span className="text-xs font-semibold tracking-wide text-slate-300 uppercase">
            {metric.title}
          </span>
        </div>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl border p-2 shadow-sm transition-transform duration-300 group-hover:scale-110",
            theme.iconBox
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {/* Center: Main Stat Value */}
      <div className="relative z-10 mt-3 flex items-baseline gap-2.5">
        <span className={cn("text-3xl font-extrabold tracking-tight font-mono", theme.valueText)}>
          {metric.value}
        </span>

        {metric.badgeText && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium border tracking-wide",
              theme.badge
            )}
          >
            {metric.badgeText}
          </span>
        )}
      </div>

      {/* Footer Row: Change Context & Subtitle */}
      <div className="relative z-10 mt-3 flex flex-col gap-1 border-t border-slate-800/60 pt-2.5 text-xs">
        <div className="flex items-center gap-1.5 font-medium">
          {metric.trend === "up" && (
            <span className="flex items-center text-emerald-400 font-medium">
              <ArrowUpRight className="h-3.5 w-3.5" />
              {metric.change}
            </span>
          )}
          {metric.trend === "down" && (
            <span className="flex items-center text-rose-400 font-medium">
              <ArrowDownRight className="h-3.5 w-3.5" />
              {metric.change}
            </span>
          )}
          {metric.trend === "alert" && (
            <span className="flex items-center text-amber-400 font-medium">
              <AlertTriangle className="h-3.5 w-3.5 mr-0.5" />
              {metric.change}
            </span>
          )}
          {metric.trend === "neutral" && (
            <span className="flex items-center text-slate-300 font-medium">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400 mr-0.5" />
              {metric.change}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          {metric.subtitle}
        </p>
      </div>
    </Card>
  );
}
