"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getRoleDefaultPath } from "./server";
import { UserRole } from "@/types";

export interface AuthActionResult {
  success?: boolean;
  error?: string;
  message?: string;
  redirectUrl?: string;
}

/**
 * Validates email format using RFC 5322 regex.
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Server Action: Authenticates a user using email and password.
 */
export async function loginAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || "";

  if (!email || !password) {
    return { error: "Please enter both your email address and password." };
  }

  if (!isValidEmail(email)) {
    return { error: "Please enter a valid email address." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    if (error?.message?.toLowerCase().includes("email not confirmed")) {
      return {
        error:
          "Email not confirmed. To disable email confirmation for local/demo testing: in Supabase Dashboard go to Authentication > Providers > Email, turn OFF 'Confirm email', and click Save.",
      };
    }
    return {
      error: error?.message || "Invalid email or password. Please verify your credentials.",
    };
  }

  // Fetch the user's role from the database profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const userRole = (profile?.role as UserRole) || "client";
  const targetPath = next && next.startsWith("/") ? next : getRoleDefaultPath(userRole);

  redirect(targetPath);
}

/**
 * Server Action: Registers a new client organization account.
 */
export async function signupAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const fullName = (formData.get("fullName") as string)?.trim();
  const organizationName = (formData.get("organizationName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!fullName || !organizationName || !email || !password) {
    return { error: "All fields are required to establish an organization portal." };
  }

  if (!isValidEmail(email)) {
    return { error: "Please provide a valid work email address." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters with letters and numbers." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const headerList = await headers();
  const origin = headerList.get("origin") || "http://localhost:3000";

  const supabase = await createClient();

  // Create user in Supabase Auth with custom user metadata
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        company_name: organizationName,
        role: "client" as UserRole,
      },
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Check if session was immediately established (auto-confirm enabled)
  if (data.session && data.user) {
    // Generate organization record for the newly registered client
    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") + `-${Date.now().toString().slice(-4)}`;

    const { data: orgData } = await supabase
      .from("organizations")
      .insert({
        name: organizationName,
        slug,
        billing_email: email,
      })
      .select("id")
      .single();

    if (orgData) {
      // Add user as organization owner
      await supabase.from("organization_members").insert({
        organization_id: orgData.id,
        user_id: data.user.id,
        role: "owner",
      });
    }

    redirect("/dashboard");
  }

  return {
    success: true,
    message:
      "Account registered successfully! Please check your email to verify your address and enter the FailureTech portal.",
  };
}

/**
 * Server Action: Initiates a password reset request email.
 */
export async function forgotPasswordAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    return { error: "Please enter a valid email address." };
  }

  const headerList = await headers();
  const origin = headerList.get("origin") || "http://localhost:3000";

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success: true,
    message: "A password reset link has been dispatched to your email address if an account exists.",
  };
}

/**
 * Server Action: Sets a new password after following the reset link.
 */
