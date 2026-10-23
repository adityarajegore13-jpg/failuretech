import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserRole, Profile } from "@/types";

/**
 * Retrieves the currently authenticated Supabase user on the server.
 * Returns null if unauthenticated.
 */
export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Retrieves the authenticated user along with their database profile and role.
 */
export async function getAuthProfile(): Promise<{
  user: Awaited<ReturnType<typeof getAuthUser>>;
  profile: Profile | null;
}> {
  const user = await getAuthUser();
  if (!user) {
    return { user: null, profile: null };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile };
}

/**
 * Server guard: Enforces that a user is authenticated.
 * If not authenticated, redirects directly to /login with the return destination.
 */
export async function requireAuth(returnUrl: string = "/dashboard") {
  const user = await getAuthUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnUrl)}`);
  }
  return user;
}

/**
 * Server guard: Enforces that the user has one of the required roles.
 * Checked directly against public.profiles on the server, not from untrusted client state.
 */
export async function requireRole(
  allowedRoles: UserRole[],
  returnUrl: string = "/dashboard"
): Promise<{ user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>; profile: Profile }> {
  const { user, profile } = await getAuthProfile();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnUrl)}`);
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    // Redirect to dashboard with unauthorized notice or fallback
    redirect("/dashboard?error=unauthorized");
  }

  return { user, profile };
}

/**
 * Returns the default redirect destination based on user permission level.
 */
export function getRoleDefaultPath(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "team_member":
      return "/dashboard";
    case "client":
    default:
      return "/dashboard";
  }
}
