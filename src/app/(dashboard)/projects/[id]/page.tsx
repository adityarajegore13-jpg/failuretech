import * as React from "react";
import { notFound } from "next/navigation";
import { requireAuth, getAuthProfile } from "@/lib/auth/server";
import { getProjectDetail, getAssignableUsers } from "@/lib/projects/queries";
import { ProjectDetailClient } from "@/components/projects/project-detail-client";

export const instant = false;

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const project = await getProjectDetail(id);
  if (!project) return { title: "Project Not Found | FailureTech Portal" };

  return {
    title: `${project.code}: ${project.title} | FailureTech Portal`,
    description: project.description || "Project milestones, deliverables, and team roster.",
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;

  // 1. Enforce authentication
  await requireAuth(`/projects/${id}`);

  // 2. Fetch project details
  const project = await getProjectDetail(id);
  if (!project) {
    notFound();
  }

  // 3. Fetch assignable team members & stakeholders
  const assignableUsers = await getAssignableUsers(project.organization_id);
  const { profile } = await getAuthProfile();

  return (
    <ProjectDetailClient
      project={project}
      assignableUsers={assignableUsers}
      currentUserProfile={profile}
    />
  );
}
