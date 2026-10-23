"use client";

import * as React from "react";
import Link from "next/link";
import {
  Menu,
  Search,
  Bell,
  Plus,
  Radio,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Shield,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { logoutAction } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";

interface HeaderProps {
  onToggleSidebar: () => void;
  currentUser?: Profile | null;
}

const ROLE_LABEL_MAP = {
  admin: { label: "Agency Admin", badgeClass: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" },
  team_member: { label: "Staff Engineer", badgeClass: "bg-purple-500/10 text-purple-300 border-purple-500/20" },
  client: { label: "Client Stakeholder", badgeClass: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20" },
};

export function Header({ onToggleSidebar, currentUser }: HeaderProps) {
  const [profile, setProfile] = React.useState<Profile | null>(currentUser || null);
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  React.useEffect(() => {
    if (currentUser) {
      setProfile(currentUser);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (data) setProfile(data as Profile);
          });
      }
    });
  }, [currentUser]);

  const roleInfo = profile
    ? ROLE_LABEL_MAP[profile.role] || ROLE_LABEL_MAP.client
    : ROLE_LABEL_MAP.client;

  const displayName = profile?.full_name || profile?.email?.split("@")[0] || "Authorized User";
  const displayEmail = profile?.email || "user@failuretech.agency";

  return (
    <header className="sticky top-0 z-30 flex h-18 w-full items-center justify-between border-b border-slate-800/80 bg-[#090d16]/80 px-4 sm:px-6 lg:px-8 backdrop-blur-xl">
      {/* Left: Mobile Menu Toggle & Search / Breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Portal Search */}
        <div className="relative hidden md:block w-72 lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects, tickets, invoices... (Press /)"
            className="w-full rounded-lg border border-slate-800 bg-slate-900/60 pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-400 focus:border-indigo-500/80 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
          />
        </div>

        {/* Production Status Pill */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          <Radio className="h-3 w-3 animate-pulse text-emerald-400" />
          <span>All Agency Services Online</span>
        </div>
      </div>

      {/* Right: Quick Actions, Realtime Notifications, User Pill */}
      <div className="flex items-center gap-3">
        {/* Quick Action Button */}
        <Button
          size="sm"
          variant="glow"
          className="hidden sm:inline-flex text-xs font-semibold"
          onClick={() => {
            window.location.href = "/tickets";
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Ticket</span>
        </Button>

        {/* Realtime Supabase Notification Bell */}
        <NotificationBell currentUser={profile || null} />

        {/* User Profile Pill & Dropdown */}
        <div className="relative pl-2 border-l border-slate-800">
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 cursor-pointer rounded-lg p-1 hover:bg-slate-800/50 transition-colors select-none"
          >
            <Avatar
              name={displayName}
              size="sm"
              isOnline={true}
              className="ring-1 ring-indigo-500/40"
            />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-slate-400 leading-tight">
                {roleInfo.label}
              </span>
            </div>
            <ChevronDown className="hidden md:block h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* User Profile Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-[#090d16]/95 p-3 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="border-b border-slate-800 pb-3 mb-2 px-1">
                <p className="text-xs font-semibold text-white">{displayName}</p>
                <p className="text-[11px] text-slate-400 font-mono truncate">{displayEmail}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border ${roleInfo.badgeClass}`}
                  >
                    <Shield className="h-2.5 w-2.5" /> {roleInfo.label}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">Session Active</span>
                </div>
              </div>

              <div className="space-y-1">
                <Link
                  href="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <Settings className="h-3.5 w-3.5 text-slate-400" />
                  <span>Account & Preferences</span>
                </Link>

                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-left"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out of Portal</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
