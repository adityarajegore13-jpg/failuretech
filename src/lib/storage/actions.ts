"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthProfile } from "@/lib/auth/server";
import { getDeliverableDetails, DeliverableDetailView } from "@/lib/projects/queries";

export interface DeliverableActionResult {
  success?: boolean;
  error?: string;
  message?: string;
  signedUrl?: string;
}

/**
 * Server Action: Generates a temporary, secure signed URL for downloading deliverable attachments.
 * Verifies caller has project-level permission before generating the URL.
 */
export async function getDeliverableSignedUrlAction(
  filePath: string,
  projectId: string
): Promise<DeliverableActionResult> {
  const { user } = await getAuthProfile();
  if (!user) {
    return { error: "Authentication required to access project files." };
  }

  const supabase = await createClient();

  // 1. Verify project-level access
  const { data: hasAccess } = await supabase.rpc("can_access_project", {
    p_project_id: projectId,
  });

  if (!hasAccess) {
    return { error: "Access Denied: You are not authorized to download assets from this project." };
  }

  // 2. Generate cryptographically signed URL (valid for 1 hour)
  const { data, error } = await supabase.storage
    .from("deliverables")
    .createSignedUrl(filePath, 3600);

  if (error || !data?.signedUrl) {
    return { error: error?.message || "Failed to generate secure download link." };
  }

  return { success: true, signedUrl: data.signedUrl };
}

/**
 * Server Action: Submits a deliverable for client review with preview link and optional file attachment.
 * Requires Agency Admin or Team Member privileges.
 */
