"use client";

import * as React from "react";
import { UserPlus, UserMinus, Shield, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  assignProjectMemberAction,
  removeProjectMemberAction,
  ProjectActionResult,
} from "@/lib/projects/actions";
import { Profile } from "@/types";

interface AssignMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  currentMembers: Array<{
    id: string;
    project_role: string;
    profile: Profile;
  }>;
  availableUsers: Profile[];
}

export function AssignMemberModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  currentMembers,
  availableUsers,
}: AssignMemberModalProps) {
  const [state, formAction, isPending] = React.useActionState<
    ProjectActionResult | null,
    FormData
  >(assignProjectMemberAction, null);

  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  const handleRemove = async (userId: string) => {
    setRemovingId(userId);
    await removeProjectMemberAction(projectId, userId);
    setRemovingId(null);
  };

  const assignedUserIds = new Set(currentMembers.map((m) => m.profile.id));
  const unassignedUsers = availableUsers.filter((u) => !assignedUserIds.has(u.id));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Project Team & Stakeholder Roster"
      description={`Assign engineers, architects, or client contacts to ${projectTitle}.`}
      maxWidth="lg"
    >
      {state?.error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
          <p className="leading-snug">{state.error}</p>
        </div>
      )}

      {/* Section 1: Add Member Form */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 mb-5">
        <h3 className="text-xs font-semibold text-white mb-2.5 flex items-center gap-1.5">
          <UserPlus className="h-4 w-4 text-indigo-400" />
          <span>Add Member to Project</span>
        </h3>

        <form action={formAction} className="space-y-3">
          <input type="hidden" name="projectId" value={projectId} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">
                Select Person
              </label>
              <select
                name="userId"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Select engineer or client...</option>
                {unassignedUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.email} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">
                Project Role
              </label>
              <select
                name="projectRole"
                defaultValue="engineer"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="lead">Project Lead</option>
                <option value="architect">Systems Architect</option>
                <option value="engineer">Software Engineer</option>
                <option value="qa">QA Engineer</option>
                <option value="reviewer">Code Reviewer</option>
                <option value="client_stakeholder">Client Stakeholder</option>
              </select>
            </div>
          </div>

          <div className="pt-1 flex justify-end">
            <Button
              type="submit"
              variant="glow"
              size="sm"
              disabled={isPending || !selectedUserId}
              isLoading={isPending}
              className="text-xs"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              <span>Assign Member</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Section 2: Current Assigned Members */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-200">
            Currently Assigned Members ({currentMembers.length})
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Scoped Access</span>
        </div>

        <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
          {currentMembers.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              No members assigned yet. Use the form above to add engineers or stakeholders.
            </p>
          ) : (
            currentMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/40 p-2.5 hover:bg-slate-900/80 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={member.profile.full_name || member.profile.email} size="sm" />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {member.profile.full_name || "Unnamed"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {member.profile.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-500/20">
                    {member.project_role.replace("_", " ")}
                  </span>
                  <button
                    onClick={() => handleRemove(member.profile.id)}
                    disabled={removingId === member.profile.id}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove from project"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
