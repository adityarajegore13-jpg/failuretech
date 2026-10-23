"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, SlidersHorizontal, X, Building2, Archive, Layers } from "lucide-react";
import { Organization } from "@/types";

interface ProjectFiltersProps {
  organizations: Organization[];
  isAdmin: boolean;
}

export function ProjectFilters({ organizations, isAdmin }: ProjectFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("q") || "";
  const currentStatus = searchParams.get("status") || "all";
  const currentPriority = searchParams.get("priority") || "all";
  const currentOrg = searchParams.get("org") || "all";
  const currentArchived = searchParams.get("archived") === "true";

  const [searchInput, setSearchInput] = React.useState(currentSearch);

  // Sync state if URL changes externally
  React.useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1"); // Reset pagination on filter change

    Object.entries(updates).forEach(([key, val]) => {
      if (!val || val === "all" || (key === "archived" && val === "false")) {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput });
  };

  const handleReset = () => {
    setSearchInput("");
    router.push(pathname);
  };

  const hasActiveFilters =
    Boolean(currentSearch) ||
    currentStatus !== "all" ||
    currentPriority !== "all" ||
    currentOrg !== "all" ||
    currentArchived;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 shadow-xl backdrop-blur-xl">
      {/* Top Row: Search + Active/Archived Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by title, code, or deliverables... (Press Enter)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                updateFilters({ q: null });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>

        {/* Active vs Archived Toggle */}
        <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/80 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => updateFilters({ archived: null })}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors ${
              !currentArchived
                ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Active Projects</span>
          </button>
          <button
            type="button"
            onClick={() => updateFilters({ archived: "true" })}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors ${
              currentArchived
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Archive className="h-3.5 w-3.5" />
            <span>Archived</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Dropdown Filters & Clear */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
          <SlidersHorizontal className="h-3 w-3" />
          <span>Filters:</span>
        </span>

        {/* Status Filter */}
        <select
          value={currentStatus}
          onChange={(e) => updateFilters({ status: e.target.value })}
          className="rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">All Lifecycle Statuses</option>
          <option value="discovery">Discovery & Architecture</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review (QA)</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Priority Filter */}
        <select
          value={currentPriority}
          onChange={(e) => updateFilters({ priority: e.target.value })}
          className="rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent Escalation</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>

        {/* Organization Filter (Admins only) */}
        {isAdmin && organizations.length > 0 && (
          <select
            value={currentOrg}
            onChange={(e) => updateFilters({ org: e.target.value })}
            className="rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none max-w-[200px] truncate"
          >
            <option value="all">All Client Organizations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-[11px] font-medium text-rose-400 hover:text-rose-300 ml-auto px-2 py-1 rounded hover:bg-rose-500/10 transition-colors"
          >
            <X className="h-3 w-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
