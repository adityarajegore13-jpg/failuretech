"use client";

import * as React from "react";
import Link from "next/link";
import {
  FolderKanban,
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  Milestone as MilestoneIcon,
  CheckSquare,
  GitBranch,
  ExternalLink,
  Edit,
  UserPlus,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Settings,
  Archive,
  FolderLock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { DeliverableItem } from "@/components/projects/deliverable-item";
import { EditProjectModal } from "@/components/projects/edit-project-modal";
import { AssignMemberModal } from "@/components/projects/assign-member-modal";
import { CreateMilestoneModal } from "@/components/projects/create-milestone-modal";
import { CreateDeliverableModal } from "@/components/projects/create-deliverable-modal";
import { ProjectFileVault } from "@/components/vault/project-file-vault";
import { updateMilestoneStatusAction } from "@/lib/projects/actions";
import { ProjectDetailView } from "@/lib/projects/queries";
import { Profile, MilestoneStatus, ProjectStatus, PriorityLevel } from "@/types";

interface ProjectDetailClientProps {
  project: ProjectDetailView;
  assignableUsers: Profile[];
  currentUserProfile: Profile | null;
}

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; badgeVariant: "purple" | "warning" | "success" | "danger" | "default" }
> = {
  discovery: { label: "Discovery", badgeVariant: "default" },
  in_progress: { label: "In Progress", badgeVariant: "purple" },
  in_review: { label: "Client Review", badgeVariant: "warning" },
  completed: { label: "Completed", badgeVariant: "success" },
  on_hold: { label: "On Hold", badgeVariant: "danger" },
  cancelled: { label: "Cancelled", badgeVariant: "danger" },
};

const PRIORITY_CONFIG: Record<
  PriorityLevel,
  { label: string; badgeVariant: "danger" | "warning" | "info" | "default" }
> = {
  urgent: { label: "Urgent Priority", badgeVariant: "danger" },
  high: { label: "High Priority", badgeVariant: "warning" },
  medium: { label: "Medium Priority", badgeVariant: "info" },
  low: { label: "Low Priority", badgeVariant: "default" },
};