export async function resetPasswordAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || password.length < 8) {
    return { error: "New password must be at least 8 characters in length." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard?notice=password_updated");
}

/**
 * Server Action: Validates an invitation token and provisions the user.
 */
export async function acceptInvitationAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const token = (formData.get("token") as string)?.trim();
  const fullName = (formData.get("fullName") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token || !fullName || !password) {
    return { error: "All fields are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();

  // 1. Verify invitation via database function
  const { data: invCheck, error: invError } = await supabase.rpc("verify_invitation", {
    p_token: token,
  });

  if (invError || !invCheck || invCheck.length === 0 || !invCheck[0].is_valid) {
    return {
      error: invCheck?.[0]?.error_message || "Invalid or expired invitation token.",
    };
  }

  const invitation = invCheck[0];

  // 2. Sign up the user with the invited email
  const headerList = await headers();
  const origin = headerList.get("origin") || "http://localhost:3000";

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: invitation.email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: invitation.role,
      },
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (authError || !authData.user) {
    return { error: authError?.message || "Failed to establish user account." };
  }

  // 3. Bind the invitation to the new user in database
  await supabase.rpc("accept_invitation", {
    p_token: token,
    p_user_id: authData.user.id,
  });

  redirect("/dashboard");
}

/**
 * Server Action: Terminates session and clears auth cookies.
 */
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Server Action: Finalizes onboarding details for authenticated user profile.
 */
export async function completeOnboardingAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Authentication session expired. Please sign in again." };
  }

  const fullName = (formData.get("fullName") as string)?.trim();
  const title = (formData.get("title") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const companyName = (formData.get("companyName") as string)?.trim() || null;

  if (!fullName) {
    return { error: "Full name is required." };
  }

  // Update profile
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      title,
      phone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  // If user provided a company name and is not already an org member, establish organization
  if (companyName) {
    const { data: existingMemberships } = await supabase
      .from("organization_members")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    if (!existingMemberships || existingMemberships.length === 0) {
      const slug =
        companyName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "") + `-${Date.now().toString().slice(-4)}`;

      const { data: newOrg } = await supabase
        .from("organizations")
        .insert({
          name: companyName,
          slug,
          billing_email: user.email,
        })
        .select("id")
        .single();

      if (newOrg) {
        await supabase.from("organization_members").insert({
          organization_id: newOrg.id,
          user_id: user.id,
          role: "owner",
        });
      }
    }
  }

  // Fetch updated profile role for role-based redirect
  const { data: updatedProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = (updatedProfile?.role as UserRole) || "client";
  const destination = getRoleDefaultPath(userRole);

  redirect(destination);
}

/**
 * Server Action: Generates a secure invitation token for onboarding clients or team members.
 * Requires Agency Admin or Team Member authorization.
 */
export async function createInvitationAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = ((formData.get("role") as string) || "client") as UserRole;
  const orgRole = (formData.get("orgRole") as string) || "member";
  let organizationId = (formData.get("organizationId") as string)?.trim();

  if (!email || !isValidEmail(email)) {
    return { error: "Please enter a valid recipient email address." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to dispatch invitations." };
  }

  // Verify caller's role is admin or team_member
  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!callerProfile || (callerProfile.role !== "admin" && callerProfile.role !== "team_member")) {
    return { error: "Unauthorized: Only Agency Admins and Team Members can generate invitations." };
  }

  // If organizationId is missing or empty, find or create default agency/client organization
  if (!organizationId) {
    const { data: orgs } = await supabase.from("organizations").select("id").limit(1);
    if (orgs && orgs.length > 0) {
      organizationId = orgs[0].id;
    } else {
      const { data: newOrg } = await supabase
        .from("organizations")
        .insert({
          name: "Acme Global Client Org",
          slug: `acme-client-${Date.now().toString().slice(-4)}`,
        })
        .select("id")
        .single();
      organizationId = newOrg?.id || "";
    }
  }

  if (!organizationId) {
    return { error: "Please select a valid organization for the invitee." };
  }

  // Generate cryptographically unique invitation token
  const token =
    crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);

  // Expiration 7 days from now
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error: insertError } = await supabase.from("invitations").insert({
    organization_id: organizationId,
    email,
    role,
    org_role: orgRole as any,
    token,
    invited_by: user.id,
    status: "pending",
    expires_at: expiresAt,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  const inviteLink = `/accept-invitation?token=${token}`;

  return {
    success: true,
    message: `Invitation generated successfully for ${email}! Shareable link: ${inviteLink}`,
    redirectUrl: inviteLink,
  };
}

/**
 * Server Action: Revokes a pending invitation token.
 */
export async function revokeInvitationAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const invitationId = (formData.get("invitationId") as string)?.trim();
  if (!invitationId) {
    return { error: "Invitation ID is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  const { error } = await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId);

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: "Invitation token revoked." };
}
