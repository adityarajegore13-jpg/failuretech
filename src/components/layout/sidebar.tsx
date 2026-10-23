"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  LifeBuoy,
  Receipt,
  Settings,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  X,
  LogOut,
} from "lucide-react";
import { MAIN_NAVIGATION, NavigationItem } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICON_MAP = {
  LayoutDashboard,
  FolderKanban,
  LifeBuoy,
  Receipt,
  Settings,
  ShieldAlert,
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800/80 bg-[#090d16]/95 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand & Portal Identity */}
        <div className="flex h-18 items-center justify-between border-b border-slate-800/80 px-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
              <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#090d16]">
                <ShieldAlert className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-white flex items-center gap-1.5 text-base">
                Failure<span className="text-indigo-400">Tech</span>
                <span className="rounded bg-indigo-500/10 px-1.5 py-0.2 text-[10px] font-mono text-indigo-300 border border-indigo-500/20">
                  PORTAL
                </span>
              </span>
              <span className="text-[11px] font-medium text-slate-400 tracking-wide">
                Agency Client Hub
              </span>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close Sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Client Workspace Badge */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/60 p-3 hover:border-slate-700/80 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200">Acme Global Ltd.</span>
                <span className="text-[10px] text-slate-400">Enterprise Retainer Plan</span>
              </div>
            </div>
            <Sparkles className="h-4 w-4 text-cyan-400 opacity-80" />
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Platform Navigation
          </div>
          <nav className="space-y-1">
            {MAIN_NAVIGATION.map((item: NavigationItem) => {
              const Icon = ICON_MAP[item.iconName as keyof typeof ICON_MAP] || LayoutDashboard;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={cn(
                    "group relative flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-950"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  )}
                >
                  {/* Left accent bar on active */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-indigo-500 shadow-sm shadow-indigo-400" />
                  )}

                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-transform group-hover:scale-110",
                        isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"
                      )}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide",
                        isActive
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700/60"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* System & SLA Status Footer */}
        <div className="border-t border-slate-800/80 p-4">
          <div className="rounded-xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-950 p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-medium flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                SLA Guarantee
              </span>
              <span className="font-mono text-emerald-400 font-semibold">99.98%</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 leading-snug">
              All FailureTech engineering nodes and delivery pipelines are green.
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2 text-[11px]">
              <span className="text-slate-400">Sprint 14 • Milestone 2</span>
              <Link
                href="/tickets"
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 font-medium"
              >
                Help Desk <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <form action="/auth/signout" method="POST" className="mt-3">
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-400 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out Session</span>
            </Link>
          </form>
        </div>
      </aside>
    </>
  );
}
