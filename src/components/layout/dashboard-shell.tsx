"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Profile } from "@/types";

interface DashboardShellProps {
  children: React.ReactNode;
  currentUserProfile?: Profile | null;
}

export function DashboardShell({ children, currentUserProfile }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-[#070a12] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Workspace */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header
          currentUser={currentUserProfile || null}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 overflow-y-auto cyber-grid relative">
          {/* Subtle Ambient Glow Lights */}
          <div className="pointer-events-none absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-indigo-600/10 blur-[120px]" />
          <div className="pointer-events-none absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-cyan-600/10 blur-[140px]" />

          {/* Main Dynamic Viewport */}
          <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
