"use client";

import * as React from "react";
import { CheckSquare, Calendar, User, AlertCircle, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { createDeliverableAction, ProjectActionResult } from "@/lib/projects/actions";
import { Milestone, Profile } from "@/types";

interface CreateDeliverableModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  milestones: Milestone[];
  defaultMilestoneId?: string;
  assignableUsers: Profile[];
}

export function CreateDeliverableModal({
  isOpen,
  onClose,
  projectId,
  milestones,
  defaultMilestoneId,
  assignableUsers,
}: CreateDeliverableModalProps) {
  const [state, formAction, isPending] = React.useActionState<
    ProjectActionResult | null,
    FormData
  >(createDeliverableAction, null);

  React.useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Deliverable Task"
      description="Define work ticket requirements, assign engineering staff, and set priority."
      maxWidth="lg"
    >
      {state?.error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
          <p className="leading-snug">{state.error}</p>
        </div>
      )}

      <form action={formAction} className="space-y-3.5">
        <input type="hidden" name="projectId" value={projectId} />

        {/* Milestone Parent */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Assign to Milestone Phase</label>
          <select
            name="milestoneId"
            defaultValue={defaultMilestoneId || ""}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">No Milestone (Uncategorized Backlog)</option>
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>
                Phase {m.sequence_order}: {m.title}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">
            Task / Deliverable Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            name="title"
            required
            placeholder="e.g. Implement OAuth2 Refresh Token Rotation with Redis"
            className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Status, Priority, Assignee */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Status</label>
            <select
              name="status"
              defaultValue="in_progress"
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="backlog">Backlog</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved & Completed</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Priority</label>
            <select
              name="priority"
              defaultValue="medium"
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Assign To</label>
            <select
              name="assignedTo"
              defaultValue=""
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Unassigned</option>
              {assignableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Due Date */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Target Delivery Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="date"
              name="dueDate"
              defaultValue={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Description & Acceptance Criteria */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Technical Details / Acceptance Criteria</label>
          <textarea
            name="acceptanceCriteria"
            rows={3}
            placeholder="Given credentials, when auth exchange occurs, verify secure HTTP-only cookies are written..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="glow" size="sm" disabled={isPending} isLoading={isPending}>
            <CheckSquare className="h-3.5 w-3.5 mr-1" />
            <span>{isPending ? "Creating..." : "Create Deliverable"}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