export async function submitDeliverableForReviewAction(
  _prevState: DeliverableActionResult | null,
  formData: FormData
): Promise<DeliverableActionResult> {
  const { user, profile } = await getAuthProfile();
  if (!user || !profile) {
    return { error: "You must be signed in to submit deliverables." };
  }

  const projectId = (formData.get("projectId") as string)?.trim();
  const deliverableId = (formData.get("deliverableId") as string)?.trim();
  const previewUrl = (formData.get("previewUrl") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const attachedFile = formData.get("file") as File | null;

  if (!projectId || !deliverableId) {
    return { error: "Invalid deliverable submission request." };
  }

  const supabase = await createClient();

  // Verify access
  const { data: hasAccess } = await supabase.rpc("can_access_project", {
    p_project_id: projectId,
  });

  if (!hasAccess || (profile.role !== "admin" && profile.role !== "team_member")) {
    return { error: "Unauthorized: Only assigned agency staff can submit deliverables for review." };
  }

  // Optional File Upload to Private Supabase Storage
  if (attachedFile && attachedFile.size > 0) {
    const fileBytes = await attachedFile.arrayBuffer();
    const sanitizedFileName = attachedFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${projectId}/${deliverableId}/${Date.now()}_${sanitizedFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("deliverables")
      .upload(storagePath, fileBytes, {
        contentType: attachedFile.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      return { error: `File upload failed: ${uploadError.message}` };
    }

    // Record file in public.files catalog
    await supabase.from("files").insert({
      project_id: projectId,
      deliverable_id: deliverableId,
      uploaded_by: user.id,
      file_name: attachedFile.name,
      file_path: storagePath,
      file_size_bytes: attachedFile.size,
      mime_type: attachedFile.type,
      is_public_to_client: true,
    });
  }

  // Update Deliverable Status to 'in_review' with Audit Timestamps
  const { error: updateError } = await supabase
    .from("deliverables")
    .update({
      status: "in_review",
      preview_url: previewUrl,
      description: description || undefined,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", deliverableId);

  if (updateError) {
    return { error: updateError.message };
  }

  // Post audit timeline comment
  await supabase.from("comments").insert({
    project_id: projectId,
    deliverable_id: deliverableId,
    author_id: user.id,
    content: previewUrl
      ? `Submitted deliverable for client review with live preview: ${previewUrl}`
      : "Submitted deliverable for client QA review and stakeholder sign-off.",
    is_internal_only: false,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Deliverable successfully submitted for client review!",
  };
}

/**
 * Server Action: Client Review Decision (Approve or Request Revisions).
 * Verifies project-level client authorization and records complete audit trail.
 */
export async function reviewDeliverableAction(
  _prevState: DeliverableActionResult | null,
  formData: FormData
): Promise<DeliverableActionResult> {
  const { user } = await getAuthProfile();
  if (!user) {
    return { error: "Authentication required." };
  }

  const projectId = (formData.get("projectId") as string)?.trim();
  const deliverableId = (formData.get("deliverableId") as string)?.trim();
  const decision = (formData.get("decision") as string)?.trim(); // 'approved' | 'rejected'
  const feedbackNotes = (formData.get("feedbackNotes") as string)?.trim() || "";

  if (!projectId || !deliverableId || (decision !== "approved" && decision !== "rejected")) {
    return { error: "Invalid review decision parameters." };
  }

  const supabase = await createClient();

  // Verify caller has permission to view this project
  const { data: hasAccess } = await supabase.rpc("can_access_project", {
    p_project_id: projectId,
  });

  if (!hasAccess) {
    return { error: "Access Denied: You are not authorized to review deliverables for this project." };
  }

  const now = new Date().toISOString();

  if (decision === "approved") {
    // 1. Mark deliverable approved
    const { error: approveError } = await supabase
      .from("deliverables")
      .update({
        status: "approved",
        completed_at: now,
        reviewed_at: now,
        reviewed_by: user.id,
        revision_notes: null,
        updated_at: now,
      })
      .eq("id", deliverableId);

    if (approveError) {
      return { error: approveError.message };
    }

    // 2. Append approval audit comment
    await supabase.from("comments").insert({
      project_id: projectId,
      deliverable_id: deliverableId,
      author_id: user.id,
      content: feedbackNotes
        ? `Deliverable approved and signed off. Stakeholder notes: "${feedbackNotes}"`
        : "Deliverable approved and signed off by client stakeholder.",
      is_internal_only: false,
    });
  } else {
    // Decision is 'rejected' (Revision Requested)
    if (!feedbackNotes) {
      return { error: "Please provide revision notes explaining what changes are required." };
    }

    const { error: rejectError } = await supabase
      .from("deliverables")
      .update({
        status: "rejected",
        revision_notes: feedbackNotes,
        reviewed_at: now,
        reviewed_by: user.id,
        updated_at: now,
      })
      .eq("id", deliverableId);

    if (rejectError) {
      return { error: rejectError.message };
    }

    // Append revision request comment
    await supabase.from("comments").insert({
      project_id: projectId,
      deliverable_id: deliverableId,
      author_id: user.id,
      content: `Changes requested by client stakeholder: "${feedbackNotes}"`,
      is_internal_only: false,
    });
  }

  // Recalculate project progress
  await supabase.rpc("calculate_project_progress", { p_project_id: projectId });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");

  return {
    success: true,
    message: decision === "approved" ? "Deliverable approved and signed off!" : "Revision request submitted to engineering team.",
  };
}

/**
 * Server Action: Posts a threaded comment or internal engineering note on a deliverable.
 */
export async function addDeliverableCommentAction(
  _prevState: DeliverableActionResult | null,
  formData: FormData
): Promise<DeliverableActionResult> {
  const { user, profile } = await getAuthProfile();
  if (!user || !profile) {
    return { error: "Authentication required to post feedback." };
  }

  const projectId = (formData.get("projectId") as string)?.trim();
  const deliverableId = (formData.get("deliverableId") as string)?.trim() || null;
  const content = (formData.get("content") as string)?.trim();
  const isInternalOnly = formData.get("isInternalOnly") === "true";

  if (!projectId || !content) {
    return { error: "Comment text cannot be empty." };
  }

  // Client users cannot create internal-only notes
  if (isInternalOnly && profile.role === "client") {
    return { error: "Clients cannot create internal agency notes." };
  }

  const supabase = await createClient();

  // Verify project-level access
  const { data: hasAccess } = await supabase.rpc("can_access_project", {
    p_project_id: projectId,
  });

  if (!hasAccess) {
    return { error: "Access Denied: You do not have permission to comment on this project." };
  }

  const { error } = await supabase.from("comments").insert({
    project_id: projectId,
    deliverable_id: deliverableId,
    author_id: user.id,
    content,
    is_internal_only: isInternalOnly,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);

  return { success: true, message: "Comment posted." };
}

/**
 * Server Action: Fetches comprehensive deliverable details including attached files and comment history.
 * Verifies project-level access before returning data.
 */
export async function getDeliverableDetailsAction(
  deliverableId: string,
  projectId: string
): Promise<{ deliverable?: DeliverableDetailView; error?: string }> {
  const { user } = await getAuthProfile();
  if (!user) {
    return { error: "Authentication required." };
  }

  const supabase = await createClient();

  // Verify access
  const { data: hasAccess } = await supabase.rpc("can_access_project", {
    p_project_id: projectId,
  });

  if (!hasAccess) {
    return { error: "Access Denied: You do not have permission to view this deliverable." };
  }

  const detail = await getDeliverableDetails(deliverableId);
  if (!detail) {
    return { error: "Deliverable not found." };
  }

  return { deliverable: detail };
}
