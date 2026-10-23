"use client";

import * as React from "react";
import {
  Mail,
  UserPlus,
  ShieldCheck,
  Building2,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createInvitationAction, AuthActionResult } from "@/lib/auth/actions";
import { Organization } from "@/types";

interface InviteUserFormProps {
  organizations: Organization[];
}

export function InviteUserForm({ organizations }: InviteUserFormProps) {
  const [state, formAction, isPending] = React.useActionState<
    AuthActionResult | null,
    FormData
  >(createInvitationAction, null);

  const [copied, setCopied] = React.useState(false);
  const [emailInput, setEmailInput] = React.useState("");

  const handleCopyLink = (url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-4">
      {state?.error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
          <p className="leading-snug">{state.error}</p>
        </div>
      )}

      {state?.success && state?.redirectUrl && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Invitation Link Ready to Distribute</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            The invitation record has been committed to PostgreSQL with Row Level Security. Share this one-time link with the client stakeholder:
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={typeof window !== "undefined" ? `${window.location.origin}${state.redirectUrl}` : state.redirectUrl}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs text-emerald-400 font-mono select-all"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCopyLink(state.redirectUrl!)}
              className="shrink-0 text-xs"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400 mr-1" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  <span>Copy Link</span>
                </>
              )}
            </Button>
            <a
              href={state.redirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
              title="Open link in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}

      <form action={formAction} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Recipient Email */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              Invitee Work Email <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                name="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                placeholder="client@partner.com"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Target Organization */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              Assign to Organization <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                name="organizationId"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.slug})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Platform Role */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              Portal Access Role
            </label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                name="role"
                defaultValue="client"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              >
                <option value="client">Client (Projects, Milestones, Invoices)</option>
                <option value="team_member">Team Member (Agency Engineer / PM)</option>
                <option value="admin">Agency Super Administrator</option>
              </select>
            </div>
          </div>

          {/* Org Membership Role */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              Organization Membership Role
            </label>
            <select
              name="orgRole"
              defaultValue="member"
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            >
              <option value="member">Standard Member</option>
              <option value="admin">Organization Administrator</option>
              <option value="billing_contact">Billing / Finance Contact</option>
              <option value="owner">Organization Owner</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="glow"
            disabled={isPending}
            isLoading={isPending}
            className="w-full sm:w-auto text-xs font-semibold"
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            <span>{isPending ? "Generating Invitation Token..." : "Issue Portal Invitation"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
