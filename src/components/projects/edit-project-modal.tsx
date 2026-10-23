"use client";

import * as React from "react";
import {
  Edit3,
  DollarSign,
  Calendar,
  AlertCircle,
  Archive,
  ArchiveRestore,
  Sparkles,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { updateProjectAction, toggleArchiveProjectAction, ProjectActionResult } from "@/lib/projects/actions";
import { Project } from "@/types";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export function EditProjectModal({ isOpen, onClose, project }: EditProjectModalProps) {
  const [state, formAction, isPending] = React.useActionState<
    ProjectActionResult | null,
    FormData
  >(updateProjectAction, null);

  const [isArchiving, setIsArchiving] = React.useState(false);

  React.useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state, onClose]);

  const handleToggleArchive = async () => {
    setIsArchiving(true);
    await toggleArchiveProjectAction(project.id, !project.is_archived);
    setIsArchiving(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configure Project: ${project.code}`}
      description="Modify project lifecycle parameters, priority, milestones velocity, and allocated budget."
      maxWidth="xl"
    >
      {state?.error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
          <p className="leading-snug">{state.error}</p>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="projectId" value={project.id} />
        <input type="hidden" name="isArchived" value={project.is_archived ? "true" : "false"} />

        {/* Title */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Project Title</label>
          <input
            type="text"
            name="title"
            defaultValue={project.title}
            required
            className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>

        {/* Status & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Lifecycle Status</label>
            <select
              name="status"
              defaultValue={project.status}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            >
              <option value="discovery">Discovery & Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review (QA / Client Sign-off)</option>
              <option value="completed">Completed & Deployed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Priority Level</label>
            <select
              name="priority"
              defaultValue={project.priority}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Budget & Progress Percent */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Allocated Budget ({project.currency})</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                name="budgetTotal"
                defaultValue={project.budget_total}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Milestone Progress (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              name="progressPercent"
              defaultValue={project.progress_percent}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Kickoff Date</label>
            <input
              type="date"
              name="startDate"
              defaultValue={project.start_date || ""}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Target Delivery Deadline</label>
            <input
              type="date"
              name="targetDeliveryDate"
              defaultValue={project.target_delivery_date || ""}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Project Scope</label>
          <textarea
            name="description"
            rows={2}
            defaultValue={project.description || ""}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>

        {/* URLs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Repository URL</label>
            <input
              type="url"
              name="repositoryUrl"
              defaultValue={project.repository_url || ""}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Staging URL</label>
            <input
              type="url"
              name="stagingUrl"
              defaultValue={project.staging_url || ""}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggleArchive}
            disabled={isArchiving}
            className="text-xs border-slate-700 hover:border-amber-500/40 text-slate-300 hover:text-amber-300"
          >
            {project.is_archived ? (
              <>
                <ArchiveRestore className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                <span>Restore Project</span>
              </>
            ) : (
              <>
                <Archive className="h-3.5 w-3.5 mr-1 text-amber-400" />
                <span>Archive Project</span>
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="glow" size="sm" disabled={isPending} isLoading={isPending}>
              <Edit3 className="h-3.5 w-3.5 mr-1" />
              <span>{isPending ? "Saving..." : "Save Changes"}</span>
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
