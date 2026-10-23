import * as React from "react";
import {
  ShieldAlert,
  Users,
  Building2,
  MailCheck,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles,
  Server,
  Layers,
  ArrowRight,
  Shield,
} from "lucide-react";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InviteUserForm } from "@/components/admin/invite-user-form";
import { Organization, Invitation } from "@/types";

export const instant = false;

export const metadata = {
  title: "Agency Admin Command Center | FailureTech Portal",
  description: "Manage tenant organizations, invite client stakeholders, and review security policies.",
};

export default async function AdminDashboardPage() {
  // 1. Enforce Server-Side Authorization: Admin role required
  const { user, profile } = await requireRole(["admin"], "/dashboard");

  const supabase = await createClient();

  // 2. Fetch Organizations
  const { data: rawOrgs } = await supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });

  const organizations: Organization[] = rawOrgs || [];

  // 3. Fetch Invitations
  const { data: rawInvs } = await supabase
    .from("invitations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const invitations: Invitation[] = rawInvs || [];

  // 4. Fetch User Count & Distribution
  const { data: rawProfiles } = await supabase.from("profiles").select("id, role");
  const totalProfiles = rawProfiles?.length || 0;
  const adminCount = rawProfiles?.filter((p) => p.role === "admin").length || 0;
  const teamCount = rawProfiles?.filter((p) => p.role === "team_member").length || 0;
  const clientCount = rawProfiles?.filter((p) => p.role === "client").length || 0;

  // 5. Fetch Projects Count
  const { count: projectCount } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true });

  const pendingInvitations = invitations.filter((inv) => inv.status === "pending").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Title & Super Admin Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400">
              Agency Master Control Plane
            </span>
            <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-300 border border-rose-500/30">
              ROLE: SUPER_ADMIN
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShieldAlert className="h-7 w-7 text-indigo-400" />
            Agency Administrator Command Center
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Multi-tenant organization management, client provisioning, and database access enforcement
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
            {profile.full_name?.slice(0, 2).toUpperCase() || "AD"}
          </div>
          <div className="text-left text-xs">
            <p className="font-semibold text-slate-200">{profile.full_name || "Administrator"}</p>
            <p className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
              {profile.email}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Organizations */}
        <Card className="glass-panel border-slate-800/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Client Organizations</span>
            <Building2 className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{organizations.length}</span>
            <span className="text-[11px] text-emerald-400 font-medium">Multi-tenant</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Partitioned via PostgreSQL RLS</p>
        </Card>

        {/* Total Registered Users */}
        <Card className="glass-panel border-slate-800/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total User Profiles</span>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{totalProfiles}</span>
            <span className="text-[11px] text-slate-400">
              ({adminCount} admin • {teamCount} team • {clientCount} client)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Synchronized with Supabase Auth</p>
        </Card>

        {/* Active Projects */}
        <Card className="glass-panel border-slate-800/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Enterprise Projects</span>
            <Layers className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{projectCount || 0}</span>
            <span className="text-[11px] text-emerald-400 font-medium">Active Trackers</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Scoped by organization membership</p>
        </Card>

        {/* Pending Invitations */}
        <Card className="glass-panel border-slate-800/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pending Invitations</span>
            <MailCheck className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{pendingInvitations}</span>
            <span className="text-[11px] text-amber-400 font-medium">Awaiting Claim</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">7-day TTL token expiration</p>
        </Card>
      </div>

      {/* Main Action Section: Generate Invitation Flow */}
      <Card className="glass-panel border-slate-800/90 shadow-2xl p-6 sm:p-7">
        <CardHeader className="p-0 pb-5 border-b border-slate-800/80 mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <CardTitle className="text-lg font-bold text-white">
              Issue Client or Team Invitation
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-400 mt-1">
            Generate an enterprise onboarding token bound to an organization and role. Tokens are validated via PostgreSQL <code className="text-indigo-300 font-mono">verify_invitation()</code>.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <InviteUserForm organizations={organizations} />
        </CardContent>
      </Card>

      {/* Tables Row: Recent Invitations & Organizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invitations Table (2 Cols) */}
        <div className="lg:col-span-2">
          <Card className="glass-panel border-slate-800/80 p-5 sm:p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  Recent Invitation Tokens
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track cryptographic onboarding tokens and current claims
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {invitations.length} total tokens
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              {invitations.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No invitations generated yet. Use the form above to dispatch your first invite.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="pb-3 font-semibold">Recipient</th>
                      <th className="pb-3 font-semibold">Role</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Expires</th>
                      <th className="pb-3 font-semibold text-right">Access Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {invitations.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3">
                          <p className="font-medium text-slate-200">{inv.email}</p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {inv.id.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1 rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700/60">
                            {inv.role}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                              inv.status === "accepted"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : inv.status === "pending"
                                ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 text-[11px] text-slate-400">
                          {new Date(inv.expires_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right">
                          <a
                            href={`/accept-invitation?token=${inv.token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                          >
                            <span>Test URL</span>
                            <ArrowRight className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>

        {/* Security & RLS Status (1 Col) */}
        <div className="space-y-6">
          <Card className="glass-panel border-slate-800/80 p-5 sm:p-6">
            <h2 className="text-base font-semibold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Lock className="h-4 w-4 text-emerald-400" />
              Database RLS Enforcement
            </h2>
            <div className="mt-3 space-y-3 text-xs">
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between text-slate-200 font-medium">
                  <span>is_admin()</span>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Unrestricted oversight on profiles, organizations, and global audit logs.
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between text-slate-200 font-medium">
                  <span>is_agency_team()</span>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Enforces engineering team access to client deliverables, sprints, and tickets.
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between text-slate-200 font-medium">
                  <span>can_access_project()</span>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Isolates client tenants so clients can only view projects in their organization.
                </p>
              </div>
            </div>
          </Card>

          {/* Client Organizations Overview */}
          <Card className="glass-panel border-slate-800/80 p-5 sm:p-6">
            <h2 className="text-base font-semibold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Building2 className="h-4 w-4 text-indigo-400" />
              Registered Organizations
            </h2>
            <div className="mt-3 space-y-2 text-xs">
              {organizations.slice(0, 5).map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800/70 bg-slate-900/40 p-2.5"
                >
                  <div>
                    <p className="font-semibold text-slate-200">{org.name}</p>
                    <span className="text-[10px] text-slate-400 font-mono">/{org.slug}</span>
                  </div>
                  <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-500/20">
                    Tenant
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
