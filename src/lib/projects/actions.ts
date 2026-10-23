"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthProfile } from "@/lib/auth/server";
import {
  ProjectStatus,
  PriorityLevel,
  MilestoneStatus,
  DeliverableStatus,
} from "@/types";

export interface ProjectActionResult {
  success?: boolean;
  error?: string;
  message?: string;
  projectId?: string;
}

/**
 * Server Action: Establishes a new project with organization scoping, budget, and priority.
 * Requires Agency Admin or Team Member privileges.
 */
export async function createProjectAction(
  _prevState: ProjectActionResult | null,
  formData: FormData
): Promise<ProjectActionResult> {
  const { user, profile } = await getAuthProfile();

  if (!user || !profile) {
    return { error: "You must be signed in to create projects." };
  }

  if (profile.role !== "admin" && profile.role !== "team_member") {
    return { error: "Unauthorized: Only Agency Admins and Team Members can provision projects." };
  }

  const title = (formData.get("title") as string)?.trim();
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const organizationId = (formData.get("organizationId") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const status = ((formData.get("status") as string) || "in_progress") as ProjectStatus;
  const priority = ((formData.get("priority") as string) || "medium") as PriorityLevel;
  const budgetRaw = formData.get("budgetTotal") as string;
  const budgetTotal = parseFloat(budgetRaw) || 0.0;
  const currency = ((formData.get("currency") as string)?.trim().toUpperCase() || "USD").slice(0, 3);
  const startDate = (formData.get("startDate") as string)?.trim() || null;
  const targetDeliveryDate = (formData.get("targetDeliveryDate") as string)?.trim() || null;
  const repositoryUrl = (formData.get("repositoryUrl") as string)?.trim() || null;
  const stagingUrl = (formData.get("stagingUrl") as string)?.trim() || null;
  const productionUrl = (formData.get("productionUrl") as string)?.trim() || null;

  // Validation
  if (!title || title.length < 3) {
    return { error: "Project title must be at least 3 characters." };
  }

  if (!code || code.length < 2) {
    return { error: "Project code is required (e.g., FT-FIN-01)." };
  }

  if (!organizationId) {
    return { error: "Please assign the project to a client organization." };
  }

  if (budgetTotal < 0) {
    return { error: "Allocated budget cannot be negative." };
  }

  const supabase = await createClient();

  // Insert Project
  const { data: project, error: insertError } = await supabase
    .from("projects")
    .insert({
      organization_id: organizationId,
      title,
      code,
      description,
      status,
      priority,
      budget_total: budgetTotal,
      currency,
      progress_percent: 0,
      start_date: startDate,
      target_delivery_date: targetDeliveryDate,
      repository_url: repositoryUrl,
      staging_url: stagingUrl,
      production_url: productionUrl,
      is_archived: false,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: `Project code "${code}" already exists in this organization.` };
    }
    return { error: insertError.message };
  }

  // Assign Creator as Project Lead
  if (project?.id) {
    await supabase.from("project_members").insert({
      project_id: project.id,
      user_id: user.id,
      project_role: profile.role === "admin" ? "executive_sponsor" : "lead",
    });
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: `Project "${title}" (${code}) provisioned successfully!`,
    projectId: project?.id,
  };
}

/**
 * Server Action: Updates project metadata, status, budget, priorities, and repository URLs.
 */
