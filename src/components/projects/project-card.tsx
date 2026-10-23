"use client";

import * as React from "react";
import Link from "next/link";
import {
  FolderKanban,
  Calendar,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Users,
  CheckCircle2,
  Clock,
  Edit,
  GitBranch,
  Globe,
  Archive,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectWithOrg } from "@/lib/projects/queries";
import { PriorityLevel, ProjectStatus } from "@/types";

interface ProjectCardProps {
  project: ProjectWithOrg;
  isAdmin: boolean;
  onEdit?: (project: ProjectWithOrg) => void;
}

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; badgeVariant: "purple" | "warning" | "success" | "danger" | "default" }
> = {
  discovery: { label: "Discovery", badgeVariant: "default" },
  in_progress: { label: "In Progress", badgeVariant: "purple" },
  in_review: { label: "In Review", badgeVariant: "warning" },
  completed: { label: "Completed", badgeVariant: "success" },
  on_hold: { label: "On Hold", badgeVariant: "danger" },
  cancelled: { label: "Cancelled", badgeVariant: "danger" },
};

const PRIORITY_CONFIG: Record<
  PriorityLevel,
  { label: string; badgeVariant: "danger" | "warning" | "info" | "default" }
> = {
  urgent: { label: "Urgent", badgeVariant: "danger" },
  high: { label: "High", badgeVariant: "warning" },
  medium: { label: "Medium", badgeVariant: "info" },
  low: { label: "Low", badgeVariant: "default" },
};

export function ProjectCard({ project, isAdmin, onEdit }: ProjectCardProps) {
  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.in_progress;
  const priorityCfg = PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG.medium;

  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 sm:p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/50 hover:bg-slate-900/80 hover:-translate-y-1">
      {/* Ambient background glow on hover */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-40" />

      <div className="space-y-4">
        {/* Top Badges Row */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-md bg-slate-800/90 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300 border border-slate-700/80">
              {project.code}
            </span>

            <Badge variant={statusCfg.badgeVariant} dot>
              {statusCfg.label}
            </Badge>

            <Badge variant={priorityCfg.badgeVariant}>
              {priorityCfg.label}
            </Badge>

            {project.is_archived && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300 border border-amber-500/20">
                <Archive className="h-3 w-3" /> Archived
              </span>
            )}
          </div>

          {/* Admin Edit Trigger */}
          {isAdmin && onEdit && (
            <button
              onClick={() => onEdit(project)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Edit project configuration"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Title & Organization */}
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors leading-tight">
            <Link href={`/projects/${project.id}`}>{project.title}</Link>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
            <span>Client:</span>
            <span className="text-slate-300">{project.organization.name}</span>
          </p>
          {project.description && (
            <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Roadmap Completion</span>
            <span className="font-mono font-bold text-white">{project.progress_percent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              style={{ width: `${project.progress_percent}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                project.progress_percent === 100
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                  : project.progress_percent >= 60
                  ? "bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400"
                  : "bg-gradient-to-r from-indigo-600 to-indigo-400"
              }`}
            />
          </div>
        </div>

        {/* Budget & Target Delivery Metric Strip */}
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-800/80 bg-slate-950/50 p-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
              Budget
            </span>
            <span className="font-mono font-bold text-slate-100 text-sm">
              ${project.budget_total.toLocaleString()} {project.currency}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
              Target Delivery
            </span>
            <span className="font-medium text-slate-200 flex items-center gap-1 mt-0.5 text-xs truncate">
              <Calendar className="h-3 w-3 text-cyan-400 shrink-0" />
              {project.target_delivery_date || "Open Target"}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Strip with Quick Links */}
      <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px]">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
            {project.openDeliverablesCount} tasks
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <Users className="h-3.5 w-3.5 text-cyan-400" />
            {project.membersCount} staff
          </span>
        </div>

        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <span>Project Hub</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}
