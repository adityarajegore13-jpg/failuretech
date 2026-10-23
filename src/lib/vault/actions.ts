"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthProfile } from "@/lib/auth/server";
import { ProjectFileWithUploader } from "@/types";

export interface VaultActionResult {
  success?: boolean;
  error?: string;
  message?: string;
  signedUrl?: string;
  files?: ProjectFileWithUploader[];
}

const MAX_FILE_SIZE_BYTES = 52428800; // 50 MB

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "text/csv",
  "application/json",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "video/mp4",
  "application/octet-stream",
]);

/**
 * Server Action: Uploads an asset securely to the private Vault bucket with metadata cataloging.
 * Prevents cross-organization data leaks and enforces project-level authorization.
 */
export async function uploadVaultFileAction(
  _prevState: VaultActionResult | null,
  formData: FormData
): Promise<VaultActionResult> {
  const { user, profile } = await getAuthProfile();
  if (!user || !profile) {
    return { error: "Authentication required to upload assets." };
  }

  const projectId = (formData.get("projectId") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || "general";
  const description = (formData.get("description") as string)?.trim() || null;
  const deliverableId = (formData.get("deliverableId") as string)?.trim() || null;
  const isPublicToClient = formData.get("isPublicToClient") !== "false";
  const file = formData.get("file") as File | null;

  if (!projectId) {
    return { error: "Target project ID is required." };
  }

  if (!file || file.size === 0) {
    return { error: "Please select a valid file to upload." };
  }

  // 1. File Size Validation
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      error: `File size exceeds the 50MB security limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  // 2. MIME / Type validation
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    // Check file extension as fallback
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowedExts = ["png", "jpg", "jpeg", "webp", "svg", "pdf", "zip", "txt", "csv", "json", "docx", "xlsx", "pptx", "mp4"];
    if (!ext || !allowedExts.includes(ext)) {
      return { error: "Unsupported file type. Allowed: PDF, Images, Office Docs, Zip, Video (MP4)." };
    }
  }

  const supabase = await createClient();

  // 3. Verify Project-Level Authorization via RPC
  const { data: hasAccess } = await supabase.rpc("can_access_project", {
    p_project_id: projectId,
  });

  if (!hasAccess) {
    return { error: "Access Denied: You are not authorized to upload files to this project." };
  }

  // Clients cannot upload internal agency-only files
  const enforcedVisibility = profile.role === "client" ? true : isPublicToClient;

  // 4. Upload to Private Supabase Storage Bucket 'vault'
  const fileBytes = await file.arrayBuffer();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `${projectId}/${category}/${Date.now()}_${sanitizedFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("vault")
    .upload(storagePath, fileBytes, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (uploadError) {
    return { error: `Storage upload failed: ${uploadError.message}` };
  }

  // 5. Catalog File in public.files
  const { error: insertError } = await supabase.from("files").insert({
    project_id: projectId,
    deliverable_id: deliverableId,
    uploaded_by: user.id,
    file_name: file.name,
    file_path: storagePath,
    file_size_bytes: file.size,
    mime_type: file.type || null,
    category,
    description,
    is_public_to_client: enforcedVisibility,
  });

  if (insertError) {
    return { error: `Failed to record file in vault catalog: ${insertError.message}` };
  }

  // 6. Notify Project Stakeholders
  await supabase.rpc("notify_project_stakeholders", {
    p_project_id: projectId,
    p_sender_id: user.id,
    p_type: "project_update",
    p_title: `New Vault Asset: ${file.name}`,
    p_message: `${profile.full_name || "A stakeholder"} uploaded "${file.name}" to the project vault (${category}).`,
    p_link: `/projects/${projectId}`,
    p_target: enforcedVisibility ? "all" : "agency",
    p_metadata: { category, file_size: file.size },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");

  return {
    success: true,
    message: `Asset "${file.name}" securely vaulted with 256-bit storage encryption.`,
  };
}

/**
 * Server Action: Generates a temporary cryptographic signed URL for secure file download.
 * Validates project-level access and client visibility boundaries.
 */
export async function getVaultFileSignedUrlAction(
  fileId: string,
  projectId: string
): Promise<VaultActionResult> {
  const { user, profile } = await getAuthProfile();
  if (!user || !profile) {
    return { error: "Authentication required to access file vault." };
  }

  const supabase = await createClient();

  // 1. Verify project-level access
  const { data: hasAccess } = await supabase.rpc("can_access_project", {
    p_project_id: projectId,
  });

  if (!hasAccess) {
    return { error: "Access Denied: You are not authorized to download assets from this project." };
  }

  // 2. Fetch file catalog record
  const { data: file, error: fileError } = await supabase
    .from("files")
    .select("*")
    .eq("id", fileId)
    .eq("project_id", projectId)
    .single();

  if (fileError || !file) {
    return { error: "File not found or access denied." };
  }

  // 3. Client Isolation Boundary: prevent client access to internal-only files
  if (profile.role === "client" && !file.is_public_to_client) {
    return { error: "Access Denied: This asset is restricted to internal agency team members." };
  }

  // 4. Generate 1-hour signed URL (attempt 'vault' bucket, fallback to 'deliverables' if legacy)
  let { data: signedData, error: signError } = await supabase.storage
    .from("vault")
    .createSignedUrl(file.file_path, 3600);

  if (signError || !signedData?.signedUrl) {
    // Attempt fallback in case uploaded into deliverables bucket
    const fallback = await supabase.storage
      .from("deliverables")
      .createSignedUrl(file.file_path, 3600);
    signedData = fallback.data;
    signError = fallback.error;
  }

  if (signError || !signedData?.signedUrl) {
    return { error: signError?.message || "Failed to generate secure signed download link." };
  }

  return { success: true, signedUrl: signedData.signedUrl };
}

/**
 * Server Action: Deletes a vaulted file from storage and database catalog.
 * Authorized for file uploader or agency admin only.
 */
export async function deleteVaultFileAction(
  fileId: string,
  projectId: string
): Promise<VaultActionResult> {
  const { user, profile } = await getAuthProfile();
  if (!user || !profile) {
    return { error: "Authentication required." };
  }

  const supabase = await createClient();

  // 1. Verify project access
  const { data: hasAccess } = await supabase.rpc("can_access_project", {
    p_project_id: projectId,
  });

  if (!hasAccess) {
    return { error: "Access Denied." };
  }

  // 2. Fetch file details
  const { data: file } = await supabase
    .from("files")
    .select("*")
    .eq("id", fileId)
    .eq("project_id", projectId)
    .single();

  if (!file) {
    return { error: "File not found." };
  }

  // 3. Authorize delete
  if (file.uploaded_by !== user.id && profile.role !== "admin") {
    return { error: "Unauthorized: Only the file uploader or an agency admin can delete this asset." };
  }

  // 4. Delete from storage bucket
  await supabase.storage.from("vault").remove([file.file_path]);
  await supabase.storage.from("deliverables").remove([file.file_path]);

  // 5. Delete from database catalog
  const { error: deleteError } = await supabase
    .from("files")
    .delete()
    .eq("id", fileId)
    .eq("project_id", projectId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true, message: `File "${file.file_name}" removed from vault.` };
}

/**
 * Server Action: Fetches all files for a project with uploader profiles.
 * Respects RLS: clients will not receive internal-only assets.
 */
export async function getProjectFilesAction(
  projectId: string,
  category?: string
): Promise<VaultActionResult> {
  const { user } = await getAuthProfile();
  if (!user) {
    return { error: "Authentication required.", files: [] };
  }

  const supabase = await createClient();

  const { data: hasAccess } = await supabase.rpc("can_access_project", {
    p_project_id: projectId,
  });

  if (!hasAccess) {
    return { error: "Access Denied.", files: [] };
  }

  let query = supabase
    .from("files")
    .select(`
      *,
      uploader:profiles(id, full_name, email, avatar_url, role)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data: files, error } = await query;

  if (error) {
    return { error: error.message, files: [] };
  }

  return { success: true, files: (files as any) || [] };
}
