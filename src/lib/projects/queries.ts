import { createClient } from "@/lib/supabase/server";
import { getAuthProfile } from "@/lib/auth/server";
import {
  Project,
  Organization,
  Milestone,
  Deliverable,
  Profile,
  ProjectFileWithUploader,
  ProjectStatus,
  PriorityLevel,
} from "@/types";

export interface ProjectWithOrg extends Project {
  organization: Pick<Organization, "id" | "name" | "slug">;
  membersCount: number;
  openDeliverablesCount: number;
}

export interface ProjectListResult {
  projects: ProjectWithOrg[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProjectDetailView extends Project {
  organization: Organization;
  milestones: Array<
    Milestone & {
      deliverables: Array<
        Deliverable & {
          assignee?: Pick<Profile, "id" | "full_name" | "email" | "avatar_url" | "role"> | null;
        }
      >;
    }
  >;
  unassignedDeliverables: Array<
    Deliverable & {
      assignee?: Pick<Profile, "id" | "full_name" | "email" | "avatar_url" | "role"> | null;
    }
  >;
  members: Array<{
    id: string;
    project_role: string;
    profile: Profile;
  }>;
  files: ProjectFileWithUploader[];
}

/**
 * Retrieves paginated and filtered projects list.
 * Supabase Row Level Security automatically restricts Client users to their own organization.
 */
export async function getProjectsList(params: {
  search?: string;
  status?: string;
  priority?: string;
  organizationId?: string;
  isArchived?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<ProjectListResult> {
  const { user } = await getAuthProfile();
  if (!user) {
    return { projects: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
  }

  const supabase = await createClient();

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.max(1, Math.min(50, params.pageSize || 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Build base query
  let query = supabase
    .from("projects")
    .select(
      `
      *,
      organization:organizations(id, name, slug),
      project_members(id),
      deliverables(id, status)
    `,
      { count: "exact" }
    );

  // Archival filter (defaults to active projects only)
  if (params.isArchived !== undefined) {
    query = query.eq("is_archived", params.isArchived);
  } else {
    query = query.eq("is_archived", false);
  }

  // Status filter
  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status as ProjectStatus);
  }

  // Priority filter
  if (params.priority && params.priority !== "all") {
    query = query.eq("priority", params.priority as PriorityLevel);
  }

  // Organization filter
  if (params.organizationId && params.organizationId !== "all") {
    query = query.eq("organization_id", params.organizationId);
  }

  // Search filter (title or code)
  if (params.search && params.search.trim()) {
    const term = `%${params.search.trim()}%`;
    query = query.or(`title.ilike.${term},code.ilike.${term}`);
  }

  // Order and paginate
  query = query
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data, count, error } = await query;

  if (error || !data) {
    console.error("Error fetching projects:", error);
    return { projects: [], totalCount: 0, page, pageSize, totalPages: 0 };
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const projects: ProjectWithOrg[] = data.map((item: any) => ({
    ...item,
    organization: item.organization || { id: item.organization_id, name: "Agency Client", slug: "client" },
    membersCount: item.project_members?.length || 0,
    openDeliverablesCount: (item.deliverables || []).filter(
      (d: any) => d.status !== "approved"
    ).length,
  }));

  return {
    projects,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Retrieves comprehensive project details by ID with milestones, deliverables, and assigned staff.
 */
export async function getProjectDetail(projectId: string): Promise<ProjectDetailView | null> {
  const supabase = await createClient();

  // 1. Fetch Project with Organization
  const { data: project, error: projError } = await supabase
    .from("projects")
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq("id", projectId)
    .single();

  if (projError || !project) {
    return null;
  }

  // 2. Fetch Milestones
  const { data: milestones } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("sequence_order", { ascending: true });

  // 3. Fetch Deliverables with Assignees
  const { data: deliverables } = await supabase
    .from("deliverables")
    .select(`
      *,
      assignee:profiles(id, full_name, email, avatar_url, role)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  // 4. Fetch Project Members with Profiles
  const { data: members } = await supabase
    .from("project_members")
    .select(`
      id,
      project_role,
      profile:profiles(*)
    `)
    .eq("project_id", projectId);

  // 5. Fetch Project Vault Files (RLS automatically isolates internal-only files from clients)
  const { data: files } = await supabase
    .from("files")
    .select(`
      *,
      uploader:profiles(id, full_name, email, avatar_url, role)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const allDeliverables = deliverables || [];
  const allMilestones = milestones || [];

  // Group deliverables by milestone
  const milestonesWithDeliverables = allMilestones.map((milestone) => ({
    ...milestone,
    deliverables: allDeliverables.filter((d) => d.milestone_id === milestone.id),
  }));

  const unassignedDeliverables = allDeliverables.filter((d) => !d.milestone_id);

  return {
    ...project,
    organization: (project as any).organization,
    milestones: milestonesWithDeliverables,
    unassignedDeliverables,
    members: (members as any) || [],
    files: (files as any) || [],
  };
}

/**
 * Fetches organizations list for the creation dropdown.
 */
export async function getOrganizationsForSelect(): Promise<Organization[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizations")
    .select("*")
    .order("name", { ascending: true });

  return data || [];
}

/**
 * Fetches users who can be assigned to a project (agency staff + client org members).
 */
export async function getAssignableUsers(organizationId?: string): Promise<Profile[]> {
  const supabase = await createClient();

  const query = supabase.from("profiles").select("*");

  // Fetch all agency staff or members of the client organization
  const { data: profiles } = await query.order("full_name", { ascending: true });

  return profiles || [];
}

export interface DeliverableDetailView extends Deliverable {
  project?: Pick<Project, "id" | "title" | "code">;
  assignee?: Profile | null;
  reviewer?: Profile | null;
  files: Array<{
    id: string;
    file_name: string;
    file_path: string;
    file_size_bytes: number;
    mime_type: string | null;
    created_at: string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    is_internal_only: boolean;
    created_at: string;
    author: Profile;
  }>;
}

/**
 * Retrieves deliverable with audit reviewer, attached files, and threaded comments.
 * Client users automatically have internal-only notes omitted via PostgreSQL RLS.
 */
export async function getDeliverableDetails(deliverableId: string): Promise<DeliverableDetailView | null> {
  const supabase = await createClient();

  const { data: deliverable, error } = await supabase
    .from("deliverables")
    .select(`
      *,
      project:projects(id, title, code)
    `)
    .eq("id", deliverableId)
    .single();

  if (error || !deliverable) {
    return null;
  }

  // Fetch assignee profile
  let assignee: Profile | null = null;
  if (deliverable.assigned_to) {
    const { data: u } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", deliverable.assigned_to)
      .single();
    assignee = u;
  }

  // Fetch reviewer profile
  let reviewer: Profile | null = null;
  if (deliverable.reviewed_by) {
    const { data: rev } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", deliverable.reviewed_by)
      .single();
    reviewer = rev;
  }

  // Fetch files
  const { data: files } = await supabase
    .from("files")
    .select("id, file_name, file_path, file_size_bytes, mime_type, created_at")
    .eq("deliverable_id", deliverableId)
    .order("created_at", { ascending: false });

  // Fetch comments
  const { data: comments } = await supabase
    .from("comments")
    .select(`
      id,
      content,
      is_internal_only,
      created_at,
      author:profiles(*)
    `)
    .eq("deliverable_id", deliverableId)
    .order("created_at", { ascending: true });

  return {
    ...deliverable,
    assignee,
    reviewer,
    files: files || [],
    comments: (comments as any) || [],
  };
}