export async function updateProjectAction(
  _prevState: ProjectActionResult | null,
  formData: FormData
): Promise<ProjectActionResult> {
  const { user, profile } = await getAuthProfile();

  if (!user || !profile) {
    return { error: "Authentication required." };
  }

  if (profile.role !== "admin" && profile.role !== "team_member") {
    return { error: "Unauthorized: Only Agency Admins and Staff can update project parameters." };
  }

  const projectId = (formData.get("projectId") as string)?.trim();
  if (!projectId) {
    return { error: "Project identifier is required." };
  }

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const status = formData.get("status") as ProjectStatus;
  const priority = formData.get("priority") as PriorityLevel;
  const budgetRaw = formData.get("budgetTotal") as string;
  const budgetTotal = parseFloat(budgetRaw) || 0.0;
  const progressRaw = formData.get("progressPercent") as string;
  const progressPercent = Math.min(100, Math.max(0, parseInt(progressRaw) || 0));
  const startDate = (formData.get("startDate") as string)?.trim() || null;
  const targetDeliveryDate = (formData.get("targetDeliveryDate") as string)?.trim() || null;
  const repositoryUrl = (formData.get("repositoryUrl") as string)?.trim() || null;
  const stagingUrl = (formData.get("stagingUrl") as string)?.trim() || null;
  const productionUrl = (formData.get("productionUrl") as string)?.trim() || null;
  const isArchived = formData.get("isArchived") === "true";

  if (!title || title.length < 3) {
    return { error: "Project title must be at least 3 characters." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .update({
      title,
      description,
      status,
      priority,
      budget_total: budgetTotal,
      progress_percent: progressPercent,
      start_date: startDate,
      target_delivery_date: targetDeliveryDate,
      repository_url: repositoryUrl,
      staging_url: stagingUrl,
      production_url: productionUrl,
      is_archived: isArchived,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");

  return { success: true, message: "Project updated successfully." };
}

/**
 * Server Action: Toggles project archival state.
 */
export async function toggleArchiveProjectAction(
  projectId: string,
  isArchived: boolean
): Promise<ProjectActionResult> {
  const { user, profile } = await getAuthProfile();

  if (!user || !profile || (profile.role !== "admin" && profile.role !== "team_member")) {
    return { error: "Unauthorized: Administrator privileges required." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .update({ is_archived: isArchived, updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");

  return {
    success: true,
    message: isArchived ? "Project moved to archives." : "Project restored to active roster.",
  };
}

/**
 * Server Action: Assigns a team engineer or client stakeholder to a project.
 */
export async function assignProjectMemberAction(
  _prevState: ProjectActionResult | null,
  formData: FormData
): Promise<ProjectActionResult> {
  const { user, profile } = await getAuthProfile();

  if (!user || !profile || (profile.role !== "admin" && profile.role !== "team_member")) {
    return { error: "Unauthorized: Only Agency Staff can assign project members." };
  }

  const projectId = (formData.get("projectId") as string)?.trim();
  const userId = (formData.get("userId") as string)?.trim();
  const projectRole = (formData.get("projectRole") as string)?.trim() || "contributor";

  if (!projectId || !userId) {
    return { error: "Please select both a valid project and user." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("project_members").upsert(
    {
      project_id: projectId,
      user_id: userId,
      project_role: projectRole,
    },
    { onConflict: "project_id,user_id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true, message: "Project member assigned successfully." };
}

/**
 * Server Action: Removes a member from a project.
 */
export async function removeProjectMemberAction(
  projectId: string,
  userId: string
): Promise<ProjectActionResult> {
  const { user, profile } = await getAuthProfile();

  if (!user || !profile || (profile.role !== "admin" && profile.role !== "team_member")) {
    return { error: "Unauthorized: Agency staff permission required." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true, message: "Member removed from project roster." };
}

/**
 * Server Action: Appends a milestone to the project roadmap timeline.
 */
export async function createMilestoneAction(
  _prevState: ProjectActionResult | null,
  formData: FormData
): Promise<ProjectActionResult> {
  const { user, profile } = await getAuthProfile();

  if (!user || !profile || (profile.role !== "admin" && profile.role !== "team_member")) {
    return { error: "Unauthorized: Agency staff permission required to add milestones." };
  }

  const projectId = (formData.get("projectId") as string)?.trim();
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const status = ((formData.get("status") as string) || "planned") as MilestoneStatus;
  const sequenceOrder = parseInt(formData.get("sequenceOrder") as string) || 1;
  const dueDate = (formData.get("dueDate") as string)?.trim() || null;

  if (!projectId || !title) {
    return { error: "Milestone title and project are required." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("milestones").insert({
    project_id: projectId,
    title,
    description,
    status,
    sequence_order: sequenceOrder,
    due_date: dueDate,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true, message: `Milestone "${title}" added to roadmap.` };
}

/**
 * Server Action: Updates milestone status and triggers delivery timestamps.
 */
export async function updateMilestoneStatusAction(
  milestoneId: string,
  projectId: string,
  status: MilestoneStatus
): Promise<ProjectActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("milestones")
    .update({
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", milestoneId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true, message: "Milestone status updated." };
}

/**
 * Server Action: Creates a discrete deliverable (task) linked to a milestone.
 */
export async function createDeliverableAction(
  _prevState: ProjectActionResult | null,
  formData: FormData
): Promise<ProjectActionResult> {
  const { user, profile } = await getAuthProfile();

  if (!user || !profile || (profile.role !== "admin" && profile.role !== "team_member")) {
    return { error: "Unauthorized: Only Agency staff can create deliverables." };
  }

  const projectId = (formData.get("projectId") as string)?.trim();
  const milestoneId = (formData.get("milestoneId") as string)?.trim() || null;
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const status = ((formData.get("status") as string) || "backlog") as DeliverableStatus;
  const priority = ((formData.get("priority") as string) || "medium") as PriorityLevel;
  const acceptanceCriteria = (formData.get("acceptanceCriteria") as string)?.trim() || null;
  const assignedTo = (formData.get("assignedTo") as string)?.trim() || null;
  const dueDate = (formData.get("dueDate") as string)?.trim() || null;

  if (!projectId || !title) {
    return { error: "Deliverable title and project are required." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("deliverables").insert({
    project_id: projectId,
    milestone_id: milestoneId || null,
    title,
    description,
    status,
    priority,
    acceptance_criteria: acceptanceCriteria,
    assigned_to: assignedTo || null,
    due_date: dueDate,
  });

  if (error) {
    return { error: error.message };
  }

  // Auto recalculate project progress
  await supabase.rpc("calculate_project_progress", { p_project_id: projectId });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");

  return { success: true, message: `Task "${title}" created.` };
}

/**
 * Server Action: Updates deliverable status (Supports Client Approval & Sign-Off).
 */
export async function updateDeliverableStatusAction(
  deliverableId: string,
  projectId: string,
  status: DeliverableStatus
): Promise<ProjectActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("deliverables")
    .update({
      status,
      completed_at: status === "approved" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deliverableId);

  if (error) {
    return { error: error.message };
  }

  // Recalculate project progress
  await supabase.rpc("calculate_project_progress", { p_project_id: projectId });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");

  return { success: true, message: `Deliverable status set to ${status}.` };
}