export function ProjectDetailClient({
  project,
  assignableUsers,
  currentUserProfile,
}: ProjectDetailClientProps) {
  const [activeTab, setActiveTab] = React.useState<"milestones" | "deliverables" | "vault" | "team" | "settings">("milestones");

  // Modals state
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isAssignOpen, setIsAssignOpen] = React.useState(false);
  const [isMilestoneOpen, setIsMilestoneOpen] = React.useState(false);
  const [isDeliverableOpen, setIsDeliverableOpen] = React.useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = React.useState<string | undefined>(undefined);

  const isAdmin = currentUserProfile?.role === "admin" || currentUserProfile?.role === "team_member";
  const isClient = currentUserProfile?.role === "client";

  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.in_progress;
  const priorityCfg = PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG.medium;

  // Flatten all deliverables for the count
  const totalDeliverables = project.milestones.reduce(
    (sum, m) => sum + m.deliverables.length,
    project.unassignedDeliverables.length
  );
  const completedDeliverables = project.milestones.reduce(
    (sum, m) => sum + m.deliverables.filter((d) => d.status === "approved").length,
    project.unassignedDeliverables.filter((d) => d.status === "approved").length
  );

  const handleMilestoneStatus = async (milestoneId: string, status: MilestoneStatus) => {
    await updateMilestoneStatusAction(milestoneId, project.id, status);
  };

  const handleAddDeliverableForMilestone = (milestoneId?: string) => {
    setSelectedMilestoneId(milestoneId);
    setIsDeliverableOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link
          href="/projects"
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Projects</span>
        </Link>
        <span>/</span>
        <span className="font-mono text-indigo-400 font-semibold">{project.code}</span>
      </div>

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0c101d] via-[#11162b] to-[#0d1424] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-md bg-slate-800/90 px-2 py-0.5 text-xs font-mono font-bold text-indigo-300 border border-slate-700/80">
                {project.code}
              </span>
              <Badge variant={statusCfg.badgeVariant} dot>
                {statusCfg.label}
              </Badge>
              <Badge variant={priorityCfg.badgeVariant}>
                {priorityCfg.label}
              </Badge>
              <span className="text-xs text-slate-400">
                Organization: <strong className="text-slate-200">{project.organization.name}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {project.title}
            </h1>

            {project.description && (
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                {project.description}
              </p>
            )}

            {/* Links Bar */}
            <div className="flex items-center gap-3 pt-1 flex-wrap text-xs">
              {project.repository_url && (
                <a
                  href={project.repository_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-300 hover:text-indigo-400 transition-colors"
                >
                  <GitBranch className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-mono text-[11px]">Repository</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
              {project.staging_url && (
                <a
                  href={project.staging_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="font-mono text-[11px]">Staging Environment</span>
                </a>
              )}
            </div>
          </div>

          {/* Admin Action Buttons */}
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(true)}
                className="text-xs border-slate-700 bg-slate-900/80"
              >
                <Edit className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
                <span>Configure Project</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAssignOpen(true)}
                className="text-xs border-slate-700 bg-slate-900/80"
              >
                <UserPlus className="h-3.5 w-3.5 mr-1.5 text-cyan-400" />
                <span>Roster ({project.members.length})</span>
              </Button>
              <Button
                variant="glow"
                size="sm"
                onClick={() => handleAddDeliverableForMilestone()}
                className="text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>New Task</span>
              </Button>
            </div>
          )}
        </div>

        {/* Metric Summary Strip */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
              Budget Allocated
            </span>
            <span className="text-base font-bold text-white font-mono">
              ${project.budget_total.toLocaleString()} {project.currency}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
              Target Delivery
            </span>
            <span className="text-base font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
              <Calendar className="h-4 w-4 text-cyan-400" />
              {project.target_delivery_date || "Open Target"}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
              Roadmap Progress
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-base font-bold text-emerald-400 font-mono">
                {project.progress_percent}%
              </span>
              <span className="text-[10px] text-slate-400">
                ({completedDeliverables}/{totalDeliverables} tasks done)
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
              Milestone Phases
            </span>
            <span className="text-base font-bold text-indigo-400 font-mono">
              {project.milestones.length} Roadmap Sprints
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab("milestones")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 font-medium transition-colors ${
            activeTab === "milestones"
              ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <MilestoneIcon className="h-4 w-4" />
          <span>Milestones Roadmap ({project.milestones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("deliverables")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 font-medium transition-colors ${
            activeTab === "deliverables"
              ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          <span>All Deliverables ({totalDeliverables})</span>
        </button>

        <button
          onClick={() => setActiveTab("vault")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 font-medium transition-colors ${
            activeTab === "vault"
              ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <FolderLock className="h-4 w-4" />
          <span>Secure Vault ({project.files?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("team")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 font-medium transition-colors ${
            activeTab === "team"
              ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Team & Stakeholders ({project.members.length})</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 font-medium transition-colors ${
              activeTab === "settings"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Project Governance</span>
          </button>
        )}
      </div>

      {/* Tab 1: Milestones Roadmap */}
      {activeTab === "milestones" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <MilestoneIcon className="h-4 w-4 text-indigo-400" />
                Sprint Milestones & Delivery Phases
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Sequential delivery phases, architecture gates, and client sign-off checkpoints.
              </p>
            </div>

            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsMilestoneOpen(true)}
                className="text-xs border-slate-700"
              >
                <Plus className="h-3.5 w-3.5 mr-1 text-indigo-400" />
                <span>Add Milestone Phase</span>
              </Button>
            )}
          </div>

          {project.milestones.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-10 text-center space-y-2">
              <MilestoneIcon className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-white">No milestones scheduled</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Schedule your first roadmap milestone phase to track deliverables and sprint progress.
              </p>
              {isAdmin && (
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="glow"
                    onClick={() => setIsMilestoneOpen(true)}
                    className="text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    <span>Create Milestone Phase</span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {project.milestones.map((milestone) => (
                <Card
                  key={milestone.id}
                  className="glass-panel border-slate-800/80 p-5 sm:p-6 shadow-xl space-y-4"
                >
                  {/* Milestone Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300 border border-indigo-500/20">
                          PHASE {milestone.sequence_order}
                        </span>
                        <h3 className="text-sm font-bold text-white">{milestone.title}</h3>
                      </div>
                      {milestone.description && (
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {milestone.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {milestone.due_date && (
                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-cyan-400" />
                          Due: {milestone.due_date}
                        </span>
                      )}

                      {/* Milestone Status Changer */}
                      {isAdmin ? (
                        <select
                          value={milestone.status}
                          onChange={(e) =>
                            handleMilestoneStatus(milestone.id, e.target.value as MilestoneStatus)
                          }
                          className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="planned">Planned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="in_review">In Review</option>
                          <option value="completed">Completed</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      ) : (
                        <Badge
                          variant={
                            milestone.status === "completed"
                              ? "success"
                              : milestone.status === "in_progress"
                              ? "purple"
                              : "default"
                          }
                        >
                          {milestone.status.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Milestone Deliverables List */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">
                        Deliverables in this phase ({milestone.deliverables.length})
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => handleAddDeliverableForMilestone(milestone.id)}
                          className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add Task</span>
                        </button>
                      )}
                    </div>

                    {milestone.deliverables.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 italic">
                        No tasks assigned to this milestone yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2.5">
                        {milestone.deliverables.map((deliv) => (
                          <DeliverableItem
                            key={deliv.id}
                            deliverable={deliv}
                            projectId={project.id}
                            isClient={isClient}
                            isAdmin={isAdmin}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: All Deliverables Queue */}
      {activeTab === "deliverables" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-emerald-400" />
                Deliverable Work Tickets
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Full backlog of engineering requirements, acceptance criteria, and QA sign-offs.
              </p>
            </div>

            {isAdmin && (
              <Button
                size="sm"
                variant="glow"
                onClick={() => handleAddDeliverableForMilestone()}
                className="text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>Create Deliverable</span>
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {totalDeliverables === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-10 text-center space-y-2">
                <CheckSquare className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="font-semibold text-white">No deliverables created</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Add deliverable tasks to define work items and test criteria.
                </p>
              </div>
            ) : (
              <>
                {/* Milestone grouped deliverables */}
                {project.milestones.map((m) => (
                  <div key={m.id} className="space-y-2">
                    <h3 className="text-xs font-mono font-semibold uppercase text-slate-400 tracking-wider">
                      Phase {m.sequence_order}: {m.title}
                    </h3>
                    <div className="space-y-2.5">
                      {m.deliverables.map((d) => (
                        <DeliverableItem
                          key={d.id}
                          deliverable={d}
                          projectId={project.id}
                          isClient={isClient}
                          isAdmin={isAdmin}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Unassigned deliverables */}
                {project.unassignedDeliverables.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-mono font-semibold uppercase text-slate-400 tracking-wider">
                      General Backlog (Unassigned Phase)
                    </h3>
                    <div className="space-y-2.5">
                      {project.unassignedDeliverables.map((d) => (
                        <DeliverableItem
                          key={d.id}
                          deliverable={d}
                          projectId={project.id}
                          isClient={isClient}
                          isAdmin={isAdmin}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Secure Project File Vault */}
      {activeTab === "vault" && (
        <ProjectFileVault
          projectId={project.id}
          initialFiles={project.files || []}
          isClient={isClient}
          isAdmin={isAdmin}
          currentUserId={currentUserProfile?.id}
          deliverables={project.milestones.flatMap((m) => m.deliverables).concat(project.unassignedDeliverables)}
        />
      )}

      {/* Tab 4: Team Roster & Stakeholders */}
      {activeTab === "team" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" />
                Assigned Team & Stakeholders
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Engineers, architects, and client stakeholders granted direct access to this project.
              </p>
            </div>

            {isAdmin && (
              <Button
                size="sm"
                variant="glow"
                onClick={() => setIsAssignOpen(true)}
                className="text-xs font-semibold"
              >
                <UserPlus className="h-3.5 w-3.5 mr-1" />
                <span>Manage Roster</span>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.members.map((member) => (
              <Card
                key={member.id}
                className="glass-panel border-slate-800/80 p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    name={member.profile.full_name || member.profile.email}
                    size="md"
                    className="ring-1 ring-indigo-500/40"
                  />
                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate">
                      {member.profile.full_name || "Unnamed"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {member.profile.email}
                    </p>
                    <span className="inline-block mt-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700/60">
                      {member.project_role.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 border-t border-slate-800/60 pt-2 flex items-center justify-between">
                  <span>Role: {member.profile.role}</span>
                  <span className="text-emerald-400 font-medium">Active Member</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Governance & Settings (Admins only) */}
      {activeTab === "settings" && isAdmin && (
        <div className="space-y-4">
          <Card className="glass-panel border-slate-800/80 p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Project Security & Row Level Security Boundary
            </h2>
            <div className="space-y-2 text-xs text-slate-300">
              <p>
                This project is cryptographically scoped to Organization ID:{" "}
                <code className="text-indigo-400 font-mono">{project.organization_id}</code> (
                {project.organization.name}).
              </p>
              <p className="text-slate-400">
                PostgreSQL RLS function <code className="text-indigo-300 font-mono">can_access_project()</code> strictly
                enforces that client stakeholders from outside this organization are denied visibility at the database engine level.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(true)}
                className="text-xs border-slate-700"
              >
                <Edit className="h-3.5 w-3.5 mr-1 text-indigo-400" />
                <span>Edit All Parameters</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modals */}
      <EditProjectModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        project={project}
      />

      <AssignMemberModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        projectId={project.id}
        projectTitle={project.title}
        currentMembers={project.members}
        availableUsers={assignableUsers}
      />

      <CreateMilestoneModal
        isOpen={isMilestoneOpen}
        onClose={() => setIsMilestoneOpen(false)}
        projectId={project.id}
        projectTitle={project.title}
        nextSequence={project.milestones.length + 1}
      />

      <CreateDeliverableModal
        isOpen={isDeliverableOpen}
        onClose={() => setIsDeliverableOpen(false)}
        projectId={project.id}
        milestones={project.milestones}
        defaultMilestoneId={selectedMilestoneId}
        assignableUsers={assignableUsers}
      />
    </div>
  );
}
