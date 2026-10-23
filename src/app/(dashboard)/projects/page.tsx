import * as React from "react";
import { requireAuth, getAuthProfile } from "@/lib/auth/server";
import { getProjectsList, getOrganizationsForSelect } from "@/lib/projects/queries";
import { ProjectsViewClient } from "@/components/projects/projects-view-client";

export const instant = false;

export const metadata = {
  title: "Projects | FailureTech Agency Client Portal",
  description: "Track enterprise milestones, budgets, repositories, and engineering deliverables.",
};

interface ProjectsPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    org?: string;
    archived?: string;
    page?: string;
  }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  // 1. Guard route on server
  await requireAuth("/projects");

  // 2. Resolve Search Params
  const resolvedParams = await searchParams;
  const search = resolvedParams.q;
  const status = resolvedParams.status;
  const priority = resolvedParams.priority;
  const organizationId = resolvedParams.org;
  const isArchived = resolvedParams.archived === "true";
  const page = parseInt(resolvedParams.page || "1") || 1;

  // 3. Fetch Projects (RLS enforced automatically)
  const projectsData = await getProjectsList({
    search,
    status,
    priority,
    organizationId,
    isArchived,
    page,
    pageSize: 8,
  });

  // 4. Fetch Organizations & User Profile
  const organizations = await getOrganizationsForSelect();
  const { profile } = await getAuthProfile();

  return (
    <ProjectsViewClient
      initialData={projectsData}
      organizations={organizations}
      currentUserProfile={profile}
    />
  );
}
