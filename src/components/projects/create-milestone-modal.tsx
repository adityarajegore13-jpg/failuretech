"use client";

import * as React from "react";
import { Milestone as MilestoneIcon, Calendar, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { createMilestoneAction, ProjectActionResult } from "@/lib/projects/actions";

interface CreateMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  nextSequence: number;
}

export function CreateMilestoneModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  nextSequence,
}: CreateMilestoneModalProps) {
  const [state, formAction, isPending] = React.useActionState<
    ProjectActionResult | null,
    FormData
  >(createMilestoneAction, null);

  React.useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Milestone Phase"
      description={`Schedule a sprint or deliverable phase for ${projectTitle}.`}
      maxWidth="md"
    >
      {state?.error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
          <p className="leading-snug">{state.error}</p>
        </div>
      )}

      <form action={formAction} className="space-y-3.5">
        <input type="hidden" name="projectId" value={projectId} />

        {/* Title */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">
            Milestone Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            name="title"
            required
            placeholder="e.g. Phase 2: Core Banking Microservices & DB Replication"
            className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Sequence & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Sequence Order</label>
            <input
              type="number"
              name="sequenceOrder"
              defaultValue={nextSequence}
              min="1"
              required
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Initial Status</label>
            <select
              name="status"
              defaultValue="planned"
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
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
              defaultValue={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Milestone Scope & Acceptance Criteria</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Key deliverables, test criteria, and architecture sign-offs..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="glow" size="sm" disabled={isPending} isLoading={isPending}>
            <MilestoneIcon className="h-3.5 w-3.5 mr-1" />
            <span>{isPending ? "Adding..." : "Add Milestone"}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
