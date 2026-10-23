"use client";

import * as React from "react";
import Link from "next/link";
import {
  FolderKanban,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ExternalLink,
  Search,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { DEMO_PROJECTS_LIST } from "@/lib/demo-data";
import { ProjectStatus } from "@/types";

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeVariant: "success" | "warning" | "purple" | "default" | "danger" }
> = {
  in_progress: { label: "In Progress", badgeVariant: "purple" },
  in_review: { label: "Client Review", badgeVariant: "warning" },
  completed: { label: "Completed", badgeVariant: "success" },
  discovery: { label: "Discovery", badgeVariant: "default" },
  on_hold: { label: "On Hold", badgeVariant: "danger" },
};

export function RecentProjects() {
  const [filter, setFilter] = React.useState<"all" | "in_progress" | "in_review">("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredProjects = DEMO_PROJECTS_LIST.filter((p) => {
    const matchesFilter = filter === "all" ? true : p.status === filter;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <Card className="glass-panel border-slate-800/80 p-5 sm:p-6 shadow-xl">
      {/* Header with Title and Filter Tabs */}
      <CardHeader className="p-0 pb-4 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-indigo-400" />
            <CardTitle className="text-base font-bold text-white">
              Recent Client Projects
            </CardTitle>
            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-500/20">
              {DEMO_PROJECTS_LIST.length} Total
            </span>
          </div>
          <CardDescription className="text-xs text-slate-400 mt-0.5">
            Active deliverable trackers and milestone progress for Acme Global Ltd.
          </CardDescription>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-36 sm:w-44 rounded-lg border border-slate-800 bg-slate-900/80 pl-8 pr-2.5 text-xs text-slate-200 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/60 p-0.5 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === "all"
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("in_progress")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === "in_progress"
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilter("in_review")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === "in_review"
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Review
            </button>
          </div>

          <Link
            href="/projects"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors ml-2"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-4">
        {filteredProjects.length === 0 ? (
          /* Empty State */
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <FolderKanban className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-300">No projects match your filter</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Try adjusting your search query or reset the filter tab to view all active trackers.
            </p>
            <button
              onClick={() => {
                setFilter("all");
                setSearchQuery("");
              }}
              className="text-xs text-indigo-400 hover:underline pt-2 inline-block"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Projects Grid */
          <div className="space-y-3.5">
            {filteredProjects.map((project) => {
              const statusCfg = STATUS_CONFIG[project.status] || {
                label: project.status,
                badgeVariant: "default",
              };

              return (
                <div
                  key={project.id}
                  className="group rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/70 hover:shadow-lg"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left: Code, Title, Lead */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] text-slate-400 font-semibold bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/60">
                          {project.code}
                        </span>
                        <Badge variant={statusCfg.badgeVariant} dot>
                          {statusCfg.label}
                        </Badge>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          Target: <strong className="text-slate-300">{project.deliveryDate}</strong>
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                        <Link href="/projects">{project.title}</Link>
                      </h3>

                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span className="text-slate-400">Engineering Lead:</span>
                        <span className="text-slate-200 font-medium">{project.teamLead.name}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 italic truncate">{project.lastActivity}</span>
                      </p>
                    </div>

                    {/* Center: Tech Stack Badges */}
                    <div className="hidden xl:flex items-center gap-1.5 flex-wrap max-w-xs">
                      {project.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-700/50"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Right: Progress Bar & Deliverables Count */}
                    <div className="w-full lg:w-56 shrink-0 space-y-1.5 border-t lg:border-t-0 border-slate-800 pt-2 lg:pt-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">Sprint Progress</span>
                        <span className="font-mono font-bold text-white text-xs">
                          {project.progressPercent}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/80">
                        <div
                          style={{ width: `${project.progressPercent}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            project.progressPercent === 100
                              ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                              : project.progressPercent >= 75
                              ? "bg-gradient-to-r from-indigo-500 to-cyan-400"
                              : "bg-gradient-to-r from-indigo-600 to-indigo-400"
                          }`}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                        <span>{project.openDeliverablesCount} open deliverables</span>
                        <Link
                          href="/projects"
                          className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-0.5"
                        >
                          Details <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
