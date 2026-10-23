"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  FolderKanban,
  Plus,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFilters } from "@/components/projects/project-filters";
import { CreateProjectModal } from "@/components/projects/create-project-modal";
import { EditProjectModal } from "@/components/projects/edit-project-modal";
import { ProjectWithOrg, ProjectListResult } from "@/lib/projects/queries";
import { Organization, Profile, Project } from "@/types";

interface ProjectsViewClientProps {
  initialData: ProjectListResult;
  organizations: Organization[];
  currentUserProfile: Profile | null;
}

export function ProjectsViewClient({
  initialData,
  organizations,
  currentUserProfile,
}: ProjectsViewClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);

  const isAdmin = currentUserProfile?.role === "admin" || currentUserProfile?.role === "team_member";
  const isClient = currentUserProfile?.role === "client";

  const { projects, totalCount, page, totalPages } = initialData;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
              Client Delivery Control Plane
            </span>
            <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-500/20">
              {totalCount} Projects
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <FolderKanban className="h-7 w-7 text-indigo-400" />
            Enterprise Project Management
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            {isClient
              ? "Access active engineering trackers, milestone roadmaps, and signed-off deliverables."
              : "Provision projects, set budgets, assign engineering teams, and manage client milestones."}
          </p>
        </div>

        {/* Action Button: Admins can create; Clients can view or request */}
        {isAdmin && (
          <Button
            variant="glow"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="text-xs font-semibold shrink-0"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Provision New Project</span>
          </Button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <ProjectFilters organizations={organizations} isAdmin={isAdmin} />

      {/* Projects Grid or Empty State */}
      {projects.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Inbox className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-white">No projects found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            There are no projects matching your current search or filter criteria. Try adjusting your search term or clearing active filters.
          </p>
          {isAdmin && (
            <div className="pt-2">
              <Button
                variant="glow"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="text-xs font-semibold"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                <span>Create Your First Project</span>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isAdmin={isAdmin}
              onEdit={(proj) => setEditingProject(proj)}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-400">
          <span>
            Showing page <strong className="text-slate-200">{page}</strong> of{" "}
            <strong className="text-slate-200">{totalPages}</strong> ({totalCount} total projects)
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              className="text-xs h-8 border-slate-800"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              <span>Previous</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
              className="text-xs h-8 border-slate-800"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        organizations={organizations}
      />

      {/* Edit Project Modal */}
      {editingProject && (
        <EditProjectModal
          isOpen={Boolean(editingProject)}
          onClose={() => setEditingProject(null)}
          project={editingProject}
        />
      )}
    </div>
  );
}
