"use client";

import * as React from "react";
import {
  FolderPlus,
  Building2,
  DollarSign,
  Calendar,
  AlertCircle,
  GitBranch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { createProjectAction, ProjectActionResult } from "@/lib/projects/actions";
import { Organization } from "@/types";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizations: Organization[];
}

export function CreateProjectModal({
  isOpen,
  onClose,
  organizations,
}: CreateProjectModalProps) {
  const [state, formAction, isPending] = React.useActionState<
    ProjectActionResult | null,
    FormData
  >(createProjectAction, null);

  const [title, setTitle] = React.useState("");
  const [code, setCode] = React.useState("");

  // Auto-generate project code suggestion from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!code || code.startsWith("FT-")) {
      const acronym = val
        .split(" ")
        .filter(Boolean)
        .slice(0, 3)
        .map((w) => w[0]?.toUpperCase())
        .join("");
      if (acronym.length >= 2) {
        setCode(`FT-${acronym}-${Math.floor(10 + Math.random() * 90)}`);
      }
    }
  };

  React.useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Provision New Enterprise Project"
      description="Create a client deliverable tracker with budget, milestone roadmap, and access boundaries."
      maxWidth="xl"
    >
      {state?.error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
          <p className="leading-snug">{state.error}</p>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {/* Row 1: Title and Code */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-medium text-slate-300">
              Project Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              placeholder="e.g. Fintech Core Banking API & Mobile Portal"
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              Project Code <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              placeholder="FT-PRJ-01"
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-indigo-300 font-mono placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        {/* Row 2: Organization & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              Client Organization <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                name="organizationId"
                required
                className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              >
                <option value="">Select client organization...</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.slug})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Delivery Priority</label>
            <select
              name="priority"
              defaultValue="medium"
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            >
              <option value="low">Low (Standard Backlog)</option>
              <option value="medium">Medium (Regular Sprint)</option>
              <option value="high">High (Accelerated Milestones)</option>
              <option value="urgent">Urgent (Critical Escalation)</option>
            </select>
          </div>
        </div>

        {/* Row 3: Lifecycle Status & Allocated Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Initial Status</label>
            <select
              name="status"
              defaultValue="in_progress"
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            >
              <option value="discovery">Discovery & Architecture</option>
              <option value="in_progress">In Progress (Active Sprint)</option>
              <option value="in_review">In Review (Client QA)</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Allocated Budget</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                name="budgetTotal"
                defaultValue="45000"
                placeholder="45000.00"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white font-mono placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Currency</label>
            <select
              name="currency"
              defaultValue="USD"
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD ($)</option>
            </select>
          </div>
        </div>

        {/* Row 4: Start Date & Target Delivery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Project Kickoff Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="date"
                name="startDate"
                defaultValue={new Date().toISOString().split("T")[0]}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Target Delivery Deadline</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="date"
                name="targetDeliveryDate"
                defaultValue={new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
          </div>
        </div>

        {/* Row 5: Description */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Project Scope & Description</label>
          <textarea
            name="description"
            rows={2}
            placeholder="Key objectives, architectural scope, and client deliverables..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>

        {/* Row 6: Repository & Environments (Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">GitHub Repository URL</label>
            <div className="relative">
              <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="url"
                name="repositoryUrl"
                placeholder="https://github.com/failuretech/project"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Staging URL</label>
            <input
              type="url"
              name="stagingUrl"
              placeholder="https://staging.client.internal"
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="glow" size="sm" disabled={isPending} isLoading={isPending}>
            <FolderPlus className="h-4 w-4 mr-1.5" />
            <span>{isPending ? "Creating Project..." : "Provision Project"}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
